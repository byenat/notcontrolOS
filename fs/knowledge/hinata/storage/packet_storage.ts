/**
 * HiNATA 数据包存储层实现
 * 
 * 这个文件实现了 HiNATA 数据包的存储、检索、索引和分析功能，
 * 作为 notcontrolOS 信息流处理的核心存储组件。
 */

import {
  HiNATADataPacket,
  HiNATAPacketMetadata,
  HiNATAPacketPayload,
  UUID,
  Timestamp,
  CaptureSource,
  UserAction,
  SearchQuery,
  SearchResult,
  BatchOperation,
  BatchResult
} from '../core/types';
import { validateHiNATAPacket } from '../core/validation';
import { calculatePacketSimilarity, extractTextFromPacket } from '../core/packet';

// ============================================================================
// 存储接口定义
// ============================================================================

/**
 * HiNATA 数据包存储接口
 */
export interface PacketStorage {
  // 基础 CRUD 操作
  store(packet: HiNATADataPacket): Promise<void>;
  getById(packetId: UUID): Promise<HiNATADataPacket | null>;
  getByIds(packetIds: UUID[]): Promise<HiNATADataPacket[]>;
  update(packetId: UUID, updates: Partial<HiNATADataPacket>): Promise<HiNATADataPacket>;
  delete(packetId: UUID): Promise<void>;
  
  // 查询操作
  getByUser(userId: UUID, limit?: number, offset?: number): Promise<HiNATADataPacket[]>;
  getBySource(source: CaptureSource, limit?: number, offset?: number): Promise<HiNATADataPacket[]>;
  getByTimeRange(startTime: Timestamp, endTime: Timestamp): Promise<HiNATADataPacket[]>;
  search(query: PacketSearchQuery): Promise<PacketSearchResult>;
  
  // 分析和统计
  getStatistics(userId?: UUID): Promise<PacketStatistics>;
  getAttentionTrend(userId: UUID, timeRange: TimeRange): Promise<AttentionTrendData[]>;
  getSimilarPackets(packetId: UUID, threshold?: number, limit?: number): Promise<SimilarPacket[]>;
  
  // 索引和优化
  rebuildIndex(): Promise<void>;
  optimizeStorage(): Promise<StorageOptimizationResult>;
  
  // 批量操作
  storeBatch(packets: HiNATADataPacket[]): Promise<BatchStoreResult>;
  deleteBatch(packetIds: UUID[]): Promise<BatchDeleteResult>;
}

/**
 * 数据包搜索查询
 */
export interface PacketSearchQuery extends SearchQuery {
  // 特定于数据包的过滤器
  sources?: CaptureSource[];
  userActions?: UserAction[];
  attentionScoreRange?: {
    min: number;
    max: number;
  };
  deviceTypes?: string[];
  hasAttachments?: boolean;
  contentTypes?: string[];
}

/**
 * 数据包搜索结果
 */
export interface PacketSearchResult {
  items: HiNATADataPacket[];
  total: number;
  hasMore: boolean;
  query: string;
  executionTime: number;
  aggregations?: {
    sourceDistribution: { source: CaptureSource; count: number }[];
    actionDistribution: { action: UserAction; count: number }[];
    attentionScoreStats: {
      min: number;
      max: number;
      avg: number;
      median: number;
    };
  };
}

/**
 * 数据包统计信息
 */
export interface PacketStatistics {
  totalPackets: number;
  totalUsers: number;
  averageAttentionScore: number;
  sourceDistribution: { source: CaptureSource; count: number; percentage: number }[];
  actionDistribution: { action: UserAction; count: number; percentage: number }[];
  deviceDistribution: { deviceType: string; count: number; percentage: number }[];
  dailyPacketCounts: { date: string; count: number }[];
  topTags: { tag: string; count: number }[];
  storageSize: {
    totalBytes: number;
    averagePacketSize: number;
    compressionRatio: number;
  };
}

/**
 * 注意力趋势数据
 */
export interface AttentionTrendData {
  timestamp: Timestamp;
  averageScore: number;
  packetCount: number;
  peakScore: number;
  sources: { source: CaptureSource; count: number }[];
}

/**
 * 相似数据包
 */
export interface SimilarPacket {
  packet: HiNATADataPacket;
  similarity: number;
  matchingFields: string[];
}

/**
 * 时间范围
 */
export interface TimeRange {
  start: Timestamp;
  end: Timestamp;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

/**
 * 批量存储结果
 */
export interface BatchStoreResult {
  success: boolean;
  stored: number;
  failed: number;
  errors: { packetId: UUID; error: string }[];
  duplicates: UUID[];
}

/**
 * 批量删除结果
 */
export interface BatchDeleteResult {
  success: boolean;
  deleted: number;
  notFound: number;
  errors: { packetId: UUID; error: string }[];
}

/**
 * 存储优化结果
 */
export interface StorageOptimizationResult {
  beforeSize: number;
  afterSize: number;
  spaceSaved: number;
  packetsOptimized: number;
  indexesRebuilt: number;
  duration: number;
}

// ============================================================================
// 内存存储实现（用于开发和测试）
// ============================================================================

/**
 * 内存数据包存储实现
 */
export class MemoryPacketStorage implements PacketStorage {
  private packets: Map<UUID, HiNATADataPacket> = new Map();
  private packetsByUser: Map<UUID, Set<UUID>> = new Map();
  private packetsBySource: Map<CaptureSource, Set<UUID>> = new Map();
  private packetsByTime: Map<string, Set<UUID>> = new Map(); // 按小时索引
  private textIndex: Map<string, Set<UUID>> = new Map(); // 简单文本索引
  private tagIndex: Map<string, Set<UUID>> = new Map(); // 标签索引

  /**
   * 存储数据包
   */
  async store(packet: HiNATADataPacket): Promise<void> {
    // 验证数据包
    const validation = validateHiNATAPacket(packet);
    if (!validation.isValid) {
      throw new Error(`Invalid HiNATA packet: ${validation.errors.join(', ')}`);
    }

    // 检查是否已存在
    if (this.packets.has(packet.metadata.packetId)) {
      throw new Error(`Packet already exists: ${packet.metadata.packetId}`);
    }

    // 存储数据包
    this.packets.set(packet.metadata.packetId, packet);

    // 更新索引
    this.updateIndexes(packet);
  }

  /**
   * 根据 ID 获取数据包
   */
  async getById(packetId: UUID): Promise<HiNATADataPacket | null> {
    return this.packets.get(packetId) || null;
  }

  /**
   * 根据 ID 列表获取数据包
   */
  async getByIds(packetIds: UUID[]): Promise<HiNATADataPacket[]> {
    const packets: HiNATADataPacket[] = [];
    for (const id of packetIds) {
      const packet = this.packets.get(id);
      if (packet) {
        packets.push(packet);
      }
    }
    return packets;
  }

  /**
   * 更新数据包
   */
  async update(packetId: UUID, updates: Partial<HiNATADataPacket>): Promise<HiNATADataPacket> {
    const existingPacket = this.packets.get(packetId);
    if (!existingPacket) {
      throw new Error(`Packet not found: ${packetId}`);
    }

    const updatedPacket: HiNATADataPacket = {
      ...existingPacket,
      ...updates,
      metadata: {
        ...existingPacket.metadata,
        ...updates.metadata
      },
      payload: {
        ...existingPacket.payload,
        ...updates.payload
      }
    };

    // 验证更新后的数据包
    const validation = validateHiNATAPacket(updatedPacket);
    if (!validation.isValid) {
      throw new Error(`Invalid packet update: ${validation.errors.join(', ')}`);
    }

    // 移除旧索引
    this.removeFromIndexes(existingPacket);

    // 更新存储
    this.packets.set(packetId, updatedPacket);

    // 更新索引
    this.updateIndexes(updatedPacket);

    return updatedPacket;
  }

  /**
   * 删除数据包
   */
  async delete(packetId: UUID): Promise<void> {
    const packet = this.packets.get(packetId);
    if (!packet) {
      throw new Error(`Packet not found: ${packetId}`);
    }

    // 移除索引
    this.removeFromIndexes(packet);

    // 删除数据包
    this.packets.delete(packetId);
  }

  /**
   * 根据用户获取数据包
   */
  async getByUser(userId: UUID, limit: number = 50, offset: number = 0): Promise<HiNATADataPacket[]> {
    const packetIds = this.packetsByUser.get(userId) || new Set();
    const packets: HiNATADataPacket[] = [];

    for (const packetId of packetIds) {
      const packet = this.packets.get(packetId);
      if (packet) {
        packets.push(packet);
      }
    }

    // 按时间戳倒序排列
    packets.sort((a, b) => 
      new Date(b.metadata.captureTimestamp).getTime() - 
      new Date(a.metadata.captureTimestamp).getTime()
    );

    return packets.slice(offset, offset + limit);
  }

  /**
   * 根据来源获取数据包
   */
  async getBySource(source: CaptureSource, limit: number = 50, offset: number = 0): Promise<HiNATADataPacket[]> {
    const packetIds = this.packetsBySource.get(source) || new Set();
    const packets: HiNATADataPacket[] = [];

    for (const packetId of packetIds) {
      const packet = this.packets.get(packetId);
      if (packet) {
        packets.push(packet);
      }
    }

    // 按时间戳倒序排列
    packets.sort((a, b) => 
      new Date(b.metadata.captureTimestamp).getTime() - 
      new Date(a.metadata.captureTimestamp).getTime()
    );

    return packets.slice(offset, offset + limit);
  }

  /**
   * 根据时间范围获取数据包
   */
  async getByTimeRange(startTime: Timestamp, endTime: Timestamp): Promise<HiNATADataPacket[]> {
    const packets: HiNATADataPacket[] = [];
    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();

    for (const packet of this.packets.values()) {
      const packetTime = new Date(packet.metadata.captureTimestamp).getTime();
      if (packetTime >= startTimestamp && packetTime <= endTimestamp) {
        packets.push(packet);
      }
    }

    // 按时间戳排序
    packets.sort((a, b) => 
      new Date(a.metadata.captureTimestamp).getTime() - 
      new Date(b.metadata.captureTimestamp).getTime()
    );

    return packets;
  }

  /**
   * 搜索数据包
   */
  async search(query: PacketSearchQuery): Promise<PacketSearchResult> {
    const startTime = Date.now();
    let packets = Array.from(this.packets.values());

    // 应用过滤器
    packets = this.applyPacketFilters(packets, query);

    // 应用文本搜索
    if (query.query.trim()) {
      packets = this.applyPacketTextSearch(packets, query.query);
    }

    // 应用排序
    if (query.sort) {
      packets = this.applyPacketSorting(packets, query.sort);
    }

    // 计算聚合数据
    const aggregations = this.calculateAggregations(packets);

    // 应用分页
    const total = packets.length;
    const page = query.pagination?.page || 1;
    const limit = query.pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const paginatedPackets = packets.slice(offset, offset + limit);

    return {
      items: paginatedPackets,
      total,
      hasMore: offset + limit < total,
      query: query.query,
      executionTime: Date.now() - startTime,
      aggregations
    };
  }

  /**
   * 获取统计信息
   */
  async getStatistics(userId?: UUID): Promise<PacketStatistics> {
    let packets = Array.from(this.packets.values());

    if (userId) {
      const userPacketIds = this.packetsByUser.get(userId) || new Set();
      packets = packets.filter(packet => userPacketIds.has(packet.metadata.packetId));
    }

    const totalPackets = packets.length;
    const uniqueUsers = new Set(packets.map(p => p.payload.userId)).size;
    const averageAttentionScore = packets.reduce((sum, p) => sum + p.metadata.attentionScoreRaw, 0) / totalPackets;

    // 来源分布
    const sourceCounts = new Map<CaptureSource, number>();
    packets.forEach(packet => {
      const source = packet.metadata.captureSource;
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });

    const sourceDistribution = Array.from(sourceCounts.entries()).map(([source, count]) => ({
      source,
      count,
      percentage: (count / totalPackets) * 100
    }));

    // 操作分布
    const actionCounts = new Map<UserAction, number>();
    packets.forEach(packet => {
      const action = packet.metadata.userAction;
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });

    const actionDistribution = Array.from(actionCounts.entries()).map(([action, count]) => ({
      action,
      count,
      percentage: (count / totalPackets) * 100
    }));

    // 设备分布
    const deviceCounts = new Map<string, number>();
    packets.forEach(packet => {
      const deviceType = packet.metadata.deviceContext.deviceType || 'unknown';
      deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
    });

    const deviceDistribution = Array.from(deviceCounts.entries()).map(([deviceType, count]) => ({
      deviceType,
      count,
      percentage: (count / totalPackets) * 100
    }));

    // 每日数据包计数
    const dailyPacketCounts = this.calculateDailyPacketCounts(packets);

    // 热门标签
    const topTags = this.calculateTopTags(packets);

    // 存储大小估算
    const totalBytes = packets.reduce((sum, packet) => {
      return sum + JSON.stringify(packet).length;
    }, 0);

    const storageSize = {
      totalBytes,
      averagePacketSize: totalPackets > 0 ? totalBytes / totalPackets : 0,
      compressionRatio: 0.7 // 估算压缩比
    };

    return {
      totalPackets,
      totalUsers: uniqueUsers,
      averageAttentionScore,
      sourceDistribution,
      actionDistribution,
      deviceDistribution,
      dailyPacketCounts,
      topTags,
      storageSize
    };
  }

  /**
   * 获取注意力趋势
   */
  async getAttentionTrend(userId: UUID, timeRange: TimeRange): Promise<AttentionTrendData[]> {
    const userPacketIds = this.packetsByUser.get(userId) || new Set();
    const packets = Array.from(this.packets.values())
      .filter(packet => userPacketIds.has(packet.metadata.packetId))
      .filter(packet => {
        const timestamp = new Date(packet.metadata.captureTimestamp).getTime();
        const start = new Date(timeRange.start).getTime();
        const end = new Date(timeRange.end).getTime();
        return timestamp >= start && timestamp <= end;
      });

    // 按时间粒度分组
    const groupedData = this.groupPacketsByTime(packets, timeRange.granularity);

    return Array.from(groupedData.entries()).map(([timeKey, groupPackets]) => {
      const scores = groupPackets.map(p => p.metadata.attentionScoreRaw);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const peakScore = Math.max(...scores);

      // 来源分布
      const sourceCounts = new Map<CaptureSource, number>();
      groupPackets.forEach(packet => {
        const source = packet.metadata.captureSource;
        sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
      });

      const sources = Array.from(sourceCounts.entries()).map(([source, count]) => ({
        source,
        count
      }));

      return {
        timestamp: timeKey,
        averageScore,
        packetCount: groupPackets.length,
        peakScore,
        sources
      };
    }).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * 获取相似数据包
   */
  async getSimilarPackets(
    packetId: UUID, 
    threshold: number = 0.7, 
    limit: number = 10
  ): Promise<SimilarPacket[]> {
    const targetPacket = this.packets.get(packetId);
    if (!targetPacket) {
      throw new Error(`Packet not found: ${packetId}`);
    }

    const similarPackets: SimilarPacket[] = [];

    for (const packet of this.packets.values()) {
      if (packet.metadata.packetId === packetId) {
        continue; // 跳过自己
      }

      const similarity = calculatePacketSimilarity(targetPacket, packet);
      if (similarity >= threshold) {
        const matchingFields = this.getMatchingFields(targetPacket, packet);
        similarPackets.push({
          packet,
          similarity,
          matchingFields
        });
      }
    }

    // 按相似度排序并限制数量
    return similarPackets
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * 重建索引
   */
  async rebuildIndex(): Promise<void> {
    // 清空所有索引
    this.packetsByUser.clear();
    this.packetsBySource.clear();
    this.packetsByTime.clear();
    this.textIndex.clear();
    this.tagIndex.clear();

    // 重建索引
    for (const packet of this.packets.values()) {
      this.updateIndexes(packet);
    }
  }

  /**
   * 优化存储
   */
  async optimizeStorage(): Promise<StorageOptimizationResult> {
    const startTime = Date.now();
    const beforeSize = this.calculateStorageSize();

    // 这里可以实现压缩、去重等优化逻辑
    // 目前只是重建索引
    await this.rebuildIndex();

    const afterSize = this.calculateStorageSize();
    const duration = Date.now() - startTime;

    return {
      beforeSize,
      afterSize,
      spaceSaved: beforeSize - afterSize,
      packetsOptimized: this.packets.size,
      indexesRebuilt: 5, // 重建的索引数量
      duration
    };
  }

  /**
   * 批量存储数据包
   */
  async storeBatch(packets: HiNATADataPacket[]): Promise<BatchStoreResult> {
    let stored = 0;
    let failed = 0;
    const errors: { packetId: UUID; error: string }[] = [];
    const duplicates: UUID[] = [];

    for (const packet of packets) {
      try {
        if (this.packets.has(packet.metadata.packetId)) {
        duplicates.push(packet.metadata.packetId);
          continue;
        }

        await this.store(packet);
        stored++;
      } catch (error) {
        failed++;
        errors.push({
          packetId: packet.metadata.packetId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: failed === 0,
      stored,
      failed,
      errors,
      duplicates
    };
  }

  /**
   * 批量删除数据包
   */
  async deleteBatch(packetIds: UUID[]): Promise<BatchDeleteResult> {
    let deleted = 0;
    let notFound = 0;
    const errors: { packetId: UUID; error: string }[] = [];

    for (const packetId of packetIds) {
      try {
        if (!this.packets.has(packetId)) {
          notFound++;
          continue;
        }

        await this.delete(packetId);
        deleted++;
      } catch (error) {
        errors.push({
          packetId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: errors.length === 0,
      deleted,
      notFound,
      errors
    };
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private updateIndexes(packet: HiNATADataPacket): void {
    const packetId = packet.metadata.packetId;
    const userId = packet.payload.userId;
    const source = packet.metadata.captureSource;
    const timeKey = this.getTimeKey(packet.metadata.captureTimestamp);

    // 用户索引
    if (!this.packetsByUser.has(userId)) {
      this.packetsByUser.set(userId, new Set());
    }
    this.packetsByUser.get(userId)!.add(packetId);

    // 来源索引
    if (!this.packetsBySource.has(source)) {
      this.packetsBySource.set(source, new Set());
    }
    this.packetsBySource.get(source)!.add(packetId);

    // 时间索引
    if (!this.packetsByTime.has(timeKey)) {
      this.packetsByTime.set(timeKey, new Set());
    }
    this.packetsByTime.get(timeKey)!.add(packetId);

    // 文本索引
    const text = extractTextFromPacket(packet);
    const words = text.toLowerCase().split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 2) { // 忽略太短的词
        if (!this.textIndex.has(word)) {
          this.textIndex.set(word, new Set());
        }
        this.textIndex.get(word)!.add(packetId);
      }
    });

    // 标签索引
    packet.payload.tag.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(packetId);
    });
  }

  private removeFromIndexes(packet: HiNATADataPacket): void {
    const packetId = packet.metadata.packetId;
    const userId = packet.payload.userId;
    const source = packet.metadata.captureSource;
    const timeKey = this.getTimeKey(packet.metadata.captureTimestamp);

    // 用户索引
    const userPackets = this.packetsByUser.get(userId);
    if (userPackets) {
      userPackets.delete(packetId);
      if (userPackets.size === 0) {
        this.packetsByUser.delete(userId);
      }
    }

    // 来源索引
    const sourcePackets = this.packetsBySource.get(source);
    if (sourcePackets) {
      sourcePackets.delete(packetId);
      if (sourcePackets.size === 0) {
        this.packetsBySource.delete(source);
      }
    }

    // 时间索引
    const timePackets = this.packetsByTime.get(timeKey);
    if (timePackets) {
      timePackets.delete(packetId);
      if (timePackets.size === 0) {
        this.packetsByTime.delete(timeKey);
      }
    }

    // 文本索引
    const text = extractTextFromPacket(packet);
    const words = text.toLowerCase().split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 2) {
        const wordPackets = this.textIndex.get(word);
        if (wordPackets) {
          wordPackets.delete(packetId);
          if (wordPackets.size === 0) {
            this.textIndex.delete(word);
          }
        }
      }
    });

    // 标签索引
    packet.payload.tag.forEach(tag => {
      const tagPackets = this.tagIndex.get(tag);
      if (tagPackets) {
        tagPackets.delete(packetId);
        if (tagPackets.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });
  }

  private getTimeKey(timestamp: Timestamp): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
  }

  private applyPacketFilters(packets: HiNATADataPacket[], query: PacketSearchQuery): HiNATADataPacket[] {
    return packets.filter(packet => {
      // 来源过滤
      if (query.sources && query.sources.length > 0) {
        if (!query.sources.includes(packet.metadata.captureSource)) {
          return false;
        }
      }

      // 用户操作过滤
      if (query.userActions && query.userActions.length > 0) {
        if (!query.userActions.includes(packet.metadata.userAction)) {
          return false;
        }
      }

      // 注意力分数范围过滤
      if (query.attentionScoreRange) {
        const score = packet.metadata.attentionScoreRaw;
        if (score < query.attentionScoreRange.min || score > query.attentionScoreRange.max) {
          return false;
        }
      }

      // 设备类型过滤
      if (query.deviceTypes && query.deviceTypes.length > 0) {
        if (!query.deviceTypes.includes(packet.metadata.deviceContext.deviceType || 'unknown')) {
          return false;
        }
      }

      // 附件过滤
      if (query.hasAttachments !== undefined) {
        const hasAttachments = packet.payload.attachments && packet.payload.attachments.length > 0;
        if (hasAttachments !== query.hasAttachments) {
          return false;
        }
      }

      // 内容类型过滤
      if (query.contentTypes && query.contentTypes.length > 0) {
        // 这里可以根据实际需求实现内容类型检测
        // 暂时跳过
      }

      return true;
    });
  }

  private applyPacketTextSearch(packets: HiNATADataPacket[], query: string): HiNATADataPacket[] {
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    return packets.filter(packet => {
      const searchableText = extractTextFromPacket(packet).toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  private applyPacketSorting(packets: HiNATADataPacket[], sort: any): HiNATADataPacket[] {
    return packets.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sort.field) {
        case 'captureTimestamp':
          aValue = new Date(a.metadata.captureTimestamp).getTime();
          bValue = new Date(b.metadata.captureTimestamp).getTime();
          break;
        case 'attention_score':
          aValue = a.metadata.attentionScoreRaw;
          bValue = b.metadata.attentionScoreRaw;
          break;
        case 'highlight':
          aValue = a.payload.highlight.toLowerCase();
          bValue = b.payload.highlight.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sort.direction === 'DESC') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }

  private calculateAggregations(packets: HiNATADataPacket[]) {
    // 来源分布
    const sourceCounts = new Map<CaptureSource, number>();
    packets.forEach(packet => {
      const source = packet.metadata.captureSource;
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });

    const sourceDistribution = Array.from(sourceCounts.entries()).map(([source, count]) => ({
      source,
      count
    }));

    // 操作分布
    const actionCounts = new Map<UserAction, number>();
    packets.forEach(packet => {
      const action = packet.metadata.userAction;
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });

    const actionDistribution = Array.from(actionCounts.entries()).map(([action, count]) => ({
      action,
      count
    }));

    // 注意力分数统计
    const scores = packets.map(p => p.metadata.attentionScoreRaw);
    const sortedScores = [...scores].sort((a, b) => a - b);
    const attentionScoreStats = {
      min: Math.min(...scores),
      max: Math.max(...scores),
      avg: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      median: sortedScores[Math.floor(sortedScores.length / 2)]
    };

    return {
      sourceDistribution,
      actionDistribution,
      attentionScoreStats
    };
  }

  private calculateDailyPacketCounts(packets: HiNATADataPacket[]): { date: string; count: number }[] {
    const dailyCounts = new Map<string, number>();
    
    packets.forEach(packet => {
      const date = packet.metadata.captureTimestamp.split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });
    
    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateTopTags(packets: HiNATADataPacket[]): { tag: string; count: number }[] {
    const tagCounts = new Map<string, number>();
    
    packets.forEach(packet => {
      packet.payload.tag.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  private groupPacketsByTime(
    packets: HiNATADataPacket[], 
    granularity: 'hour' | 'day' | 'week' | 'month'
  ): Map<string, HiNATADataPacket[]> {
    const grouped = new Map<string, HiNATADataPacket[]>();
    
    packets.forEach(packet => {
      const date = new Date(packet.metadata.captureTimestamp);
      let key: string;
      
      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(packet);
    });
    
    return grouped;
  }

  private getMatchingFields(packet1: HiNATADataPacket, packet2: HiNATADataPacket): string[] {
    const matchingFields: string[] = [];
    
    // 检查各个字段的匹配情况
    if (packet1.payload.highlight === packet2.payload.highlight) {
      matchingFields.push('highlight');
    }
    
    if (packet1.metadata.captureSource === packet2.metadata.captureSource) {
      matchingFields.push('captureSource');
    }
    
    if (packet1.metadata.userAction === packet2.metadata.userAction) {
      matchingFields.push('userAction');
    }
    
    // 检查标签重叠
    const commonTags = packet1.payload.tag.filter(tag => packet2.payload.tag.includes(tag));
    if (commonTags.length > 0) {
      matchingFields.push('tags');
    }
    
    return matchingFields;
  }

  private calculateStorageSize(): number {
    let totalSize = 0;
    for (const packet of this.packets.values()) {
      totalSize += JSON.stringify(packet).length;
    }
    return totalSize;
  }
}

// ============================================================================
// 导出默认实例
// ============================================================================

/**
 * 默认的数据包存储实例
 */
export const packetStorage = new MemoryPacketStorage();
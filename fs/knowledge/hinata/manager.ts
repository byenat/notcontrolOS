/**
 * HiNATA 核心管理器
 * 
 * 这个文件实现了 HiNATA 系统的核心管理功能，
 * 整合数据包处理、知识块管理、存储操作等所有组件，
 * 作为 notcontrolOS 知识管理系统的统一入口。
 */

import {
  HiNATADataPacket,
  HiNATAPacketMetadata,
  HiNATAPacketPayload,
  KnowledgeBlock,
  NoteItem,
  Tag,
  User,
  LibraryItem,
  UUID,
  Timestamp,
  CaptureSource,
  UserAction,
  AccessLevel,
  SearchQuery,
  SearchResult,
  BatchOperation,
  BatchResult
} from './core/types';

import { HiNATAPacketBuilder } from './core/packet';
import { 
  validateHiNATAPacket, 
  validateKnowledgeBlock, 
  validateUser,
  validateLibraryItem,
  validateTag
} from './core/validation';

import { 
  KnowledgeBlockStorage, 
  MemoryKnowledgeBlockStorage,
  KnowledgeBlockStatistics,
  TagUsage
} from './storage/knowledge_block';

import { 
  PacketStorage, 
  MemoryPacketStorage,
  PacketSearchQuery,
  PacketSearchResult,
  PacketStatistics,
  AttentionTrendData,
  SimilarPacket,
  TimeRange
} from './storage/packet_storage';

// ============================================================================
// 管理器接口定义
// ============================================================================

/**
 * HiNATA 系统配置
 */
export interface HiNATAConfig {
  // 存储配置
  storage: {
    type: 'memory' | 'file' | 'database';
    path?: string;
    connectionString?: string;
    options?: Record<string, any>;
  };
  
  // 处理配置
  processing: {
    enableAutoTagging: boolean;
    enableSimilarityDetection: boolean;
    attentionScoreThreshold: number;
    maxPacketsPerUser: number;
    cleanupInterval: number; // 毫秒
  };
  
  // 安全配置
  security: {
    enableEncryption: boolean;
    encryptionKey?: string;
    enableAccessControl: boolean;
    defaultAccessLevel: AccessLevel;
  };
  
  // 性能配置
  performance: {
    enableCaching: boolean;
    cacheSize: number;
    enableIndexing: boolean;
    batchSize: number;
  };
}

/**
 * HiNATA 系统状态
 */
export interface HiNATASystemStatus {
  isInitialized: boolean;
  isRunning: boolean;
  version: string;
  uptime: number;
  lastError?: string;
  statistics: {
    totalPackets: number;
    totalKnowledgeBlocks: number;
    totalUsers: number;
    storageSize: number;
    processingQueue: number;
  };
  performance: {
    averageProcessingTime: number;
    packetsPerSecond: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
}

/**
 * 数据包处理结果
 */
export interface PacketProcessingResult {
  success: boolean;
  packetId: UUID;
  knowledgeBlockId?: UUID;
  suggestedTags: string[];
  similarPackets: SimilarPacket[];
  attentionScore: number;
  processingTime: number;
  errors?: string[];
}

/**
 * 知识发现结果
 */
export interface KnowledgeDiscoveryResult {
  insights: {
    type: 'pattern' | 'trend' | 'anomaly' | 'connection';
    description: string;
    confidence: number;
    relatedPackets: UUID[];
    relatedBlocks: UUID[];
  }[];
  recommendations: {
    type: 'tag' | 'connection' | 'action';
    description: string;
    priority: number;
    data: any;
  }[];
  statistics: {
    analysisTime: number;
    dataPointsAnalyzed: number;
    patternsFound: number;
  };
}

// ============================================================================
// HiNATA 核心管理器实现
// ============================================================================

/**
 * HiNATA 核心管理器
 */
export class HiNATAManager {
  private config: HiNATAConfig;
  private packetStorage: PacketStorage;
  private knowledgeBlockStorage: KnowledgeBlockStorage;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private processingQueue: HiNATADataPacket[] = [];
  private processingStats = {
    totalProcessed: 0,
    totalProcessingTime: 0,
    errors: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<HiNATAConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.packetStorage = this.createPacketStorage();
    this.knowledgeBlockStorage = this.createKnowledgeBlockStorage();
  }

  // ============================================================================
  // 系统生命周期管理
  // ============================================================================

  /**
   * 初始化 HiNATA 系统
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('HiNATA system is already initialized');
    }

    try {
      // 初始化存储层
      await this.initializeStorage();
      
      // 启动清理任务
      if (this.config.processing.cleanupInterval > 0) {
        this.startCleanupTask();
      }
      
      this.isInitialized = true;
      this.startTime = Date.now();
      
      console.log('HiNATA system initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize HiNATA system: ${error}`);
    }
  }

  /**
   * 启动 HiNATA 系统
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('HiNATA system must be initialized before starting');
    }

    if (this.isRunning) {
      throw new Error('HiNATA system is already running');
    }

    this.isRunning = true;
    console.log('HiNATA system started');
  }

  /**
   * 停止 HiNATA 系统
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // 停止清理任务
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // 处理剩余的队列
    await this.processQueue();

    this.isRunning = false;
    console.log('HiNATA system stopped');
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): HiNATASystemStatus {
    const uptime = this.startTime > 0 ? Date.now() - this.startTime : 0;
    const averageProcessingTime = this.processingStats.totalProcessed > 0 
      ? this.processingStats.totalProcessingTime / this.processingStats.totalProcessed 
      : 0;

    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      version: '1.0.0',
      uptime,
      statistics: {
        totalPackets: 0, // 需要从存储层获取
        totalKnowledgeBlocks: 0, // 需要从存储层获取
        totalUsers: 0, // 需要从存储层获取
        storageSize: 0, // 需要从存储层获取
        processingQueue: this.processingQueue.length
      },
      performance: {
        averageProcessingTime,
        packetsPerSecond: uptime > 0 ? (this.processingStats.totalProcessed / (uptime / 1000)) : 0,
        memoryUsage: process.memoryUsage().heapUsed,
        cacheHitRate: 0.85 // 模拟值
      }
    };
  }

  // ============================================================================
  // 数据包处理
  // ============================================================================

  /**
   * 处理 HiNATA 数据包
   */
  async processPacket(packet: HiNATADataPacket): Promise<PacketProcessingResult> {
    const startTime = Date.now();
    
    try {
      // 验证数据包
      const validation = validateHiNATAPacket(packet);
      if (!validation.isValid) {
        throw new Error(`Invalid packet: ${validation.errors.join(', ')}`);
      }

      // 存储数据包
      await this.packetStorage.store(packet);

      // 自动标签生成
      const suggestedTags = this.config.processing.enableAutoTagging 
        ? await this.generateAutoTags(packet) 
        : [];

      // 相似性检测
      const similarPackets = this.config.processing.enableSimilarityDetection 
        ? await this.packetStorage.getSimilarPackets(packet.metadata.packetId, 0.7, 5)
        : [];

      // 创建或更新知识块
      const knowledgeBlockId = await this.createOrUpdateKnowledgeBlock(packet);

      const processingTime = Date.now() - startTime;
      
      // 更新统计信息
      this.processingStats.totalProcessed++;
      this.processingStats.totalProcessingTime += processingTime;

      return {
        success: true,
        packetId: packet.metadata.packetId,
        knowledgeBlockId,
        suggestedTags,
        similarPackets,
        attentionScore: packet.metadata.attentionScoreRaw,
        processingTime
      };
    } catch (error) {
      this.processingStats.errors++;
      
      return {
        success: false,
        packetId: packet.metadata.packetId,
        suggestedTags: [],
        similarPackets: [],
        attentionScore: 0,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * 批量处理数据包
   */
  async processPacketBatch(packets: HiNATADataPacket[]): Promise<PacketProcessingResult[]> {
    const results: PacketProcessingResult[] = [];
    
    // 分批处理以避免内存压力
    const batchSize = this.config.performance.batchSize;
    for (let i = 0; i < packets.length; i += batchSize) {
      const batch = packets.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(packet => this.processPacket(packet))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 添加数据包到处理队列
   */
  async queuePacket(packet: HiNATADataPacket): Promise<void> {
    this.processingQueue.push(packet);
    
    // 如果队列达到批处理大小，立即处理
    if (this.processingQueue.length >= this.config.performance.batchSize) {
      await this.processQueue();
    }
  }

  /**
   * 处理队列中的数据包
   */
  async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0) {
      return;
    }
    
    const packetsToProcess = [...this.processingQueue];
    this.processingQueue = [];
    
    await this.processPacketBatch(packetsToProcess);
  }

  // ============================================================================
  // 知识块管理
  // ============================================================================

  /**
   * 创建知识块
   */
  async createKnowledgeBlock(
    blockData: Omit<KnowledgeBlock, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<KnowledgeBlock> {
    return await this.knowledgeBlockStorage.create(blockData);
  }

  /**
   * 获取知识块
   */
  async getKnowledgeBlock(blockId: UUID): Promise<KnowledgeBlock | null> {
    return await this.knowledgeBlockStorage.getById(blockId);
  }

  /**
   * 更新知识块
   */
  async updateKnowledgeBlock(blockId: UUID, updates: Partial<KnowledgeBlock>): Promise<KnowledgeBlock> {
    return await this.knowledgeBlockStorage.update(blockId, updates);
  }

  /**
   * 删除知识块
   */
  async deleteKnowledgeBlock(blockId: UUID): Promise<void> {
    await this.knowledgeBlockStorage.delete(blockId);
  }

  /**
   * 搜索知识块
   */
  async searchKnowledgeBlocks(query: SearchQuery): Promise<SearchResult> {
    return await this.knowledgeBlockStorage.search(query);
  }

  /**
   * 获取用户的知识块
   */
  async getUserKnowledgeBlocks(userId: UUID, limit?: number, offset?: number): Promise<KnowledgeBlock[]> {
    return await this.knowledgeBlockStorage.getByUserId(userId, limit, offset);
  }

  // ============================================================================
  // 数据包查询
  // ============================================================================

  /**
   * 获取数据包
   */
  async getPacket(packetId: UUID): Promise<HiNATADataPacket | null> {
    return await this.packetStorage.getById(packetId);
  }

  /**
   * 搜索数据包
   */
  async searchPackets(query: PacketSearchQuery): Promise<PacketSearchResult> {
    return await this.packetStorage.search(query);
  }

  /**
   * 获取用户的数据包
   */
  async getUserPackets(userId: UUID, limit?: number, offset?: number): Promise<HiNATADataPacket[]> {
    return await this.packetStorage.getByUser(userId, limit, offset);
  }

  /**
   * 获取相似数据包
   */
  async getSimilarPackets(packetId: UUID, threshold?: number, limit?: number): Promise<SimilarPacket[]> {
    return await this.packetStorage.getSimilarPackets(packetId, threshold, limit);
  }

  // ============================================================================
  // 统计和分析
  // ============================================================================

  /**
   * 获取数据包统计信息
   */
  async getPacketStatistics(userId?: UUID): Promise<PacketStatistics> {
    return await this.packetStorage.getStatistics(userId);
  }

  /**
   * 获取知识块统计信息
   */
  async getKnowledgeBlockStatistics(userId?: UUID): Promise<KnowledgeBlockStatistics> {
    return await this.knowledgeBlockStorage.getStatistics(userId);
  }

  /**
   * 获取注意力趋势
   */
  async getAttentionTrend(userId: UUID, timeRange: TimeRange): Promise<AttentionTrendData[]> {
    return await this.packetStorage.getAttentionTrend(userId, timeRange);
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(userId?: UUID, limit?: number): Promise<TagUsage[]> {
    return await this.knowledgeBlockStorage.getPopularTags(userId, limit);
  }

  /**
   * 知识发现分析
   */
  async discoverKnowledge(userId: UUID): Promise<KnowledgeDiscoveryResult> {
    const startTime = Date.now();
    
    // 获取用户数据
    const packets = await this.getUserPackets(userId, 1000);
    const blocks = await this.getUserKnowledgeBlocks(userId, 1000);
    
    const insights: KnowledgeDiscoveryResult['insights'] = [];
    const recommendations: KnowledgeDiscoveryResult['recommendations'] = [];
    
    // 模式识别
    const patterns = this.analyzePatterns(packets, blocks);
    insights.push(...patterns);
    
    // 趋势分析
    const trends = this.analyzeTrends(packets);
    insights.push(...trends);
    
    // 异常检测
    const anomalies = this.detectAnomalies(packets);
    insights.push(...anomalies);
    
    // 连接发现
    const connections = this.discoverConnections(blocks);
    insights.push(...connections);
    
    // 生成推荐
    recommendations.push(...this.generateRecommendations(insights, packets, blocks));
    
    const analysisTime = Date.now() - startTime;
    
    return {
      insights,
      recommendations,
      statistics: {
        analysisTime,
        dataPointsAnalyzed: packets.length + blocks.length,
        patternsFound: insights.length
      }
    };
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  /**
   * 创建数据包构建器
   */
  createPacketBuilder(): HiNATAPacketBuilder {
    return new HiNATAPacketBuilder();
  }

  /**
   * 创建数据包模板
   */
  createPacketTemplate(type: 'web_clipper' | 'manual_input' | 'screenshot_ocr'): HiNATADataPacket {
    // TODO: 实现数据包模板创建
    throw new Error('createPacketTemplate not implemented');
  }

  /**
   * 验证数据包
   */
  validatePacket(packet: HiNATADataPacket) {
    return validateHiNATAPacket(packet);
  }

  /**
   * 验证知识块
   */
  validateKnowledgeBlock(block: KnowledgeBlock) {
    return validateKnowledgeBlock(block);
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  private mergeConfig(userConfig: Partial<HiNATAConfig>): HiNATAConfig {
    const defaultConfig: HiNATAConfig = {
      storage: {
        type: 'memory'
      },
      processing: {
        enableAutoTagging: true,
        enableSimilarityDetection: true,
        attentionScoreThreshold: 0.5,
        maxPacketsPerUser: 10000,
        cleanupInterval: 3600000 // 1 hour
      },
      security: {
        enableEncryption: false,
        enableAccessControl: true,
        defaultAccessLevel: AccessLevel.PRIVATE
      },
      performance: {
        enableCaching: true,
        cacheSize: 1000,
        enableIndexing: true,
        batchSize: 100
      }
    };

    return {
      storage: { ...defaultConfig.storage, ...userConfig.storage },
      processing: { ...defaultConfig.processing, ...userConfig.processing },
      security: { ...defaultConfig.security, ...userConfig.security },
      performance: { ...defaultConfig.performance, ...userConfig.performance }
    };
  }

  private createPacketStorage(): PacketStorage {
    switch (this.config.storage.type) {
      case 'memory':
        return new MemoryPacketStorage();
      case 'file':
      case 'database':
        // 这里可以实现文件或数据库存储
        throw new Error(`Storage type '${this.config.storage.type}' not implemented yet`);
      default:
        throw new Error(`Unknown storage type: ${this.config.storage.type}`);
    }
  }

  private createKnowledgeBlockStorage(): KnowledgeBlockStorage {
    switch (this.config.storage.type) {
      case 'memory':
        return new MemoryKnowledgeBlockStorage();
      case 'file':
      case 'database':
        // 这里可以实现文件或数据库存储
        throw new Error(`Storage type '${this.config.storage.type}' not implemented yet`);
      default:
        throw new Error(`Unknown storage type: ${this.config.storage.type}`);
    }
  }

  private async initializeStorage(): Promise<void> {
    // 这里可以实现存储层的初始化逻辑
    // 例如创建数据库表、索引等
  }

  private startCleanupTask(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    }, this.config.processing.cleanupInterval);
  }

  private async performCleanup(): Promise<void> {
    // 这里可以实现清理逻辑
    // 例如删除过期数据、优化索引等
    console.log('Performing system cleanup...');
  }

  private async generateAutoTags(packet: HiNATADataPacket): Promise<string[]> {
    // 简单的自动标签生成逻辑
    const tags: string[] = [];
    
    // 基于来源的标签
    tags.push(`source:${packet.metadata.captureSource}`);
    
    // 基于用户操作的标签
    tags.push(`action:${packet.metadata.userAction}`);
    
    // 基于注意力分数的标签
    if (packet.metadata.attentionScoreRaw > 0.8) {
      tags.push('high-attention');
    } else if (packet.metadata.attentionScoreRaw > 0.5) {
      tags.push('medium-attention');
    } else {
      tags.push('low-attention');
    }
    
    // 基于内容的简单关键词提取
    const text = `${packet.payload.highlight} ${packet.payload.note}`.toLowerCase();
    const keywords = ['important', 'urgent', 'todo', 'idea', 'question', 'research'];
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return tags;
  }

  private async createOrUpdateKnowledgeBlock(packet: HiNATADataPacket): Promise<UUID> {
    // 简化的知识块创建逻辑
    // 实际实现中可能需要更复杂的逻辑来决定是否创建新块或更新现有块
    
    const blockData = {
      userId: packet.payload.userId,
      libraryItemId: this.generateUUID(), // 这里应该从实际的信息物料中获取
      highlight: packet.payload.highlight,
      note: packet.payload.note,
      at: packet.payload.at,
      tag: packet.payload.tag,
      access: packet.payload.access,
      noteItems: [],
      references: [],
      backlinks: []
    };
    
    const block = await this.knowledgeBlockStorage.create(blockData);
    return block.id;
  }

  private analyzePatterns(
    packets: HiNATADataPacket[], 
    blocks: KnowledgeBlock[]
  ): KnowledgeDiscoveryResult['insights'] {
    const insights: KnowledgeDiscoveryResult['insights'] = [];
    
    // 时间模式分析
    const hourCounts = new Map<number, number>();
    packets.forEach(packet => {
      const hour = new Date(packet.metadata.captureTimestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    const peakHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (peakHour && peakHour[1] > packets.length * 0.2) {
      insights.push({
        type: 'pattern',
        description: `Most active during hour ${peakHour[0]}:00 with ${peakHour[1]} activities`,
        confidence: 0.8,
        relatedPackets: packets
          .filter(p => new Date(p.metadata.captureTimestamp).getHours() === peakHour[0])
        .map(p => p.metadata.packetId),
        relatedBlocks: []
      });
    }
    
    return insights;
  }

  private analyzeTrends(packets: HiNATADataPacket[]): KnowledgeDiscoveryResult['insights'] {
    const insights: KnowledgeDiscoveryResult['insights'] = [];
    
    // 注意力分数趋势
    const recentPackets = packets
      .sort((a, b) => new Date(b.metadata.captureTimestamp).getTime() - new Date(a.metadata.captureTimestamp).getTime())
      .slice(0, 50);
    
    if (recentPackets.length >= 10) {
      const recentAvg = recentPackets.slice(0, 10).reduce((sum, p) => sum + p.metadata.attentionScoreRaw, 0) / 10;
      const olderAvg = recentPackets.slice(-10).reduce((sum, p) => sum + p.metadata.attentionScoreRaw, 0) / 10;
      
      if (recentAvg > olderAvg * 1.2) {
        insights.push({
          type: 'trend',
          description: 'Attention scores are increasing over time',
          confidence: 0.7,
          relatedPackets: recentPackets.slice(0, 10).map(p => p.metadata.packetId),
          relatedBlocks: []
        });
      }
    }
    
    return insights;
  }

  private detectAnomalies(packets: HiNATADataPacket[]): KnowledgeDiscoveryResult['insights'] {
    const insights: KnowledgeDiscoveryResult['insights'] = [];
    
    // 异常高的注意力分数
    const avgScore = packets.reduce((sum, p) => sum + p.metadata.attentionScoreRaw, 0) / packets.length;
      const anomalousPackets = packets.filter(p => p.metadata.attentionScoreRaw > avgScore * 2);
    
    if (anomalousPackets.length > 0) {
      insights.push({
        type: 'anomaly',
        description: `Found ${anomalousPackets.length} packets with unusually high attention scores`,
        confidence: 0.9,
        relatedPackets: anomalousPackets.map(p => p.metadata.packetId),
        relatedBlocks: []
      });
    }
    
    return insights;
  }

  private discoverConnections(blocks: KnowledgeBlock[]): KnowledgeDiscoveryResult['insights'] {
    const insights: KnowledgeDiscoveryResult['insights'] = [];
    
    // 标签共现分析
    const tagPairs = new Map<string, number>();
    blocks.forEach(block => {
      for (let i = 0; i < block.tag.length; i++) {
        for (let j = i + 1; j < block.tag.length; j++) {
          const pair = [block.tag[i], block.tag[j]].sort().join('|');
          tagPairs.set(pair, (tagPairs.get(pair) || 0) + 1);
        }
      }
    });
    
    const strongConnections = Array.from(tagPairs.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    strongConnections.forEach(([pair, count]) => {
      const [tag1, tag2] = pair.split('|');
      const relatedBlocks = blocks
        .filter(block => block.tag.includes(tag1) && block.tag.includes(tag2))
        .map(block => block.id);
      
      insights.push({
        type: 'connection',
        description: `Strong connection between tags "${tag1}" and "${tag2}" (${count} occurrences)`,
        confidence: Math.min(0.9, count / 10),
        relatedPackets: [],
        relatedBlocks
      });
    });
    
    return insights;
  }

  private generateRecommendations(
    insights: KnowledgeDiscoveryResult['insights'],
    packets: HiNATADataPacket[],
    blocks: KnowledgeBlock[]
  ): KnowledgeDiscoveryResult['recommendations'] {
    const recommendations: KnowledgeDiscoveryResult['recommendations'] = [];
    
    // 基于洞察生成推荐
    insights.forEach(insight => {
      switch (insight.type) {
        case 'pattern':
          recommendations.push({
            type: 'action',
            description: 'Consider scheduling important tasks during your peak activity hours',
            priority: 8,
            data: { insight }
          });
          break;
        case 'connection':
          recommendations.push({
            type: 'tag',
            description: 'Consider creating a combined tag for frequently co-occurring concepts',
            priority: 6,
            data: { insight }
          });
          break;
        case 'anomaly':
          recommendations.push({
            type: 'action',
            description: 'Review high-attention items for potential follow-up actions',
            priority: 9,
            data: { insight }
          });
          break;
      }
    });
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private generateUUID(): UUID {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// ============================================================================
// 导出默认实例
// ============================================================================

/**
 * 默认的 HiNATA 管理器实例
 */
export const hinataManager = new HiNATAManager();

/**
 * 创建 HiNATA 管理器实例
 */
export function createHiNATAManager(config?: Partial<HiNATAConfig>): HiNATAManager {
  return new HiNATAManager(config);
}
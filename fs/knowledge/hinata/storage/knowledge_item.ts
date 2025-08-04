/**
 * Knowledge Item Storage - HiNATA 信息物料存储层
 * 
 * 负责管理单个知识物料的存储、检索和生命周期管理
 * 支持多种内容类型和元数据管理
 */

import { EventEmitter } from 'events';
import {
  HiNATAKnowledgeItem,
  HiNATAMetadata,
  ContentType,
  AccessLevel,
  KnowledgeItemId,
  ValidationResult
} from '../core/types';
import { validateKnowledgeItem } from '../core/validation';

/**
 * 知识物料存储配置
 */
export interface KnowledgeItemStorageConfig {
  /** 存储根目录 */
  storageRoot: string;
  /** 最大缓存大小 */
  maxCacheSize: number;
  /** 自动保存间隔(ms) */
  autoSaveInterval: number;
  /** 启用版本控制 */
  enableVersioning: boolean;
  /** 压缩存储 */
  enableCompression: boolean;
}

/**
 * 存储统计信息
 */
export interface StorageStats {
  totalItems: number;
  totalSize: number;
  cacheHitRate: number;
  lastCleanup: Date;
  storageHealth: 'healthy' | 'warning' | 'critical';
}

/**
 * 查询选项
 */
export interface QueryOptions {
  /** 内容类型过滤 */
  contentTypes?: ContentType[];
  /** 访问级别过滤 */
  accessLevels?: AccessLevel[];
  /** 标签过滤 */
  tags?: string[];
  /** 时间范围 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 排序方式 */
  sortBy?: 'created' | 'modified' | 'accessed' | 'relevance';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 分页 */
  pagination?: {
    offset: number;
    limit: number;
  };
}

/**
 * 知识物料存储管理器
 */
export class KnowledgeItemStorage extends EventEmitter {
  private config: KnowledgeItemStorageConfig;
  private cache: Map<KnowledgeItemId, HiNATAKnowledgeItem>;
  private metadata: Map<KnowledgeItemId, HiNATAMetadata>;
  private accessLog: Map<KnowledgeItemId, Date>;
  private saveQueue: Set<KnowledgeItemId>;
  private autoSaveTimer?: NodeJS.Timeout;

  constructor(config: KnowledgeItemStorageConfig) {
    super();
    this.config = config;
    this.cache = new Map();
    this.metadata = new Map();
    this.accessLog = new Map();
    this.saveQueue = new Set();
    
    this.initializeStorage();
    this.startAutoSave();
  }

  /**
   * 初始化存储系统
   */
  private async initializeStorage(): Promise<void> {
    try {
      // 创建存储目录结构
      await this.createStorageDirectories();
      
      // 加载现有元数据
      await this.loadMetadataIndex();
      
      // 验证存储完整性
      await this.validateStorageIntegrity();
      
      this.emit('storage:initialized');
    } catch (error) {
      this.emit('storage:error', error);
      throw error;
    }
  }

  /**
   * 创建存储目录结构
   */
  private async createStorageDirectories(): Promise<void> {
    const directories = [
      'items',
      'metadata',
      'versions',
      'cache',
      'temp'
    ];

    // 实际实现中会使用文件系统操作
    // 这里只是示例结构
  }

  /**
   * 存储知识物料
   */
  async store(item: HiNATAKnowledgeItem): Promise<KnowledgeItemId> {
    // 验证数据
    const validation = validateKnowledgeItem(item);
    if (!validation.isValid) {
      throw new Error(`Invalid knowledge item: ${validation.errors.join(', ')}`);
    }

    const itemId = item.id || this.generateItemId();
    const now = new Date();

    // 更新元数据
    const metadata: HiNATAMetadata = {
      ...item.metadata,
      id: itemId,
      created: item.metadata.created || now,
      modified: now,
      accessed: now,
      version: (item.metadata.version || 0) + 1
    };

    const itemWithId = {
      ...item,
      id: itemId,
      metadata
    };

    // 缓存更新
    this.cache.set(itemId, itemWithId);
    this.metadata.set(itemId, metadata);
    this.accessLog.set(itemId, now);

    // 标记为需要保存
    this.saveQueue.add(itemId);

    // 触发事件
    this.emit('item:stored', itemId, itemWithId);

    return itemId;
  }

  /**
   * 检索知识物料
   */
  async retrieve(itemId: KnowledgeItemId): Promise<HiNATAKnowledgeItem | null> {
    // 更新访问日志
    this.accessLog.set(itemId, new Date());

    // 先从缓存查找
    if (this.cache.has(itemId)) {
      const item = this.cache.get(itemId)!;
      this.emit('item:cache_hit', itemId);
      return item;
    }

    // 从存储加载
    try {
      const item = await this.loadFromStorage(itemId);
      if (item) {
        // 加入缓存
        this.cache.set(itemId, item);
        this.emit('item:loaded', itemId);
        return item;
      }
    } catch (error) {
      this.emit('item:load_error', itemId, error);
    }

    return null;
  }

  /**
   * 更新知识物料
   */
  async update(itemId: KnowledgeItemId, updates: Partial<HiNATAKnowledgeItem>): Promise<boolean> {
    const existingItem = await this.retrieve(itemId);
    if (!existingItem) {
      return false;
    }

    const updatedItem = {
      ...existingItem,
      ...updates,
      id: itemId,
      metadata: {
        ...existingItem.metadata,
        ...updates.metadata,
        modified: new Date(),
        version: existingItem.metadata.version + 1
      }
    };

    // 验证更新后的数据
    const validation = validateKnowledgeItem(updatedItem);
    if (!validation.isValid) {
      throw new Error(`Invalid update: ${validation.errors.join(', ')}`);
    }

    // 更新缓存
    this.cache.set(itemId, updatedItem);
    this.metadata.set(itemId, updatedItem.metadata);
    this.saveQueue.add(itemId);

    this.emit('item:updated', itemId, updatedItem);
    return true;
  }

  /**
   * 删除知识物料
   */
  async delete(itemId: KnowledgeItemId): Promise<boolean> {
    const item = await this.retrieve(itemId);
    if (!item) {
      return false;
    }

    // 从缓存移除
    this.cache.delete(itemId);
    this.metadata.delete(itemId);
    this.accessLog.delete(itemId);
    this.saveQueue.delete(itemId);

    // 标记为删除（软删除）
    await this.markAsDeleted(itemId);

    this.emit('item:deleted', itemId);
    return true;
  }

  /**
   * 查询知识物料
   */
  async query(options: QueryOptions = {}): Promise<HiNATAKnowledgeItem[]> {
    const results: HiNATAKnowledgeItem[] = [];
    
    // 从元数据索引查询
    for (const [itemId, metadata] of this.metadata.entries()) {
      if (this.matchesQuery(metadata, options)) {
        const item = await this.retrieve(itemId);
        if (item) {
          results.push(item);
        }
      }
    }

    // 排序
    this.sortResults(results, options);

    // 分页
    if (options.pagination) {
      const { offset, limit } = options.pagination;
      return results.slice(offset, offset + limit);
    }

    return results;
  }

  /**
   * 获取存储统计信息
   */
  getStats(): StorageStats {
    const totalItems = this.metadata.size;
    const totalSize = Array.from(this.cache.values())
      .reduce((size, item) => size + this.calculateItemSize(item), 0);
    
    return {
      totalItems,
      totalSize,
      cacheHitRate: this.calculateCacheHitRate(),
      lastCleanup: new Date(), // 实际实现中会记录真实时间
      storageHealth: this.assessStorageHealth()
    };
  }

  /**
   * 清理缓存
   */
  async cleanup(): Promise<void> {
    // 保存待保存的项目
    await this.flushSaveQueue();

    // 清理过期缓存
    await this.cleanupExpiredCache();

    // 压缩存储
    if (this.config.enableCompression) {
      await this.compressStorage();
    }

    this.emit('storage:cleanup_completed');
  }

  /**
   * 关闭存储系统
   */
  async close(): Promise<void> {
    // 停止自动保存
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    // 保存所有待保存的数据
    await this.flushSaveQueue();

    // 清理资源
    this.cache.clear();
    this.metadata.clear();
    this.accessLog.clear();

    this.emit('storage:closed');
  }

  // 私有辅助方法

  private generateItemId(): KnowledgeItemId {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadFromStorage(itemId: KnowledgeItemId): Promise<HiNATAKnowledgeItem | null> {
    // 实际实现中会从文件系统或数据库加载
    // 这里返回null表示未找到
    return null;
  }

  private async loadMetadataIndex(): Promise<void> {
    // 实际实现中会加载元数据索引
  }

  private async validateStorageIntegrity(): Promise<void> {
    // 实际实现中会验证存储完整性
  }

  private matchesQuery(metadata: HiNATAMetadata, options: QueryOptions): boolean {
    // 实现查询匹配逻辑
    if (options.contentTypes && !options.contentTypes.includes(metadata.contentType)) {
      return false;
    }

    if (options.accessLevels && !options.accessLevels.includes(metadata.accessLevel)) {
      return false;
    }

    if (options.tags && !options.tags.some(tag => metadata.tags.includes(tag))) {
      return false;
    }

    if (options.dateRange) {
      const created = new Date(metadata.created);
      if (created < options.dateRange.start || created > options.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  private sortResults(results: HiNATAKnowledgeItem[], options: QueryOptions): void {
    if (!options.sortBy) return;

    const order = options.sortOrder === 'desc' ? -1 : 1;
    
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (options.sortBy) {
        case 'created':
          comparison = new Date(a.metadata.created).getTime() - new Date(b.metadata.created).getTime();
          break;
        case 'modified':
          comparison = new Date(a.metadata.modified).getTime() - new Date(b.metadata.modified).getTime();
          break;
        case 'accessed':
          comparison = new Date(a.metadata.accessed).getTime() - new Date(b.metadata.accessed).getTime();
          break;
        // relevance 排序需要额外的相关性计算
      }
      
      return comparison * order;
    });
  }

  private calculateItemSize(item: HiNATAKnowledgeItem): number {
    // 简单的大小计算，实际实现会更精确
    return JSON.stringify(item).length;
  }

  private calculateCacheHitRate(): number {
    // 实际实现中会统计缓存命中率
    return 0.85; // 示例值
  }

  private assessStorageHealth(): 'healthy' | 'warning' | 'critical' {
    // 实际实现中会评估存储健康状态
    return 'healthy';
  }

  private async markAsDeleted(itemId: KnowledgeItemId): Promise<void> {
    // 实际实现中会标记为软删除
  }

  private startAutoSave(): void {
    if (this.config.autoSaveInterval > 0) {
      this.autoSaveTimer = setInterval(() => {
        this.flushSaveQueue().catch(error => {
          this.emit('storage:auto_save_error', error);
        });
      }, this.config.autoSaveInterval);
    }
  }

  private async flushSaveQueue(): Promise<void> {
    const itemsToSave = Array.from(this.saveQueue);
    this.saveQueue.clear();

    for (const itemId of itemsToSave) {
      try {
        const item = this.cache.get(itemId);
        if (item) {
          await this.saveToStorage(itemId, item);
        }
      } catch (error) {
        this.emit('storage:save_error', itemId, error);
        // 重新加入保存队列
        this.saveQueue.add(itemId);
      }
    }
  }

  private async saveToStorage(itemId: KnowledgeItemId, item: HiNATAKnowledgeItem): Promise<void> {
    // 实际实现中会保存到文件系统或数据库
  }

  private async cleanupExpiredCache(): Promise<void> {
    // 实际实现中会清理过期的缓存项
  }

  private async compressStorage(): Promise<void> {
    // 实际实现中会压缩存储
  }
}

/**
 * 创建知识物料存储实例
 */
export function createKnowledgeItemStorage(config: Partial<KnowledgeItemStorageConfig> = {}): KnowledgeItemStorage {
  const defaultConfig: KnowledgeItemStorageConfig = {
    storageRoot: './data/knowledge_items',
    maxCacheSize: 1000,
    autoSaveInterval: 30000, // 30秒
    enableVersioning: true,
    enableCompression: false
  };

  return new KnowledgeItemStorage({ ...defaultConfig, ...config });
}

export default KnowledgeItemStorage;
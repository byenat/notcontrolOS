/**
 * Ingestion API - HiNATA 数据包接收接口
 * 
 * 负责接收、验证和处理来自各种数据源的HiNATA数据包
 * 支持批量处理、实时流式处理和错误恢复
 */

import { EventEmitter } from 'events';
import {
  HiNATADataPacket,
  HiNATAKnowledgeItem,
  ValidationResult,
  KnowledgeItemId
} from '../core/types';
import { validateDataPacket, validateKnowledgeItem } from '../core/validation';
import { KnowledgeItemStorage } from '../storage/knowledge_item';
import { RelationStorage } from '../storage/relations';
import { TagStorage } from '../storage/tags';

/**
 * 数据源类型
 */
export enum DataSourceType {
  /** 用户直接输入 */
  USER_INPUT = 'user_input',
  /** 文件导入 */
  FILE_IMPORT = 'file_import',
  /** API调用 */
  API_CALL = 'api_call',
  /** 网页抓取 */
  WEB_SCRAPING = 'web_scraping',
  /** 邮件导入 */
  EMAIL_IMPORT = 'email_import',
  /** 聊天记录 */
  CHAT_HISTORY = 'chat_history',
  /** 文档扫描 */
  DOCUMENT_SCAN = 'document_scan',
  /** 音频转录 */
  AUDIO_TRANSCRIPTION = 'audio_transcription',
  /** 视频分析 */
  VIDEO_ANALYSIS = 'video_analysis',
  /** 其他 */
  OTHER = 'other'
}

/**
 * 处理状态
 */
export enum ProcessingStatus {
  /** 等待处理 */
  PENDING = 'pending',
  /** 正在处理 */
  PROCESSING = 'processing',
  /** 处理成功 */
  SUCCESS = 'success',
  /** 处理失败 */
  FAILED = 'failed',
  /** 部分成功 */
  PARTIAL_SUCCESS = 'partial_success',
  /** 已跳过 */
  SKIPPED = 'skipped'
}

/**
 * 接收选项
 */
export interface IngestionOptions {
  /** 数据源类型 */
  sourceType: DataSourceType;
  /** 数据源标识 */
  sourceId?: string;
  /** 批处理大小 */
  batchSize?: number;
  /** 是否异步处理 */
  async?: boolean;
  /** 错误处理策略 */
  errorHandling?: 'strict' | 'lenient' | 'skip';
  /** 重复数据处理 */
  duplicateHandling?: 'skip' | 'update' | 'create_new';
  /** 自动标签提取 */
  autoTagExtraction?: boolean;
  /** 自动关系建立 */
  autoRelationBuilding?: boolean;
  /** 优先级 */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  /** 元数据覆盖 */
  metadataOverrides?: Record<string, any>;
}

/**
 * 处理结果
 */
export interface IngestionResult {
  /** 处理ID */
  id: string;
  /** 处理状态 */
  status: ProcessingStatus;
  /** 成功处理的项目数 */
  successCount: number;
  /** 失败处理的项目数 */
  failureCount: number;
  /** 跳过的项目数 */
  skippedCount: number;
  /** 处理开始时间 */
  startTime: Date;
  /** 处理结束时间 */
  endTime?: Date;
  /** 处理耗时(ms) */
  duration?: number;
  /** 成功创建的知识项IDs */
  createdItems: KnowledgeItemId[];
  /** 更新的知识项IDs */
  updatedItems: KnowledgeItemId[];
  /** 错误信息 */
  errors: Array<{
    index: number;
    error: string;
    data?: any;
  }>;
  /** 警告信息 */
  warnings: Array<{
    index: number;
    warning: string;
    data?: any;
  }>;
  /** 处理统计 */
  stats: {
    totalSize: number;
    averageProcessingTime: number;
    throughput: number; // 项目/秒
  };
}

/**
 * 批处理任务
 */
interface BatchTask {
  id: string;
  packets: HiNATADataPacket[];
  options: IngestionOptions;
  status: ProcessingStatus;
  result?: IngestionResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * 接收配置
 */
export interface IngestionConfig {
  /** 最大并发处理数 */
  maxConcurrency: number;
  /** 默认批处理大小 */
  defaultBatchSize: number;
  /** 处理超时时间(ms) */
  processingTimeout: number;
  /** 重试次数 */
  maxRetries: number;
  /** 重试延迟(ms) */
  retryDelay: number;
  /** 队列最大长度 */
  maxQueueSize: number;
  /** 启用处理统计 */
  enableStats: boolean;
  /** 临时存储目录 */
  tempStorageDir: string;
}

/**
 * 数据包接收引擎
 */
export class IngestionEngine extends EventEmitter {
  private config: IngestionConfig;
  private knowledgeStorage: KnowledgeItemStorage;
  private relationStorage: RelationStorage;
  private tagStorage: TagStorage;
  private processingQueue: BatchTask[];
  private activeProcesses: Map<string, BatchTask>;
  private processingStats: Map<string, IngestionResult>;
  private isProcessing: boolean;

  constructor(
    config: IngestionConfig,
    knowledgeStorage: KnowledgeItemStorage,
    relationStorage: RelationStorage,
    tagStorage: TagStorage
  ) {
    super();
    this.config = config;
    this.knowledgeStorage = knowledgeStorage;
    this.relationStorage = relationStorage;
    this.tagStorage = tagStorage;
    this.processingQueue = [];
    this.activeProcesses = new Map();
    this.processingStats = new Map();
    this.isProcessing = false;

    this.startProcessingLoop();
  }

  /**
   * 接收单个数据包
   */
  async ingestPacket(
    packet: HiNATADataPacket,
    options: Partial<IngestionOptions> = {}
  ): Promise<IngestionResult> {
    return this.ingestPackets([packet], options);
  }

  /**
   * 接收多个数据包
   */
  async ingestPackets(
    packets: HiNATADataPacket[],
    options: Partial<IngestionOptions> = {}
  ): Promise<IngestionResult> {
    const fullOptions: IngestionOptions = {
      sourceType: DataSourceType.API_CALL,
      batchSize: this.config.defaultBatchSize,
      async: false,
      errorHandling: 'lenient',
      duplicateHandling: 'skip',
      autoTagExtraction: true,
      autoRelationBuilding: true,
      priority: 'normal',
      ...options
    };

    // 验证输入
    if (packets.length === 0) {
      throw new Error('No packets provided for ingestion');
    }

    if (this.processingQueue.length >= this.config.maxQueueSize) {
      throw new Error('Processing queue is full');
    }

    // 创建批处理任务
    const task: BatchTask = {
      id: this.generateTaskId(),
      packets,
      options: fullOptions,
      status: ProcessingStatus.PENDING,
      createdAt: new Date()
    };

    if (fullOptions.async) {
      // 异步处理：加入队列
      this.processingQueue.push(task);
      this.emit('ingestion:queued', task.id, packets.length);
      
      // 返回初始结果
      const result: IngestionResult = {
        id: task.id,
        status: ProcessingStatus.PENDING,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        startTime: new Date(),
        createdItems: [],
        updatedItems: [],
        errors: [],
        warnings: [],
        stats: {
          totalSize: packets.length,
          averageProcessingTime: 0,
          throughput: 0
        }
      };
      
      this.processingStats.set(task.id, result);
      return result;
    } else {
      // 同步处理：立即执行
      return this.processTask(task);
    }
  }

  /**
   * 获取处理结果
   */
  async getIngestionResult(taskId: string): Promise<IngestionResult | null> {
    return this.processingStats.get(taskId) || null;
  }

  /**
   * 获取处理状态
   */
  getProcessingStatus(): {
    queueLength: number;
    activeProcesses: number;
    totalProcessed: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.processingQueue.length,
      activeProcesses: this.activeProcesses.size,
      totalProcessed: this.processingStats.size,
      isProcessing: this.isProcessing
    };
  }

  /**
   * 清理已完成的任务
   */
  async cleanup(olderThan?: Date): Promise<number> {
    const cutoff = olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前
    let cleanedCount = 0;

    for (const [taskId, result] of this.processingStats.entries()) {
      if (result.endTime && result.endTime < cutoff) {
        this.processingStats.delete(taskId);
        cleanedCount++;
      }
    }

    this.emit('ingestion:cleanup_completed', cleanedCount);
    return cleanedCount;
  }

  /**
   * 停止处理引擎
   */
  async stop(): Promise<void> {
    this.isProcessing = false;
    
    // 等待活跃进程完成
    while (this.activeProcesses.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.emit('ingestion:stopped');
  }

  // 私有方法

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startProcessingLoop(): void {
    this.isProcessing = true;
    
    const processNext = async () => {
      if (!this.isProcessing) return;
      
      try {
        // 检查是否有待处理任务且未达到并发限制
        if (this.processingQueue.length > 0 && this.activeProcesses.size < this.config.maxConcurrency) {
          // 按优先级排序
          this.processingQueue.sort((a, b) => this.getPriorityValue(b.options.priority!) - this.getPriorityValue(a.options.priority!));
          
          const task = this.processingQueue.shift()!;
          this.processTaskAsync(task);
        }
      } catch (error) {
        this.emit('ingestion:processing_error', error);
      }
      
      // 继续处理循环
      setTimeout(processNext, 100);
    };
    
    processNext();
  }

  private async processTaskAsync(task: BatchTask): Promise<void> {
    this.activeProcesses.set(task.id, task);
    
    try {
      const result = await this.processTask(task);
      this.processingStats.set(task.id, result);
      this.emit('ingestion:completed', task.id, result);
    } catch (error) {
      this.emit('ingestion:failed', task.id, error);
    } finally {
      this.activeProcesses.delete(task.id);
    }
  }

  private async processTask(task: BatchTask): Promise<IngestionResult> {
    const startTime = new Date();
    task.status = ProcessingStatus.PROCESSING;
    task.startedAt = startTime;

    const result: IngestionResult = {
      id: task.id,
      status: ProcessingStatus.PROCESSING,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      startTime,
      createdItems: [],
      updatedItems: [],
      errors: [],
      warnings: [],
      stats: {
        totalSize: task.packets.length,
        averageProcessingTime: 0,
        throughput: 0
      }
    };

    this.emit('ingestion:started', task.id, task.packets.length);

    // 分批处理
    const batchSize = task.options.batchSize || this.config.defaultBatchSize;
    const batches = this.createBatches(task.packets, batchSize);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        const batchResult = await this.processBatch(batch, task.options, batchIndex * batchSize);
        
        // 合并结果
        result.successCount += batchResult.successCount;
        result.failureCount += batchResult.failureCount;
        result.skippedCount += batchResult.skippedCount;
        result.createdItems.push(...batchResult.createdItems);
        result.updatedItems.push(...batchResult.updatedItems);
        result.errors.push(...batchResult.errors);
        result.warnings.push(...batchResult.warnings);
        
        this.emit('ingestion:batch_completed', task.id, batchIndex + 1, batches.length);
      } catch (error) {
        if (task.options.errorHandling === 'strict') {
          result.status = ProcessingStatus.FAILED;
          result.errors.push({
            index: batchIndex,
            error: `Batch processing failed: ${error}`,
            data: batch
          });
          break;
        } else {
          result.warnings.push({
            index: batchIndex,
            warning: `Batch processing failed but continuing: ${error}`,
            data: batch
          });
        }
      }
    }

    // 完成处理
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    result.endTime = endTime;
    result.duration = duration;
    result.stats.averageProcessingTime = duration / task.packets.length;
    result.stats.throughput = task.packets.length / (duration / 1000);
    
    // 确定最终状态
    if (result.failureCount === 0) {
      result.status = ProcessingStatus.SUCCESS;
    } else if (result.successCount > 0) {
      result.status = ProcessingStatus.PARTIAL_SUCCESS;
    } else {
      result.status = ProcessingStatus.FAILED;
    }
    
    task.status = result.status;
    task.completedAt = endTime;
    task.result = result;

    return result;
  }

  private async processBatch(
    packets: HiNATADataPacket[],
    options: IngestionOptions,
    baseIndex: number
  ): Promise<Partial<IngestionResult>> {
    const result: Partial<IngestionResult> = {
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      createdItems: [],
      updatedItems: [],
      errors: [],
      warnings: []
    };

    for (let i = 0; i < packets.length; i++) {
      const packet = packets[i];
      const index = baseIndex + i;
      
      try {
        const processResult = await this.processPacket(packet, options, index);
        
        if (processResult.success) {
          result.successCount!++;
          if (processResult.created) {
            result.createdItems!.push(processResult.itemId!);
          } else {
            result.updatedItems!.push(processResult.itemId!);
          }
        } else if (processResult.skipped) {
          result.skippedCount!++;
        } else {
          result.failureCount!++;
          result.errors!.push({
            index,
            error: processResult.error || 'Unknown error',
            data: packet
          });
        }
        
        if (processResult.warnings) {
          result.warnings!.push(...processResult.warnings.map(warning => ({
            index,
            warning,
            data: packet
          })));
        }
      } catch (error) {
        result.failureCount!++;
        result.errors!.push({
          index,
          error: `Processing error: ${error}`,
          data: packet
        });
      }
    }

    return result;
  }

  private async processPacket(
    packet: HiNATADataPacket,
    options: IngestionOptions,
    index: number
  ): Promise<{
    success: boolean;
    created?: boolean;
    skipped?: boolean;
    itemId?: KnowledgeItemId;
    error?: string;
    warnings?: string[];
  }> {
    const warnings: string[] = [];
    
    // 验证数据包
    const validation = validateDataPacket(packet);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid data packet: ${validation.errors.join(', ')}`
      };
    }

    // 提取知识项
    const knowledgeItem = this.extractKnowledgeItem(packet, options);
    
    // 验证知识项
    const itemValidation = validateKnowledgeItem(knowledgeItem);
    if (!itemValidation.isValid) {
      return {
        success: false,
        error: `Invalid knowledge item: ${itemValidation.errors.join(', ')}`
      };
    }

    // 检查重复
    const existingItem = await this.findDuplicateItem(knowledgeItem);
    if (existingItem) {
      switch (options.duplicateHandling) {
        case 'skip':
          return { success: false, skipped: true };
        case 'update':
          const updated = await this.knowledgeStorage.update(existingItem.id!, knowledgeItem);
          if (updated) {
            await this.postProcessItem(existingItem.id!, knowledgeItem, options, warnings);
            return { success: true, created: false, itemId: existingItem.id!, warnings };
          } else {
            return { success: false, error: 'Failed to update existing item' };
          }
        case 'create_new':
          // 继续创建新项目
          break;
      }
    }

    // 创建新知识项
    try {
      const itemId = await this.knowledgeStorage.store(knowledgeItem);
      await this.postProcessItem(itemId, knowledgeItem, options, warnings);
      
      return {
        success: true,
        created: true,
        itemId,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to store knowledge item: ${error}`
      };
    }
  }

  private extractKnowledgeItem(packet: HiNATADataPacket, options: IngestionOptions): HiNATAKnowledgeItem {
    const now = new Date();
    
    return {
      id: packet.metadata.id,
      content: packet.payload,
      metadata: {
        ...packet.metadata,
        created: packet.metadata.created || now,
        modified: now,
        accessed: now,
        source: {
          type: options.sourceType,
          id: options.sourceId,
          url: packet.metadata.source?.url,
          timestamp: now
        },
        ...options.metadataOverrides
      }
    };
  }

  private async findDuplicateItem(item: HiNATAKnowledgeItem): Promise<HiNATAKnowledgeItem | null> {
    // 简单的重复检测逻辑
    // 实际实现中会使用更复杂的相似性检测
    if (item.id) {
      return await this.knowledgeStorage.retrieve(item.id);
    }
    
    // 基于内容哈希或其他特征检测重复
    return null;
  }

  private async postProcessItem(
    itemId: KnowledgeItemId,
    item: HiNATAKnowledgeItem,
    options: IngestionOptions,
    warnings: string[]
  ): Promise<void> {
    try {
      // 自动标签提取
      if (options.autoTagExtraction) {
        const extractedTags = await this.tagStorage.extractTags(item.content.text || '');
        for (const tag of extractedTags) {
          await this.tagStorage.useTag(tag.id, itemId, 'auto');
        }
      }

      // 自动关系建立
      if (options.autoRelationBuilding) {
        await this.buildAutoRelations(itemId, item);
      }
    } catch (error) {
      warnings.push(`Post-processing warning: ${error}`);
    }
  }

  private async buildAutoRelations(itemId: KnowledgeItemId, item: HiNATAKnowledgeItem): Promise<void> {
    // 实现自动关系建立逻辑
    // 例如：基于引用、标签相似性等建立关系
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private getPriorityValue(priority: string): number {
    const priorityMap = {
      'urgent': 4,
      'high': 3,
      'normal': 2,
      'low': 1
    };
    return priorityMap[priority as keyof typeof priorityMap] || 2;
  }
}

/**
 * 创建接收引擎实例
 */
export function createIngestionEngine(
  knowledgeStorage: KnowledgeItemStorage,
  relationStorage: RelationStorage,
  tagStorage: TagStorage,
  config: Partial<IngestionConfig> = {}
): IngestionEngine {
  const defaultConfig: IngestionConfig = {
    maxConcurrency: 3,
    defaultBatchSize: 10,
    processingTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    maxQueueSize: 1000,
    enableStats: true,
    tempStorageDir: './temp/ingestion'
  };

  return new IngestionEngine(
    { ...defaultConfig, ...config },
    knowledgeStorage,
    relationStorage,
    tagStorage
  );
}

export default IngestionEngine;
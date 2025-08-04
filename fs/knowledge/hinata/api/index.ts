/**
 * HiNATA API - 主入口文件
 * 
 * 整合所有API模块，提供统一的接口和管理功能
 * 包括数据摄取、查询、导出等核心功能
 */

import { EventEmitter } from 'events';
import {
  HiNATAKnowledgeItem,
  KnowledgeItemId,
  ContentType,
  AccessLevel
} from '../core/types';
import { KnowledgeItemStorage, createKnowledgeItemStorage } from '../storage/knowledge_item';
import { RelationStorage, createRelationStorage } from '../storage/relations';
import { TagStorage, createTagStorage } from '../storage/tags';
import { IngestionEngine, createIngestionEngine, IngestionConfig } from './ingestion';
import { QueryEngine, createQueryEngine, QueryConfig, QueryOptions, QueryResult } from './query';
import { ExportEngine, createExportEngine, ExportConfig, ExportOptions, ExportResult } from './export';

/**
 * HiNATA API 配置
 */
export interface HiNATAAPIConfig {
  /** 存储配置 */
  storage: {
    /** 数据目录 */
    dataDir: string;
    /** 启用持久化 */
    enablePersistence: boolean;
    /** 缓存配置 */
    cache: {
      enabled: boolean;
      maxSize: number;
      ttl: number;
    };
  };
  /** 摄取引擎配置 */
  ingestion: Partial<IngestionConfig>;
  /** 查询引擎配置 */
  query: Partial<QueryConfig>;
  /** 导出引擎配置 */
  export: Partial<ExportConfig>;
  /** API配置 */
  api: {
    /** 启用API日志 */
    enableLogging: boolean;
    /** 启用性能监控 */
    enableMetrics: boolean;
    /** 启用访问控制 */
    enableAccessControl: boolean;
    /** 最大并发请求数 */
    maxConcurrentRequests: number;
    /** 请求超时时间(ms) */
    requestTimeout: number;
  };
}

/**
 * API 统计信息
 */
export interface APIStats {
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successfulRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 平均响应时间(ms) */
  averageResponseTime: number;
  /** 当前活跃请求数 */
  activeRequests: number;
  /** 存储统计 */
  storage: {
    totalItems: number;
    totalRelations: number;
    totalTags: number;
    storageSize: number;
  };
  /** 各模块统计 */
  modules: {
    ingestion: {
      totalProcessed: number;
      successRate: number;
      averageProcessingTime: number;
    };
    query: {
      totalQueries: number;
      cacheHitRate: number;
      averageQueryTime: number;
    };
    export: {
      totalExports: number;
      successRate: number;
      averageExportTime: number;
    };
  };
}

/**
 * 请求上下文
 */
export interface RequestContext {
  /** 请求ID */
  requestId: string;
  /** 用户ID */
  userId?: string;
  /** 访问级别 */
  accessLevel: AccessLevel;
  /** 请求时间 */
  timestamp: Date;
  /** 客户端信息 */
  clientInfo?: {
    userAgent?: string;
    ip?: string;
    version?: string;
  };
}

/**
 * HiNATA API 主类
 */
export class HiNATAAPI extends EventEmitter {
  private config: HiNATAAPIConfig;
  private knowledgeStorage: KnowledgeItemStorage;
  private relationStorage: RelationStorage;
  private tagStorage: TagStorage;
  private ingestionEngine: IngestionEngine;
  private queryEngine: QueryEngine;
  private exportEngine: ExportEngine;
  private stats: APIStats;
  private activeRequests: Map<string, RequestContext>;
  private initialized: boolean = false;

  constructor(config: HiNATAAPIConfig) {
    super();
    this.config = config;
    this.activeRequests = new Map();
    this.initializeStats();
  }

  /**
   * 初始化API
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.emit('api:initializing');

    try {
      // 初始化存储层
      this.knowledgeStorage = createKnowledgeItemStorage({
        dataDir: this.config.storage.dataDir,
        enablePersistence: this.config.storage.enablePersistence,
        cacheConfig: this.config.storage.cache
      });

      this.relationStorage = createRelationStorage({
        dataDir: this.config.storage.dataDir,
        enablePersistence: this.config.storage.enablePersistence,
        cacheConfig: this.config.storage.cache
      });

      this.tagStorage = createTagStorage({
        dataDir: this.config.storage.dataDir,
        enablePersistence: this.config.storage.enablePersistence,
        cacheConfig: this.config.storage.cache
      });

      await this.knowledgeStorage.initialize();
      await this.relationStorage.initialize();
      await this.tagStorage.initialize();

      // 初始化引擎
      this.ingestionEngine = createIngestionEngine(
        this.knowledgeStorage,
        this.relationStorage,
        this.tagStorage,
        this.config.ingestion
      );

      this.queryEngine = createQueryEngine(
        this.knowledgeStorage,
        this.relationStorage,
        this.tagStorage,
        this.config.query
      );

      this.exportEngine = createExportEngine(
        this.knowledgeStorage,
        this.relationStorage,
        this.tagStorage,
        this.queryEngine,
        this.config.export
      );

      // 设置事件监听
      this.setupEventListeners();

      this.initialized = true;
      this.emit('api:initialized');
    } catch (error) {
      this.emit('api:initialization_failed', error);
      throw error;
    }
  }

  /**
   * 关闭API
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.emit('api:shutting_down');

    try {
      // 等待活跃请求完成
      await this.waitForActiveRequests();

      // 关闭存储层
      await this.knowledgeStorage.close();
      await this.relationStorage.close();
      await this.tagStorage.close();

      this.initialized = false;
      this.emit('api:shutdown');
    } catch (error) {
      this.emit('api:shutdown_failed', error);
      throw error;
    }
  }

  // 数据摄取 API

  /**
   * 摄取单个数据包
   */
  async ingest(
    item: HiNATAKnowledgeItem,
    context?: Partial<RequestContext>
  ): Promise<{ success: boolean; itemId?: KnowledgeItemId; error?: string }> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      const result = await this.ingestionEngine.ingest(item);
      this.completeRequest(requestContext, true);
      return { success: true, itemId: result.itemId };
    } catch (error) {
      this.completeRequest(requestContext, false);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 批量摄取数据包
   */
  async ingestBatch(
    items: HiNATAKnowledgeItem[],
    context?: Partial<RequestContext>
  ): Promise<{
    success: boolean;
    results: Array<{ itemId?: KnowledgeItemId; error?: string }>;
    stats: { total: number; successful: number; failed: number };
  }> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      const result = await this.ingestionEngine.ingestBatch(items);
      this.completeRequest(requestContext, true);
      
      return {
        success: true,
        results: result.results,
        stats: result.stats
      };
    } catch (error) {
      this.completeRequest(requestContext, false);
      return {
        success: false,
        results: [],
        stats: { total: items.length, successful: 0, failed: items.length }
      };
    }
  }

  // 查询 API

  /**
   * 执行查询
   */
  async query(
    options: QueryOptions,
    context?: Partial<RequestContext>
  ): Promise<QueryResult> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      
      // 应用访问控制
      const filteredOptions = this.applyAccessControl(options, requestContext);
      
      const result = await this.queryEngine.query(filteredOptions);
      this.completeRequest(requestContext, true);
      return result;
    } catch (error) {
      this.completeRequest(requestContext, false);
      throw error;
    }
  }

  /**
   * 简单文本搜索
   */
  async search(
    text: string,
    options: Partial<QueryOptions> = {},
    context?: Partial<RequestContext>
  ): Promise<QueryResult> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      
      // 应用访问控制
      const filteredOptions = this.applyAccessControl(options, requestContext);
      
      const result = await this.queryEngine.search(text, filteredOptions);
      this.completeRequest(requestContext, true);
      return result;
    } catch (error) {
      this.completeRequest(requestContext, false);
      throw error;
    }
  }

  /**
   * 语义搜索
   */
  async semanticSearch(
    text: string,
    options: Partial<QueryOptions> = {},
    context?: Partial<RequestContext>
  ): Promise<QueryResult> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      
      // 应用访问控制
      const filteredOptions = this.applyAccessControl(options, requestContext);
      
      const result = await this.queryEngine.semanticSearch(text, filteredOptions);
      this.completeRequest(requestContext, true);
      return result;
    } catch (error) {
      this.completeRequest(requestContext, false);
      throw error;
    }
  }

  /**
   * 获取推荐
   */
  async getRecommendations(
    context: {
      recentItems?: KnowledgeItemId[];
      currentTags?: string[];
      userPreferences?: Record<string, any>;
    },
    options: Partial<QueryOptions> = {},
    requestContext?: Partial<RequestContext>
  ): Promise<QueryResult> {
    const reqContext = this.createRequestContext(requestContext);
    
    try {
      this.startRequest(reqContext);
      
      // 应用访问控制
      const filteredOptions = this.applyAccessControl(options, reqContext);
      
      const result = await this.queryEngine.recommend(context, filteredOptions);
      this.completeRequest(reqContext, true);
      return result;
    } catch (error) {
      this.completeRequest(reqContext, false);
      throw error;
    }
  }

  // 导出 API

  /**
   * 导出数据
   */
  async export(
    options: ExportOptions,
    context?: Partial<RequestContext>
  ): Promise<ExportResult> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      
      // 应用访问控制
      const filteredOptions = this.applyExportAccessControl(options, requestContext);
      
      const result = await this.exportEngine.export(filteredOptions);
      this.completeRequest(requestContext, true);
      return result;
    } catch (error) {
      this.completeRequest(requestContext, false);
      throw error;
    }
  }

  /**
   * 导出为JSON
   */
  async exportToJSON(
    items: HiNATAKnowledgeItem[],
    outputPath?: string,
    context?: Partial<RequestContext>
  ): Promise<string> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      
      // 过滤用户有权限访问的项目
      const filteredItems = this.filterItemsByAccess(items, requestContext);
      
      const result = await this.exportEngine.exportToJSON(filteredItems, outputPath);
      this.completeRequest(requestContext, true);
      return result;
    } catch (error) {
      this.completeRequest(requestContext, false);
      throw error;
    }
  }

  // 管理 API

  /**
   * 获取知识项
   */
  async getItem(
    itemId: KnowledgeItemId,
    context?: Partial<RequestContext>
  ): Promise<HiNATAKnowledgeItem | null> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      const item = await this.knowledgeStorage.retrieve(itemId);
      
      // 检查访问权限
      if (item && !this.hasItemAccess(item, requestContext)) {
        this.completeRequest(requestContext, false);
        return null;
      }
      
      this.completeRequest(requestContext, true);
      return item;
    } catch (error) {
      this.completeRequest(requestContext, false);
      throw error;
    }
  }

  /**
   * 更新知识项
   */
  async updateItem(
    itemId: KnowledgeItemId,
    updates: Partial<HiNATAKnowledgeItem>,
    context?: Partial<RequestContext>
  ): Promise<{ success: boolean; error?: string }> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      
      // 检查访问权限
      const existingItem = await this.knowledgeStorage.retrieve(itemId);
      if (!existingItem || !this.hasItemAccess(existingItem, requestContext)) {
        this.completeRequest(requestContext, false);
        return { success: false, error: 'Access denied' };
      }
      
      await this.knowledgeStorage.update(itemId, updates);
      this.completeRequest(requestContext, true);
      return { success: true };
    } catch (error) {
      this.completeRequest(requestContext, false);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 删除知识项
   */
  async deleteItem(
    itemId: KnowledgeItemId,
    context?: Partial<RequestContext>
  ): Promise<{ success: boolean; error?: string }> {
    const requestContext = this.createRequestContext(context);
    
    try {
      this.startRequest(requestContext);
      
      // 检查访问权限
      const existingItem = await this.knowledgeStorage.retrieve(itemId);
      if (!existingItem || !this.hasItemAccess(existingItem, requestContext)) {
        this.completeRequest(requestContext, false);
        return { success: false, error: 'Access denied' };
      }
      
      await this.knowledgeStorage.delete(itemId);
      this.completeRequest(requestContext, true);
      return { success: true };
    } catch (error) {
      this.completeRequest(requestContext, false);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取API统计信息
   */
  getStats(): APIStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.initializeStats();
    this.emit('api:stats_reset');
  }

  /**
   * 获取活跃请求
   */
  getActiveRequests(): RequestContext[] {
    return Array.from(this.activeRequests.values());
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, 'up' | 'down' | 'degraded'>;
    timestamp: Date;
  }> {
    const components: Record<string, 'up' | 'down' | 'degraded'> = {};
    
    try {
      // 检查存储层
      await this.knowledgeStorage.query({ pagination: { offset: 0, limit: 1 } });
      components.knowledgeStorage = 'up';
    } catch {
      components.knowledgeStorage = 'down';
    }
    
    try {
      await this.relationStorage.queryRelations({ pagination: { offset: 0, limit: 1 } });
      components.relationStorage = 'up';
    } catch {
      components.relationStorage = 'down';
    }
    
    try {
      await this.tagStorage.queryTags({ pagination: { offset: 0, limit: 1 } });
      components.tagStorage = 'up';
    } catch {
      components.tagStorage = 'down';
    }
    
    // 检查引擎状态
    components.ingestionEngine = 'up'; // 简化检查
    components.queryEngine = 'up';
    components.exportEngine = 'up';
    
    const downComponents = Object.values(components).filter(status => status === 'down').length;
    const degradedComponents = Object.values(components).filter(status => status === 'degraded').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (downComponents === 0 && degradedComponents === 0) {
      status = 'healthy';
    } else if (downComponents === 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      status,
      components,
      timestamp: new Date()
    };
  }

  // 私有方法

  private initializeStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeRequests: 0,
      storage: {
        totalItems: 0,
        totalRelations: 0,
        totalTags: 0,
        storageSize: 0
      },
      modules: {
        ingestion: {
          totalProcessed: 0,
          successRate: 0,
          averageProcessingTime: 0
        },
        query: {
          totalQueries: 0,
          cacheHitRate: 0,
          averageQueryTime: 0
        },
        export: {
          totalExports: 0,
          successRate: 0,
          averageExportTime: 0
        }
      }
    };
  }

  private setupEventListeners(): void {
    // 监听各引擎事件并更新统计
    this.ingestionEngine.on('ingestion:completed', () => {
      this.stats.modules.ingestion.totalProcessed++;
    });
    
    this.queryEngine.on('query:completed', () => {
      this.stats.modules.query.totalQueries++;
    });
    
    this.exportEngine.on('export:completed', () => {
      this.stats.modules.export.totalExports++;
    });
  }

  private createRequestContext(context?: Partial<RequestContext>): RequestContext {
    return {
      requestId: this.generateRequestId(),
      accessLevel: AccessLevel.PUBLIC,
      timestamp: new Date(),
      ...context
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startRequest(context: RequestContext): void {
    this.activeRequests.set(context.requestId, context);
    this.stats.totalRequests++;
    this.stats.activeRequests++;
    
    if (this.config.api.enableLogging) {
      this.emit('api:request_started', context);
    }
  }

  private completeRequest(context: RequestContext, success: boolean): void {
    this.activeRequests.delete(context.requestId);
    this.stats.activeRequests--;
    
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
    
    // 更新平均响应时间
    const responseTime = Date.now() - context.timestamp.getTime();
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;
    
    if (this.config.api.enableLogging) {
      this.emit('api:request_completed', context, success, responseTime);
    }
  }

  private applyAccessControl(options: Partial<QueryOptions>, context: RequestContext): QueryOptions {
    if (!this.config.api.enableAccessControl) {
      return options as QueryOptions;
    }
    
    // 根据用户访问级别过滤
    const filteredOptions = { ...options } as QueryOptions;
    
    if (!filteredOptions.accessLevels) {
      filteredOptions.accessLevels = this.getAccessibleLevels(context.accessLevel);
    } else {
      filteredOptions.accessLevels = filteredOptions.accessLevels.filter(
        level => this.getAccessibleLevels(context.accessLevel).includes(level)
      );
    }
    
    return filteredOptions;
  }

  private applyExportAccessControl(options: ExportOptions, context: RequestContext): ExportOptions {
    if (!this.config.api.enableAccessControl) {
      return options;
    }
    
    // 根据用户访问级别过滤导出选项
    const filteredOptions = { ...options };
    
    if (!filteredOptions.scopeParams) {
      filteredOptions.scopeParams = {};
    }
    
    filteredOptions.scopeParams.accessLevels = this.getAccessibleLevels(context.accessLevel);
    
    return filteredOptions;
  }

  private filterItemsByAccess(items: HiNATAKnowledgeItem[], context: RequestContext): HiNATAKnowledgeItem[] {
    if (!this.config.api.enableAccessControl) {
      return items;
    }
    
    return items.filter(item => this.hasItemAccess(item, context));
  }

  private hasItemAccess(item: HiNATAKnowledgeItem, context: RequestContext): boolean {
    if (!this.config.api.enableAccessControl) {
      return true;
    }
    
    const accessibleLevels = this.getAccessibleLevels(context.accessLevel);
    return accessibleLevels.includes(item.metadata.accessLevel);
  }

  private getAccessibleLevels(userLevel: AccessLevel): AccessLevel[] {
    switch (userLevel) {
      case AccessLevel.ADMIN:
        return [AccessLevel.PUBLIC, AccessLevel.INTERNAL, AccessLevel.RESTRICTED, AccessLevel.ADMIN];
      case AccessLevel.RESTRICTED:
        return [AccessLevel.PUBLIC, AccessLevel.INTERNAL, AccessLevel.RESTRICTED];
      case AccessLevel.INTERNAL:
        return [AccessLevel.PUBLIC, AccessLevel.INTERNAL];
      case AccessLevel.PUBLIC:
      default:
        return [AccessLevel.PUBLIC];
    }
  }

  private async waitForActiveRequests(timeout = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (this.activeRequests.size > 0 && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.activeRequests.size > 0) {
      console.warn(`API shutdown with ${this.activeRequests.size} active requests`);
    }
  }
}

/**
 * 创建HiNATA API实例
 */
export function createHiNATAAPI(config: Partial<HiNATAAPIConfig> = {}): HiNATAAPI {
  const defaultConfig: HiNATAAPIConfig = {
    storage: {
      dataDir: './data/hinata',
      enablePersistence: true,
      cache: {
        enabled: true,
        maxSize: 1000,
        ttl: 5 * 60 * 1000 // 5分钟
      }
    },
    ingestion: {
      enableBatchProcessing: true,
      batchSize: 100,
      enableRealTimeProcessing: true,
      enableValidation: true,
      enableErrorRecovery: true
    },
    query: {
      enableCache: true,
      cacheSize: 1000,
      cacheTTL: 5 * 60 * 1000,
      defaultTimeout: 10000,
      maxResults: 1000,
      enableStats: true,
      enableSuggestions: true
    },
    export: {
      defaultOutputDir: './exports',
      maxConcurrentExports: 3,
      tempDir: './temp',
      enableCompression: false,
      defaultEncoding: 'utf8',
      cleanupTempFiles: true
    },
    api: {
      enableLogging: true,
      enableMetrics: true,
      enableAccessControl: true,
      maxConcurrentRequests: 100,
      requestTimeout: 30000
    }
  };

  const mergedConfig = {
    storage: { ...defaultConfig.storage, ...config.storage },
    ingestion: { ...defaultConfig.ingestion, ...config.ingestion },
    query: { ...defaultConfig.query, ...config.query },
    export: { ...defaultConfig.export, ...config.export },
    api: { ...defaultConfig.api, ...config.api }
  };

  return new HiNATAAPI(mergedConfig);
}

// 导出所有相关类型和接口
export * from './ingestion';
export * from './query';
export * from './export';
export * from '../core/types';
export * from '../storage/knowledge_item';
export * from '../storage/relations';
export * from '../storage/tags';

export default HiNATAAPI;
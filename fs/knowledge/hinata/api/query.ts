/**
 * Query API - HiNATA 查询接口
 * 
 * 提供强大的查询和检索功能，支持多种查询方式和智能推荐
 * 包括全文搜索、语义搜索、关系查询和复合查询
 */

import { EventEmitter } from 'events';
import {
  HiNATAKnowledgeItem,
  KnowledgeItemId,
  ContentType,
  AccessLevel
} from '../core/types';
import { KnowledgeItemStorage, QueryOptions as StorageQueryOptions } from '../storage/knowledge_item';
import { RelationStorage, RelationType, RelationQueryOptions } from '../storage/relations';
import { TagStorage, TagType, TagCategory } from '../storage/tags';

/**
 * 查询类型
 */
export enum QueryType {
  /** 全文搜索 */
  FULL_TEXT = 'full_text',
  /** 语义搜索 */
  SEMANTIC = 'semantic',
  /** 标签查询 */
  TAG_BASED = 'tag_based',
  /** 关系查询 */
  RELATION_BASED = 'relation_based',
  /** 时间范围查询 */
  TEMPORAL = 'temporal',
  /** 复合查询 */
  COMPOSITE = 'composite',
  /** 相似性查询 */
  SIMILARITY = 'similarity',
  /** 推荐查询 */
  RECOMMENDATION = 'recommendation'
}

/**
 * 排序方式
 */
export enum SortBy {
  /** 相关性 */
  RELEVANCE = 'relevance',
  /** 创建时间 */
  CREATED = 'created',
  /** 修改时间 */
  MODIFIED = 'modified',
  /** 访问时间 */
  ACCESSED = 'accessed',
  /** 标题 */
  TITLE = 'title',
  /** 重要性 */
  IMPORTANCE = 'importance',
  /** 使用频率 */
  USAGE_FREQUENCY = 'usage_frequency'
}

/**
 * 查询条件
 */
export interface QueryCondition {
  /** 查询类型 */
  type: QueryType;
  /** 查询参数 */
  params: Record<string, any>;
  /** 权重 */
  weight?: number;
}

/**
 * 查询选项
 */
export interface QueryOptions {
  /** 查询条件 */
  conditions: QueryCondition[];
  /** 内容类型过滤 */
  contentTypes?: ContentType[];
  /** 访问级别过滤 */
  accessLevels?: AccessLevel[];
  /** 标签过滤 */
  tags?: string[];
  /** 排除标签 */
  excludeTags?: string[];
  /** 时间范围 */
  dateRange?: {
    start: Date;
    end: Date;
    field?: 'created' | 'modified' | 'accessed';
  };
  /** 排序方式 */
  sortBy?: SortBy;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 分页 */
  pagination?: {
    offset: number;
    limit: number;
  };
  /** 最小相关性分数 */
  minRelevanceScore?: number;
  /** 包含关系信息 */
  includeRelations?: boolean;
  /** 包含标签信息 */
  includeTags?: boolean;
  /** 高亮匹配文本 */
  highlightMatches?: boolean;
  /** 查询超时时间(ms) */
  timeout?: number;
}

/**
 * 查询结果项
 */
export interface QueryResultItem {
  /** 知识项 */
  item: HiNATAKnowledgeItem;
  /** 相关性分数 */
  relevanceScore: number;
  /** 匹配信息 */
  matches: Array<{
    field: string;
    text: string;
    highlighted?: string;
    position: number;
    length: number;
  }>;
  /** 相关标签 */
  tags?: Array<{
    id: string;
    name: string;
    type: TagType;
    category: TagCategory;
  }>;
  /** 相关关系 */
  relations?: Array<{
    id: string;
    type: RelationType;
    targetId: KnowledgeItemId;
    strength: number;
  }>;
}

/**
 * 查询结果
 */
export interface QueryResult {
  /** 查询ID */
  queryId: string;
  /** 结果项 */
  items: QueryResultItem[];
  /** 总数 */
  totalCount: number;
  /** 查询耗时(ms) */
  duration: number;
  /** 查询统计 */
  stats: {
    /** 各存储层查询耗时 */
    storageQueryTime: number;
    /** 关系查询耗时 */
    relationQueryTime: number;
    /** 标签查询耗时 */
    tagQueryTime: number;
    /** 排序耗时 */
    sortingTime: number;
    /** 缓存命中率 */
    cacheHitRate: number;
  };
  /** 建议的相关查询 */
  suggestions?: string[];
  /** 查询元数据 */
  metadata: {
    /** 查询时间 */
    timestamp: Date;
    /** 查询选项 */
    options: QueryOptions;
    /** 是否来自缓存 */
    fromCache: boolean;
  };
}

/**
 * 聚合查询结果
 */
export interface AggregationResult {
  /** 按内容类型聚合 */
  byContentType: Record<ContentType, number>;
  /** 按标签聚合 */
  byTags: Array<{ tag: string; count: number }>;
  /** 按时间聚合 */
  byTime: Array<{ period: string; count: number }>;
  /** 按访问级别聚合 */
  byAccessLevel: Record<AccessLevel, number>;
}

/**
 * 查询缓存项
 */
interface QueryCacheItem {
  result: QueryResult;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
}

/**
 * 查询配置
 */
export interface QueryConfig {
  /** 启用查询缓存 */
  enableCache: boolean;
  /** 缓存大小 */
  cacheSize: number;
  /** 缓存TTL(ms) */
  cacheTTL: number;
  /** 默认查询超时(ms) */
  defaultTimeout: number;
  /** 最大结果数 */
  maxResults: number;
  /** 启用查询统计 */
  enableStats: boolean;
  /** 启用查询建议 */
  enableSuggestions: boolean;
}

/**
 * 查询引擎
 */
export class QueryEngine extends EventEmitter {
  private config: QueryConfig;
  private knowledgeStorage: KnowledgeItemStorage;
  private relationStorage: RelationStorage;
  private tagStorage: TagStorage;
  private queryCache: Map<string, QueryCacheItem>;
  private queryStats: Map<string, any>;

  constructor(
    config: QueryConfig,
    knowledgeStorage: KnowledgeItemStorage,
    relationStorage: RelationStorage,
    tagStorage: TagStorage
  ) {
    super();
    this.config = config;
    this.knowledgeStorage = knowledgeStorage;
    this.relationStorage = relationStorage;
    this.tagStorage = tagStorage;
    this.queryCache = new Map();
    this.queryStats = new Map();
  }

  /**
   * 执行查询
   */
  async query(options: QueryOptions): Promise<QueryResult> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();
    
    this.emit('query:started', queryId, options);

    try {
      // 检查缓存
      if (this.config.enableCache) {
        const cached = this.getCachedResult(options);
        if (cached) {
          this.emit('query:cache_hit', queryId);
          return {
            ...cached,
            queryId,
            metadata: {
              ...cached.metadata,
              fromCache: true
            }
          };
        }
      }

      // 执行查询
      const result = await this.executeQuery(queryId, options);
      
      // 缓存结果
      if (this.config.enableCache) {
        this.cacheResult(options, result);
      }

      // 记录统计
      if (this.config.enableStats) {
        this.recordQueryStats(queryId, options, result);
      }

      this.emit('query:completed', queryId, result);
      return result;
    } catch (error) {
      this.emit('query:failed', queryId, error);
      throw error;
    }
  }

  /**
   * 简单文本查询
   */
  async search(text: string, options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    const queryOptions: QueryOptions = {
      conditions: [
        {
          type: QueryType.FULL_TEXT,
          params: { text },
          weight: 1.0
        }
      ],
      sortBy: SortBy.RELEVANCE,
      sortOrder: 'desc',
      pagination: { offset: 0, limit: 20 },
      ...options
    };

    return this.query(queryOptions);
  }

  /**
   * 语义搜索
   */
  async semanticSearch(text: string, options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    const queryOptions: QueryOptions = {
      conditions: [
        {
          type: QueryType.SEMANTIC,
          params: { text, threshold: 0.7 },
          weight: 1.0
        }
      ],
      sortBy: SortBy.RELEVANCE,
      sortOrder: 'desc',
      pagination: { offset: 0, limit: 20 },
      ...options
    };

    return this.query(queryOptions);
  }

  /**
   * 标签查询
   */
  async queryByTags(tags: string[], options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    const queryOptions: QueryOptions = {
      conditions: [
        {
          type: QueryType.TAG_BASED,
          params: { tags, operator: 'AND' },
          weight: 1.0
        }
      ],
      sortBy: SortBy.RELEVANCE,
      sortOrder: 'desc',
      pagination: { offset: 0, limit: 20 },
      ...options
    };

    return this.query(queryOptions);
  }

  /**
   * 关系查询
   */
  async queryByRelations(
    itemId: KnowledgeItemId,
    relationTypes?: RelationType[],
    options: Partial<QueryOptions> = {}
  ): Promise<QueryResult> {
    const queryOptions: QueryOptions = {
      conditions: [
        {
          type: QueryType.RELATION_BASED,
          params: { itemId, relationTypes, maxDepth: 2 },
          weight: 1.0
        }
      ],
      sortBy: SortBy.RELEVANCE,
      sortOrder: 'desc',
      pagination: { offset: 0, limit: 20 },
      ...options
    };

    return this.query(queryOptions);
  }

  /**
   * 相似性查询
   */
  async findSimilar(
    itemId: KnowledgeItemId,
    options: Partial<QueryOptions> = {}
  ): Promise<QueryResult> {
    const queryOptions: QueryOptions = {
      conditions: [
        {
          type: QueryType.SIMILARITY,
          params: { itemId, threshold: 0.6 },
          weight: 1.0
        }
      ],
      sortBy: SortBy.RELEVANCE,
      sortOrder: 'desc',
      pagination: { offset: 0, limit: 10 },
      ...options
    };

    return this.query(queryOptions);
  }

  /**
   * 推荐查询
   */
  async recommend(
    context: {
      recentItems?: KnowledgeItemId[];
      currentTags?: string[];
      userPreferences?: Record<string, any>;
    },
    options: Partial<QueryOptions> = {}
  ): Promise<QueryResult> {
    const queryOptions: QueryOptions = {
      conditions: [
        {
          type: QueryType.RECOMMENDATION,
          params: context,
          weight: 1.0
        }
      ],
      sortBy: SortBy.RELEVANCE,
      sortOrder: 'desc',
      pagination: { offset: 0, limit: 15 },
      ...options
    };

    return this.query(queryOptions);
  }

  /**
   * 聚合查询
   */
  async aggregate(options: Partial<QueryOptions> = {}): Promise<AggregationResult> {
    const items = await this.knowledgeStorage.query({
      contentTypes: options.contentTypes,
      accessLevels: options.accessLevels,
      tags: options.tags,
      dateRange: options.dateRange
    });

    const result: AggregationResult = {
      byContentType: {} as Record<ContentType, number>,
      byTags: [],
      byTime: [],
      byAccessLevel: {} as Record<AccessLevel, number>
    };

    // 按内容类型聚合
    for (const item of items) {
      const type = item.metadata.contentType;
      result.byContentType[type] = (result.byContentType[type] || 0) + 1;
    }

    // 按访问级别聚合
    for (const item of items) {
      const level = item.metadata.accessLevel;
      result.byAccessLevel[level] = (result.byAccessLevel[level] || 0) + 1;
    }

    // 按标签聚合
    const tagCounts = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.metadata.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    result.byTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // 按时间聚合（按月）
    const timeCounts = new Map<string, number>();
    for (const item of items) {
      const date = new Date(item.metadata.created);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      timeCounts.set(period, (timeCounts.get(period) || 0) + 1);
    }
    result.byTime = Array.from(timeCounts.entries())
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return result;
  }

  /**
   * 获取查询建议
   */
  async getSuggestions(partialQuery: string, limit = 10): Promise<string[]> {
    if (!this.config.enableSuggestions) {
      return [];
    }

    // 基于历史查询和内容生成建议
    const suggestions: string[] = [];
    
    // 从标签中获取建议
    const tags = await this.tagStorage.queryTags({
      namePattern: partialQuery,
      sortBy: 'usage',
      sortOrder: 'desc',
      pagination: { offset: 0, limit: limit / 2 }
    });
    
    suggestions.push(...tags.map(tag => tag.name));
    
    // 从历史查询中获取建议（实际实现中会维护查询历史）
    // ...
    
    return suggestions.slice(0, limit);
  }

  /**
   * 清理缓存
   */
  async clearCache(): Promise<void> {
    this.queryCache.clear();
    this.emit('query:cache_cleared');
  }

  /**
   * 获取查询统计
   */
  getQueryStats(): {
    totalQueries: number;
    cacheHitRate: number;
    averageQueryTime: number;
    popularQueryTypes: Array<{ type: QueryType; count: number }>;
  } {
    const stats = Array.from(this.queryStats.values());
    const totalQueries = stats.length;
    const cacheHits = stats.filter(s => s.fromCache).length;
    const averageQueryTime = stats.reduce((sum, s) => sum + s.duration, 0) / totalQueries || 0;
    
    const typeCount = new Map<QueryType, number>();
    for (const stat of stats) {
      for (const condition of stat.conditions) {
        typeCount.set(condition.type, (typeCount.get(condition.type) || 0) + 1);
      }
    }
    
    const popularQueryTypes = Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalQueries,
      cacheHitRate: totalQueries > 0 ? cacheHits / totalQueries : 0,
      averageQueryTime,
      popularQueryTypes
    };
  }

  // 私有方法

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async executeQuery(queryId: string, options: QueryOptions): Promise<QueryResult> {
    const startTime = Date.now();
    const stats = {
      storageQueryTime: 0,
      relationQueryTime: 0,
      tagQueryTime: 0,
      sortingTime: 0,
      cacheHitRate: 0
    };

    // 执行各种查询条件
    const candidateItems = new Map<KnowledgeItemId, { item: HiNATAKnowledgeItem; scores: number[] }>();
    
    for (let i = 0; i < options.conditions.length; i++) {
      const condition = options.conditions[i];
      const conditionStartTime = Date.now();
      
      const conditionResults = await this.executeCondition(condition, options);
      
      // 记录各类查询耗时
      const conditionTime = Date.now() - conditionStartTime;
      switch (condition.type) {
        case QueryType.RELATION_BASED:
          stats.relationQueryTime += conditionTime;
          break;
        case QueryType.TAG_BASED:
          stats.tagQueryTime += conditionTime;
          break;
        default:
          stats.storageQueryTime += conditionTime;
      }
      
      // 合并结果
      for (const result of conditionResults) {
        if (candidateItems.has(result.item.id!)) {
          candidateItems.get(result.item.id!)!.scores[i] = result.relevanceScore * (condition.weight || 1.0);
        } else {
          const scores = new Array(options.conditions.length).fill(0);
          scores[i] = result.relevanceScore * (condition.weight || 1.0);
          candidateItems.set(result.item.id!, { item: result.item, scores });
        }
      }
    }

    // 计算最终分数并排序
    const sortStartTime = Date.now();
    const resultItems: QueryResultItem[] = [];
    
    for (const [itemId, { item, scores }] of candidateItems.entries()) {
      const relevanceScore = scores.reduce((sum, score) => sum + score, 0) / scores.filter(s => s > 0).length || 0;
      
      if (relevanceScore >= (options.minRelevanceScore || 0)) {
        const resultItem: QueryResultItem = {
          item,
          relevanceScore,
          matches: await this.findMatches(item, options),
          tags: options.includeTags ? await this.getItemTags(itemId) : undefined,
          relations: options.includeRelations ? await this.getItemRelations(itemId) : undefined
        };
        
        resultItems.push(resultItem);
      }
    }
    
    // 排序
    this.sortResults(resultItems, options);
    stats.sortingTime = Date.now() - sortStartTime;
    
    // 分页
    const totalCount = resultItems.length;
    const paginatedItems = options.pagination 
      ? resultItems.slice(options.pagination.offset, options.pagination.offset + options.pagination.limit)
      : resultItems;
    
    const duration = Date.now() - startTime;
    
    return {
      queryId,
      items: paginatedItems,
      totalCount,
      duration,
      stats,
      suggestions: this.config.enableSuggestions ? await this.generateSuggestions(options) : undefined,
      metadata: {
        timestamp: new Date(),
        options,
        fromCache: false
      }
    };
  }

  private async executeCondition(condition: QueryCondition, options: QueryOptions): Promise<QueryResultItem[]> {
    switch (condition.type) {
      case QueryType.FULL_TEXT:
        return this.executeFullTextQuery(condition.params, options);
      case QueryType.SEMANTIC:
        return this.executeSemanticQuery(condition.params, options);
      case QueryType.TAG_BASED:
        return this.executeTagQuery(condition.params, options);
      case QueryType.RELATION_BASED:
        return this.executeRelationQuery(condition.params, options);
      case QueryType.TEMPORAL:
        return this.executeTemporalQuery(condition.params, options);
      case QueryType.SIMILARITY:
        return this.executeSimilarityQuery(condition.params, options);
      case QueryType.RECOMMENDATION:
        return this.executeRecommendationQuery(condition.params, options);
      default:
        return [];
    }
  }

  private async executeFullTextQuery(params: any, options: QueryOptions): Promise<QueryResultItem[]> {
    const items = await this.knowledgeStorage.query({
      contentTypes: options.contentTypes,
      accessLevels: options.accessLevels,
      tags: options.tags,
      dateRange: options.dateRange
    });
    
    const results: QueryResultItem[] = [];
    const searchText = params.text.toLowerCase();
    
    for (const item of items) {
      const content = (item.content.text || '').toLowerCase();
      const title = (item.content.title || '').toLowerCase();
      
      let relevanceScore = 0;
      const matches: any[] = [];
      
      // 标题匹配（权重更高）
      if (title.includes(searchText)) {
        relevanceScore += 0.8;
        matches.push({
          field: 'title',
          text: item.content.title || '',
          position: title.indexOf(searchText),
          length: searchText.length
        });
      }
      
      // 内容匹配
      if (content.includes(searchText)) {
        relevanceScore += 0.5;
        matches.push({
          field: 'content',
          text: item.content.text || '',
          position: content.indexOf(searchText),
          length: searchText.length
        });
      }
      
      if (relevanceScore > 0) {
        results.push({
          item,
          relevanceScore,
          matches
        });
      }
    }
    
    return results;
  }

  private async executeSemanticQuery(params: any, options: QueryOptions): Promise<QueryResultItem[]> {
    // 实际实现中会使用向量搜索
    // 这里提供简化版本
    return this.executeFullTextQuery(params, options);
  }

  private async executeTagQuery(params: any, options: QueryOptions): Promise<QueryResultItem[]> {
    const { tags, operator = 'AND' } = params;
    const items = await this.knowledgeStorage.query({
      tags: operator === 'AND' ? tags : undefined,
      contentTypes: options.contentTypes,
      accessLevels: options.accessLevels,
      dateRange: options.dateRange
    });
    
    const results: QueryResultItem[] = [];
    
    for (const item of items) {
      let relevanceScore = 0;
      const matchedTags = item.metadata.tags.filter(tag => tags.includes(tag));
      
      if (operator === 'AND') {
        relevanceScore = matchedTags.length === tags.length ? 1.0 : 0;
      } else { // OR
        relevanceScore = matchedTags.length / tags.length;
      }
      
      if (relevanceScore > 0) {
        results.push({
          item,
          relevanceScore,
          matches: matchedTags.map(tag => ({
            field: 'tags',
            text: tag,
            position: 0,
            length: tag.length
          }))
        });
      }
    }
    
    return results;
  }

  private async executeRelationQuery(params: any, options: QueryOptions): Promise<QueryResultItem[]> {
    const { itemId, relationTypes, maxDepth = 2 } = params;
    const relations = await this.relationStorage.queryRelations({
      sourceIds: [itemId],
      types: relationTypes
    });
    
    const results: QueryResultItem[] = [];
    const relatedItemIds = new Set<KnowledgeItemId>();
    
    // 收集相关项目ID
    for (const relation of relations) {
      relatedItemIds.add(relation.targetId);
    }
    
    // 获取相关项目
    for (const relatedItemId of relatedItemIds) {
      const item = await this.knowledgeStorage.retrieve(relatedItemId);
      if (item) {
        const relation = relations.find(r => r.targetId === relatedItemId);
        results.push({
          item,
          relevanceScore: relation?.strength || 0.5,
          matches: []
        });
      }
    }
    
    return results;
  }

  private async executeTemporalQuery(params: any, options: QueryOptions): Promise<QueryResultItem[]> {
    const items = await this.knowledgeStorage.query({
      dateRange: params.dateRange,
      contentTypes: options.contentTypes,
      accessLevels: options.accessLevels,
      tags: options.tags
    });
    
    return items.map(item => ({
      item,
      relevanceScore: 1.0,
      matches: []
    }));
  }

  private async executeSimilarityQuery(params: any, options: QueryOptions): Promise<QueryResultItem[]> {
    // 实际实现中会使用向量相似性计算
    // 这里提供简化版本
    const sourceItem = await this.knowledgeStorage.retrieve(params.itemId);
    if (!sourceItem) return [];
    
    const items = await this.knowledgeStorage.query({
      contentTypes: options.contentTypes,
      accessLevels: options.accessLevels,
      tags: options.tags
    });
    
    const results: QueryResultItem[] = [];
    
    for (const item of items) {
      if (item.id === params.itemId) continue;
      
      // 简单的相似性计算（基于共同标签）
      const commonTags = item.metadata.tags.filter(tag => sourceItem.metadata.tags.includes(tag));
      const similarity = commonTags.length / Math.max(item.metadata.tags.length, sourceItem.metadata.tags.length);
      
      if (similarity >= (params.threshold || 0.6)) {
        results.push({
          item,
          relevanceScore: similarity,
          matches: []
        });
      }
    }
    
    return results;
  }

  private async executeRecommendationQuery(params: any, options: QueryOptions): Promise<QueryResultItem[]> {
    // 基于上下文的推荐逻辑
    const { recentItems = [], currentTags = [], userPreferences = {} } = params;
    
    // 获取推荐项目
    const recommendations: QueryResultItem[] = [];
    
    // 基于最近项目的推荐
    for (const itemId of recentItems.slice(0, 5)) {
      const similarItems = await this.executeSimilarityQuery({ itemId, threshold: 0.5 }, options);
      recommendations.push(...similarItems.map(item => ({ ...item, relevanceScore: item.relevanceScore * 0.8 })));
    }
    
    // 基于当前标签的推荐
    if (currentTags.length > 0) {
      const tagBasedItems = await this.executeTagQuery({ tags: currentTags, operator: 'OR' }, options);
      recommendations.push(...tagBasedItems.map(item => ({ ...item, relevanceScore: item.relevanceScore * 0.6 })));
    }
    
    // 去重并排序
    const uniqueRecommendations = new Map<KnowledgeItemId, QueryResultItem>();
    for (const rec of recommendations) {
      const existing = uniqueRecommendations.get(rec.item.id!);
      if (!existing || rec.relevanceScore > existing.relevanceScore) {
        uniqueRecommendations.set(rec.item.id!, rec);
      }
    }
    
    return Array.from(uniqueRecommendations.values());
  }

  private async findMatches(item: HiNATAKnowledgeItem, options: QueryOptions): Promise<any[]> {
    // 实际实现中会根据查询条件找到具体的匹配位置
    return [];
  }

  private async getItemTags(itemId: KnowledgeItemId): Promise<any[]> {
    // 实际实现中会获取项目的标签信息
    return [];
  }

  private async getItemRelations(itemId: KnowledgeItemId): Promise<any[]> {
    const relations = await this.relationStorage.getItemRelations(itemId, false);
    return relations.map(rel => ({
      id: rel.id,
      type: rel.type,
      targetId: rel.targetId,
      strength: rel.strength
    }));
  }

  private sortResults(results: QueryResultItem[], options: QueryOptions): void {
    const sortBy = options.sortBy || SortBy.RELEVANCE;
    const order = options.sortOrder === 'asc' ? 1 : -1;
    
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case SortBy.RELEVANCE:
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case SortBy.CREATED:
          comparison = new Date(a.item.metadata.created).getTime() - new Date(b.item.metadata.created).getTime();
          break;
        case SortBy.MODIFIED:
          comparison = new Date(a.item.metadata.modified).getTime() - new Date(b.item.metadata.modified).getTime();
          break;
        case SortBy.ACCESSED:
          comparison = new Date(a.item.metadata.accessed).getTime() - new Date(b.item.metadata.accessed).getTime();
          break;
        case SortBy.TITLE:
          comparison = (a.item.content.title || '').localeCompare(b.item.content.title || '');
          break;
        // 其他排序方式...
      }
      
      return comparison * order;
    });
  }

  private getCachedResult(options: QueryOptions): QueryResult | null {
    const cacheKey = this.generateCacheKey(options);
    const cached = this.queryCache.get(cacheKey);
    
    if (cached) {
      const now = new Date();
      if (now.getTime() - cached.timestamp.getTime() < this.config.cacheTTL) {
        cached.accessCount++;
        cached.lastAccessed = now;
        return cached.result;
      } else {
        this.queryCache.delete(cacheKey);
      }
    }
    
    return null;
  }

  private cacheResult(options: QueryOptions, result: QueryResult): void {
    if (this.queryCache.size >= this.config.cacheSize) {
      // 清理最少使用的缓存项
      const lruKey = Array.from(this.queryCache.entries())
        .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime())[0][0];
      this.queryCache.delete(lruKey);
    }
    
    const cacheKey = this.generateCacheKey(options);
    this.queryCache.set(cacheKey, {
      result,
      timestamp: new Date(),
      accessCount: 1,
      lastAccessed: new Date()
    });
  }

  private generateCacheKey(options: QueryOptions): string {
    return JSON.stringify(options);
  }

  private recordQueryStats(queryId: string, options: QueryOptions, result: QueryResult): void {
    this.queryStats.set(queryId, {
      conditions: options.conditions,
      duration: result.duration,
      resultCount: result.totalCount,
      fromCache: result.metadata.fromCache,
      timestamp: result.metadata.timestamp
    });
  }

  private async generateSuggestions(options: QueryOptions): Promise<string[]> {
    // 基于查询条件生成相关建议
    return [];
  }
}

/**
 * 创建查询引擎实例
 */
export function createQueryEngine(
  knowledgeStorage: KnowledgeItemStorage,
  relationStorage: RelationStorage,
  tagStorage: TagStorage,
  config: Partial<QueryConfig> = {}
): QueryEngine {
  const defaultConfig: QueryConfig = {
    enableCache: true,
    cacheSize: 1000,
    cacheTTL: 5 * 60 * 1000, // 5分钟
    defaultTimeout: 10000,
    maxResults: 1000,
    enableStats: true,
    enableSuggestions: true
  };

  return new QueryEngine(
    { ...defaultConfig, ...config },
    knowledgeStorage,
    relationStorage,
    tagStorage
  );
}

export default QueryEngine;
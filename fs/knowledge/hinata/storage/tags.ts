/**
 * Tags Storage - HiNATA 智能标签系统存储层
 * 
 * 负责管理标签的存储、分类、统计和智能推荐
 * 支持用户标签、系统标签和自动标签提取
 */

import { EventEmitter } from 'events';
import { KnowledgeItemId } from '../core/types';

/**
 * 标签类型
 */
export enum TagType {
  /** 用户手动添加的标签 */
  USER = 'user',
  /** 系统自动生成的标签 */
  SYSTEM = 'system',
  /** AI提取的标签 */
  AI_EXTRACTED = 'ai_extracted',
  /** 基于内容分析的标签 */
  CONTENT_BASED = 'content_based',
  /** 基于行为的标签 */
  BEHAVIORAL = 'behavioral'
}

/**
 * 标签分类
 */
export enum TagCategory {
  /** 主题分类 */
  TOPIC = 'topic',
  /** 内容类型 */
  CONTENT_TYPE = 'content_type',
  /** 重要程度 */
  PRIORITY = 'priority',
  /** 状态标签 */
  STATUS = 'status',
  /** 项目标签 */
  PROJECT = 'project',
  /** 时间相关 */
  TEMPORAL = 'temporal',
  /** 情感标签 */
  SENTIMENT = 'sentiment',
  /** 技术标签 */
  TECHNICAL = 'technical',
  /** 其他 */
  OTHER = 'other'
}

/**
 * 标签记录
 */
export interface TagRecord {
  /** 标签ID */
  id: string;
  /** 标签名称 */
  name: string;
  /** 标签类型 */
  type: TagType;
  /** 标签分类 */
  category: TagCategory;
  /** 标签描述 */
  description?: string;
  /** 标签颜色 */
  color?: string;
  /** 标签图标 */
  icon?: string;
  /** 使用次数 */
  usageCount: number;
  /** 创建时间 */
  created: Date;
  /** 最后使用时间 */
  lastUsed: Date;
  /** 标签权重 */
  weight: number;
  /** 父标签ID */
  parentId?: string;
  /** 子标签IDs */
  childrenIds: string[];
  /** 同义词 */
  synonyms: string[];
  /** 相关标签 */
  relatedTags: string[];
  /** 标签元数据 */
  metadata: {
    /** 创建者 */
    createdBy: 'user' | 'system' | 'ai';
    /** 置信度 */
    confidence: number;
    /** 自动过期时间 */
    expiresAt?: Date;
    /** 额外属性 */
    properties?: Record<string, any>;
  };
}

/**
 * 标签使用记录
 */
export interface TagUsageRecord {
  /** 记录ID */
  id: string;
  /** 标签ID */
  tagId: string;
  /** 知识项ID */
  itemId: KnowledgeItemId;
  /** 使用时间 */
  timestamp: Date;
  /** 使用方式 */
  method: 'manual' | 'auto' | 'suggested';
  /** 上下文信息 */
  context?: string;
}

/**
 * 标签统计信息
 */
export interface TagStats {
  /** 总标签数 */
  totalTags: number;
  /** 活跃标签数 */
  activeTags: number;
  /** 类型分布 */
  typeDistribution: Record<TagType, number>;
  /** 分类分布 */
  categoryDistribution: Record<TagCategory, number>;
  /** 使用频率分布 */
  usageDistribution: {
    high: number; // 使用次数 > 100
    medium: number; // 使用次数 10-100
    low: number; // 使用次数 < 10
  };
  /** 平均使用次数 */
  averageUsage: number;
}

/**
 * 标签查询选项
 */
export interface TagQueryOptions {
  /** 标签名称模糊匹配 */
  namePattern?: string;
  /** 标签类型过滤 */
  types?: TagType[];
  /** 标签分类过滤 */
  categories?: TagCategory[];
  /** 最小使用次数 */
  minUsage?: number;
  /** 最大使用次数 */
  maxUsage?: number;
  /** 时间范围 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 包含子标签 */
  includeChildren?: boolean;
  /** 排序方式 */
  sortBy?: 'name' | 'usage' | 'created' | 'lastUsed' | 'weight';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 分页 */
  pagination?: {
    offset: number;
    limit: number;
  };
}

/**
 * 标签推荐选项
 */
export interface TagRecommendationOptions {
  /** 基于内容推荐 */
  contentBased?: boolean;
  /** 基于历史使用推荐 */
  historyBased?: boolean;
  /** 基于相似项目推荐 */
  similarityBased?: boolean;
  /** 推荐数量限制 */
  limit?: number;
  /** 最小置信度 */
  minConfidence?: number;
}

/**
 * 标签推荐结果
 */
export interface TagRecommendation {
  /** 标签记录 */
  tag: TagRecord;
  /** 推荐分数 */
  score: number;
  /** 推荐原因 */
  reason: string;
  /** 置信度 */
  confidence: number;
}

/**
 * 标签存储配置
 */
export interface TagStorageConfig {
  /** 存储根目录 */
  storageRoot: string;
  /** 最大缓存标签数 */
  maxCacheSize: number;
  /** 标签清理间隔(ms) */
  cleanupInterval: number;
  /** 未使用标签过期时间(ms) */
  unusedTagTTL: number;
  /** 启用自动标签提取 */
  enableAutoExtraction: boolean;
  /** 启用标签推荐 */
  enableRecommendation: boolean;
  /** 最大标签层级深度 */
  maxHierarchyDepth: number;
}

/**
 * 标签存储管理器
 */
export class TagStorage extends EventEmitter {
  private config: TagStorageConfig;
  private tags: Map<string, TagRecord>;
  private nameIndex: Map<string, string>; // name -> tagId
  private typeIndex: Map<TagType, Set<string>>;
  private categoryIndex: Map<TagCategory, Set<string>>;
  private usageRecords: Map<string, TagUsageRecord[]>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: TagStorageConfig) {
    super();
    this.config = config;
    this.tags = new Map();
    this.nameIndex = new Map();
    this.typeIndex = new Map();
    this.categoryIndex = new Map();
    this.usageRecords = new Map();
    
    this.initializeStorage();
    this.startCleanupTimer();
  }

  /**
   * 初始化标签存储
   */
  private async initializeStorage(): Promise<void> {
    try {
      await this.loadExistingTags();
      await this.rebuildIndexes();
      await this.initializeSystemTags();
      this.emit('tags:initialized');
    } catch (error) {
      this.emit('tags:error', error);
      throw error;
    }
  }

  /**
   * 创建标签
   */
  async createTag(
    name: string,
    type: TagType,
    category: TagCategory,
    options: {
      description?: string;
      color?: string;
      icon?: string;
      parentId?: string;
      synonyms?: string[];
      metadata?: Partial<TagRecord['metadata']>;
    } = {}
  ): Promise<string> {
    // 标准化标签名称
    const normalizedName = this.normalizeTagName(name);
    
    // 检查是否已存在
    const existingTagId = this.nameIndex.get(normalizedName);
    if (existingTagId) {
      return existingTagId;
    }

    const tagId = this.generateTagId();
    const now = new Date();

    const tag: TagRecord = {
      id: tagId,
      name: normalizedName,
      type,
      category,
      description: options.description,
      color: options.color || this.getDefaultColor(category),
      icon: options.icon,
      usageCount: 0,
      created: now,
      lastUsed: now,
      weight: 1.0,
      parentId: options.parentId,
      childrenIds: [],
      synonyms: options.synonyms || [],
      relatedTags: [],
      metadata: {
        createdBy: 'user',
        confidence: 1.0,
        ...options.metadata
      }
    };

    // 存储标签
    this.tags.set(tagId, tag);
    
    // 更新索引
    this.updateIndexes(tag);

    // 处理父子关系
    if (options.parentId) {
      await this.addChildTag(options.parentId, tagId);
    }

    // 处理同义词
    for (const synonym of tag.synonyms) {
      this.nameIndex.set(this.normalizeTagName(synonym), tagId);
    }

    this.emit('tag:created', tag);
    return tagId;
  }

  /**
   * 获取标签
   */
  async getTag(tagId: string): Promise<TagRecord | null> {
    return this.tags.get(tagId) || null;
  }

  /**
   * 根据名称获取标签
   */
  async getTagByName(name: string): Promise<TagRecord | null> {
    const normalizedName = this.normalizeTagName(name);
    const tagId = this.nameIndex.get(normalizedName);
    return tagId ? this.tags.get(tagId) || null : null;
  }

  /**
   * 查询标签
   */
  async queryTags(options: TagQueryOptions = {}): Promise<TagRecord[]> {
    let results: TagRecord[] = [];

    // 基于索引快速过滤
    if (options.types && options.types.length > 0) {
      const tagIds = new Set<string>();
      for (const type of options.types) {
        const typeTags = this.typeIndex.get(type) || new Set();
        typeTags.forEach(id => tagIds.add(id));
      }
      results = Array.from(tagIds).map(id => this.tags.get(id)!).filter(Boolean);
    } else if (options.categories && options.categories.length > 0) {
      const tagIds = new Set<string>();
      for (const category of options.categories) {
        const categoryTags = this.categoryIndex.get(category) || new Set();
        categoryTags.forEach(id => tagIds.add(id));
      }
      results = Array.from(tagIds).map(id => this.tags.get(id)!).filter(Boolean);
    } else {
      results = Array.from(this.tags.values());
    }

    // 应用其他过滤条件
    results = results.filter(tag => this.matchesQuery(tag, options));

    // 包含子标签
    if (options.includeChildren) {
      const withChildren = new Set(results);
      for (const tag of results) {
        const children = await this.getChildTags(tag.id);
        children.forEach(child => withChildren.add(child));
      }
      results = Array.from(withChildren);
    }

    // 排序
    this.sortTags(results, options);

    // 分页
    if (options.pagination) {
      const { offset, limit } = options.pagination;
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  /**
   * 使用标签
   */
  async useTag(tagId: string, itemId: KnowledgeItemId, method: 'manual' | 'auto' | 'suggested' = 'manual'): Promise<boolean> {
    const tag = this.tags.get(tagId);
    if (!tag) return false;

    // 更新标签使用统计
    tag.usageCount++;
    tag.lastUsed = new Date();
    tag.weight = this.calculateTagWeight(tag);

    // 记录使用历史
    const usageRecord: TagUsageRecord = {
      id: this.generateUsageId(),
      tagId,
      itemId,
      timestamp: new Date(),
      method
    };

    if (!this.usageRecords.has(tagId)) {
      this.usageRecords.set(tagId, []);
    }
    this.usageRecords.get(tagId)!.push(usageRecord);

    this.emit('tag:used', tag, itemId, method);
    return true;
  }

  /**
   * 推荐标签
   */
  async recommendTags(
    itemId: KnowledgeItemId,
    content: string,
    existingTags: string[] = [],
    options: TagRecommendationOptions = {}
  ): Promise<TagRecommendation[]> {
    const recommendations: TagRecommendation[] = [];
    const limit = options.limit || 10;
    const minConfidence = options.minConfidence || 0.3;

    // 基于内容的推荐
    if (options.contentBased !== false) {
      const contentRecommendations = await this.getContentBasedRecommendations(content, existingTags);
      recommendations.push(...contentRecommendations);
    }

    // 基于历史使用的推荐
    if (options.historyBased !== false) {
      const historyRecommendations = await this.getHistoryBasedRecommendations(itemId, existingTags);
      recommendations.push(...historyRecommendations);
    }

    // 基于相似性的推荐
    if (options.similarityBased !== false) {
      const similarityRecommendations = await this.getSimilarityBasedRecommendations(existingTags);
      recommendations.push(...similarityRecommendations);
    }

    // 去重并排序
    const uniqueRecommendations = new Map<string, TagRecommendation>();
    for (const rec of recommendations) {
      if (rec.confidence >= minConfidence && !existingTags.includes(rec.tag.id)) {
        const existing = uniqueRecommendations.get(rec.tag.id);
        if (!existing || rec.score > existing.score) {
          uniqueRecommendations.set(rec.tag.id, rec);
        }
      }
    }

    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 自动提取标签
   */
  async extractTags(content: string, options: { maxTags?: number; minConfidence?: number } = {}): Promise<TagRecord[]> {
    if (!this.config.enableAutoExtraction) {
      return [];
    }

    const maxTags = options.maxTags || 5;
    const minConfidence = options.minConfidence || 0.5;
    const extractedTags: TagRecord[] = [];

    // 简单的关键词提取（实际实现中会使用更复杂的NLP算法）
    const keywords = this.extractKeywords(content);
    
    for (const keyword of keywords.slice(0, maxTags)) {
      // 检查是否已存在标签
      let tag = await this.getTagByName(keyword);
      
      if (!tag) {
        // 创建新的AI提取标签
        const tagId = await this.createTag(
          keyword,
          TagType.AI_EXTRACTED,
          this.categorizeKeyword(keyword),
          {
            metadata: {
              createdBy: 'ai',
              confidence: minConfidence,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
            }
          }
        );
        tag = await this.getTag(tagId);
      }
      
      if (tag) {
        extractedTags.push(tag);
      }
    }

    return extractedTags;
  }

  /**
   * 获取标签层次结构
   */
  async getTagHierarchy(rootTagId?: string): Promise<TagRecord[]> {
    const hierarchy: TagRecord[] = [];
    
    if (rootTagId) {
      const rootTag = this.tags.get(rootTagId);
      if (rootTag) {
        hierarchy.push(rootTag);
        const children = await this.getChildTagsRecursive(rootTagId);
        hierarchy.push(...children);
      }
    } else {
      // 获取所有根标签（没有父标签的标签）
      for (const tag of this.tags.values()) {
        if (!tag.parentId) {
          hierarchy.push(tag);
          const children = await this.getChildTagsRecursive(tag.id);
          hierarchy.push(...children);
        }
      }
    }

    return hierarchy;
  }

  /**
   * 获取标签统计信息
   */
  getStats(): TagStats {
    const totalTags = this.tags.size;
    const activeTags = Array.from(this.tags.values()).filter(tag => tag.usageCount > 0).length;
    
    const typeDistribution: Record<TagType, number> = {} as any;
    const categoryDistribution: Record<TagCategory, number> = {} as any;
    const usageDistribution = { high: 0, medium: 0, low: 0 };
    
    let totalUsage = 0;
    
    for (const tag of this.tags.values()) {
      // 类型分布
      typeDistribution[tag.type] = (typeDistribution[tag.type] || 0) + 1;
      
      // 分类分布
      categoryDistribution[tag.category] = (categoryDistribution[tag.category] || 0) + 1;
      
      // 使用频率分布
      if (tag.usageCount > 100) usageDistribution.high++;
      else if (tag.usageCount >= 10) usageDistribution.medium++;
      else usageDistribution.low++;
      
      totalUsage += tag.usageCount;
    }

    return {
      totalTags,
      activeTags,
      typeDistribution,
      categoryDistribution,
      usageDistribution,
      averageUsage: totalTags > 0 ? totalUsage / totalTags : 0
    };
  }

  /**
   * 清理过期和未使用的标签
   */
  async cleanup(): Promise<number> {
    const now = new Date();
    const tagsToDelete: string[] = [];

    for (const [tagId, tag] of this.tags.entries()) {
      // 清理过期的AI标签
      if (tag.metadata.expiresAt && now > tag.metadata.expiresAt) {
        tagsToDelete.push(tagId);
        continue;
      }

      // 清理长期未使用的系统标签
      if (tag.type === TagType.SYSTEM && tag.usageCount === 0) {
        const age = now.getTime() - tag.created.getTime();
        if (age > this.config.unusedTagTTL) {
          tagsToDelete.push(tagId);
        }
      }
    }

    for (const tagId of tagsToDelete) {
      await this.deleteTag(tagId);
    }

    this.emit('tags:cleanup_completed', tagsToDelete.length);
    return tagsToDelete.length;
  }

  /**
   * 删除标签
   */
  async deleteTag(tagId: string): Promise<boolean> {
    const tag = this.tags.get(tagId);
    if (!tag) return false;

    // 从主存储删除
    this.tags.delete(tagId);
    
    // 从索引删除
    this.removeFromIndexes(tag);
    
    // 删除使用记录
    this.usageRecords.delete(tagId);
    
    // 处理父子关系
    if (tag.parentId) {
      await this.removeChildTag(tag.parentId, tagId);
    }
    
    // 处理子标签
    for (const childId of tag.childrenIds) {
      const child = this.tags.get(childId);
      if (child) {
        child.parentId = undefined;
      }
    }

    this.emit('tag:deleted', tag);
    return true;
  }

  /**
   * 关闭标签存储
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    await this.saveTags();
    
    this.tags.clear();
    this.nameIndex.clear();
    this.typeIndex.clear();
    this.categoryIndex.clear();
    this.usageRecords.clear();

    this.emit('tags:closed');
  }

  // 私有辅助方法

  private generateTagId(): string {
    return `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUsageId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeTagName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '_');
  }

  private getDefaultColor(category: TagCategory): string {
    const colorMap: Record<TagCategory, string> = {
      [TagCategory.TOPIC]: '#3B82F6',
      [TagCategory.CONTENT_TYPE]: '#10B981',
      [TagCategory.PRIORITY]: '#F59E0B',
      [TagCategory.STATUS]: '#8B5CF6',
      [TagCategory.PROJECT]: '#EF4444',
      [TagCategory.TEMPORAL]: '#06B6D4',
      [TagCategory.SENTIMENT]: '#F97316',
      [TagCategory.TECHNICAL]: '#6B7280',
      [TagCategory.OTHER]: '#9CA3AF'
    };
    return colorMap[category] || '#9CA3AF';
  }

  private calculateTagWeight(tag: TagRecord): number {
    // 基于使用频率和时间衰减计算权重
    const usageWeight = Math.log(tag.usageCount + 1) / 10;
    const timeWeight = 1 / (1 + (Date.now() - tag.lastUsed.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(1, usageWeight * timeWeight);
  }

  private updateIndexes(tag: TagRecord): void {
    // 名称索引
    this.nameIndex.set(tag.name, tag.id);
    
    // 类型索引
    if (!this.typeIndex.has(tag.type)) {
      this.typeIndex.set(tag.type, new Set());
    }
    this.typeIndex.get(tag.type)!.add(tag.id);
    
    // 分类索引
    if (!this.categoryIndex.has(tag.category)) {
      this.categoryIndex.set(tag.category, new Set());
    }
    this.categoryIndex.get(tag.category)!.add(tag.id);
  }

  private removeFromIndexes(tag: TagRecord): void {
    this.nameIndex.delete(tag.name);
    this.typeIndex.get(tag.type)?.delete(tag.id);
    this.categoryIndex.get(tag.category)?.delete(tag.id);
    
    // 删除同义词索引
    for (const synonym of tag.synonyms) {
      this.nameIndex.delete(this.normalizeTagName(synonym));
    }
  }

  private matchesQuery(tag: TagRecord, options: TagQueryOptions): boolean {
    if (options.namePattern) {
      const pattern = new RegExp(options.namePattern, 'i');
      if (!pattern.test(tag.name)) {
        return false;
      }
    }

    if (options.minUsage !== undefined && tag.usageCount < options.minUsage) {
      return false;
    }

    if (options.maxUsage !== undefined && tag.usageCount > options.maxUsage) {
      return false;
    }

    if (options.dateRange) {
      const created = new Date(tag.created);
      if (created < options.dateRange.start || created > options.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  private sortTags(tags: TagRecord[], options: TagQueryOptions): void {
    if (!options.sortBy) return;

    const order = options.sortOrder === 'desc' ? -1 : 1;
    
    tags.sort((a, b) => {
      let comparison = 0;
      
      switch (options.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'usage':
          comparison = a.usageCount - b.usageCount;
          break;
        case 'created':
          comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        case 'lastUsed':
          comparison = new Date(a.lastUsed).getTime() - new Date(b.lastUsed).getTime();
          break;
        case 'weight':
          comparison = a.weight - b.weight;
          break;
      }
      
      return comparison * order;
    });
  }

  private async addChildTag(parentId: string, childId: string): Promise<void> {
    const parent = this.tags.get(parentId);
    if (parent && !parent.childrenIds.includes(childId)) {
      parent.childrenIds.push(childId);
    }
  }

  private async removeChildTag(parentId: string, childId: string): Promise<void> {
    const parent = this.tags.get(parentId);
    if (parent) {
      parent.childrenIds = parent.childrenIds.filter(id => id !== childId);
    }
  }

  private async getChildTags(tagId: string): Promise<TagRecord[]> {
    const tag = this.tags.get(tagId);
    if (!tag) return [];
    
    return tag.childrenIds.map(id => this.tags.get(id)!).filter(Boolean);
  }

  private async getChildTagsRecursive(tagId: string): Promise<TagRecord[]> {
    const children: TagRecord[] = [];
    const directChildren = await this.getChildTags(tagId);
    
    for (const child of directChildren) {
      children.push(child);
      const grandChildren = await this.getChildTagsRecursive(child.id);
      children.push(...grandChildren);
    }
    
    return children;
  }

  private extractKeywords(content: string): string[] {
    // 简单的关键词提取实现
    // 实际实现中会使用更复杂的NLP算法
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = new Map<string, number>();
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private categorizeKeyword(keyword: string): TagCategory {
    // 简单的关键词分类逻辑
    // 实际实现中会使用更复杂的分类算法
    const technicalKeywords = ['api', 'database', 'algorithm', 'code', 'function'];
    const topicKeywords = ['business', 'marketing', 'design', 'research'];
    
    if (technicalKeywords.some(tech => keyword.includes(tech))) {
      return TagCategory.TECHNICAL;
    }
    
    if (topicKeywords.some(topic => keyword.includes(topic))) {
      return TagCategory.TOPIC;
    }
    
    return TagCategory.OTHER;
  }

  private async getContentBasedRecommendations(content: string, existingTags: string[]): Promise<TagRecommendation[]> {
    // 实现基于内容的标签推荐
    const recommendations: TagRecommendation[] = [];
    const keywords = this.extractKeywords(content);
    
    for (const keyword of keywords) {
      const tag = await this.getTagByName(keyword);
      if (tag && !existingTags.includes(tag.id)) {
        recommendations.push({
          tag,
          score: 0.8,
          reason: 'Content keyword match',
          confidence: 0.7
        });
      }
    }
    
    return recommendations;
  }

  private async getHistoryBasedRecommendations(itemId: KnowledgeItemId, existingTags: string[]): Promise<TagRecommendation[]> {
    // 实现基于历史使用的标签推荐
    const recommendations: TagRecommendation[] = [];
    
    // 获取最常用的标签
    const popularTags = Array.from(this.tags.values())
      .filter(tag => !existingTags.includes(tag.id))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
    
    for (const tag of popularTags) {
      recommendations.push({
        tag,
        score: tag.weight,
        reason: 'Popular tag',
        confidence: 0.5
      });
    }
    
    return recommendations;
  }

  private async getSimilarityBasedRecommendations(existingTags: string[]): Promise<TagRecommendation[]> {
    // 实现基于相似性的标签推荐
    const recommendations: TagRecommendation[] = [];
    
    for (const tagId of existingTags) {
      const tag = this.tags.get(tagId);
      if (tag) {
        for (const relatedTagId of tag.relatedTags) {
          const relatedTag = this.tags.get(relatedTagId);
          if (relatedTag && !existingTags.includes(relatedTagId)) {
            recommendations.push({
              tag: relatedTag,
              score: 0.6,
              reason: `Related to ${tag.name}`,
              confidence: 0.6
            });
          }
        }
      }
    }
    
    return recommendations;
  }

  private async initializeSystemTags(): Promise<void> {
    // 初始化系统预定义标签
    const systemTags = [
      { name: 'important', category: TagCategory.PRIORITY, color: '#EF4444' },
      { name: 'todo', category: TagCategory.STATUS, color: '#F59E0B' },
      { name: 'done', category: TagCategory.STATUS, color: '#10B981' },
      { name: 'draft', category: TagCategory.STATUS, color: '#6B7280' },
      { name: 'archived', category: TagCategory.STATUS, color: '#9CA3AF' }
    ];
    
    for (const systemTag of systemTags) {
      const existing = await this.getTagByName(systemTag.name);
      if (!existing) {
        await this.createTag(
          systemTag.name,
          TagType.SYSTEM,
          systemTag.category,
          {
            color: systemTag.color,
            metadata: { createdBy: 'system', confidence: 1.0 }
          }
        );
      }
    }
  }

  private async loadExistingTags(): Promise<void> {
    // 实际实现中会从存储加载现有标签
  }

  private async rebuildIndexes(): Promise<void> {
    this.nameIndex.clear();
    this.typeIndex.clear();
    this.categoryIndex.clear();

    for (const tag of this.tags.values()) {
      this.updateIndexes(tag);
    }
  }

  private async saveTags(): Promise<void> {
    // 实际实现中会保存标签到持久化存储
  }

  private startCleanupTimer(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup().catch(error => {
          this.emit('tags:cleanup_error', error);
        });
      }, this.config.cleanupInterval);
    }
  }
}

/**
 * 创建标签存储实例
 */
export function createTagStorage(config: Partial<TagStorageConfig> = {}): TagStorage {
  const defaultConfig: TagStorageConfig = {
    storageRoot: './data/tags',
    maxCacheSize: 5000,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24小时
    unusedTagTTL: 90 * 24 * 60 * 60 * 1000, // 90天
    enableAutoExtraction: true,
    enableRecommendation: true,
    maxHierarchyDepth: 5
  };

  return new TagStorage({ ...defaultConfig, ...config });
}

export default TagStorage;
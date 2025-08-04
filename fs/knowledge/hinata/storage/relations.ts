/**
 * Relations Storage - HiNATA 关系管理存储层
 * 
 * 负责管理知识块之间的关系、引用链接和语义关联
 * 支持强关联、弱关联和自动发现的关系
 */

import { EventEmitter } from 'events';
import {
  KnowledgeItemId,
  HiNATAReference,
  ReferenceType,
  AccessLevel
} from '../core/types';

/**
 * 关系类型定义
 */
export enum RelationType {
  /** 强引用 - 明确的引用关系 */
  STRONG_REFERENCE = 'strong_reference',
  /** 弱引用 - 相关但非直接引用 */
  WEAK_REFERENCE = 'weak_reference',
  /** 语义相似 - 基于内容相似性 */
  SEMANTIC_SIMILARITY = 'semantic_similarity',
  /** 时间关联 - 基于时间的关联 */
  TEMPORAL_ASSOCIATION = 'temporal_association',
  /** 标签关联 - 基于共同标签 */
  TAG_ASSOCIATION = 'tag_association',
  /** 用户定义 - 用户手动创建的关系 */
  USER_DEFINED = 'user_defined',
  /** 派生关系 - 从其他关系推导出的 */
  DERIVED = 'derived'
}

/**
 * 关系强度等级
 */
export enum RelationStrength {
  VERY_WEAK = 0.1,
  WEAK = 0.3,
  MODERATE = 0.5,
  STRONG = 0.7,
  VERY_STRONG = 0.9
}

/**
 * 关系记录
 */
export interface RelationRecord {
  /** 关系ID */
  id: string;
  /** 源知识项ID */
  sourceId: KnowledgeItemId;
  /** 目标知识项ID */
  targetId: KnowledgeItemId;
  /** 关系类型 */
  type: RelationType;
  /** 关系强度 */
  strength: number;
  /** 关系方向性 */
  bidirectional: boolean;
  /** 创建时间 */
  created: Date;
  /** 最后更新时间 */
  updated: Date;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessed: Date;
  /** 关系元数据 */
  metadata: {
    /** 创建方式 */
    createdBy: 'user' | 'system' | 'ai';
    /** 置信度 */
    confidence: number;
    /** 上下文信息 */
    context?: string;
    /** 额外属性 */
    properties?: Record<string, any>;
  };
}

/**
 * 关系查询选项
 */
export interface RelationQueryOptions {
  /** 源ID过滤 */
  sourceIds?: KnowledgeItemId[];
  /** 目标ID过滤 */
  targetIds?: KnowledgeItemId[];
  /** 关系类型过滤 */
  types?: RelationType[];
  /** 最小强度阈值 */
  minStrength?: number;
  /** 最大强度阈值 */
  maxStrength?: number;
  /** 是否包含双向关系 */
  includeBidirectional?: boolean;
  /** 时间范围 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 排序方式 */
  sortBy?: 'strength' | 'created' | 'accessed' | 'updated';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 分页 */
  pagination?: {
    offset: number;
    limit: number;
  };
}

/**
 * 关系图谱节点
 */
export interface GraphNode {
  id: KnowledgeItemId;
  title: string;
  type: string;
  weight: number;
  metadata: Record<string, any>;
}

/**
 * 关系图谱边
 */
export interface GraphEdge {
  source: KnowledgeItemId;
  target: KnowledgeItemId;
  type: RelationType;
  strength: number;
  bidirectional: boolean;
}

/**
 * 关系图谱
 */
export interface RelationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    clusters: number;
  };
}

/**
 * 关系存储配置
 */
export interface RelationStorageConfig {
  /** 存储根目录 */
  storageRoot: string;
  /** 最大缓存关系数 */
  maxCacheSize: number;
  /** 关系过期时间(ms) */
  relationTTL: number;
  /** 自动清理间隔(ms) */
  cleanupInterval: number;
  /** 启用关系推导 */
  enableDerivation: boolean;
  /** 最大推导深度 */
  maxDerivationDepth: number;
}

/**
 * 关系存储管理器
 */
export class RelationStorage extends EventEmitter {
  private config: RelationStorageConfig;
  private relations: Map<string, RelationRecord>;
  private sourceIndex: Map<KnowledgeItemId, Set<string>>;
  private targetIndex: Map<KnowledgeItemId, Set<string>>;
  private typeIndex: Map<RelationType, Set<string>>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: RelationStorageConfig) {
    super();
    this.config = config;
    this.relations = new Map();
    this.sourceIndex = new Map();
    this.targetIndex = new Map();
    this.typeIndex = new Map();
    
    this.initializeStorage();
    this.startCleanupTimer();
  }

  /**
   * 初始化关系存储
   */
  private async initializeStorage(): Promise<void> {
    try {
      await this.loadExistingRelations();
      await this.rebuildIndexes();
      this.emit('relations:initialized');
    } catch (error) {
      this.emit('relations:error', error);
      throw error;
    }
  }

  /**
   * 创建关系
   */
  async createRelation(
    sourceId: KnowledgeItemId,
    targetId: KnowledgeItemId,
    type: RelationType,
    options: {
      strength?: number;
      bidirectional?: boolean;
      metadata?: Partial<RelationRecord['metadata']>;
    } = {}
  ): Promise<string> {
    // 防止自引用
    if (sourceId === targetId) {
      throw new Error('Cannot create self-referencing relation');
    }

    // 检查是否已存在相同关系
    const existingRelation = this.findExistingRelation(sourceId, targetId, type);
    if (existingRelation) {
      // 更新现有关系强度
      await this.updateRelationStrength(existingRelation.id, options.strength || existingRelation.strength);
      return existingRelation.id;
    }

    const relationId = this.generateRelationId();
    const now = new Date();

    const relation: RelationRecord = {
      id: relationId,
      sourceId,
      targetId,
      type,
      strength: options.strength || RelationStrength.MODERATE,
      bidirectional: options.bidirectional || false,
      created: now,
      updated: now,
      accessCount: 0,
      lastAccessed: now,
      metadata: {
        createdBy: 'user',
        confidence: 1.0,
        ...options.metadata
      }
    };

    // 存储关系
    this.relations.set(relationId, relation);
    
    // 更新索引
    this.updateIndexes(relation);

    // 如果启用了关系推导，尝试推导新关系
    if (this.config.enableDerivation) {
      await this.deriveRelations(sourceId, targetId);
    }

    this.emit('relation:created', relation);
    return relationId;
  }

  /**
   * 获取关系
   */
  async getRelation(relationId: string): Promise<RelationRecord | null> {
    const relation = this.relations.get(relationId);
    if (relation) {
      // 更新访问统计
      relation.accessCount++;
      relation.lastAccessed = new Date();
      this.emit('relation:accessed', relation);
    }
    return relation || null;
  }

  /**
   * 查询关系
   */
  async queryRelations(options: RelationQueryOptions = {}): Promise<RelationRecord[]> {
    let results: RelationRecord[] = [];

    // 基于索引快速过滤
    if (options.sourceIds && options.sourceIds.length > 0) {
      const relationIds = new Set<string>();
      for (const sourceId of options.sourceIds) {
        const sourceRelations = this.sourceIndex.get(sourceId) || new Set();
        sourceRelations.forEach(id => relationIds.add(id));
      }
      results = Array.from(relationIds).map(id => this.relations.get(id)!).filter(Boolean);
    } else if (options.targetIds && options.targetIds.length > 0) {
      const relationIds = new Set<string>();
      for (const targetId of options.targetIds) {
        const targetRelations = this.targetIndex.get(targetId) || new Set();
        targetRelations.forEach(id => relationIds.add(id));
      }
      results = Array.from(relationIds).map(id => this.relations.get(id)!).filter(Boolean);
    } else {
      results = Array.from(this.relations.values());
    }

    // 应用其他过滤条件
    results = results.filter(relation => this.matchesQuery(relation, options));

    // 排序
    this.sortRelations(results, options);

    // 分页
    if (options.pagination) {
      const { offset, limit } = options.pagination;
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  /**
   * 获取知识项的所有关系
   */
  async getItemRelations(itemId: KnowledgeItemId, includeIncoming = true): Promise<RelationRecord[]> {
    const relations: RelationRecord[] = [];

    // 获取作为源的关系
    const sourceRelations = this.sourceIndex.get(itemId) || new Set();
    sourceRelations.forEach(relationId => {
      const relation = this.relations.get(relationId);
      if (relation) relations.push(relation);
    });

    // 获取作为目标的关系
    if (includeIncoming) {
      const targetRelations = this.targetIndex.get(itemId) || new Set();
      targetRelations.forEach(relationId => {
        const relation = this.relations.get(relationId);
        if (relation && !relations.find(r => r.id === relationId)) {
          relations.push(relation);
        }
      });
    }

    return relations;
  }

  /**
   * 更新关系强度
   */
  async updateRelationStrength(relationId: string, newStrength: number): Promise<boolean> {
    const relation = this.relations.get(relationId);
    if (!relation) return false;

    const oldStrength = relation.strength;
    relation.strength = Math.max(0, Math.min(1, newStrength));
    relation.updated = new Date();

    this.emit('relation:strength_updated', relationId, oldStrength, newStrength);
    return true;
  }

  /**
   * 删除关系
   */
  async deleteRelation(relationId: string): Promise<boolean> {
    const relation = this.relations.get(relationId);
    if (!relation) return false;

    // 从主存储删除
    this.relations.delete(relationId);

    // 从索引删除
    this.removeFromIndexes(relation);

    this.emit('relation:deleted', relation);
    return true;
  }

  /**
   * 删除知识项的所有关系
   */
  async deleteItemRelations(itemId: KnowledgeItemId): Promise<number> {
    const relations = await this.getItemRelations(itemId, true);
    let deletedCount = 0;

    for (const relation of relations) {
      if (await this.deleteRelation(relation.id)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 构建关系图谱
   */
  async buildGraph(
    centerItemIds: KnowledgeItemId[],
    maxDepth = 2,
    minStrength = 0.1
  ): Promise<RelationGraph> {
    const nodes = new Map<KnowledgeItemId, GraphNode>();
    const edges: GraphEdge[] = [];
    const visited = new Set<KnowledgeItemId>();
    const queue: Array<{ itemId: KnowledgeItemId; depth: number }> = [];

    // 初始化队列
    centerItemIds.forEach(itemId => {
      queue.push({ itemId, depth: 0 });
    });

    while (queue.length > 0) {
      const { itemId, depth } = queue.shift()!;
      
      if (visited.has(itemId) || depth > maxDepth) {
        continue;
      }
      
      visited.add(itemId);

      // 添加节点（实际实现中会从知识项存储获取详细信息）
      if (!nodes.has(itemId)) {
        nodes.set(itemId, {
          id: itemId,
          title: `Item ${itemId}`, // 实际实现中会获取真实标题
          type: 'knowledge_item',
          weight: 1.0,
          metadata: {}
        });
      }

      // 获取相关关系
      const relations = await this.getItemRelations(itemId, true);
      
      for (const relation of relations) {
        if (relation.strength < minStrength) continue;

        const otherItemId = relation.sourceId === itemId ? relation.targetId : relation.sourceId;
        
        // 添加边
        edges.push({
          source: relation.sourceId,
          target: relation.targetId,
          type: relation.type,
          strength: relation.strength,
          bidirectional: relation.bidirectional
        });

        // 将相关项加入队列
        if (!visited.has(otherItemId) && depth < maxDepth) {
          queue.push({ itemId: otherItemId, depth: depth + 1 });
        }
      }
    }

    const nodeArray = Array.from(nodes.values());
    const density = nodeArray.length > 1 ? edges.length / (nodeArray.length * (nodeArray.length - 1)) : 0;

    return {
      nodes: nodeArray,
      edges,
      metadata: {
        totalNodes: nodeArray.length,
        totalEdges: edges.length,
        density,
        clusters: this.detectClusters(nodeArray, edges)
      }
    };
  }

  /**
   * 推荐相关知识项
   */
  async recommendRelated(
    itemId: KnowledgeItemId,
    limit = 10,
    minStrength = 0.3
  ): Promise<Array<{ itemId: KnowledgeItemId; score: number; reason: string }>> {
    const recommendations: Array<{ itemId: KnowledgeItemId; score: number; reason: string }> = [];
    const directRelations = await this.getItemRelations(itemId, false);

    // 直接关系推荐
    for (const relation of directRelations) {
      if (relation.strength >= minStrength) {
        recommendations.push({
          itemId: relation.targetId,
          score: relation.strength,
          reason: `Direct ${relation.type} relation`
        });
      }
    }

    // 间接关系推荐（二度关系）
    for (const relation of directRelations) {
      const secondDegreeRelations = await this.getItemRelations(relation.targetId, false);
      for (const secondRelation of secondDegreeRelations) {
        if (secondRelation.targetId !== itemId && secondRelation.strength >= minStrength) {
          const combinedScore = relation.strength * secondRelation.strength * 0.7; // 衰减因子
          recommendations.push({
            itemId: secondRelation.targetId,
            score: combinedScore,
            reason: `Indirect relation via ${relation.targetId}`
          });
        }
      }
    }

    // 去重并排序
    const uniqueRecommendations = new Map<KnowledgeItemId, { score: number; reason: string }>();
    for (const rec of recommendations) {
      const existing = uniqueRecommendations.get(rec.itemId);
      if (!existing || rec.score > existing.score) {
        uniqueRecommendations.set(rec.itemId, { score: rec.score, reason: rec.reason });
      }
    }

    return Array.from(uniqueRecommendations.entries())
      .map(([itemId, { score, reason }]) => ({ itemId, score, reason }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 获取关系统计信息
   */
  getStats() {
    const totalRelations = this.relations.size;
    const typeDistribution = new Map<RelationType, number>();
    const strengthDistribution = { weak: 0, moderate: 0, strong: 0 };

    for (const relation of this.relations.values()) {
      // 类型分布
      typeDistribution.set(relation.type, (typeDistribution.get(relation.type) || 0) + 1);
      
      // 强度分布
      if (relation.strength < 0.3) strengthDistribution.weak++;
      else if (relation.strength < 0.7) strengthDistribution.moderate++;
      else strengthDistribution.strong++;
    }

    return {
      totalRelations,
      typeDistribution: Object.fromEntries(typeDistribution),
      strengthDistribution,
      averageStrength: Array.from(this.relations.values())
        .reduce((sum, rel) => sum + rel.strength, 0) / totalRelations || 0
    };
  }

  /**
   * 清理过期关系
   */
  async cleanup(): Promise<number> {
    const now = new Date();
    const expiredRelations: string[] = [];

    for (const [relationId, relation] of this.relations.entries()) {
      const age = now.getTime() - relation.lastAccessed.getTime();
      if (age > this.config.relationTTL && relation.metadata.createdBy === 'system') {
        expiredRelations.push(relationId);
      }
    }

    for (const relationId of expiredRelations) {
      await this.deleteRelation(relationId);
    }

    this.emit('relations:cleanup_completed', expiredRelations.length);
    return expiredRelations.length;
  }

  /**
   * 关闭关系存储
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    await this.saveRelations();
    
    this.relations.clear();
    this.sourceIndex.clear();
    this.targetIndex.clear();
    this.typeIndex.clear();

    this.emit('relations:closed');
  }

  // 私有辅助方法

  private generateRelationId(): string {
    return `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private findExistingRelation(
    sourceId: KnowledgeItemId,
    targetId: KnowledgeItemId,
    type: RelationType
  ): RelationRecord | null {
    const sourceRelations = this.sourceIndex.get(sourceId) || new Set();
    
    for (const relationId of sourceRelations) {
      const relation = this.relations.get(relationId);
      if (relation && relation.targetId === targetId && relation.type === type) {
        return relation;
      }
    }
    
    return null;
  }

  private updateIndexes(relation: RelationRecord): void {
    // 源索引
    if (!this.sourceIndex.has(relation.sourceId)) {
      this.sourceIndex.set(relation.sourceId, new Set());
    }
    this.sourceIndex.get(relation.sourceId)!.add(relation.id);

    // 目标索引
    if (!this.targetIndex.has(relation.targetId)) {
      this.targetIndex.set(relation.targetId, new Set());
    }
    this.targetIndex.get(relation.targetId)!.add(relation.id);

    // 类型索引
    if (!this.typeIndex.has(relation.type)) {
      this.typeIndex.set(relation.type, new Set());
    }
    this.typeIndex.get(relation.type)!.add(relation.id);
  }

  private removeFromIndexes(relation: RelationRecord): void {
    this.sourceIndex.get(relation.sourceId)?.delete(relation.id);
    this.targetIndex.get(relation.targetId)?.delete(relation.id);
    this.typeIndex.get(relation.type)?.delete(relation.id);
  }

  private matchesQuery(relation: RelationRecord, options: RelationQueryOptions): boolean {
    if (options.types && !options.types.includes(relation.type)) {
      return false;
    }

    if (options.minStrength !== undefined && relation.strength < options.minStrength) {
      return false;
    }

    if (options.maxStrength !== undefined && relation.strength > options.maxStrength) {
      return false;
    }

    if (options.includeBidirectional === false && relation.bidirectional) {
      return false;
    }

    if (options.dateRange) {
      const created = new Date(relation.created);
      if (created < options.dateRange.start || created > options.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  private sortRelations(relations: RelationRecord[], options: RelationQueryOptions): void {
    if (!options.sortBy) return;

    const order = options.sortOrder === 'desc' ? -1 : 1;
    
    relations.sort((a, b) => {
      let comparison = 0;
      
      switch (options.sortBy) {
        case 'strength':
          comparison = a.strength - b.strength;
          break;
        case 'created':
          comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updated).getTime() - new Date(b.updated).getTime();
          break;
        case 'accessed':
          comparison = new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime();
          break;
      }
      
      return comparison * order;
    });
  }

  private async deriveRelations(sourceId: KnowledgeItemId, targetId: KnowledgeItemId): Promise<void> {
    // 实际实现中会基于现有关系推导新关系
    // 例如：如果 A->B 和 B->C，可能推导出 A->C 的弱关系
  }

  private detectClusters(nodes: GraphNode[], edges: GraphEdge[]): number {
    // 简单的聚类检测算法
    // 实际实现中会使用更复杂的图聚类算法
    return Math.ceil(nodes.length / 10);
  }

  private async loadExistingRelations(): Promise<void> {
    // 实际实现中会从存储加载现有关系
  }

  private async rebuildIndexes(): Promise<void> {
    this.sourceIndex.clear();
    this.targetIndex.clear();
    this.typeIndex.clear();

    for (const relation of this.relations.values()) {
      this.updateIndexes(relation);
    }
  }

  private async saveRelations(): Promise<void> {
    // 实际实现中会保存关系到持久化存储
  }

  private startCleanupTimer(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup().catch(error => {
          this.emit('relations:cleanup_error', error);
        });
      }, this.config.cleanupInterval);
    }
  }
}

/**
 * 创建关系存储实例
 */
export function createRelationStorage(config: Partial<RelationStorageConfig> = {}): RelationStorage {
  const defaultConfig: RelationStorageConfig = {
    storageRoot: './data/relations',
    maxCacheSize: 10000,
    relationTTL: 30 * 24 * 60 * 60 * 1000, // 30天
    cleanupInterval: 24 * 60 * 60 * 1000, // 24小时
    enableDerivation: true,
    maxDerivationDepth: 3
  };

  return new RelationStorage({ ...defaultConfig, ...config });
}

export default RelationStorage;
/**
 * HiNATA 知识块存储层实现
 * 
 * 这个文件实现了知识块的存储、检索、更新和删除功能，
 * 作为 notcontrolOS 知识管理系统的核心存储组件。
 */

import {
  KnowledgeBlock,
  NoteItem,
  KnowledgeBlockReference,
  UUID,
  Timestamp,
  AccessLevel,
  ContentFormat,
  ReferenceType,
  SearchQuery,
  SearchResult,
  BatchOperation,
  BatchResult
} from '../core/types';
import { validateKnowledgeBlock } from '../core/validation';

// ============================================================================
// 存储接口定义
// ============================================================================

/**
 * 知识块存储接口
 */
export interface KnowledgeBlockStorage {
  // 基础 CRUD 操作
  create(block: Omit<KnowledgeBlock, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBlock>;
  getById(id: UUID): Promise<KnowledgeBlock | null>;
  update(id: UUID, updates: Partial<KnowledgeBlock>): Promise<KnowledgeBlock>;
  delete(id: UUID): Promise<void>;
  
  // 查询操作
  getByLibraryItemId(libraryItemId: UUID): Promise<KnowledgeBlock[]>;
  getByUserId(userId: UUID, limit?: number, offset?: number): Promise<KnowledgeBlock[]>;
  search(query: SearchQuery): Promise<SearchResult>;
  
  // 关系操作
  getReferences(blockId: UUID): Promise<KnowledgeBlockReference[]>;
  getBacklinks(blockId: UUID): Promise<KnowledgeBlock[]>;
  addReference(reference: Omit<KnowledgeBlockReference, 'id' | 'createdAt'>): Promise<KnowledgeBlockReference>;
  removeReference(referenceId: UUID): Promise<void>;
  
  // 笔记项操作
  addNoteItem(blockId: UUID, noteItem: Omit<NoteItem, 'id' | 'knowledgeBlockId' | 'createdAt' | 'updatedAt'>): Promise<NoteItem>;
  updateNoteItem(noteItemId: UUID, updates: Partial<NoteItem>): Promise<NoteItem>;
  removeNoteItem(noteItemId: UUID): Promise<void>;
  reorderNoteItems(blockId: UUID, noteItemIds: UUID[]): Promise<void>;
  
  // 批量操作
  batch(operations: BatchOperation[]): Promise<BatchResult>;
  
  // 统计和分析
  getStatistics(userId?: UUID): Promise<KnowledgeBlockStatistics>;
  getPopularTags(userId?: UUID, limit?: number): Promise<TagUsage[]>;
}

/**
 * 知识块统计信息
 */
export interface KnowledgeBlockStatistics {
  totalBlocks: number;
  totalNoteItems: number;
  totalReferences: number;
  averageNotesPerBlock: number;
  mostUsedTags: string[];
  creationTrend: { date: string; count: number }[];
}

/**
 * 标签使用统计
 */
export interface TagUsage {
  tag: string;
  count: number;
  lastUsed: Timestamp;
}

// ============================================================================
// 内存存储实现（用于开发和测试）
// ============================================================================

/**
 * 内存知识块存储实现
 */
export class MemoryKnowledgeBlockStorage implements KnowledgeBlockStorage {
  private blocks: Map<UUID, KnowledgeBlock> = new Map();
  private references: Map<UUID, KnowledgeBlockReference> = new Map();
  private noteItems: Map<UUID, NoteItem> = new Map();
  private blocksByLibraryItem: Map<UUID, Set<UUID>> = new Map();
  private blocksByUser: Map<UUID, Set<UUID>> = new Map();

  /**
   * 创建知识块
   */
  async create(blockData: Omit<KnowledgeBlock, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBlock> {
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    const block: KnowledgeBlock = {
      ...blockData,
      id,
      createdAt: now,
      updatedAt: now,
      noteItems: [],
      references: [],
      backlinks: []
    };
    
    // 验证数据
    const validation = validateKnowledgeBlock(block);
    if (!validation.isValid) {
      throw new Error(`Invalid knowledge block: ${validation.errors.join(', ')}`);
    }
    
    // 存储
    this.blocks.set(id, block);
    
    // 更新索引
    this.updateIndexes(block);
    
    return block;
  }

  /**
   * 根据 ID 获取知识块
   */
  async getById(id: UUID): Promise<KnowledgeBlock | null> {
    return this.blocks.get(id) || null;
  }

  /**
   * 更新知识块
   */
  async update(id: UUID, updates: Partial<KnowledgeBlock>): Promise<KnowledgeBlock> {
    const existingBlock = this.blocks.get(id);
    if (!existingBlock) {
      throw new Error(`Knowledge block not found: ${id}`);
    }
    
    const updatedBlock: KnowledgeBlock = {
      ...existingBlock,
      ...updates,
      id, // 确保 ID 不被修改
      updatedAt: new Date().toISOString()
    };
    
    // 验证更新后的数据
    const validation = validateKnowledgeBlock(updatedBlock);
    if (!validation.isValid) {
      throw new Error(`Invalid knowledge block update: ${validation.errors.join(', ')}`);
    }
    
    // 更新存储
    this.blocks.set(id, updatedBlock);
    
    // 更新索引
    this.updateIndexes(updatedBlock);
    
    return updatedBlock;
  }

  /**
   * 删除知识块
   */
  async delete(id: UUID): Promise<void> {
    const block = this.blocks.get(id);
    if (!block) {
      throw new Error(`Knowledge block not found: ${id}`);
    }
    
    // 删除相关的笔记项
    block.noteItems.forEach(noteItem => {
      this.noteItems.delete(noteItem.id);
    });
    
    // 删除相关的引用
    block.references.forEach(ref => {
      this.references.delete(ref.id);
    });
    
    // 删除知识块
    this.blocks.delete(id);
    
    // 更新索引
    this.removeFromIndexes(block);
  }

  /**
   * 根据信息物料 ID 获取知识块
   */
  async getByLibraryItemId(libraryItemId: UUID): Promise<KnowledgeBlock[]> {
    const blockIds = this.blocksByLibraryItem.get(libraryItemId) || new Set();
    const blocks: KnowledgeBlock[] = [];
    
    for (const blockId of blockIds) {
      const block = this.blocks.get(blockId);
      if (block) {
        blocks.push(block);
      }
    }
    
    return blocks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * 根据用户 ID 获取知识块
   */
  async getByUserId(userId: UUID, limit: number = 50, offset: number = 0): Promise<KnowledgeBlock[]> {
    const blockIds = this.blocksByUser.get(userId) || new Set();
    const blocks: KnowledgeBlock[] = [];
    
    for (const blockId of blockIds) {
      const block = this.blocks.get(blockId);
      if (block) {
        blocks.push(block);
      }
    }
    
    // 按创建时间倒序排列
    blocks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return blocks.slice(offset, offset + limit);
  }

  /**
   * 搜索知识块
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const allBlocks = Array.from(this.blocks.values());
    let filteredBlocks = allBlocks;
    
    // 应用过滤器
    if (query.filters) {
      filteredBlocks = this.applyFilters(filteredBlocks, query.filters);
    }
    
    // 应用文本搜索
    if (query.query.trim()) {
      filteredBlocks = this.applyTextSearch(filteredBlocks, query.query);
    }
    
    // 应用排序
    if (query.sort) {
      filteredBlocks = this.applySorting(filteredBlocks, query.sort);
    }
    
    // 应用分页
    const total = filteredBlocks.length;
    const page = query.pagination?.page || 1;
    const limit = query.pagination?.limit || 20;
    const offset = (page - 1) * limit;
    
    const paginatedBlocks = filteredBlocks.slice(offset, offset + limit);
    
    return {
      items: paginatedBlocks,
      total,
      page,
      limit,
      hasMore: offset + limit < total
    };
  }

  /**
   * 获取知识块的引用
   */
  async getReferences(blockId: UUID): Promise<KnowledgeBlockReference[]> {
    const block = this.blocks.get(blockId);
    if (!block) {
      return [];
    }
    
    const references: KnowledgeBlockReference[] = [];
    for (const ref of block.references) {
      const reference = this.references.get(ref.id);
      if (reference) {
        references.push(reference);
      }
    }
    
    return references;
  }

  /**
   * 获取知识块的反向链接
   */
  async getBacklinks(blockId: UUID): Promise<KnowledgeBlock[]> {
    const block = this.blocks.get(blockId);
    if (!block) {
      return [];
    }
    
    const backlinks: KnowledgeBlock[] = [];
    for (const backlinkId of block.backlinks) {
      const backlinkBlock = this.blocks.get(backlinkId);
      if (backlinkBlock) {
        backlinks.push(backlinkBlock);
      }
    }
    
    return backlinks;
  }

  /**
   * 添加引用关系
   */
  async addReference(
    referenceData: Omit<KnowledgeBlockReference, 'id' | 'createdAt'>
  ): Promise<KnowledgeBlockReference> {
    const id = this.generateUUID();
    const reference: KnowledgeBlockReference = {
      ...referenceData,
      id,
      createdAt: new Date().toISOString()
    };
    
    // 存储引用
    this.references.set(id, reference);
    
    // 更新源知识块的引用列表
    const sourceBlock = this.blocks.get(reference.sourceBlockId);
    if (sourceBlock) {
      sourceBlock.references.push(reference);
      this.blocks.set(sourceBlock.id, sourceBlock);
    }
    
    // 更新目标知识块的反向链接列表
    const targetBlock = this.blocks.get(reference.targetBlockId);
    if (targetBlock) {
      if (!targetBlock.backlinks.includes(reference.sourceBlockId)) {
        targetBlock.backlinks.push(reference.sourceBlockId);
        this.blocks.set(targetBlock.id, targetBlock);
      }
    }
    
    return reference;
  }

  /**
   * 删除引用关系
   */
  async removeReference(referenceId: UUID): Promise<void> {
    const reference = this.references.get(referenceId);
    if (!reference) {
      return;
    }
    
    // 从源知识块中移除引用
    const sourceBlock = this.blocks.get(reference.sourceBlockId);
    if (sourceBlock) {
      sourceBlock.references = sourceBlock.references.filter(ref => ref.id !== referenceId);
      this.blocks.set(sourceBlock.id, sourceBlock);
    }
    
    // 从目标知识块中移除反向链接
    const targetBlock = this.blocks.get(reference.targetBlockId);
    if (targetBlock) {
      targetBlock.backlinks = targetBlock.backlinks.filter(id => id !== reference.sourceBlockId);
      this.blocks.set(targetBlock.id, targetBlock);
    }
    
    // 删除引用
    this.references.delete(referenceId);
  }

  /**
   * 添加笔记项
   */
  async addNoteItem(
    blockId: UUID,
    noteItemData: Omit<NoteItem, 'id' | 'knowledgeBlockId' | 'createdAt' | 'updatedAt'>
  ): Promise<NoteItem> {
    const block = this.blocks.get(blockId);
    if (!block) {
      throw new Error(`Knowledge block not found: ${blockId}`);
    }
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    const noteItem: NoteItem = {
      ...noteItemData,
      id,
      knowledgeBlockId: blockId,
      createdAt: now,
      updatedAt: now
    };
    
    // 存储笔记项
    this.noteItems.set(id, noteItem);
    
    // 更新知识块的笔记项列表
    block.noteItems.push(noteItem);
    block.noteItems.sort((a, b) => a.order - b.order);
    block.updatedAt = now;
    this.blocks.set(blockId, block);
    
    return noteItem;
  }

  /**
   * 更新笔记项
   */
  async updateNoteItem(noteItemId: UUID, updates: Partial<NoteItem>): Promise<NoteItem> {
    const existingNoteItem = this.noteItems.get(noteItemId);
    if (!existingNoteItem) {
      throw new Error(`Note item not found: ${noteItemId}`);
    }
    
    const updatedNoteItem: NoteItem = {
      ...existingNoteItem,
      ...updates,
      id: noteItemId, // 确保 ID 不被修改
      updatedAt: new Date().toISOString()
    };
    
    // 更新存储
    this.noteItems.set(noteItemId, updatedNoteItem);
    
    // 更新知识块中的笔记项
    const block = this.blocks.get(existingNoteItem.knowledgeBlockId);
    if (block) {
      const index = block.noteItems.findIndex(item => item.id === noteItemId);
      if (index !== -1) {
        block.noteItems[index] = updatedNoteItem;
        block.updatedAt = updatedNoteItem.updatedAt;
        this.blocks.set(block.id, block);
      }
    }
    
    return updatedNoteItem;
  }

  /**
   * 删除笔记项
   */
  async removeNoteItem(noteItemId: UUID): Promise<void> {
    const noteItem = this.noteItems.get(noteItemId);
    if (!noteItem) {
      return;
    }
    
    // 从知识块中移除笔记项
    const block = this.blocks.get(noteItem.knowledgeBlockId);
    if (block) {
      block.noteItems = block.noteItems.filter(item => item.id !== noteItemId);
      block.updatedAt = new Date().toISOString();
      this.blocks.set(block.id, block);
    }
    
    // 删除笔记项
    this.noteItems.delete(noteItemId);
  }

  /**
   * 重新排序笔记项
   */
  async reorderNoteItems(blockId: UUID, noteItemIds: UUID[]): Promise<void> {
    const block = this.blocks.get(blockId);
    if (!block) {
      throw new Error(`Knowledge block not found: ${blockId}`);
    }
    
    // 更新笔记项的顺序
    noteItemIds.forEach((noteItemId, index) => {
      const noteItem = this.noteItems.get(noteItemId);
      if (noteItem && noteItem.knowledgeBlockId === blockId) {
        noteItem.order = index;
        noteItem.updatedAt = new Date().toISOString();
        this.noteItems.set(noteItemId, noteItem);
      }
    });
    
    // 重新排序知识块中的笔记项
    block.noteItems.sort((a, b) => a.order - b.order);
    block.updatedAt = new Date().toISOString();
    this.blocks.set(blockId, block);
  }

  /**
   * 批量操作
   */
  async batch(operations: BatchOperation[]): Promise<BatchResult> {
    const results: any[] = [];
    const errors: any[] = [];
    
    for (const operation of operations) {
      try {
        let result;
        switch (operation.type) {
          case 'CREATE':
            if (operation.target === 'KnowledgeBlock') {
              result = await this.create(operation.data);
            }
            break;
          case 'UPDATE':
            if (operation.target === 'KnowledgeBlock' && operation.id) {
              result = await this.update(operation.id, operation.data);
            }
            break;
          case 'DELETE':
            if (operation.target === 'KnowledgeBlock' && operation.id) {
              await this.delete(operation.id);
              result = { success: true };
            }
            break;
        }
        
        results.push({
          operation,
          success: true,
          result
        });
      } catch (error) {
        errors.push({
          operation,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'OPERATION_FAILED'
        });
      }
    }
    
    return {
      success: errors.length === 0,
      results,
      errors
    };
  }

  /**
   * 获取统计信息
   */
  async getStatistics(userId?: UUID): Promise<KnowledgeBlockStatistics> {
    let blocks = Array.from(this.blocks.values());
    
    if (userId) {
      blocks = blocks.filter(block => block.userId === userId);
    }
    
    const totalBlocks = blocks.length;
    const totalNoteItems = blocks.reduce((sum, block) => sum + block.noteItems.length, 0);
    const totalReferences = blocks.reduce((sum, block) => sum + block.references.length, 0);
    const averageNotesPerBlock = totalBlocks > 0 ? totalNoteItems / totalBlocks : 0;
    
    // 统计标签使用情况
    const tagCounts = new Map<string, number>();
    blocks.forEach(block => {
      block.tag.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    const mostUsedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
    
    // 创建趋势（按天统计）
    const creationTrend = this.calculateCreationTrend(blocks);
    
    return {
      totalBlocks,
      totalNoteItems,
      totalReferences,
      averageNotesPerBlock,
      mostUsedTags,
      creationTrend
    };
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(userId?: UUID, limit: number = 20): Promise<TagUsage[]> {
    let blocks = Array.from(this.blocks.values());
    
    if (userId) {
      blocks = blocks.filter(block => block.userId === userId);
    }
    
    const tagUsage = new Map<string, { count: number; lastUsed: Timestamp }>();
    
    blocks.forEach(block => {
      block.tag.forEach(tag => {
        const existing = tagUsage.get(tag);
        if (existing) {
          existing.count++;
          if (block.updatedAt > existing.lastUsed) {
            existing.lastUsed = block.updatedAt;
          }
        } else {
          tagUsage.set(tag, {
            count: 1,
            lastUsed: block.updatedAt
          });
        }
      });
    });
    
    return Array.from(tagUsage.entries())
      .map(([tag, usage]) => ({
        tag,
        count: usage.count,
        lastUsed: usage.lastUsed
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private generateUUID(): UUID {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private updateIndexes(block: KnowledgeBlock): void {
    // 更新按信息物料的索引
    if (!this.blocksByLibraryItem.has(block.libraryItemId)) {
      this.blocksByLibraryItem.set(block.libraryItemId, new Set());
    }
    this.blocksByLibraryItem.get(block.libraryItemId)!.add(block.id);
    
    // 更新按用户的索引
    if (!this.blocksByUser.has(block.userId)) {
      this.blocksByUser.set(block.userId, new Set());
    }
    this.blocksByUser.get(block.userId)!.add(block.id);
  }

  private removeFromIndexes(block: KnowledgeBlock): void {
    // 从按信息物料的索引中移除
    const libraryItemBlocks = this.blocksByLibraryItem.get(block.libraryItemId);
    if (libraryItemBlocks) {
      libraryItemBlocks.delete(block.id);
      if (libraryItemBlocks.size === 0) {
        this.blocksByLibraryItem.delete(block.libraryItemId);
      }
    }
    
    // 从按用户的索引中移除
    const userBlocks = this.blocksByUser.get(block.userId);
    if (userBlocks) {
      userBlocks.delete(block.id);
      if (userBlocks.size === 0) {
        this.blocksByUser.delete(block.userId);
      }
    }
  }

  private applyFilters(blocks: KnowledgeBlock[], filters: any): KnowledgeBlock[] {
    return blocks.filter(block => {
      // 用户过滤
      if (filters.userId && block.userId !== filters.userId) {
        return false;
      }
      
      // 标签过滤
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag: string) => 
          block.tag.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      // 访问级别过滤
      if (filters.accessLevel && filters.accessLevel.length > 0) {
        if (!filters.accessLevel.includes(block.access)) {
          return false;
        }
      }
      
      // 日期范围过滤
      if (filters.dateRange) {
        const createdAt = new Date(block.createdAt).getTime();
        if (filters.dateRange.start) {
          const start = new Date(filters.dateRange.start).getTime();
          if (createdAt < start) {
            return false;
          }
        }
        if (filters.dateRange.end) {
          const end = new Date(filters.dateRange.end).getTime();
          if (createdAt > end) {
            return false;
          }
        }
      }
      
      return true;
    });
  }

  private applyTextSearch(blocks: KnowledgeBlock[], query: string): KnowledgeBlock[] {
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    return blocks.filter(block => {
      const searchableText = [
        block.highlight,
        block.note,
        block.at,
        ...block.tag,
        ...block.noteItems.map(item => item.content)
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  private applySorting(blocks: KnowledgeBlock[], sort: any): KnowledgeBlock[] {
    return blocks.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sort.field) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'highlight':
          aValue = a.highlight.toLowerCase();
          bValue = b.highlight.toLowerCase();
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

  private calculateCreationTrend(blocks: KnowledgeBlock[]): { date: string; count: number }[] {
    const dailyCounts = new Map<string, number>();
    
    blocks.forEach(block => {
      const date = block.createdAt.split('T')[0]; // 获取日期部分
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });
    
    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// ============================================================================
// 导出默认实例
// ============================================================================

/**
 * 默认的知识块存储实例
 */
export const knowledgeBlockStorage = new MemoryKnowledgeBlockStorage();
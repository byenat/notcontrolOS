/**
 * notcontrolOS Generic Knowledge Management Interface
 * 
 * 提供通用的知识管理抽象接口，支持多种知识组织模式的实现
 * 不绑定特定的数据结构，保持开放和可扩展性
 */

export interface KnowledgeItem {
  /** 知识项唯一标识 */
  id: string;
  
  /** 知识项类型 */
  type: KnowledgeItemType;
  
  /** 核心内容 */
  content: KnowledgeContent;
  
  /** 元数据 */
  metadata: KnowledgeMetadata;
  
  /** 关联关系 */
  relations: KnowledgeRelation[];
  
  /** 访问控制 */
  accessControl: AccessControl;
  
  /** 时间戳 */
  timestamps: {
    created: Date;
    modified: Date;
    accessed?: Date;
  };
}

export enum KnowledgeItemType {
  /** 原始文档 */
  DOCUMENT = 'document',
  
  /** 知识片段 */
  FRAGMENT = 'fragment',
  
  /** 引用/链接 */
  REFERENCE = 'reference',
  
  /** 标签/分类 */
  TAG = 'tag',
  
  /** 集合/容器 */
  COLLECTION = 'collection'
}

export interface KnowledgeContent {
  /** 主要内容 */
  primary: string;
  
  /** 辅助内容 */
  secondary?: string;
  
  /** 内容格式 */
  format: ContentFormat;
  
  /** 附件 */
  attachments?: Attachment[];
}

export enum ContentFormat {
  PLAIN_TEXT = 'text/plain',
  MARKDOWN = 'text/markdown',
  HTML = 'text/html',
  JSON = 'application/json',
  BINARY = 'application/octet-stream'
}

export interface KnowledgeMetadata {
  /** 标题/摘要 */
  title?: string;
  
  /** 描述 */
  description?: string;
  
  /** 标签 */
  tags: string[];
  
  /** 来源信息 */
  source?: SourceInfo;
  
  /** 自定义属性 */
  custom: Record<string, any>;
}

export interface SourceInfo {
  /** 来源类型 */
  type: 'url' | 'file' | 'import' | 'manual' | 'generated';
  
  /** 来源标识 */
  identifier?: string;
  
  /** 来源元数据 */
  metadata?: Record<string, any>;
}

export interface KnowledgeRelation {
  /** 关系类型 */
  type: RelationType;
  
  /** 目标知识项ID */
  targetId: string;
  
  /** 关系强度 */
  strength?: number;
  
  /** 关系方向 */
  direction: 'incoming' | 'outgoing' | 'bidirectional';
  
  /** 关系元数据 */
  metadata?: Record<string, any>;
}

export enum RelationType {
  /** 引用关系 */
  REFERENCE = 'reference',
  
  /** 包含关系 */
  CONTAINS = 'contains',
  
  /** 派生关系 */
  DERIVED_FROM = 'derived_from',
  
  /** 相关关系 */
  RELATED = 'related',
  
  /** 标签关系 */
  TAGGED = 'tagged',
  
  /** 自定义关系 */
  CUSTOM = 'custom'
}

export interface AccessControl {
  /** 访问级别 */
  level: AccessLevel;
  
  /** 权限策略 */
  policies: AccessPolicy[];
  
  /** 共享设置 */
  sharing?: SharingConfig;
}

export enum AccessLevel {
  /** 私有 */
  PRIVATE = 'private',
  
  /** 本地AI可读 */
  AI_READABLE = 'ai_readable',
  
  /** 受限共享 */
  RESTRICTED = 'restricted',
  
  /** 公开 */
  PUBLIC = 'public'
}

export interface AccessPolicy {
  /** 策略类型 */
  type: string;
  
  /** 策略配置 */
  config: Record<string, any>;
}

export interface SharingConfig {
  /** 是否可共享 */
  enabled: boolean;
  
  /** 共享范围 */
  scope?: string[];
  
  /** 共享权限 */
  permissions?: string[];
}

export interface Attachment {
  /** 附件ID */
  id: string;
  
  /** 附件类型 */
  type: string;
  
  /** 文件名 */
  filename?: string;
  
  /** 文件大小 */
  size?: number;
  
  /** MIME类型 */
  mimeType?: string;
  
  /** 存储路径或URL */
  location: string;
}

/**
 * 知识管理器接口
 */
export interface KnowledgeManager {
  /**
   * 创建知识项
   */
  createItem(item: Partial<KnowledgeItem>): Promise<KnowledgeItem>;
  
  /**
   * 获取知识项
   */
  getItem(id: string): Promise<KnowledgeItem | null>;
  
  /**
   * 更新知识项
   */
  updateItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem>;
  
  /**
   * 删除知识项
   */
  deleteItem(id: string): Promise<void>;
  
  /**
   * 搜索知识项
   */
  search(query: SearchQuery): Promise<SearchResult>;
  
  /**
   * 获取关联知识项
   */
  getRelated(id: string, options?: RelationOptions): Promise<KnowledgeItem[]>;
  
  /**
   * 批量操作
   */
  batch(operations: BatchOperation[]): Promise<BatchResult>;
}

export interface SearchQuery {
  /** 搜索文本 */
  text?: string;
  
  /** 类型过滤 */
  types?: KnowledgeItemType[];
  
  /** 标签过滤 */
  tags?: string[];
  
  /** 时间范围 */
  timeRange?: {
    from?: Date;
    to?: Date;
  };
  
  /** 分页 */
  pagination?: {
    offset: number;
    limit: number;
  };
  
  /** 排序 */
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface SearchResult {
  /** 搜索结果 */
  items: KnowledgeItem[];
  
  /** 总数 */
  total: number;
  
  /** 搜索元数据 */
  metadata?: Record<string, any>;
}

export interface RelationOptions {
  /** 关系类型过滤 */
  types?: RelationType[];
  
  /** 深度限制 */
  depth?: number;
  
  /** 方向限制 */
  direction?: 'incoming' | 'outgoing' | 'both';
}

export interface BatchOperation {
  /** 操作类型 */
  type: 'create' | 'update' | 'delete';
  
  /** 操作目标 */
  target: string | Partial<KnowledgeItem>;
  
  /** 操作参数 */
  params?: Record<string, any>;
}

export interface BatchResult {
  /** 成功的操作 */
  success: Array<{
    operation: BatchOperation;
    result: any;
  }>;
  
  /** 失败的操作 */
  errors: Array<{
    operation: BatchOperation;
    error: Error;
  }>;
} 
/**
 * HiNATA 核心数据结构类型定义
 * 
 * 这个文件定义了 HiNATA 数据结构的所有核心类型，
 * 作为 notcontrolOS 知识管理系统的基础。
 */

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * 唯一标识符类型
 */
export type UUID = string;

/**
 * ISO 8601 时间戳
 */
export type Timestamp = string;

/**
 * 访问控制级别
 */
export enum AccessLevel {
  /** 私有级别 - 仅用户本人可访问 */
  PRIVATE = 'PRIVATE',
  /** 模型可读级别 - 允许 AI 模型访问内容 */
  MODEL_READABLE = 'MODEL_READABLE',
  /** 共享级别 - 已被分享的内容 */
  SHARED = 'SHARED',
  /** Web3发布级别 - 已发布到Web3平台，可被指定Web3用户群体访问 */
  WEB3_PUBLISHED = 'WEB3_PUBLISHED'
}

/**
 * 内容格式类型
 */
export enum ContentFormat {
  PLAIN_TEXT = 'PLAIN_TEXT',
  MARKDOWN = 'MARKDOWN',
  HTML = 'HTML',
  JSON = 'JSON',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

/**
 * 引用关系类型
 */
export enum ReferenceType {
  /** 强关联引用 - 正式内容引用 [[Target]] */
  STRONG = 'STRONG',
  /** 弱关联引用 - 轻量内容引用 @TargetID */
  WEAK = 'WEAK',
  /** 层级引用 - 知识块层级关系 */
  HIERARCHICAL = 'HIERARCHICAL',
  /** 语义引用 - 基于语义相似性的引用 */
  SEMANTIC = 'SEMANTIC'
}

// ============================================================================
// HiNATA 核心数据结构
// ============================================================================

/**
 * HiNATA 核心结构
 * H - Highlight: 突出内容/标题
 * i - 连接符
 * N - Note: 笔记/正文内容
 * A - At: 来源/引用信息
 * T - Tag: 分类/标签
 * A - Access: 权限控制
 */
export interface HiNATACore {
  /** 突出内容/标题 */
  highlight: string;
  /** 笔记/正文内容 */
  note: string;
  /** 来源/引用信息 */
  at: string;
  /** 分类/标签 */
  tag: string[];
  /** 权限控制 */
  access: AccessLevel;
}

/**
 * 用户信息
 */
export interface User {
  id: UUID;
  username: string;
  email?: string;
  preferences: UserPreferences;
  subscription: SubscriptionLevel;
  security: SecuritySettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  language: string;
  timezone: string;
  defaultAccessLevel: AccessLevel;
  autoTagging: boolean;
  semanticLinking: boolean;
}

/**
 * 订阅级别
 */
export enum SubscriptionLevel {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

/**
 * 安全设置
 */
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  encryptionEnabled: boolean;
  dataRetentionDays?: number;
}

/**
 * 信息物料 (LibraryItem) - 第一层知识
 */
export interface LibraryItem {
  id: UUID;
  userId: UUID;
  
  // HiNATA 核心结构
  highlight: string;
  note: string;
  at: string;
  tag: string[];
  access: AccessLevel;
  
  // 元数据
  title?: string;
  contentFormat: ContentFormat;
  contentSize: number;
  readingProgress?: number;
  
  // 时间戳
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastAccessedAt?: Timestamp;
  
  // 统计信息
  viewCount: number;
  editCount: number;
  
  // 关联关系
  knowledgeBlocks: UUID[];
  parentItem?: UUID;
  childItems: UUID[];
}

/**
 * 知识块 (KnowledgeBlock) - 第二层知识
 */
export interface KnowledgeBlock {
  id: UUID;
  userId: UUID;
  libraryItemId: UUID;
  
  // HiNATA 核心结构
  highlight: string;
  note: string;
  at: string;
  tag: string[];
  access: AccessLevel;
  
  // 位置信息
  positionInItem?: PositionInfo;
  
  // 笔记项集合
  noteItems: NoteItem[];
  
  // 时间戳
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // 关联关系
  references: KnowledgeBlockReference[];
  backlinks: UUID[];
}

/**
 * 位置信息
 */
export interface PositionInfo {
  startOffset?: number;
  endOffset?: number;
  lineNumber?: number;
  columnNumber?: number;
  xpath?: string;
}

/**
 * 笔记项 (NoteItem)
 */
export interface NoteItem {
  id: UUID;
  knowledgeBlockId: UUID;
  content: string;
  contentFormat: ContentFormat;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 标签 (Tag)
 */
export interface Tag {
  id: UUID;
  name: string;
  normalizedName: string;
  userId?: UUID; // NULL 表示系统标签
  description?: string;
  color?: string;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 知识块引用 (KnowledgeBlockReference)
 */
export interface KnowledgeBlockReference {
  id: UUID;
  sourceBlockId: UUID;
  sourceNoteItemId?: UUID;
  targetBlockId: UUID;
  referenceType: ReferenceType;
  context?: string;
  createdAt: Timestamp;
}

// ============================================================================
// HiNATA 数据包结构
// ============================================================================

/**
 * 捕获源类型
 */
export enum CaptureSource {
  WEB_CLIPPER = 'WEB_CLIPPER',
  IOS_SHARE_EXTENSION = 'IOS_SHARE_EXTENSION',
  ANDROID_SHARE_EXTENSION = 'ANDROID_SHARE_EXTENSION',
  SCREENSHOT_OCR = 'SCREENSHOT_OCR',
  MANUAL_INPUT = 'MANUAL_INPUT',
  WECHAT_FORWARDER = 'WECHAT_FORWARDER',
  API_INGEST = 'API_INGEST'
}

/**
 * 用户行为类型
 */
export enum UserAction {
  QUICK_SAVE = 'QUICK_SAVE',
  DETAILED_EDIT = 'DETAILED_EDIT',
  HIGHLIGHT = 'HIGHLIGHT',
  BOOKMARK = 'BOOKMARK',
  SHARE = 'SHARE'
}

/**
 * 设备上下文
 */
export interface DeviceContext {
  deviceId: UUID;
  deviceType?: string;
  osVersion: string;
  appVersion: string;
  userAgent?: string;
  screenResolution?: string;
  timezone: string;
}

/**
 * HiNATA 数据包元数据
 */
export interface HiNATAPacketMetadata {
  packetId: UUID;
  captureSource: CaptureSource;
  captureTimestamp: Timestamp;
  userAction: UserAction;
  deviceContext: DeviceContext;
  attentionScoreRaw: number;
  processingFlags?: string[];
}

/**
 * HiNATA 数据包载荷
 */
export interface HiNATAPacketPayload extends HiNATACore {
  // 继承 HiNATA 核心结构
  // highlight, note, at, tag, access
  
  // 用户标识
  userId: UUID;
  
  // 额外的载荷信息
  contentFormat?: ContentFormat;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

/**
 * 附件信息
 */
export interface Attachment {
  id: UUID;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  localPath?: string;
  checksum: string;
}

/**
 * HiNATA 数据包
 */
export interface HiNATADataPacket {
  metadata: HiNATAPacketMetadata;
  payload: HiNATAPacketPayload;
}

// ============================================================================
// 查询和搜索相关类型
// ============================================================================

/**
 * 搜索查询
 */
export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SortOptions;
  pagination?: PaginationOptions;
}

/**
 * 搜索过滤器
 */
export interface SearchFilters {
  userId?: UUID;
  tags?: string[];
  accessLevel?: AccessLevel[];
  contentFormat?: ContentFormat[];
  dateRange?: DateRange;
  hasAttachments?: boolean;
}

/**
 * 日期范围
 */
export interface DateRange {
  start?: Timestamp;
  end?: Timestamp;
}

/**
 * 排序选项
 */
export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * 分页选项
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  items: (LibraryItem | KnowledgeBlock)[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// 批量操作类型
// ============================================================================

/**
 * 批量操作类型
 */
export enum BatchOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * 批量操作
 */
export interface BatchOperation {
  type: BatchOperationType;
  target: 'LibraryItem' | 'KnowledgeBlock' | 'Tag';
  data: any;
  id?: UUID;
}

/**
 * 批量操作结果
 */
export interface BatchResult {
  success: boolean;
  results: BatchOperationResult[];
  errors: BatchOperationError[];
}

/**
 * 批量操作单项结果
 */
export interface BatchOperationResult {
  operation: BatchOperation;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * 批量操作错误
 */
export interface BatchOperationError {
  operation: BatchOperation;
  error: string;
  code: string;
}

// ============================================================================
// 导出所有类型
// ============================================================================

export * from './validation';

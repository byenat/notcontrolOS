/**
 * HiNATA 主入口文件
 * 
 * 这个文件是 HiNATA 系统的主入口，导出所有核心组件和接口，
 * 为 notcontrolOS 提供统一的 HiNATA 集成点。
 */

// ============================================================================
// 核心类型导出
// ============================================================================

export {
  // 基础类型
  UUID,
  Timestamp,
  AccessLevel,
  ContentFormat,
  ReferenceType,
  CaptureSource,
  UserAction,
  SubscriptionLevel,
  
  // 核心数据结构
  HiNATACore,
  User,
  LibraryItem,
  KnowledgeBlock,
  NoteItem,
  Tag,
  KnowledgeBlockReference,
  
  // 数据包结构
  HiNATAPacketMetadata,
  HiNATAPacketPayload,
  HiNATADataPacket,
  
  // 查询和操作类型
  SearchQuery,
  SearchResult,
  BatchOperation,
  BatchResult,
  
  // 设备和位置信息
  DeviceContext,
  PositionInfo,
  UserPreferences,
  SecuritySettings,
  Attachment
} from './core/types';

// ============================================================================
// 核心功能导出
// ============================================================================

export {
  // 数据包构建和处理
  HiNATAPacketBuilder,
  createPacketTemplate,
  parsePacket,
  serializePacket,
  clonePacket,
  mergePackets,
  hashPacket,
  extractTextFromPacket,
  calculatePacketSimilarity
} from './core/packet';

export {
  // 验证功能
  ValidationResult,
  validateRequired,
  validateStringLength,
  validateUUID,
  validateTimestamp,
  validateEnum,
  validateArray,
  validateURL,
  validateHiNATAPacketMetadata,
  validateHiNATAPacketPayload,
  validateHiNATADataPacket,
  validateUser,
  validateLibraryItem,
  validateKnowledgeBlock,
  validateTag,
  validateBatch,
  validateDataIntegrity
} from './core/validation';

// ============================================================================
// 存储层导出
// ============================================================================

export {
  // 知识块存储
  KnowledgeBlockStorage,
  MemoryKnowledgeBlockStorage,
  KnowledgeBlockStatistics,
  TagUsage,
  knowledgeBlockStorage
} from './storage/knowledge_block';

export {
  // 数据包存储
  PacketStorage,
  MemoryPacketStorage,
  PacketSearchQuery,
  PacketSearchResult,
  PacketStatistics,
  AttentionTrendData,
  SimilarPacket,
  TimeRange,
  BatchStoreResult,
  BatchDeleteResult,
  StorageOptimizationResult,
  packetStorage
} from './storage/packet_storage';

export {
  // 知识项存储
  KnowledgeItemStorage,
  KnowledgeItemConfig,
  KnowledgeItemQuery,
  KnowledgeItemResult,
  KnowledgeItemStatistics,
  KnowledgeItemBatch,
  knowledgeItemStorage
} from './storage/knowledge_item';

export {
  // 关系存储
  RelationStorage,
  RelationType,
  RelationStrength,
  RelationRecord,
  RelationQuery,
  RelationGraph,
  RelationRecommendation,
  relationStorage
} from './storage/relations';

export {
  // 标签存储
  TagStorage,
  TagType,
  TagCategory,
  TagRecord,
  TagUsageRecord,
  TagQuery,
  TagRecommendation,
  TagStatistics,
  tagStorage
} from './storage/tags';

// ============================================================================
// API层导出
// ============================================================================

export {
  // 数据摄取引擎
  IngestionEngine,
  IngestionConfig,
  IngestionResult,
  BatchIngestionResult,
  StreamIngestionOptions,
  IngestionStatistics,
  ingestionEngine
} from './api/ingestion';

export {
  // 查询引擎
  QueryEngine,
  QueryConfig,
  QueryType,
  QueryOptions,
  QueryResult,
  QueryStatistics,
  QuerySuggestion,
  queryEngine
} from './api/query';

export {
  // 导出引擎
  ExportEngine,
  ExportFormat,
  ExportScope,
  ExportOptions,
  ExportResult,
  ExportProgress,
  exportEngine
} from './api/export';

export {
  // HiNATA API
  HiNATAAPI,
  APIConfig,
  APIStatistics,
  RequestContext,
  AccessControl,
  HealthStatus,
  hinataAPI
} from './api';

// ============================================================================
// 管理器导出
// ============================================================================

export {
  // HiNATA 管理器
  HiNATAManager,
  HiNATAConfig,
  HiNATASystemStatus,
  PacketProcessingResult,
  KnowledgeDiscoveryResult,
  hinataManager,
  createHiNATAManager
} from './manager';

// ============================================================================
// 内核接口导出
// ============================================================================

export {
  // 内核接口
  HiNATAKernelInterface,
  SystemCallResult,
  HiNATASystemCall,
  HiNATAEvent,
  HiNATAEventData,
  HiNATAEventListener,
  ResourceUsage,
  PermissionLevel,
  UserPermissions,
  hinataKernel,
  createHiNATAKernelInterface
} from './kernel_interface';

// ============================================================================
// 便捷工具函数
// ============================================================================

/**
 * HiNATA 系统快速初始化
 */
export async function initializeHiNATA(config?: Partial<import('./manager').HiNATAConfig>) {
  const { createHiNATAKernelInterface } = await import('./kernel_interface');
  const kernel = createHiNATAKernelInterface(config);
  
  const result = await kernel.initialize();
  if (!result.success) {
    throw new Error(`Failed to initialize HiNATA: ${result.error}`);
  }
  
  return kernel;
}

/**
 * 创建简单的数据包
 */
export function createSimplePacket(
  userId: UUID,
  highlight: string,
  note?: string,
  tags: string[] = [],
  source: CaptureSource = 'MANUAL_INPUT'
): import('./core/types').HiNATADataPacket {
  const { HiNATAPacketBuilder } = require('./core/packet');
  
  return new HiNATAPacketBuilder()
    .setUserId(userId)
    .setSource(source)
    .setHighlight(highlight)
    .setNote(note || '')
    .setTags(tags)
    .build();
}

/**
 * 快速搜索数据包
 */
export async function quickSearchPackets(
  query: string,
  userId?: UUID,
  limit: number = 20
): Promise<import('./storage/packet_storage').PacketSearchResult> {
  const { packetStorage } = await import('./storage/packet_storage');
  
  const searchQuery: import('./storage/packet_storage').PacketSearchQuery = {
    query,
    filters: userId ? { userId } : undefined,
    pagination: { page: 1, limit },
    sort: { field: 'captureTimestamp', direction: 'DESC' }
  };
  
  return await packetStorage.search(searchQuery);
}

/**
 * 快速搜索知识块
 */
export async function quickSearchKnowledgeBlocks(
  query: string,
  userId?: UUID,
  limit: number = 20
): Promise<import('./core/types').SearchResult> {
  const { knowledgeBlockStorage } = await import('./storage/knowledge_block');
  
  const searchQuery: import('./core/types').SearchQuery = {
    query,
    filters: userId ? { userId } : undefined,
    pagination: { page: 1, limit },
    sort: { field: 'updatedAt', direction: 'DESC' }
  };
  
  return await knowledgeBlockStorage.search(searchQuery);
}

/**
 * 使用查询引擎进行高级搜索
 */
export async function advancedSearch(
  query: string,
  options?: Partial<import('./api/query').QueryOptions>
): Promise<import('./api/query').QueryResult> {
  const { queryEngine } = await import('./api/query');
  
  return await queryEngine.query(query, {
    type: 'COMPOSITE',
    includeRelations: true,
    includeTags: true,
    ...options
  });
}

/**
 * 快速摄取数据
 */
export async function quickIngest(
  data: import('./core/types').HiNATADataPacket | import('./core/types').HiNATADataPacket[]
): Promise<import('./api/ingestion').IngestionResult | import('./api/ingestion').BatchIngestionResult> {
  const { ingestionEngine } = await import('./api/ingestion');
  
  if (Array.isArray(data)) {
    return await ingestionEngine.ingestBatch(data);
  } else {
    return await ingestionEngine.ingest(data);
  }
}

/**
 * 快速导出数据
 */
export async function quickExport(
  scope: import('./api/export').ExportScope,
  format: import('./api/export').ExportFormat = 'JSON',
  options?: Partial<import('./api/export').ExportOptions>
): Promise<import('./api/export').ExportResult> {
  const { exportEngine } = await import('./api/export');
  
  return await exportEngine.export(scope, format, {
    includeRelations: true,
    includeTags: true,
    includeMetadata: true,
    ...options
  });
}

/**
 * 获取用户统计信息
 */
export async function getUserStatistics(userId: UUID) {
  const { hinataManager } = await import('./manager');
  
  const [packetStats, blockStats, popularTags] = await Promise.all([
    hinataManager.getPacketStatistics(userId),
    hinataManager.getKnowledgeBlockStatistics(userId),
    hinataManager.getPopularTags(userId, 10)
  ]);
  
  return {
    packets: packetStats,
    knowledgeBlocks: blockStats,
    popularTags,
    summary: {
      totalPackets: packetStats.totalPackets,
      totalBlocks: blockStats.totalBlocks,
      totalNotes: blockStats.totalNoteItems,
      averageAttention: packetStats.averageAttentionScore
    }
  };
}

/**
 * 批量导入数据包
 */
export async function batchImportPackets(
  packets: import('./core/types').HiNATADataPacket[]
): Promise<import('./manager').PacketProcessingResult[]> {
  const { hinataManager } = await import('./manager');
  return await hinataManager.processPacketBatch(packets);
}

/**
 * 导出用户数据
 */
export async function exportUserData(userId: UUID) {
  const { hinataManager } = await import('./manager');
  
  const [packets, blocks] = await Promise.all([
    hinataManager.getUserPackets(userId, 10000), // 导出所有数据包
    hinataManager.getUserKnowledgeBlocks(userId, 10000) // 导出所有知识块
  ]);
  
  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    userId,
    data: {
      packets,
      knowledgeBlocks: blocks
    },
    statistics: {
      totalPackets: packets.length,
      totalBlocks: blocks.length,
      dateRange: {
        earliest: packets.length > 0 ? Math.min(...packets.map(p => new Date(p.metadata.captureTimestamp).getTime())) : null,
        latest: packets.length > 0 ? Math.max(...packets.map(p => new Date(p.metadata.captureTimestamp).getTime())) : null
      }
    }
  };
}

/**
 * 系统健康检查
 */
export async function healthCheck() {
  const { hinataKernel } = await import('./kernel_interface');
  
  try {
    const status = hinataKernel.getSystemStatus();
    const resourceUsage = hinataKernel.getResourceUsage();
    
    return {
      healthy: status.isInitialized && status.isRunning,
      status,
      resourceUsage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// 版本信息
// ============================================================================

export const HINATA_VERSION = '1.0.0';
export const HINATA_BUILD_DATE = new Date().toISOString();
export const HINATA_COMPATIBILITY = {
  notcontrolOS: '>=1.0.0',
  node: '>=16.0.0',
  typescript: '>=4.5.0'
};

// ============================================================================
// 默认配置
// ============================================================================

export const DEFAULT_HINATA_CONFIG: import('./manager').HiNATAConfig = {
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
    defaultAccessLevel: 'PRIVATE'
  },
  performance: {
    enableCaching: true,
    cacheSize: 1000,
    enableIndexing: true,
    batchSize: 100
  }
};

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 检查是否为有效的 HiNATA 数据包
 */
export function isHiNATADataPacket(obj: any): obj is import('./core/types').HiNATADataPacket {
  return obj &&
    typeof obj === 'object' &&
    obj.metadata &&
    obj.payload &&
    typeof obj.metadata.packetId === 'string' &&
    typeof obj.metadata.captureTimestamp === 'string' &&
    typeof obj.payload.highlight === 'string';
}

/**
 * 检查是否为有效的知识块
 */
export function isKnowledgeBlock(obj: any): obj is import('./core/types').KnowledgeBlock {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.libraryItemId === 'string' &&
    typeof obj.highlight === 'string' &&
    Array.isArray(obj.noteItems) &&
    Array.isArray(obj.references) &&
    Array.isArray(obj.backlinks);
}

/**
 * 检查是否为有效的 UUID
 */
export function isValidUUID(str: string): str is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================================================
// 错误类型
// ============================================================================

/**
 * HiNATA 基础错误类
 */
export class HiNATAError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HiNATAError';
  }
}

/**
 * 验证错误
 */
export class HiNATAValidationError extends HiNATAError {
  constructor(message: string, public validationErrors: string[]) {
    super(message, 'VALIDATION_ERROR', { validationErrors });
    this.name = 'HiNATAValidationError';
  }
}

/**
 * 存储错误
 */
export class HiNATAStorageError extends HiNATAError {
  constructor(message: string, public operation: string) {
    super(message, 'STORAGE_ERROR', { operation });
    this.name = 'HiNATAStorageError';
  }
}

/**
 * 权限错误
 */
export class HiNATAPermissionError extends HiNATAError {
  constructor(message: string, public userId: UUID, public operation: string) {
    super(message, 'PERMISSION_ERROR', { userId, operation });
    this.name = 'HiNATAPermissionError';
  }
}

// ============================================================================
// 调试和开发工具
// ============================================================================

/**
 * 启用调试模式
 */
export function enableDebugMode() {
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__HINATA_DEBUG__ = true;
  }
}

/**
 * 禁用调试模式
 */
export function disableDebugMode() {
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__HINATA_DEBUG__ = false;
  }
}

/**
 * 检查是否为调试模式
 */
export function isDebugMode(): boolean {
  return typeof globalThis !== 'undefined' && (globalThis as any).__HINATA_DEBUG__ === true;
}

/**
 * 调试日志
 */
export function debugLog(message: string, ...args: any[]) {
  if (isDebugMode()) {
    console.log(`[HiNATA Debug] ${message}`, ...args);
  }
}

// ============================================================================
// 模块信息
// ============================================================================

export const MODULE_INFO = {
  name: 'HiNATA',
  version: HINATA_VERSION,
  description: 'HiNATA (Highlight, Note, At, Tag, Access) - Core content and storage structure for notcontrolOS',
  author: 'ZentaN Team',
  license: 'MIT',
  repository: 'https://github.com/zentan/notcontrolOS',
  documentation: 'https://docs.zentan.ai/hinata',
  buildDate: HINATA_BUILD_DATE,
  compatibility: HINATA_COMPATIBILITY
};

// ============================================================================
// 导出说明
// ============================================================================

/**
 * HiNATA 系统导出说明：
 * 
 * 1. 核心类型 (core/types.ts):
 *    - 定义了所有基础数据结构和类型
 *    - 包括数据包、知识块、用户等核心概念
 * 
 * 2. 核心功能 (core/):
 *    - packet.ts: 数据包构建、解析、处理功能
 *    - validation.ts: 数据验证和完整性检查
 * 
 * 3. 存储层 (storage/):
 *    - knowledge_block.ts: 知识块存储和管理
 *    - packet_storage.ts: 数据包存储和索引
 *    - knowledge_item.ts: 知识项存储和管理
 *    - relations.ts: 关系存储和图谱构建
 *    - tags.ts: 智能标签系统
 * 
 * 4. API层 (api/):
 *    - ingestion.ts: 数据摄取引擎，处理数据接收和验证
 *    - query.ts: 查询引擎，提供多种查询和检索功能
 *    - export.ts: 导出引擎，支持多格式数据导出
 *    - index.ts: 统一API接口，整合所有功能
 * 
 * 5. 管理器 (manager.ts):
 *    - 整合所有组件的核心管理器
 *    - 提供高级 API 和业务逻辑
 * 
 * 6. 内核接口 (kernel_interface.ts):
 *    - 与 notcontrolOS 内核的集成接口
 *    - 系统调用、事件处理、权限管理
 * 
 * 7. 工具函数:
 *    - 快速初始化、搜索、统计等便捷功能
 *    - 数据导入导出、健康检查等实用工具
 *    - 高级搜索、快速摄取、快速导出等新功能
 * 
 * 使用示例：
 * ```typescript
 * import { 
 *   initializeHiNATA, 
 *   createSimplePacket, 
 *   quickSearchPackets,
 *   advancedSearch,
 *   quickIngest,
 *   quickExport,
 *   hinataAPI
 * } from './hinata';
 * 
 * // 初始化系统
 * const kernel = await initializeHiNATA();
 * 
 * // 创建数据包
 * const packet = createSimplePacket('user-123', 'Important note', 'Details...', ['work', 'important']);
 * 
 * // 快速摄取数据
 * await quickIngest(packet);
 * 
 * // 基础搜索
 * const basicResults = await quickSearchPackets('important', 'user-123');
 * 
 * // 高级搜索
 * const advancedResults = await advancedSearch('important work', {
 *   type: 'SEMANTIC',
 *   includeRelations: true,
 *   includeTags: true
 * });
 * 
 * // 导出数据
 * const exportResult = await quickExport(
 *   { type: 'USER', userId: 'user-123' },
 *   'JSON'
 * );
 * 
 * // 使用完整API
 * const api = hinataAPI;
 * const stats = await api.getStatistics();
 * ```
 */
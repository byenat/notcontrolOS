/**
 * HiNATA 数据验证规则
 * 
 * 这个文件定义了 HiNATA 数据结构的验证规则和验证函数，
 * 确保数据的完整性和一致性。
 */

import {
  HiNATADataPacket,
  HiNATAPacketMetadata,
  HiNATAPacketPayload,
  LibraryItem,
  KnowledgeBlock,
  Tag,
  User,
  CaptureSource,
  UserAction,
  AccessLevel,
  ContentFormat,
  ReferenceType
} from './types';

// ============================================================================
// 验证结果类型
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

// ============================================================================
// 基础验证函数
// ============================================================================

/**
 * 验证必需字段
 */
function validateRequired(value: any, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * 验证字符串长度
 */
function validateStringLength(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): string | null {
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  
  if (minLength !== undefined && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters long`;
  }
  
  return null;
}

/**
 * 验证 UUID 格式
 */
function validateUUID(value: string, fieldName: string): string | null {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(value)) {
    return `${fieldName} must be a valid UUID`;
  }
  return null;
}

/**
 * 验证 ISO 8601 时间戳
 */
function validateTimestamp(value: string, fieldName: string): string | null {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid ISO 8601 timestamp`;
  }
  return null;
}

/**
 * 验证枚举值
 */
function validateEnum<T>(
  value: T,
  enumObject: Record<string, T>,
  fieldName: string
): string | null {
  const validValues = Object.values(enumObject);
  if (!validValues.includes(value)) {
    return `${fieldName} must be one of: ${validValues.join(', ')}`;
  }
  return null;
}

/**
 * 验证数组
 */
function validateArray(
  value: any[],
  fieldName: string,
  minLength?: number,
  maxLength?: number
): string | null {
  if (!Array.isArray(value)) {
    return `${fieldName} must be an array`;
  }
  
  if (minLength !== undefined && value.length < minLength) {
    return `${fieldName} must have at least ${minLength} items`;
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    return `${fieldName} must have no more than ${maxLength} items`;
  }
  
  return null;
}

/**
 * 验证 URL 格式
 */
function validateURL(value: string, fieldName: string): string | null {
  try {
    new URL(value);
    return null;
  } catch {
    // 如果不是标准 URL，检查是否是有效的引用格式
    if (value.startsWith('file://') || value.startsWith('manual') || value.includes('://')) {
      return null;
    }
    return `${fieldName} must be a valid URL or reference`;
  }
}

// ============================================================================
// HiNATA 数据包验证
// ============================================================================

/**
 * 验证 HiNATA 数据包元数据
 */
export function validateHiNATAPacketMetadata(metadata: HiNATAPacketMetadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证必需字段
  const requiredError = validateRequired(metadata.packetId, 'packetId');
  if (requiredError) errors.push(requiredError);
  
  // 验证 UUID 格式
  if (metadata.packetId) {
    const uuidError = validateUUID(metadata.packetId, 'packetId');
    if (uuidError) errors.push(uuidError);
  }
  
  // 验证时间戳
  if (metadata.captureTimestamp) {
    const timestampError = validateTimestamp(metadata.captureTimestamp, 'captureTimestamp');
    if (timestampError) errors.push(timestampError);
  }
  
  // 验证枚举值
  if (metadata.captureSource) {
    const sourceError = validateEnum(metadata.captureSource, CaptureSource, 'captureSource');
    if (sourceError) errors.push(sourceError);
  }
  
  if (metadata.userAction) {
    const actionError = validateEnum(metadata.userAction, UserAction, 'userAction');
    if (actionError) errors.push(actionError);
  }
  
  // 验证注意力分数
  if (metadata.attentionScoreRaw !== undefined) {
    if (typeof metadata.attentionScoreRaw !== 'number' || metadata.attentionScoreRaw < 0) {
      errors.push('attentionScoreRaw must be a non-negative number');
    }
    if (metadata.attentionScoreRaw > 100) {
      warnings.push('attentionScoreRaw is unusually high (>100)');
    }
  }
  
  // 验证设备上下文
  if (metadata.deviceContext) {
    if (metadata.deviceContext.deviceId) {
      const deviceIdError = validateUUID(metadata.deviceContext.deviceId, 'deviceContext.deviceId');
      if (deviceIdError) errors.push(deviceIdError);
    }
    
    if (metadata.deviceContext.osVersion) {
      const osVersionError = validateStringLength(
        metadata.deviceContext.osVersion,
        'deviceContext.osVersion',
        1,
        50
      );
      if (osVersionError) errors.push(osVersionError);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证 HiNATA 数据包载荷
 */
export function validateHiNATAPacketPayload(payload: HiNATAPacketPayload): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证 highlight（必需）
  const highlightError = validateRequired(payload.highlight, 'highlight');
  if (highlightError) {
    errors.push(highlightError);
  } else {
    const lengthError = validateStringLength(payload.highlight, 'highlight', 1, 1000);
    if (lengthError) errors.push(lengthError);
  }
  
  // 验证 note（必需）
  const noteError = validateRequired(payload.note, 'note');
  if (noteError) {
    errors.push(noteError);
  } else {
    const lengthError = validateStringLength(payload.note, 'note', 0, 10000);
    if (lengthError) errors.push(lengthError);
  }
  
  // 验证 at（必需）
  const atError = validateRequired(payload.at, 'at');
  if (atError) {
    errors.push(atError);
  } else {
    const urlError = validateURL(payload.at, 'at');
    if (urlError) warnings.push(urlError); // URL 验证作为警告而非错误
  }
  
  // 验证 tag（必需）
  const tagError = validateRequired(payload.tag, 'tag');
  if (tagError) {
    errors.push(tagError);
  } else {
    const arrayError = validateArray(payload.tag, 'tag', 0, 20);
    if (arrayError) errors.push(arrayError);
    
    // 验证每个标签
    payload.tag.forEach((tag, index) => {
      const tagLengthError = validateStringLength(tag, `tag[${index}]`, 1, 50);
      if (tagLengthError) errors.push(tagLengthError);
    });
  }
  
  // 验证 access（必需）
  const accessError = validateRequired(payload.access, 'access');
  if (accessError) {
    errors.push(accessError);
  } else {
    const enumError = validateEnum(payload.access, AccessLevel, 'access');
    if (enumError) errors.push(enumError);
  }
  
  // 验证可选字段
  if (payload.contentFormat) {
    const formatError = validateEnum(payload.contentFormat, ContentFormat, 'contentFormat');
    if (formatError) errors.push(formatError);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证完整的 HiNATA 数据包
 */
export function validateHiNATAPacket(packet: HiNATADataPacket): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证顶级结构
  if (!packet.metadata) {
    errors.push('metadata is required');
  }
  
  if (!packet.payload) {
    errors.push('payload is required');
  }
  
  // 验证元数据
  if (packet.metadata) {
    const metadataValidation = validateHiNATAPacketMetadata(packet.metadata);
    errors.push(...metadataValidation.errors);
    warnings.push(...metadataValidation.warnings);
  }
  
  // 验证载荷
  if (packet.payload) {
    const payloadValidation = validateHiNATAPacketPayload(packet.payload);
    errors.push(...payloadValidation.errors);
    warnings.push(...payloadValidation.warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// 其他数据结构验证
// ============================================================================

/**
 * 验证用户数据
 */
export function validateUser(user: User): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证必需字段
  const idError = validateRequired(user.id, 'id');
  if (idError) errors.push(idError);
  
  const usernameError = validateRequired(user.username, 'username');
  if (usernameError) errors.push(usernameError);
  
  // 验证格式
  if (user.id) {
    const uuidError = validateUUID(user.id, 'id');
    if (uuidError) errors.push(uuidError);
  }
  
  if (user.username) {
    const lengthError = validateStringLength(user.username, 'username', 3, 50);
    if (lengthError) errors.push(lengthError);
  }
  
  if (user.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(user.email)) {
      errors.push('email must be a valid email address');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证信息物料
 */
export function validateLibraryItem(item: LibraryItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证必需字段
  const requiredFields = ['id', 'userId', 'highlight', 'note', 'at', 'tag', 'access'];
  requiredFields.forEach(field => {
    const error = validateRequired((item as any)[field], field);
    if (error) errors.push(error);
  });
  
  // 验证 UUID 字段
  if (item.id) {
    const idError = validateUUID(item.id, 'id');
    if (idError) errors.push(idError);
  }
  
  if (item.userId) {
    const userIdError = validateUUID(item.userId, 'userId');
    if (userIdError) errors.push(userIdError);
  }
  
  // 验证内容长度
  if (item.highlight) {
    const highlightError = validateStringLength(item.highlight, 'highlight', 1, 1000);
    if (highlightError) errors.push(highlightError);
  }
  
  if (item.note) {
    const noteError = validateStringLength(item.note, 'note', 0, 50000);
    if (noteError) errors.push(noteError);
  }
  
  // 验证枚举值
  if (item.access) {
    const accessError = validateEnum(item.access, AccessLevel, 'access');
    if (accessError) errors.push(accessError);
  }
  
  if (item.contentFormat) {
    const formatError = validateEnum(item.contentFormat, ContentFormat, 'contentFormat');
    if (formatError) errors.push(formatError);
  }
  
  // 验证数组
  if (item.tag) {
    const tagError = validateArray(item.tag, 'tag', 0, 50);
    if (tagError) errors.push(tagError);
  }
  
  // 验证统计数据
  if (item.viewCount !== undefined && item.viewCount < 0) {
    errors.push('viewCount must be non-negative');
  }
  
  if (item.editCount !== undefined && item.editCount < 0) {
    errors.push('editCount must be non-negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证知识块
 */
export function validateKnowledgeBlock(block: KnowledgeBlock): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证必需字段
  const requiredFields = ['id', 'userId', 'libraryItemId', 'highlight', 'note', 'at', 'tag', 'access'];
  requiredFields.forEach(field => {
    const error = validateRequired((block as any)[field], field);
    if (error) errors.push(error);
  });
  
  // 验证 UUID 字段
  const uuidFields = ['id', 'userId', 'libraryItemId'];
  uuidFields.forEach(field => {
    const value = (block as any)[field];
    if (value) {
      const uuidError = validateUUID(value, field);
      if (uuidError) errors.push(uuidError);
    }
  });
  
  // 验证笔记项数组
  if (block.noteItems) {
    const arrayError = validateArray(block.noteItems, 'noteItems', 0, 100);
    if (arrayError) errors.push(arrayError);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证标签
 */
export function validateTag(tag: Tag): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证必需字段
  const requiredFields = ['id', 'name', 'normalizedName'];
  requiredFields.forEach(field => {
    const error = validateRequired((tag as any)[field], field);
    if (error) errors.push(error);
  });
  
  // 验证格式
  if (tag.id) {
    const idError = validateUUID(tag.id, 'id');
    if (idError) errors.push(idError);
  }
  
  if (tag.name) {
    const nameError = validateStringLength(tag.name, 'name', 1, 50);
    if (nameError) errors.push(nameError);
  }
  
  if (tag.normalizedName) {
    const normalizedError = validateStringLength(tag.normalizedName, 'normalizedName', 1, 50);
    if (normalizedError) errors.push(normalizedError);
  }
  
  // 验证使用统计
  if (tag.usageCount !== undefined && tag.usageCount < 0) {
    errors.push('usageCount must be non-negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// 批量验证函数
// ============================================================================

/**
 * 批量验证 HiNATA 数据包
 */
export function validateHiNATAPacketBatch(packets: HiNATADataPacket[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  packets.forEach((packet, index) => {
    const validation = validateHiNATAPacket(packet);
    validation.errors.forEach(error => {
      errors.push(`Packet ${index}: ${error}`);
    });
    validation.warnings.forEach(warning => {
      warnings.push(`Packet ${index}: ${warning}`);
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证数据完整性（检查引用关系等）
 */
export function validateDataIntegrity(
  libraryItems: LibraryItem[],
  knowledgeBlocks: KnowledgeBlock[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const libraryItemIds = new Set(libraryItems.map(item => item.id));
  const knowledgeBlockIds = new Set(knowledgeBlocks.map(block => block.id));
  
  // 检查知识块的 libraryItemId 引用
  knowledgeBlocks.forEach(block => {
    if (!libraryItemIds.has(block.libraryItemId)) {
      errors.push(`KnowledgeBlock ${block.id} references non-existent LibraryItem ${block.libraryItemId}`);
    }
  });
  
  // 检查信息物料的知识块引用
  libraryItems.forEach(item => {
    item.knowledgeBlocks.forEach(blockId => {
      if (!knowledgeBlockIds.has(blockId)) {
        errors.push(`LibraryItem ${item.id} references non-existent KnowledgeBlock ${blockId}`);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
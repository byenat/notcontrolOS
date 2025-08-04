/**
 * HiNATA 数据包 (HiNATA Data Packet) 实现
 * 
 * 这个文件实现了 HiNATA 数据包的创建、验证、序列化和反序列化功能，
 * 作为 notcontrolOS 中信息流动的标准原子单元。
 */

import {
  HiNATADataPacket,
  HiNATAPacketMetadata,
  HiNATAPacketPayload,
  CaptureSource,
  UserAction,
  DeviceContext,
  AccessLevel,
  ContentFormat,
  UUID,
  Timestamp
} from './types';
import { validateHiNATAPacket } from './validation';

// ============================================================================
// HiNATA 数据包工厂类
// ============================================================================

/**
 * HiNATA 数据包构建器
 */
export class HiNATAPacketBuilder {
  private metadata: Partial<HiNATAPacketMetadata> = {};
  private payload: Partial<HiNATAPacketPayload> = {};

  /**
   * 设置捕获源
   */
  setCaptureSource(source: CaptureSource): this {
    this.metadata.captureSource = source;
    return this;
  }

  /**
   * 设置用户行为
   */
  setUserAction(action: UserAction): this {
    this.metadata.userAction = action;
    return this;
  }

  /**
   * 设置设备上下文
   */
  setDeviceContext(context: DeviceContext): this {
    this.metadata.deviceContext = context;
    return this;
  }

  /**
   * 设置原始注意力分数
   */
  setAttentionScore(score: number): this {
    this.metadata.attentionScoreRaw = score;
    return this;
  }

  /**
   * 设置高亮内容
   */
  setHighlight(highlight: string): this {
    this.payload.highlight = highlight;
    return this;
  }

  /**
   * 设置笔记内容
   */
  setNote(note: string): this {
    this.payload.note = note;
    return this;
  }

  /**
   * 设置来源信息
   */
  setAt(at: string): this {
    this.payload.at = at;
    return this;
  }

  /**
   * 设置标签
   */
  setTags(tags: string[]): this {
    this.payload.tag = tags;
    return this;
  }

  /**
   * 添加标签
   */
  addTag(tag: string): this {
    if (!this.payload.tag) {
      this.payload.tag = [];
    }
    this.payload.tag.push(tag);
    return this;
  }

  /**
   * 设置访问级别
   */
  setAccessLevel(access: AccessLevel): this {
    this.payload.access = access;
    return this;
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: UUID): this {
    this.payload.userId = userId;
    return this;
  }

  /**
   * 设置内容格式
   */
  setContentFormat(format: ContentFormat): this {
    this.payload.contentFormat = format;
    return this;
  }

  /**
   * 构建数据包
   */
  build(): HiNATADataPacket {
    // 生成必需的字段
    const packetId = this.generateUUID();
    const timestamp = new Date().toISOString();

    // 构建完整的元数据
    const metadata: HiNATAPacketMetadata = {
      packetId,
      captureTimestamp: timestamp,
      captureSource: this.metadata.captureSource || CaptureSource.MANUAL_INPUT,
      userAction: this.metadata.userAction || UserAction.QUICK_SAVE,
      deviceContext: this.metadata.deviceContext || this.getDefaultDeviceContext(),
      attentionScoreRaw: this.metadata.attentionScoreRaw || this.calculateDefaultAttentionScore(),
      ...this.metadata
    };

    // 构建完整的载荷
    const payload: HiNATAPacketPayload = {
      userId: this.payload.userId || this.generateUUID(), // 默认生成一个用户ID
      highlight: this.payload.highlight || '',
      note: this.payload.note || '',
      at: this.payload.at || '',
      tag: this.payload.tag || [],
      access: this.payload.access || AccessLevel.PRIVATE,
      contentFormat: this.payload.contentFormat || ContentFormat.PLAIN_TEXT,
      ...this.payload
    };

    const packet: HiNATADataPacket = {
      metadata,
      payload
    };

    // 验证数据包
    const validation = validateHiNATAPacket(packet);
    if (!validation.isValid) {
      throw new Error(`Invalid HiNATA packet: ${validation.errors.join(', ')}`);
    }

    return packet;
  }

  /**
   * 生成 UUID
   */
  private generateUUID(): UUID {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 获取默认设备上下文
   */
  private getDefaultDeviceContext(): DeviceContext {
    return {
      deviceId: this.generateUUID(),
      osVersion: 'Unknown',
      appVersion: '1.0.0',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * 计算默认注意力分数
   */
  private calculateDefaultAttentionScore(): number {
    const sourceScore = this.getSourceScore(this.metadata.captureSource);
    const actionScore = this.getActionScore(this.metadata.userAction);
    return sourceScore + actionScore;
  }

  /**
   * 获取捕获源分数
   */
  private getSourceScore(source?: CaptureSource): number {
    const scores = {
      [CaptureSource.MANUAL_INPUT]: 10,
      [CaptureSource.WEB_CLIPPER]: 8,
      [CaptureSource.SCREENSHOT_OCR]: 7,
      [CaptureSource.IOS_SHARE_EXTENSION]: 6,
      [CaptureSource.ANDROID_SHARE_EXTENSION]: 6,
      [CaptureSource.WECHAT_FORWARDER]: 5,
      [CaptureSource.API_INGEST]: 3
    };
    return scores[source || CaptureSource.MANUAL_INPUT] || 5;
  }

  /**
   * 获取用户行为分数
   */
  private getActionScore(action?: UserAction): number {
    const scores = {
      [UserAction.DETAILED_EDIT]: 10,
      [UserAction.HIGHLIGHT]: 8,
      [UserAction.BOOKMARK]: 6,
      [UserAction.SHARE]: 5,
      [UserAction.QUICK_SAVE]: 3
    };
    return scores[action || UserAction.QUICK_SAVE] || 5;
  }
}

// ============================================================================
// HiNATA 数据包工具函数
// ============================================================================

/**
 * 创建 HiNATA 数据包构建器
 */
export function createHiNATAPacket(): HiNATAPacketBuilder {
  return new HiNATAPacketBuilder();
}

/**
 * 从 JSON 字符串解析 HiNATA 数据包
 */
export function parseHiNATAPacket(json: string): HiNATADataPacket {
  try {
    const packet = JSON.parse(json) as HiNATADataPacket;
    const validation = validateHiNATAPacket(packet);
    
    if (!validation.isValid) {
      throw new Error(`Invalid HiNATA packet: ${validation.errors.join(', ')}`);
    }
    
    return packet;
  } catch (error) {
    throw new Error(`Failed to parse HiNATA packet: ${error}`);
  }
}

/**
 * 将 HiNATA 数据包序列化为 JSON 字符串
 */
export function serializeHiNATAPacket(packet: HiNATADataPacket): string {
  const validation = validateHiNATAPacket(packet);
  
  if (!validation.isValid) {
    throw new Error(`Invalid HiNATA packet: ${validation.errors.join(', ')}`);
  }
  
  return JSON.stringify(packet, null, 2);
}

/**
 * 克隆 HiNATA 数据包
 */
export function cloneHiNATAPacket(packet: HiNATADataPacket): HiNATADataPacket {
  return JSON.parse(JSON.stringify(packet));
}

/**
 * 合并两个 HiNATA 数据包的载荷
 */
export function mergeHiNATAPayloads(
  base: HiNATAPacketPayload,
  override: Partial<HiNATAPacketPayload>
): HiNATAPacketPayload {
  return {
    ...base,
    ...override,
    tag: [...(base.tag || []), ...(override.tag || [])].filter((tag, index, arr) => 
      arr.indexOf(tag) === index
    )
  };
}

/**
 * 计算 HiNATA 数据包的内容哈希
 */
export function calculatePacketHash(packet: HiNATADataPacket): string {
  const content = {
    highlight: packet.payload.highlight,
    note: packet.payload.note,
    at: packet.payload.at
  };
  
  // 简单的哈希实现（生产环境应使用更强的哈希算法）
  const str = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString(16);
}

/**
 * 提取 HiNATA 数据包中的所有文本内容
 */
export function extractTextContent(packet: HiNATADataPacket): string {
  const parts = [
    packet.payload.highlight,
    packet.payload.note,
    packet.payload.at,
    ...(packet.payload.tag || [])
  ].filter(Boolean);
  
  return parts.join(' ');
}

/**
 * 检查两个 HiNATA 数据包是否相似
 */
export function arePacketsSimilar(
  packet1: HiNATADataPacket,
  packet2: HiNATADataPacket,
  threshold: number = 0.8
): boolean {
  const text1 = extractTextContent(packet1).toLowerCase();
  const text2 = extractTextContent(packet2).toLowerCase();
  
  // 简单的相似度计算（生产环境应使用更复杂的算法）
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  const similarity = intersection.size / union.size;
  return similarity >= threshold;
}

// ============================================================================
// 预定义的数据包模板
// ============================================================================

/**
 * 网页剪藏数据包模板
 */
export function createWebClipperPacket(
  url: string,
  title: string,
  selectedText: string,
  note?: string
): HiNATADataPacket {
  return createHiNATAPacket()
    .setCaptureSource(CaptureSource.WEB_CLIPPER)
    .setUserAction(UserAction.HIGHLIGHT)
    .setHighlight(title)
    .setNote(note || selectedText)
    .setAt(url)
    .addTag('web')
    .addTag('article')
    .setAccessLevel(AccessLevel.MODEL_READABLE)
    .setContentFormat(ContentFormat.HTML)
    .build();
}

/**
 * 从数据包中提取文本内容
 */
export function extractTextFromPacket(packet: HiNATADataPacket): string {
  const parts = [
    packet.payload.highlight,
    packet.payload.note,
    packet.payload.at,
    ...(packet.payload.tag || [])
  ].filter(Boolean);
  
  return parts.join(' ');
}

/**
 * 计算两个数据包的相似度
 */
export function calculatePacketSimilarity(packet1: HiNATADataPacket, packet2: HiNATADataPacket): number {
  const text1 = extractTextFromPacket(packet1).toLowerCase();
  const text2 = extractTextFromPacket(packet2).toLowerCase();
  
  // 简单的相似度计算：基于共同词汇的比例
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * 手动输入数据包模板
 */
export function createManualInputPacket(
  title: string,
  content: string,
  tags?: string[]
): HiNATADataPacket {
  const builder = createHiNATAPacket()
    .setCaptureSource(CaptureSource.MANUAL_INPUT)
    .setUserAction(UserAction.DETAILED_EDIT)
    .setHighlight(title)
    .setNote(content)
    .setAt('manual')
    .setAccessLevel(AccessLevel.PRIVATE)
    .setContentFormat(ContentFormat.MARKDOWN);
  
  if (tags) {
    tags.forEach(tag => builder.addTag(tag));
  }
  
  return builder.build();
}

/**
 * 截图 OCR 数据包模板
 */
export function createScreenshotOCRPacket(
  ocrText: string,
  imagePath: string,
  note?: string
): HiNATADataPacket {
  return createHiNATAPacket()
    .setCaptureSource(CaptureSource.SCREENSHOT_OCR)
    .setUserAction(UserAction.QUICK_SAVE)
    .setHighlight(ocrText.substring(0, 100)) // 前100字符作为标题
    .setNote(note || ocrText)
    .setAt(imagePath)
    .addTag('screenshot')
    .addTag('ocr')
    .setAccessLevel(AccessLevel.PRIVATE)
    .setContentFormat(ContentFormat.PLAIN_TEXT)
    .build();
}
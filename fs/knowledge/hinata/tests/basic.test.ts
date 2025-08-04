/**
 * HiNATA 基础功能测试
 * 
 * 这个文件包含了 HiNATA 系统的基础功能测试，
 * 验证核心组件的正确性和集成性。
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

import {
  HiNATAPacketBuilder,
  createSimplePacket,
  validateHiNATADataPacket,
  MemoryPacketStorage,
  MemoryKnowledgeBlockStorage,
  HiNATAManager,
  initializeHiNATA,
  isHiNATADataPacket,
  isKnowledgeBlock,
  isValidUUID
} from '../index';

import {
  HiNATADataPacket,
  KnowledgeBlock,
  UUID,
  Timestamp,
  AccessLevel,
  CaptureSource
} from '../core/types';

// ============================================================================
// 测试数据
// ============================================================================

const TEST_USER_ID: UUID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_LIBRARY_ITEM_ID: UUID = '550e8400-e29b-41d4-a716-446655440001';

const SAMPLE_PACKET_DATA = {
  highlight: 'This is a test highlight',
  note: 'This is a test note with additional context',
  tags: ['test', 'sample', 'development'],
  source: 'MANUAL_INPUT' as CaptureSource,
  url: 'https://example.com/test-page',
  title: 'Test Page Title'
};

// ============================================================================
// 数据包构建测试
// ============================================================================

describe('HiNATA Packet Builder', () => {
  test('should create a valid packet with builder pattern', () => {
    const packet = new HiNATAPacketBuilder()
      .setUserId(TEST_USER_ID)
      .setSource(SAMPLE_PACKET_DATA.source)
      .setHighlight(SAMPLE_PACKET_DATA.highlight)
      .setNote(SAMPLE_PACKET_DATA.note)
      .setTags(SAMPLE_PACKET_DATA.tags)
      .setUrl(SAMPLE_PACKET_DATA.url)
      .setTitle(SAMPLE_PACKET_DATA.title)
      .build();

    expect(isHiNATADataPacket(packet)).toBe(true);
    expect(packet.payload.userId).toBe(TEST_USER_ID);
    expect(packet.metadata.capture_source).toBe(SAMPLE_PACKET_DATA.source);
    expect(packet.payload.highlight).toBe(SAMPLE_PACKET_DATA.highlight);
    expect(packet.payload.note).toBe(SAMPLE_PACKET_DATA.note);
    expect(packet.payload.tag).toEqual(SAMPLE_PACKET_DATA.tags);
    expect(packet.payload.url).toBe(SAMPLE_PACKET_DATA.url);
    expect(packet.payload.title).toBe(SAMPLE_PACKET_DATA.title);
  });

  test('should create a simple packet with helper function', () => {
    const packet = createSimplePacket(
      TEST_USER_ID,
      SAMPLE_PACKET_DATA.highlight,
      SAMPLE_PACKET_DATA.note,
      SAMPLE_PACKET_DATA.tags,
      SAMPLE_PACKET_DATA.source
    );

    expect(isHiNATADataPacket(packet)).toBe(true);
    expect(packet.payload.userId).toBe(TEST_USER_ID);
    expect(packet.payload.highlight).toBe(SAMPLE_PACKET_DATA.highlight);
    expect(packet.payload.note).toBe(SAMPLE_PACKET_DATA.note);
    expect(packet.payload.tags).toEqual(SAMPLE_PACKET_DATA.tags);
  });

  test('should validate packet structure', () => {
    const packet = createSimplePacket(
      TEST_USER_ID,
      SAMPLE_PACKET_DATA.highlight
    );

    const validation = validateHiNATADataPacket(packet);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should fail validation for invalid packet', () => {
    const invalidPacket = {
      metadata: {
        packet_id: 'invalid-uuid',
        // userId: TEST_USER_ID, // 移除不存在的属性
        capture_timestamp: 'invalid-timestamp',
        capture_source: 'INVALID_SOURCE'
      },
      payload: {
        highlight: '', // Empty highlight should fail
        note: '',
        tags: []
      }
    } as any;

    const validation = validateHiNATADataPacket(invalidPacket);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 存储层测试
// ============================================================================

describe('HiNATA Storage Layer', () => {
  let packetStorage: MemoryPacketStorage;
  let knowledgeBlockStorage: MemoryKnowledgeBlockStorage;
  let testPacket: HiNATADataPacket;

  beforeEach(() => {
    packetStorage = new MemoryPacketStorage();
    knowledgeBlockStorage = new MemoryKnowledgeBlockStorage();
    testPacket = createSimplePacket(
      TEST_USER_ID,
      SAMPLE_PACKET_DATA.highlight,
      SAMPLE_PACKET_DATA.note,
      SAMPLE_PACKET_DATA.tags
    );
  });

  describe('Packet Storage', () => {
    test('should store and retrieve packets', async () => {
      const stored = await packetStorage.store(testPacket);
      expect(stored).toBe(true);

      const retrieved = await packetStorage.getById(testPacket.metadata.packetId);
      expect(retrieved).toEqual(testPacket);
    });

    test('should search packets by query', async () => {
      await packetStorage.store(testPacket);

      const searchResult = await packetStorage.search({
        query: 'test highlight',
        pagination: { page: 1, limit: 10 }
      });

      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0]).toEqual(testPacket);
      expect(searchResult.total).toBe(1);
    });

    test('should get packets by user', async () => {
      await packetStorage.store(testPacket);

      const userPackets = await packetStorage.getByUser(TEST_USER_ID, 10);
      expect(userPackets).toHaveLength(1);
      expect(userPackets[0]).toEqual(testPacket);
    });

    test('should delete packets', async () => {
      await packetStorage.store(testPacket);
      
      const deleted = await packetStorage.delete(testPacket.metadata.packetId);
      expect(deleted).toBe(true);

      const retrieved = await packetStorage.getById(testPacket.metadata.packetId);
      expect(retrieved).toBeNull();
    });

    test('should get packet statistics', async () => {
      await packetStorage.store(testPacket);

      const stats = await packetStorage.getStatistics(TEST_USER_ID);
      expect(stats.totalPackets).toBe(1);
      expect(stats.totalPackets).toBeGreaterThan(0);
      expect(stats.averageAttentionScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Knowledge Block Storage', () => {
    test('should create and retrieve knowledge blocks', async () => {
      const blockData = {
        userId: TEST_USER_ID,
        libraryItemId: TEST_LIBRARY_ITEM_ID,
        highlight: SAMPLE_PACKET_DATA.highlight,
        at: new Date().toISOString() as Timestamp,
        tag: [],
        note: '',
        access: AccessLevel.PRIVATE,
        positionInItem: { startOffset: 0, endOffset: 0 },
        noteItems: [],
        tags: SAMPLE_PACKET_DATA.tags,
        references: [],
        backlinks: []
      };

      const created = await knowledgeBlockStorage.create(blockData);
      expect(isKnowledgeBlock(created)).toBe(true);
      expect(created.userId).toBe(TEST_USER_ID);
      expect(created.highlight).toBe(SAMPLE_PACKET_DATA.highlight);

      const retrieved = await knowledgeBlockStorage.getById(created.id);
      expect(retrieved).toEqual(created);
    });

    test('should search knowledge blocks', async () => {
      const blockData = {
        userId: TEST_USER_ID,
        libraryItemId: TEST_LIBRARY_ITEM_ID,
        highlight: SAMPLE_PACKET_DATA.highlight,
        at: new Date().toISOString() as Timestamp,
        tag: [],
        note: '',
        access: AccessLevel.PRIVATE,
        positionInItem: { startOffset: 0, endOffset: 0 },
        noteItems: [],
        tags: SAMPLE_PACKET_DATA.tags,
        references: [],
        backlinks: []
      };

      const created = await knowledgeBlockStorage.create(blockData);

      const searchResult = await knowledgeBlockStorage.search({
        query: 'test highlight',
        pagination: { page: 1, limit: 10 }
      });

      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0]).toEqual(created);
    });

    test('should get knowledge block statistics', async () => {
      const blockData = {
        userId: TEST_USER_ID,
        libraryItemId: TEST_LIBRARY_ITEM_ID,
        highlight: SAMPLE_PACKET_DATA.highlight,
        at: new Date().toISOString() as Timestamp,
        tag: [],
        note: '',
        access: AccessLevel.PRIVATE,
        positionInItem: { startOffset: 0, endOffset: 0 },
        noteItems: [],
        tags: SAMPLE_PACKET_DATA.tags,
        references: [],
        backlinks: []
      };

      await knowledgeBlockStorage.create(blockData);

      const stats = await knowledgeBlockStorage.getStatistics(TEST_USER_ID);
      expect(stats.totalBlocks).toBe(1);
      expect(stats.totalNoteItems).toBe(0);
      expect(stats.averageNotesPerBlock).toBe(0);
    });
  });
});

// ============================================================================
// 管理器集成测试
// ============================================================================

describe('HiNATA Manager Integration', () => {
  let manager: HiNATAManager;
  let testPacket: HiNATADataPacket;

  beforeEach(async () => {
    manager = new HiNATAManager({
      storage: { type: 'memory' },
      processing: {
        enableAutoTagging: true,
        enableSimilarityDetection: true,
        attentionScoreThreshold: 0.5,
        maxPacketsPerUser: 1000,
        cleanupInterval: 3600000
      },
      security: {
        enableEncryption: false,
        enableAccessControl: true,
        defaultAccessLevel: AccessLevel.PRIVATE
      },
      performance: {
        enableCaching: true,
        cacheSize: 100,
        enableIndexing: true,
        batchSize: 10
      }
    });

    await manager.initialize();
    await manager.start();

    testPacket = createSimplePacket(
      TEST_USER_ID,
      SAMPLE_PACKET_DATA.highlight,
      SAMPLE_PACKET_DATA.note,
      SAMPLE_PACKET_DATA.tags
    );
  });

  afterEach(async () => {
    await manager.stop();
  });

  test('should process packets and create knowledge blocks', async () => {
    const result = await manager.processPacket(testPacket);
    
    expect(result.success).toBe(true);
    expect(result.packetId).toBe(testPacket.metadata.packetId);
    expect(result.knowledgeBlockId).toBeDefined();

    // Verify the knowledge block was created
    if (result.knowledgeBlockId) {
      const block = await manager.getKnowledgeBlock(result.knowledgeBlockId);
      expect(block).toBeDefined();
      expect(block?.highlight).toBe(SAMPLE_PACKET_DATA.highlight);
    }
  });

  test('should search across packets and knowledge blocks', async () => {
    await manager.processPacket(testPacket);

    const packetResults = await manager.searchPackets({
      query: 'test highlight',
      pagination: { page: 1, limit: 10 }
    });

    expect(packetResults.items).toHaveLength(1);

    const blockResults = await manager.searchKnowledgeBlocks({
      query: 'test highlight',
      filters: { userId: TEST_USER_ID },
      pagination: { page: 1, limit: 10 }
    });

    expect(blockResults.items).toHaveLength(1);
  });

  test('should get system statistics', async () => {
    await manager.processPacket(testPacket);

    const packetStats = await manager.getPacketStatistics(TEST_USER_ID);
    expect(packetStats.totalPackets).toBe(1);

    const blockStats = await manager.getKnowledgeBlockStatistics(TEST_USER_ID);
    expect(blockStats.totalBlocks).toBe(1);

    const popularTags = await manager.getPopularTags(TEST_USER_ID, 5);
    expect(popularTags.length).toBeGreaterThan(0);
  });

  test('should handle batch processing', async () => {
    const packets = [
      testPacket,
      createSimplePacket(TEST_USER_ID, 'Second highlight', 'Second note', ['batch', 'test']),
      createSimplePacket(TEST_USER_ID, 'Third highlight', 'Third note', ['batch', 'processing'])
    ];

    const results = await manager.processPacketBatch(packets);
    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);

    const stats = await manager.getPacketStatistics(TEST_USER_ID);
    expect(stats.totalPackets).toBe(3);
  });
});

// ============================================================================
// 系统初始化测试
// ============================================================================

describe('HiNATA System Initialization', () => {
  test('should initialize system with default config', async () => {
    const kernel = await initializeHiNATA();
    expect(kernel).toBeDefined();
    
    const status = kernel.getSystemStatus();
    expect(status.isInitialized).toBe(true);
    expect(status.isRunning).toBe(true);

    await kernel.shutdown();
  });

  test('should initialize system with custom config', async () => {
    const customConfig = {
      storage: { type: 'memory' as const },
      processing: {
        enableAutoTagging: false,
        enableSimilarityDetection: false,
        attentionScoreThreshold: 0.7,
        maxPacketsPerUser: 500,
        cleanupInterval: 1800000
      }
    };

    const kernel = await initializeHiNATA(customConfig);
    expect(kernel).toBeDefined();

    const status = kernel.getSystemStatus();
    expect(status.isInitialized).toBe(true);

    await kernel.shutdown();
  });
});

// ============================================================================
// 工具函数测试
// ============================================================================

describe('HiNATA Utility Functions', () => {
  test('should validate UUIDs correctly', () => {
    expect(isValidUUID(TEST_USER_ID)).toBe(true);
    expect(isValidUUID('invalid-uuid')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false); // Too short
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000x')).toBe(false); // Too long
  });

  test('should identify HiNATA data packets', () => {
    const validPacket = createSimplePacket(TEST_USER_ID, 'Test highlight');
    expect(isHiNATADataPacket(validPacket)).toBe(true);

    const invalidPacket = {
      metadata: { packet_id: 'test' },
      // Missing required fields
    };
    expect(isHiNATADataPacket(invalidPacket)).toBe(false);
  });

  test('should identify knowledge blocks', () => {
    const validBlock = {
      id: TEST_LIBRARY_ITEM_ID,
      userId: TEST_USER_ID,
      libraryItemId: TEST_LIBRARY_ITEM_ID,
      highlight: 'Test highlight',
      noteItems: [],
      references: [],
      backlinks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(isKnowledgeBlock(validBlock)).toBe(true);

    const invalidBlock = {
      id: TEST_LIBRARY_ITEM_ID,
      // Missing required fields
    };
    expect(isKnowledgeBlock(invalidBlock)).toBe(false);
  });
});

// ============================================================================
// 性能测试
// ============================================================================

describe('HiNATA Performance Tests', () => {
  test('should handle large batch operations efficiently', async () => {
    const manager = new HiNATAManager({
      storage: { type: 'memory' },
      processing: {
        enableAutoTagging: false, // Disable for performance
        enableSimilarityDetection: false,
        attentionScoreThreshold: 0.5,
        maxPacketsPerUser: 10000,
        cleanupInterval: 3600000
      },
      performance: {
        enableCaching: true,
        cacheSize: 1000,
        enableIndexing: true,
        batchSize: 100
      }
    });

    await manager.initialize();
    await manager.start();

    const startTime = Date.now();
    
    // Create 100 test packets
    const packets = Array.from({ length: 100 }, (_, i) => 
      createSimplePacket(
        TEST_USER_ID,
        `Test highlight ${i}`,
        `Test note ${i}`,
        [`tag${i}`, 'performance', 'test']
      )
    );

    const results = await manager.processPacketBatch(packets);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(results).toHaveLength(100);
    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    console.log(`Batch processing of 100 packets took ${duration}ms`);

    await manager.stop();
  }, 10000); // 10 second timeout
});
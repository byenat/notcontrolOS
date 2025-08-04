/*
 * HiNATA Storage Layer - Header File
 * Part of notcontrolOS Knowledge Management System
 * 
 * This header defines storage layer interfaces, data structures, and constants
 * for persistent storage of HiNATA packets and knowledge blocks.
 */

#ifndef _HINATA_STORAGE_H
#define _HINATA_STORAGE_H

#include <linux/types.h>
#include <linux/atomic.h>
#include <linux/mutex.h>
#include <linux/spinlock.h>
#include <linux/list.h>
#include <linux/rbtree.h>
#include <linux/workqueue.h>
#include <linux/timer.h>
#include "../hinata_types.h"

/* Storage constants */
#define HINATA_STORAGE_VERSION          "1.0.0"
#define HINATA_STORAGE_MAX_PATH         256
#define HINATA_STORAGE_MAX_NAME         64
#define HINATA_STORAGE_MAX_REGIONS      64
#define HINATA_STORAGE_DEFAULT_SIZE     (1024 * 1024 * 1024)  /* 1GB */
#define HINATA_STORAGE_MIN_SIZE         (1024 * 1024)          /* 1MB */
#define HINATA_STORAGE_MAX_SIZE         (1024ULL * 1024 * 1024 * 1024)  /* 1TB */
#define HINATA_STORAGE_BLOCK_SIZE       4096
#define HINATA_STORAGE_CACHE_SIZE       1024
#define HINATA_STORAGE_ALL_REGIONS      0xFFFFFFFF

/* Storage type definitions */
enum hinata_storage_type {
    HINATA_STORAGE_TYPE_UNKNOWN = 0,
    HINATA_STORAGE_TYPE_PACKET,
    HINATA_STORAGE_TYPE_KNOWLEDGE_BLOCK,
    HINATA_STORAGE_TYPE_INDEX,
    HINATA_STORAGE_TYPE_METADATA,
    HINATA_STORAGE_TYPE_TEMPORARY,
    HINATA_STORAGE_TYPE_BACKUP,
    HINATA_STORAGE_TYPE_ARCHIVE,
    HINATA_STORAGE_TYPE_CACHE,
    HINATA_STORAGE_TYPE_LOG,
    HINATA_STORAGE_TYPE_MAX
};

/* Storage access modes */
enum hinata_storage_mode {
    HINATA_STORAGE_MODE_READ_ONLY = 0,
    HINATA_STORAGE_MODE_WRITE_ONLY,
    HINATA_STORAGE_MODE_READ_WRITE,
    HINATA_STORAGE_MODE_APPEND,
    HINATA_STORAGE_MODE_CREATE,
    HINATA_STORAGE_MODE_TRUNCATE,
    HINATA_STORAGE_MODE_MAX
};

/* Storage compression types */
enum hinata_storage_compression {
    HINATA_STORAGE_COMPRESSION_NONE = 0,
    HINATA_STORAGE_COMPRESSION_LZ4,
    HINATA_STORAGE_COMPRESSION_ZLIB,
    HINATA_STORAGE_COMPRESSION_ZSTD,
    HINATA_STORAGE_COMPRESSION_BROTLI,
    HINATA_STORAGE_COMPRESSION_MAX
};

/* Storage encryption types */
enum hinata_storage_encryption {
    HINATA_STORAGE_ENCRYPTION_NONE = 0,
    HINATA_STORAGE_ENCRYPTION_AES128,
    HINATA_STORAGE_ENCRYPTION_AES256,
    HINATA_STORAGE_ENCRYPTION_CHACHA20,
    HINATA_STORAGE_ENCRYPTION_MAX
};

/* Storage operation types */
enum hinata_storage_operation {
    HINATA_STORAGE_OP_CREATE = 0,
    HINATA_STORAGE_OP_READ,
    HINATA_STORAGE_OP_WRITE,
    HINATA_STORAGE_OP_UPDATE,
    HINATA_STORAGE_OP_DELETE,
    HINATA_STORAGE_OP_SYNC,
    HINATA_STORAGE_OP_COMPACT,
    HINATA_STORAGE_OP_BACKUP,
    HINATA_STORAGE_OP_RESTORE,
    HINATA_STORAGE_OP_VERIFY,
    HINATA_STORAGE_OP_MAX
};

/* Storage flags */
#define HINATA_STORAGE_FLAG_DIRTY           (1 << 0)
#define HINATA_STORAGE_FLAG_CACHED          (1 << 1)
#define HINATA_STORAGE_FLAG_COMPRESSED      (1 << 2)
#define HINATA_STORAGE_FLAG_ENCRYPTED       (1 << 3)
#define HINATA_STORAGE_FLAG_READONLY        (1 << 4)
#define HINATA_STORAGE_FLAG_TEMPORARY       (1 << 5)
#define HINATA_STORAGE_FLAG_PINNED          (1 << 6)
#define HINATA_STORAGE_FLAG_SYNCING         (1 << 7)
#define HINATA_STORAGE_FLAG_COMPACTING      (1 << 8)
#define HINATA_STORAGE_FLAG_BACKING_UP      (1 << 9)
#define HINATA_STORAGE_FLAG_RESTORING       (1 << 10)
#define HINATA_STORAGE_FLAG_VERIFYING       (1 << 11)
#define HINATA_STORAGE_FLAG_CORRUPTED       (1 << 12)
#define HINATA_STORAGE_FLAG_RECOVERING      (1 << 13)
#define HINATA_STORAGE_FLAG_MIGRATING       (1 << 14)
#define HINATA_STORAGE_FLAG_OPTIMIZING      (1 << 15)

/* Cache flags */
#define HINATA_CACHE_FLAG_DIRTY             (1 << 0)
#define HINATA_CACHE_FLAG_PINNED            (1 << 1)
#define HINATA_CACHE_FLAG_COMPRESSED        (1 << 2)
#define HINATA_CACHE_FLAG_ENCRYPTED         (1 << 3)
#define HINATA_CACHE_FLAG_TEMPORARY         (1 << 4)
#define HINATA_CACHE_FLAG_PREFETCHED        (1 << 5)
#define HINATA_CACHE_FLAG_WRITE_THROUGH     (1 << 6)
#define HINATA_CACHE_FLAG_WRITE_BACK        (1 << 7)

/* Cache constants */
#define HINATA_CACHE_DEFAULT_TTL            (60 * 1000000000ULL)  /* 60 seconds in nanoseconds */
#define HINATA_CACHE_MAX_ENTRIES            4096
#define HINATA_CACHE_MAX_SIZE               (256 * 1024 * 1024)   /* 256MB */
#define HINATA_CACHE_EVICTION_THRESHOLD     0.8                   /* 80% */
#define HINATA_CACHE_CLEANUP_INTERVAL       30000                 /* 30 seconds */

/* Forward declarations */
struct hinata_packet;
struct hinata_knowledge_block;
struct hinata_storage_region;
struct hinata_storage_context;
struct hinata_storage_cache_entry;

/**
 * struct hinata_storage_stats - Storage statistics
 * @packets_stored: Number of packets stored
 * @packets_loaded: Number of packets loaded
 * @packets_deleted: Number of packets deleted
 * @blocks_stored: Number of knowledge blocks stored
 * @blocks_loaded: Number of knowledge blocks loaded
 * @blocks_deleted: Number of knowledge blocks deleted
 * @bytes_written: Total bytes written
 * @bytes_read: Total bytes read
 * @cache_hits: Cache hit count
 * @cache_misses: Cache miss count
 * @cache_evictions: Cache eviction count
 * @sync_operations: Sync operation count
 * @compact_operations: Compact operation count
 * @backup_operations: Backup operation count
 * @restore_operations: Restore operation count
 * @verify_operations: Verify operation count
 * @errors: Error count
 * @warnings: Warning count
 */
struct hinata_storage_stats {
    atomic64_t packets_stored;
    atomic64_t packets_loaded;
    atomic64_t packets_deleted;
    atomic64_t blocks_stored;
    atomic64_t blocks_loaded;
    atomic64_t blocks_deleted;
    atomic64_t bytes_written;
    atomic64_t bytes_read;
    atomic64_t cache_hits;
    atomic64_t cache_misses;
    atomic64_t cache_evictions;
    atomic64_t sync_operations;
    atomic64_t compact_operations;
    atomic64_t backup_operations;
    atomic64_t restore_operations;
    atomic64_t verify_operations;
    atomic64_t errors;
    atomic64_t warnings;
};

/**
 * struct hinata_storage_config - Storage configuration
 * @cache_size: Cache size in bytes
 * @cache_ttl: Cache TTL in nanoseconds
 * @sync_interval: Sync interval in milliseconds
 * @compact_threshold: Compaction threshold (0.0-1.0)
 * @compression_type: Compression type
 * @encryption_type: Encryption type
 * @backup_enabled: Backup enabled flag
 * @verify_enabled: Verification enabled flag
 * @auto_compact: Auto compaction enabled flag
 * @write_through: Write-through cache enabled flag
 * @read_ahead: Read-ahead enabled flag
 * @max_regions: Maximum number of regions
 * @default_region_size: Default region size
 * @block_size: Storage block size
 * @reserved: Reserved for future use
 */
struct hinata_storage_config {
    u64 cache_size;
    u64 cache_ttl;
    u32 sync_interval;
    u32 compact_threshold;
    enum hinata_storage_compression compression_type;
    enum hinata_storage_encryption encryption_type;
    bool backup_enabled;
    bool verify_enabled;
    bool auto_compact;
    bool write_through;
    bool read_ahead;
    u32 max_regions;
    u64 default_region_size;
    u32 block_size;
    u8 reserved[32];
};

/**
 * struct hinata_storage_info - Storage information
 * @version: Storage version
 * @total_size: Total storage size
 * @used_size: Used storage size
 * @free_size: Free storage size
 * @region_count: Number of regions
 * @packet_count: Number of stored packets
 * @block_count: Number of stored knowledge blocks
 * @cache_size: Current cache size
 * @cache_entries: Number of cache entries
 * @fragmentation: Fragmentation percentage
 * @compression_ratio: Compression ratio
 * @last_sync: Last sync timestamp
 * @last_compact: Last compaction timestamp
 * @last_backup: Last backup timestamp
 * @uptime: Storage uptime
 * @config: Storage configuration
 * @stats: Storage statistics
 */
struct hinata_storage_info {
    struct hinata_version version;
    u64 total_size;
    u64 used_size;
    u64 free_size;
    u32 region_count;
    u64 packet_count;
    u64 block_count;
    u64 cache_size;
    u32 cache_entries;
    u32 fragmentation;
    u32 compression_ratio;
    u64 last_sync;
    u64 last_compact;
    u64 last_backup;
    u64 uptime;
    struct hinata_storage_config config;
    struct hinata_storage_stats stats;
};

/**
 * struct hinata_storage_query - Storage query parameters
 * @type: Query type
 * @region_id: Target region ID
 * @start_time: Start time filter
 * @end_time: End time filter
 * @packet_type: Packet type filter
 * @source_filter: Source filter
 * @tag_filter: Tag filter
 * @content_filter: Content filter
 * @limit: Result limit
 * @offset: Result offset
 * @sort_by: Sort field
 * @sort_order: Sort order (ascending/descending)
 * @flags: Query flags
 */
struct hinata_storage_query {
    enum hinata_storage_operation type;
    u32 region_id;
    u64 start_time;
    u64 end_time;
    u32 packet_type;
    char source_filter[64];
    char tag_filter[128];
    char content_filter[256];
    u32 limit;
    u32 offset;
    u32 sort_by;
    u32 sort_order;
    u32 flags;
};

/**
 * struct hinata_storage_result - Storage query result
 * @count: Number of results
 * @total_count: Total number of matching items
 * @packets: Array of packet pointers
 * @blocks: Array of knowledge block pointers
 * @metadata: Result metadata
 * @execution_time: Query execution time
 * @flags: Result flags
 */
struct hinata_storage_result {
    u32 count;
    u32 total_count;
    struct hinata_packet **packets;
    struct hinata_knowledge_block **blocks;
    void *metadata;
    u64 execution_time;
    u32 flags;
};

/**
 * struct hinata_storage_transaction - Storage transaction
 * @id: Transaction ID
 * @type: Transaction type
 * @state: Transaction state
 * @start_time: Start time
 * @timeout: Timeout
 * @operations: List of operations
 * @rollback_data: Rollback data
 * @flags: Transaction flags
 * @lock: Transaction lock
 */
struct hinata_storage_transaction {
    u64 id;
    u32 type;
    u32 state;
    u64 start_time;
    u64 timeout;
    struct list_head operations;
    void *rollback_data;
    u32 flags;
    struct mutex lock;
};

/**
 * struct hinata_storage_backup - Storage backup information
 * @id: Backup ID
 * @name: Backup name
 * @path: Backup path
 * @type: Backup type
 * @size: Backup size
 * @created_time: Creation time
 * @region_mask: Backed up regions mask
 * @compression: Compression type used
 * @encryption: Encryption type used
 * @checksum: Backup checksum
 * @flags: Backup flags
 */
struct hinata_storage_backup {
    u64 id;
    char name[64];
    char path[256];
    u32 type;
    u64 size;
    u64 created_time;
    u64 region_mask;
    enum hinata_storage_compression compression;
    enum hinata_storage_encryption encryption;
    u32 checksum;
    u32 flags;
};

/* Core storage functions */
int hinata_storage_init(void);
void hinata_storage_cleanup(void);
int hinata_storage_start(void);
int hinata_storage_stop(void);
int hinata_storage_suspend(void);
int hinata_storage_resume(void);
int hinata_storage_reset(void);

/* Region management */
int hinata_storage_create_region(const char *name, const char *path,
                                enum hinata_storage_type type, u64 size);
int hinata_storage_destroy_region(u32 region_id);
int hinata_storage_resize_region(u32 region_id, u64 new_size);
int hinata_storage_get_region_info(u32 region_id, struct hinata_storage_info *info);
int hinata_storage_list_regions(u32 *region_ids, u32 max_count);
int hinata_storage_find_region(const char *name);

/* Packet storage operations */
int hinata_storage_store_packet(const struct hinata_packet *packet, u32 region_id);
int hinata_storage_load_packet(const char *packet_id, u32 region_id,
                              struct hinata_packet **packet);
int hinata_storage_update_packet(const struct hinata_packet *packet, u32 region_id);
int hinata_storage_delete_packet(const char *packet_id, u32 region_id);
int hinata_storage_exists_packet(const char *packet_id, u32 region_id);
int hinata_storage_query_packets(const struct hinata_storage_query *query,
                                struct hinata_storage_result *result);

/* Knowledge block storage operations */
int hinata_storage_store_block(const struct hinata_knowledge_block *block, u32 region_id);
int hinata_storage_load_block(const char *block_id, u32 region_id,
                             struct hinata_knowledge_block **block);
int hinata_storage_update_block(const struct hinata_knowledge_block *block, u32 region_id);
int hinata_storage_delete_block(const char *block_id, u32 region_id);
int hinata_storage_exists_block(const char *block_id, u32 region_id);
int hinata_storage_query_blocks(const struct hinata_storage_query *query,
                               struct hinata_storage_result *result);

/* Batch operations */
int hinata_storage_store_packets_batch(struct hinata_packet **packets, u32 count,
                                      u32 region_id, u32 *stored_count);
int hinata_storage_load_packets_batch(char **packet_ids, u32 count, u32 region_id,
                                     struct hinata_packet **packets, u32 *loaded_count);
int hinata_storage_delete_packets_batch(char **packet_ids, u32 count,
                                       u32 region_id, u32 *deleted_count);
int hinata_storage_store_blocks_batch(struct hinata_knowledge_block **blocks, u32 count,
                                     u32 region_id, u32 *stored_count);
int hinata_storage_load_blocks_batch(char **block_ids, u32 count, u32 region_id,
                                    struct hinata_knowledge_block **blocks, u32 *loaded_count);
int hinata_storage_delete_blocks_batch(char **block_ids, u32 count,
                                      u32 region_id, u32 *deleted_count);

/* Cache management */
void *hinata_storage_cache_get(const char *key, size_t *size);
int hinata_storage_cache_put(const char *key, const void *data, size_t size);
int hinata_storage_cache_remove(const char *key);
void hinata_storage_cache_put_ref(const char *key);
int hinata_storage_cache_clear(void);
int hinata_storage_cache_flush(void);
int hinata_storage_cache_set_ttl(const char *key, u64 ttl);
int hinata_storage_cache_pin(const char *key);
int hinata_storage_cache_unpin(const char *key);
int hinata_storage_cache_prefetch(char **keys, u32 count);
int hinata_storage_cache_get_stats(struct hinata_storage_stats *stats);

/* Synchronization and persistence */
int hinata_storage_sync(u32 region_id);
int hinata_storage_sync_all(void);
int hinata_storage_flush(u32 region_id);
int hinata_storage_flush_all(void);
int hinata_storage_checkpoint(u32 region_id);
int hinata_storage_checkpoint_all(void);

/* Maintenance operations */
int hinata_storage_compact(u32 region_id);
int hinata_storage_compact_all(void);
int hinata_storage_verify(u32 region_id);
int hinata_storage_verify_all(void);
int hinata_storage_repair(u32 region_id);
int hinata_storage_repair_all(void);
int hinata_storage_optimize(u32 region_id);
int hinata_storage_optimize_all(void);

/* Backup and restore */
int hinata_storage_backup_create(const char *name, const char *path,
                                u32 region_mask, struct hinata_storage_backup *backup);
int hinata_storage_backup_restore(const struct hinata_storage_backup *backup,
                                 u32 target_region_mask);
int hinata_storage_backup_delete(u64 backup_id);
int hinata_storage_backup_list(struct hinata_storage_backup *backups, u32 max_count);
int hinata_storage_backup_verify(u64 backup_id);

/* Transaction support */
int hinata_storage_transaction_begin(struct hinata_storage_transaction **transaction);
int hinata_storage_transaction_commit(struct hinata_storage_transaction *transaction);
int hinata_storage_transaction_rollback(struct hinata_storage_transaction *transaction);
int hinata_storage_transaction_add_operation(struct hinata_storage_transaction *transaction,
                                            enum hinata_storage_operation op_type,
                                            const void *data, size_t size);

/* Configuration management */
int hinata_storage_get_config(struct hinata_storage_config *config);
int hinata_storage_set_config(const struct hinata_storage_config *config);
int hinata_storage_reset_config(void);

/* Information and statistics */
int hinata_storage_get_info(struct hinata_storage_info *info);
int hinata_storage_get_stats(struct hinata_storage_stats *stats);
void hinata_storage_reset_stats(void);
int hinata_storage_get_health(void);
const char *hinata_storage_get_version(void);

/* Event and monitoring */
typedef void (*hinata_storage_event_callback_t)(u32 event_type, const void *data, size_t size);
int hinata_storage_register_event_callback(hinata_storage_event_callback_t callback);
int hinata_storage_unregister_event_callback(hinata_storage_event_callback_t callback);
int hinata_storage_trigger_event(u32 event_type, const void *data, size_t size);

/* Debug and diagnostics */
void hinata_storage_dump_info(void);
void hinata_storage_dump_stats(void);
void hinata_storage_dump_cache(void);
void hinata_storage_dump_regions(void);
int hinata_storage_self_test(void);
int hinata_storage_stress_test(u32 duration_ms);

/* Utility functions */
const char *hinata_storage_type_to_string(enum hinata_storage_type type);
const char *hinata_storage_mode_to_string(enum hinata_storage_mode mode);
const char *hinata_storage_compression_to_string(enum hinata_storage_compression compression);
const char *hinata_storage_encryption_to_string(enum hinata_storage_encryption encryption);
const char *hinata_storage_operation_to_string(enum hinata_storage_operation operation);
u64 hinata_storage_calculate_size(u32 packet_count, u32 avg_packet_size);
u32 hinata_storage_calculate_regions(u64 total_size, u64 region_size);
float hinata_storage_calculate_fragmentation(u64 total_size, u64 used_size, u64 free_size);
float hinata_storage_calculate_compression_ratio(u64 original_size, u64 compressed_size);

/* Inline utility functions */

/**
 * hinata_storage_is_valid_region - Check if region ID is valid
 * @region_id: Region ID to check
 * 
 * Returns: true if valid, false otherwise
 */
static inline bool hinata_storage_is_valid_region(u32 region_id)
{
    return region_id < HINATA_STORAGE_MAX_REGIONS;
}

/**
 * hinata_storage_is_valid_size - Check if size is valid
 * @size: Size to check
 * 
 * Returns: true if valid, false otherwise
 */
static inline bool hinata_storage_is_valid_size(u64 size)
{
    return size >= HINATA_STORAGE_MIN_SIZE && size <= HINATA_STORAGE_MAX_SIZE;
}

/**
 * hinata_storage_align_size - Align size to block boundary
 * @size: Size to align
 * 
 * Returns: Aligned size
 */
static inline u64 hinata_storage_align_size(u64 size)
{
    return HINATA_ALIGN_UP(size, HINATA_STORAGE_BLOCK_SIZE);
}

/**
 * hinata_storage_blocks_to_size - Convert blocks to size
 * @blocks: Number of blocks
 * 
 * Returns: Size in bytes
 */
static inline u64 hinata_storage_blocks_to_size(u64 blocks)
{
    return blocks * HINATA_STORAGE_BLOCK_SIZE;
}

/**
 * hinata_storage_size_to_blocks - Convert size to blocks
 * @size: Size in bytes
 * 
 * Returns: Number of blocks
 */
static inline u64 hinata_storage_size_to_blocks(u64 size)
{
    return HINATA_DIV_ROUND_UP(size, HINATA_STORAGE_BLOCK_SIZE);
}

/**
 * hinata_storage_is_compressed - Check if compression is enabled
 * @flags: Storage flags
 * 
 * Returns: true if compressed, false otherwise
 */
static inline bool hinata_storage_is_compressed(u32 flags)
{
    return (flags & HINATA_STORAGE_FLAG_COMPRESSED) != 0;
}

/**
 * hinata_storage_is_encrypted - Check if encryption is enabled
 * @flags: Storage flags
 * 
 * Returns: true if encrypted, false otherwise
 */
static inline bool hinata_storage_is_encrypted(u32 flags)
{
    return (flags & HINATA_STORAGE_FLAG_ENCRYPTED) != 0;
}

/**
 * hinata_storage_is_readonly - Check if storage is read-only
 * @flags: Storage flags
 * 
 * Returns: true if read-only, false otherwise
 */
static inline bool hinata_storage_is_readonly(u32 flags)
{
    return (flags & HINATA_STORAGE_FLAG_READONLY) != 0;
}

/**
 * hinata_storage_is_dirty - Check if storage is dirty
 * @flags: Storage flags
 * 
 * Returns: true if dirty, false otherwise
 */
static inline bool hinata_storage_is_dirty(u32 flags)
{
    return (flags & HINATA_STORAGE_FLAG_DIRTY) != 0;
}

/**
 * hinata_storage_is_cached - Check if data is cached
 * @flags: Storage flags
 * 
 * Returns: true if cached, false otherwise
 */
static inline bool hinata_storage_is_cached(u32 flags)
{
    return (flags & HINATA_STORAGE_FLAG_CACHED) != 0;
}

/**
 * hinata_storage_is_temporary - Check if storage is temporary
 * @flags: Storage flags
 * 
 * Returns: true if temporary, false otherwise
 */
static inline bool hinata_storage_is_temporary(u32 flags)
{
    return (flags & HINATA_STORAGE_FLAG_TEMPORARY) != 0;
}

/**
 * hinata_storage_is_pinned - Check if data is pinned in cache
 * @flags: Cache flags
 * 
 * Returns: true if pinned, false otherwise
 */
static inline bool hinata_storage_is_pinned(u32 flags)
{
    return (flags & HINATA_STORAGE_FLAG_PINNED) != 0;
}

/**
 * hinata_storage_cache_hash - Calculate cache hash
 * @key: Cache key
 * 
 * Returns: Hash value
 */
static inline u32 hinata_storage_cache_hash(const char *key)
{
    return hash_str(key, HINATA_STORAGE_CACHE_SIZE);
}

/**
 * hinata_storage_get_free_space - Calculate free space percentage
 * @total_size: Total size
 * @used_size: Used size
 * 
 * Returns: Free space percentage (0-100)
 */
static inline u32 hinata_storage_get_free_space(u64 total_size, u64 used_size)
{
    if (total_size == 0) {
        return 0;
    }
    return (u32)(((total_size - used_size) * 100) / total_size);
}

/**
 * hinata_storage_get_usage_percentage - Calculate usage percentage
 * @total_size: Total size
 * @used_size: Used size
 * 
 * Returns: Usage percentage (0-100)
 */
static inline u32 hinata_storage_get_usage_percentage(u64 total_size, u64 used_size)
{
    if (total_size == 0) {
        return 0;
    }
    return (u32)((used_size * 100) / total_size);
}

/**
 * hinata_storage_is_full - Check if storage is full
 * @total_size: Total size
 * @used_size: Used size
 * @threshold: Full threshold percentage (0-100)
 * 
 * Returns: true if full, false otherwise
 */
static inline bool hinata_storage_is_full(u64 total_size, u64 used_size, u32 threshold)
{
    return hinata_storage_get_usage_percentage(total_size, used_size) >= threshold;
}

/**
 * hinata_storage_needs_compaction - Check if compaction is needed
 * @fragmentation: Fragmentation percentage
 * @threshold: Compaction threshold percentage
 * 
 * Returns: true if compaction is needed, false otherwise
 */
static inline bool hinata_storage_needs_compaction(u32 fragmentation, u32 threshold)
{
    return fragmentation >= threshold;
}

#endif /* _HINATA_STORAGE_H */
/*
 * HiNATA Core Types and Constants
 * Part of notcontrolOS Knowledge Management System
 * 
 * This header defines core types, structures, and constants
 * used throughout the HiNATA knowledge system.
 */

#ifndef _HINATA_TYPES_H
#define _HINATA_TYPES_H

#include <linux/types.h>
#include <linux/atomic.h>
#include <linux/mutex.h>
#include <linux/spinlock.h>
#include <linux/list.h>
#include <linux/rbtree.h>
#include <linux/hashtable.h>

/* Version Information */
#define HINATA_VERSION_MAJOR    1
#define HINATA_VERSION_MINOR    0
#define HINATA_VERSION_PATCH    0
#define HINATA_VERSION_STRING   "1.0.0"

/* Magic Numbers */
#define HINATA_PACKET_MAGIC     0x48494E41  /* "HINA" */
#define HINATA_BLOCK_MAGIC      0x424C4F43  /* "BLOC" */
#define HINATA_SYSTEM_MAGIC     0x53595354  /* "SYST" */

/* Version Numbers */
#define HINATA_PACKET_VERSION   1
#define HINATA_BLOCK_VERSION    1
#define HINATA_SYSTEM_VERSION   1

/* Size Limits */
#define HINATA_MAX_CONTENT_SIZE     (1024 * 1024)      /* 1MB */
#define HINATA_MAX_METADATA_SIZE    (64 * 1024)        /* 64KB */
#define HINATA_MAX_PACKET_SIZE      (2 * 1024 * 1024)  /* 2MB */
#define HINATA_MAX_BLOCK_SIZE       (16 * 1024 * 1024) /* 16MB */
#define HINATA_MAX_BATCH_SIZE       1000
#define HINATA_MAX_SEARCH_RESULTS   10000

/* String Limits */
#define HINATA_UUID_LENGTH          37      /* UUID string length including null terminator */
#define HINATA_MAX_SOURCE_LENGTH    256     /* Maximum source identifier length */
#define HINATA_MAX_TAGS             16      /* Maximum number of tags */
#define HINATA_MAX_TAG_LENGTH       64      /* Maximum length of a single tag */
#define HINATA_MAX_NAME_LENGTH      128     /* Maximum name length */
#define HINATA_MAX_PATH_LENGTH      512     /* Maximum path length */
#define HINATA_MAX_DESCRIPTION_LENGTH 1024  /* Maximum description length */

/* Hash Table Sizes */
#define HINATA_PACKET_HASH_BITS     8       /* 256 buckets */
#define HINATA_BLOCK_HASH_BITS      6       /* 64 buckets */
#define HINATA_STORAGE_HASH_BITS    10      /* 1024 buckets */

/* Cache Sizes */
#define HINATA_PACKET_CACHE_SIZE    1024
#define HINATA_BLOCK_CACHE_SIZE     256
#define HINATA_VALIDATION_CACHE_SIZE 512
#define HINATA_SEARCH_CACHE_SIZE    128

/* Timeout Values (in milliseconds) */
#define HINATA_DEFAULT_TIMEOUT      5000
#define HINATA_VALIDATION_TIMEOUT   1000
#define HINATA_SEARCH_TIMEOUT       10000
#define HINATA_STORAGE_TIMEOUT      30000

/* Memory Limits */
#define HINATA_MAX_MEMORY_USAGE     (256 * 1024 * 1024)  /* 256MB */
#define HINATA_MEMORY_WARNING_THRESHOLD (200 * 1024 * 1024)  /* 200MB */
#define HINATA_MEMORY_CRITICAL_THRESHOLD (240 * 1024 * 1024)  /* 240MB */

/* Performance Limits */
#define HINATA_MAX_CONCURRENT_OPERATIONS    100
#define HINATA_MAX_QUEUE_SIZE              1000
#define HINATA_MAX_WORKER_THREADS          8

/* Forward Declarations */
struct hinata_packet;
struct hinata_knowledge_block;
struct hinata_storage_layer;
struct hinata_manager;
struct hinata_system_state;

/**
 * enum hinata_error_code - HiNATA error codes
 * @HINATA_SUCCESS: Operation successful
 * @HINATA_ERROR_INVALID_PARAM: Invalid parameter
 * @HINATA_ERROR_NO_MEMORY: Out of memory
 * @HINATA_ERROR_NOT_FOUND: Item not found
 * @HINATA_ERROR_EXISTS: Item already exists
 * @HINATA_ERROR_PERMISSION: Permission denied
 * @HINATA_ERROR_TIMEOUT: Operation timed out
 * @HINATA_ERROR_IO: I/O error
 * @HINATA_ERROR_CORRUPTION: Data corruption detected
 * @HINATA_ERROR_VERSION: Version mismatch
 * @HINATA_ERROR_CAPACITY: Capacity exceeded
 * @HINATA_ERROR_BUSY: Resource busy
 * @HINATA_ERROR_INTERRUPTED: Operation interrupted
 * @HINATA_ERROR_UNSUPPORTED: Operation not supported
 * @HINATA_ERROR_INTERNAL: Internal error
 */
enum hinata_error_code {
    HINATA_SUCCESS = 0,
    HINATA_ERROR_INVALID_PARAM = -1,
    HINATA_ERROR_NO_MEMORY = -2,
    HINATA_ERROR_NOT_FOUND = -3,
    HINATA_ERROR_EXISTS = -4,
    HINATA_ERROR_PERMISSION = -5,
    HINATA_ERROR_TIMEOUT = -6,
    HINATA_ERROR_IO = -7,
    HINATA_ERROR_CORRUPTION = -8,
    HINATA_ERROR_VERSION = -9,
    HINATA_ERROR_CAPACITY = -10,
    HINATA_ERROR_BUSY = -11,
    HINATA_ERROR_INTERRUPTED = -12,
    HINATA_ERROR_UNSUPPORTED = -13,
    HINATA_ERROR_INTERNAL = -14
};

/**
 * enum hinata_system_state_type - System state types
 * @HINATA_STATE_UNINITIALIZED: System not initialized
 * @HINATA_STATE_INITIALIZING: System initializing
 * @HINATA_STATE_RUNNING: System running normally
 * @HINATA_STATE_DEGRADED: System running with reduced functionality
 * @HINATA_STATE_MAINTENANCE: System in maintenance mode
 * @HINATA_STATE_SHUTTING_DOWN: System shutting down
 * @HINATA_STATE_ERROR: System in error state
 */
enum hinata_system_state_type {
    HINATA_STATE_UNINITIALIZED = 0,
    HINATA_STATE_INITIALIZING,
    HINATA_STATE_RUNNING,
    HINATA_STATE_DEGRADED,
    HINATA_STATE_MAINTENANCE,
    HINATA_STATE_SHUTTING_DOWN,
    HINATA_STATE_ERROR
};

/**
 * enum hinata_log_level - Logging levels
 * @HINATA_LOG_EMERGENCY: System is unusable
 * @HINATA_LOG_ALERT: Action must be taken immediately
 * @HINATA_LOG_CRITICAL: Critical conditions
 * @HINATA_LOG_ERROR: Error conditions
 * @HINATA_LOG_WARNING: Warning conditions
 * @HINATA_LOG_NOTICE: Normal but significant condition
 * @HINATA_LOG_INFO: Informational messages
 * @HINATA_LOG_DEBUG: Debug-level messages
 */
enum hinata_log_level {
    HINATA_LOG_EMERGENCY = 0,
    HINATA_LOG_ALERT,
    HINATA_LOG_CRITICAL,
    HINATA_LOG_ERROR,
    HINATA_LOG_WARNING,
    HINATA_LOG_NOTICE,
    HINATA_LOG_INFO,
    HINATA_LOG_DEBUG
};

/**
 * enum hinata_operation_type - Operation types
 * @HINATA_OP_CREATE: Create operation
 * @HINATA_OP_READ: Read operation
 * @HINATA_OP_UPDATE: Update operation
 * @HINATA_OP_DELETE: Delete operation
 * @HINATA_OP_SEARCH: Search operation
 * @HINATA_OP_VALIDATE: Validation operation
 * @HINATA_OP_SYNC: Synchronization operation
 * @HINATA_OP_BACKUP: Backup operation
 * @HINATA_OP_RESTORE: Restore operation
 * @HINATA_OP_MAINTENANCE: Maintenance operation
 */
enum hinata_operation_type {
    HINATA_OP_CREATE = 0,
    HINATA_OP_READ,
    HINATA_OP_UPDATE,
    HINATA_OP_DELETE,
    HINATA_OP_SEARCH,
    HINATA_OP_VALIDATE,
    HINATA_OP_SYNC,
    HINATA_OP_BACKUP,
    HINATA_OP_RESTORE,
    HINATA_OP_MAINTENANCE
};

/**
 * struct hinata_uuid - UUID structure
 * @data: UUID bytes
 * @string: UUID string representation
 */
struct hinata_uuid {
    u8 data[16];
    char string[HINATA_UUID_LENGTH];
};

/**
 * struct hinata_timestamp - Timestamp structure
 * @seconds: Seconds since epoch
 * @nanoseconds: Nanoseconds
 * @timezone_offset: Timezone offset in minutes
 */
struct hinata_timestamp {
    u64 seconds;
    u32 nanoseconds;
    s16 timezone_offset;
};

/**
 * struct hinata_version - Version information
 * @major: Major version
 * @minor: Minor version
 * @patch: Patch version
 * @build: Build number
 * @string: Version string
 */
struct hinata_version {
    u16 major;
    u16 minor;
    u16 patch;
    u32 build;
    char string[32];
};

/**
 * struct hinata_memory_info - Memory usage information
 * @total_allocated: Total allocated memory
 * @total_used: Total used memory
 * @packet_memory: Memory used by packets
 * @block_memory: Memory used by knowledge blocks
 * @cache_memory: Memory used by caches
 * @metadata_memory: Memory used by metadata
 * @peak_usage: Peak memory usage
 * @allocation_count: Number of allocations
 * @deallocation_count: Number of deallocations
 */
struct hinata_memory_info {
    size_t total_allocated;
    size_t total_used;
    size_t packet_memory;
    size_t block_memory;
    size_t cache_memory;
    size_t metadata_memory;
    size_t peak_usage;
    u64 allocation_count;
    u64 deallocation_count;
};

/**
 * struct hinata_performance_stats - Performance statistics
 * @operations_per_second: Operations per second
 * @average_response_time: Average response time in nanoseconds
 * @peak_response_time: Peak response time in nanoseconds
 * @total_operations: Total operations performed
 * @successful_operations: Successful operations
 * @failed_operations: Failed operations
 * @cache_hit_rate: Cache hit rate percentage
 * @throughput_bytes_per_second: Throughput in bytes per second
 */
struct hinata_performance_stats {
    u32 operations_per_second;
    u64 average_response_time;
    u64 peak_response_time;
    u64 total_operations;
    u64 successful_operations;
    u64 failed_operations;
    u32 cache_hit_rate;
    u64 throughput_bytes_per_second;
};

/**
 * struct hinata_system_limits - System limits
 * @max_packets: Maximum number of packets
 * @max_blocks: Maximum number of knowledge blocks
 * @max_memory: Maximum memory usage
 * @max_storage: Maximum storage usage
 * @max_concurrent_ops: Maximum concurrent operations
 * @max_queue_size: Maximum queue size
 * @timeout_ms: Default timeout in milliseconds
 */
struct hinata_system_limits {
    u32 max_packets;
    u32 max_blocks;
    size_t max_memory;
    size_t max_storage;
    u32 max_concurrent_ops;
    u32 max_queue_size;
    u32 timeout_ms;
};

/**
 * struct hinata_configuration - System configuration
 * @debug_enabled: Debug mode enabled
 * @validation_enabled: Validation enabled
 * @compression_enabled: Compression enabled
 * @encryption_enabled: Encryption enabled
 * @caching_enabled: Caching enabled
 * @logging_level: Logging level
 * @storage_type: Storage type
 * @backup_enabled: Backup enabled
 * @sync_enabled: Synchronization enabled
 * @limits: System limits
 */
struct hinata_configuration {
    bool debug_enabled;
    bool validation_enabled;
    bool compression_enabled;
    bool encryption_enabled;
    bool caching_enabled;
    enum hinata_log_level logging_level;
    u32 storage_type;
    bool backup_enabled;
    bool sync_enabled;
    struct hinata_system_limits limits;
};

/**
 * struct hinata_operation_context - Operation context
 * @type: Operation type
 * @id: Operation ID
 * @start_time: Operation start time
 * @timeout: Operation timeout
 * @flags: Operation flags
 * @user_data: User data
 * @result: Operation result
 * @error_code: Error code
 * @bytes_processed: Bytes processed
 */
struct hinata_operation_context {
    enum hinata_operation_type type;
    u64 id;
    u64 start_time;
    u32 timeout;
    u32 flags;
    void *user_data;
    int result;
    enum hinata_error_code error_code;
    size_t bytes_processed;
};

/**
 * struct hinata_search_criteria - Search criteria
 * @query: Search query string
 * @type_filter: Packet type filter
 * @source_filter: Source filter
 * @tag_filter: Tag filter
 * @date_from: Date range start
 * @date_to: Date range end
 * @size_min: Minimum size
 * @size_max: Maximum size
 * @limit: Maximum results
 * @offset: Result offset
 * @sort_by: Sort field
 * @sort_order: Sort order (0=asc, 1=desc)
 */
struct hinata_search_criteria {
    char *query;
    u32 type_filter;
    char *source_filter;
    char *tag_filter;
    u64 date_from;
    u64 date_to;
    size_t size_min;
    size_t size_max;
    u32 limit;
    u32 offset;
    u32 sort_by;
    u32 sort_order;
};

/**
 * struct hinata_search_result - Search result
 * @packet_id: Packet ID
 * @score: Relevance score
 * @snippet: Content snippet
 * @metadata: Result metadata
 */
struct hinata_search_result {
    char packet_id[HINATA_UUID_LENGTH];
    u32 score;
    char *snippet;
    void *metadata;
};

/**
 * struct hinata_search_results - Search results collection
 * @total_count: Total number of results
 * @returned_count: Number of results returned
 * @results: Array of search results
 * @query_time: Query execution time
 * @has_more: Whether more results are available
 */
struct hinata_search_results {
    u32 total_count;
    u32 returned_count;
    struct hinata_search_result *results;
    u64 query_time;
    bool has_more;
};

/* Callback function types */
typedef int (*hinata_packet_callback_t)(struct hinata_packet *packet, void *data);
typedef int (*hinata_block_callback_t)(struct hinata_knowledge_block *block, void *data);
typedef void (*hinata_event_callback_t)(u32 event_type, void *event_data, void *user_data);
typedef int (*hinata_validation_callback_t)(const void *data, size_t size, void *context);

/* Utility macros */
#define HINATA_ALIGN(x, a)              (((x) + (a) - 1) & ~((a) - 1))
#define HINATA_ARRAY_SIZE(arr)          (sizeof(arr) / sizeof((arr)[0]))
#define HINATA_MIN(a, b)                ((a) < (b) ? (a) : (b))
#define HINATA_MAX(a, b)                ((a) > (b) ? (a) : (b))
#define HINATA_CLAMP(val, min, max)     HINATA_MAX(min, HINATA_MIN(max, val))

/* Error checking macros */
#define HINATA_CHECK_PARAM(param) \
    do { \
        if (!(param)) { \
            pr_err("HiNATA: Invalid parameter: %s\n", #param); \
            return -EINVAL; \
        } \
    } while (0)

#define HINATA_CHECK_MEMORY(ptr) \
    do { \
        if (!(ptr)) { \
            pr_err("HiNATA: Out of memory\n"); \
            return -ENOMEM; \
        } \
    } while (0)

#define HINATA_CHECK_RESULT(result) \
    do { \
        if ((result) < 0) { \
            pr_err("HiNATA: Operation failed: %d\n", result); \
            return result; \
        } \
    } while (0)

/* Logging macros */
#define hinata_log(level, fmt, ...) \
    pr_##level("HiNATA: " fmt, ##__VA_ARGS__)

#define hinata_debug(fmt, ...) \
    hinata_log(debug, fmt, ##__VA_ARGS__)

#define hinata_info(fmt, ...) \
    hinata_log(info, fmt, ##__VA_ARGS__)

#define hinata_warn(fmt, ...) \
    hinata_log(warn, fmt, ##__VA_ARGS__)

#define hinata_err(fmt, ...) \
    hinata_log(err, fmt, ##__VA_ARGS__)

/* Time conversion macros */
#define HINATA_NS_TO_MS(ns)     ((ns) / 1000000ULL)
#define HINATA_MS_TO_NS(ms)     ((ms) * 1000000ULL)
#define HINATA_NS_TO_US(ns)     ((ns) / 1000ULL)
#define HINATA_US_TO_NS(us)     ((us) * 1000ULL)

/* Size conversion macros */
#define HINATA_KB(x)            ((x) * 1024ULL)
#define HINATA_MB(x)            ((x) * 1024ULL * 1024ULL)
#define HINATA_GB(x)            ((x) * 1024ULL * 1024ULL * 1024ULL)

/* Bit manipulation macros */
#define HINATA_SET_BIT(flags, bit)      ((flags) |= (1U << (bit)))
#define HINATA_CLEAR_BIT(flags, bit)    ((flags) &= ~(1U << (bit)))
#define HINATA_TEST_BIT(flags, bit)     (((flags) & (1U << (bit))) != 0)
#define HINATA_TOGGLE_BIT(flags, bit)   ((flags) ^= (1U << (bit)))

/* String utilities */
#define HINATA_STR_EMPTY(str)           (!(str) || (str)[0] == '\0')
#define HINATA_STR_EQUAL(s1, s2)        (strcmp((s1), (s2)) == 0)
#define HINATA_STR_COPY(dst, src, size) strncpy((dst), (src), (size) - 1); (dst)[(size) - 1] = '\0'

/* Validation macros */
#define HINATA_IS_VALID_UUID(uuid)      hinata_validate_uuid(uuid)
#define HINATA_IS_VALID_SIZE(size, max) ((size) > 0 && (size) <= (max))
#define HINATA_IS_VALID_POINTER(ptr)    ((ptr) != NULL)

/* Memory alignment */
#define HINATA_CACHE_LINE_SIZE          64
#define HINATA_ALIGN_CACHE(x)           HINATA_ALIGN(x, HINATA_CACHE_LINE_SIZE)

/* Compiler attributes */
#define HINATA_PACKED               __attribute__((packed))
#define HINATA_ALIGNED(x)           __attribute__((aligned(x)))
#define HINATA_CACHE_ALIGNED        HINATA_ALIGNED(HINATA_CACHE_LINE_SIZE)
#define HINATA_LIKELY(x)            likely(x)
#define HINATA_UNLIKELY(x)          unlikely(x)

#endif /* _HINATA_TYPES_H */
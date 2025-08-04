/*
 * HiNATA System Calls - Header File
 * Part of notcontrolOS Knowledge Management System
 * 
 * This header defines system call interfaces, data structures, and constants
 * for user-space access to HiNATA kernel functionality.
 */

#ifndef _HINATA_SYSCALLS_H
#define _HINATA_SYSCALLS_H

#include <linux/types.h>
#include <linux/ioctl.h>
#include <linux/time.h>
#include <linux/limits.h>
#include "../hinata_types.h"

/* System call interface version */
#define HINATA_SYSCALL_VERSION          "1.0.0"
#define HINATA_SYSCALL_API_VERSION      1
#define HINATA_SYSCALL_ABI_VERSION      1

/* System call limits */
#define HINATA_SYSCALL_MAX_ARGS         8
#define HINATA_SYSCALL_MAX_BUFFER_SIZE  (1024 * 1024)  /* 1MB */
#define HINATA_SYSCALL_MAX_STRING_SIZE  4096
#define HINATA_SYSCALL_MAX_ARRAY_SIZE   1000
#define HINATA_SYSCALL_MAX_CONCURRENT   100
#define HINATA_SYSCALL_TIMEOUT_MS       30000           /* 30 seconds */
#define HINATA_SYSCALL_RATE_LIMIT       1000            /* calls per second */

/* System call numbers */
#define __NR_hinata_packet_create       450
#define __NR_hinata_packet_store        451
#define __NR_hinata_packet_load         452
#define __NR_hinata_packet_delete       453
#define __NR_hinata_packet_query        454
#define __NR_hinata_packet_update       455
#define __NR_hinata_packet_validate     456
#define __NR_hinata_packet_clone        457
#define __NR_hinata_packet_compress     458
#define __NR_hinata_packet_decompress   459
#define __NR_hinata_knowledge_create    460
#define __NR_hinata_knowledge_store     461
#define __NR_hinata_knowledge_load      462
#define __NR_hinata_knowledge_delete    463
#define __NR_hinata_knowledge_query     464
#define __NR_hinata_knowledge_update    465
#define __NR_hinata_knowledge_link      466
#define __NR_hinata_knowledge_unlink    467
#define __NR_hinata_knowledge_search    468
#define __NR_hinata_knowledge_index     469
#define __NR_hinata_system_info         470
#define __NR_hinata_system_stats        471
#define __NR_hinata_system_config       472
#define __NR_hinata_system_start        473
#define __NR_hinata_system_stop         474
#define __NR_hinata_system_suspend      475
#define __NR_hinata_system_resume       476
#define __NR_hinata_system_reset        477
#define __NR_hinata_system_health       478
#define __NR_hinata_memory_info         479
#define __NR_hinata_memory_stats        480
#define __NR_hinata_memory_gc           481
#define __NR_hinata_memory_leak_check   482
#define __NR_hinata_storage_info        483
#define __NR_hinata_storage_stats       484
#define __NR_hinata_storage_compact     485
#define __NR_hinata_storage_verify      486
#define __NR_hinata_storage_repair      487
#define __NR_hinata_storage_backup      488
#define __NR_hinata_storage_restore     489
#define __NR_hinata_validation_check    490
#define __NR_hinata_validation_batch    491
#define __NR_hinata_validation_config   492
#define __NR_hinata_event_subscribe     493
#define __NR_hinata_event_unsubscribe   494
#define __NR_hinata_event_poll          495
#define __NR_hinata_event_read          496
#define __NR_hinata_debug_dump          497
#define __NR_hinata_debug_trace         498
#define __NR_hinata_debug_profile       499
#define __NR_hinata_benchmark           500
#define __NR_hinata_test                501
#define __NR_hinata_ioctl               502

/* System call flags */
#define HINATA_SYSCALL_FLAG_ASYNC       (1 << 0)
#define HINATA_SYSCALL_FLAG_BLOCKING    (1 << 1)
#define HINATA_SYSCALL_FLAG_ATOMIC      (1 << 2)
#define HINATA_SYSCALL_FLAG_CRITICAL    (1 << 3)
#define HINATA_SYSCALL_FLAG_CACHED      (1 << 4)
#define HINATA_SYSCALL_FLAG_COMPRESSED  (1 << 5)
#define HINATA_SYSCALL_FLAG_ENCRYPTED   (1 << 6)
#define HINATA_SYSCALL_FLAG_VALIDATED   (1 << 7)
#define HINATA_SYSCALL_FLAG_LOGGED      (1 << 8)
#define HINATA_SYSCALL_FLAG_TRACED      (1 << 9)
#define HINATA_SYSCALL_FLAG_PROFILED    (1 << 10)
#define HINATA_SYSCALL_FLAG_MONITORED   (1 << 11)
#define HINATA_SYSCALL_FLAG_AUDITED     (1 << 12)
#define HINATA_SYSCALL_FLAG_SECURED     (1 << 13)
#define HINATA_SYSCALL_FLAG_PRIVILEGED  (1 << 14)
#define HINATA_SYSCALL_FLAG_RESTRICTED  (1 << 15)

/* System call error codes */
#define HINATA_SYSCALL_SUCCESS          0
#define HINATA_SYSCALL_ERROR_GENERIC    -1
#define HINATA_SYSCALL_ERROR_INVALID    -2
#define HINATA_SYSCALL_ERROR_PERMISSION -3
#define HINATA_SYSCALL_ERROR_MEMORY     -4
#define HINATA_SYSCALL_ERROR_TIMEOUT    -5
#define HINATA_SYSCALL_ERROR_BUSY       -6
#define HINATA_SYSCALL_ERROR_OVERFLOW   -7
#define HINATA_SYSCALL_ERROR_UNDERFLOW  -8
#define HINATA_SYSCALL_ERROR_CORRUPTION -9
#define HINATA_SYSCALL_ERROR_NETWORK    -10
#define HINATA_SYSCALL_ERROR_IO         -11
#define HINATA_SYSCALL_ERROR_FORMAT     -12
#define HINATA_SYSCALL_ERROR_VERSION    -13
#define HINATA_SYSCALL_ERROR_DISABLED   -14
#define HINATA_SYSCALL_ERROR_UNSUPPORTED -15

/* System call priorities */
enum hinata_syscall_priority {
    HINATA_SYSCALL_PRIORITY_LOW = 0,
    HINATA_SYSCALL_PRIORITY_NORMAL,
    HINATA_SYSCALL_PRIORITY_HIGH,
    HINATA_SYSCALL_PRIORITY_CRITICAL,
    HINATA_SYSCALL_PRIORITY_EMERGENCY,
    HINATA_SYSCALL_PRIORITY_MAX
};

/* System call types */
enum hinata_syscall_type {
    HINATA_SYSCALL_TYPE_UNKNOWN = 0,
    HINATA_SYSCALL_TYPE_PACKET,
    HINATA_SYSCALL_TYPE_KNOWLEDGE,
    HINATA_SYSCALL_TYPE_SYSTEM,
    HINATA_SYSCALL_TYPE_MEMORY,
    HINATA_SYSCALL_TYPE_STORAGE,
    HINATA_SYSCALL_TYPE_VALIDATION,
    HINATA_SYSCALL_TYPE_EVENT,
    HINATA_SYSCALL_TYPE_DEBUG,
    HINATA_SYSCALL_TYPE_BENCHMARK,
    HINATA_SYSCALL_TYPE_TEST,
    HINATA_SYSCALL_TYPE_IOCTL,
    HINATA_SYSCALL_TYPE_MAX
};

/* System call states */
enum hinata_syscall_state {
    HINATA_SYSCALL_STATE_IDLE = 0,
    HINATA_SYSCALL_STATE_PENDING,
    HINATA_SYSCALL_STATE_RUNNING,
    HINATA_SYSCALL_STATE_COMPLETED,
    HINATA_SYSCALL_STATE_FAILED,
    HINATA_SYSCALL_STATE_TIMEOUT,
    HINATA_SYSCALL_STATE_CANCELLED,
    HINATA_SYSCALL_STATE_MAX
};

/* Forward declarations */
struct hinata_syscall_args;
struct hinata_syscall_result;
struct hinata_syscall_context;
struct hinata_syscall_stats;
struct hinata_syscall_info;

/**
 * struct hinata_syscall_header - System call header
 * @magic: Magic number for validation
 * @version: API version
 * @size: Total size of the structure
 * @flags: System call flags
 * @priority: Call priority
 * @timeout: Timeout in milliseconds
 * @caller_pid: Caller process ID
 * @caller_uid: Caller user ID
 * @caller_gid: Caller group ID
 * @timestamp: Call timestamp
 * @sequence: Sequence number
 * @checksum: Header checksum
 * @reserved: Reserved for future use
 */
struct hinata_syscall_header {
    u32 magic;
    u32 version;
    u32 size;
    u32 flags;
    enum hinata_syscall_priority priority;
    u32 timeout;
    pid_t caller_pid;
    uid_t caller_uid;
    gid_t caller_gid;
    u64 timestamp;
    u64 sequence;
    u32 checksum;
    u8 reserved[32];
};

/**
 * struct hinata_syscall_packet_create_args - Packet creation arguments
 * @header: System call header
 * @type: Packet type
 * @content_size: Size of content
 * @metadata_size: Size of metadata
 * @flags: Creation flags
 * @priority: Packet priority
 * @lifetime: Expected lifetime
 * @tags: Packet tags
 * @source: Source identifier
 * @content: Packet content (user pointer)
 * @metadata: Packet metadata (user pointer)
 * @packet_id: Output packet ID (user pointer)
 */
struct hinata_syscall_packet_create_args {
    struct hinata_syscall_header header;
    u32 type;
    size_t content_size;
    size_t metadata_size;
    u32 flags;
    u32 priority;
    u64 lifetime;
    char tags[256];
    char source[64];
    const void __user *content;
    const void __user *metadata;
    hinata_uuid_t __user *packet_id;
};

/**
 * struct hinata_syscall_packet_query_args - Packet query arguments
 * @header: System call header
 * @query_type: Type of query
 * @flags: Query flags
 * @max_results: Maximum number of results
 * @offset: Result offset
 * @filter: Query filter (user pointer)
 * @filter_size: Size of filter
 * @results: Results buffer (user pointer)
 * @results_size: Size of results buffer
 * @actual_count: Actual number of results (user pointer)
 */
struct hinata_syscall_packet_query_args {
    struct hinata_syscall_header header;
    u32 query_type;
    u32 flags;
    u32 max_results;
    u32 offset;
    const void __user *filter;
    size_t filter_size;
    void __user *results;
    size_t results_size;
    u32 __user *actual_count;
};

/**
 * struct hinata_syscall_system_info_args - System info arguments
 * @header: System call header
 * @info_type: Type of information requested
 * @flags: Information flags
 * @buffer: Output buffer (user pointer)
 * @buffer_size: Size of output buffer
 * @actual_size: Actual size of information (user pointer)
 */
struct hinata_syscall_system_info_args {
    struct hinata_syscall_header header;
    u32 info_type;
    u32 flags;
    void __user *buffer;
    size_t buffer_size;
    size_t __user *actual_size;
};

/**
 * struct hinata_syscall_memory_info_args - Memory info arguments
 * @header: System call header
 * @info_type: Type of memory information
 * @flags: Information flags
 * @pool_id: Specific pool ID (if applicable)
 * @buffer: Output buffer (user pointer)
 * @buffer_size: Size of output buffer
 * @actual_size: Actual size of information (user pointer)
 */
struct hinata_syscall_memory_info_args {
    struct hinata_syscall_header header;
    u32 info_type;
    u32 flags;
    u32 pool_id;
    void __user *buffer;
    size_t buffer_size;
    size_t __user *actual_size;
};

/**
 * struct hinata_syscall_event_subscribe_args - Event subscription arguments
 * @header: System call header
 * @event_types: Bitmask of event types to subscribe to
 * @flags: Subscription flags
 * @buffer_size: Size of event buffer
 * @max_events: Maximum number of events to buffer
 * @timeout: Event timeout in milliseconds
 * @callback: User callback function (user pointer)
 * @user_data: User data for callback (user pointer)
 * @subscription_id: Output subscription ID (user pointer)
 */
struct hinata_syscall_event_subscribe_args {
    struct hinata_syscall_header header;
    u64 event_types;
    u32 flags;
    size_t buffer_size;
    u32 max_events;
    u32 timeout;
    void __user *callback;
    void __user *user_data;
    u32 __user *subscription_id;
};

/**
 * struct hinata_syscall_debug_dump_args - Debug dump arguments
 * @header: System call header
 * @dump_type: Type of dump to perform
 * @flags: Dump flags
 * @component: Specific component to dump
 * @level: Dump detail level
 * @buffer: Output buffer (user pointer)
 * @buffer_size: Size of output buffer
 * @actual_size: Actual size of dump (user pointer)
 */
struct hinata_syscall_debug_dump_args {
    struct hinata_syscall_header header;
    u32 dump_type;
    u32 flags;
    u32 component;
    u32 level;
    void __user *buffer;
    size_t buffer_size;
    size_t __user *actual_size;
};

/**
 * struct hinata_syscall_benchmark_args - Benchmark arguments
 * @header: System call header
 * @benchmark_type: Type of benchmark to run
 * @flags: Benchmark flags
 * @duration: Benchmark duration in milliseconds
 * @iterations: Number of iterations
 * @thread_count: Number of threads to use
 * @data_size: Size of test data
 * @results: Results buffer (user pointer)
 * @results_size: Size of results buffer
 */
struct hinata_syscall_benchmark_args {
    struct hinata_syscall_header header;
    u32 benchmark_type;
    u32 flags;
    u32 duration;
    u32 iterations;
    u32 thread_count;
    size_t data_size;
    void __user *results;
    size_t results_size;
};

/**
 * struct hinata_syscall_result - System call result
 * @magic: Magic number for validation
 * @version: API version
 * @size: Size of result structure
 * @syscall_nr: System call number
 * @result_code: Result code
 * @error_code: Error code (if failed)
 * @flags: Result flags
 * @duration: Call duration in nanoseconds
 * @timestamp: Completion timestamp
 * @data_size: Size of result data
 * @checksum: Result checksum
 * @reserved: Reserved for future use
 */
struct hinata_syscall_result {
    u32 magic;
    u32 version;
    u32 size;
    u32 syscall_nr;
    int result_code;
    int error_code;
    u32 flags;
    u64 duration;
    u64 timestamp;
    size_t data_size;
    u32 checksum;
    u8 reserved[32];
};

/**
 * struct hinata_syscall_stats - System call statistics
 * @total_calls: Total number of calls
 * @successful_calls: Number of successful calls
 * @failed_calls: Number of failed calls
 * @timeout_calls: Number of timeout calls
 * @permission_denied: Number of permission denied calls
 * @invalid_args: Number of invalid argument calls
 * @buffer_overflow: Number of buffer overflow calls
 * @memory_errors: Number of memory error calls
 * @concurrent_calls: Number of concurrent calls
 * @rate_limited: Number of rate limited calls
 * @average_duration: Average call duration in nanoseconds
 * @max_duration: Maximum call duration in nanoseconds
 * @min_duration: Minimum call duration in nanoseconds
 * @last_call_time: Last call timestamp
 * @peak_concurrent: Peak concurrent calls
 * @total_bytes_in: Total bytes received from user space
 * @total_bytes_out: Total bytes sent to user space
 * @cache_hits: Number of cache hits
 * @cache_misses: Number of cache misses
 * @validation_errors: Number of validation errors
 */
struct hinata_syscall_stats {
    u64 total_calls;
    u64 successful_calls;
    u64 failed_calls;
    u64 timeout_calls;
    u64 permission_denied;
    u64 invalid_args;
    u64 buffer_overflow;
    u64 memory_errors;
    u64 concurrent_calls;
    u64 rate_limited;
    u64 average_duration;
    u64 max_duration;
    u64 min_duration;
    u64 last_call_time;
    u32 peak_concurrent;
    u64 total_bytes_in;
    u64 total_bytes_out;
    u64 cache_hits;
    u64 cache_misses;
    u64 validation_errors;
};

/**
 * struct hinata_syscall_info - System call information
 * @version: System call interface version
 * @api_version: API version
 * @abi_version: ABI version
 * @max_concurrent: Maximum concurrent calls
 * @rate_limit: Rate limit (calls per second)
 * @timeout: Default timeout in milliseconds
 * @max_buffer_size: Maximum buffer size
 * @max_string_size: Maximum string size
 * @max_array_size: Maximum array size
 * @supported_calls: Bitmask of supported system calls
 * @enabled_features: Bitmask of enabled features
 * @security_level: Current security level
 * @uptime: System call interface uptime
 * @stats: Current statistics
 */
struct hinata_syscall_info {
    struct hinata_version version;
    u32 api_version;
    u32 abi_version;
    u32 max_concurrent;
    u32 rate_limit;
    u32 timeout;
    size_t max_buffer_size;
    size_t max_string_size;
    size_t max_array_size;
    u64 supported_calls;
    u64 enabled_features;
    u32 security_level;
    u64 uptime;
    struct hinata_syscall_stats stats;
};

/**
 * struct hinata_syscall_config - System call configuration
 * @enable_rate_limiting: Enable rate limiting
 * @enable_timeout: Enable timeout
 * @enable_validation: Enable argument validation
 * @enable_logging: Enable call logging
 * @enable_tracing: Enable call tracing
 * @enable_profiling: Enable call profiling
 * @enable_caching: Enable result caching
 * @enable_compression: Enable data compression
 * @enable_encryption: Enable data encryption
 * @enable_auditing: Enable security auditing
 * @max_concurrent: Maximum concurrent calls
 * @rate_limit: Rate limit (calls per second)
 * @timeout: Default timeout in milliseconds
 * @max_buffer_size: Maximum buffer size
 * @cache_size: Cache size
 * @log_level: Logging level
 * @security_level: Security level
 * @reserved: Reserved for future use
 */
struct hinata_syscall_config {
    bool enable_rate_limiting;
    bool enable_timeout;
    bool enable_validation;
    bool enable_logging;
    bool enable_tracing;
    bool enable_profiling;
    bool enable_caching;
    bool enable_compression;
    bool enable_encryption;
    bool enable_auditing;
    u32 max_concurrent;
    u32 rate_limit;
    u32 timeout;
    size_t max_buffer_size;
    size_t cache_size;
    u32 log_level;
    u32 security_level;
    u8 reserved[64];
};

/* IOCTL definitions */
#define HINATA_IOCTL_MAGIC              'H'
#define HINATA_IOCTL_GET_INFO           _IOR(HINATA_IOCTL_MAGIC, 1, struct hinata_syscall_info)
#define HINATA_IOCTL_GET_STATS          _IOR(HINATA_IOCTL_MAGIC, 2, struct hinata_syscall_stats)
#define HINATA_IOCTL_GET_CONFIG         _IOR(HINATA_IOCTL_MAGIC, 3, struct hinata_syscall_config)
#define HINATA_IOCTL_SET_CONFIG         _IOW(HINATA_IOCTL_MAGIC, 4, struct hinata_syscall_config)
#define HINATA_IOCTL_RESET_STATS        _IO(HINATA_IOCTL_MAGIC, 5)
#define HINATA_IOCTL_RESET_CONFIG       _IO(HINATA_IOCTL_MAGIC, 6)
#define HINATA_IOCTL_ENABLE             _IO(HINATA_IOCTL_MAGIC, 7)
#define HINATA_IOCTL_DISABLE            _IO(HINATA_IOCTL_MAGIC, 8)
#define HINATA_IOCTL_SUSPEND            _IO(HINATA_IOCTL_MAGIC, 9)
#define HINATA_IOCTL_RESUME             _IO(HINATA_IOCTL_MAGIC, 10)
#define HINATA_IOCTL_FLUSH_CACHE        _IO(HINATA_IOCTL_MAGIC, 11)
#define HINATA_IOCTL_DUMP_STATE         _IOR(HINATA_IOCTL_MAGIC, 12, void)
#define HINATA_IOCTL_SELF_TEST          _IO(HINATA_IOCTL_MAGIC, 13)
#define HINATA_IOCTL_BENCHMARK          _IOWR(HINATA_IOCTL_MAGIC, 14, struct hinata_syscall_benchmark_args)
#define HINATA_IOCTL_MAX                14

/* Function declarations */

/* Core system call functions */
int hinata_syscalls_init(void);
void hinata_syscalls_cleanup(void);
int hinata_syscalls_start(void);
int hinata_syscalls_stop(void);
int hinata_syscalls_suspend(void);
int hinata_syscalls_resume(void);
int hinata_syscalls_reset(void);

/* System call implementations */
long sys_hinata_packet_create(u32 type, const void __user *content, size_t content_size,
                             const void __user *metadata, size_t metadata_size,
                             hinata_uuid_t __user *packet_id);
long sys_hinata_packet_store(const hinata_uuid_t __user *packet_id, u32 flags);
long sys_hinata_packet_load(const hinata_uuid_t __user *packet_id,
                           void __user *buffer, size_t buffer_size,
                           size_t __user *actual_size);
long sys_hinata_packet_delete(const hinata_uuid_t __user *packet_id);
long sys_hinata_packet_query(const void __user *query, size_t query_size,
                            void __user *results, size_t results_size,
                            u32 __user *count);
long sys_hinata_packet_update(const hinata_uuid_t __user *packet_id,
                             const void __user *content, size_t content_size,
                             const void __user *metadata, size_t metadata_size);
long sys_hinata_packet_validate(const hinata_uuid_t __user *packet_id,
                               u32 __user *validation_result);
long sys_hinata_packet_clone(const hinata_uuid_t __user *src_id,
                            hinata_uuid_t __user *dst_id);
long sys_hinata_packet_compress(const hinata_uuid_t __user *packet_id,
                               u32 compression_type);
long sys_hinata_packet_decompress(const hinata_uuid_t __user *packet_id);

long sys_hinata_knowledge_create(const void __user *data, size_t data_size,
                                const void __user *metadata, size_t metadata_size,
                                hinata_uuid_t __user *block_id);
long sys_hinata_knowledge_store(const hinata_uuid_t __user *block_id, u32 flags);
long sys_hinata_knowledge_load(const hinata_uuid_t __user *block_id,
                              void __user *buffer, size_t buffer_size,
                              size_t __user *actual_size);
long sys_hinata_knowledge_delete(const hinata_uuid_t __user *block_id);
long sys_hinata_knowledge_query(const void __user *query, size_t query_size,
                               void __user *results, size_t results_size,
                               u32 __user *count);
long sys_hinata_knowledge_update(const hinata_uuid_t __user *block_id,
                                const void __user *data, size_t data_size,
                                const void __user *metadata, size_t metadata_size);
long sys_hinata_knowledge_link(const hinata_uuid_t __user *src_id,
                              const hinata_uuid_t __user *dst_id,
                              u32 link_type);
long sys_hinata_knowledge_unlink(const hinata_uuid_t __user *src_id,
                                const hinata_uuid_t __user *dst_id);
long sys_hinata_knowledge_search(const char __user *query,
                                void __user *results, size_t results_size,
                                u32 __user *count);
long sys_hinata_knowledge_index(const hinata_uuid_t __user *block_id,
                               u32 index_type);

long sys_hinata_system_info(struct hinata_system_info __user *info);
long sys_hinata_system_stats(struct hinata_system_stats __user *stats);
long sys_hinata_system_config(struct hinata_system_config __user *config, u32 flags);
long sys_hinata_system_start(void);
long sys_hinata_system_stop(void);
long sys_hinata_system_suspend(void);
long sys_hinata_system_resume(void);
long sys_hinata_system_reset(u32 flags);
long sys_hinata_system_health(struct hinata_system_health __user *health);

long sys_hinata_memory_info(struct hinata_memory_info __user *info);
long sys_hinata_memory_stats(struct hinata_memory_stats __user *stats);
long sys_hinata_memory_gc(u32 flags);
long sys_hinata_memory_leak_check(struct hinata_memory_leak __user *leaks,
                                 u32 max_count, u32 __user *actual_count);

long sys_hinata_storage_info(struct hinata_storage_info __user *info);
long sys_hinata_storage_stats(struct hinata_storage_stats __user *stats);
long sys_hinata_storage_compact(u32 flags);
long sys_hinata_storage_verify(u32 __user *errors);
long sys_hinata_storage_repair(u32 flags);
long sys_hinata_storage_backup(const char __user *path);
long sys_hinata_storage_restore(const char __user *path);

long sys_hinata_validation_check(const hinata_uuid_t __user *id,
                                u32 validation_type,
                                struct hinata_validation_result __user *result);
long sys_hinata_validation_batch(const hinata_uuid_t __user *ids,
                                u32 count, u32 validation_type,
                                struct hinata_validation_result __user *results);
long sys_hinata_validation_config(struct hinata_validation_config __user *config,
                                 u32 flags);

long sys_hinata_event_subscribe(u64 event_types, u32 flags,
                               u32 __user *subscription_id);
long sys_hinata_event_unsubscribe(u32 subscription_id);
long sys_hinata_event_poll(u32 subscription_id, u32 timeout,
                          struct hinata_event __user *events,
                          u32 max_events, u32 __user *actual_count);
long sys_hinata_event_read(u32 subscription_id,
                          struct hinata_event __user *event);

long sys_hinata_debug_dump(u32 dump_type, u32 component,
                          void __user *buffer, size_t buffer_size,
                          size_t __user *actual_size);
long sys_hinata_debug_trace(u32 trace_type, u32 flags);
long sys_hinata_debug_profile(u32 profile_type, u32 duration,
                             void __user *results, size_t results_size);

long sys_hinata_benchmark(u32 benchmark_type, u32 flags,
                         void __user *results, size_t results_size);
long sys_hinata_test(u32 test_type, u32 flags,
                    void __user *results, size_t results_size);
long sys_hinata_ioctl(u32 cmd, void __user *arg);

/* Configuration and management */
int hinata_syscalls_get_info(struct hinata_syscall_info *info);
int hinata_syscalls_get_stats(struct hinata_syscall_stats *stats);
int hinata_syscalls_reset_stats(void);
int hinata_syscalls_get_config(struct hinata_syscall_config *config);
int hinata_syscalls_set_config(const struct hinata_syscall_config *config);
int hinata_syscalls_reset_config(void);

/* Utility functions */
const char *hinata_syscall_type_to_string(enum hinata_syscall_type type);
const char *hinata_syscall_state_to_string(enum hinata_syscall_state state);
const char *hinata_syscall_priority_to_string(enum hinata_syscall_priority priority);
const char *hinata_syscall_error_to_string(int error_code);
bool hinata_syscall_is_valid_nr(unsigned int nr);
enum hinata_syscall_type hinata_syscall_get_type(unsigned int nr);
u32 hinata_syscall_calculate_checksum(const void *data, size_t size);
int hinata_syscall_validate_header(const struct hinata_syscall_header *header);
int hinata_syscall_validate_result(const struct hinata_syscall_result *result);

/* Inline utility functions */

/**
 * hinata_syscall_is_read_only - Check if syscall is read-only
 * @nr: System call number
 * 
 * Returns: true if read-only, false otherwise
 */
static inline bool hinata_syscall_is_read_only(unsigned int nr)
{
    switch (nr) {
    case __NR_hinata_packet_load:
    case __NR_hinata_packet_query:
    case __NR_hinata_knowledge_load:
    case __NR_hinata_knowledge_query:
    case __NR_hinata_knowledge_search:
    case __NR_hinata_system_info:
    case __NR_hinata_system_stats:
    case __NR_hinata_system_health:
    case __NR_hinata_memory_info:
    case __NR_hinata_memory_stats:
    case __NR_hinata_storage_info:
    case __NR_hinata_storage_stats:
    case __NR_hinata_validation_check:
    case __NR_hinata_event_poll:
    case __NR_hinata_event_read:
    case __NR_hinata_debug_dump:
        return true;
    default:
        return false;
    }
}

/**
 * hinata_syscall_is_privileged - Check if syscall requires privileges
 * @nr: System call number
 * 
 * Returns: true if privileged, false otherwise
 */
static inline bool hinata_syscall_is_privileged(unsigned int nr)
{
    switch (nr) {
    case __NR_hinata_system_start:
    case __NR_hinata_system_stop:
    case __NR_hinata_system_suspend:
    case __NR_hinata_system_resume:
    case __NR_hinata_system_reset:
    case __NR_hinata_system_config:
    case __NR_hinata_memory_gc:
    case __NR_hinata_storage_compact:
    case __NR_hinata_storage_verify:
    case __NR_hinata_storage_repair:
    case __NR_hinata_storage_backup:
    case __NR_hinata_storage_restore:
    case __NR_hinata_debug_dump:
    case __NR_hinata_debug_trace:
    case __NR_hinata_debug_profile:
    case __NR_hinata_benchmark:
    case __NR_hinata_test:
        return true;
    default:
        return false;
    }
}

/**
 * hinata_syscall_is_async - Check if syscall can be asynchronous
 * @nr: System call number
 * 
 * Returns: true if can be async, false otherwise
 */
static inline bool hinata_syscall_is_async(unsigned int nr)
{
    switch (nr) {
    case __NR_hinata_packet_store:
    case __NR_hinata_knowledge_store:
    case __NR_hinata_knowledge_index:
    case __NR_hinata_memory_gc:
    case __NR_hinata_storage_compact:
    case __NR_hinata_storage_verify:
    case __NR_hinata_storage_repair:
    case __NR_hinata_storage_backup:
    case __NR_hinata_storage_restore:
    case __NR_hinata_benchmark:
        return true;
    default:
        return false;
    }
}

/**
 * hinata_syscall_get_timeout - Get default timeout for syscall
 * @nr: System call number
 * 
 * Returns: Timeout in milliseconds
 */
static inline u32 hinata_syscall_get_timeout(unsigned int nr)
{
    switch (nr) {
    case __NR_hinata_storage_backup:
    case __NR_hinata_storage_restore:
    case __NR_hinata_benchmark:
        return 300000; /* 5 minutes */
    case __NR_hinata_storage_compact:
    case __NR_hinata_storage_verify:
    case __NR_hinata_storage_repair:
        return 120000; /* 2 minutes */
    case __NR_hinata_memory_gc:
    case __NR_hinata_knowledge_index:
        return 60000;  /* 1 minute */
    default:
        return HINATA_SYSCALL_TIMEOUT_MS; /* 30 seconds */
    }
}

/**
 * hinata_syscall_get_max_buffer_size - Get maximum buffer size for syscall
 * @nr: System call number
 * 
 * Returns: Maximum buffer size in bytes
 */
static inline size_t hinata_syscall_get_max_buffer_size(unsigned int nr)
{
    switch (nr) {
    case __NR_hinata_debug_dump:
        return 16 * 1024 * 1024; /* 16MB */
    case __NR_hinata_benchmark:
        return 8 * 1024 * 1024;  /* 8MB */
    case __NR_hinata_packet_query:
    case __NR_hinata_knowledge_query:
    case __NR_hinata_knowledge_search:
        return 4 * 1024 * 1024;  /* 4MB */
    default:
        return HINATA_SYSCALL_MAX_BUFFER_SIZE; /* 1MB */
    }
}

/**
 * hinata_syscall_header_init - Initialize syscall header
 * @header: Header to initialize
 * @nr: System call number
 * @flags: System call flags
 * @priority: System call priority
 */
static inline void hinata_syscall_header_init(struct hinata_syscall_header *header,
                                             unsigned int nr, u32 flags,
                                             enum hinata_syscall_priority priority)
{
    if (!header) {
        return;
    }
    
    memset(header, 0, sizeof(*header));
    header->magic = HINATA_MAGIC;
    header->version = HINATA_SYSCALL_API_VERSION;
    header->size = sizeof(*header);
    header->flags = flags;
    header->priority = priority;
    header->timeout = hinata_syscall_get_timeout(nr);
    header->caller_pid = current->pid;
    header->caller_uid = from_kuid(&init_user_ns, current_uid());
    header->caller_gid = from_kgid(&init_user_ns, current_gid());
    header->timestamp = ktime_get_real_ns();
    header->sequence = atomic64_inc_return(&hinata_syscall_sequence);
    header->checksum = hinata_syscall_calculate_checksum(header, sizeof(*header) - sizeof(header->checksum));
}

/**
 * hinata_syscall_result_init - Initialize syscall result
 * @result: Result to initialize
 * @nr: System call number
 * @result_code: Result code
 * @start_time: Call start time
 */
static inline void hinata_syscall_result_init(struct hinata_syscall_result *result,
                                             unsigned int nr, int result_code,
                                             u64 start_time)
{
    if (!result) {
        return;
    }
    
    memset(result, 0, sizeof(*result));
    result->magic = HINATA_MAGIC;
    result->version = HINATA_SYSCALL_API_VERSION;
    result->size = sizeof(*result);
    result->syscall_nr = nr;
    result->result_code = result_code;
    result->error_code = (result_code < 0) ? -result_code : 0;
    result->duration = ktime_get_ns() - start_time;
    result->timestamp = ktime_get_real_ns();
    result->checksum = hinata_syscall_calculate_checksum(result, sizeof(*result) - sizeof(result->checksum));
}

/* External variables */
extern atomic64_t hinata_syscall_sequence;
extern struct hinata_syscall_stats hinata_global_syscall_stats;
extern struct hinata_syscall_config hinata_global_syscall_config;

#endif /* _HINATA_SYSCALLS_H */
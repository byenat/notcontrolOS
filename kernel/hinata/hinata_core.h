/*
 * HiNATA Core System - Header File
 * Part of notcontrolOS Knowledge Management System
 * 
 * This header defines core system functions, interfaces, and declarations
 * for the HiNATA knowledge system at the kernel level.
 */

#ifndef _HINATA_CORE_H
#define _HINATA_CORE_H

#include <linux/types.h>
#include <linux/atomic.h>
#include <linux/mutex.h>
#include <linux/spinlock.h>
#include <linux/time.h>
#include "hinata_types.h"

/* Core system constants */
#define HINATA_CORE_VERSION         "1.0.0"
#define HINATA_CORE_BUILD_DATE      __DATE__ " " __TIME__
#define HINATA_CORE_MAX_SUBSYSTEMS  16
#define HINATA_CORE_MAX_WORKERS     8

/* System state flags */
#define HINATA_SYSTEM_FLAG_INITIALIZED      (1 << 0)
#define HINATA_SYSTEM_FLAG_RUNNING          (1 << 1)
#define HINATA_SYSTEM_FLAG_DEGRADED         (1 << 2)
#define HINATA_SYSTEM_FLAG_MAINTENANCE      (1 << 3)
#define HINATA_SYSTEM_FLAG_SHUTTING_DOWN    (1 << 4)
#define HINATA_SYSTEM_FLAG_DEBUG            (1 << 5)
#define HINATA_SYSTEM_FLAG_VALIDATION       (1 << 6)
#define HINATA_SYSTEM_FLAG_COMPRESSION      (1 << 7)
#define HINATA_SYSTEM_FLAG_ENCRYPTION       (1 << 8)
#define HINATA_SYSTEM_FLAG_CACHING          (1 << 9)

/* Forward declarations */
struct hinata_subsystem;
struct hinata_worker;
struct hinata_system_info;

/**
 * struct hinata_system_state - Global system state
 * @state: Current system state
 * @flags: System flags
 * @start_time: System start time
 * @uptime: System uptime in nanoseconds
 * @packet_count: Current packet count
 * @block_count: Current knowledge block count
 * @memory_usage: Current memory usage
 * @error_count: Total error count
 * @warning_count: Total warning count
 * @lock: State protection lock
 */
struct hinata_system_state {
    enum hinata_system_state_type state;
    u32 flags;
    u64 start_time;
    u64 uptime;
    atomic64_t packet_count;
    atomic64_t block_count;
    atomic64_t memory_usage;
    atomic64_t error_count;
    atomic64_t warning_count;
    spinlock_t lock;
};

/**
 * struct hinata_system_stats - System statistics
 * @packets_created: Total packets created
 * @packets_destroyed: Total packets destroyed
 * @blocks_created: Total knowledge blocks created
 * @blocks_destroyed: Total knowledge blocks destroyed
 * @validations_performed: Total validations performed
 * @validations_failed: Total validation failures
 * @searches_performed: Total searches performed
 * @cache_hits: Total cache hits
 * @cache_misses: Total cache misses
 * @memory_allocations: Total memory allocations
 * @memory_deallocations: Total memory deallocations
 * @io_operations: Total I/O operations
 * @errors_total: Total errors
 * @warnings_total: Total warnings
 */
struct hinata_system_stats {
    u64 packets_created;
    u64 packets_destroyed;
    u64 blocks_created;
    u64 blocks_destroyed;
    u64 validations_performed;
    u64 validations_failed;
    u64 searches_performed;
    u64 cache_hits;
    u64 cache_misses;
    u64 memory_allocations;
    u64 memory_deallocations;
    u64 io_operations;
    u64 errors_total;
    u64 warnings_total;
};

/**
 * struct hinata_subsystem - Subsystem definition
 * @name: Subsystem name
 * @version: Subsystem version
 * @priority: Initialization priority
 * @flags: Subsystem flags
 * @state: Current subsystem state
 * @init: Initialization function
 * @exit: Cleanup function
 * @suspend: Suspend function
 * @resume: Resume function
 * @reset: Reset function
 * @private_data: Private subsystem data
 * @list: List node for subsystem registry
 */
struct hinata_subsystem {
    const char *name;
    const char *version;
    u32 priority;
    u32 flags;
    enum hinata_system_state_type state;
    int (*init)(struct hinata_subsystem *subsys);
    void (*exit)(struct hinata_subsystem *subsys);
    int (*suspend)(struct hinata_subsystem *subsys);
    int (*resume)(struct hinata_subsystem *subsys);
    int (*reset)(struct hinata_subsystem *subsys);
    void *private_data;
    struct list_head list;
};

/**
 * struct hinata_worker - Worker thread context
 * @id: Worker ID
 * @name: Worker name
 * @task: Kernel task structure
 * @state: Worker state
 * @work_queue: Work queue
 * @processed_count: Number of items processed
 * @error_count: Number of errors encountered
 * @last_activity: Last activity timestamp
 * @private_data: Private worker data
 */
struct hinata_worker {
    u32 id;
    char name[32];
    struct task_struct *task;
    u32 state;
    struct workqueue_struct *work_queue;
    atomic64_t processed_count;
    atomic64_t error_count;
    u64 last_activity;
    void *private_data;
};

/**
 * struct hinata_system_info - System information
 * @version: System version
 * @build_date: Build date
 * @build_time: Build time
 * @features: Enabled features
 * @limits: System limits
 * @configuration: System configuration
 * @memory_info: Memory information
 * @performance_stats: Performance statistics
 */
struct hinata_system_info {
    struct hinata_version version;
    char build_date[32];
    char build_time[32];
    u32 features;
    struct hinata_system_limits limits;
    struct hinata_configuration configuration;
    struct hinata_memory_info memory_info;
    struct hinata_performance_stats performance_stats;
};

/* Global system state */
extern struct hinata_system_state hinata_system;
extern struct hinata_system_stats hinata_stats;

/* Core system functions */
int hinata_system_init(void);
void hinata_system_cleanup(void);
int hinata_system_start(void);
int hinata_system_stop(void);
int hinata_system_suspend(void);
int hinata_system_resume(void);
int hinata_system_reset(void);

/* System state management */
enum hinata_system_state_type hinata_system_get_state(void);
int hinata_system_set_state(enum hinata_system_state_type state);
bool hinata_system_is_running(void);
bool hinata_system_is_initialized(void);
u32 hinata_system_get_flags(void);
int hinata_system_set_flag(u32 flag);
int hinata_system_clear_flag(u32 flag);
bool hinata_system_has_flag(u32 flag);

/* System information */
int hinata_system_get_info(struct hinata_system_info *info);
int hinata_system_get_stats(struct hinata_system_stats *stats);
void hinata_system_reset_stats(void);
u64 hinata_system_get_uptime(void);
size_t hinata_system_get_memory_usage(void);

/* Subsystem management */
int hinata_subsystem_register(struct hinata_subsystem *subsys);
int hinata_subsystem_unregister(const char *name);
struct hinata_subsystem *hinata_subsystem_find(const char *name);
int hinata_subsystem_init_all(void);
void hinata_subsystem_exit_all(void);
int hinata_subsystem_suspend_all(void);
int hinata_subsystem_resume_all(void);

/* Worker management */
int hinata_worker_create(const char *name, int (*worker_func)(void *data), void *data);
int hinata_worker_destroy(u32 worker_id);
struct hinata_worker *hinata_worker_find(u32 worker_id);
int hinata_worker_start_all(void);
void hinata_worker_stop_all(void);

/* UUID utilities */
int hinata_generate_uuid(char *uuid_str, size_t size);
bool hinata_validate_uuid(const char *uuid_str);
int hinata_compare_uuid(const char *uuid1, const char *uuid2);
void hinata_uuid_to_string(const u8 *uuid_bytes, char *uuid_str);
int hinata_uuid_from_string(const char *uuid_str, u8 *uuid_bytes);

/* Timestamp utilities */
u64 hinata_get_timestamp(void);
void hinata_timestamp_to_timespec(u64 timestamp, struct timespec64 *ts);
u64 hinata_timespec_to_timestamp(const struct timespec64 *ts);
int hinata_format_timestamp(u64 timestamp, char *buffer, size_t size);
int hinata_parse_timestamp(const char *str, u64 *timestamp);

/* String utilities */
char *hinata_strdup(const char *str);
int hinata_validate_string(const char *str, size_t max_len);
size_t hinata_safe_strlen(const char *str, size_t max_len);
int hinata_safe_strcmp(const char *s1, const char *s2, size_t max_len);
char *hinata_safe_strncpy(char *dest, const char *src, size_t size);

/* Memory management */
void *hinata_malloc(size_t size);
void *hinata_calloc(size_t nmemb, size_t size);
void *hinata_realloc(void *ptr, size_t size);
void hinata_free(void *ptr);
size_t hinata_get_allocated_memory(void);
int hinata_check_memory_limit(size_t additional_size);

/* Error handling */
const char *hinata_error_to_string(enum hinata_error_code error);
void hinata_log_error(enum hinata_error_code error, const char *context);
void hinata_increment_error_count(void);
void hinata_increment_warning_count(void);
u64 hinata_get_error_count(void);
u64 hinata_get_warning_count(void);

/* Statistics management */
void hinata_increment_packet_count(void);
void hinata_decrement_packet_count(void);
void hinata_increment_block_count(void);
void hinata_decrement_block_count(void);
void hinata_update_memory_usage(ssize_t delta);
void hinata_increment_cache_hit(void);
void hinata_increment_cache_miss(void);
void hinata_increment_io_operation(void);

/* Configuration management */
int hinata_config_get_bool(const char *key, bool *value);
int hinata_config_get_int(const char *key, int *value);
int hinata_config_get_string(const char *key, char *value, size_t size);
int hinata_config_set_bool(const char *key, bool value);
int hinata_config_set_int(const char *key, int value);
int hinata_config_set_string(const char *key, const char *value);

/* Performance monitoring */
void hinata_perf_start_operation(struct hinata_operation_context *ctx);
void hinata_perf_end_operation(struct hinata_operation_context *ctx);
u64 hinata_perf_get_average_time(enum hinata_operation_type type);
u64 hinata_perf_get_peak_time(enum hinata_operation_type type);
u32 hinata_perf_get_operations_per_second(enum hinata_operation_type type);

/* Health monitoring */
bool hinata_health_check(void);
int hinata_health_get_status(void);
void hinata_health_report_issue(const char *component, const char *issue);
void hinata_health_clear_issues(void);

/* Debug and diagnostics */
void hinata_dump_system_state(void);
void hinata_dump_system_stats(void);
void hinata_dump_subsystems(void);
void hinata_dump_workers(void);
void hinata_dump_memory_info(void);
int hinata_self_test(void);

/* Inline utility functions */

/**
 * hinata_system_is_flag_set - Check if system flag is set
 * @flag: Flag to check
 * 
 * Returns: true if flag is set, false otherwise
 */
static inline bool hinata_system_is_flag_set(u32 flag)
{
    return (hinata_system.flags & flag) != 0;
}

/**
 * hinata_get_current_packet_count - Get current packet count
 * 
 * Returns: Current packet count
 */
static inline u64 hinata_get_current_packet_count(void)
{
    return atomic64_read(&hinata_system.packet_count);
}

/**
 * hinata_get_current_block_count - Get current knowledge block count
 * 
 * Returns: Current knowledge block count
 */
static inline u64 hinata_get_current_block_count(void)
{
    return atomic64_read(&hinata_system.block_count);
}

/**
 * hinata_get_current_memory_usage - Get current memory usage
 * 
 * Returns: Current memory usage in bytes
 */
static inline u64 hinata_get_current_memory_usage(void)
{
    return atomic64_read(&hinata_system.memory_usage);
}

/**
 * hinata_is_memory_critical - Check if memory usage is critical
 * 
 * Returns: true if memory usage is critical, false otherwise
 */
static inline bool hinata_is_memory_critical(void)
{
    return hinata_get_current_memory_usage() > HINATA_MEMORY_CRITICAL_THRESHOLD;
}

/**
 * hinata_is_memory_warning - Check if memory usage is at warning level
 * 
 * Returns: true if memory usage is at warning level, false otherwise
 */
static inline bool hinata_is_memory_warning(void)
{
    return hinata_get_current_memory_usage() > HINATA_MEMORY_WARNING_THRESHOLD;
}

/**
 * hinata_get_system_uptime_ms - Get system uptime in milliseconds
 * 
 * Returns: System uptime in milliseconds
 */
static inline u64 hinata_get_system_uptime_ms(void)
{
    return HINATA_NS_TO_MS(hinata_system_get_uptime());
}

/**
 * hinata_is_debug_enabled - Check if debug mode is enabled
 * 
 * Returns: true if debug mode is enabled, false otherwise
 */
static inline bool hinata_is_debug_enabled(void)
{
    return hinata_system_is_flag_set(HINATA_SYSTEM_FLAG_DEBUG);
}

/**
 * hinata_is_validation_enabled - Check if validation is enabled
 * 
 * Returns: true if validation is enabled, false otherwise
 */
static inline bool hinata_is_validation_enabled(void)
{
    return hinata_system_is_flag_set(HINATA_SYSTEM_FLAG_VALIDATION);
}

/**
 * hinata_is_compression_enabled - Check if compression is enabled
 * 
 * Returns: true if compression is enabled, false otherwise
 */
static inline bool hinata_is_compression_enabled(void)
{
    return hinata_system_is_flag_set(HINATA_SYSTEM_FLAG_COMPRESSION);
}

/**
 * hinata_is_encryption_enabled - Check if encryption is enabled
 * 
 * Returns: true if encryption is enabled, false otherwise
 */
static inline bool hinata_is_encryption_enabled(void)
{
    return hinata_system_is_flag_set(HINATA_SYSTEM_FLAG_ENCRYPTION);
}

/**
 * hinata_is_caching_enabled - Check if caching is enabled
 * 
 * Returns: true if caching is enabled, false otherwise
 */
static inline bool hinata_is_caching_enabled(void)
{
    return hinata_system_is_flag_set(HINATA_SYSTEM_FLAG_CACHING);
}

/**
 * hinata_system_state_to_string - Convert system state to string
 * @state: System state
 * 
 * Returns: String representation of system state
 */
static inline const char *hinata_system_state_to_string(enum hinata_system_state_type state)
{
    switch (state) {
    case HINATA_STATE_UNINITIALIZED:
        return "uninitialized";
    case HINATA_STATE_INITIALIZING:
        return "initializing";
    case HINATA_STATE_RUNNING:
        return "running";
    case HINATA_STATE_DEGRADED:
        return "degraded";
    case HINATA_STATE_MAINTENANCE:
        return "maintenance";
    case HINATA_STATE_SHUTTING_DOWN:
        return "shutting_down";
    case HINATA_STATE_ERROR:
        return "error";
    default:
        return "unknown";
    }
}

/**
 * hinata_operation_type_to_string - Convert operation type to string
 * @type: Operation type
 * 
 * Returns: String representation of operation type
 */
static inline const char *hinata_operation_type_to_string(enum hinata_operation_type type)
{
    switch (type) {
    case HINATA_OP_CREATE:
        return "create";
    case HINATA_OP_READ:
        return "read";
    case HINATA_OP_UPDATE:
        return "update";
    case HINATA_OP_DELETE:
        return "delete";
    case HINATA_OP_SEARCH:
        return "search";
    case HINATA_OP_VALIDATE:
        return "validate";
    case HINATA_OP_SYNC:
        return "sync";
    case HINATA_OP_BACKUP:
        return "backup";
    case HINATA_OP_RESTORE:
        return "restore";
    case HINATA_OP_MAINTENANCE:
        return "maintenance";
    default:
        return "unknown";
    }
}

#endif /* _HINATA_CORE_H */
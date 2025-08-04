/*
 * HiNATA Memory Management - Header File
 * Part of notcontrolOS Knowledge Management System
 * 
 * This header defines memory management interfaces, data structures, and constants
 * for efficient memory allocation and tracking in the HiNATA system.
 */

#ifndef _HINATA_MEMORY_H
#define _HINATA_MEMORY_H

#include <linux/types.h>
#include <linux/atomic.h>
#include <linux/mutex.h>
#include <linux/spinlock.h>
#include <linux/list.h>
#include <linux/rbtree.h>
#include <linux/slab.h>
#include "../hinata_types.h"

/* Memory management constants */
#define HINATA_MEMORY_VERSION           "1.0.0"
#define HINATA_MEMORY_POOL_COUNT        8
#define HINATA_MEMORY_CACHE_COUNT       16
#define HINATA_MEMORY_HASH_SIZE         256
#define HINATA_MEMORY_MAX_SINGLE        (16 * 1024 * 1024)     /* 16MB */
#define HINATA_MEMORY_MAX_TOTAL         (1024 * 1024 * 1024)   /* 1GB */
#define HINATA_MEMORY_MAX_ALLOCATIONS   100000
#define HINATA_MEMORY_WARNING_THRESHOLD (512 * 1024 * 1024)    /* 512MB */
#define HINATA_MEMORY_CRITICAL_THRESHOLD (768 * 1024 * 1024)   /* 768MB */
#define HINATA_MEMORY_GC_THRESHOLD      (64 * 1024 * 1024)     /* 64MB */
#define HINATA_MEMORY_LEAK_THRESHOLD    1000
#define HINATA_MEMORY_ALIGNMENT         8
#define HINATA_MEMORY_PAGE_SIZE         PAGE_SIZE

/* Memory allocation types */
enum hinata_memory_type {
    HINATA_MEMORY_TYPE_UNKNOWN = 0,
    HINATA_MEMORY_TYPE_PACKET,
    HINATA_MEMORY_TYPE_KNOWLEDGE_BLOCK,
    HINATA_MEMORY_TYPE_METADATA,
    HINATA_MEMORY_TYPE_CONTENT,
    HINATA_MEMORY_TYPE_INDEX,
    HINATA_MEMORY_TYPE_CACHE,
    HINATA_MEMORY_TYPE_BUFFER,
    HINATA_MEMORY_TYPE_TEMPORARY,
    HINATA_MEMORY_TYPE_PERSISTENT,
    HINATA_MEMORY_TYPE_DMA,
    HINATA_MEMORY_TYPE_ATOMIC,
    HINATA_MEMORY_TYPE_MAX
};

/* Memory allocation flags */
#define HINATA_MEMORY_FLAG_TRACKED      (1 << 0)
#define HINATA_MEMORY_FLAG_POOLED       (1 << 1)
#define HINATA_MEMORY_FLAG_CACHED       (1 << 2)
#define HINATA_MEMORY_FLAG_TEMPORARY    (1 << 3)
#define HINATA_MEMORY_FLAG_CRITICAL     (1 << 4)
#define HINATA_MEMORY_FLAG_ZERO         (1 << 5)
#define HINATA_MEMORY_FLAG_DMA          (1 << 6)
#define HINATA_MEMORY_FLAG_ATOMIC       (1 << 7)
#define HINATA_MEMORY_FLAG_PINNED       (1 << 8)
#define HINATA_MEMORY_FLAG_READONLY     (1 << 9)
#define HINATA_MEMORY_FLAG_EXECUTABLE   (1 << 10)
#define HINATA_MEMORY_FLAG_SHARED       (1 << 11)
#define HINATA_MEMORY_FLAG_LOCKED       (1 << 12)
#define HINATA_MEMORY_FLAG_SWAPPABLE    (1 << 13)
#define HINATA_MEMORY_FLAG_PREFAULT     (1 << 14)
#define HINATA_MEMORY_FLAG_NOFAIL       (1 << 15)

/* Memory pool types */
enum hinata_memory_pool_type {
    HINATA_MEMORY_POOL_SMALL = 0,   /* 32-256 bytes */
    HINATA_MEMORY_POOL_MEDIUM,      /* 512-2048 bytes */
    HINATA_MEMORY_POOL_LARGE,       /* 4096+ bytes */
    HINATA_MEMORY_POOL_HUGE,        /* Very large allocations */
    HINATA_MEMORY_POOL_DMA,         /* DMA-coherent memory */
    HINATA_MEMORY_POOL_ATOMIC,      /* Atomic allocations */
    HINATA_MEMORY_POOL_TEMPORARY,   /* Temporary allocations */
    HINATA_MEMORY_POOL_PERSISTENT,  /* Long-lived allocations */
    HINATA_MEMORY_POOL_MAX
};

/* Memory allocation priorities */
enum hinata_memory_priority {
    HINATA_MEMORY_PRIORITY_LOW = 0,
    HINATA_MEMORY_PRIORITY_NORMAL,
    HINATA_MEMORY_PRIORITY_HIGH,
    HINATA_MEMORY_PRIORITY_CRITICAL,
    HINATA_MEMORY_PRIORITY_EMERGENCY,
    HINATA_MEMORY_PRIORITY_MAX
};

/* Memory allocation strategies */
enum hinata_memory_strategy {
    HINATA_MEMORY_STRATEGY_FIRST_FIT = 0,
    HINATA_MEMORY_STRATEGY_BEST_FIT,
    HINATA_MEMORY_STRATEGY_WORST_FIT,
    HINATA_MEMORY_STRATEGY_NEXT_FIT,
    HINATA_MEMORY_STRATEGY_BUDDY,
    HINATA_MEMORY_STRATEGY_SLAB,
    HINATA_MEMORY_STRATEGY_POOL,
    HINATA_MEMORY_STRATEGY_MAX
};

/* Forward declarations */
struct hinata_memory_block;
struct hinata_memory_pool;
struct hinata_memory_cache;
struct hinata_memory_context;

/**
 * struct hinata_memory_stats - Memory statistics
 * @total_allocated: Total memory allocated
 * @total_freed: Total memory freed
 * @current_usage: Current memory usage
 * @peak_usage: Peak memory usage
 * @allocation_count: Number of allocations
 * @free_count: Number of frees
 * @realloc_count: Number of reallocations
 * @leak_count: Number of memory leaks detected
 * @oom_count: Number of out-of-memory events
 * @gc_count: Number of garbage collections
 * @pool_hits: Pool allocation hits
 * @pool_misses: Pool allocation misses
 * @cache_hits: Cache hits
 * @cache_misses: Cache misses
 * @fragmentation: Memory fragmentation percentage
 * @efficiency: Memory allocation efficiency
 * @average_alloc_size: Average allocation size
 * @average_lifetime: Average allocation lifetime
 */
struct hinata_memory_stats {
    atomic64_t total_allocated;
    atomic64_t total_freed;
    atomic64_t current_usage;
    atomic64_t peak_usage;
    atomic64_t allocation_count;
    atomic64_t free_count;
    atomic64_t realloc_count;
    atomic64_t leak_count;
    atomic64_t oom_count;
    atomic64_t gc_count;
    atomic64_t pool_hits;
    atomic64_t pool_misses;
    atomic64_t cache_hits;
    atomic64_t cache_misses;
    u32 fragmentation;
    u32 efficiency;
    u64 average_alloc_size;
    u64 average_lifetime;
};

/**
 * struct hinata_memory_limits - Memory limits
 * @max_total_size: Maximum total memory size
 * @max_single_alloc: Maximum single allocation size
 * @max_allocations: Maximum number of allocations
 * @warning_threshold: Warning threshold
 * @critical_threshold: Critical threshold
 * @oom_threshold: Out-of-memory threshold
 * @gc_threshold: Garbage collection threshold
 * @leak_threshold: Memory leak detection threshold
 * @pool_limit: Pool memory limit
 * @cache_limit: Cache memory limit
 * @temporary_limit: Temporary memory limit
 * @dma_limit: DMA memory limit
 */
struct hinata_memory_limits {
    u64 max_total_size;
    u64 max_single_alloc;
    u64 max_allocations;
    u64 warning_threshold;
    u64 critical_threshold;
    u64 oom_threshold;
    u64 gc_threshold;
    u64 leak_threshold;
    u64 pool_limit;
    u64 cache_limit;
    u64 temporary_limit;
    u64 dma_limit;
};

/**
 * struct hinata_memory_config - Memory configuration
 * @enable_tracking: Enable memory tracking
 * @enable_pooling: Enable memory pooling
 * @enable_caching: Enable memory caching
 * @enable_gc: Enable garbage collection
 * @enable_stats: Enable statistics collection
 * @enable_debugging: Enable debugging features
 * @enable_profiling: Enable memory profiling
 * @enable_leak_detection: Enable leak detection
 * @gc_interval: Garbage collection interval (ms)
 * @stats_interval: Statistics collection interval (ms)
 * @leak_check_interval: Leak check interval (ms)
 * @pool_prealloc_count: Pool pre-allocation count
 * @cache_size: Cache size
 * @alignment: Memory alignment
 * @strategy: Allocation strategy
 * @priority: Default allocation priority
 * @reserved: Reserved for future use
 */
struct hinata_memory_config {
    bool enable_tracking;
    bool enable_pooling;
    bool enable_caching;
    bool enable_gc;
    bool enable_stats;
    bool enable_debugging;
    bool enable_profiling;
    bool enable_leak_detection;
    u32 gc_interval;
    u32 stats_interval;
    u32 leak_check_interval;
    u32 pool_prealloc_count;
    u64 cache_size;
    u32 alignment;
    enum hinata_memory_strategy strategy;
    enum hinata_memory_priority priority;
    u8 reserved[32];
};

/**
 * struct hinata_memory_pool_stats - Memory pool statistics
 * @allocations: Number of allocations
 * @frees: Number of frees
 * @hits: Pool hits
 * @misses: Pool misses
 * @bytes_allocated: Total bytes allocated
 * @bytes_freed: Total bytes freed
 * @peak_usage: Peak usage
 * @current_usage: Current usage
 * @fragmentation: Fragmentation percentage
 * @efficiency: Allocation efficiency
 */
struct hinata_memory_pool_stats {
    u64 allocations;
    u64 frees;
    u64 hits;
    u64 misses;
    u64 bytes_allocated;
    u64 bytes_freed;
    u64 peak_usage;
    u64 current_usage;
    u32 fragmentation;
    u32 efficiency;
};

/**
 * struct hinata_memory_info - Memory information
 * @version: Memory manager version
 * @total_size: Total available memory
 * @used_size: Currently used memory
 * @free_size: Free memory
 * @cached_size: Cached memory
 * @pool_count: Number of memory pools
 * @cache_count: Number of memory caches
 * @allocation_count: Current allocation count
 * @fragmentation: Memory fragmentation percentage
 * @efficiency: Memory efficiency percentage
 * @uptime: Memory manager uptime
 * @last_gc: Last garbage collection time
 * @config: Memory configuration
 * @limits: Memory limits
 * @stats: Memory statistics
 */
struct hinata_memory_info {
    struct hinata_version version;
    u64 total_size;
    u64 used_size;
    u64 free_size;
    u64 cached_size;
    u32 pool_count;
    u32 cache_count;
    u64 allocation_count;
    u32 fragmentation;
    u32 efficiency;
    u64 uptime;
    u64 last_gc;
    struct hinata_memory_config config;
    struct hinata_memory_limits limits;
    struct hinata_memory_stats stats;
};

/**
 * struct hinata_memory_allocation - Memory allocation descriptor
 * @ptr: Pointer to allocated memory
 * @size: Size of allocation
 * @type: Allocation type
 * @flags: Allocation flags
 * @priority: Allocation priority
 * @caller: Caller information
 * @alloc_time: Allocation timestamp
 * @access_time: Last access timestamp
 * @access_count: Access count
 * @lifetime: Expected lifetime
 * @tag: Allocation tag
 */
struct hinata_memory_allocation {
    void *ptr;
    size_t size;
    enum hinata_memory_type type;
    u32 flags;
    enum hinata_memory_priority priority;
    unsigned long caller;
    u64 alloc_time;
    u64 access_time;
    atomic_t access_count;
    u64 lifetime;
    char tag[32];
};

/**
 * struct hinata_memory_leak - Memory leak information
 * @ptr: Leaked pointer
 * @size: Size of leak
 * @caller: Caller that allocated
 * @alloc_time: Allocation time
 * @detected_time: Detection time
 * @access_count: Number of accesses
 * @stack_trace: Stack trace (if available)
 */
struct hinata_memory_leak {
    void *ptr;
    size_t size;
    unsigned long caller;
    u64 alloc_time;
    u64 detected_time;
    u32 access_count;
    unsigned long stack_trace[16];
};

/* Core memory management functions */
int hinata_memory_init(void);
void hinata_memory_cleanup(void);
int hinata_memory_start(void);
int hinata_memory_stop(void);
int hinata_memory_suspend(void);
int hinata_memory_resume(void);
int hinata_memory_reset(void);

/* Memory allocation functions */
void *hinata_malloc(size_t size);
void *hinata_calloc(size_t nmemb, size_t size);
void *hinata_realloc(void *ptr, size_t size);
void hinata_free(void *ptr);
void *hinata_malloc_typed(size_t size, enum hinata_memory_type type);
void *hinata_malloc_flagged(size_t size, u32 flags);
void *hinata_malloc_aligned(size_t size, size_t alignment);
void *hinata_malloc_tagged(size_t size, const char *tag);
void *hinata_malloc_priority(size_t size, enum hinata_memory_priority priority);
void *hinata_malloc_atomic(size_t size);
void *hinata_malloc_dma(size_t size);
void *hinata_malloc_temporary(size_t size, u64 lifetime);

/* Memory pool functions */
int hinata_memory_pool_create(size_t size, u32 count, enum hinata_memory_pool_type type);
int hinata_memory_pool_destroy(size_t size);
void *hinata_memory_pool_alloc(size_t size);
void hinata_memory_pool_free(void *ptr, size_t size);
int hinata_memory_pool_prealloc(size_t size, u32 count);
int hinata_memory_pool_shrink(size_t size);
int hinata_memory_pool_get_stats(size_t size, struct hinata_memory_pool_stats *stats);

/* Memory tracking and debugging */
size_t hinata_get_allocated_memory(void);
size_t hinata_get_peak_memory(void);
size_t hinata_get_free_memory(void);
u64 hinata_get_allocation_count(void);
int hinata_check_memory_limit(size_t additional_size);
int hinata_memory_validate_pointer(void *ptr);
size_t hinata_memory_get_size(void *ptr);
enum hinata_memory_type hinata_memory_get_type(void *ptr);
u32 hinata_memory_get_flags(void *ptr);
u64 hinata_memory_get_age(void *ptr);
int hinata_memory_set_tag(void *ptr, const char *tag);
const char *hinata_memory_get_tag(void *ptr);

/* Memory leak detection */
int hinata_memory_leak_check(void);
int hinata_memory_leak_report(struct hinata_memory_leak *leaks, u32 max_count);
void hinata_memory_leak_clear(void);
int hinata_memory_leak_set_threshold(u32 threshold);
u32 hinata_memory_leak_get_count(void);

/* Garbage collection */
int hinata_memory_gc_run(void);
int hinata_memory_gc_schedule(void);
int hinata_memory_gc_cancel(void);
int hinata_memory_gc_set_interval(u32 interval_ms);
u32 hinata_memory_gc_get_interval(void);
bool hinata_memory_gc_is_running(void);
u64 hinata_memory_gc_get_last_run(void);
u64 hinata_memory_gc_get_freed_bytes(void);

/* Statistics and monitoring */
int hinata_memory_get_stats(struct hinata_memory_stats *stats);
void hinata_memory_reset_stats(void);
int hinata_memory_get_info(struct hinata_memory_info *info);
float hinata_memory_get_fragmentation(void);
float hinata_memory_get_efficiency(void);
u64 hinata_memory_get_average_alloc_size(void);
u64 hinata_memory_get_average_lifetime(void);

/* Configuration management */
int hinata_memory_get_config(struct hinata_memory_config *config);
int hinata_memory_set_config(const struct hinata_memory_config *config);
int hinata_memory_reset_config(void);
int hinata_memory_get_limits(struct hinata_memory_limits *limits);
int hinata_memory_set_limits(const struct hinata_memory_limits *limits);

/* Event callbacks */
typedef void (*hinata_memory_event_callback_t)(u32 event_type, const void *data, size_t size);
int hinata_memory_register_callback(hinata_memory_event_callback_t callback);
int hinata_memory_unregister_callback(hinata_memory_event_callback_t callback);

/* Debug and diagnostics */
void hinata_memory_dump_stats(void);
void hinata_memory_dump_pools(void);
void hinata_memory_dump_allocations(void);
void hinata_memory_dump_leaks(void);
int hinata_memory_self_test(void);
int hinata_memory_stress_test(u32 duration_ms);
int hinata_memory_benchmark(void);

/* Utility functions */
const char *hinata_memory_type_to_string(enum hinata_memory_type type);
const char *hinata_memory_priority_to_string(enum hinata_memory_priority priority);
const char *hinata_memory_strategy_to_string(enum hinata_memory_strategy strategy);
size_t hinata_memory_align_size(size_t size, size_t alignment);
size_t hinata_memory_round_up_power_of_2(size_t size);
bool hinata_memory_is_power_of_2(size_t size);
u32 hinata_memory_calculate_fragmentation(u64 total_size, u64 free_size, u64 largest_free);
float hinata_memory_calculate_efficiency(u64 allocated, u64 requested);

/* Inline utility functions */

/**
 * hinata_memory_is_valid_size - Check if size is valid
 * @size: Size to check
 * 
 * Returns: true if valid, false otherwise
 */
static inline bool hinata_memory_is_valid_size(size_t size)
{
    return size > 0 && size <= HINATA_MEMORY_MAX_SINGLE;
}

/**
 * hinata_memory_is_aligned - Check if pointer is aligned
 * @ptr: Pointer to check
 * @alignment: Required alignment
 * 
 * Returns: true if aligned, false otherwise
 */
static inline bool hinata_memory_is_aligned(const void *ptr, size_t alignment)
{
    return ((uintptr_t)ptr & (alignment - 1)) == 0;
}

/**
 * hinata_memory_align_up - Align size up to boundary
 * @size: Size to align
 * @alignment: Alignment boundary
 * 
 * Returns: Aligned size
 */
static inline size_t hinata_memory_align_up(size_t size, size_t alignment)
{
    return HINATA_ALIGN_UP(size, alignment);
}

/**
 * hinata_memory_align_down - Align size down to boundary
 * @size: Size to align
 * @alignment: Alignment boundary
 * 
 * Returns: Aligned size
 */
static inline size_t hinata_memory_align_down(size_t size, size_t alignment)
{
    return HINATA_ALIGN_DOWN(size, alignment);
}

/**
 * hinata_memory_is_pool_size - Check if size is suitable for pooling
 * @size: Size to check
 * 
 * Returns: true if suitable for pooling, false otherwise
 */
static inline bool hinata_memory_is_pool_size(size_t size)
{
    return size <= 4096 && hinata_memory_is_power_of_2(size);
}

/**
 * hinata_memory_get_pool_index - Get pool index for size
 * @size: Size to get pool for
 * 
 * Returns: Pool index, or -1 if no suitable pool
 */
static inline int hinata_memory_get_pool_index(size_t size)
{
    if (size <= 32) return 0;
    if (size <= 64) return 1;
    if (size <= 128) return 2;
    if (size <= 256) return 3;
    if (size <= 512) return 4;
    if (size <= 1024) return 5;
    if (size <= 2048) return 6;
    if (size <= 4096) return 7;
    return -1;
}

/**
 * hinata_memory_is_critical_size - Check if allocation is critical size
 * @size: Size to check
 * 
 * Returns: true if critical, false otherwise
 */
static inline bool hinata_memory_is_critical_size(size_t size)
{
    return size > HINATA_MEMORY_CRITICAL_THRESHOLD;
}

/**
 * hinata_memory_is_large_alloc - Check if allocation is large
 * @size: Size to check
 * 
 * Returns: true if large, false otherwise
 */
static inline bool hinata_memory_is_large_alloc(size_t size)
{
    return size > PAGE_SIZE;
}

/**
 * hinata_memory_should_use_vmalloc - Check if should use vmalloc
 * @size: Size to check
 * 
 * Returns: true if should use vmalloc, false otherwise
 */
static inline bool hinata_memory_should_use_vmalloc(size_t size)
{
    return size > PAGE_SIZE;
}

/**
 * hinata_memory_get_usage_percentage - Get memory usage percentage
 * @used: Used memory
 * @total: Total memory
 * 
 * Returns: Usage percentage (0-100)
 */
static inline u32 hinata_memory_get_usage_percentage(u64 used, u64 total)
{
    if (total == 0) {
        return 0;
    }
    return (u32)((used * 100) / total);
}

/**
 * hinata_memory_is_low - Check if memory is low
 * @used: Used memory
 * @total: Total memory
 * @threshold: Low memory threshold percentage
 * 
 * Returns: true if memory is low, false otherwise
 */
static inline bool hinata_memory_is_low(u64 used, u64 total, u32 threshold)
{
    return hinata_memory_get_usage_percentage(used, total) >= threshold;
}

/**
 * hinata_memory_bytes_to_pages - Convert bytes to pages
 * @bytes: Number of bytes
 * 
 * Returns: Number of pages
 */
static inline u64 hinata_memory_bytes_to_pages(u64 bytes)
{
    return HINATA_DIV_ROUND_UP(bytes, PAGE_SIZE);
}

/**
 * hinata_memory_pages_to_bytes - Convert pages to bytes
 * @pages: Number of pages
 * 
 * Returns: Number of bytes
 */
static inline u64 hinata_memory_pages_to_bytes(u64 pages)
{
    return pages * PAGE_SIZE;
}

/**
 * hinata_memory_kb_to_bytes - Convert kilobytes to bytes
 * @kb: Kilobytes
 * 
 * Returns: Bytes
 */
static inline u64 hinata_memory_kb_to_bytes(u64 kb)
{
    return kb * 1024;
}

/**
 * hinata_memory_mb_to_bytes - Convert megabytes to bytes
 * @mb: Megabytes
 * 
 * Returns: Bytes
 */
static inline u64 hinata_memory_mb_to_bytes(u64 mb)
{
    return mb * 1024 * 1024;
}

/**
 * hinata_memory_gb_to_bytes - Convert gigabytes to bytes
 * @gb: Gigabytes
 * 
 * Returns: Bytes
 */
static inline u64 hinata_memory_gb_to_bytes(u64 gb)
{
    return gb * 1024 * 1024 * 1024;
}

/**
 * hinata_memory_bytes_to_kb - Convert bytes to kilobytes
 * @bytes: Bytes
 * 
 * Returns: Kilobytes
 */
static inline u64 hinata_memory_bytes_to_kb(u64 bytes)
{
    return bytes / 1024;
}

/**
 * hinata_memory_bytes_to_mb - Convert bytes to megabytes
 * @bytes: Bytes
 * 
 * Returns: Megabytes
 */
static inline u64 hinata_memory_bytes_to_mb(u64 bytes)
{
    return bytes / (1024 * 1024);
}

/**
 * hinata_memory_bytes_to_gb - Convert bytes to gigabytes
 * @bytes: Bytes
 * 
 * Returns: Gigabytes
 */
static inline u64 hinata_memory_bytes_to_gb(u64 bytes)
{
    return bytes / (1024 * 1024 * 1024);
}

#endif /* _HINATA_MEMORY_H */
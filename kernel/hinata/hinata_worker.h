/*
 * HiNATA Worker Thread System Header
 * Part of notcontrolOS Knowledge Management System
 * 
 * This header defines the interfaces, data structures, and constants
 * for the HiNATA worker thread system, including task scheduling,
 * thread pool management, and work distribution.
 */

#ifndef _HINATA_WORKER_H
#define _HINATA_WORKER_H

#include <linux/types.h>
#include <linux/list.h>
#include <linux/spinlock.h>
#include <linux/mutex.h>
#include <linux/rwsem.h>
#include <linux/wait.h>
#include <linux/completion.h>
#include <linux/atomic.h>
#include <linux/kthread.h>
#include <linux/workqueue.h>
#include <linux/timer.h>
#include <linux/rcu.h>
#include "hinata_types.h"

/* Worker version information */
#define HINATA_WORKER_VERSION_MAJOR     1
#define HINATA_WORKER_VERSION_MINOR     0
#define HINATA_WORKER_VERSION_PATCH     0
#define HINATA_WORKER_VERSION_BUILD     1

/* Worker constants */
#define HINATA_WORKER_NAME_MAX          64
#define HINATA_WORKER_DESC_MAX          256
#define HINATA_WORKER_MAX_TASKS         1024
#define HINATA_WORKER_MAX_RETRIES       10
#define HINATA_WORKER_DEFAULT_TIMEOUT   30000      /* 30 seconds */
#define HINATA_WORKER_DEFAULT_PRIORITY  0
#define HINATA_WORKER_PRIORITY_LEVELS   8
#define HINATA_WORKER_STACK_SIZE        8192
#define HINATA_WORKER_IDLE_TIMEOUT      60000      /* 60 seconds */
#define HINATA_WORKER_HEALTH_INTERVAL   10000      /* 10 seconds */

/* Task types */
enum hinata_task_type {
    HINATA_TASK_TYPE_PACKET_PROCESS = 0,
    HINATA_TASK_TYPE_STORAGE_SYNC,
    HINATA_TASK_TYPE_MEMORY_GC,
    HINATA_TASK_TYPE_VALIDATION,
    HINATA_TASK_TYPE_MAINTENANCE,
    HINATA_TASK_TYPE_BACKUP,
    HINATA_TASK_TYPE_RESTORE,
    HINATA_TASK_TYPE_CLEANUP,
    HINATA_TASK_TYPE_CUSTOM,
    HINATA_TASK_TYPE_MAX,
};

/* Task flags */
#define HINATA_TASK_FLAG_URGENT             0x0001
#define HINATA_TASK_FLAG_BACKGROUND         0x0002
#define HINATA_TASK_FLAG_PERSISTENT         0x0004
#define HINATA_TASK_FLAG_EXCLUSIVE          0x0008
#define HINATA_TASK_FLAG_CPU_INTENSIVE      0x0010
#define HINATA_TASK_FLAG_IO_INTENSIVE       0x0020
#define HINATA_TASK_FLAG_MEMORY_INTENSIVE   0x0040
#define HINATA_TASK_FLAG_INTERRUPTIBLE      0x0080
#define HINATA_TASK_FLAG_CANCELLABLE        0x0100
#define HINATA_TASK_FLAG_RETRYABLE          0x0200
#define HINATA_TASK_FLAG_LOGGED             0x0400
#define HINATA_TASK_FLAG_TRACED             0x0800
#define HINATA_TASK_FLAG_HIGH_PRIORITY      0x1000
#define HINATA_TASK_FLAG_LOW_PRIORITY       0x2000
#define HINATA_TASK_FLAG_REAL_TIME          0x4000
#define HINATA_TASK_FLAG_BATCH              0x8000

/* Task states */
enum hinata_task_state {
    HINATA_TASK_STATE_PENDING = 0,
    HINATA_TASK_STATE_QUEUED,
    HINATA_TASK_STATE_ASSIGNED,
    HINATA_TASK_STATE_RUNNING,
    HINATA_TASK_STATE_COMPLETED,
    HINATA_TASK_STATE_FAILED,
    HINATA_TASK_STATE_CANCELLED,
    HINATA_TASK_STATE_TIMEOUT,
    HINATA_TASK_STATE_RETRYING,
    HINATA_TASK_STATE_SUSPENDED,
    HINATA_TASK_STATE_MAX,
};

/* Worker states */
enum hinata_worker_state {
    HINATA_WORKER_STATE_UNINITIALIZED = 0,
    HINATA_WORKER_STATE_INITIALIZING,
    HINATA_WORKER_STATE_IDLE,
    HINATA_WORKER_STATE_STARTING,
    HINATA_WORKER_STATE_RUNNING,
    HINATA_WORKER_STATE_BUSY,
    HINATA_WORKER_STATE_STOPPING,
    HINATA_WORKER_STATE_STOPPED,
    HINATA_WORKER_STATE_ERROR,
    HINATA_WORKER_STATE_SUSPENDED,
    HINATA_WORKER_STATE_MAX,
};

/* Worker flags */
#define HINATA_WORKER_FLAG_PERSISTENT       0x0001
#define HINATA_WORKER_FLAG_DEDICATED        0x0002
#define HINATA_WORKER_FLAG_CPU_BOUND        0x0004
#define HINATA_WORKER_FLAG_IO_BOUND         0x0008
#define HINATA_WORKER_FLAG_MEMORY_BOUND     0x0010
#define HINATA_WORKER_FLAG_REAL_TIME        0x0020
#define HINATA_WORKER_FLAG_BATCH            0x0040
#define HINATA_WORKER_FLAG_INTERACTIVE      0x0080
#define HINATA_WORKER_FLAG_BACKGROUND       0x0100
#define HINATA_WORKER_FLAG_SYSTEM           0x0200
#define HINATA_WORKER_FLAG_USER             0x0400
#define HINATA_WORKER_FLAG_KERNEL           0x0800

/* Load balancing strategies */
enum hinata_load_balance_strategy {
    HINATA_LOAD_BALANCE_ROUND_ROBIN = 0,
    HINATA_LOAD_BALANCE_LEAST_LOADED,
    HINATA_LOAD_BALANCE_RANDOM,
    HINATA_LOAD_BALANCE_CPU_AFFINITY,
    HINATA_LOAD_BALANCE_PRIORITY,
    HINATA_LOAD_BALANCE_CUSTOM,
    HINATA_LOAD_BALANCE_MAX,
};

/* Task priority levels */
enum hinata_task_priority {
    HINATA_TASK_PRIORITY_LOWEST = 0,
    HINATA_TASK_PRIORITY_LOW,
    HINATA_TASK_PRIORITY_BELOW_NORMAL,
    HINATA_TASK_PRIORITY_NORMAL,
    HINATA_TASK_PRIORITY_ABOVE_NORMAL,
    HINATA_TASK_PRIORITY_HIGH,
    HINATA_TASK_PRIORITY_HIGHEST,
    HINATA_TASK_PRIORITY_CRITICAL,
    HINATA_TASK_PRIORITY_MAX,
};

/* Forward declarations */
struct hinata_task;
struct hinata_worker;
struct hinata_task_queue;
struct hinata_worker_pool;
struct hinata_task_context;
struct hinata_worker_context;

/* Task function type */
typedef int (*hinata_task_func_t)(void *data);

/* Task completion callback type */
typedef void (*hinata_task_completion_t)(struct hinata_task *task, int result);

/* Worker event callback type */
typedef void (*hinata_worker_event_t)(struct hinata_worker *worker, 
                                     enum hinata_worker_state old_state,
                                     enum hinata_worker_state new_state);

/* Task structure */
struct hinata_task {
    struct list_head list;
    struct rcu_head rcu;
    
    /* Identification */
    u32 id;
    char name[HINATA_WORKER_NAME_MAX];
    char description[HINATA_WORKER_DESC_MAX];
    
    /* Type and state */
    enum hinata_task_type type;
    enum hinata_task_state state;
    u32 flags;
    u32 priority;
    
    /* Function and data */
    hinata_task_func_t func;
    void *data;
    size_t data_size;
    
    /* Completion callback */
    hinata_task_completion_t completion_cb;
    void *completion_data;
    
    /* Worker assignment */
    struct hinata_worker *worker;
    int cpu;
    int numa_node;
    
    /* Timing */
    u64 submit_time;
    u64 queue_time;
    u64 start_time;
    u64 end_time;
    u64 timeout;
    u64 deadline;
    
    /* Result */
    int result;
    void *result_data;
    size_t result_size;
    
    /* Retry */
    u32 retry_count;
    u32 max_retries;
    u64 retry_delay;
    u64 next_retry_time;
    
    /* Dependencies */
    struct list_head dependencies;
    struct list_head dependents;
    atomic_t dependency_count;
    
    /* Synchronization */
    struct completion completion;
    wait_queue_head_t wait_queue;
    struct mutex mutex;
    
    /* Statistics */
    u64 cpu_time;
    u64 memory_usage;
    u64 io_operations;
    u64 context_switches;
    
    /* Debug and tracing */
    void *debug_data;
    void *trace_data;
    u64 trace_id;
    
    /* Reference counting */
    atomic_t refcount;
};

/* Task dependency structure */
struct hinata_task_dependency {
    struct list_head list;
    struct hinata_task *task;
    struct hinata_task *dependency;
    u32 flags;
};

/* Task context structure */
struct hinata_task_context {
    struct hinata_task *task;
    struct hinata_worker *worker;
    void *private_data;
    
    /* Timing */
    u64 start_time;
    u64 last_checkpoint;
    
    /* Progress */
    u32 progress_percent;
    u64 bytes_processed;
    u64 items_processed;
    
    /* Cancellation */
    bool cancelled;
    bool should_stop;
    
    /* Memory tracking */
    size_t memory_allocated;
    size_t memory_peak;
    
    /* I/O tracking */
    u64 bytes_read;
    u64 bytes_written;
    u64 io_operations;
};

/* Task queue statistics */
struct hinata_task_queue_stats {
    atomic64_t tasks_queued;
    atomic64_t tasks_processed;
    atomic64_t tasks_failed;
    atomic64_t tasks_cancelled;
    atomic64_t tasks_timeout;
    atomic64_t tasks_retried;
    
    /* Timing statistics */
    u64 total_wait_time;
    u64 total_process_time;
    u64 max_wait_time;
    u64 max_process_time;
    u64 avg_wait_time;
    u64 avg_process_time;
    
    /* Queue depth statistics */
    u32 max_queue_depth;
    u32 avg_queue_depth;
    u32 current_queue_depth;
};

/* Task queue structure */
struct hinata_task_queue {
    /* Priority queues */
    struct list_head tasks[HINATA_WORKER_PRIORITY_LEVELS];
    
    /* Synchronization */
    spinlock_t lock;
    wait_queue_head_t wait_queue;
    
    /* Counters */
    atomic_t count;
    atomic_t pending_count;
    atomic_t running_count;
    
    /* Configuration */
    u32 max_tasks;
    u32 max_priority;
    u32 default_timeout;
    
    /* Statistics */
    struct hinata_task_queue_stats stats;
    
    /* Load balancing */
    atomic_t next_priority;
    u32 balance_strategy;
};

/* Worker statistics */
struct hinata_worker_stats {
    atomic64_t tasks_processed;
    atomic64_t tasks_failed;
    atomic64_t tasks_cancelled;
    atomic64_t tasks_timeout;
    
    /* Timing statistics */
    u64 total_active_time;
    u64 total_idle_time;
    u64 last_activity_time;
    u64 creation_time;
    
    /* Performance statistics */
    u64 avg_task_time;
    u64 max_task_time;
    u64 min_task_time;
    
    /* Resource usage */
    u64 memory_usage;
    u64 cpu_usage;
    u64 context_switches;
};

/* Worker configuration */
struct hinata_worker_config {
    char name[HINATA_WORKER_NAME_MAX];
    u32 flags;
    u32 priority;
    u32 stack_size;
    u32 idle_timeout;
    u32 task_timeout;
    int cpu_affinity;
    int numa_node;
    
    /* Callbacks */
    hinata_worker_event_t event_cb;
    void *event_data;
};

/* Worker structure */
struct hinata_worker {
    /* Identification */
    u32 id;
    char name[HINATA_WORKER_NAME_MAX];
    
    /* State */
    enum hinata_worker_state state;
    u32 flags;
    u32 priority;
    
    /* Thread */
    struct task_struct *task;
    int cpu;
    int numa_node;
    
    /* Current task */
    struct hinata_task *current_task;
    struct hinata_task_context *task_context;
    
    /* Task list */
    struct list_head task_list;
    spinlock_t task_lock;
    wait_queue_head_t wait_queue;
    
    /* Configuration */
    struct hinata_worker_config config;
    
    /* Statistics */
    struct hinata_worker_stats stats;
    
    /* Timing */
    u64 creation_time;
    u64 start_time;
    u64 last_activity;
    u64 idle_start_time;
    
    /* Synchronization */
    struct mutex mutex;
    struct completion completion;
    
    /* Health monitoring */
    u64 last_heartbeat;
    u32 health_check_failures;
    bool is_healthy;
    
    /* Debug */
    void *debug_data;
    u64 debug_flags;
};

/* Worker pool statistics */
struct hinata_worker_pool_stats {
    atomic64_t tasks_distributed;
    atomic64_t load_balance_operations;
    atomic64_t worker_spawns;
    atomic64_t worker_deaths;
    atomic64_t worker_restarts;
    
    /* Pool statistics */
    u32 max_workers;
    u32 min_workers;
    u32 current_workers;
    u32 active_workers;
    u32 idle_workers;
    u32 busy_workers;
    
    /* Performance statistics */
    u64 total_throughput;
    u64 avg_throughput;
    u64 peak_throughput;
    
    /* Resource usage */
    u64 total_memory_usage;
    u64 peak_memory_usage;
    u64 total_cpu_usage;
};

/* Worker pool configuration */
struct hinata_worker_pool_config {
    u32 min_workers;
    u32 max_workers;
    u32 initial_workers;
    u32 idle_timeout;
    u32 task_timeout;
    u32 health_check_interval;
    
    enum hinata_load_balance_strategy load_balance_strategy;
    
    /* Scaling parameters */
    u32 scale_up_threshold;
    u32 scale_down_threshold;
    u32 scale_up_delay;
    u32 scale_down_delay;
    
    /* Resource limits */
    u64 max_memory_usage;
    u32 max_cpu_usage;
    
    /* Callbacks */
    hinata_worker_event_t worker_event_cb;
    void *event_data;
};

/* Worker pool structure */
struct hinata_worker_pool {
    /* Workers */
    struct hinata_worker *workers;
    u32 worker_count;
    u32 max_workers;
    
    /* Task queue */
    struct hinata_task_queue task_queue;
    
    /* Load balancing */
    atomic_t next_worker;
    enum hinata_load_balance_strategy load_balance_strategy;
    
    /* Configuration */
    struct hinata_worker_pool_config config;
    
    /* Statistics */
    struct hinata_worker_pool_stats stats;
    
    /* Synchronization */
    struct mutex mutex;
    struct rw_semaphore rwsem;
    wait_queue_head_t wait_queue;
    
    /* Health monitoring */
    struct timer_list health_timer;
    struct work_struct health_work;
    
    /* Scaling */
    struct delayed_work scale_work;
    u64 last_scale_time;
    
    /* State */
    bool initialized;
    bool running;
    bool shutting_down;
};

/* Task submission arguments */
struct hinata_task_args {
    enum hinata_task_type type;
    hinata_task_func_t func;
    void *data;
    size_t data_size;
    u32 flags;
    u32 priority;
    u64 timeout;
    u32 max_retries;
    const char *name;
    const char *description;
    hinata_task_completion_t completion_cb;
    void *completion_data;
};

/* Task query structure */
struct hinata_task_query {
    u32 task_id;
    enum hinata_task_type type;
    enum hinata_task_state state;
    u32 flags;
    u32 worker_id;
    u64 submit_time_min;
    u64 submit_time_max;
    u64 duration_min;
    u64 duration_max;
};

/* Task information structure */
struct hinata_task_info {
    u32 id;
    char name[HINATA_WORKER_NAME_MAX];
    char description[HINATA_WORKER_DESC_MAX];
    enum hinata_task_type type;
    enum hinata_task_state state;
    u32 flags;
    u32 priority;
    u32 worker_id;
    int cpu;
    u64 submit_time;
    u64 start_time;
    u64 end_time;
    u64 duration;
    int result;
    u32 retry_count;
    u64 memory_usage;
    u64 cpu_time;
};

/* Worker information structure */
struct hinata_worker_info {
    u32 id;
    char name[HINATA_WORKER_NAME_MAX];
    enum hinata_worker_state state;
    u32 flags;
    u32 priority;
    int cpu;
    int numa_node;
    u32 current_task_id;
    u64 creation_time;
    u64 last_activity;
    u64 tasks_processed;
    u64 tasks_failed;
    u64 memory_usage;
    u64 cpu_usage;
    bool is_healthy;
};

/* Function declarations */

/* Core worker functions */
int hinata_worker_thread(void *data);
int hinata_worker_init(struct hinata_worker *worker, 
                      const struct hinata_worker_config *config);
void hinata_worker_cleanup(struct hinata_worker *worker);
int hinata_worker_start(struct hinata_worker *worker);
int hinata_worker_stop(struct hinata_worker *worker);
int hinata_worker_suspend(struct hinata_worker *worker);
int hinata_worker_resume(struct hinata_worker *worker);

/* Task management functions */
int hinata_submit_task(enum hinata_task_type type, hinata_task_func_t func,
                      void *data, size_t data_size, u32 flags);
int hinata_submit_task_ex(const struct hinata_task_args *args);
int hinata_wait_task(u32 task_id, u32 timeout_ms);
int hinata_cancel_task(u32 task_id);
int hinata_retry_task(u32 task_id);
int hinata_get_task_info(u32 task_id, struct hinata_task_info *info);
int hinata_query_tasks(const struct hinata_task_query *query,
                      struct hinata_task_info *results, u32 max_results);

/* Worker pool functions */
int hinata_worker_pool_init(struct hinata_worker_pool *pool,
                           const struct hinata_worker_pool_config *config);
void hinata_worker_pool_cleanup(struct hinata_worker_pool *pool);
int hinata_worker_pool_start(struct hinata_worker_pool *pool);
int hinata_worker_pool_stop(struct hinata_worker_pool *pool);
int hinata_worker_pool_scale(struct hinata_worker_pool *pool, u32 target_workers);
int hinata_worker_pool_get_stats(struct hinata_worker_pool *pool,
                                struct hinata_worker_pool_stats *stats);

/* Worker management functions */
int hinata_add_worker(struct hinata_worker_pool *pool,
                     const struct hinata_worker_config *config);
int hinata_remove_worker(struct hinata_worker_pool *pool, u32 worker_id);
int hinata_get_worker_info(u32 worker_id, struct hinata_worker_info *info);
int hinata_set_worker_priority(u32 worker_id, u32 priority);
int hinata_set_worker_cpu_affinity(u32 worker_id, int cpu);

/* Task queue functions */
int hinata_task_queue_init(struct hinata_task_queue *queue);
void hinata_task_queue_cleanup(struct hinata_task_queue *queue);
int hinata_task_queue_add(struct hinata_task_queue *queue, struct hinata_task *task);
struct hinata_task *hinata_task_queue_get(struct hinata_task_queue *queue);
void hinata_task_queue_remove(struct hinata_task_queue *queue, struct hinata_task *task);
int hinata_task_queue_get_stats(struct hinata_task_queue *queue,
                               struct hinata_task_queue_stats *stats);

/* Load balancing functions */
int hinata_set_load_balance_strategy(enum hinata_load_balance_strategy strategy);
enum hinata_load_balance_strategy hinata_get_load_balance_strategy(void);
struct hinata_worker *hinata_select_worker(struct hinata_worker_pool *pool,
                                          struct hinata_task *task);

/* Health monitoring functions */
int hinata_worker_health_check(struct hinata_worker *worker);
void hinata_worker_health_monitor_start(void);
void hinata_worker_health_monitor_stop(void);
bool hinata_worker_is_healthy(struct hinata_worker *worker);

/* Statistics and monitoring functions */
int hinata_get_worker_stats(u32 worker_id, struct hinata_worker_stats *stats);
int hinata_get_task_queue_stats(struct hinata_task_queue_stats *stats);
int hinata_get_pool_stats(struct hinata_worker_pool_stats *stats);
void hinata_reset_worker_stats(u32 worker_id);
void hinata_reset_pool_stats(void);

/* Configuration functions */
int hinata_set_worker_config(u32 worker_id, const struct hinata_worker_config *config);
int hinata_get_worker_config(u32 worker_id, struct hinata_worker_config *config);
int hinata_set_pool_config(const struct hinata_worker_pool_config *config);
int hinata_get_pool_config(struct hinata_worker_pool_config *config);

/* Event and callback functions */
int hinata_register_worker_event_callback(hinata_worker_event_t callback, void *data);
void hinata_unregister_worker_event_callback(hinata_worker_event_t callback);

/* Debug and diagnostics functions */
int hinata_dump_worker_state(u32 worker_id, char *buffer, size_t size);
int hinata_dump_task_state(u32 task_id, char *buffer, size_t size);
int hinata_dump_pool_state(char *buffer, size_t size);
void hinata_worker_debug_enable(u32 worker_id, u64 debug_flags);
void hinata_worker_debug_disable(u32 worker_id, u64 debug_flags);

/* Utility functions */
const char *hinata_task_type_to_string(enum hinata_task_type type);
const char *hinata_task_state_to_string(enum hinata_task_state state);
const char *hinata_worker_state_to_string(enum hinata_worker_state state);
const char *hinata_load_balance_strategy_to_string(enum hinata_load_balance_strategy strategy);
u32 hinata_get_optimal_worker_count(void);
u32 hinata_get_cpu_count(void);
u32 hinata_get_numa_node_count(void);

/* Inline helper functions */

/**
 * hinata_task_is_pending - Check if task is pending
 * @task: Task to check
 * 
 * Returns: true if pending, false otherwise
 */
static inline bool hinata_task_is_pending(const struct hinata_task *task)
{
    return task && (task->state == HINATA_TASK_STATE_PENDING ||
                   task->state == HINATA_TASK_STATE_QUEUED);
}

/**
 * hinata_task_is_running - Check if task is running
 * @task: Task to check
 * 
 * Returns: true if running, false otherwise
 */
static inline bool hinata_task_is_running(const struct hinata_task *task)
{
    return task && (task->state == HINATA_TASK_STATE_RUNNING ||
                   task->state == HINATA_TASK_STATE_ASSIGNED);
}

/**
 * hinata_task_is_completed - Check if task is completed
 * @task: Task to check
 * 
 * Returns: true if completed, false otherwise
 */
static inline bool hinata_task_is_completed(const struct hinata_task *task)
{
    return task && (task->state == HINATA_TASK_STATE_COMPLETED ||
                   task->state == HINATA_TASK_STATE_FAILED ||
                   task->state == HINATA_TASK_STATE_CANCELLED ||
                   task->state == HINATA_TASK_STATE_TIMEOUT);
}

/**
 * hinata_worker_is_idle - Check if worker is idle
 * @worker: Worker to check
 * 
 * Returns: true if idle, false otherwise
 */
static inline bool hinata_worker_is_idle(const struct hinata_worker *worker)
{
    return worker && worker->state == HINATA_WORKER_STATE_IDLE;
}

/**
 * hinata_worker_is_busy - Check if worker is busy
 * @worker: Worker to check
 * 
 * Returns: true if busy, false otherwise
 */
static inline bool hinata_worker_is_busy(const struct hinata_worker *worker)
{
    return worker && (worker->state == HINATA_WORKER_STATE_BUSY ||
                     worker->state == HINATA_WORKER_STATE_RUNNING);
}

/**
 * hinata_task_get_duration - Get task duration
 * @task: Task to check
 * 
 * Returns: Task duration in nanoseconds
 */
static inline u64 hinata_task_get_duration(const struct hinata_task *task)
{
    if (!task || !task->start_time) {
        return 0;
    }
    
    if (task->end_time) {
        return task->end_time - task->start_time;
    }
    
    return ktime_get_ns() - task->start_time;
}

/**
 * hinata_task_get_wait_time - Get task wait time
 * @task: Task to check
 * 
 * Returns: Task wait time in nanoseconds
 */
static inline u64 hinata_task_get_wait_time(const struct hinata_task *task)
{
    if (!task || !task->submit_time) {
        return 0;
    }
    
    if (task->start_time) {
        return task->start_time - task->submit_time;
    }
    
    return ktime_get_ns() - task->submit_time;
}

/**
 * hinata_worker_get_uptime - Get worker uptime
 * @worker: Worker to check
 * 
 * Returns: Worker uptime in nanoseconds
 */
static inline u64 hinata_worker_get_uptime(const struct hinata_worker *worker)
{
    if (!worker || !worker->start_time) {
        return 0;
    }
    
    return ktime_get_ns() - worker->start_time;
}

/**
 * hinata_task_queue_is_empty - Check if task queue is empty
 * @queue: Task queue to check
 * 
 * Returns: true if empty, false otherwise
 */
static inline bool hinata_task_queue_is_empty(const struct hinata_task_queue *queue)
{
    return queue && atomic_read(&queue->count) == 0;
}

/**
 * hinata_task_queue_get_count - Get task queue count
 * @queue: Task queue to check
 * 
 * Returns: Number of tasks in queue
 */
static inline u32 hinata_task_queue_get_count(const struct hinata_task_queue *queue)
{
    return queue ? atomic_read(&queue->count) : 0;
}

/**
 * hinata_worker_pool_get_worker_count - Get worker pool worker count
 * @pool: Worker pool to check
 * 
 * Returns: Number of workers in pool
 */
static inline u32 hinata_worker_pool_get_worker_count(const struct hinata_worker_pool *pool)
{
    return pool ? pool->worker_count : 0;
}

/* Error codes */
#define HINATA_WORKER_ERROR_BASE        (-4000)
#define HINATA_WORKER_ERROR_INVALID     (HINATA_WORKER_ERROR_BASE - 1)
#define HINATA_WORKER_ERROR_NOMEM       (HINATA_WORKER_ERROR_BASE - 2)
#define HINATA_WORKER_ERROR_BUSY        (HINATA_WORKER_ERROR_BASE - 3)
#define HINATA_WORKER_ERROR_TIMEOUT     (HINATA_WORKER_ERROR_BASE - 4)
#define HINATA_WORKER_ERROR_CANCELLED   (HINATA_WORKER_ERROR_BASE - 5)
#define HINATA_WORKER_ERROR_FAILED      (HINATA_WORKER_ERROR_BASE - 6)
#define HINATA_WORKER_ERROR_NOT_FOUND   (HINATA_WORKER_ERROR_BASE - 7)
#define HINATA_WORKER_ERROR_NOT_READY   (HINATA_WORKER_ERROR_BASE - 8)
#define HINATA_WORKER_ERROR_SHUTDOWN    (HINATA_WORKER_ERROR_BASE - 9)
#define HINATA_WORKER_ERROR_OVERLOAD    (HINATA_WORKER_ERROR_BASE - 10)

/* Performance macros */
#define HINATA_WORKER_PERF_COUNTER_INC(counter) \
    do { \
        if (likely(counter)) \
            atomic64_inc(counter); \
    } while (0)

#define HINATA_WORKER_PERF_COUNTER_ADD(counter, value) \
    do { \
        if (likely(counter)) \
            atomic64_add(value, counter); \
    } while (0)

#define HINATA_WORKER_PERF_TIME_START(start_time) \
    do { \
        start_time = ktime_get_ns(); \
    } while (0)

#define HINATA_WORKER_PERF_TIME_END(start_time, duration) \
    do { \
        duration = ktime_get_ns() - start_time; \
    } while (0)

/* Memory management macros */
#define HINATA_WORKER_ALLOC(size) \
    kzalloc(size, GFP_KERNEL)

#define HINATA_WORKER_FREE(ptr) \
    do { \
        if (ptr) { \
            kfree(ptr); \
            ptr = NULL; \
        } \
    } while (0)

/* Validation macros */
#define HINATA_WORKER_VALIDATE_PTR(ptr) \
    do { \
        if (unlikely(!ptr)) \
            return -EINVAL; \
    } while (0)

#define HINATA_WORKER_VALIDATE_STATE(worker, expected_state) \
    do { \
        if (unlikely(!worker || worker->state != expected_state)) \
            return -EINVAL; \
    } while (0)

#define HINATA_WORKER_VALIDATE_TASK(task) \
    do { \
        if (unlikely(!task || !task->func)) \
            return -EINVAL; \
    } while (0)

#endif /* _HINATA_WORKER_H */
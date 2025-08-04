/*
 * HiNATA User Interface Header
 * Part of notcontrolOS Knowledge Management System
 * 
 * This file defines interfaces, data structures, and constants
 * for user-space access to HiNATA kernel functionality.
 */

#ifndef _HINATA_INTERFACE_H
#define _HINATA_INTERFACE_H

#include <linux/types.h>
#include <linux/ioctl.h>
#include <linux/fs.h>
#include <linux/device.h>
#include <linux/cdev.h>
#include <linux/proc_fs.h>
#include <linux/kobject.h>
#include <linux/debugfs.h>
#include <linux/poll.h>
#include <linux/wait.h>
#include <linux/mutex.h>
#include <linux/spinlock.h>
#include <linux/atomic.h>
#include <linux/list.h>
#include <linux/workqueue.h>
#include <linux/completion.h>
#include <linux/time.h>
#include <linux/ktime.h>
#include <linux/sched.h>
#include "../hinata_types.h"

/* Interface version */
#define HINATA_INTERFACE_VERSION_MAJOR      1
#define HINATA_INTERFACE_VERSION_MINOR      0
#define HINATA_INTERFACE_VERSION_PATCH      0
#define HINATA_INTERFACE_VERSION_STRING     "1.0.0"

/* Device constants */
#define HINATA_DEVICE_NAME                  "hinata"
#define HINATA_DEVICE_CLASS_NAME            "hinata_class"
#define HINATA_DEVICE_MINOR_COUNT           16
#define HINATA_MAX_OPEN_FILES               256

/* Buffer sizes */
#define HINATA_BUFFER_SIZE                  4096
#define HINATA_EVENT_BUFFER_SIZE            1024
#define HINATA_MMAP_SIZE                    (1024 * 1024)  /* 1MB */
#define HINATA_MAX_IOCTL_SIZE               8192

/* File operation types */
#define HINATA_FILE_OP_READ                 0x01
#define HINATA_FILE_OP_WRITE                0x02
#define HINATA_FILE_OP_IOCTL                0x04
#define HINATA_FILE_OP_MMAP                 0x08
#define HINATA_FILE_OP_POLL                 0x10
#define HINATA_FILE_OP_SEEK                 0x20
#define HINATA_FILE_OP_SYNC                 0x40
#define HINATA_FILE_OP_FLUSH                0x80

/* Event types */
#define HINATA_EVENT_TYPE_DEVICE_OPEN       0x0001
#define HINATA_EVENT_TYPE_DEVICE_CLOSE      0x0002
#define HINATA_EVENT_TYPE_DEVICE_READ       0x0003
#define HINATA_EVENT_TYPE_DEVICE_WRITE      0x0004
#define HINATA_EVENT_TYPE_DEVICE_IOCTL      0x0005
#define HINATA_EVENT_TYPE_DEVICE_MMAP       0x0006
#define HINATA_EVENT_TYPE_PACKET_CREATE     0x0010
#define HINATA_EVENT_TYPE_PACKET_DESTROY    0x0011
#define HINATA_EVENT_TYPE_PACKET_UPDATE     0x0012
#define HINATA_EVENT_TYPE_STORAGE_READ      0x0020
#define HINATA_EVENT_TYPE_STORAGE_WRITE     0x0021
#define HINATA_EVENT_TYPE_STORAGE_DELETE    0x0022
#define HINATA_EVENT_TYPE_MEMORY_ALLOC      0x0030
#define HINATA_EVENT_TYPE_MEMORY_FREE       0x0031
#define HINATA_EVENT_TYPE_MEMORY_LEAK       0x0032
#define HINATA_EVENT_TYPE_VALIDATION_PASS   0x0040
#define HINATA_EVENT_TYPE_VALIDATION_FAIL   0x0041
#define HINATA_EVENT_TYPE_SYSTEM_START      0x0050
#define HINATA_EVENT_TYPE_SYSTEM_STOP       0x0051
#define HINATA_EVENT_TYPE_SYSTEM_ERROR      0x0052
#define HINATA_EVENT_TYPE_DEBUG_MESSAGE     0x0060
#define HINATA_EVENT_TYPE_PERFORMANCE       0x0070
#define HINATA_EVENT_TYPE_SECURITY          0x0080
#define HINATA_EVENT_TYPE_USER_DEFINED      0x1000

/* Event flags */
#define HINATA_EVENT_FLAG_URGENT            0x0001
#define HINATA_EVENT_FLAG_PERSISTENT        0x0002
#define HINATA_EVENT_FLAG_BROADCAST         0x0004
#define HINATA_EVENT_FLAG_ENCRYPTED         0x0008
#define HINATA_EVENT_FLAG_COMPRESSED        0x0010
#define HINATA_EVENT_FLAG_TIMESTAMPED       0x0020
#define HINATA_EVENT_FLAG_SIGNED            0x0040
#define HINATA_EVENT_FLAG_FILTERED          0x0080

/* IOCTL magic number */
#define HINATA_IOCTL_MAGIC                  'H'

/* IOCTL commands */
#define HINATA_IOCTL_GET_VERSION            _IOR(HINATA_IOCTL_MAGIC, 0x01, struct hinata_version_info)
#define HINATA_IOCTL_GET_SYSTEM_INFO        _IOR(HINATA_IOCTL_MAGIC, 0x02, struct hinata_system_info)
#define HINATA_IOCTL_GET_STATISTICS         _IOR(HINATA_IOCTL_MAGIC, 0x03, struct hinata_system_stats)
#define HINATA_IOCTL_SET_EVENT_MASK         _IOW(HINATA_IOCTL_MAGIC, 0x04, u32)
#define HINATA_IOCTL_GET_EVENT_MASK         _IOR(HINATA_IOCTL_MAGIC, 0x05, u32)
#define HINATA_IOCTL_FLUSH_EVENTS           _IO(HINATA_IOCTL_MAGIC, 0x06)
#define HINATA_IOCTL_CREATE_PACKET          _IOWR(HINATA_IOCTL_MAGIC, 0x10, struct hinata_packet_create_args)
#define HINATA_IOCTL_DESTROY_PACKET         _IOW(HINATA_IOCTL_MAGIC, 0x11, hinata_uuid_t)
#define HINATA_IOCTL_GET_PACKET             _IOWR(HINATA_IOCTL_MAGIC, 0x12, struct hinata_packet_get_args)
#define HINATA_IOCTL_UPDATE_PACKET          _IOW(HINATA_IOCTL_MAGIC, 0x13, struct hinata_packet_update_args)
#define HINATA_IOCTL_QUERY_PACKETS          _IOWR(HINATA_IOCTL_MAGIC, 0x14, struct hinata_packet_query_args)
#define HINATA_IOCTL_VALIDATE_PACKET        _IOWR(HINATA_IOCTL_MAGIC, 0x15, struct hinata_packet_validate_args)
#define HINATA_IOCTL_STORE_PACKET           _IOW(HINATA_IOCTL_MAGIC, 0x20, struct hinata_storage_store_args)
#define HINATA_IOCTL_LOAD_PACKET            _IOWR(HINATA_IOCTL_MAGIC, 0x21, struct hinata_storage_load_args)
#define HINATA_IOCTL_DELETE_PACKET          _IOW(HINATA_IOCTL_MAGIC, 0x22, hinata_uuid_t)
#define HINATA_IOCTL_SYNC_STORAGE           _IO(HINATA_IOCTL_MAGIC, 0x23)
#define HINATA_IOCTL_GET_MEMORY_INFO        _IOR(HINATA_IOCTL_MAGIC, 0x30, struct hinata_memory_info)
#define HINATA_IOCTL_GET_MEMORY_STATS       _IOR(HINATA_IOCTL_MAGIC, 0x31, struct hinata_memory_stats)
#define HINATA_IOCTL_TRIGGER_GC             _IO(HINATA_IOCTL_MAGIC, 0x32)
#define HINATA_IOCTL_SET_DEBUG_LEVEL        _IOW(HINATA_IOCTL_MAGIC, 0x40, u32)
#define HINATA_IOCTL_GET_DEBUG_LEVEL        _IOR(HINATA_IOCTL_MAGIC, 0x41, u32)
#define HINATA_IOCTL_DUMP_STATE             _IOW(HINATA_IOCTL_MAGIC, 0x42, struct hinata_debug_dump_args)
#define HINATA_IOCTL_RESET_STATS            _IO(HINATA_IOCTL_MAGIC, 0x43)
#define HINATA_IOCTL_BENCHMARK              _IOWR(HINATA_IOCTL_MAGIC, 0x50, struct hinata_benchmark_args)
#define HINATA_IOCTL_STRESS_TEST            _IOWR(HINATA_IOCTL_MAGIC, 0x51, struct hinata_stress_test_args)
#define HINATA_IOCTL_PERFORMANCE_TEST       _IOWR(HINATA_IOCTL_MAGIC, 0x52, struct hinata_performance_test_args)

/* Forward declarations */
struct hinata_file_context;
struct hinata_event;
struct hinata_interface_stats;

/* Version information structure */
struct hinata_version_info {
    u32 major;
    u32 minor;
    u32 patch;
    char build[32];
    u64 timestamp;
    u32 features;
    u32 reserved[4];
};

/* Event structure */
struct hinata_event {
    u32 type;
    u32 flags;
    u64 timestamp;
    u32 source_pid;
    u32 source_uid;
    size_t data_size;
    void *data;
    struct list_head list;
};

/* File context structure */
struct hinata_file_context {
    struct file *file;
    pid_t pid;
    uid_t uid;
    gid_t gid;
    u32 flags;
    u32 permissions;
    void *buffer;
    size_t buffer_size;
    loff_t position;
    atomic_t ref_count;
    struct mutex lock;
    struct list_head event_list;
    wait_queue_head_t wait_queue;
    u32 event_mask;
    struct work_struct work;
    struct completion completion;
    char comm[TASK_COMM_LEN];
    u64 open_time;
    u64 last_access;
    atomic64_t read_count;
    atomic64_t write_count;
    atomic64_t ioctl_count;
    struct list_head list;
};

/* Interface statistics */
struct hinata_interface_stats {
    atomic64_t device_opens;
    atomic64_t device_closes;
    atomic64_t device_reads;
    atomic64_t device_writes;
    atomic64_t device_ioctls;
    atomic64_t device_mmaps;
    atomic64_t device_polls;
    atomic64_t device_seeks;
    atomic64_t device_syncs;
    atomic64_t device_flushes;
    atomic64_t events_generated;
    atomic64_t events_consumed;
    atomic64_t events_dropped;
    atomic64_t proc_reads;
    atomic64_t sysfs_reads;
    atomic64_t debugfs_reads;
    atomic64_t errors;
    u64 last_reset;
};

/* IOCTL argument structures */
struct hinata_packet_create_args {
    u32 type;
    u32 priority;
    size_t content_size;
    void __user *content;
    size_t metadata_size;
    void __user *metadata;
    u32 flags;
    hinata_uuid_t *packet_id;  /* Output */
};

struct hinata_packet_get_args {
    hinata_uuid_t packet_id;
    size_t buffer_size;
    void __user *buffer;
    size_t *actual_size;  /* Output */
    u32 flags;
};

struct hinata_packet_update_args {
    hinata_uuid_t packet_id;
    u32 update_mask;
    size_t content_size;
    void __user *content;
    size_t metadata_size;
    void __user *metadata;
    u32 flags;
};

struct hinata_packet_query_args {
    struct hinata_search_criteria criteria;
    size_t max_results;
    struct hinata_search_result __user *results;
    size_t *actual_count;  /* Output */
    u32 flags;
};

struct hinata_packet_validate_args {
    hinata_uuid_t packet_id;
    u32 validation_level;
    u32 validation_flags;
    struct hinata_validation_result *result;  /* Output */
};

struct hinata_storage_store_args {
    hinata_uuid_t packet_id;
    u32 storage_flags;
    u32 compression_type;
    u32 encryption_type;
    char path[256];
};

struct hinata_storage_load_args {
    hinata_uuid_t packet_id;
    char path[256];
    u32 load_flags;
    hinata_uuid_t *loaded_id;  /* Output */
};

struct hinata_debug_dump_args {
    u32 dump_type;
    u32 dump_flags;
    size_t buffer_size;
    void __user *buffer;
    size_t *actual_size;  /* Output */
};

struct hinata_benchmark_args {
    u32 benchmark_type;
    u32 iterations;
    u32 threads;
    u64 *duration;  /* Output in nanoseconds */
    u64 *operations_per_second;  /* Output */
    u32 flags;
};

struct hinata_stress_test_args {
    u32 test_type;
    u32 duration_seconds;
    u32 threads;
    u32 load_level;
    struct hinata_stress_result *result;  /* Output */
    u32 flags;
};

struct hinata_performance_test_args {
    u32 test_suite;
    u32 test_flags;
    struct hinata_performance_result *result;  /* Output */
};

/* Result structures */
struct hinata_validation_result {
    u32 result_code;
    u32 error_count;
    u32 warning_count;
    u64 validation_time;
    char error_message[256];
};

struct hinata_stress_result {
    u64 operations_completed;
    u64 operations_failed;
    u64 average_latency;
    u64 peak_latency;
    u64 memory_peak;
    u32 error_count;
    char status_message[128];
};

struct hinata_performance_result {
    u64 total_time;
    u64 cpu_time;
    u64 memory_usage;
    u64 io_operations;
    u32 test_count;
    u32 passed_count;
    u32 failed_count;
    char summary[256];
};

/* Function declarations */

/* Core interface functions */
int hinata_interface_init(void);
void hinata_interface_exit(void);

/* Device operations */
static int hinata_device_open(struct inode *inode, struct file *file);
static int hinata_device_release(struct inode *inode, struct file *file);
static ssize_t hinata_device_read(struct file *file, char __user *buffer, 
                                 size_t count, loff_t *pos);
static ssize_t hinata_device_write(struct file *file, const char __user *buffer, 
                                  size_t count, loff_t *pos);
static long hinata_device_ioctl(struct file *file, unsigned int cmd, 
                               unsigned long arg);
static int hinata_device_mmap(struct file *file, struct vm_area_struct *vma);
static __poll_t hinata_device_poll(struct file *file, poll_table *wait);
static loff_t hinata_device_llseek(struct file *file, loff_t offset, int whence);
static int hinata_device_fsync(struct file *file, loff_t start, loff_t end, 
                              int datasync);
static int hinata_device_flush(struct file *file, fl_owner_t id);
static int hinata_device_fasync(int fd, struct file *file, int on);

/* Context management */
static struct hinata_file_context *hinata_create_file_context(struct file *file);
static void hinata_destroy_file_context(struct hinata_file_context *ctx);
static int hinata_validate_file_access(struct hinata_file_context *ctx, 
                                      u32 operation);

/* Event management */
int hinata_add_event(u32 type, u32 flags, const void *data, size_t data_size);
void hinata_cleanup_events(void);
static int hinata_filter_event(struct hinata_event *event, u32 mask);
static void hinata_broadcast_event(struct hinata_event *event);

/* Statistics and monitoring */
int hinata_get_interface_stats(struct hinata_interface_stats *stats);
void hinata_reset_interface_stats(void);
int hinata_get_device_info(int minor, struct hinata_device_info *info);

/* Proc filesystem interface */
static int hinata_proc_show(struct seq_file *m, void *v);
static int hinata_proc_open(struct inode *inode, struct file *file);

/* Sysfs interface */
static ssize_t hinata_sysfs_version_show(struct kobject *kobj,
                                        struct kobj_attribute *attr,
                                        char *buf);
static ssize_t hinata_sysfs_state_show(struct kobject *kobj,
                                      struct kobj_attribute *attr,
                                      char *buf);
static ssize_t hinata_sysfs_events_show(struct kobject *kobj,
                                       struct kobj_attribute *attr,
                                       char *buf);

/* Debugfs interface */
static int hinata_debugfs_stats_show(struct seq_file *m, void *v);
static int hinata_debugfs_events_show(struct seq_file *m, void *v);
static int hinata_debugfs_contexts_show(struct seq_file *m, void *v);

/* Utility functions */
static inline bool hinata_is_valid_event_type(u32 type)
{
    return (type >= HINATA_EVENT_TYPE_DEVICE_OPEN && 
            type <= HINATA_EVENT_TYPE_USER_DEFINED + 0xFFF);
}

static inline bool hinata_is_privileged_operation(unsigned int cmd)
{
    switch (cmd) {
    case HINATA_IOCTL_RESET_STATS:
    case HINATA_IOCTL_TRIGGER_GC:
    case HINATA_IOCTL_SET_DEBUG_LEVEL:
    case HINATA_IOCTL_DUMP_STATE:
        return true;
    default:
        return false;
    }
}

static inline size_t hinata_get_ioctl_size(unsigned int cmd)
{
    return _IOC_SIZE(cmd);
}

static inline unsigned int hinata_get_ioctl_dir(unsigned int cmd)
{
    return _IOC_DIR(cmd);
}

static inline bool hinata_is_read_ioctl(unsigned int cmd)
{
    return (_IOC_DIR(cmd) & _IOC_READ) != 0;
}

static inline bool hinata_is_write_ioctl(unsigned int cmd)
{
    return (_IOC_DIR(cmd) & _IOC_WRITE) != 0;
}

static inline u64 hinata_get_current_time_ns(void)
{
    return ktime_get_ns();
}

static inline void hinata_update_access_time(struct hinata_file_context *ctx)
{
    if (ctx) {
        ctx->last_access = hinata_get_current_time_ns();
    }
}

/* Error handling macros */
#define HINATA_INTERFACE_ERROR(fmt, ...) \
    pr_err("HiNATA Interface: " fmt, ##__VA_ARGS__)

#define HINATA_INTERFACE_WARNING(fmt, ...) \
    pr_warn("HiNATA Interface: " fmt, ##__VA_ARGS__)

#define HINATA_INTERFACE_INFO(fmt, ...) \
    pr_info("HiNATA Interface: " fmt, ##__VA_ARGS__)

#define HINATA_INTERFACE_DEBUG(fmt, ...) \
    pr_debug("HiNATA Interface: " fmt, ##__VA_ARGS__)

/* Validation macros */
#define HINATA_VALIDATE_CONTEXT(ctx) \
    do { \
        if (unlikely(!ctx)) { \
            HINATA_INTERFACE_ERROR("Invalid context\n"); \
            return -EINVAL; \
        } \
    } while (0)

#define HINATA_VALIDATE_USER_PTR(ptr, size) \
    do { \
        if (unlikely(!access_ok(ptr, size))) { \
            HINATA_INTERFACE_ERROR("Invalid user pointer\n"); \
            return -EFAULT; \
        } \
    } while (0)

#define HINATA_VALIDATE_IOCTL_SIZE(cmd, expected) \
    do { \
        if (unlikely(_IOC_SIZE(cmd) != sizeof(expected))) { \
            HINATA_INTERFACE_ERROR("Invalid IOCTL size\n"); \
            return -EINVAL; \
        } \
    } while (0)

/* Performance monitoring macros */
#define HINATA_PERF_START(var) \
    u64 var = hinata_get_current_time_ns()

#define HINATA_PERF_END(var, operation) \
    do { \
        u64 duration = hinata_get_current_time_ns() - var; \
        HINATA_INTERFACE_DEBUG("%s took %llu ns\n", operation, duration); \
    } while (0)

/* Memory management helpers */
#define HINATA_INTERFACE_ALLOC(size) \
    hinata_malloc(size)

#define HINATA_INTERFACE_FREE(ptr) \
    hinata_free(ptr)

#define HINATA_INTERFACE_ZALLOC(size) \
    hinata_calloc(1, size)

/* Constants for limits and defaults */
#define HINATA_INTERFACE_MAX_EVENTS         1024
#define HINATA_INTERFACE_MAX_CONTEXTS       256
#define HINATA_INTERFACE_DEFAULT_TIMEOUT    5000  /* 5 seconds */
#define HINATA_INTERFACE_MAX_BUFFER_SIZE    (1024 * 1024)  /* 1MB */
#define HINATA_INTERFACE_MIN_BUFFER_SIZE    64

/* Feature flags */
#define HINATA_INTERFACE_FEATURE_EVENTS     0x00000001
#define HINATA_INTERFACE_FEATURE_MMAP       0x00000002
#define HINATA_INTERFACE_FEATURE_ASYNC      0x00000004
#define HINATA_INTERFACE_FEATURE_COMPRESS   0x00000008
#define HINATA_INTERFACE_FEATURE_ENCRYPT    0x00000010
#define HINATA_INTERFACE_FEATURE_DEBUG      0x00000020
#define HINATA_INTERFACE_FEATURE_STATS      0x00000040
#define HINATA_INTERFACE_FEATURE_BENCHMARK  0x00000080

#endif /* _HINATA_INTERFACE_H */
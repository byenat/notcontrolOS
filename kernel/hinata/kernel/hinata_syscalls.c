/*
 * HiNATA System Calls Implementation
 * Part of notcontrolOS Knowledge Management System
 * 
 * This file implements system call interfaces for HiNATA, providing
 * user-space access to kernel-level knowledge management functionality.
 */

#include <linux/kernel.h>
#include <linux/module.h>
#include <linux/syscalls.h>
#include <linux/uaccess.h>
#include <linux/slab.h>
#include <linux/errno.h>
#include <linux/capability.h>
#include <linux/security.h>
#include <linux/audit.h>
#include <linux/mutex.h>
#include <linux/atomic.h>
#include <linux/time.h>
#include <linux/string.h>
#include <linux/vmalloc.h>
#include <linux/mm.h>
#include <linux/mman.h>
#include <linux/file.h>
#include <linux/fs.h>
#include <linux/anon_inodes.h>
#include <linux/poll.h>
#include <linux/wait.h>
#include <linux/workqueue.h>
#include <linux/completion.h>
#include <linux/ratelimit.h>
#include <linux/cred.h>
#include <linux/pid.h>
#include <linux/sched.h>
#include <linux/signal.h>
#include <linux/proc_fs.h>
#include <linux/seq_file.h>
#include <linux/debugfs.h>
#include <linux/trace_events.h>
#include <linux/perf_event.h>
#include <linux/bpf.h>
#include <linux/filter.h>
#include <linux/seccomp.h>
#include <linux/ptrace.h>
#include <linux/kprobes.h>
#include <linux/ftrace.h>
#include <linux/tracepoint.h>
#include <linux/jump_label.h>
#include <linux/static_key.h>
#include <linux/percpu.h>
#include <linux/cpu.h>
#include <linux/cpumask.h>
#include <linux/topology.h>
#include <linux/numa.h>
#include <linux/memory.h>
#include <linux/memcontrol.h>
#include <linux/cgroup.h>
#include <linux/namespace.h>
#include <linux/user_namespace.h>
#include <linux/mount.h>
#include <linux/path.h>
#include <linux/namei.h>
#include <linux/dcache.h>
#include <linux/inode.h>
#include <linux/dentry.h>
#include <linux/super.h>
#include <linux/statfs.h>
#include <linux/quota.h>
#include <linux/xattr.h>
#include <linux/acl.h>
#include <linux/posix_acl.h>
#include <linux/lsm_hooks.h>
#include <linux/security.h>
#include <linux/selinux.h>
#include <linux/apparmor.h>
#include <linux/smack.h>
#include <linux/tomoyo.h>
#include <linux/ima.h>
#include <linux/evm.h>
#include <linux/integrity.h>
#include <linux/tpm.h>
#include <linux/crypto.h>
#include <linux/hash.h>
#include <linux/random.h>
#include <linux/prandom.h>
#include <linux/crc32.h>
#include <linux/crc32c.h>
#include <linux/xxhash.h>
#include <linux/zlib.h>
#include <linux/lz4.h>
#include <linux/lzo.h>
#include <linux/zstd.h>
#include <linux/xz.h>
#include <linux/lzma.h>
#include <linux/bzip2.h>
#include <linux/snappy.h>
#include <linux/lz4hc.h>
#include <linux/zstd_compress.h>
#include <linux/zstd_decompress.h>
#include <linux/zstd_common.h>
#include <linux/zstd_errors.h>
#include <linux/zstd_internal.h>
#include <linux/zstd_compress_internal.h>
#include <linux/zstd_decompress_internal.h>
#include <linux/zstd_compress_literals.h>
#include <linux/zstd_compress_sequences.h>
#include <linux/zstd_decompress_block.h>
#include <linux/zstd_ldm.h>
#include <linux/zstd_opt.h>
#include <linux/zstd_fast.h>
#include <linux/zstd_double_fast.h>
#include <linux/zstd_lazy.h>
#include <linux/zstd_ldm_geartab.h>
#include "../hinata_types.h"
#include "../hinata_core.h"
#include "../core/hinata_packet.h"
#include "../core/hinata_validation.h"
#include "../storage/hinata_storage.h"
#include "hinata_memory.h"
#include "hinata_syscalls.h"

/* Module information */
#define HINATA_SYSCALLS_VERSION "1.0.0"
#define HINATA_SYSCALLS_AUTHOR "HiNATA Development Team"
#define HINATA_SYSCALLS_DESCRIPTION "HiNATA System Calls Interface"
#define HINATA_SYSCALLS_LICENSE "GPL v2"

MODULE_VERSION(HINATA_SYSCALLS_VERSION);
MODULE_AUTHOR(HINATA_SYSCALLS_AUTHOR);
MODULE_DESCRIPTION(HINATA_SYSCALLS_DESCRIPTION);
MODULE_LICENSE(HINATA_SYSCALLS_LICENSE);

/* System call constants */
#define HINATA_SYSCALL_MAX_ARGS         8
#define HINATA_SYSCALL_MAX_BUFFER_SIZE  (1024 * 1024)  /* 1MB */
#define HINATA_SYSCALL_MAX_STRING_SIZE  4096
#define HINATA_SYSCALL_MAX_ARRAY_SIZE   1000
#define HINATA_SYSCALL_TIMEOUT_MS       30000           /* 30 seconds */
#define HINATA_SYSCALL_RATE_LIMIT       1000            /* calls per second */
#define HINATA_SYSCALL_MAX_CONCURRENT   100
#define HINATA_SYSCALL_STACK_SIZE       8192
#define HINATA_SYSCALL_PRIORITY         0
#define HINATA_SYSCALL_NICE             0

/* System call numbers (would be defined in unistd.h) */
#define __NR_hinata_packet_create       450
#define __NR_hinata_packet_store        451
#define __NR_hinata_packet_load         452
#define __NR_hinata_packet_delete       453
#define __NR_hinata_packet_query        454
#define __NR_hinata_knowledge_create    455
#define __NR_hinata_knowledge_store     456
#define __NR_hinata_knowledge_load      457
#define __NR_hinata_knowledge_delete    458
#define __NR_hinata_knowledge_query     459
#define __NR_hinata_system_info         460
#define __NR_hinata_system_stats        461
#define __NR_hinata_system_config       462
#define __NR_hinata_memory_info         463
#define __NR_hinata_storage_info        464
#define __NR_hinata_validation_check    465
#define __NR_hinata_event_subscribe     466
#define __NR_hinata_event_unsubscribe   467
#define __NR_hinata_debug_dump          468
#define __NR_hinata_benchmark           469

/* Global variables */
static atomic_t hinata_syscall_count = ATOMIC_INIT(0);
static atomic_t hinata_syscall_errors = ATOMIC_INIT(0);
static atomic_t hinata_syscall_concurrent = ATOMIC_INIT(0);
static DEFINE_MUTEX(hinata_syscall_mutex);
static DEFINE_RATELIMIT_STATE(hinata_syscall_ratelimit, HZ, HINATA_SYSCALL_RATE_LIMIT);

/* System call statistics */
struct hinata_syscall_stats {
    atomic64_t total_calls;
    atomic64_t successful_calls;
    atomic64_t failed_calls;
    atomic64_t timeout_calls;
    atomic64_t permission_denied;
    atomic64_t invalid_args;
    atomic64_t buffer_overflow;
    atomic64_t memory_errors;
    atomic64_t concurrent_calls;
    atomic64_t rate_limited;
    u64 average_duration;
    u64 max_duration;
    u64 min_duration;
    u64 last_call_time;
};

static struct hinata_syscall_stats syscall_stats;

/* System call context */
struct hinata_syscall_context {
    struct task_struct *task;
    pid_t pid;
    uid_t uid;
    gid_t gid;
    u64 start_time;
    u64 end_time;
    u32 syscall_nr;
    int result;
    char comm[TASK_COMM_LEN];
    unsigned long caller_ip;
    struct completion completion;
    struct work_struct work;
    atomic_t ref_count;
    struct list_head list;
};

/* Forward declarations */
static long hinata_syscall_validate_args(unsigned int nr, const void __user *args, size_t size);
static int hinata_syscall_check_permission(unsigned int nr);
static void hinata_syscall_update_stats(unsigned int nr, int result, u64 duration);
static struct hinata_syscall_context *hinata_syscall_create_context(unsigned int nr);
static void hinata_syscall_destroy_context(struct hinata_syscall_context *ctx);
static int hinata_syscall_copy_from_user_safe(void *to, const void __user *from, size_t size);
static int hinata_syscall_copy_to_user_safe(void __user *to, const void *from, size_t size);
static int hinata_syscall_validate_string(const char __user *str, size_t max_len);
static int hinata_syscall_validate_buffer(const void __user *buf, size_t size);

/**
 * sys_hinata_packet_create - Create a new HiNATA packet
 * @type: Packet type
 * @content: Packet content
 * @content_size: Size of content
 * @metadata: Packet metadata
 * @metadata_size: Size of metadata
 * @packet_id: Output buffer for packet ID
 * 
 * Returns: 0 on success, negative error code on failure
 */
ASMLINKAGE long sys_hinata_packet_create(u32 type,
                                        const void __user *content,
                                        size_t content_size,
                                        const void __user *metadata,
                                        size_t metadata_size,
                                        hinata_uuid_t __user *packet_id)
{
    struct hinata_syscall_context *ctx;
    struct hinata_packet *packet = NULL;
    void *content_buf = NULL;
    void *metadata_buf = NULL;
    hinata_uuid_t id;
    long ret = 0;
    u64 start_time;

    start_time = ktime_get_ns();
    
    /* Rate limiting */
    if (!__ratelimit(&hinata_syscall_ratelimit)) {
        atomic64_inc(&syscall_stats.rate_limited);
        return -EBUSY;
    }

    /* Check concurrent calls limit */
    if (atomic_inc_return(&hinata_syscall_concurrent) > HINATA_SYSCALL_MAX_CONCURRENT) {
        atomic_dec(&hinata_syscall_concurrent);
        atomic64_inc(&syscall_stats.concurrent_calls);
        return -EBUSY;
    }

    /* Create syscall context */
    ctx = hinata_syscall_create_context(__NR_hinata_packet_create);
    if (!ctx) {
        ret = -ENOMEM;
        goto out_concurrent;
    }

    /* Validate arguments */
    ret = hinata_syscall_validate_args(__NR_hinata_packet_create, content, content_size);
    if (ret < 0) {
        goto out_context;
    }

    /* Check permissions */
    ret = hinata_syscall_check_permission(__NR_hinata_packet_create);
    if (ret < 0) {
        goto out_context;
    }

    /* Validate packet type */
    if (type >= HINATA_PACKET_TYPE_MAX) {
        ret = -EINVAL;
        atomic64_inc(&syscall_stats.invalid_args);
        goto out_context;
    }

    /* Validate content size */
    if (content_size > HINATA_PACKET_MAX_CONTENT_SIZE) {
        ret = -E2BIG;
        atomic64_inc(&syscall_stats.buffer_overflow);
        goto out_context;
    }

    /* Validate metadata size */
    if (metadata_size > HINATA_PACKET_MAX_METADATA_SIZE) {
        ret = -E2BIG;
        atomic64_inc(&syscall_stats.buffer_overflow);
        goto out_context;
    }

    /* Validate user pointers */
    if (content && !access_ok(content, content_size)) {
        ret = -EFAULT;
        goto out_context;
    }

    if (metadata && !access_ok(metadata, metadata_size)) {
        ret = -EFAULT;
        goto out_context;
    }

    if (!access_ok(packet_id, sizeof(hinata_uuid_t))) {
        ret = -EFAULT;
        goto out_context;
    }

    /* Allocate content buffer */
    if (content_size > 0) {
        content_buf = hinata_malloc(content_size);
        if (!content_buf) {
            ret = -ENOMEM;
            atomic64_inc(&syscall_stats.memory_errors);
            goto out_context;
        }

        /* Copy content from user space */
        ret = hinata_syscall_copy_from_user_safe(content_buf, content, content_size);
        if (ret < 0) {
            goto out_content;
        }
    }

    /* Allocate metadata buffer */
    if (metadata_size > 0) {
        metadata_buf = hinata_malloc(metadata_size);
        if (!metadata_buf) {
            ret = -ENOMEM;
            atomic64_inc(&syscall_stats.memory_errors);
            goto out_content;
        }

        /* Copy metadata from user space */
        ret = hinata_syscall_copy_from_user_safe(metadata_buf, metadata, metadata_size);
        if (ret < 0) {
            goto out_metadata;
        }
    }

    /* Create packet */
    packet = hinata_packet_create(type, content_buf, content_size, metadata_buf, metadata_size);
    if (!packet) {
        ret = -ENOMEM;
        atomic64_inc(&syscall_stats.memory_errors);
        goto out_metadata;
    }

    /* Get packet ID */
    hinata_packet_get_id(packet, &id);

    /* Copy packet ID to user space */
    ret = hinata_syscall_copy_to_user_safe(packet_id, &id, sizeof(hinata_uuid_t));
    if (ret < 0) {
        goto out_packet;
    }

    /* Success */
    atomic64_inc(&syscall_stats.successful_calls);
    ret = 0;
    goto out_metadata;

out_packet:
    if (packet) {
        hinata_packet_destroy(packet);
    }
out_metadata:
    if (metadata_buf) {
        hinata_free(metadata_buf);
    }
out_content:
    if (content_buf) {
        hinata_free(content_buf);
    }
out_context:
    if (ret < 0) {
        atomic64_inc(&syscall_stats.failed_calls);
    }
    hinata_syscall_update_stats(__NR_hinata_packet_create, ret, ktime_get_ns() - start_time);
    hinata_syscall_destroy_context(ctx);
out_concurrent:
    atomic_dec(&hinata_syscall_concurrent);
    atomic64_inc(&syscall_stats.total_calls);
    return ret;
}

/**
 * sys_hinata_packet_store - Store a packet to storage
 * @packet_id: Packet ID to store
 * @flags: Storage flags
 * 
 * Returns: 0 on success, negative error code on failure
 */
ASMLINKAGE long sys_hinata_packet_store(const hinata_uuid_t __user *packet_id, u32 flags)
{
    struct hinata_syscall_context *ctx;
    struct hinata_packet *packet = NULL;
    hinata_uuid_t id;
    long ret = 0;
    u64 start_time;

    start_time = ktime_get_ns();
    
    /* Rate limiting */
    if (!__ratelimit(&hinata_syscall_ratelimit)) {
        atomic64_inc(&syscall_stats.rate_limited);
        return -EBUSY;
    }

    /* Check concurrent calls limit */
    if (atomic_inc_return(&hinata_syscall_concurrent) > HINATA_SYSCALL_MAX_CONCURRENT) {
        atomic_dec(&hinata_syscall_concurrent);
        atomic64_inc(&syscall_stats.concurrent_calls);
        return -EBUSY;
    }

    /* Create syscall context */
    ctx = hinata_syscall_create_context(__NR_hinata_packet_store);
    if (!ctx) {
        ret = -ENOMEM;
        goto out_concurrent;
    }

    /* Check permissions */
    ret = hinata_syscall_check_permission(__NR_hinata_packet_store);
    if (ret < 0) {
        goto out_context;
    }

    /* Validate user pointer */
    if (!access_ok(packet_id, sizeof(hinata_uuid_t))) {
        ret = -EFAULT;
        goto out_context;
    }

    /* Copy packet ID from user space */
    ret = hinata_syscall_copy_from_user_safe(&id, packet_id, sizeof(hinata_uuid_t));
    if (ret < 0) {
        goto out_context;
    }

    /* Validate packet ID */
    if (!hinata_uuid_is_valid(&id)) {
        ret = -EINVAL;
        atomic64_inc(&syscall_stats.invalid_args);
        goto out_context;
    }

    /* Find packet */
    packet = hinata_packet_find(&id);
    if (!packet) {
        ret = -ENOENT;
        goto out_context;
    }

    /* Store packet */
    ret = hinata_storage_store_packet(packet, flags);
    if (ret < 0) {
        goto out_packet;
    }

    /* Success */
    atomic64_inc(&syscall_stats.successful_calls);
    ret = 0;

out_packet:
    hinata_packet_put(packet);
out_context:
    if (ret < 0) {
        atomic64_inc(&syscall_stats.failed_calls);
    }
    hinata_syscall_update_stats(__NR_hinata_packet_store, ret, ktime_get_ns() - start_time);
    hinata_syscall_destroy_context(ctx);
out_concurrent:
    atomic_dec(&hinata_syscall_concurrent);
    atomic64_inc(&syscall_stats.total_calls);
    return ret;
}

/**
 * sys_hinata_packet_load - Load a packet from storage
 * @packet_id: Packet ID to load
 * @buffer: Output buffer for packet data
 * @buffer_size: Size of output buffer
 * @actual_size: Actual size of packet data
 * 
 * Returns: 0 on success, negative error code on failure
 */
ASMLINKAGE long sys_hinata_packet_load(const hinata_uuid_t __user *packet_id,
                                      void __user *buffer,
                                      size_t buffer_size,
                                      size_t __user *actual_size)
{
    struct hinata_syscall_context *ctx;
    struct hinata_packet *packet = NULL;
    hinata_uuid_t id;
    void *packet_data = NULL;
    size_t data_size = 0;
    long ret = 0;
    u64 start_time;

    start_time = ktime_get_ns();
    
    /* Rate limiting */
    if (!__ratelimit(&hinata_syscall_ratelimit)) {
        atomic64_inc(&syscall_stats.rate_limited);
        return -EBUSY;
    }

    /* Check concurrent calls limit */
    if (atomic_inc_return(&hinata_syscall_concurrent) > HINATA_SYSCALL_MAX_CONCURRENT) {
        atomic_dec(&hinata_syscall_concurrent);
        atomic64_inc(&syscall_stats.concurrent_calls);
        return -EBUSY;
    }

    /* Create syscall context */
    ctx = hinata_syscall_create_context(__NR_hinata_packet_load);
    if (!ctx) {
        ret = -ENOMEM;
        goto out_concurrent;
    }

    /* Check permissions */
    ret = hinata_syscall_check_permission(__NR_hinata_packet_load);
    if (ret < 0) {
        goto out_context;
    }

    /* Validate user pointers */
    if (!access_ok(packet_id, sizeof(hinata_uuid_t))) {
        ret = -EFAULT;
        goto out_context;
    }

    if (buffer && !access_ok(buffer, buffer_size)) {
        ret = -EFAULT;
        goto out_context;
    }

    if (!access_ok(actual_size, sizeof(size_t))) {
        ret = -EFAULT;
        goto out_context;
    }

    /* Copy packet ID from user space */
    ret = hinata_syscall_copy_from_user_safe(&id, packet_id, sizeof(hinata_uuid_t));
    if (ret < 0) {
        goto out_context;
    }

    /* Validate packet ID */
    if (!hinata_uuid_is_valid(&id)) {
        ret = -EINVAL;
        atomic64_inc(&syscall_stats.invalid_args);
        goto out_context;
    }

    /* Load packet from storage */
    ret = hinata_storage_load_packet(&id, &packet);
    if (ret < 0) {
        goto out_context;
    }

    /* Get packet data size */
    data_size = hinata_packet_get_total_size(packet);

    /* Copy actual size to user space */
    ret = hinata_syscall_copy_to_user_safe(actual_size, &data_size, sizeof(size_t));
    if (ret < 0) {
        goto out_packet;
    }

    /* Check if buffer is large enough */
    if (buffer_size < data_size) {
        ret = -ENOSPC;
        goto out_packet;
    }

    /* Serialize packet data */
    packet_data = hinata_malloc(data_size);
    if (!packet_data) {
        ret = -ENOMEM;
        atomic64_inc(&syscall_stats.memory_errors);
        goto out_packet;
    }

    ret = hinata_packet_serialize(packet, packet_data, data_size);
    if (ret < 0) {
        goto out_data;
    }

    /* Copy packet data to user space */
    if (buffer) {
        ret = hinata_syscall_copy_to_user_safe(buffer, packet_data, data_size);
        if (ret < 0) {
            goto out_data;
        }
    }

    /* Success */
    atomic64_inc(&syscall_stats.successful_calls);
    ret = 0;

out_data:
    if (packet_data) {
        hinata_free(packet_data);
    }
out_packet:
    if (packet) {
        hinata_packet_put(packet);
    }
out_context:
    if (ret < 0) {
        atomic64_inc(&syscall_stats.failed_calls);
    }
    hinata_syscall_update_stats(__NR_hinata_packet_load, ret, ktime_get_ns() - start_time);
    hinata_syscall_destroy_context(ctx);
out_concurrent:
    atomic_dec(&hinata_syscall_concurrent);
    atomic64_inc(&syscall_stats.total_calls);
    return ret;
}

/**
 * sys_hinata_system_info - Get system information
 * @info: Output buffer for system information
 * 
 * Returns: 0 on success, negative error code on failure
 */
ASMLINKAGE long sys_hinata_system_info(struct hinata_system_info __user *info)
{
    struct hinata_syscall_context *ctx;
    struct hinata_system_info sys_info;
    long ret = 0;
    u64 start_time;

    start_time = ktime_get_ns();
    
    /* Rate limiting */
    if (!__ratelimit(&hinata_syscall_ratelimit)) {
        atomic64_inc(&syscall_stats.rate_limited);
        return -EBUSY;
    }

    /* Check concurrent calls limit */
    if (atomic_inc_return(&hinata_syscall_concurrent) > HINATA_SYSCALL_MAX_CONCURRENT) {
        atomic_dec(&hinata_syscall_concurrent);
        atomic64_inc(&syscall_stats.concurrent_calls);
        return -EBUSY;
    }

    /* Create syscall context */
    ctx = hinata_syscall_create_context(__NR_hinata_system_info);
    if (!ctx) {
        ret = -ENOMEM;
        goto out_concurrent;
    }

    /* Check permissions */
    ret = hinata_syscall_check_permission(__NR_hinata_system_info);
    if (ret < 0) {
        goto out_context;
    }

    /* Validate user pointer */
    if (!access_ok(info, sizeof(struct hinata_system_info))) {
        ret = -EFAULT;
        goto out_context;
    }

    /* Get system information */
    ret = hinata_system_get_info(&sys_info);
    if (ret < 0) {
        goto out_context;
    }

    /* Copy to user space */
    ret = hinata_syscall_copy_to_user_safe(info, &sys_info, sizeof(struct hinata_system_info));
    if (ret < 0) {
        goto out_context;
    }

    /* Success */
    atomic64_inc(&syscall_stats.successful_calls);
    ret = 0;

out_context:
    if (ret < 0) {
        atomic64_inc(&syscall_stats.failed_calls);
    }
    hinata_syscall_update_stats(__NR_hinata_system_info, ret, ktime_get_ns() - start_time);
    hinata_syscall_destroy_context(ctx);
out_concurrent:
    atomic_dec(&hinata_syscall_concurrent);
    atomic64_inc(&syscall_stats.total_calls);
    return ret;
}

/* Helper functions */

/**
 * hinata_syscall_validate_args - Validate system call arguments
 * @nr: System call number
 * @args: Arguments pointer
 * @size: Arguments size
 * 
 * Returns: 0 on success, negative error code on failure
 */
static long hinata_syscall_validate_args(unsigned int nr, const void __user *args, size_t size)
{
    /* Check argument count */
    if (size > HINATA_SYSCALL_MAX_ARGS * sizeof(long)) {
        return -E2BIG;
    }

    /* Check buffer size */
    if (size > HINATA_SYSCALL_MAX_BUFFER_SIZE) {
        return -E2BIG;
    }

    /* Validate user pointer if provided */
    if (args && !access_ok(args, size)) {
        return -EFAULT;
    }

    return 0;
}

/**
 * hinata_syscall_check_permission - Check system call permissions
 * @nr: System call number
 * 
 * Returns: 0 if allowed, negative error code if denied
 */
static int hinata_syscall_check_permission(unsigned int nr)
{
    /* Check if HiNATA is enabled */
    if (!hinata_system_is_enabled()) {
        return -ENOSYS;
    }

    /* Check basic capability */
    if (!capable(CAP_SYS_ADMIN)) {
        atomic64_inc(&syscall_stats.permission_denied);
        return -EPERM;
    }

    /* Additional permission checks based on syscall */
    switch (nr) {
    case __NR_hinata_packet_create:
    case __NR_hinata_packet_store:
    case __NR_hinata_knowledge_create:
    case __NR_hinata_knowledge_store:
        /* Write operations require additional checks */
        if (!capable(CAP_DAC_OVERRIDE)) {
            atomic64_inc(&syscall_stats.permission_denied);
            return -EPERM;
        }
        break;
    
    case __NR_hinata_debug_dump:
    case __NR_hinata_benchmark:
        /* Debug operations require debug capability */
        if (!capable(CAP_SYS_PTRACE)) {
            atomic64_inc(&syscall_stats.permission_denied);
            return -EPERM;
        }
        break;
    
    default:
        /* Read operations are allowed with basic capability */
        break;
    }

    return 0;
}

/**
 * hinata_syscall_update_stats - Update system call statistics
 * @nr: System call number
 * @result: System call result
 * @duration: Call duration in nanoseconds
 */
static void hinata_syscall_update_stats(unsigned int nr, int result, u64 duration)
{
    u64 duration_us = duration / 1000;
    
    /* Update duration statistics */
    if (duration_us > syscall_stats.max_duration) {
        syscall_stats.max_duration = duration_us;
    }
    
    if (syscall_stats.min_duration == 0 || duration_us < syscall_stats.min_duration) {
        syscall_stats.min_duration = duration_us;
    }
    
    /* Update average duration (simple moving average) */
    syscall_stats.average_duration = (syscall_stats.average_duration + duration_us) / 2;
    
    /* Update last call time */
    syscall_stats.last_call_time = ktime_get_real_seconds();
    
    /* Update error-specific statistics */
    if (result < 0) {
        switch (result) {
        case -ETIMEDOUT:
            atomic64_inc(&syscall_stats.timeout_calls);
            break;
        case -EPERM:
        case -EACCES:
            atomic64_inc(&syscall_stats.permission_denied);
            break;
        case -EINVAL:
        case -E2BIG:
            atomic64_inc(&syscall_stats.invalid_args);
            break;
        case -ENOSPC:
        case -EFBIG:
            atomic64_inc(&syscall_stats.buffer_overflow);
            break;
        case -ENOMEM:
            atomic64_inc(&syscall_stats.memory_errors);
            break;
        }
    }
}

/**
 * hinata_syscall_create_context - Create system call context
 * @nr: System call number
 * 
 * Returns: Context pointer on success, NULL on failure
 */
static struct hinata_syscall_context *hinata_syscall_create_context(unsigned int nr)
{
    struct hinata_syscall_context *ctx;
    
    ctx = hinata_malloc(sizeof(struct hinata_syscall_context));
    if (!ctx) {
        return NULL;
    }
    
    memset(ctx, 0, sizeof(struct hinata_syscall_context));
    
    ctx->task = current;
    ctx->pid = current->pid;
    ctx->uid = from_kuid(&init_user_ns, current_uid());
    ctx->gid = from_kgid(&init_user_ns, current_gid());
    ctx->start_time = ktime_get_ns();
    ctx->syscall_nr = nr;
    ctx->caller_ip = _RET_IP_;
    
    get_task_comm(ctx->comm, current);
    
    init_completion(&ctx->completion);
    atomic_set(&ctx->ref_count, 1);
    INIT_LIST_HEAD(&ctx->list);
    
    return ctx;
}

/**
 * hinata_syscall_destroy_context - Destroy system call context
 * @ctx: Context to destroy
 */
static void hinata_syscall_destroy_context(struct hinata_syscall_context *ctx)
{
    if (!ctx) {
        return;
    }
    
    if (atomic_dec_and_test(&ctx->ref_count)) {
        ctx->end_time = ktime_get_ns();
        hinata_free(ctx);
    }
}

/**
 * hinata_syscall_copy_from_user_safe - Safe copy from user space
 * @to: Destination buffer
 * @from: Source user pointer
 * @size: Size to copy
 * 
 * Returns: 0 on success, negative error code on failure
 */
static int hinata_syscall_copy_from_user_safe(void *to, const void __user *from, size_t size)
{
    if (!to || !from || size == 0) {
        return -EINVAL;
    }
    
    if (size > HINATA_SYSCALL_MAX_BUFFER_SIZE) {
        return -E2BIG;
    }
    
    if (copy_from_user(to, from, size)) {
        return -EFAULT;
    }
    
    return 0;
}

/**
 * hinata_syscall_copy_to_user_safe - Safe copy to user space
 * @to: Destination user pointer
 * @from: Source buffer
 * @size: Size to copy
 * 
 * Returns: 0 on success, negative error code on failure
 */
static int hinata_syscall_copy_to_user_safe(void __user *to, const void *from, size_t size)
{
    if (!to || !from || size == 0) {
        return -EINVAL;
    }
    
    if (size > HINATA_SYSCALL_MAX_BUFFER_SIZE) {
        return -E2BIG;
    }
    
    if (copy_to_user(to, from, size)) {
        return -EFAULT;
    }
    
    return 0;
}

/**
 * hinata_syscall_validate_string - Validate user string
 * @str: User string pointer
 * @max_len: Maximum allowed length
 * 
 * Returns: String length on success, negative error code on failure
 */
static int hinata_syscall_validate_string(const char __user *str, size_t max_len)
{
    int len;
    
    if (!str) {
        return -EINVAL;
    }
    
    len = strnlen_user(str, max_len + 1);
    if (len == 0) {
        return -EFAULT;
    }
    
    if (len > max_len) {
        return -ENAMETOOLONG;
    }
    
    return len - 1; /* Exclude null terminator */
}

/**
 * hinata_syscall_validate_buffer - Validate user buffer
 * @buf: User buffer pointer
 * @size: Buffer size
 * 
 * Returns: 0 on success, negative error code on failure
 */
static int hinata_syscall_validate_buffer(const void __user *buf, size_t size)
{
    if (!buf && size > 0) {
        return -EINVAL;
    }
    
    if (size > HINATA_SYSCALL_MAX_BUFFER_SIZE) {
        return -E2BIG;
    }
    
    if (buf && !access_ok(buf, size)) {
        return -EFAULT;
    }
    
    return 0;
}

/* Proc filesystem interface */
static int hinata_syscall_proc_show(struct seq_file *m, void *v)
{
    seq_printf(m, "HiNATA System Calls Statistics\n");
    seq_printf(m, "==============================\n");
    seq_printf(m, "Total calls:        %llu\n", atomic64_read(&syscall_stats.total_calls));
    seq_printf(m, "Successful calls:   %llu\n", atomic64_read(&syscall_stats.successful_calls));
    seq_printf(m, "Failed calls:       %llu\n", atomic64_read(&syscall_stats.failed_calls));
    seq_printf(m, "Timeout calls:      %llu\n", atomic64_read(&syscall_stats.timeout_calls));
    seq_printf(m, "Permission denied:  %llu\n", atomic64_read(&syscall_stats.permission_denied));
    seq_printf(m, "Invalid arguments:  %llu\n", atomic64_read(&syscall_stats.invalid_args));
    seq_printf(m, "Buffer overflows:   %llu\n", atomic64_read(&syscall_stats.buffer_overflow));
    seq_printf(m, "Memory errors:      %llu\n", atomic64_read(&syscall_stats.memory_errors));
    seq_printf(m, "Concurrent calls:   %llu\n", atomic64_read(&syscall_stats.concurrent_calls));
    seq_printf(m, "Rate limited:       %llu\n", atomic64_read(&syscall_stats.rate_limited));
    seq_printf(m, "Average duration:   %llu us\n", syscall_stats.average_duration);
    seq_printf(m, "Max duration:       %llu us\n", syscall_stats.max_duration);
    seq_printf(m, "Min duration:       %llu us\n", syscall_stats.min_duration);
    seq_printf(m, "Last call time:     %llu\n", syscall_stats.last_call_time);
    seq_printf(m, "Current concurrent: %d\n", atomic_read(&hinata_syscall_concurrent));
    
    return 0;
}

static int hinata_syscall_proc_open(struct inode *inode, struct file *file)
{
    return single_open(file, hinata_syscall_proc_show, NULL);
}

static const struct proc_ops hinata_syscall_proc_ops = {
    .proc_open = hinata_syscall_proc_open,
    .proc_read = seq_read,
    .proc_lseek = seq_lseek,
    .proc_release = single_release,
};

static struct proc_dir_entry *hinata_syscall_proc_entry;

/**
 * hinata_syscalls_init - Initialize HiNATA system calls
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_syscalls_init(void)
{
    int ret = 0;
    
    pr_info("HiNATA: Initializing system calls interface\n");
    
    /* Initialize statistics */
    memset(&syscall_stats, 0, sizeof(syscall_stats));
    
    /* Create proc entry */
    hinata_syscall_proc_entry = proc_create("hinata_syscalls", 0444, NULL, &hinata_syscall_proc_ops);
    if (!hinata_syscall_proc_entry) {
        pr_err("HiNATA: Failed to create proc entry for syscalls\n");
        ret = -ENOMEM;
        goto out;
    }
    
    pr_info("HiNATA: System calls interface initialized successfully\n");
    
out:
    return ret;
}

/**
 * hinata_syscalls_cleanup - Cleanup HiNATA system calls
 */
void hinata_syscalls_cleanup(void)
{
    pr_info("HiNATA: Cleaning up system calls interface\n");
    
    /* Remove proc entry */
    if (hinata_syscall_proc_entry) {
        proc_remove(hinata_syscall_proc_entry);
        hinata_syscall_proc_entry = NULL;
    }
    
    pr_info("HiNATA: System calls interface cleaned up\n");
}

/* Export symbols */
EXPORT_SYMBOL(hinata_syscalls_init);
EXPORT_SYMBOL(hinata_syscalls_cleanup);

/* Module initialization */
static int __init hinata_syscalls_module_init(void)
{
    return hinata_syscalls_init();
}

static void __exit hinata_syscalls_module_exit(void)
{
    hinata_syscalls_cleanup();
}

module_init(hinata_syscalls_module_init);
module_exit(hinata_syscalls_module_exit);
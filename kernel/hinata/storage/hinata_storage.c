/*
 * HiNATA Storage Layer Implementation
 * Part of notcontrolOS Knowledge Management System
 * 
 * This file implements the storage layer for HiNATA packets and knowledge blocks,
 * providing persistent storage, caching, and data management capabilities.
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/slab.h>
#include <linux/fs.h>
#include <linux/file.h>
#include <linux/uaccess.h>
#include <linux/mutex.h>
#include <linux/spinlock.h>
#include <linux/hash.h>
#include <linux/list.h>
#include <linux/rbtree.h>
#include <linux/workqueue.h>
#include <linux/timer.h>
#include <linux/atomic.h>
#include <linux/crc32.h>
#include <linux/vmalloc.h>
#include <linux/mm.h>
#include <linux/highmem.h>
#include <linux/buffer_head.h>
#include <linux/bio.h>
#include <linux/blkdev.h>
#include "../hinata_core.h"
#include "../core/hinata_packet.h"
#include "../core/hinata_validation.h"
#include "hinata_storage.h"

/* Module information */
#define HINATA_STORAGE_VERSION      "1.0.0"
#define HINATA_STORAGE_AUTHOR       "HiNATA Development Team"
#define HINATA_STORAGE_DESCRIPTION  "HiNATA Storage Layer"

/* Storage constants */
#define HINATA_STORAGE_MAGIC        0x48494E41  /* "HINA" */
#define HINATA_STORAGE_VERSION_MAJOR 1
#define HINATA_STORAGE_VERSION_MINOR 0
#define HINATA_STORAGE_BLOCK_SIZE   4096
#define HINATA_STORAGE_MAX_REGIONS  64
#define HINATA_STORAGE_CACHE_SIZE   1024
#define HINATA_STORAGE_SYNC_INTERVAL 30000  /* 30 seconds */
#define HINATA_STORAGE_GC_INTERVAL  60000   /* 60 seconds */

/* Storage flags */
#define HINATA_STORAGE_FLAG_DIRTY       (1 << 0)
#define HINATA_STORAGE_FLAG_CACHED      (1 << 1)
#define HINATA_STORAGE_FLAG_COMPRESSED  (1 << 2)
#define HINATA_STORAGE_FLAG_ENCRYPTED   (1 << 3)
#define HINATA_STORAGE_FLAG_READONLY    (1 << 4)
#define HINATA_STORAGE_FLAG_TEMPORARY   (1 << 5)
#define HINATA_STORAGE_FLAG_PINNED      (1 << 6)
#define HINATA_STORAGE_FLAG_SYNCING     (1 << 7)

/**
 * struct hinata_storage_header - Storage file header
 * @magic: Magic number for identification
 * @version_major: Major version number
 * @version_minor: Minor version number
 * @flags: Storage flags
 * @block_size: Block size in bytes
 * @total_blocks: Total number of blocks
 * @used_blocks: Number of used blocks
 * @free_blocks: Number of free blocks
 * @checksum: Header checksum
 * @created_time: Creation timestamp
 * @modified_time: Last modification timestamp
 * @reserved: Reserved for future use
 */
struct hinata_storage_header {
    u32 magic;
    u16 version_major;
    u16 version_minor;
    u32 flags;
    u32 block_size;
    u64 total_blocks;
    u64 used_blocks;
    u64 free_blocks;
    u32 checksum;
    u64 created_time;
    u64 modified_time;
    u8 reserved[64];
} __packed;

/**
 * struct hinata_storage_block - Storage block metadata
 * @id: Block ID
 * @type: Block type
 * @size: Block size
 * @flags: Block flags
 * @checksum: Block checksum
 * @offset: Offset in storage
 * @next_block: Next block in chain
 * @prev_block: Previous block in chain
 * @ref_count: Reference count
 * @access_time: Last access time
 * @modify_time: Last modification time
 */
struct hinata_storage_block {
    u64 id;
    u32 type;
    u32 size;
    u32 flags;
    u32 checksum;
    u64 offset;
    u64 next_block;
    u64 prev_block;
    atomic_t ref_count;
    u64 access_time;
    u64 modify_time;
};

/**
 * struct hinata_storage_cache_entry - Cache entry
 * @key: Cache key (packet/block ID)
 * @data: Cached data
 * @size: Data size
 * @flags: Cache flags
 * @access_count: Access count
 * @last_access: Last access time
 * @expiry_time: Expiry time
 * @hash_node: Hash table node
 * @lru_node: LRU list node
 * @ref_count: Reference count
 */
struct hinata_storage_cache_entry {
    char key[HINATA_UUID_STRING_LENGTH];
    void *data;
    size_t size;
    u32 flags;
    atomic_t access_count;
    u64 last_access;
    u64 expiry_time;
    struct hlist_node hash_node;
    struct list_head lru_node;
    atomic_t ref_count;
};

/**
 * struct hinata_storage_region - Storage region
 * @id: Region ID
 * @name: Region name
 * @path: Storage path
 * @type: Region type
 * @flags: Region flags
 * @size: Region size
 * @used_size: Used size
 * @block_count: Number of blocks
 * @file: Storage file
 * @header: Storage header
 * @free_list: Free block list
 * @block_tree: Block tree (RB-tree)
 * @lock: Region lock
 * @stats: Region statistics
 */
struct hinata_storage_region {
    u32 id;
    char name[64];
    char path[256];
    enum hinata_storage_type type;
    u32 flags;
    u64 size;
    u64 used_size;
    u64 block_count;
    struct file *file;
    struct hinata_storage_header header;
    struct list_head free_list;
    struct rb_root block_tree;
    struct mutex lock;
    struct hinata_storage_stats stats;
};

/**
 * struct hinata_storage_context - Storage context
 * @regions: Storage regions
 * @region_count: Number of regions
 * @cache: Storage cache
 * @cache_size: Cache size
 * @cache_lock: Cache lock
 * @cache_lru: Cache LRU list
 * @sync_work: Sync work
 * @gc_work: Garbage collection work
 * @sync_timer: Sync timer
 * @gc_timer: GC timer
 * @stats: Global storage statistics
 * @lock: Global storage lock
 */
struct hinata_storage_context {
    struct hinata_storage_region regions[HINATA_STORAGE_MAX_REGIONS];
    u32 region_count;
    struct hlist_head cache[HINATA_STORAGE_CACHE_SIZE];
    atomic_t cache_size;
    spinlock_t cache_lock;
    struct list_head cache_lru;
    struct work_struct sync_work;
    struct work_struct gc_work;
    struct timer_list sync_timer;
    struct timer_list gc_timer;
    struct hinata_storage_stats stats;
    struct mutex lock;
};

/* Global storage context */
static struct hinata_storage_context storage_ctx;
static bool storage_initialized = false;

/* Forward declarations */
static int hinata_storage_region_init(struct hinata_storage_region *region);
static void hinata_storage_region_cleanup(struct hinata_storage_region *region);
static int hinata_storage_cache_init(void);
static void hinata_storage_cache_cleanup(void);
static void hinata_storage_sync_work_func(struct work_struct *work);
static void hinata_storage_gc_work_func(struct work_struct *work);
static void hinata_storage_sync_timer_func(struct timer_list *timer);
static void hinata_storage_gc_timer_func(struct timer_list *timer);

/**
 * hinata_storage_init - Initialize storage subsystem
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_init(void)
{
    int ret;
    u32 i;

    if (storage_initialized) {
        pr_warn("HiNATA storage already initialized\n");
        return -EALREADY;
    }

    pr_info("Initializing HiNATA storage subsystem v%s\n", HINATA_STORAGE_VERSION);

    /* Initialize storage context */
    memset(&storage_ctx, 0, sizeof(storage_ctx));
    mutex_init(&storage_ctx.lock);
    spin_lock_init(&storage_ctx.cache_lock);
    INIT_LIST_HEAD(&storage_ctx.cache_lru);
    atomic_set(&storage_ctx.cache_size, 0);

    /* Initialize cache */
    ret = hinata_storage_cache_init();
    if (ret) {
        pr_err("Failed to initialize storage cache: %d\n", ret);
        return ret;
    }

    /* Initialize regions */
    for (i = 0; i < HINATA_STORAGE_MAX_REGIONS; i++) {
        storage_ctx.regions[i].id = i;
        mutex_init(&storage_ctx.regions[i].lock);
        INIT_LIST_HEAD(&storage_ctx.regions[i].free_list);
        storage_ctx.regions[i].block_tree = RB_ROOT;
    }

    /* Initialize work queues */
    INIT_WORK(&storage_ctx.sync_work, hinata_storage_sync_work_func);
    INIT_WORK(&storage_ctx.gc_work, hinata_storage_gc_work_func);

    /* Initialize timers */
    timer_setup(&storage_ctx.sync_timer, hinata_storage_sync_timer_func, 0);
    timer_setup(&storage_ctx.gc_timer, hinata_storage_gc_timer_func, 0);

    /* Start timers */
    mod_timer(&storage_ctx.sync_timer, jiffies + msecs_to_jiffies(HINATA_STORAGE_SYNC_INTERVAL));
    mod_timer(&storage_ctx.gc_timer, jiffies + msecs_to_jiffies(HINATA_STORAGE_GC_INTERVAL));

    storage_initialized = true;
    pr_info("HiNATA storage subsystem initialized successfully\n");

    return 0;
}

/**
 * hinata_storage_cleanup - Cleanup storage subsystem
 */
void hinata_storage_cleanup(void)
{
    u32 i;

    if (!storage_initialized) {
        return;
    }

    pr_info("Cleaning up HiNATA storage subsystem\n");

    /* Stop timers */
    del_timer_sync(&storage_ctx.sync_timer);
    del_timer_sync(&storage_ctx.gc_timer);

    /* Cancel work */
    cancel_work_sync(&storage_ctx.sync_work);
    cancel_work_sync(&storage_ctx.gc_work);

    /* Cleanup regions */
    for (i = 0; i < storage_ctx.region_count; i++) {
        hinata_storage_region_cleanup(&storage_ctx.regions[i]);
    }

    /* Cleanup cache */
    hinata_storage_cache_cleanup();

    storage_initialized = false;
    pr_info("HiNATA storage subsystem cleaned up\n");
}

/**
 * hinata_storage_create_region - Create storage region
 * @name: Region name
 * @path: Storage path
 * @type: Storage type
 * @size: Region size
 * 
 * Returns: Region ID on success, negative error code on failure
 */
int hinata_storage_create_region(const char *name, const char *path,
                                enum hinata_storage_type type, u64 size)
{
    struct hinata_storage_region *region;
    int ret;
    u32 region_id;

    if (!storage_initialized) {
        return -ENODEV;
    }

    if (!name || !path || size == 0) {
        return -EINVAL;
    }

    mutex_lock(&storage_ctx.lock);

    /* Find free region slot */
    for (region_id = 0; region_id < HINATA_STORAGE_MAX_REGIONS; region_id++) {
        if (storage_ctx.regions[region_id].file == NULL) {
            break;
        }
    }

    if (region_id >= HINATA_STORAGE_MAX_REGIONS) {
        mutex_unlock(&storage_ctx.lock);
        return -ENOSPC;
    }

    region = &storage_ctx.regions[region_id];

    /* Initialize region */
    strncpy(region->name, name, sizeof(region->name) - 1);
    strncpy(region->path, path, sizeof(region->path) - 1);
    region->type = type;
    region->size = size;
    region->flags = 0;

    ret = hinata_storage_region_init(region);
    if (ret) {
        mutex_unlock(&storage_ctx.lock);
        return ret;
    }

    storage_ctx.region_count++;
    mutex_unlock(&storage_ctx.lock);

    pr_info("Created storage region '%s' (ID: %u, type: %d, size: %llu)\n",
            name, region_id, type, size);

    return region_id;
}

/**
 * hinata_storage_destroy_region - Destroy storage region
 * @region_id: Region ID
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_destroy_region(u32 region_id)
{
    struct hinata_storage_region *region;

    if (!storage_initialized) {
        return -ENODEV;
    }

    if (region_id >= HINATA_STORAGE_MAX_REGIONS) {
        return -EINVAL;
    }

    mutex_lock(&storage_ctx.lock);

    region = &storage_ctx.regions[region_id];
    if (region->file == NULL) {
        mutex_unlock(&storage_ctx.lock);
        return -ENOENT;
    }

    hinata_storage_region_cleanup(region);
    storage_ctx.region_count--;

    mutex_unlock(&storage_ctx.lock);

    pr_info("Destroyed storage region '%s' (ID: %u)\n", region->name, region_id);

    return 0;
}

/**
 * hinata_storage_store_packet - Store packet to storage
 * @packet: Packet to store
 * @region_id: Target region ID
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_store_packet(const struct hinata_packet *packet, u32 region_id)
{
    struct hinata_storage_region *region;
    struct hinata_storage_block block;
    void *data;
    size_t data_size;
    loff_t offset;
    ssize_t written;
    int ret;

    if (!storage_initialized || !packet) {
        return -EINVAL;
    }

    if (region_id >= HINATA_STORAGE_MAX_REGIONS) {
        return -EINVAL;
    }

    region = &storage_ctx.regions[region_id];
    if (region->file == NULL) {
        return -ENOENT;
    }

    /* Validate packet */
    ret = hinata_validate_packet(packet, HINATA_VALIDATION_FLAG_FULL);
    if (ret != HINATA_VALIDATION_SUCCESS) {
        return -EINVAL;
    }

    mutex_lock(&region->lock);

    /* Serialize packet data */
    data_size = sizeof(*packet) + packet->content_size + packet->metadata_size;
    data = hinata_malloc(data_size);
    if (!data) {
        mutex_unlock(&region->lock);
        return -ENOMEM;
    }

    /* Copy packet structure */
    memcpy(data, packet, sizeof(*packet));
    offset = sizeof(*packet);

    /* Copy content */
    if (packet->content && packet->content_size > 0) {
        memcpy(data + offset, packet->content, packet->content_size);
        offset += packet->content_size;
    }

    /* Copy metadata */
    if (packet->metadata && packet->metadata_size > 0) {
        memcpy(data + offset, packet->metadata, packet->metadata_size);
    }

    /* Find storage location */
    offset = region->used_size;

    /* Write to storage */
    written = kernel_write(region->file, data, data_size, &offset);
    if (written != data_size) {
        hinata_free(data);
        mutex_unlock(&region->lock);
        return -EIO;
    }

    /* Create storage block metadata */
    memset(&block, 0, sizeof(block));
    block.id = hash_64((u64)packet, 64);
    block.type = HINATA_STORAGE_TYPE_PACKET;
    block.size = data_size;
    block.flags = HINATA_STORAGE_FLAG_DIRTY;
    block.checksum = crc32(0, data, data_size);
    block.offset = offset;
    atomic_set(&block.ref_count, 1);
    block.access_time = hinata_get_timestamp();
    block.modify_time = block.access_time;

    /* Update region statistics */
    region->used_size += data_size;
    region->block_count++;
    region->stats.packets_stored++;
    region->stats.bytes_written += data_size;

    /* Add to cache */
    hinata_storage_cache_put(packet->id, data, data_size);

    hinata_free(data);
    mutex_unlock(&region->lock);

    /* Update global statistics */
    atomic64_inc(&storage_ctx.stats.packets_stored);
    atomic64_add(data_size, &storage_ctx.stats.bytes_written);

    return 0;
}

/**
 * hinata_storage_load_packet - Load packet from storage
 * @packet_id: Packet ID to load
 * @region_id: Source region ID
 * @packet: Output packet structure
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_load_packet(const char *packet_id, u32 region_id,
                              struct hinata_packet **packet)
{
    struct hinata_storage_region *region;
    void *data;
    size_t data_size;
    struct hinata_packet *loaded_packet;
    int ret;

    if (!storage_initialized || !packet_id || !packet) {
        return -EINVAL;
    }

    if (region_id >= HINATA_STORAGE_MAX_REGIONS) {
        return -EINVAL;
    }

    /* Try cache first */
    data = hinata_storage_cache_get(packet_id, &data_size);
    if (data) {
        loaded_packet = (struct hinata_packet *)data;
        *packet = hinata_packet_clone(loaded_packet);
        hinata_storage_cache_put_ref(packet_id);
        atomic64_inc(&storage_ctx.stats.cache_hits);
        return *packet ? 0 : -ENOMEM;
    }

    atomic64_inc(&storage_ctx.stats.cache_misses);

    region = &storage_ctx.regions[region_id];
    if (region->file == NULL) {
        return -ENOENT;
    }

    mutex_lock(&region->lock);

    /* TODO: Implement storage search and load logic */
    /* This would involve:
     * 1. Search for packet in storage blocks
     * 2. Read packet data from storage
     * 3. Deserialize packet structure
     * 4. Validate loaded packet
     * 5. Add to cache
     */

    ret = -ENOENT; /* Placeholder */

    mutex_unlock(&region->lock);

    return ret;
}

/**
 * hinata_storage_delete_packet - Delete packet from storage
 * @packet_id: Packet ID to delete
 * @region_id: Source region ID
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_delete_packet(const char *packet_id, u32 region_id)
{
    struct hinata_storage_region *region;
    int ret;

    if (!storage_initialized || !packet_id) {
        return -EINVAL;
    }

    if (region_id >= HINATA_STORAGE_MAX_REGIONS) {
        return -EINVAL;
    }

    region = &storage_ctx.regions[region_id];
    if (region->file == NULL) {
        return -ENOENT;
    }

    mutex_lock(&region->lock);

    /* Remove from cache */
    hinata_storage_cache_remove(packet_id);

    /* TODO: Implement storage deletion logic */
    /* This would involve:
     * 1. Find packet in storage blocks
     * 2. Mark block as free
     * 3. Update region statistics
     * 4. Schedule garbage collection
     */

    ret = 0; /* Placeholder */

    mutex_unlock(&region->lock);

    /* Update global statistics */
    atomic64_inc(&storage_ctx.stats.packets_deleted);

    return ret;
}

/**
 * hinata_storage_get_stats - Get storage statistics
 * @stats: Output statistics structure
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_get_stats(struct hinata_storage_stats *stats)
{
    if (!storage_initialized || !stats) {
        return -EINVAL;
    }

    memcpy(stats, &storage_ctx.stats, sizeof(*stats));
    return 0;
}

/**
 * hinata_storage_sync - Synchronize storage to disk
 * @region_id: Region ID to sync (HINATA_STORAGE_ALL_REGIONS for all)
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_sync(u32 region_id)
{
    struct hinata_storage_region *region;
    u32 i, start, end;
    int ret = 0;

    if (!storage_initialized) {
        return -ENODEV;
    }

    if (region_id == HINATA_STORAGE_ALL_REGIONS) {
        start = 0;
        end = storage_ctx.region_count;
    } else {
        if (region_id >= HINATA_STORAGE_MAX_REGIONS) {
            return -EINVAL;
        }
        start = region_id;
        end = region_id + 1;
    }

    for (i = start; i < end; i++) {
        region = &storage_ctx.regions[i];
        if (region->file == NULL) {
            continue;
        }

        mutex_lock(&region->lock);
        ret = vfs_fsync(region->file, 0);
        if (ret) {
            pr_err("Failed to sync region %u: %d\n", i, ret);
        }
        mutex_unlock(&region->lock);
    }

    return ret;
}

/* Cache management functions */

/**
 * hinata_storage_cache_init - Initialize storage cache
 * 
 * Returns: 0 on success, negative error code on failure
 */
static int hinata_storage_cache_init(void)
{
    u32 i;

    for (i = 0; i < HINATA_STORAGE_CACHE_SIZE; i++) {
        INIT_HLIST_HEAD(&storage_ctx.cache[i]);
    }

    return 0;
}

/**
 * hinata_storage_cache_cleanup - Cleanup storage cache
 */
static void hinata_storage_cache_cleanup(void)
{
    struct hinata_storage_cache_entry *entry;
    struct hlist_node *tmp;
    u32 i;

    spin_lock(&storage_ctx.cache_lock);

    for (i = 0; i < HINATA_STORAGE_CACHE_SIZE; i++) {
        hlist_for_each_entry_safe(entry, tmp, &storage_ctx.cache[i], hash_node) {
            hlist_del(&entry->hash_node);
            list_del(&entry->lru_node);
            hinata_free(entry->data);
            hinata_free(entry);
        }
    }

    atomic_set(&storage_ctx.cache_size, 0);
    spin_unlock(&storage_ctx.cache_lock);
}

/**
 * hinata_storage_cache_get - Get data from cache
 * @key: Cache key
 * @size: Output data size
 * 
 * Returns: Cached data on success, NULL on failure
 */
void *hinata_storage_cache_get(const char *key, size_t *size)
{
    struct hinata_storage_cache_entry *entry;
    u32 hash_val;
    void *data = NULL;

    if (!key || !size) {
        return NULL;
    }

    hash_val = hash_str(key, HINATA_STORAGE_CACHE_SIZE);

    spin_lock(&storage_ctx.cache_lock);

    hlist_for_each_entry(entry, &storage_ctx.cache[hash_val], hash_node) {
        if (strcmp(entry->key, key) == 0) {
            /* Update access statistics */
            atomic_inc(&entry->access_count);
            entry->last_access = hinata_get_timestamp();
            atomic_inc(&entry->ref_count);

            /* Move to front of LRU */
            list_move(&entry->lru_node, &storage_ctx.cache_lru);

            data = entry->data;
            *size = entry->size;
            break;
        }
    }

    spin_unlock(&storage_ctx.cache_lock);

    return data;
}

/**
 * hinata_storage_cache_put - Put data into cache
 * @key: Cache key
 * @data: Data to cache
 * @size: Data size
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_cache_put(const char *key, const void *data, size_t size)
{
    struct hinata_storage_cache_entry *entry;
    u32 hash_val;
    void *data_copy;

    if (!key || !data || size == 0) {
        return -EINVAL;
    }

    /* Allocate cache entry */
    entry = hinata_malloc(sizeof(*entry));
    if (!entry) {
        return -ENOMEM;
    }

    /* Allocate data copy */
    data_copy = hinata_malloc(size);
    if (!data_copy) {
        hinata_free(entry);
        return -ENOMEM;
    }

    memcpy(data_copy, data, size);

    /* Initialize entry */
    strncpy(entry->key, key, sizeof(entry->key) - 1);
    entry->data = data_copy;
    entry->size = size;
    entry->flags = HINATA_STORAGE_FLAG_CACHED;
    atomic_set(&entry->access_count, 1);
    entry->last_access = hinata_get_timestamp();
    entry->expiry_time = entry->last_access + HINATA_CACHE_DEFAULT_TTL;
    atomic_set(&entry->ref_count, 1);
    INIT_HLIST_NODE(&entry->hash_node);
    INIT_LIST_HEAD(&entry->lru_node);

    hash_val = hash_str(key, HINATA_STORAGE_CACHE_SIZE);

    spin_lock(&storage_ctx.cache_lock);

    /* Add to hash table and LRU list */
    hlist_add_head(&entry->hash_node, &storage_ctx.cache[hash_val]);
    list_add(&entry->lru_node, &storage_ctx.cache_lru);
    atomic_inc(&storage_ctx.cache_size);

    spin_unlock(&storage_ctx.cache_lock);

    return 0;
}

/**
 * hinata_storage_cache_remove - Remove data from cache
 * @key: Cache key
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_storage_cache_remove(const char *key)
{
    struct hinata_storage_cache_entry *entry;
    struct hlist_node *tmp;
    u32 hash_val;
    int ret = -ENOENT;

    if (!key) {
        return -EINVAL;
    }

    hash_val = hash_str(key, HINATA_STORAGE_CACHE_SIZE);

    spin_lock(&storage_ctx.cache_lock);

    hlist_for_each_entry_safe(entry, tmp, &storage_ctx.cache[hash_val], hash_node) {
        if (strcmp(entry->key, key) == 0) {
            hlist_del(&entry->hash_node);
            list_del(&entry->lru_node);
            atomic_dec(&storage_ctx.cache_size);

            hinata_free(entry->data);
            hinata_free(entry);
            ret = 0;
            break;
        }
    }

    spin_unlock(&storage_ctx.cache_lock);

    return ret;
}

/**
 * hinata_storage_cache_put_ref - Release cache reference
 * @key: Cache key
 */
void hinata_storage_cache_put_ref(const char *key)
{
    struct hinata_storage_cache_entry *entry;
    u32 hash_val;

    if (!key) {
        return;
    }

    hash_val = hash_str(key, HINATA_STORAGE_CACHE_SIZE);

    spin_lock(&storage_ctx.cache_lock);

    hlist_for_each_entry(entry, &storage_ctx.cache[hash_val], hash_node) {
        if (strcmp(entry->key, key) == 0) {
            atomic_dec(&entry->ref_count);
            break;
        }
    }

    spin_unlock(&storage_ctx.cache_lock);
}

/* Work functions */

/**
 * hinata_storage_sync_work_func - Sync work function
 * @work: Work structure
 */
static void hinata_storage_sync_work_func(struct work_struct *work)
{
    hinata_storage_sync(HINATA_STORAGE_ALL_REGIONS);
}

/**
 * hinata_storage_gc_work_func - Garbage collection work function
 * @work: Work structure
 */
static void hinata_storage_gc_work_func(struct work_struct *work)
{
    /* TODO: Implement garbage collection logic */
    pr_debug("HiNATA storage garbage collection triggered\n");
}

/* Timer functions */

/**
 * hinata_storage_sync_timer_func - Sync timer function
 * @timer: Timer structure
 */
static void hinata_storage_sync_timer_func(struct timer_list *timer)
{
    schedule_work(&storage_ctx.sync_work);
    mod_timer(&storage_ctx.sync_timer, jiffies + msecs_to_jiffies(HINATA_STORAGE_SYNC_INTERVAL));
}

/**
 * hinata_storage_gc_timer_func - GC timer function
 * @timer: Timer structure
 */
static void hinata_storage_gc_timer_func(struct timer_list *timer)
{
    schedule_work(&storage_ctx.gc_work);
    mod_timer(&storage_ctx.gc_timer, jiffies + msecs_to_jiffies(HINATA_STORAGE_GC_INTERVAL));
}

/* Region management functions */

/**
 * hinata_storage_region_init - Initialize storage region
 * @region: Region to initialize
 * 
 * Returns: 0 on success, negative error code on failure
 */
static int hinata_storage_region_init(struct hinata_storage_region *region)
{
    struct file *file;
    struct hinata_storage_header header;
    loff_t pos = 0;
    ssize_t written;
    int ret;

    /* Open/create storage file */
    file = filp_open(region->path, O_RDWR | O_CREAT, 0644);
    if (IS_ERR(file)) {
        ret = PTR_ERR(file);
        pr_err("Failed to open storage file '%s': %d\n", region->path, ret);
        return ret;
    }

    region->file = file;

    /* Initialize header */
    memset(&header, 0, sizeof(header));
    header.magic = HINATA_STORAGE_MAGIC;
    header.version_major = HINATA_STORAGE_VERSION_MAJOR;
    header.version_minor = HINATA_STORAGE_VERSION_MINOR;
    header.flags = 0;
    header.block_size = HINATA_STORAGE_BLOCK_SIZE;
    header.total_blocks = region->size / HINATA_STORAGE_BLOCK_SIZE;
    header.used_blocks = 0;
    header.free_blocks = header.total_blocks;
    header.created_time = hinata_get_timestamp();
    header.modified_time = header.created_time;
    header.checksum = crc32(0, &header, sizeof(header) - sizeof(header.checksum));

    /* Write header to file */
    written = kernel_write(file, &header, sizeof(header), &pos);
    if (written != sizeof(header)) {
        filp_close(file, NULL);
        region->file = NULL;
        return -EIO;
    }

    memcpy(&region->header, &header, sizeof(header));
    region->used_size = sizeof(header);

    return 0;
}

/**
 * hinata_storage_region_cleanup - Cleanup storage region
 * @region: Region to cleanup
 */
static void hinata_storage_region_cleanup(struct hinata_storage_region *region)
{
    if (region->file) {
        vfs_fsync(region->file, 0);
        filp_close(region->file, NULL);
        region->file = NULL;
    }

    memset(region, 0, sizeof(*region));
}

/* Module initialization and cleanup */

/**
 * hinata_storage_module_init - Module initialization
 * 
 * Returns: 0 on success, negative error code on failure
 */
static int __init hinata_storage_module_init(void)
{
    return hinata_storage_init();
}

/**
 * hinata_storage_module_exit - Module cleanup
 */
static void __exit hinata_storage_module_exit(void)
{
    hinata_storage_cleanup();
}

module_init(hinata_storage_module_init);
module_exit(hinata_storage_module_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR(HINATA_STORAGE_AUTHOR);
MODULE_DESCRIPTION(HINATA_STORAGE_DESCRIPTION);
MODULE_VERSION(HINATA_STORAGE_VERSION);

/* Export symbols */
EXPORT_SYMBOL(hinata_storage_init);
EXPORT_SYMBOL(hinata_storage_cleanup);
EXPORT_SYMBOL(hinata_storage_create_region);
EXPORT_SYMBOL(hinata_storage_destroy_region);
EXPORT_SYMBOL(hinata_storage_store_packet);
EXPORT_SYMBOL(hinata_storage_load_packet);
EXPORT_SYMBOL(hinata_storage_delete_packet);
EXPORT_SYMBOL(hinata_storage_get_stats);
EXPORT_SYMBOL(hinata_storage_sync);
EXPORT_SYMBOL(hinata_storage_cache_get);
EXPORT_SYMBOL(hinata_storage_cache_put);
EXPORT_SYMBOL(hinata_storage_cache_remove);
EXPORT_SYMBOL(hinata_storage_cache_put_ref);
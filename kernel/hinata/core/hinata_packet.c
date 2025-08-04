/*
 * HiNATA Packet Management - Kernel Implementation
 * Part of notcontrolOS Knowledge Management System
 * 
 * This file implements packet creation, validation, and management
 * for the HiNATA knowledge system at the kernel level.
 */

#include <linux/kernel.h>
#include <linux/module.h>
#include <linux/slab.h>
#include <linux/string.h>
#include <linux/time.h>
#include <linux/uuid.h>
#include <linux/crypto.h>
#include <linux/random.h>
#include <linux/atomic.h>
#include <linux/mutex.h>
#include <linux/list.h>
#include <linux/hashtable.h>
#include <linux/rbtree.h>
#include <linux/crc32.h>

#include "../hinata_types.h"
#include "../hinata_core.h"
#include "hinata_packet.h"

/* Module Information */
MODULE_AUTHOR("HiNATA Development Team");
MODULE_DESCRIPTION("HiNATA Packet Management");
MODULE_LICENSE("GPL v2");
MODULE_VERSION("1.0.0");

/* Constants */
#define HINATA_PACKET_MAGIC 0x48494E41  /* "HINA" */
#define HINATA_PACKET_VERSION 1
#define HINATA_MAX_PACKET_SIZE (1024 * 1024)  /* 1MB */
#define HINATA_MAX_CONTENT_SIZE (512 * 1024)  /* 512KB */
#define HINATA_MAX_METADATA_SIZE (64 * 1024)  /* 64KB */
#define HINATA_PACKET_HASH_BITS 8
#define HINATA_PACKET_CACHE_SIZE 1024

/* Packet Hash Table */
static DEFINE_HASHTABLE(packet_hash_table, HINATA_PACKET_HASH_BITS);
static DEFINE_MUTEX(packet_hash_mutex);

/* Packet Cache */
static struct kmem_cache *packet_cache;
static struct kmem_cache *packet_node_cache;

/* Statistics */
static atomic64_t packet_create_count = ATOMIC64_INIT(0);
static atomic64_t packet_validate_count = ATOMIC64_INIT(0);
static atomic64_t packet_destroy_count = ATOMIC64_INIT(0);
static atomic64_t packet_hash_collisions = ATOMIC64_INIT(0);

/* Packet Node for Hash Table */
struct hinata_packet_node {
    struct hlist_node hash_node;
    struct hinata_packet *packet;
    atomic_t ref_count;
    unsigned long created_time;
    unsigned long last_access;
};

/* Forward Declarations */
static int hinata_packet_validate_internal(const struct hinata_packet *packet);
static u32 hinata_packet_calculate_hash(const char *id);
static struct hinata_packet_node *hinata_packet_find_node(const char *id);
static int hinata_packet_add_to_hash(struct hinata_packet *packet);
static void hinata_packet_remove_from_hash(const char *id);
static void hinata_packet_node_release(struct hinata_packet_node *node);

/**
 * hinata_packet_create - Create a new HiNATA packet
 * @type: Packet type
 * @content: Packet content
 * @content_size: Size of content
 * @metadata: Optional metadata
 * @metadata_size: Size of metadata
 * @source: Source identifier
 * @tags: Optional tags array
 * @tag_count: Number of tags
 * 
 * Returns: Pointer to created packet or NULL on error
 */
struct hinata_packet *hinata_packet_create(enum hinata_packet_type type,
                                         const void *content,
                                         size_t content_size,
                                         const void *metadata,
                                         size_t metadata_size,
                                         const char *source,
                                         const char **tags,
                                         size_t tag_count)
{
    struct hinata_packet *packet;
    struct timespec64 ts;
    size_t total_size;
    int i, ret;
    
    /* Validate input parameters */
    if (!content || content_size == 0 || content_size > HINATA_MAX_CONTENT_SIZE) {
        pr_err("HiNATA: Invalid content parameters\n");
        return NULL;
    }
    
    if (metadata && metadata_size > HINATA_MAX_METADATA_SIZE) {
        pr_err("HiNATA: Metadata too large\n");
        return NULL;
    }
    
    if (!source || strlen(source) == 0) {
        pr_err("HiNATA: Source is required\n");
        return NULL;
    }
    
    if (tag_count > HINATA_MAX_TAGS) {
        pr_err("HiNATA: Too many tags\n");
        return NULL;
    }
    
    /* Calculate total size */
    total_size = sizeof(struct hinata_packet) + content_size;
    if (metadata)
        total_size += metadata_size;
    
    if (total_size > HINATA_MAX_PACKET_SIZE) {
        pr_err("HiNATA: Packet too large\n");
        return NULL;
    }
    
    /* Allocate packet from cache */
    packet = kmem_cache_alloc(packet_cache, GFP_KERNEL);
    if (!packet) {
        pr_err("HiNATA: Failed to allocate packet\n");
        return NULL;
    }
    
    /* Initialize packet structure */
    memset(packet, 0, sizeof(struct hinata_packet));
    packet->magic = HINATA_PACKET_MAGIC;
    packet->version = HINATA_PACKET_VERSION;
    packet->type = type;
    packet->content_size = content_size;
    packet->metadata_size = metadata_size;
    packet->tag_count = tag_count;
    
    /* Generate UUID */
    ret = hinata_generate_uuid(packet->id, sizeof(packet->id));
    if (ret < 0) {
        pr_err("HiNATA: Failed to generate UUID\n");
        goto error_free_packet;
    }
    
    /* Set timestamps */
    ktime_get_real_ts64(&ts);
    packet->created_at = timespec64_to_ns(&ts);
    packet->updated_at = packet->created_at;
    
    /* Copy source */
    strncpy(packet->source, source, sizeof(packet->source) - 1);
    packet->source[sizeof(packet->source) - 1] = '\0';
    
    /* Allocate and copy content */
    packet->content = kmalloc(content_size, GFP_KERNEL);
    if (!packet->content) {
        pr_err("HiNATA: Failed to allocate content\n");
        goto error_free_packet;
    }
    memcpy(packet->content, content, content_size);
    
    /* Allocate and copy metadata if provided */
    if (metadata && metadata_size > 0) {
        packet->metadata = kmalloc(metadata_size, GFP_KERNEL);
        if (!packet->metadata) {
            pr_err("HiNATA: Failed to allocate metadata\n");
            goto error_free_content;
        }
        memcpy(packet->metadata, metadata, metadata_size);
    }
    
    /* Copy tags if provided */
    if (tags && tag_count > 0) {
        for (i = 0; i < tag_count && i < HINATA_MAX_TAGS; i++) {
            if (tags[i]) {
                strncpy(packet->tags[i], tags[i], HINATA_MAX_TAG_LENGTH - 1);
                packet->tags[i][HINATA_MAX_TAG_LENGTH - 1] = '\0';
            }
        }
    }
    
    /* Calculate content hash */
    packet->content_hash = crc32(0, packet->content, content_size);
    
    /* Set packet size */
    packet->size = total_size;
    
    /* Initialize reference count */
    atomic_set(&packet->ref_count, 1);
    
    /* Add to hash table */
    ret = hinata_packet_add_to_hash(packet);
    if (ret < 0) {
        pr_warn("HiNATA: Failed to add packet to hash table\n");
        /* Continue anyway, packet is still valid */
    }
    
    /* Update statistics */
    atomic64_inc(&packet_create_count);
    hinata_increment_packet_count();
    
    pr_debug("HiNATA: Created packet %s (type=%d, size=%zu)\n",
             packet->id, type, total_size);
    
    return packet;
    
error_free_content:
    kfree(packet->content);
error_free_packet:
    kmem_cache_free(packet_cache, packet);
    return NULL;
}
EXPORT_SYMBOL(hinata_packet_create);

/**
 * hinata_packet_validate - Validate a HiNATA packet
 * @packet: Packet to validate
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_packet_validate(const struct hinata_packet *packet)
{
    int ret;
    
    if (!packet) {
        pr_err("HiNATA: Null packet\n");
        return -EINVAL;
    }
    
    ret = hinata_packet_validate_internal(packet);
    
    /* Update statistics */
    atomic64_inc(&packet_validate_count);
    
    return ret;
}
EXPORT_SYMBOL(hinata_packet_validate);

/**
 * hinata_packet_get - Get packet reference
 * @packet: Packet to reference
 * 
 * Returns: Packet pointer or NULL
 */
struct hinata_packet *hinata_packet_get(struct hinata_packet *packet)
{
    if (!packet)
        return NULL;
    
    atomic_inc(&packet->ref_count);
    return packet;
}
EXPORT_SYMBOL(hinata_packet_get);

/**
 * hinata_packet_put - Release packet reference
 * @packet: Packet to release
 */
void hinata_packet_put(struct hinata_packet *packet)
{
    if (!packet)
        return;
    
    if (atomic_dec_and_test(&packet->ref_count)) {
        hinata_packet_destroy(packet);
    }
}
EXPORT_SYMBOL(hinata_packet_put);

/**
 * hinata_packet_find - Find packet by ID
 * @id: Packet ID to search for
 * 
 * Returns: Packet pointer with incremented reference or NULL
 */
struct hinata_packet *hinata_packet_find(const char *id)
{
    struct hinata_packet_node *node;
    struct hinata_packet *packet = NULL;
    
    if (!id || !hinata_validate_uuid(id))
        return NULL;
    
    mutex_lock(&packet_hash_mutex);
    node = hinata_packet_find_node(id);
    if (node) {
        packet = hinata_packet_get(node->packet);
        node->last_access = jiffies;
    }
    mutex_unlock(&packet_hash_mutex);
    
    return packet;
}
EXPORT_SYMBOL(hinata_packet_find);

/**
 * hinata_packet_destroy - Destroy a HiNATA packet
 * @packet: Packet to destroy
 */
void hinata_packet_destroy(struct hinata_packet *packet)
{
    if (!packet)
        return;
    
    pr_debug("HiNATA: Destroying packet %s\n", packet->id);
    
    /* Remove from hash table */
    hinata_packet_remove_from_hash(packet->id);
    
    /* Free allocated memory */
    kfree(packet->content);
    kfree(packet->metadata);
    
    /* Free packet structure */
    kmem_cache_free(packet_cache, packet);
    
    /* Update statistics */
    atomic64_inc(&packet_destroy_count);
    hinata_decrement_packet_count();
}
EXPORT_SYMBOL(hinata_packet_destroy);

/**
 * hinata_packet_clone - Clone a HiNATA packet
 * @original: Original packet to clone
 * 
 * Returns: Pointer to cloned packet or NULL on error
 */
struct hinata_packet *hinata_packet_clone(const struct hinata_packet *original)
{
    struct hinata_packet *clone;
    const char *tags[HINATA_MAX_TAGS];
    int i;
    
    if (!original || hinata_packet_validate(original) < 0)
        return NULL;
    
    /* Prepare tags array */
    for (i = 0; i < original->tag_count && i < HINATA_MAX_TAGS; i++) {
        tags[i] = original->tags[i];
    }
    
    /* Create new packet with same content */
    clone = hinata_packet_create(original->type,
                               original->content,
                               original->content_size,
                               original->metadata,
                               original->metadata_size,
                               original->source,
                               tags,
                               original->tag_count);
    
    if (clone) {
        pr_debug("HiNATA: Cloned packet %s -> %s\n", original->id, clone->id);
    }
    
    return clone;
}
EXPORT_SYMBOL(hinata_packet_clone);

/**
 * hinata_packet_get_statistics - Get packet statistics
 * @stats: Statistics structure to fill
 * 
 * Returns: 0 on success
 */
int hinata_packet_get_statistics(struct hinata_packet_stats *stats)
{
    if (!stats)
        return -EINVAL;
    
    stats->created_count = atomic64_read(&packet_create_count);
    stats->validated_count = atomic64_read(&packet_validate_count);
    stats->destroyed_count = atomic64_read(&packet_destroy_count);
    stats->hash_collisions = atomic64_read(&packet_hash_collisions);
    stats->active_count = stats->created_count - stats->destroyed_count;
    
    return 0;
}
EXPORT_SYMBOL(hinata_packet_get_statistics);

/* Internal Functions */

/**
 * hinata_packet_validate_internal - Internal packet validation
 * @packet: Packet to validate
 * 
 * Returns: 0 on success, negative error code on failure
 */
static int hinata_packet_validate_internal(const struct hinata_packet *packet)
{
    u32 calculated_hash;
    
    /* Check magic number */
    if (packet->magic != HINATA_PACKET_MAGIC) {
        pr_err("HiNATA: Invalid packet magic\n");
        return -EINVAL;
    }
    
    /* Check version */
    if (packet->version != HINATA_PACKET_VERSION) {
        pr_err("HiNATA: Unsupported packet version\n");
        return -EINVAL;
    }
    
    /* Check packet type */
    if (packet->type >= HINATA_PACKET_TYPE_MAX) {
        pr_err("HiNATA: Invalid packet type\n");
        return -EINVAL;
    }
    
    /* Check UUID */
    if (!hinata_validate_uuid(packet->id)) {
        pr_err("HiNATA: Invalid packet UUID\n");
        return -EINVAL;
    }
    
    /* Check content */
    if (!packet->content || packet->content_size == 0) {
        pr_err("HiNATA: Invalid packet content\n");
        return -EINVAL;
    }
    
    if (packet->content_size > HINATA_MAX_CONTENT_SIZE) {
        pr_err("HiNATA: Content too large\n");
        return -EINVAL;
    }
    
    /* Check metadata */
    if (packet->metadata_size > 0 && !packet->metadata) {
        pr_err("HiNATA: Invalid metadata\n");
        return -EINVAL;
    }
    
    if (packet->metadata_size > HINATA_MAX_METADATA_SIZE) {
        pr_err("HiNATA: Metadata too large\n");
        return -EINVAL;
    }
    
    /* Check source */
    if (strlen(packet->source) == 0) {
        pr_err("HiNATA: Empty source\n");
        return -EINVAL;
    }
    
    /* Check tag count */
    if (packet->tag_count > HINATA_MAX_TAGS) {
        pr_err("HiNATA: Too many tags\n");
        return -EINVAL;
    }
    
    /* Verify content hash */
    calculated_hash = crc32(0, packet->content, packet->content_size);
    if (calculated_hash != packet->content_hash) {
        pr_err("HiNATA: Content hash mismatch\n");
        return -EINVAL;
    }
    
    /* Check timestamps */
    if (packet->created_at == 0 || packet->updated_at == 0) {
        pr_err("HiNATA: Invalid timestamps\n");
        return -EINVAL;
    }
    
    if (packet->updated_at < packet->created_at) {
        pr_err("HiNATA: Invalid timestamp order\n");
        return -EINVAL;
    }
    
    return 0;
}

/**
 * hinata_packet_calculate_hash - Calculate hash for packet ID
 * @id: Packet ID
 * 
 * Returns: Hash value
 */
static u32 hinata_packet_calculate_hash(const char *id)
{
    return jhash(id, strlen(id), 0);
}

/**
 * hinata_packet_find_node - Find packet node in hash table
 * @id: Packet ID to search for
 * 
 * Returns: Packet node or NULL
 */
static struct hinata_packet_node *hinata_packet_find_node(const char *id)
{
    struct hinata_packet_node *node;
    u32 hash = hinata_packet_calculate_hash(id);
    
    hash_for_each_possible(packet_hash_table, node, hash_node, hash) {
        if (strcmp(node->packet->id, id) == 0)
            return node;
    }
    
    return NULL;
}

/**
 * hinata_packet_add_to_hash - Add packet to hash table
 * @packet: Packet to add
 * 
 * Returns: 0 on success, negative error code on failure
 */
static int hinata_packet_add_to_hash(struct hinata_packet *packet)
{
    struct hinata_packet_node *node;
    u32 hash;
    
    node = kmem_cache_alloc(packet_node_cache, GFP_KERNEL);
    if (!node)
        return -ENOMEM;
    
    node->packet = packet;
    atomic_set(&node->ref_count, 1);
    node->created_time = jiffies;
    node->last_access = jiffies;
    
    hash = hinata_packet_calculate_hash(packet->id);
    
    mutex_lock(&packet_hash_mutex);
    
    /* Check for collisions */
    if (hinata_packet_find_node(packet->id)) {
        mutex_unlock(&packet_hash_mutex);
        kmem_cache_free(packet_node_cache, node);
        atomic64_inc(&packet_hash_collisions);
        return -EEXIST;
    }
    
    hash_add(packet_hash_table, &node->hash_node, hash);
    mutex_unlock(&packet_hash_mutex);
    
    return 0;
}

/**
 * hinata_packet_remove_from_hash - Remove packet from hash table
 * @id: Packet ID to remove
 */
static void hinata_packet_remove_from_hash(const char *id)
{
    struct hinata_packet_node *node;
    
    mutex_lock(&packet_hash_mutex);
    node = hinata_packet_find_node(id);
    if (node) {
        hash_del(&node->hash_node);
        hinata_packet_node_release(node);
    }
    mutex_unlock(&packet_hash_mutex);
}

/**
 * hinata_packet_node_release - Release packet node
 * @node: Node to release
 */
static void hinata_packet_node_release(struct hinata_packet_node *node)
{
    if (atomic_dec_and_test(&node->ref_count)) {
        kmem_cache_free(packet_node_cache, node);
    }
}

/**
 * hinata_packet_init - Initialize packet subsystem
 * 
 * Returns: 0 on success, negative error code on failure
 */
int __init hinata_packet_init(void)
{
    pr_info("HiNATA: Initializing packet subsystem\n");
    
    /* Create packet cache */
    packet_cache = kmem_cache_create("hinata_packet",
                                   sizeof(struct hinata_packet),
                                   0, SLAB_HWCACHE_ALIGN, NULL);
    if (!packet_cache) {
        pr_err("HiNATA: Failed to create packet cache\n");
        return -ENOMEM;
    }
    
    /* Create packet node cache */
    packet_node_cache = kmem_cache_create("hinata_packet_node",
                                        sizeof(struct hinata_packet_node),
                                        0, SLAB_HWCACHE_ALIGN, NULL);
    if (!packet_node_cache) {
        pr_err("HiNATA: Failed to create packet node cache\n");
        kmem_cache_destroy(packet_cache);
        return -ENOMEM;
    }
    
    /* Initialize hash table */
    hash_init(packet_hash_table);
    
    pr_info("HiNATA: Packet subsystem initialized\n");
    return 0;
}

/**
 * hinata_packet_exit - Cleanup packet subsystem
 */
void __exit hinata_packet_exit(void)
{
    struct hinata_packet_node *node;
    struct hlist_node *tmp;
    int bkt;
    
    pr_info("HiNATA: Cleaning up packet subsystem\n");
    
    /* Clean up hash table */
    mutex_lock(&packet_hash_mutex);
    hash_for_each_safe(packet_hash_table, bkt, tmp, node, hash_node) {
        hash_del(&node->hash_node);
        hinata_packet_put(node->packet);
        hinata_packet_node_release(node);
    }
    mutex_unlock(&packet_hash_mutex);
    
    /* Destroy caches */
    kmem_cache_destroy(packet_node_cache);
    kmem_cache_destroy(packet_cache);
    
    pr_info("HiNATA: Packet subsystem cleaned up\n");
}

module_init(hinata_packet_init);
module_exit(hinata_packet_exit);
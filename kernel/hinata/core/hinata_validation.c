/*
 * HiNATA Validation System - Kernel Implementation
 * Part of notcontrolOS Knowledge Management System
 * 
 * This file implements validation functions for packets, knowledge blocks,
 * and other HiNATA data structures at the kernel level.
 */

#include <linux/kernel.h>
#include <linux/module.h>
#include <linux/slab.h>
#include <linux/string.h>
#include <linux/ctype.h>
#include <linux/crc32.h>
#include <linux/crypto.h>
#include <linux/random.h>
#include <linux/atomic.h>
#include <linux/mutex.h>
#include <linux/time.h>
#include <linux/limits.h>

#include "../hinata_types.h"
#include "../hinata_core.h"
#include "hinata_packet.h"
#include "hinata_validation.h"

/* Module Information */
MODULE_AUTHOR("HiNATA Development Team");
MODULE_DESCRIPTION("HiNATA Validation System");
MODULE_LICENSE("GPL v2");
MODULE_VERSION("1.0.0");

/* Constants */
#define HINATA_UUID_PATTERN_LENGTH 36
#define HINATA_MIN_CONTENT_SIZE 1
#define HINATA_MAX_VALIDATION_DEPTH 10
#define HINATA_VALIDATION_CACHE_SIZE 256

/* Validation Statistics */
static atomic64_t validation_count = ATOMIC64_INIT(0);
static atomic64_t validation_success_count = ATOMIC64_INIT(0);
static atomic64_t validation_failure_count = ATOMIC64_INIT(0);
static atomic64_t uuid_validation_count = ATOMIC64_INIT(0);
static atomic64_t content_validation_count = ATOMIC64_INIT(0);
static atomic64_t metadata_validation_count = ATOMIC64_INIT(0);

/* Validation Cache */
struct validation_cache_entry {
    char id[HINATA_UUID_LENGTH];
    u32 content_hash;
    bool is_valid;
    unsigned long timestamp;
};

static struct validation_cache_entry validation_cache[HINATA_VALIDATION_CACHE_SIZE];
static DEFINE_MUTEX(validation_cache_mutex);
static atomic_t cache_index = ATOMIC_INIT(0);

/* Forward Declarations */
static bool hinata_validate_uuid_format(const char *uuid);
static bool hinata_validate_content_integrity(const void *content, size_t size, u32 expected_hash);
static bool hinata_validate_metadata_format(const void *metadata, size_t size);
static bool hinata_validate_tags_format(const char tags[][HINATA_MAX_TAG_LENGTH], size_t count);
static bool hinata_validate_source_format(const char *source);
static bool hinata_validate_timestamps(u64 created_at, u64 updated_at);
static int hinata_validation_cache_lookup(const char *id, u32 content_hash);
static void hinata_validation_cache_add(const char *id, u32 content_hash, bool is_valid);
static bool hinata_is_printable_string(const char *str, size_t max_len);
static bool hinata_is_valid_filename(const char *filename);

/**
 * hinata_validate_packet_full - Comprehensive packet validation
 * @packet: Packet to validate
 * @flags: Validation flags
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_validate_packet_full(const struct hinata_packet *packet, u32 flags)
{
    int ret;
    
    if (!packet) {
        pr_err("HiNATA: Null packet for validation\n");
        atomic64_inc(&validation_failure_count);
        return -EINVAL;
    }
    
    atomic64_inc(&validation_count);
    
    /* Check validation cache first */
    if (!(flags & HINATA_VALIDATE_FORCE_RECHECK)) {
        ret = hinata_validation_cache_lookup(packet->id, packet->content_hash);
        if (ret > 0) {
            atomic64_inc(&validation_success_count);
            return 0;
        } else if (ret == 0) {
            atomic64_inc(&validation_failure_count);
            return -EINVAL;
        }
        /* ret < 0 means not in cache, continue validation */
    }
    
    /* Basic structure validation */
    ret = hinata_validate_packet_structure(packet);
    if (ret < 0) {
        pr_err("HiNATA: Packet structure validation failed\n");
        goto validation_failed;
    }
    
    /* Content validation */
    if (flags & HINATA_VALIDATE_CONTENT) {
        ret = hinata_validate_packet_content(packet);
        if (ret < 0) {
            pr_err("HiNATA: Packet content validation failed\n");
            goto validation_failed;
        }
    }
    
    /* Metadata validation */
    if ((flags & HINATA_VALIDATE_METADATA) && packet->metadata) {
        ret = hinata_validate_packet_metadata(packet);
        if (ret < 0) {
            pr_err("HiNATA: Packet metadata validation failed\n");
            goto validation_failed;
        }
    }
    
    /* Security validation */
    if (flags & HINATA_VALIDATE_SECURITY) {
        ret = hinata_validate_packet_security(packet);
        if (ret < 0) {
            pr_err("HiNATA: Packet security validation failed\n");
            goto validation_failed;
        }
    }
    
    /* Integrity validation */
    if (flags & HINATA_VALIDATE_INTEGRITY) {
        ret = hinata_validate_packet_integrity(packet);
        if (ret < 0) {
            pr_err("HiNATA: Packet integrity validation failed\n");
            goto validation_failed;
        }
    }
    
    /* Add to validation cache */
    hinata_validation_cache_add(packet->id, packet->content_hash, true);
    
    atomic64_inc(&validation_success_count);
    pr_debug("HiNATA: Packet %s validation successful\n", packet->id);
    return 0;
    
validation_failed:
    hinata_validation_cache_add(packet->id, packet->content_hash, false);
    atomic64_inc(&validation_failure_count);
    return ret;
}
EXPORT_SYMBOL(hinata_validate_packet_full);

/**
 * hinata_validate_packet_structure - Validate packet structure
 * @packet: Packet to validate
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_validate_packet_structure(const struct hinata_packet *packet)
{
    if (!packet)
        return -EINVAL;
    
    /* Check magic number */
    if (packet->magic != HINATA_PACKET_MAGIC) {
        pr_err("HiNATA: Invalid packet magic: 0x%x\n", packet->magic);
        return -EINVAL;
    }
    
    /* Check version */
    if (packet->version != HINATA_PACKET_VERSION) {
        pr_err("HiNATA: Unsupported packet version: %u\n", packet->version);
        return -EINVAL;
    }
    
    /* Validate UUID */
    if (!hinata_validate_uuid_format(packet->id)) {
        pr_err("HiNATA: Invalid packet UUID format\n");
        return -EINVAL;
    }
    
    /* Check packet type */
    if (!hinata_packet_is_valid_type(packet->type)) {
        pr_err("HiNATA: Invalid packet type: %d\n", packet->type);
        return -EINVAL;
    }
    
    /* Check priority */
    if (!hinata_packet_is_valid_priority(packet->priority)) {
        pr_err("HiNATA: Invalid packet priority: %d\n", packet->priority);
        return -EINVAL;
    }
    
    /* Check status */
    if (!hinata_packet_is_valid_status(packet->status)) {
        pr_err("HiNATA: Invalid packet status: %d\n", packet->status);
        return -EINVAL;
    }
    
    /* Validate sizes */
    if (packet->content_size == 0 || packet->content_size > HINATA_MAX_CONTENT_SIZE) {
        pr_err("HiNATA: Invalid content size: %zu\n", packet->content_size);
        return -EINVAL;
    }
    
    if (packet->metadata_size > HINATA_MAX_METADATA_SIZE) {
        pr_err("HiNATA: Invalid metadata size: %zu\n", packet->metadata_size);
        return -EINVAL;
    }
    
    /* Validate pointers */
    if (!packet->content) {
        pr_err("HiNATA: Null content pointer\n");
        return -EINVAL;
    }
    
    if (packet->metadata_size > 0 && !packet->metadata) {
        pr_err("HiNATA: Null metadata pointer with non-zero size\n");
        return -EINVAL;
    }
    
    /* Validate source */
    if (!hinata_validate_source_format(packet->source)) {
        pr_err("HiNATA: Invalid source format\n");
        return -EINVAL;
    }
    
    /* Validate timestamps */
    if (!hinata_validate_timestamps(packet->created_at, packet->updated_at)) {
        pr_err("HiNATA: Invalid timestamps\n");
        return -EINVAL;
    }
    
    /* Validate tags */
    if (!hinata_validate_tags_format(packet->tags, packet->tag_count)) {
        pr_err("HiNATA: Invalid tags format\n");
        return -EINVAL;
    }
    
    /* Validate reference count */
    if (atomic_read(&packet->ref_count) <= 0) {
        pr_err("HiNATA: Invalid reference count: %d\n",
               atomic_read(&packet->ref_count));
        return -EINVAL;
    }
    
    return 0;
}
EXPORT_SYMBOL(hinata_validate_packet_structure);

/**
 * hinata_validate_packet_content - Validate packet content
 * @packet: Packet to validate
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_validate_packet_content(const struct hinata_packet *packet)
{
    if (!packet || !packet->content)
        return -EINVAL;
    
    atomic64_inc(&content_validation_count);
    
    /* Validate content integrity */
    if (!hinata_validate_content_integrity(packet->content,
                                         packet->content_size,
                                         packet->content_hash)) {
        pr_err("HiNATA: Content integrity check failed\n");
        return -EINVAL;
    }
    
    /* Type-specific content validation */
    switch (packet->type) {
    case HINATA_PACKET_TEXT:
    case HINATA_PACKET_MARKDOWN:
        /* Validate text content */
        if (!hinata_is_printable_string(packet->content, packet->content_size)) {
            pr_err("HiNATA: Invalid text content\n");
            return -EINVAL;
        }
        break;
        
    case HINATA_PACKET_CODE:
        /* Basic code validation - ensure it's text */
        if (!hinata_is_printable_string(packet->content, packet->content_size)) {
            pr_err("HiNATA: Invalid code content\n");
            return -EINVAL;
        }
        break;
        
    case HINATA_PACKET_LINK:
        /* Validate URL format */
        if (packet->content_size > 2048) {
            pr_err("HiNATA: Link too long\n");
            return -EINVAL;
        }
        break;
        
    case HINATA_PACKET_DATA:
    case HINATA_PACKET_IMAGE:
    case HINATA_PACKET_AUDIO:
    case HINATA_PACKET_VIDEO:
    case HINATA_PACKET_DOCUMENT:
    case HINATA_PACKET_ARCHIVE:
        /* Binary content - basic size check */
        if (packet->content_size > HINATA_MAX_CONTENT_SIZE) {
            pr_err("HiNATA: Binary content too large\n");
            return -EINVAL;
        }
        break;
        
    default:
        pr_warn("HiNATA: Unknown packet type for content validation: %d\n",
                packet->type);
        break;
    }
    
    return 0;
}
EXPORT_SYMBOL(hinata_validate_packet_content);

/**
 * hinata_validate_packet_metadata - Validate packet metadata
 * @packet: Packet to validate
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_validate_packet_metadata(const struct hinata_packet *packet)
{
    if (!packet)
        return -EINVAL;
    
    if (packet->metadata_size == 0)
        return 0;  /* No metadata to validate */
    
    if (!packet->metadata) {
        pr_err("HiNATA: Null metadata pointer with non-zero size\n");
        return -EINVAL;
    }
    
    atomic64_inc(&metadata_validation_count);
    
    /* Validate metadata format */
    if (!hinata_validate_metadata_format(packet->metadata, packet->metadata_size)) {
        pr_err("HiNATA: Invalid metadata format\n");
        return -EINVAL;
    }
    
    return 0;
}
EXPORT_SYMBOL(hinata_validate_packet_metadata);

/**
 * hinata_validate_packet_security - Validate packet security aspects
 * @packet: Packet to validate
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_validate_packet_security(const struct hinata_packet *packet)
{
    if (!packet)
        return -EINVAL;
    
    /* Check for suspicious content patterns */
    if (packet->type == HINATA_PACKET_TEXT || packet->type == HINATA_PACKET_CODE) {
        const char *content = (const char *)packet->content;
        size_t i;
        
        /* Basic security checks for text content */
        for (i = 0; i < packet->content_size - 1; i++) {
            /* Check for null bytes in text content */
            if (content[i] == '\0') {
                pr_warn("HiNATA: Null byte found in text content at position %zu\n", i);
                return -EINVAL;
            }
        }
    }
    
    /* Validate source for security */
    if (strstr(packet->source, "..") || strstr(packet->source, "/")) {
        pr_err("HiNATA: Suspicious source path: %s\n", packet->source);
        return -EINVAL;
    }
    
    /* Check for excessively long tags (potential DoS) */
    size_t i;
    for (i = 0; i < packet->tag_count; i++) {
        if (strlen(packet->tags[i]) >= HINATA_MAX_TAG_LENGTH) {
            pr_err("HiNATA: Tag too long at index %zu\n", i);
            return -EINVAL;
        }
    }
    
    return 0;
}
EXPORT_SYMBOL(hinata_validate_packet_security);

/**
 * hinata_validate_packet_integrity - Validate packet integrity
 * @packet: Packet to validate
 * 
 * Returns: 0 on success, negative error code on failure
 */
int hinata_validate_packet_integrity(const struct hinata_packet *packet)
{
    u32 calculated_hash;
    
    if (!packet || !packet->content)
        return -EINVAL;
    
    /* Calculate and verify content hash */
    calculated_hash = crc32(0, packet->content, packet->content_size);
    if (calculated_hash != packet->content_hash) {
        pr_err("HiNATA: Content hash mismatch: expected 0x%x, got 0x%x\n",
               packet->content_hash, calculated_hash);
        return -EINVAL;
    }
    
    /* Verify size consistency */
    size_t expected_size = sizeof(struct hinata_packet) + packet->content_size;
    if (packet->metadata_size > 0)
        expected_size += packet->metadata_size;
    
    if (packet->size != expected_size) {
        pr_err("HiNATA: Size mismatch: expected %zu, got %zu\n",
               expected_size, packet->size);
        return -EINVAL;
    }
    
    return 0;
}
EXPORT_SYMBOL(hinata_validate_packet_integrity);

/**
 * hinata_validate_uuid - Validate UUID string
 * @uuid: UUID string to validate
 * 
 * Returns: true if valid, false otherwise
 */
bool hinata_validate_uuid(const char *uuid)
{
    bool result;
    
    if (!uuid)
        return false;
    
    atomic64_inc(&uuid_validation_count);
    result = hinata_validate_uuid_format(uuid);
    
    return result;
}
EXPORT_SYMBOL(hinata_validate_uuid);

/**
 * hinata_validate_content_hash - Validate content against hash
 * @content: Content to validate
 * @size: Content size
 * @expected_hash: Expected hash value
 * 
 * Returns: true if valid, false otherwise
 */
bool hinata_validate_content_hash(const void *content, size_t size, u32 expected_hash)
{
    if (!content || size == 0)
        return false;
    
    return hinata_validate_content_integrity(content, size, expected_hash);
}
EXPORT_SYMBOL(hinata_validate_content_hash);

/**
 * hinata_get_validation_statistics - Get validation statistics
 * @stats: Statistics structure to fill
 * 
 * Returns: 0 on success
 */
int hinata_get_validation_statistics(struct hinata_validation_stats *stats)
{
    if (!stats)
        return -EINVAL;
    
    stats->total_validations = atomic64_read(&validation_count);
    stats->successful_validations = atomic64_read(&validation_success_count);
    stats->failed_validations = atomic64_read(&validation_failure_count);
    stats->uuid_validations = atomic64_read(&uuid_validation_count);
    stats->content_validations = atomic64_read(&content_validation_count);
    stats->metadata_validations = atomic64_read(&metadata_validation_count);
    
    if (stats->total_validations > 0) {
        stats->success_rate = (stats->successful_validations * 100) / stats->total_validations;
    } else {
        stats->success_rate = 0;
    }
    
    return 0;
}
EXPORT_SYMBOL(hinata_get_validation_statistics);

/* Internal Helper Functions */

/**
 * hinata_validate_uuid_format - Validate UUID format
 * @uuid: UUID string to validate
 * 
 * Returns: true if valid UUID format, false otherwise
 */
static bool hinata_validate_uuid_format(const char *uuid)
{
    int i;
    
    if (!uuid || strlen(uuid) != HINATA_UUID_PATTERN_LENGTH)
        return false;
    
    /* Check UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx */
    for (i = 0; i < HINATA_UUID_PATTERN_LENGTH; i++) {
        if (i == 8 || i == 13 || i == 18 || i == 23) {
            if (uuid[i] != '-')
                return false;
        } else {
            if (!isxdigit(uuid[i]))
                return false;
        }
    }
    
    return true;
}

/**
 * hinata_validate_content_integrity - Validate content integrity
 * @content: Content to validate
 * @size: Content size
 * @expected_hash: Expected hash value
 * 
 * Returns: true if integrity check passes, false otherwise
 */
static bool hinata_validate_content_integrity(const void *content, size_t size, u32 expected_hash)
{
    u32 calculated_hash;
    
    if (!content || size == 0)
        return false;
    
    calculated_hash = crc32(0, content, size);
    return calculated_hash == expected_hash;
}

/**
 * hinata_validate_metadata_format - Validate metadata format
 * @metadata: Metadata to validate
 * @size: Metadata size
 * 
 * Returns: true if valid format, false otherwise
 */
static bool hinata_validate_metadata_format(const void *metadata, size_t size)
{
    const char *meta_str;
    size_t i;
    
    if (!metadata || size == 0)
        return false;
    
    /* Basic validation - ensure metadata is printable */
    meta_str = (const char *)metadata;
    for (i = 0; i < size; i++) {
        if (!isprint(meta_str[i]) && !isspace(meta_str[i])) {
            return false;
        }
    }
    
    return true;
}

/**
 * hinata_validate_tags_format - Validate tags format
 * @tags: Tags array to validate
 * @count: Number of tags
 * 
 * Returns: true if valid format, false otherwise
 */
static bool hinata_validate_tags_format(const char tags[][HINATA_MAX_TAG_LENGTH], size_t count)
{
    size_t i, j;
    
    if (count > HINATA_MAX_TAGS)
        return false;
    
    for (i = 0; i < count; i++) {
        size_t tag_len = strlen(tags[i]);
        
        if (tag_len == 0 || tag_len >= HINATA_MAX_TAG_LENGTH)
            return false;
        
        /* Check for valid tag characters */
        for (j = 0; j < tag_len; j++) {
            if (!isalnum(tags[i][j]) && tags[i][j] != '_' && tags[i][j] != '-') {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * hinata_validate_source_format - Validate source format
 * @source: Source string to validate
 * 
 * Returns: true if valid format, false otherwise
 */
static bool hinata_validate_source_format(const char *source)
{
    size_t len;
    
    if (!source)
        return false;
    
    len = strlen(source);
    if (len == 0 || len >= HINATA_MAX_SOURCE_LENGTH)
        return false;
    
    return hinata_is_printable_string(source, len);
}

/**
 * hinata_validate_timestamps - Validate timestamps
 * @created_at: Creation timestamp
 * @updated_at: Update timestamp
 * 
 * Returns: true if valid timestamps, false otherwise
 */
static bool hinata_validate_timestamps(u64 created_at, u64 updated_at)
{
    struct timespec64 current_time;
    u64 current_ns;
    
    if (created_at == 0 || updated_at == 0)
        return false;
    
    if (updated_at < created_at)
        return false;
    
    /* Check if timestamps are not in the future */
    ktime_get_real_ts64(&current_time);
    current_ns = timespec64_to_ns(&current_time);
    
    if (created_at > current_ns || updated_at > current_ns)
        return false;
    
    return true;
}

/**
 * hinata_validation_cache_lookup - Look up validation result in cache
 * @id: Packet ID
 * @content_hash: Content hash
 * 
 * Returns: 1 if valid, 0 if invalid, -1 if not found
 */
static int hinata_validation_cache_lookup(const char *id, u32 content_hash)
{
    int i;
    unsigned long current_time = jiffies;
    
    mutex_lock(&validation_cache_mutex);
    
    for (i = 0; i < HINATA_VALIDATION_CACHE_SIZE; i++) {
        if (strcmp(validation_cache[i].id, id) == 0 &&
            validation_cache[i].content_hash == content_hash) {
            
            /* Check if cache entry is still valid (not older than 5 minutes) */
            if (time_before(current_time, validation_cache[i].timestamp + 5 * 60 * HZ)) {
                bool is_valid = validation_cache[i].is_valid;
                mutex_unlock(&validation_cache_mutex);
                return is_valid ? 1 : 0;
            }
            
            /* Cache entry expired, remove it */
            memset(&validation_cache[i], 0, sizeof(struct validation_cache_entry));
            break;
        }
    }
    
    mutex_unlock(&validation_cache_mutex);
    return -1;  /* Not found */
}

/**
 * hinata_validation_cache_add - Add validation result to cache
 * @id: Packet ID
 * @content_hash: Content hash
 * @is_valid: Validation result
 */
static void hinata_validation_cache_add(const char *id, u32 content_hash, bool is_valid)
{
    int index;
    
    mutex_lock(&validation_cache_mutex);
    
    index = atomic_inc_return(&cache_index) % HINATA_VALIDATION_CACHE_SIZE;
    
    strncpy(validation_cache[index].id, id, sizeof(validation_cache[index].id) - 1);
    validation_cache[index].id[sizeof(validation_cache[index].id) - 1] = '\0';
    validation_cache[index].content_hash = content_hash;
    validation_cache[index].is_valid = is_valid;
    validation_cache[index].timestamp = jiffies;
    
    mutex_unlock(&validation_cache_mutex);
}

/**
 * hinata_is_printable_string - Check if string contains only printable characters
 * @str: String to check
 * @max_len: Maximum length to check
 * 
 * Returns: true if printable, false otherwise
 */
static bool hinata_is_printable_string(const char *str, size_t max_len)
{
    size_t i;
    
    if (!str)
        return false;
    
    for (i = 0; i < max_len && str[i] != '\0'; i++) {
        if (!isprint(str[i]) && !isspace(str[i]))
            return false;
    }
    
    return true;
}

/**
 * hinata_is_valid_filename - Check if string is a valid filename
 * @filename: Filename to check
 * 
 * Returns: true if valid filename, false otherwise
 */
static bool hinata_is_valid_filename(const char *filename)
{
    size_t len, i;
    const char *invalid_chars = "<>:\"/|?*";
    
    if (!filename)
        return false;
    
    len = strlen(filename);
    if (len == 0 || len > 255)
        return false;
    
    /* Check for invalid characters */
    for (i = 0; i < len; i++) {
        if (strchr(invalid_chars, filename[i]))
            return false;
        if (filename[i] < 32)  /* Control characters */
            return false;
    }
    
    /* Check for reserved names */
    if (strcmp(filename, ".") == 0 || strcmp(filename, "..") == 0)
        return false;
    
    return true;
}

/**
 * hinata_validation_init - Initialize validation subsystem
 * 
 * Returns: 0 on success, negative error code on failure
 */
int __init hinata_validation_init(void)
{
    pr_info("HiNATA: Initializing validation subsystem\n");
    
    /* Initialize validation cache */
    memset(validation_cache, 0, sizeof(validation_cache));
    
    pr_info("HiNATA: Validation subsystem initialized\n");
    return 0;
}

/**
 * hinata_validation_exit - Cleanup validation subsystem
 */
void __exit hinata_validation_exit(void)
{
    pr_info("HiNATA: Cleaning up validation subsystem\n");
    
    /* Clear validation cache */
    mutex_lock(&validation_cache_mutex);
    memset(validation_cache, 0, sizeof(validation_cache));
    mutex_unlock(&validation_cache_mutex);
    
    pr_info("HiNATA: Validation subsystem cleaned up\n");
}

module_init(hinata_validation_init);
module_exit(hinata_validation_exit);
/*
 * HiNATA Packet Management - Header File
 * Part of notcontrolOS Knowledge Management System
 * 
 * This header defines packet structures, types, and function declarations
 * for the HiNATA knowledge system at the kernel level.
 */

#ifndef _HINATA_PACKET_H
#define _HINATA_PACKET_H

#include <linux/types.h>
#include <linux/atomic.h>
#include <linux/time.h>

/* Constants */
#define HINATA_UUID_LENGTH 37          /* UUID string length including null terminator */
#define HINATA_MAX_SOURCE_LENGTH 256   /* Maximum source identifier length */
#define HINATA_MAX_TAGS 16            /* Maximum number of tags per packet */
#define HINATA_MAX_TAG_LENGTH 64      /* Maximum length of a single tag */

/**
 * enum hinata_packet_type - HiNATA packet types
 * @HINATA_PACKET_TEXT: Plain text content
 * @HINATA_PACKET_MARKDOWN: Markdown formatted content
 * @HINATA_PACKET_CODE: Source code content
 * @HINATA_PACKET_DATA: Binary data content
 * @HINATA_PACKET_LINK: Link/reference content
 * @HINATA_PACKET_IMAGE: Image content
 * @HINATA_PACKET_AUDIO: Audio content
 * @HINATA_PACKET_VIDEO: Video content
 * @HINATA_PACKET_DOCUMENT: Document content
 * @HINATA_PACKET_ARCHIVE: Archive content
 * @HINATA_PACKET_CUSTOM: Custom content type
 * @HINATA_PACKET_TYPE_MAX: Maximum packet type value
 */
enum hinata_packet_type {
    HINATA_PACKET_TEXT = 0,
    HINATA_PACKET_MARKDOWN,
    HINATA_PACKET_CODE,
    HINATA_PACKET_DATA,
    HINATA_PACKET_LINK,
    HINATA_PACKET_IMAGE,
    HINATA_PACKET_AUDIO,
    HINATA_PACKET_VIDEO,
    HINATA_PACKET_DOCUMENT,
    HINATA_PACKET_ARCHIVE,
    HINATA_PACKET_CUSTOM,
    HINATA_PACKET_TYPE_MAX
};

/**
 * enum hinata_packet_priority - Packet processing priority
 * @HINATA_PRIORITY_LOW: Low priority
 * @HINATA_PRIORITY_NORMAL: Normal priority
 * @HINATA_PRIORITY_HIGH: High priority
 * @HINATA_PRIORITY_CRITICAL: Critical priority
 */
enum hinata_packet_priority {
    HINATA_PRIORITY_LOW = 0,
    HINATA_PRIORITY_NORMAL,
    HINATA_PRIORITY_HIGH,
    HINATA_PRIORITY_CRITICAL
};

/**
 * enum hinata_packet_status - Packet processing status
 * @HINATA_STATUS_CREATED: Packet created
 * @HINATA_STATUS_PROCESSING: Packet being processed
 * @HINATA_STATUS_STORED: Packet stored
 * @HINATA_STATUS_INDEXED: Packet indexed
 * @HINATA_STATUS_ERROR: Packet processing error
 * @HINATA_STATUS_ARCHIVED: Packet archived
 */
enum hinata_packet_status {
    HINATA_STATUS_CREATED = 0,
    HINATA_STATUS_PROCESSING,
    HINATA_STATUS_STORED,
    HINATA_STATUS_INDEXED,
    HINATA_STATUS_ERROR,
    HINATA_STATUS_ARCHIVED
};

/**
 * struct hinata_packet - HiNATA data packet structure
 * @magic: Magic number for validation
 * @version: Packet format version
 * @id: Unique packet identifier (UUID)
 * @type: Packet content type
 * @priority: Processing priority
 * @status: Current processing status
 * @size: Total packet size in bytes
 * @content_size: Size of content data
 * @metadata_size: Size of metadata
 * @content_hash: Hash of content for integrity
 * @created_at: Creation timestamp (nanoseconds)
 * @updated_at: Last update timestamp (nanoseconds)
 * @source: Source identifier
 * @tags: Array of tags
 * @tag_count: Number of tags
 * @content: Pointer to content data
 * @metadata: Pointer to metadata
 * @ref_count: Reference counter
 * @flags: Packet flags
 */
struct hinata_packet {
    u32 magic;
    u32 version;
    char id[HINATA_UUID_LENGTH];
    enum hinata_packet_type type;
    enum hinata_packet_priority priority;
    enum hinata_packet_status status;
    size_t size;
    size_t content_size;
    size_t metadata_size;
    u32 content_hash;
    u64 created_at;
    u64 updated_at;
    char source[HINATA_MAX_SOURCE_LENGTH];
    char tags[HINATA_MAX_TAGS][HINATA_MAX_TAG_LENGTH];
    size_t tag_count;
    void *content;
    void *metadata;
    atomic_t ref_count;
    u32 flags;
};

/**
 * struct hinata_packet_stats - Packet subsystem statistics
 * @created_count: Total packets created
 * @validated_count: Total packets validated
 * @destroyed_count: Total packets destroyed
 * @active_count: Currently active packets
 * @hash_collisions: Hash table collisions
 * @cache_hits: Cache hit count
 * @cache_misses: Cache miss count
 * @memory_usage: Current memory usage in bytes
 */
struct hinata_packet_stats {
    u64 created_count;
    u64 validated_count;
    u64 destroyed_count;
    u64 active_count;
    u64 hash_collisions;
    u64 cache_hits;
    u64 cache_misses;
    u64 memory_usage;
};

/**
 * struct hinata_packet_filter - Packet search/filter criteria
 * @type: Packet type filter (optional)
 * @source: Source filter (optional)
 * @tag: Tag filter (optional)
 * @created_after: Created after timestamp (optional)
 * @created_before: Created before timestamp (optional)
 * @min_size: Minimum size filter (optional)
 * @max_size: Maximum size filter (optional)
 * @status: Status filter (optional)
 * @priority: Priority filter (optional)
 */
struct hinata_packet_filter {
    enum hinata_packet_type type;
    const char *source;
    const char *tag;
    u64 created_after;
    u64 created_before;
    size_t min_size;
    size_t max_size;
    enum hinata_packet_status status;
    enum hinata_packet_priority priority;
};

/**
 * struct hinata_packet_iterator - Packet iteration context
 * @current: Current packet
 * @filter: Filter criteria
 * @position: Current position
 * @total: Total matching packets
 * @private_data: Private iterator data
 */
struct hinata_packet_iterator {
    struct hinata_packet *current;
    struct hinata_packet_filter *filter;
    size_t position;
    size_t total;
    void *private_data;
};

/* Packet flags */
#define HINATA_PACKET_FLAG_COMPRESSED   (1 << 0)  /* Content is compressed */
#define HINATA_PACKET_FLAG_ENCRYPTED    (1 << 1)  /* Content is encrypted */
#define HINATA_PACKET_FLAG_READONLY     (1 << 2)  /* Packet is read-only */
#define HINATA_PACKET_FLAG_TEMPORARY    (1 << 3)  /* Temporary packet */
#define HINATA_PACKET_FLAG_INDEXED      (1 << 4)  /* Packet is indexed */
#define HINATA_PACKET_FLAG_DIRTY        (1 << 5)  /* Packet needs sync */
#define HINATA_PACKET_FLAG_CACHED       (1 << 6)  /* Packet is cached */
#define HINATA_PACKET_FLAG_PINNED       (1 << 7)  /* Packet is pinned in memory */

/* Function Declarations */

/* Core packet operations */
struct hinata_packet *hinata_packet_create(enum hinata_packet_type type,
                                         const void *content,
                                         size_t content_size,
                                         const void *metadata,
                                         size_t metadata_size,
                                         const char *source,
                                         const char **tags,
                                         size_t tag_count);

int hinata_packet_validate(const struct hinata_packet *packet);
void hinata_packet_destroy(struct hinata_packet *packet);
struct hinata_packet *hinata_packet_clone(const struct hinata_packet *original);

/* Reference counting */
struct hinata_packet *hinata_packet_get(struct hinata_packet *packet);
void hinata_packet_put(struct hinata_packet *packet);

/* Packet lookup */
struct hinata_packet *hinata_packet_find(const char *id);
struct hinata_packet *hinata_packet_find_by_hash(u32 content_hash);
int hinata_packet_exists(const char *id);

/* Packet modification */
int hinata_packet_update_content(struct hinata_packet *packet,
                               const void *content,
                               size_t content_size);
int hinata_packet_update_metadata(struct hinata_packet *packet,
                                const void *metadata,
                                size_t metadata_size);
int hinata_packet_add_tag(struct hinata_packet *packet, const char *tag);
int hinata_packet_remove_tag(struct hinata_packet *packet, const char *tag);
int hinata_packet_set_status(struct hinata_packet *packet,
                           enum hinata_packet_status status);
int hinata_packet_set_priority(struct hinata_packet *packet,
                             enum hinata_packet_priority priority);

/* Packet flags */
int hinata_packet_set_flag(struct hinata_packet *packet, u32 flag);
int hinata_packet_clear_flag(struct hinata_packet *packet, u32 flag);
bool hinata_packet_has_flag(const struct hinata_packet *packet, u32 flag);

/* Packet iteration */
struct hinata_packet_iterator *hinata_packet_iterator_create(
    const struct hinata_packet_filter *filter);
void hinata_packet_iterator_destroy(struct hinata_packet_iterator *iter);
struct hinata_packet *hinata_packet_iterator_next(struct hinata_packet_iterator *iter);
bool hinata_packet_iterator_has_next(const struct hinata_packet_iterator *iter);
void hinata_packet_iterator_reset(struct hinata_packet_iterator *iter);

/* Packet serialization */
int hinata_packet_serialize(const struct hinata_packet *packet,
                          void **buffer, size_t *buffer_size);
struct hinata_packet *hinata_packet_deserialize(const void *buffer,
                                              size_t buffer_size);

/* Packet compression */
int hinata_packet_compress(struct hinata_packet *packet);
int hinata_packet_decompress(struct hinata_packet *packet);

/* Packet encryption */
int hinata_packet_encrypt(struct hinata_packet *packet, const char *key);
int hinata_packet_decrypt(struct hinata_packet *packet, const char *key);

/* Packet validation helpers */
bool hinata_packet_is_valid_type(enum hinata_packet_type type);
bool hinata_packet_is_valid_priority(enum hinata_packet_priority priority);
bool hinata_packet_is_valid_status(enum hinata_packet_status status);
const char *hinata_packet_type_to_string(enum hinata_packet_type type);
const char *hinata_packet_priority_to_string(enum hinata_packet_priority priority);
const char *hinata_packet_status_to_string(enum hinata_packet_status status);

/* Statistics and monitoring */
int hinata_packet_get_statistics(struct hinata_packet_stats *stats);
void hinata_packet_reset_statistics(void);
size_t hinata_packet_get_memory_usage(void);
size_t hinata_packet_get_active_count(void);

/* Batch operations */
int hinata_packet_batch_create(struct hinata_packet **packets,
                             size_t count,
                             const struct hinata_packet_filter *filter);
int hinata_packet_batch_destroy(struct hinata_packet **packets, size_t count);
int hinata_packet_batch_validate(struct hinata_packet **packets, size_t count);

/* Cache management */
int hinata_packet_cache_add(struct hinata_packet *packet);
int hinata_packet_cache_remove(const char *id);
void hinata_packet_cache_clear(void);
size_t hinata_packet_cache_size(void);

/* Debug and diagnostics */
void hinata_packet_dump(const struct hinata_packet *packet);
void hinata_packet_dump_stats(void);
int hinata_packet_check_integrity(const struct hinata_packet *packet);

/* Subsystem initialization */
int hinata_packet_init(void);
void hinata_packet_exit(void);

/* Inline helper functions */

/**
 * hinata_packet_get_id - Get packet ID
 * @packet: Packet pointer
 * 
 * Returns: Packet ID string or NULL
 */
static inline const char *hinata_packet_get_id(const struct hinata_packet *packet)
{
    return packet ? packet->id : NULL;
}

/**
 * hinata_packet_get_type - Get packet type
 * @packet: Packet pointer
 * 
 * Returns: Packet type
 */
static inline enum hinata_packet_type hinata_packet_get_type(
    const struct hinata_packet *packet)
{
    return packet ? packet->type : HINATA_PACKET_TYPE_MAX;
}

/**
 * hinata_packet_get_size - Get packet size
 * @packet: Packet pointer
 * 
 * Returns: Packet size in bytes
 */
static inline size_t hinata_packet_get_size(const struct hinata_packet *packet)
{
    return packet ? packet->size : 0;
}

/**
 * hinata_packet_get_content_size - Get content size
 * @packet: Packet pointer
 * 
 * Returns: Content size in bytes
 */
static inline size_t hinata_packet_get_content_size(
    const struct hinata_packet *packet)
{
    return packet ? packet->content_size : 0;
}

/**
 * hinata_packet_get_content - Get packet content
 * @packet: Packet pointer
 * 
 * Returns: Pointer to content or NULL
 */
static inline const void *hinata_packet_get_content(
    const struct hinata_packet *packet)
{
    return packet ? packet->content : NULL;
}

/**
 * hinata_packet_get_metadata - Get packet metadata
 * @packet: Packet pointer
 * 
 * Returns: Pointer to metadata or NULL
 */
static inline const void *hinata_packet_get_metadata(
    const struct hinata_packet *packet)
{
    return packet ? packet->metadata : NULL;
}

/**
 * hinata_packet_get_source - Get packet source
 * @packet: Packet pointer
 * 
 * Returns: Source string or NULL
 */
static inline const char *hinata_packet_get_source(
    const struct hinata_packet *packet)
{
    return packet ? packet->source : NULL;
}

/**
 * hinata_packet_get_created_at - Get creation timestamp
 * @packet: Packet pointer
 * 
 * Returns: Creation timestamp in nanoseconds
 */
static inline u64 hinata_packet_get_created_at(const struct hinata_packet *packet)
{
    return packet ? packet->created_at : 0;
}

/**
 * hinata_packet_get_updated_at - Get update timestamp
 * @packet: Packet pointer
 * 
 * Returns: Update timestamp in nanoseconds
 */
static inline u64 hinata_packet_get_updated_at(const struct hinata_packet *packet)
{
    return packet ? packet->updated_at : 0;
}

/**
 * hinata_packet_get_ref_count - Get reference count
 * @packet: Packet pointer
 * 
 * Returns: Current reference count
 */
static inline int hinata_packet_get_ref_count(const struct hinata_packet *packet)
{
    return packet ? atomic_read(&packet->ref_count) : 0;
}

/**
 * hinata_packet_is_empty - Check if packet is empty
 * @packet: Packet pointer
 * 
 * Returns: true if packet is empty, false otherwise
 */
static inline bool hinata_packet_is_empty(const struct hinata_packet *packet)
{
    return !packet || !packet->content || packet->content_size == 0;
}

/**
 * hinata_packet_has_metadata - Check if packet has metadata
 * @packet: Packet pointer
 * 
 * Returns: true if packet has metadata, false otherwise
 */
static inline bool hinata_packet_has_metadata(const struct hinata_packet *packet)
{
    return packet && packet->metadata && packet->metadata_size > 0;
}

/**
 * hinata_packet_has_tags - Check if packet has tags
 * @packet: Packet pointer
 * 
 * Returns: true if packet has tags, false otherwise
 */
static inline bool hinata_packet_has_tags(const struct hinata_packet *packet)
{
    return packet && packet->tag_count > 0;
}

#endif /* _HINATA_PACKET_H */
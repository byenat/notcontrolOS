/*
 * HiNATA Validation System - Header File
 * Part of notcontrolOS Knowledge Management System
 * 
 * This header defines validation structures, types, and function declarations
 * for the HiNATA knowledge system at the kernel level.
 */

#ifndef _HINATA_VALIDATION_H
#define _HINATA_VALIDATION_H

#include <linux/types.h>
#include "hinata_packet.h"

/* Validation flags */
#define HINATA_VALIDATE_BASIC           (1 << 0)   /* Basic structure validation */
#define HINATA_VALIDATE_CONTENT         (1 << 1)   /* Content validation */
#define HINATA_VALIDATE_METADATA        (1 << 2)   /* Metadata validation */
#define HINATA_VALIDATE_SECURITY        (1 << 3)   /* Security validation */
#define HINATA_VALIDATE_INTEGRITY       (1 << 4)   /* Integrity validation */
#define HINATA_VALIDATE_FORCE_RECHECK   (1 << 5)   /* Force revalidation */
#define HINATA_VALIDATE_DEEP            (1 << 6)   /* Deep validation */
#define HINATA_VALIDATE_STRICT          (1 << 7)   /* Strict validation */

/* Validation levels */
#define HINATA_VALIDATE_MINIMAL         (HINATA_VALIDATE_BASIC)
#define HINATA_VALIDATE_STANDARD        (HINATA_VALIDATE_BASIC | \
                                        HINATA_VALIDATE_CONTENT | \
                                        HINATA_VALIDATE_INTEGRITY)
#define HINATA_VALIDATE_COMPREHENSIVE   (HINATA_VALIDATE_BASIC | \
                                        HINATA_VALIDATE_CONTENT | \
                                        HINATA_VALIDATE_METADATA | \
                                        HINATA_VALIDATE_SECURITY | \
                                        HINATA_VALIDATE_INTEGRITY)
#define HINATA_VALIDATE_PARANOID        (HINATA_VALIDATE_COMPREHENSIVE | \
                                        HINATA_VALIDATE_DEEP | \
                                        HINATA_VALIDATE_STRICT | \
                                        HINATA_VALIDATE_FORCE_RECHECK)

/**
 * enum hinata_validation_result - Validation result codes
 * @HINATA_VALIDATION_SUCCESS: Validation successful
 * @HINATA_VALIDATION_FAILED: Validation failed
 * @HINATA_VALIDATION_PARTIAL: Partial validation (some checks failed)
 * @HINATA_VALIDATION_SKIPPED: Validation skipped
 * @HINATA_VALIDATION_ERROR: Validation error
 */
enum hinata_validation_result {
    HINATA_VALIDATION_SUCCESS = 0,
    HINATA_VALIDATION_FAILED = -1,
    HINATA_VALIDATION_PARTIAL = -2,
    HINATA_VALIDATION_SKIPPED = -3,
    HINATA_VALIDATION_ERROR = -4
};

/**
 * enum hinata_validation_error_type - Validation error types
 * @HINATA_VALIDATION_ERROR_NONE: No error
 * @HINATA_VALIDATION_ERROR_STRUCTURE: Structure validation error
 * @HINATA_VALIDATION_ERROR_CONTENT: Content validation error
 * @HINATA_VALIDATION_ERROR_METADATA: Metadata validation error
 * @HINATA_VALIDATION_ERROR_SECURITY: Security validation error
 * @HINATA_VALIDATION_ERROR_INTEGRITY: Integrity validation error
 * @HINATA_VALIDATION_ERROR_UUID: UUID validation error
 * @HINATA_VALIDATION_ERROR_TIMESTAMP: Timestamp validation error
 * @HINATA_VALIDATION_ERROR_SIZE: Size validation error
 * @HINATA_VALIDATION_ERROR_TYPE: Type validation error
 * @HINATA_VALIDATION_ERROR_HASH: Hash validation error
 */
enum hinata_validation_error_type {
    HINATA_VALIDATION_ERROR_NONE = 0,
    HINATA_VALIDATION_ERROR_STRUCTURE,
    HINATA_VALIDATION_ERROR_CONTENT,
    HINATA_VALIDATION_ERROR_METADATA,
    HINATA_VALIDATION_ERROR_SECURITY,
    HINATA_VALIDATION_ERROR_INTEGRITY,
    HINATA_VALIDATION_ERROR_UUID,
    HINATA_VALIDATION_ERROR_TIMESTAMP,
    HINATA_VALIDATION_ERROR_SIZE,
    HINATA_VALIDATION_ERROR_TYPE,
    HINATA_VALIDATION_ERROR_HASH
};

/**
 * struct hinata_validation_error - Validation error information
 * @type: Error type
 * @code: Error code
 * @message: Error message
 * @field: Field that caused the error
 * @offset: Offset in data where error occurred
 * @expected: Expected value (if applicable)
 * @actual: Actual value (if applicable)
 */
struct hinata_validation_error {
    enum hinata_validation_error_type type;
    int code;
    char message[256];
    char field[64];
    size_t offset;
    u64 expected;
    u64 actual;
};

/**
 * struct hinata_validation_context - Validation context
 * @flags: Validation flags
 * @level: Validation level
 * @max_errors: Maximum number of errors to collect
 * @error_count: Number of errors found
 * @errors: Array of validation errors
 * @start_time: Validation start time
 * @end_time: Validation end time
 * @private_data: Private validation data
 */
struct hinata_validation_context {
    u32 flags;
    u32 level;
    size_t max_errors;
    size_t error_count;
    struct hinata_validation_error *errors;
    u64 start_time;
    u64 end_time;
    void *private_data;
};

/**
 * struct hinata_validation_stats - Validation statistics
 * @total_validations: Total number of validations performed
 * @successful_validations: Number of successful validations
 * @failed_validations: Number of failed validations
 * @uuid_validations: Number of UUID validations
 * @content_validations: Number of content validations
 * @metadata_validations: Number of metadata validations
 * @security_validations: Number of security validations
 * @integrity_validations: Number of integrity validations
 * @cache_hits: Number of validation cache hits
 * @cache_misses: Number of validation cache misses
 * @average_validation_time: Average validation time in nanoseconds
 * @success_rate: Success rate percentage
 * @last_validation_time: Last validation timestamp
 */
struct hinata_validation_stats {
    u64 total_validations;
    u64 successful_validations;
    u64 failed_validations;
    u64 uuid_validations;
    u64 content_validations;
    u64 metadata_validations;
    u64 security_validations;
    u64 integrity_validations;
    u64 cache_hits;
    u64 cache_misses;
    u64 average_validation_time;
    u32 success_rate;
    u64 last_validation_time;
};

/**
 * struct hinata_validation_rule - Validation rule definition
 * @name: Rule name
 * @description: Rule description
 * @type: Rule type
 * @flags: Rule flags
 * @priority: Rule priority
 * @enabled: Whether rule is enabled
 * @validate_func: Validation function pointer
 * @private_data: Private rule data
 */
struct hinata_validation_rule {
    char name[64];
    char description[256];
    enum hinata_validation_error_type type;
    u32 flags;
    u32 priority;
    bool enabled;
    int (*validate_func)(const struct hinata_packet *packet,
                        struct hinata_validation_context *ctx);
    void *private_data;
};

/**
 * struct hinata_validation_profile - Validation profile
 * @name: Profile name
 * @description: Profile description
 * @flags: Default validation flags
 * @rule_count: Number of rules
 * @rules: Array of validation rules
 * @timeout: Validation timeout in milliseconds
 * @max_errors: Maximum errors to collect
 */
struct hinata_validation_profile {
    char name[64];
    char description[256];
    u32 flags;
    size_t rule_count;
    struct hinata_validation_rule *rules;
    u32 timeout;
    size_t max_errors;
};

/* Function Declarations */

/* Core validation functions */
int hinata_validate_packet_full(const struct hinata_packet *packet, u32 flags);
int hinata_validate_packet_structure(const struct hinata_packet *packet);
int hinata_validate_packet_content(const struct hinata_packet *packet);
int hinata_validate_packet_metadata(const struct hinata_packet *packet);
int hinata_validate_packet_security(const struct hinata_packet *packet);
int hinata_validate_packet_integrity(const struct hinata_packet *packet);

/* Validation with context */
int hinata_validate_packet_with_context(const struct hinata_packet *packet,
                                      struct hinata_validation_context *ctx);
struct hinata_validation_context *hinata_validation_context_create(u32 flags);
void hinata_validation_context_destroy(struct hinata_validation_context *ctx);
void hinata_validation_context_reset(struct hinata_validation_context *ctx);

/* UUID validation */
bool hinata_validate_uuid(const char *uuid);
bool hinata_validate_uuid_format(const char *uuid);
bool hinata_validate_uuid_version(const char *uuid, int version);

/* Content validation */
bool hinata_validate_content_hash(const void *content, size_t size, u32 expected_hash);
int hinata_validate_content_type(const void *content, size_t size,
                               enum hinata_packet_type type);
int hinata_validate_content_encoding(const void *content, size_t size,
                                   const char *encoding);

/* Metadata validation */
int hinata_validate_metadata_format(const void *metadata, size_t size);
int hinata_validate_metadata_schema(const void *metadata, size_t size,
                                  const char *schema);

/* Security validation */
int hinata_validate_packet_permissions(const struct hinata_packet *packet,
                                     u32 required_permissions);
int hinata_validate_packet_signature(const struct hinata_packet *packet,
                                   const char *public_key);
int hinata_validate_packet_encryption(const struct hinata_packet *packet);

/* Batch validation */
int hinata_validate_packet_batch(struct hinata_packet **packets,
                               size_t count, u32 flags);
int hinata_validate_packet_array(const struct hinata_packet *packets,
                               size_t count, u32 flags,
                               int *results);

/* Validation rules */
int hinata_validation_rule_register(const struct hinata_validation_rule *rule);
int hinata_validation_rule_unregister(const char *name);
struct hinata_validation_rule *hinata_validation_rule_find(const char *name);
int hinata_validation_rule_enable(const char *name);
int hinata_validation_rule_disable(const char *name);

/* Validation profiles */
int hinata_validation_profile_register(const struct hinata_validation_profile *profile);
int hinata_validation_profile_unregister(const char *name);
struct hinata_validation_profile *hinata_validation_profile_find(const char *name);
int hinata_validation_profile_apply(const char *name,
                                  const struct hinata_packet *packet);

/* Statistics and monitoring */
int hinata_get_validation_statistics(struct hinata_validation_stats *stats);
void hinata_reset_validation_statistics(void);
u64 hinata_get_validation_count(void);
u64 hinata_get_validation_success_rate(void);

/* Error handling */
const char *hinata_validation_error_to_string(enum hinata_validation_error_type type);
void hinata_validation_error_print(const struct hinata_validation_error *error);
void hinata_validation_context_print_errors(const struct hinata_validation_context *ctx);

/* Cache management */
int hinata_validation_cache_clear(void);
size_t hinata_validation_cache_size(void);
int hinata_validation_cache_set_size(size_t size);
u64 hinata_validation_cache_hit_rate(void);

/* Configuration */
int hinata_validation_set_timeout(u32 timeout_ms);
u32 hinata_validation_get_timeout(void);
int hinata_validation_set_max_errors(size_t max_errors);
size_t hinata_validation_get_max_errors(void);

/* Debug and diagnostics */
void hinata_validation_dump_stats(void);
void hinata_validation_dump_rules(void);
void hinata_validation_dump_profiles(void);
int hinata_validation_self_test(void);

/* Subsystem initialization */
int hinata_validation_init(void);
void hinata_validation_exit(void);

/* Inline helper functions */

/**
 * hinata_validation_is_success - Check if validation was successful
 * @result: Validation result
 * 
 * Returns: true if successful, false otherwise
 */
static inline bool hinata_validation_is_success(int result)
{
    return result == HINATA_VALIDATION_SUCCESS;
}

/**
 * hinata_validation_is_error - Check if validation had an error
 * @result: Validation result
 * 
 * Returns: true if error, false otherwise
 */
static inline bool hinata_validation_is_error(int result)
{
    return result < HINATA_VALIDATION_SUCCESS;
}

/**
 * hinata_validation_has_flag - Check if validation context has flag
 * @ctx: Validation context
 * @flag: Flag to check
 * 
 * Returns: true if flag is set, false otherwise
 */
static inline bool hinata_validation_has_flag(const struct hinata_validation_context *ctx,
                                            u32 flag)
{
    return ctx && (ctx->flags & flag) != 0;
}

/**
 * hinata_validation_set_flag - Set validation flag
 * @ctx: Validation context
 * @flag: Flag to set
 */
static inline void hinata_validation_set_flag(struct hinata_validation_context *ctx,
                                            u32 flag)
{
    if (ctx)
        ctx->flags |= flag;
}

/**
 * hinata_validation_clear_flag - Clear validation flag
 * @ctx: Validation context
 * @flag: Flag to clear
 */
static inline void hinata_validation_clear_flag(struct hinata_validation_context *ctx,
                                              u32 flag)
{
    if (ctx)
        ctx->flags &= ~flag;
}

/**
 * hinata_validation_get_duration - Get validation duration
 * @ctx: Validation context
 * 
 * Returns: Validation duration in nanoseconds
 */
static inline u64 hinata_validation_get_duration(const struct hinata_validation_context *ctx)
{
    return ctx ? (ctx->end_time - ctx->start_time) : 0;
}

/**
 * hinata_validation_has_errors - Check if validation context has errors
 * @ctx: Validation context
 * 
 * Returns: true if has errors, false otherwise
 */
static inline bool hinata_validation_has_errors(const struct hinata_validation_context *ctx)
{
    return ctx && ctx->error_count > 0;
}

/**
 * hinata_validation_get_error_count - Get number of validation errors
 * @ctx: Validation context
 * 
 * Returns: Number of errors
 */
static inline size_t hinata_validation_get_error_count(
    const struct hinata_validation_context *ctx)
{
    return ctx ? ctx->error_count : 0;
}

/**
 * hinata_validation_is_timeout - Check if validation timed out
 * @ctx: Validation context
 * @timeout_ns: Timeout in nanoseconds
 * 
 * Returns: true if timed out, false otherwise
 */
static inline bool hinata_validation_is_timeout(const struct hinata_validation_context *ctx,
                                              u64 timeout_ns)
{
    return ctx && hinata_validation_get_duration(ctx) > timeout_ns;
}

/**
 * hinata_validation_quick_check - Quick validation check
 * @packet: Packet to validate
 * 
 * Returns: 0 if valid, negative error code otherwise
 */
static inline int hinata_validation_quick_check(const struct hinata_packet *packet)
{
    return hinata_validate_packet_full(packet, HINATA_VALIDATE_MINIMAL);
}

/**
 * hinata_validation_standard_check - Standard validation check
 * @packet: Packet to validate
 * 
 * Returns: 0 if valid, negative error code otherwise
 */
static inline int hinata_validation_standard_check(const struct hinata_packet *packet)
{
    return hinata_validate_packet_full(packet, HINATA_VALIDATE_STANDARD);
}

/**
 * hinata_validation_comprehensive_check - Comprehensive validation check
 * @packet: Packet to validate
 * 
 * Returns: 0 if valid, negative error code otherwise
 */
static inline int hinata_validation_comprehensive_check(const struct hinata_packet *packet)
{
    return hinata_validate_packet_full(packet, HINATA_VALIDATE_COMPREHENSIVE);
}

#endif /* _HINATA_VALIDATION_H */
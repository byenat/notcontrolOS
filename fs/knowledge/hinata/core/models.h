/**
 * HiNATA 核心数据结构 - C 语言定义
 * 
 * 这个文件定义了 HiNATA 数据结构在 notcontrolOS 内核中的 C 语言表示，
 * 用于高性能的内核级数据处理和存储。
 */

#ifndef _HINATA_MODELS_H
#define _HINATA_MODELS_H

#include <stdint.h>
#include <stdbool.h>
#include <time.h>

// ============================================================================
// 基础类型定义
// ============================================================================

#define HINATA_UUID_LEN 37          // UUID 字符串长度（包含 null 终止符）
#define HINATA_MAX_HIGHLIGHT_LEN 1000
#define HINATA_MAX_NOTE_LEN 10000
#define HINATA_MAX_AT_LEN 2048
#define HINATA_MAX_TAG_LEN 50
#define HINATA_MAX_TAGS 20
#define HINATA_MAX_USERNAME_LEN 50
#define HINATA_MAX_EMAIL_LEN 100
#define HINATA_MAX_FILENAME_LEN 255

/**
 * UUID 类型
 */
typedef char hinata_uuid_t[HINATA_UUID_LEN];

/**
 * 时间戳类型（Unix 时间戳）
 */
typedef int64_t hinata_timestamp_t;

/**
 * 访问控制级别
 */
typedef enum {
    HINATA_ACCESS_PRIVATE = 0,
    HINATA_ACCESS_MODEL_READABLE = 1,
    HINATA_ACCESS_SHARED = 2,
    HINATA_ACCESS_WEB3_PUBLISHED = 3
} hinata_access_level_t;

/**
 * 内容格式类型
 */
typedef enum {
    HINATA_FORMAT_PLAIN_TEXT = 0,
    HINATA_FORMAT_MARKDOWN = 1,
    HINATA_FORMAT_HTML = 2,
    HINATA_FORMAT_JSON = 3,
    HINATA_FORMAT_IMAGE = 4,
    HINATA_FORMAT_AUDIO = 5,
    HINATA_FORMAT_VIDEO = 6
} hinata_content_format_t;

/**
 * 引用关系类型
 */
typedef enum {
    HINATA_REF_STRONG = 0,
    HINATA_REF_WEAK = 1,
    HINATA_REF_HIERARCHICAL = 2,
    HINATA_REF_SEMANTIC = 3
} hinata_reference_type_t;

/**
 * 捕获源类型
 */
typedef enum {
    HINATA_CAPTURE_WEB_CLIPPER = 0,
    HINATA_CAPTURE_IOS_SHARE = 1,
    HINATA_CAPTURE_ANDROID_SHARE = 2,
    HINATA_CAPTURE_SCREENSHOT_OCR = 3,
    HINATA_CAPTURE_MANUAL_INPUT = 4,
    HINATA_CAPTURE_WECHAT_FORWARDER = 5,
    HINATA_CAPTURE_API_INGEST = 6
} hinata_capture_source_t;

/**
 * 用户行为类型
 */
typedef enum {
    HINATA_ACTION_QUICK_SAVE = 0,
    HINATA_ACTION_DETAILED_EDIT = 1,
    HINATA_ACTION_HIGHLIGHT = 2,
    HINATA_ACTION_BOOKMARK = 3,
    HINATA_ACTION_SHARE = 4
} hinata_user_action_t;

/**
 * 订阅级别
 */
typedef enum {
    HINATA_SUBSCRIPTION_FREE = 0,
    HINATA_SUBSCRIPTION_PREMIUM = 1,
    HINATA_SUBSCRIPTION_ENTERPRISE = 2
} hinata_subscription_level_t;

// ============================================================================
// HiNATA 核心数据结构
// ============================================================================

/**
 * HiNATA 核心结构
 */
typedef struct {
    char highlight[HINATA_MAX_HIGHLIGHT_LEN];
    char note[HINATA_MAX_NOTE_LEN];
    char at[HINATA_MAX_AT_LEN];
    char tags[HINATA_MAX_TAGS][HINATA_MAX_TAG_LEN];
    uint8_t tag_count;
    hinata_access_level_t access;
} hinata_core_t;

/**
 * 位置信息
 */
typedef struct {
    uint32_t start_offset;
    uint32_t end_offset;
    uint32_t line_number;
    uint32_t column_number;
    char xpath[512];
    bool has_position;
} hinata_position_info_t;

/**
 * 设备上下文
 */
typedef struct {
    hinata_uuid_t device_id;
    char os_version[64];
    char app_version[32];
    char user_agent[512];
    char screen_resolution[32];
    char timezone[64];
} hinata_device_context_t;

/**
 * 用户偏好设置
 */
typedef struct {
    char language[8];
    char timezone[64];
    hinata_access_level_t default_access_level;
    bool auto_tagging;
    bool semantic_linking;
} hinata_user_preferences_t;

/**
 * 安全设置
 */
typedef struct {
    bool two_factor_enabled;
    bool encryption_enabled;
    uint32_t data_retention_days;
} hinata_security_settings_t;

/**
 * 用户信息
 */
typedef struct {
    hinata_uuid_t id;
    char username[HINATA_MAX_USERNAME_LEN];
    char email[HINATA_MAX_EMAIL_LEN];
    hinata_user_preferences_t preferences;
    hinata_subscription_level_t subscription;
    hinata_security_settings_t security;
    hinata_timestamp_t created_at;
    hinata_timestamp_t updated_at;
} hinata_user_t;

/**
 * 信息物料 (LibraryItem)
 */
typedef struct {
    hinata_uuid_t id;
    hinata_uuid_t user_id;
    
    // HiNATA 核心结构
    hinata_core_t core;
    
    // 元数据
    char title[HINATA_MAX_HIGHLIGHT_LEN];
    hinata_content_format_t content_format;
    uint32_t content_size;
    float reading_progress;
    
    // 时间戳
    hinata_timestamp_t created_at;
    hinata_timestamp_t updated_at;
    hinata_timestamp_t last_accessed_at;
    
    // 统计信息
    uint32_t view_count;
    uint32_t edit_count;
    
    // 关联关系
    hinata_uuid_t knowledge_blocks[100]; // 最多100个知识块
    uint8_t knowledge_block_count;
    hinata_uuid_t parent_item;
    hinata_uuid_t child_items[50]; // 最多50个子项
    uint8_t child_item_count;
    bool has_parent;
} hinata_library_item_t;

/**
 * 笔记项 (NoteItem)
 */
typedef struct {
    hinata_uuid_t id;
    hinata_uuid_t knowledge_block_id;
    char content[HINATA_MAX_NOTE_LEN];
    hinata_content_format_t content_format;
    uint8_t order;
    hinata_timestamp_t created_at;
    hinata_timestamp_t updated_at;
} hinata_note_item_t;

/**
 * 知识块 (KnowledgeBlock)
 */
typedef struct {
    hinata_uuid_t id;
    hinata_uuid_t user_id;
    hinata_uuid_t library_item_id;
    
    // HiNATA 核心结构
    hinata_core_t core;
    
    // 位置信息
    hinata_position_info_t position;
    
    // 笔记项集合
    hinata_note_item_t note_items[20]; // 最多20个笔记项
    uint8_t note_item_count;
    
    // 时间戳
    hinata_timestamp_t created_at;
    hinata_timestamp_t updated_at;
    
    // 关联关系
    hinata_uuid_t references[50]; // 最多50个引用
    uint8_t reference_count;
    hinata_uuid_t backlinks[100]; // 最多100个反向链接
    uint8_t backlink_count;
} hinata_knowledge_block_t;

/**
 * 标签 (Tag)
 */
typedef struct {
    hinata_uuid_t id;
    char name[HINATA_MAX_TAG_LEN];
    char normalized_name[HINATA_MAX_TAG_LEN];
    hinata_uuid_t user_id; // 空字符串表示系统标签
    char description[256];
    char color[8]; // 十六进制颜色代码
    uint32_t usage_count;
    hinata_timestamp_t created_at;
    hinata_timestamp_t updated_at;
    bool is_system_tag;
} hinata_tag_t;

/**
 * 知识块引用 (KnowledgeBlockReference)
 */
typedef struct {
    hinata_uuid_t id;
    hinata_uuid_t source_block_id;
    hinata_uuid_t source_note_item_id;
    hinata_uuid_t target_block_id;
    hinata_reference_type_t reference_type;
    char context[512];
    hinata_timestamp_t created_at;
    bool has_source_note_item;
} hinata_knowledge_block_reference_t;

/**
 * 附件信息
 */
typedef struct {
    hinata_uuid_t id;
    char filename[HINATA_MAX_FILENAME_LEN];
    char mime_type[64];
    uint64_t size;
    char url[2048];
    char local_path[1024];
    char checksum[65]; // SHA-256 哈希值
    bool has_url;
    bool has_local_path;
} hinata_attachment_t;

/**
 * HiNATA 数据包元数据
 */
typedef struct {
    hinata_uuid_t packet_id;
    hinata_capture_source_t capture_source;
    hinata_timestamp_t capture_timestamp;
    hinata_user_action_t user_action;
    hinata_device_context_t device_context;
    uint8_t attention_score_raw;
    char processing_flags[10][32]; // 最多10个处理标志
    uint8_t processing_flag_count;
} hinata_packet_metadata_t;

/**
 * HiNATA 数据包载荷
 */
typedef struct {
    hinata_core_t core;
    hinata_content_format_t content_format;
    hinata_attachment_t attachments[5]; // 最多5个附件
    uint8_t attachment_count;
    char metadata_json[2048]; // 额外的元数据（JSON 格式）
    bool has_metadata_json;
} hinata_packet_payload_t;

/**
 * HiNATA 数据包
 */
typedef struct {
    hinata_packet_metadata_t metadata;
    hinata_packet_payload_t payload;
} hinata_data_packet_t;

// ============================================================================
// 查询和搜索相关结构
// ============================================================================

/**
 * 日期范围
 */
typedef struct {
    hinata_timestamp_t start;
    hinata_timestamp_t end;
    bool has_start;
    bool has_end;
} hinata_date_range_t;

/**
 * 搜索过滤器
 */
typedef struct {
    hinata_uuid_t user_id;
    char tags[HINATA_MAX_TAGS][HINATA_MAX_TAG_LEN];
    uint8_t tag_count;
    hinata_access_level_t access_levels[4];
    uint8_t access_level_count;
    hinata_content_format_t content_formats[7];
    uint8_t content_format_count;
    hinata_date_range_t date_range;
    bool has_attachments;
    bool has_user_id;
} hinata_search_filters_t;

/**
 * 排序选项
 */
typedef enum {
    HINATA_SORT_CREATED_AT = 0,
    HINATA_SORT_UPDATED_AT = 1,
    HINATA_SORT_ACCESSED_AT = 2,
    HINATA_SORT_RELEVANCE = 3,
    HINATA_SORT_ATTENTION_SCORE = 4
} hinata_sort_field_t;

typedef enum {
    HINATA_SORT_ASC = 0,
    HINATA_SORT_DESC = 1
} hinata_sort_direction_t;

typedef struct {
    hinata_sort_field_t field;
    hinata_sort_direction_t direction;
} hinata_sort_options_t;

/**
 * 分页选项
 */
typedef struct {
    uint32_t page;
    uint32_t limit;
    uint32_t offset;
} hinata_pagination_options_t;

/**
 * 搜索查询
 */
typedef struct {
    char query[1024];
    hinata_search_filters_t filters;
    hinata_sort_options_t sort;
    hinata_pagination_options_t pagination;
    bool has_filters;
    bool has_sort;
} hinata_search_query_t;

/**
 * 搜索结果项
 */
typedef struct {
    enum {
        HINATA_RESULT_LIBRARY_ITEM = 0,
        HINATA_RESULT_KNOWLEDGE_BLOCK = 1
    } type;
    union {
        hinata_library_item_t library_item;
        hinata_knowledge_block_t knowledge_block;
    } data;
    float relevance_score;
} hinata_search_result_item_t;

/**
 * 搜索结果
 */
typedef struct {
    hinata_search_result_item_t items[100]; // 最多100个结果
    uint32_t item_count;
    uint32_t total;
    uint32_t page;
    uint32_t limit;
    bool has_more;
} hinata_search_result_t;

// ============================================================================
// 批量操作相关结构
// ============================================================================

/**
 * 批量操作类型
 */
typedef enum {
    HINATA_BATCH_CREATE = 0,
    HINATA_BATCH_UPDATE = 1,
    HINATA_BATCH_DELETE = 2
} hinata_batch_operation_type_t;

/**
 * 批量操作目标
 */
typedef enum {
    HINATA_BATCH_TARGET_LIBRARY_ITEM = 0,
    HINATA_BATCH_TARGET_KNOWLEDGE_BLOCK = 1,
    HINATA_BATCH_TARGET_TAG = 2
} hinata_batch_target_t;

/**
 * 批量操作
 */
typedef struct {
    hinata_batch_operation_type_t type;
    hinata_batch_target_t target;
    hinata_uuid_t id;
    char data_json[4096]; // JSON 格式的数据
    bool has_id;
} hinata_batch_operation_t;

/**
 * 批量操作结果
 */
typedef struct {
    hinata_batch_operation_t operation;
    bool success;
    char result_json[2048];
    char error_message[512];
    char error_code[32];
    bool has_result;
    bool has_error;
} hinata_batch_operation_result_t;

/**
 * 批量结果
 */
typedef struct {
    bool success;
    hinata_batch_operation_result_t results[50]; // 最多50个操作
    uint8_t result_count;
    uint8_t error_count;
} hinata_batch_result_t;

// ============================================================================
// 内存管理和工具函数声明
// ============================================================================

/**
 * 初始化 HiNATA 数据结构
 */
void hinata_init_core(hinata_core_t *core);
void hinata_init_library_item(hinata_library_item_t *item);
void hinata_init_knowledge_block(hinata_knowledge_block_t *block);
void hinata_init_tag(hinata_tag_t *tag);
void hinata_init_data_packet(hinata_data_packet_t *packet);

/**
 * 清理 HiNATA 数据结构
 */
void hinata_cleanup_library_item(hinata_library_item_t *item);
void hinata_cleanup_knowledge_block(hinata_knowledge_block_t *block);
void hinata_cleanup_search_result(hinata_search_result_t *result);

/**
 * UUID 工具函数
 */
void hinata_generate_uuid(hinata_uuid_t uuid);
bool hinata_is_valid_uuid(const char *uuid);
int hinata_compare_uuid(const hinata_uuid_t uuid1, const hinata_uuid_t uuid2);
void hinata_copy_uuid(hinata_uuid_t dest, const hinata_uuid_t src);
void hinata_clear_uuid(hinata_uuid_t uuid);

/**
 * 时间戳工具函数
 */
hinata_timestamp_t hinata_current_timestamp(void);
void hinata_timestamp_to_string(hinata_timestamp_t timestamp, char *buffer, size_t size);
hinata_timestamp_t hinata_string_to_timestamp(const char *str);

/**
 * 字符串工具函数
 */
void hinata_safe_strcpy(char *dest, const char *src, size_t dest_size);
void hinata_normalize_tag(const char *tag, char *normalized, size_t size);
bool hinata_is_valid_email(const char *email);

/**
 * 验证函数
 */
bool hinata_validate_core(const hinata_core_t *core);
bool hinata_validate_library_item(const hinata_library_item_t *item);
bool hinata_validate_knowledge_block(const hinata_knowledge_block_t *block);
bool hinata_validate_data_packet(const hinata_data_packet_t *packet);

#endif /* _HINATA_MODELS_H */
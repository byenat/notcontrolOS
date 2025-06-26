# notcontrolOS 文档格式规范

## 概述

notcontrolOS 文档格式规范定义了notcontrolOS操作系统中知识管理的标准数据格式。该规范支持多种输入格式，并提供统一的存储和处理标准。

## 设计目标

1. **通用兼容** - 支持主流知识管理工具的数据格式
2. **语义丰富** - 保留和增强文档的语义信息
3. **高效存储** - 优化的数据结构，支持快速检索
4. **AI友好** - 便于AI系统理解和处理

## 数据格式架构

```
输入格式: "Markdown" (通用输入)          → 解析和处理    →
输出格式: "JSON" (标准存储)              → 存储和索引    →
展示格式: "Enhanced Markdown" (渲染)     → 视图渲染      →
```

## 核心数据结构

### notcontrolOS JSON 标准格式

```json
{
  "meta": {
    "version": "1.0.0",
    "created": "2024-12-26T10:00:00Z",
    "modified": "2024-12-26T10:00:00Z",
    "id": "doc-uuid-here",
    "type": "knowledge_document"
  },
  "content": {
    "title": "文档标题",
    "summary": "文档摘要",
    "body": "主要内容",
    "tags": ["tag1", "tag2"],
    "categories": ["category1"],
    "links": [
      {
        "type": "internal",
        "target": "other-doc-id",
        "context": "引用上下文"
      }
    ]
  },
  "structure": {
    "sections": [
      {
        "id": "section-1",
        "title": "章节标题",
        "level": 1,
        "content": "章节内容",
        "subsections": []
      }
    ],
    "blocks": [
      {
        "id": "block-1",
        "type": "text",
        "content": "文本内容",
        "annotations": {
          "highlights": [
            {
              "text": "重要内容",
              "note": "批注信息",
              "type": "important"
            }
          ]
        }
      }
    ]
  },
  "metadata": {
    "source": {
      "type": "markdown",
      "path": "/path/to/file.md",
      "imported_at": "2024-12-26T10:00:00Z"
    },
    "processing": {
      "ai_enhanced": true,
      "semantic_tags": ["concept1", "concept2"],
      "knowledge_graph": {
        "entities": ["entity1", "entity2"],
        "relations": [
          {
            "subject": "entity1",
            "predicate": "relates_to",
            "object": "entity2"
          }
        ]
      }
    }
  }
}
```

## 标准 Markdown 语法支持

### 基础语法
基于 GitHub Flavored Markdown，支持标准的Markdown语法：

```markdown
# 标题

**粗体** 和 *斜体* 文本

- 列表项目
- 另一个项目

[链接文本](https://example.com)

`代码片段`

```代码块
代码内容
```

> 引用内容
```

### 扩展语法

#### 1. 知识链接
```markdown
[[知识点名称]] - 内部知识链接
[[知识点名称|显示文本]] - 带别名的链接
```

#### 2. 标签系统
```markdown
#标签名 - 简单标签
#分类/子标签 - 层级标签
```

#### 3. 注释和批注
```markdown
==高亮文本== - 重要内容高亮
==高亮文本== ^注释内容^ - 带注释的高亮
```

#### 4. 块引用
```markdown
> [!NOTE] 
> 这是一个信息块

> [!WARNING]
> 这是一个警告块
```

## 数据转换流程

### 输入处理

```typescript
interface DocumentProcessor {
  // 解析Markdown输入
  parseMarkdown(content: string): ParsedDocument;
  
  // 提取语义信息
  extractSemantics(doc: ParsedDocument): SemanticData;
  
  // 生成标准JSON
  generateJSON(doc: ParsedDocument, semantics: SemanticData): notcontrolOSDocument;
}
```

### 语义增强

```typescript
interface SemanticEnhancer {
  // AI自动补充标签
  autoTagging(content: string): string[];
  
  // 实体识别
  extractEntities(content: string): Entity[];
  
  // 关系识别
  extractRelations(entities: Entity[]): Relation[];
}
```

## 兼容性支持

### Logseq格式支持
- 块结构转换为notcontrolOS结构化内容
- 页面引用转换为内部链接
- 属性转换为元数据

### Obsidian格式支持
- 双链转换为notcontrolOS知识链接
- 标签系统映射
- 模板和插件数据保留

### 通用Markdown支持
- 标准Markdown语法完全兼容
- 自动语义增强
- 元数据提取

## 实现示例

### 转换器实现

```typescript
class notcontrolOSDocumentConverter {
  async convertMarkdownTonotcontrolOS(markdown: string): Promise<notcontrolOSDocument> {
    // 1. 解析Markdown
    const ast = this.parseMarkdown(markdown);
    
    // 2. 提取结构
    const structure = this.extractStructure(ast);
    
    // 3. 语义增强
    const semantics = await this.enhanceSemantics(structure);
    
    // 4. 生成notcontrolOS文档
    return this.generatenotcontrolOSDocument(structure, semantics);
  }
  
  async convertnotcontrolOSToMarkdown(doc: notcontrolOSDocument): Promise<string> {
    // 反向转换，支持编辑和导出
    return this.renderMarkdown(doc);
  }
}
```

### 查询接口

```typescript
interface DocumentQuery {
  // 基于内容搜索
  searchContent(query: string): Promise<notcontrolOSDocument[]>;
  
  // 基于标签搜索
  searchByTags(tags: string[]): Promise<notcontrolOSDocument[]>;
  
  // 语义搜索
  semanticSearch(query: string): Promise<notcontrolOSDocument[]>;
  
  // 关联文档查找
  findRelated(docId: string): Promise<notcontrolOSDocument[]>;
}
```

## 版本控制

### 格式版本
- 使用语义化版本号 (Semantic Versioning)
- 向后兼容的数据格式演进
- 迁移工具支持

### 文档版本
- 文档级别的版本控制
- 变更历史追踪
- 冲突解决机制

## 性能优化

### 存储优化
- JSON压缩存储
- 增量同步
- 索引优化

### 查询优化
- 全文搜索索引
- 语义向量索引
- 关系图索引

## API接口

### RESTful API

```typescript
// 文档CRUD操作
GET    /api/documents/{id}           // 获取文档
POST   /api/documents                // 创建文档
PUT    /api/documents/{id}           // 更新文档
DELETE /api/documents/{id}           // 删除文档

// 搜索和查询
GET    /api/search?q={query}         // 全文搜索
GET    /api/search/semantic?q={query} // 语义搜索
GET    /api/documents/{id}/related   // 关联文档

// 格式转换
POST   /api/convert/markdown-to-notcontrolos // Markdown转notcontrolOS
POST   /api/convert/notcontrolos-to-markdown // notcontrolOS转Markdown
```

## 安全和隐私

### 数据保护
- 端到端加密存储
- 访问权限控制
- 隐私标记支持

### 审计日志
- 文档访问记录
- 修改历史追踪
- 权限变更日志

## 扩展机制

### 插件支持
- 自定义解析器
- 语义增强插件
- 格式转换器

### 第三方集成
- 开放的数据格式
- 标准化API接口
- 迁移工具支持

## 测试和验证

### 兼容性测试
- 主流知识管理工具格式测试
- 大文件处理性能测试
- 并发访问压力测试

### 数据完整性
- 转换前后数据一致性验证
- 语义信息保留验证
- 链接关系完整性检查

---

**文档状态**: 正式规范 v1.0  
**维护**: notcontrolOS文档格式工作组  
**更新**: 2024年12月26日 
# notcontrolOS 通用知识管理框架

notcontrolOS通用知识管理框架为AI时代的个人操作系统提供了开放、可扩展的知识组织基础设施。该框架采用抽象接口设计，不绑定特定的知识组织模式，支持多种实现方式。

## 核心特性

### 🔧 抽象接口设计
- 标准化的知识管理接口 (`KnowledgeInterface.ts`)
- 支持多种知识组织方式的适配器模式
- 完全解耦的实现与接口分离

### 🌐 多模态支持
- 统一的内容格式抽象 (文本、图像、音频、视频)
- 灵活的附件和元数据管理
- 跨模态的关联关系建模

### 🔒 隐私优先
- 本地存储优先的架构设计
- 细粒度的访问控制机制
- 完全用户控制的数据主权

### 🔗 语义关联
- 灵活的关系类型定义
- 双向关联关系管理
- 支持复杂的知识图谱构建

## 架构设计

```
notcontrolOS Knowledge Framework:

┌─────────────────────────────────────────┐
│           Application Layer             │
│    (Knowledge Apps & Implementations)   │
├─────────────────────────────────────────┤
│           Interface Layer               │
│        (KnowledgeInterface.ts)          │
├─────────────────────────────────────────┤
│           Abstraction Layer             │
│    (Core Types & Base Classes)         │
├─────────────────────────────────────────┤
│           Storage Layer                 │
│    (File System & Vector DB)           │
└─────────────────────────────────────────┘
```

## 接口规范

### 核心接口

```typescript
interface KnowledgeManager {
  createItem(item: Partial<KnowledgeItem>): Promise<KnowledgeItem>;
  getItem(id: string): Promise<KnowledgeItem | null>;
  updateItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem>;
  deleteItem(id: string): Promise<void>;
  search(query: SearchQuery): Promise<SearchResult>;
  getRelated(id: string, options?: RelationOptions): Promise<KnowledgeItem[]>;
  batch(operations: BatchOperation[]): Promise<BatchResult>;
}
```

### 知识项模型

```typescript
interface KnowledgeItem {
  id: string;
  type: KnowledgeItemType;
  content: KnowledgeContent;
  metadata: KnowledgeMetadata;
  relations: KnowledgeRelation[];
  accessControl: AccessControl;
  timestamps: {
    created: Date;
    modified: Date;
    accessed?: Date;
  };
}
```

## 使用模式

### 基础使用

```typescript
import { KnowledgeFramework } from '@notcontrolos/knowledge-framework';

// 初始化框架
const framework = new KnowledgeFramework({
  storage: 'local',
  vectorDB: 'embedded',
  privacy: 'strict'
});

// 创建知识项
const item = await framework.createItem({
  type: KnowledgeItemType.DOCUMENT,
  content: {
    primary: "Context engineering is the art...",
    format: ContentFormat.MARKDOWN
  },
  metadata: {
    title: "Context Engineering Notes",
    tags: ["ai", "context", "engineering"]
  }
});

// 建立关联
await framework.addRelation(item.id, relatedItemId, {
  type: RelationType.REFERENCE,
  direction: 'bidirectional'
});
```

### 高级搜索

```typescript
// 语义搜索
const results = await framework.search({
  text: "context window management",
  types: [KnowledgeItemType.DOCUMENT],
  tags: ["ai"],
  timeRange: {
    from: new Date('2024-01-01'),
    to: new Date('2024-12-31')
  }
});

// 关联导航
const related = await framework.getRelated(itemId, {
  types: [RelationType.REFERENCE, RelationType.DERIVED_FROM],
  depth: 2,
  direction: 'both'
});
```

## 实现指南

### 自定义实现

1. **实现KnowledgeManager接口**
```typescript
class MyKnowledgeManager implements KnowledgeManager {
  async createItem(item: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    // 自定义实现逻辑
  }
  // ... 其他接口方法
}
```

2. **注册实现**
```typescript
KnowledgeFramework.registerImplementation('myimpl', MyKnowledgeManager);
```

### 迁移模式

框架支持多种迁移模式：

- **导入模式**: 将第三方数据导入notcontrolOS框架
- **映射模式**: 建立与现有系统的双向同步
- **代理模式**: 作为现有系统的抽象层

## 生态系统

### 官方实现

- `@notcontrolos/knowledge-local` - 本地文件系统实现
- `@notcontrolos/knowledge-vector` - 向量数据库实现
- `@notcontrolos/knowledge-hybrid` - 混合存储实现

### 社区实现

- 支持多种流行的知识管理工具
- 兼容标准的数据格式 (Markdown, JSON, XML)
- 集成主流的向量数据库

## 安装使用

### 安装

```bash
npm install @notcontrolos/knowledge-framework
```

### 快速开始

```typescript
import { KnowledgeFramework } from '@notcontrolos/knowledge-framework';

const framework = new KnowledgeFramework();
await framework.initialize();

// 开始使用框架
const item = await framework.createItem({
  content: { primary: "Hello, Knowledge!" }
});
```

## 贡献指南

我们欢迎社区贡献！请查看：

- [贡献指南](../../Documentation/dev-guide/CONTRIBUTING.md)
- [接口规范](./interfaces/KnowledgeInterface.ts)
- [实现示例](../../samples/knowledge/)

## 许可证

notcontrolOS通用知识管理框架采用MIT许可证，鼓励开源社区的广泛使用和贡献。

## 设计理念

**注意**: 此框架提供基础设施和抽象接口，具体的知识组织策略由各应用根据自身需求实现。notcontrolOS专注于提供稳定、高效、安全的基础能力平台。

---

**notcontrolOS Knowledge Framework** - *Make Knowledge Management Simple and Powerful* 🧠 
# HiNATA 数据结构 - notcontrolOS 核心存储架构

## 概述

HiNATA 数据结构是 notcontrolOS 的核心内容结构和存储架构，提供统一的知识管理框架。HiNATA 代表：
- **H**ighlight：突出内容/标题
- **i**：连接符
- **N**ote：笔记/正文内容
- **A**t：来源/引用信息
- **T**ag：分类/标签
- **A**ccess：权限控制

## 核心特性

### 🏗️ 统一数据模型
- 基于 HiNATA 结构的统一内容管理
- 支持多层级知识组织（Outliner 模式）
- 灵活的引用关系表达

### 📦 标准化数据包
- HiNATA 数据包作为信息流动的原子单元
- 统一的 metadata 和 payload 结构
- 便于 notcontrolOS 自动化处理和索引

### 🔗 语义关联
- 知识块之间的引用关系
- 支持强关联和弱关联引用
- 自动建立知识图谱

### 🏷️ 智能标签系统
- 用户标签和系统标签
- 标签自动解析和标准化
- 标签使用统计和推荐

### 🔐 细粒度权限控制
- 私有级别 (PRIVATE)
- 模型可读级别 (MODEL_READABLE)
- 共享级别 (SHARED)

## 架构集成

```
notcontrolOS + HiNATA 架构:

┌─────────────────────────────────────────┐
│           Applications                  │
│    (ZentaN Clients & Third-party)      │
├─────────────────────────────────────────┤
│           HiNATA API Layer              │
│    (Data Packet Ingestion & Query)     │
├─────────────────────────────────────────┤
│         HiNATA Core Engine              │
│  (Knowledge Management & Processing)    │
├─────────────────────────────────────────┤
│         HiNATA Storage Layer            │
│    (Knowledge FS & Vector Storage)      │
├─────────────────────────────────────────┤
│           notcontrolOS Kernel           │
│    (Context Management & AI Engine)     │
└─────────────────────────────────────────┘
```

## 目录结构

```
hinata/
├── core/                    # 核心数据结构定义
│   ├── types.ts             # TypeScript 类型定义
│   ├── models.h             # C 结构体定义
│   ├── packet.ts            # HiNATA 数据包规格
│   └── validation.ts        # 数据验证规则
├── storage/                 # 存储层实现
│   ├── knowledge_item.ts    # 信息物料存储
│   ├── knowledge_block.ts   # 知识块存储
│   ├── relations.ts         # 关系管理
│   └── tags.ts             # 标签系统
├── api/                     # API 接口层
│   ├── ingestion.ts        # 数据包接收接口
│   ├── query.ts            # 查询接口
│   ├── management.ts       # 管理接口
│   └── export.ts           # 导出接口
├── processing/              # 数据处理引擎
│   ├── parser.ts           # 数据包解析
│   ├── indexer.ts          # 索引构建
│   ├── scorer.ts           # 注意力评分
│   └── linker.ts           # 关系链接
├── markdown/                # Markdown 扩展
│   ├── syntax.ts           # 语法扩展定义
│   ├── parser.ts           # 解析器
│   └── renderer.ts         # 渲染器
└── examples/                # 示例和测试
    ├── basic_usage.ts      # 基础使用示例
    ├── data_packets.json   # 示例数据包
    └── integration_test.ts # 集成测试
```

## 与 notcontrolOS 的集成点

### 1. 内核集成
- **Context Management**: HiNATA 数据为 AI 推理提供结构化上下文
- **Session Management**: 基于 HiNATA 的会话状态管理
- **Memory Management**: 优化的 HiNATA 数据结构内存布局

### 2. 文件系统集成
- **Knowledge FS**: HiNATA 作为知识文件系统的核心数据模型
- **Vector Storage**: HiNATA 内容的向量化存储和检索
- **Metadata Management**: 统一的元数据管理框架

### 3. PSP 系统集成
- **Personal Context**: HiNATA 数据为 PSP 提供个人化上下文
- **Knowledge Injection**: 动态注入相关知识到 PSP 中
- **Learning Feedback**: 基于 HiNATA 的 PSP 学习和优化

### 4. 网络层集成
- **Data Synchronization**: HiNATA 数据包的跨设备同步
- **API Gateway**: 统一的 HiNATA 数据接入点
- **Protocol Support**: 支持多种数据源协议

## 实现优先级

### Phase 1: 核心数据结构
- [ ] 基础类型定义
- [ ] 数据包规格实现
- [ ] 存储层基础功能

### Phase 2: 处理引擎
- [ ] 数据包解析器
- [ ] 索引构建系统
- [ ] 关系链接引擎

### Phase 3: API 层
- [ ] 数据接收接口
- [ ] 查询和检索接口
- [ ] 管理和维护接口

### Phase 4: 高级功能
- [ ] Markdown 语法扩展
- [ ] 智能推荐系统
- [ ] 数据导入导出

## 设计原则

1. **数据主权**: 用户完全控制自己的 HiNATA 数据
2. **隐私优先**: 本地存储和处理优先
3. **标准化**: 统一的数据格式和接口规范
4. **可扩展**: 支持未来功能扩展和第三方集成
5. **性能优化**: 针对 AI 推理场景的性能优化

## 许可证

HiNATA 数据结构作为 notcontrolOS 的核心组件，遵循 MIT 许可证，支持开源生态发展。
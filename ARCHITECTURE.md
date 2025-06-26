# notcontrolOS 架构概览 / Architecture Overview

## 项目简介 / Project Introduction

**English**: notcontrolOS is an AI-native operating system framework built on the "Context, Not Control" philosophy, designed to provide a foundation for AI-first applications and personal computing.

**中文**: notcontrolOS是基于"Context, Not Control"理念构建的AI原生操作系统框架，旨在为AI优先应用和个人计算提供基础设施。

## 核心架构 / Core Architecture

### 分层设计 / Layered Design

```
┌─────────────────────────────────────────┐
│           Applications / 应用层          │
├─────────────────────────────────────────┤
│              PSP System / PSP系统        │
├─────────────────────────────────────────┤
│           Libraries / 库层               │
├─────────────────────────────────────────┤
│         File Systems / 文件系统层        │
├─────────────────────────────────────────┤
│            Kernel / 内核层               │
├─────────────────────────────────────────┤
│        Hardware Abstraction / 硬件抽象层 │
└─────────────────────────────────────────┘
```

### 目录结构 / Directory Structure

```
notcontrolOS/
├── kernel/          # 内核核心 / Kernel Core
│   ├── core/        # 核心子系统 / Core Subsystems
│   ├── ai/          # AI推理引擎 / AI Inference Engine
│   ├── mm/          # 内存管理 / Memory Management
│   └── init/        # 系统初始化 / System Initialization
├── fs/              # 文件系统 / File Systems
│   ├── knowledge/   # 知识管理 / Knowledge Management
│   ├── pspfs/       # PSP文件系统 / PSP File System
│   └── vector/      # 向量存储 / Vector Storage
├── psp/             # PSP系统 / PSP System
│   ├── master/      # 主PSP / Master PSP
│   ├── functional/  # 功能PSP / Functional PSP
│   └── workflow/    # 工作流PSP / Workflow PSP
├── net/             # 网络子系统 / Network Subsystem
├── security/        # 安全框架 / Security Framework
├── lib/             # 系统库 / System Libraries
├── arch/            # 硬件架构 / Hardware Architecture
├── drivers/         # 设备驱动 / Device Drivers
└── tools/           # 开发工具 / Development Tools
```

## 核心组件 / Core Components

### 1. Context Engineering

**English**: Implementation of Andrew Karpathy's context engineering principles at the operating system level.

**中文**: 在操作系统层面实现Andrew Karpathy的context engineering原则。

**Key Features / 主要特性**:
- 智能上下文窗口管理 / Intelligent context window management
- 动态内容优化 / Dynamic content optimization  
- 成本效益平衡 / Cost-effectiveness balancing

### 2. PSP (Personal System Prompt) 系统

**English**: Four-layer architecture for personalized AI systems.

**中文**: 个性化AI系统的四层架构。

**Architecture / 架构**:
```
PSP_master → Functional PSP → Workflow PSP → Temporary PSP
```

**Features / 特性**:
- 继承机制 / Inheritance mechanism
- 动态加载 / Dynamic loading
- 安全隔离 / Security isolation

### 3. 知识管理框架 / Knowledge Management Framework

**English**: Abstract interface supporting multiple knowledge organization paradigms.

**中文**: 支持多种知识组织范式的抽象接口。

**Capabilities / 能力**:
- 统一抽象接口 / Unified abstract interface
- 语义检索 / Semantic retrieval
- 多格式支持 / Multi-format support

### 4. AI推理引擎 / AI Inference Engine

**English**: Hybrid local-cloud reasoning architecture with intelligent routing.

**中文**: 混合本地-云端推理架构，支持智能路由。

**Components / 组件**:
- 本地推理 / Local inference
- 云端协作 / Cloud collaboration
- 模型路由 / Model routing

## 设计原则 / Design Principles

### 1. AI原生 / AI-Native
**English**: Every component designed with AI-first thinking.

**中文**: 每个组件都以AI优先思维设计。

### 2. 模块化 / Modular
**English**: Clear interfaces and pluggable architecture.

**中文**: 清晰的接口和可插拔的架构。

### 3. 开放标准 / Open Standards
**English**: Based on open standards and protocols.

**中文**: 基于开放标准和协议。

### 4. 隐私保护 / Privacy-First
**English**: Local-first with user data sovereignty.

**中文**: 本地优先，用户数据主权。

## 接口设计 / Interface Design

### 系统调用 / System Calls
```typescript
interface notcontrolOSSystemCalls {
  // Context管理 / Context Management
  createContext(config: ContextConfig): Promise<ContextHandle>;
  updateContext(handle: ContextHandle, updates: ContextUpdates): Promise<void>;
  
  // PSP操作 / PSP Operations
  loadPSP(pspId: string): Promise<PSPHandle>;
  executePSP(handle: PSPHandle, input: PSPInput): Promise<PSPOutput>;
  
  // 知识管理 / Knowledge Management
  queryKnowledge(query: KnowledgeQuery): Promise<KnowledgeResult[]>;
  storeKnowledge(item: KnowledgeItem): Promise<string>;
}
```

### 文件系统接口 / File System Interface
```typescript
interface KnowledgeFS {
  // 基础操作 / Basic Operations
  create(item: KnowledgeItem): Promise<string>;
  read(id: string): Promise<KnowledgeItem>;
  update(id: string, updates: Partial<KnowledgeItem>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // 检索操作 / Retrieval Operations
  search(query: SearchQuery): Promise<SearchResult[]>;
  similaritySearch(vector: Vector, k: number): Promise<SimilarityResult[]>;
}
```

## 开发指南 / Development Guide

### 构建系统 / Build System
```bash
# 配置内核 / Configure kernel
make menuconfig

# 编译系统 / Build system  
make all

# 运行测试 / Run tests
make test
```

### 模块开发 / Module Development
```typescript
// PSP模块示例 / PSP Module Example
export class MyPSP implements PSPModule {
  async execute(context: PSPContext): Promise<PSPResult> {
    // 实现PSP逻辑 / Implement PSP logic
    return result;
  }
}
```

## 贡献指南 / Contributing

### 开发流程 / Development Workflow
1. Fork项目 / Fork the project
2. 创建特性分支 / Create feature branch
3. 提交更改 / Commit changes
4. 创建Pull Request / Create pull request

### 代码标准 / Code Standards
- 双语注释 / Bilingual comments
- TypeScript类型定义 / TypeScript type definitions
- 单元测试覆盖 / Unit test coverage

## 性能特性 / Performance Characteristics

### 内存管理 / Memory Management
- 智能缓存 / Intelligent caching
- 惰性加载 / Lazy loading
- 垃圾回收优化 / Garbage collection optimization

### 并发处理 / Concurrency
- 异步I/O / Asynchronous I/O
- 任务队列 / Task queuing
- 资源池管理 / Resource pool management

## 安全特性 / Security Features

### 数据保护 / Data Protection
- 端到端加密 / End-to-end encryption
- 访问控制 / Access control
- 审计日志 / Audit logging

### 隐私设计 / Privacy by Design
- 本地处理优先 / Local processing first
- 最小权限原则 / Principle of least privilege
- 数据匿名化 / Data anonymization

---

**License / 许可证**: MIT  
**Language / 语言**: TypeScript, Rust, C  
**Platform / 平台**: Cross-platform / 跨平台

For more detailed documentation, see [Documentation/](Documentation/) directory.
更多详细文档，请参见 [Documentation/](Documentation/) 目录。 
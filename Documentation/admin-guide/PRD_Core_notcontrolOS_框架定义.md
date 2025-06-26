# notcontrolOS 核心框架定义

## 执行摘要

**notcontrolOS：AI原生操作系统开源框架**

notcontrolOS 是一个专为AI原生应用设计的操作系统框架，基于"Context, Not Control"理念构建，旨在成为AI时代的"Linux"——一个开源的、标准化的AI应用运行环境基础架构。

## 核心理念

### "Context, Not Control"
> **在AI时代，Context就是程序**  

项目命名来源于"Context, Not Control"这一核心理念：
- **最初想法**：希望注册"context"域名，但无法获得
- **理念升华**：借鉴"Context, Not Control"，表达核心信念
- **设计哲学**：不是要控制AI，而是要通过Context让AI更好地理解和服务用户

### 两大核心支柱

#### 1. AI时代的数据自主权
在AI时代，用户必须对自己的数据拥有绝对控制权，拒绝平台数据垄断。

#### 2. 针对个人定制的AI
通过PSP系统将个人偏好转化为AI可理解的Context程序，实现真正的个人定制AI。

### 核心战略目标

**为什么需要AI原生操作系统？**
1. **技术需求**：传统OS无法有效支持AI推理、向量计算等新兴计算模式
2. **开发效率**：AI应用开发需要标准化的基础设施和通用组件
3. **生态统一**：建立AI应用的标准运行环境和接口规范
4. **资源优化**：智能的AI计算资源调度和管理

### 设计原则

```yaml
开源优先:
  许可模式: MIT License - 完全开源，商业友好
  社区驱动: GitHub开源协作，透明的治理机制
  标准化: 制定AI应用的行业标准和最佳实践
  可扩展: 模块化架构，支持第三方扩展
  
AI原生设计:
  内核级AI: AI推理引擎作为一等公民
  智能调度: 基于AI的资源分配和任务调度
  上下文管理: 原生支持长对话和会话状态
  向量计算: 内置向量数据库和嵌入计算

数据自主权:
  用户主权: 用户对自己数据拥有绝对控制权和所有权
  反对垄断: 坚决反对平台将用户数据据为己有（如Salesforce禁止用户使用自己数据训练AI）
  价值分享: 用户数据产生价值时必须获得公平回报（参考Grok模式：30美元/月信用额度）
  数据透明: 所有数据处理完全透明，用户清楚知道数据使用方式
  可迁移性: 用户可随时完整导出或删除自己的数据
  本地优先: 敏感数据优先本地处理，避免不必要的云端传输
```

### 与现有系统的区别

| 维度 | 传统OS | 云端AI | **notcontrolOS** |
|------|--------|--------|----------|
| **AI支持** | 外部库 | API调用 | **内核级原生支持** |
| **隐私模式** | 本地计算 | 云端处理 | **本地优先+云端可选** |
| **开发复杂度** | 高（需自建） | 中（依赖厂商） | **低（标准化框架）** |
| **扩展性** | 有限 | 厂商限制 | **完全开放生态** |
| **数据主权** | 模糊 | 平台控制 | **用户绝对控制** |

---

## 文档信息
- **创建时间**: 2024年12月
- **版本**: v2.0
- **状态**: 生产就绪
- **维护者**: notcontrolOS社区

## 1. notcontrolOS概述

### 1.1 核心定位
**notcontrolOS** 是AI原生应用的操作系统框架，基于"Context, Not Control"理念，提供运行AI应用所需的全套基础设施。

**核心价值主张**：
> **"Context, Not Control - 让每个人都拥有真正的个人AI"**  
> 通过智能的Context管理和PSP个人定制系统，让LLM这个超级计算机真正为每个用户服务，同时确保用户对自己数据的绝对控制权。

**设计目标**：
- **开发者友好**：提供简洁统一的API和丰富的开发工具
- **性能优化**：针对AI计算优化的内核和调度器
- **隐私保护**：支持完全本地化的AI推理和数据处理
- **生态开放**：建立开放的AI应用生态系统

### 1.2 核心架构

#### **分层设计**
```
┌─────────────────────────────────────────────────────────────────┐
│                 Application Layer                               │
│           (AI Apps, Tools, User Interfaces)                    │
├─────────────────────────────────────────────────────────────────┤
│                   Service Layer                                │
│         (Personal Config, Knowledge Management)                │
├─────────────────────────────────────────────────────────────────┤
│                   Kernel Layer                                 │
│    (AI Engine, Session Mgmt, System Calls, Scheduling)        │
├─────────────────────────────────────────────────────────────────┤
│                 Storage Layer                                  │
│      (Vector DB, File System, Knowledge Store)                │
├─────────────────────────────────────────────────────────────────┤
│               Hardware Abstraction                             │
│              (CPU, GPU, Memory, Network)                       │
└─────────────────────────────────────────────────────────────────┘
```

#### **核心组件**

1. **AI推理内核**
   - 本地LLM执行引擎
   - 模型加载和管理
   - 推理优化和加速

2. **会话管理系统**
   - 上下文窗口管理
   - 多会话并发控制
   - 状态持久化

3. **知识管理框架**
   - 通用知识存储接口
   - 向量检索和语义搜索
   - 知识图谱构建

4. **工具调用系统**
   - 标准化工具接口
   - MCP协议支持
   - 安全沙箱执行

### 1.3 技术特性

#### **AI原生设计**
- **内核级AI推理**：AI计算作为系统调用提供
- **智能资源调度**：基于AI负载的动态资源分配
- **上下文感知**：系统级的对话状态管理
- **向量计算原生支持**：内置高性能向量操作

#### **开发者体验**
- **统一API**：简洁一致的编程接口
- **热插拔组件**：模块化的系统组件
- **丰富工具链**：完整的开发、调试、部署工具
- **标准化配置**：声明式的应用配置管理

#### **隐私和安全**
- **本地优先**：支持完全离线的AI推理
- **数据加密**：端到端的数据保护
- **权限控制**：细粒度的访问控制机制
- **审计日志**：完整的操作追踪记录

## 2. 系统架构详解

### 2.1 内核子系统

#### **AI推理引擎 (kernel/ai/)**
负责本地AI模型的加载、执行和优化：

```cpp
// AI推理接口示例
class AIInferenceEngine {
public:
    ModelHandle loadModel(const std::string& modelPath);
    InferenceResult infer(ModelHandle model, const Request& request);
    void unloadModel(ModelHandle model);
    
    // 性能优化
    void optimizeForDevice();
    void setMemoryLimit(size_t maxMemory);
};
```

**核心功能**：
- 多模型并发执行
- 内存管理和优化
- GPU加速支持
- 模型热替换

#### **会话管理 (kernel/core/session/)**
管理AI交互会话的生命周期：

```cpp
class SessionManager {
public:
    SessionId createSession(const SessionConfig& config);
    void updateContext(SessionId id, const Context& context);
    Context getContext(SessionId id);
    void destroySession(SessionId id);
    
    // 并发控制
    void setMaxConcurrentSessions(int max);
    std::vector<SessionId> getActiveSessions();
};
```

**核心功能**：
- 会话隔离和安全
- 上下文窗口管理
- 会话状态持久化
- 并发访问控制

#### **系统调用接口 (kernel/core/syscalls/)**
提供应用与内核的标准接口：

```cpp
namespace notcontrolos::syscalls {
    // AI相关系统调用
    int ai_infer(const char* prompt, char* response, size_t max_len);
    int ai_load_model(const char* model_path);
    int ai_unload_model(int model_id);
    
    // 知识管理系统调用
    int knowledge_store(const char* content, const char* metadata);
    int knowledge_search(const char* query, SearchResult* results, int max_results);
    
    // 工具调用系统调用
    int tool_call(const char* tool_name, const char* args, char* result, size_t max_len);
}
```

### 2.2 文件系统架构

#### **知识文件系统 (fs/knowledge/)**
专门为知识管理优化的文件系统：

```
fs/knowledge/
├── interfaces/          # 抽象接口定义
│   └── KnowledgeInterface.ts
├── engines/            # 存储引擎实现
│   ├── vector/         # 向量存储
│   ├── graph/          # 知识图谱
│   └── full-text/      # 全文搜索
├── protocols/          # 数据协议
│   ├── import/         # 数据导入
│   └── export/         # 数据导出
└── tools/              # 管理工具
    ├── indexer/        # 索引构建
    └── migrator/       # 数据迁移
```

**核心特性**：
- 多种存储后端支持
- 统一的查询接口
- 自动索引和优化
- 数据迁移工具

#### **向量存储系统 (fs/vector/)**
高性能的向量数据库实现：

```typescript
interface VectorStore {
    // 基础操作
    insert(id: string, vector: number[], metadata?: any): Promise<void>;
    search(query: number[], topK: number): Promise<SearchResult[]>;
    delete(id: string): Promise<void>;
    
    // 批量操作
    batchInsert(items: VectorItem[]): Promise<void>;
    batchSearch(queries: number[][], topK: number): Promise<SearchResult[][]>;
    
    // 索引管理
    createIndex(config: IndexConfig): Promise<void>;
    optimizeIndex(): Promise<void>;
}
```

### 2.3 个人配置系统

#### **PSP (Personal System Prompt) 框架**
声明式的AI助手配置系统：

```yaml
# 示例PSP配置
metadata:
  name: "coding-assistant"
  version: "1.0.0"
  description: "专业的编程助手"

prompt:
  system: |
    你是一个专业的编程助手，擅长多种编程语言。
    你的回答应该准确、清晰，并提供实用的代码示例。
    
  personality:
    - professional
    - patient
    - detail-oriented

capabilities:
  tools:
    - code_executor
    - file_manager
    - web_search
  
  languages:
    - python
    - typescript
    - rust
    - go

constraints:
  max_response_length: 2000
  code_safety_check: true
  internet_access: limited
```

**PSP架构**：
```
psp/
├── standards/           # PSP格式标准
├── core/               # 核心组件
│   ├── compiler/       # PSP编译器
│   ├── loader/         # PSP加载器
│   └── validator/      # PSP验证器
├── master/             # 基础模板
├── functional/         # 功能模块
├── workflow/           # 工作流程
└── temporary/          # 临时配置
```

## 3. 开发指南

### 3.1 环境搭建

#### **系统要求**
- **操作系统**: Linux (Ubuntu 20.04+), macOS (11.0+), Windows (WSL2)
- **内存**: 最少8GB，推荐16GB+
- **存储**: 最少32GB可用空间
- **网络**: 用于下载模型和依赖

#### **快速开始**
```bash
# 1. 克隆仓库
git clone https://github.com/byenat/notcontrolos.git
cd notcontrolos

# 2. 安装依赖
./scripts/install-deps.sh

# 3. 配置构建
make menuconfig

# 4. 编译系统
make -j$(nproc)

# 5. 安装
sudo make install

# 6. 启动notcontrolOS
notcontrolos-daemon start
```

### 3.2 应用开发

#### **Hello World示例**
```typescript
import { notcontrolOSApp, AISession } from '@notcontrolos/sdk';

class HelloWorldApp extends notcontrolOSApp {
    async onStart() {
        console.log('Hello notcontrolOS!');
        
        // 创建AI会话
        const session = await AISession.create({
            model: 'local/llama-3.1-8b',
            system: 'You are a helpful assistant.'
        });
        
        // AI对话
        const response = await session.chat('What is notcontrolOS?');
        console.log('AI Response:', response);
        
        // 清理资源
        await session.destroy();
    }
}

export default HelloWorldApp;
```

#### **知识管理应用**
```typescript
import { KnowledgeManager, VectorStore } from '@notcontrolos/knowledge';

class MyKnowledgeApp {
    private knowledge: KnowledgeManager;
    
    constructor() {
        this.knowledge = new KnowledgeManager({
            storage: 'local',
            indexing: 'auto'
        });
    }
    
    async addDocument(content: string, title: string) {
        return await this.knowledge.store({
            content,
            metadata: { title, type: 'document' },
            autoIndex: true
        });
    }
    
    async searchSimilar(query: string, limit = 10) {
        return await this.knowledge.search({
            query,
            type: 'semantic',
            limit
        });
    }
}
```

### 3.3 PSP开发

#### **基础PSP模板**
```yaml
# my-assistant.psp.yaml
metadata:
  name: "my-assistant"
  version: "1.0.0"
  author: "Your Name"
  license: "MIT"

extends:
  - "psp://master/base"
  - "psp://functional/tools"

prompt:
  system: |
    You are my personal assistant.
    Help me with daily tasks and questions.
    
  context_instructions: |
    - Be concise but comprehensive
    - Ask clarifying questions when needed
    - Provide actionable advice

tools:
  enabled:
    - calendar
    - web_search
    - file_manager
  
  permissions:
    file_access: "~/Documents"
    network_access: "limited"

preferences:
  response_style: "friendly"
  detail_level: "moderate"
  language: "auto"
```

#### **PSP编译和部署**
```bash
# 验证PSP配置
notcontrolos-psp validate my-assistant.psp.yaml

# 编译PSP
notcontrolos-psp compile my-assistant.psp.yaml -o my-assistant.psp

# 安装PSP
notcontrolos-psp install my-assistant.psp

# 测试PSP
notcontrolos-psp test my-assistant
```

## 4. 部署和运维

### 4.1 部署模式

#### **桌面应用模式**
适合个人用户的完整安装：
```bash
# 安装notcontrolOS Desktop
curl -fsSL https://install.notcontrolos.org/desktop | sh

# 启动桌面服务
notcontrolos-desktop start

# 安装应用
notcontrolos-app install knowledge-manager
notcontrolos-app install coding-assistant
```

#### **服务器模式**
适合团队或云端部署：
```yaml
# docker-compose.yml
version: '3.8'
services:
  notcontrolos-kernel:
    image: notcontrolos/kernel:latest
    ports:
      - "8080:8080"
    volumes:
      - notcontrolos-data:/var/lib/notcontrolos
      - ./config:/etc/notcontrolos
    environment:
      - notcontrolOS_MODE=server
      - notcontrolOS_LOG_LEVEL=info

  notcontrolos-storage:
    image: notcontrolos/storage:latest
    volumes:
      - notcontrolos-storage:/data
    environment:
      - STORAGE_TYPE=distributed

volumes:
  notcontrolos-data:
  notcontrolos-storage:
```

#### **嵌入式模式**
适合IoT设备和边缘计算：
```bash
# 构建轻量级版本
make ARCH=arm64 CONFIG=minimal notcontrolos-lite

# 部署到设备
scp notcontrolos-lite user@device:/usr/local/bin/
ssh user@device "notcontrolos-lite --config minimal.yaml"
```

### 4.2 性能优化

#### **内存管理**
```bash
# 配置内存限制
echo 'kernel.ai.max_memory=4G' >> /etc/notcontrolos/kernel.conf
echo 'session.max_concurrent=10' >> /etc/notcontrolos/session.conf

# 启用内存压缩
echo 'memory.compression=lz4' >> /etc/notcontrolos/system.conf
```

#### **GPU加速**
```bash
# 安装CUDA支持
notcontrolos-install cuda-toolkit

# 配置GPU
echo 'ai.device=cuda:0' >> /etc/notcontrolos/ai.conf
echo 'ai.precision=fp16' >> /etc/notcontrolos/ai.conf

# 验证GPU状态
notcontrolos-gpu status
```

### 4.3 监控和诊断

#### **系统监控**
```bash
# 查看系统状态
notcontrolos-status

# 实时监控
notcontrolos-monitor --live

# 性能分析
notcontrolos-perf profile --duration 60s
```

#### **日志管理**
```bash
# 查看系统日志
notcontrolos-logs system --tail 100

# 查看AI推理日志
notcontrolos-logs ai --level debug

# 导出诊断信息
notcontrolos-diag export --output diag.tar.gz
```

## 5. 贡献指南

### 5.1 开发环境

#### **代码风格**
notcontrolOS项目遵循以下代码风格：
- **C++**: Google C++ Style Guide
- **TypeScript**: Prettier + ESLint
- **Python**: Black + Flake8
- **Rust**: rustfmt + Clippy

#### **测试要求**
```bash
# 运行所有测试
make test

# 运行单元测试
make test-unit

# 运行集成测试
make test-integration

# 性能测试
make test-performance
```

### 5.2 贡献流程

1. **Fork项目**到你的GitHub账户
2. **创建特性分支**: `git checkout -b feature/awesome-feature`
3. **提交更改**: `git commit -m 'Add awesome feature'`
4. **推送分支**: `git push origin feature/awesome-feature`
5. **创建Pull Request**

### 5.3 社区

- **GitHub**: https://github.com/byenat/notcontrolos
- **文档**: https://docs.notcontrolos.org
- **论坛**: https://community.notcontrolos.org
- **聊天**: https://discord.gg/notcontrolos
- **邮件**: notcontrolos-dev@groups.io

## 6. 许可证

notcontrolOS采用MIT许可证，允许商业使用和修改：

```
MIT License

Copyright (c) 2024 notcontrolOS Community

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

**notcontrolOS**: Empowering the next generation of AI-native applications.
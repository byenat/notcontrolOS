# notcontrolOS Core Documentation / notcontrolOS 核心文档

## Overview / 概述

**English**: notcontrolOS is an operating system framework designed specifically for AI-native applications, built on the "Context, Not Control" philosophy. In the AI era, Context is the program — with precise context, LLMs as supercomputers can truly serve users. This document introduces notcontrolOS's core concepts, architectural design, and technical features.

**中文**: notcontrolOS 是专为AI原生应用设计的操作系统框架，基于"Context, Not Control"理念构建。在AI时代，Context就是程序——有了精准的上下文，LLM这个超级计算机才能真正为用户服务。本文档介绍notcontrolOS的核心概念、架构设计和技术特性。

## Core Features / 核心特性

### AI-Native Design / AI原生设计
**English**:
- Kernel-level AI inference support
- Intelligent resource scheduling and management
- Context-aware user interfaces
- Native vector computation support

**中文**:
- 内核级AI推理支持
- 智能资源调度和管理
- 上下文感知的用户界面
- 向量计算原生支持

### Developer-Friendly / 开发者友好
**English**:
- Unified programming interfaces
- Rich development toolchain
- Modular component architecture
- Complete documentation and examples

**中文**:
- 统一的编程接口
- 丰富的开发工具链
- 模块化组件架构
- 完整的文档和示例

### Privacy Protection & Data Sovereignty / 隐私保护与数据自主权
**English**:
- Local-first computing mode
- End-to-end data encryption
- Fine-grained permission control
- Transparent data processing workflow
- **User Data Sovereignty Protection**: Users have absolute control over their own data
- **Oppose Data Monopoly**: Reject platforms appropriating user data as their own
- **Fair Value Sharing**: Users should receive fair returns when their data generates value

**中文**:
- 本地优先的计算模式
- 端到端数据加密
- 细粒度权限控制
- 透明的数据处理流程
- **用户数据主权保护**：用户对自己数据拥有绝对控制权
- **反对数据垄断**：拒绝平台将用户数据据为己有的做法
- **价值公平分享**：用户数据产生价值时应获得公平回报

### High Performance / 高性能
**English**:
- Optimized for AI workloads
- Intelligent memory management
- Asynchronous I/O and concurrent processing
- Hardware acceleration support

**中文**:
- 针对AI工作负载优化
- 智能内存管理
- 异步I/O和并发处理
- 硬件加速支持

## 核心组件

### 内核子系统
- **AI推理引擎**: 本地LLM执行和优化
- **会话管理**: 多会话并发控制和状态管理
- **上下文管理**: 智能上下文窗口分配
- **工具调用**: 标准化的工具集成框架

### 文件系统
- **知识管理**: 通用知识存储和检索
- **向量存储**: 高性能语义搜索
- **缓存系统**: 智能数据缓存和预取
- **虚拟文件系统**: 统一的文件访问接口

### PSP系统
- **个人配置**: 声明式的AI助手配置
- **模板系统**: 可复用的配置模板
- **动态加载**: 运行时配置热更新
- **验证框架**: 配置正确性验证

### 网络和通信
- **模型路由**: 智能AI模型选择和调度
- **MCP协议**: 标准化的模型上下文协议
- **API网关**: 统一的服务访问入口
- **负载均衡**: 智能流量分配

### 安全框架
- **权限管理**: 基于角色的访问控制
- **数据加密**: 多层次的加密保护
- **审计日志**: 完整的操作追踪记录
- **沙箱隔离**: 安全的代码执行环境

## 技术特性

### AI原生架构
- 内置推理引擎，AI计算作为一等公民
- 智能资源调度，基于AI负载动态分配
- 上下文感知，系统级的对话状态管理
- 标准化的知识表示格式

### 开放生态
- MIT许可证，完全开源
- 标准化API，促进生态建设
- 插件架构，支持第三方扩展
- 社区驱动的开发模式

### 高可扩展性
- 模块化设计，组件独立开发
- 微服务架构，支持分布式部署
- 水平扩展，支持集群和云端部署
- 向前兼容，保证API稳定性

### 跨平台支持
- 多架构支持 (x86_64, ARM64, RISC-V)
- 操作系统无关 (Linux, macOS, Windows)
- 云原生部署 (Docker, Kubernetes)
- 边缘计算优化

## 使用场景

### 个人AI助手
- 智能任务规划和执行
- 个性化推荐和建议
- 自然语言交互界面
- 隐私保护的本地计算

### 企业AI应用
- 知识管理和搜索
- 智能客服和支持
- 文档处理和分析
- 业务流程自动化

### 开发者工具
- AI辅助编程
- 代码生成和优化
- 智能调试和测试
- 项目管理和协作

### IoT和边缘计算
- 智能设备控制
- 实时数据处理
- 边缘AI推理
- 设备间协作

## 快速开始

### 安装要求
- 操作系统: Linux (Ubuntu 20.04+), macOS (11.0+), Windows (WSL2)
- 内存: 最少8GB，推荐16GB+
- 存储: 最少32GB可用空间
- 网络: 用于下载模型和依赖

### 安装步骤
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

### Hello World示例
```typescript
import { NotControlOSApp, AISession } from '@notcontrolos/sdk';

class HelloWorldApp extends NotControlOSApp {
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

## 文档结构

- **[架构概述](architecture/overview.md)** - 系统架构和设计原理
- **[数据格式](data-formats/)** - 数据格式规范和迁移指南
- **[API参考](api/)** - 完整的API文档
- **[开发指南](developer-guide/)** - 开发者使用指南
- **[部署指南](deployment/)** - 部署和运维文档

## 社区

- **GitHub**: https://github.com/byenat/notcontrolos
- **文档**: https://docs.notcontrolos.org
- **论坛**: https://community.notcontrolos.org
- **聊天**: https://discord.gg/notcontrolos
- **邮件**: notcontrolos-dev@groups.io

## 许可证

notcontrolOS采用MIT许可证，允许商业使用和修改。

---

**notcontrolOS**: Context, Not Control - 让用户真正掌控AI时代。 
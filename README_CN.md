# notcontrolOS - AI原生操作系统

> **"Context, Not Control" - 围绕Context赋能用户掌控AI时代**  
> "Context engineering is the delicate art and science of filling the context window with just the right information for the next step." - Andrew Karpathy

**🌐 Language / 语言**: [English](README.md) | [中文](README_CN.md)

[![Version](https://img.shields.io/badge/version-0.1.0--alpha-orange)](https://github.com/byenat/notcontrolos)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Architecture](https://img.shields.io/badge/architecture-context--engineered-green)](Documentation/admin-guide/)

## 概述

notcontrolOS 是专为AI时代设计的开源操作系统框架，基于"Context, Not Control"理念构建。在AI时代，**Context就是程序**——有了精准的上下文，LLM这个超级计算机才能真正为用户服务。notcontrolOS致力于成为"AI时代的开源基础设施"，通过智能的上下文管理和个人化系统提示词(PSP)，让每个人都能拥有完全定制的个人AI。

## 核心理念

### Context就是新时代的程序
> "在AI时代，Context就是程序"  
> 传统程序是给CPU执行的指令序列，而在AI时代，Context是给LLM执行的认知指令序列。

**为什么Context至关重要？**
- **LLM本质**: LLM是通用的超级计算机，但需要精确的Context才能产生期望的行为
- **个性化需求**: 每个用户的需求、偏好、工作方式都不同，需要个性化的Context
- **效率优化**: 好的Context能让AI更准确理解用户意图，减少无效交互

### Context而非Control
项目命名来源于"Context, Not Control"这一核心理念：
- **最初想法**: 希望注册"context"域名，但无法获得
- **理念升华**: 借鉴"Context, Not Control"，表达我们的核心信念
- **设计哲学**: 不是要控制AI，而是要通过Context让AI更好地理解和服务用户

### 核心价值主张

notcontrolOS围绕两大核心理念构建：

#### 1. AI时代的数据自主权
> "用户的数据属于用户，而非平台"  
> 
> 在AI时代，我们坚决反对大公司将用户数据视为自己的资产，用户必须对自己的数据拥有绝对控制权。

#### 2. 针对个人定制的AI
> "通过PSP让每个人都拥有独一无二的个人AI"  
> 
> 通过Personal System Prompt (PSP)系统，将个人偏好、工作方式、专业知识转化为AI可理解的Context程序，实现真正的个人定制AI体验。

### 数据自主权理念

notcontrolOS坚持用户数据主权原则：
> "用户的数据属于用户，而非平台"  
> 在AI时代，我们坚决反对大公司将用户数据视为自己的资产。

**核心立场**：
- **拒绝数据垄断**: 反对类似Salesforce修改用户协议禁止用户使用自己数据训练AI的行为
- **数据自主控制**: 用户对自己的数据拥有绝对控制权和使用权
- **价值公平分享**: 若用户选择共享数据，必须获得相应的价值回报（参考Grok为数据提供者提供30美元/月信用额度的模式）
- **透明化处理**: 所有数据处理过程完全透明，用户清楚知道数据的使用方式
- **可迁移权利**: 用户随时可以完整导出或删除自己的数据

notcontrolOS通过技术架构确保这些原则的实现，让用户真正拥有自己的数字资产。

### Context驱动的技术优势

- **Context即程序**: 将个人需求转化为LLM可执行的Context程序
- **PSP个人定制系统**: Personal System Prompt让AI真正理解并适应每个用户的独特需求
- **智能上下文管理**: 精确填充上下文窗口，让LLM这个超级计算机发挥最大效能
- **混合推理架构**: 本地LLM + 云端大模型的协作，在隐私和性能间找到平衡
- **数据主权保护**: 用户数据完全本地控制，拒绝平台数据垄断
- **开放生态建设**: 支持MCP协议的标准化工具生态，避免技术锁定

## 架构概览

notcontrolOS采用经典操作系统的分层架构设计，专为context engineering优化：

```
notcontrolOS架构：

┌─────────────────────────────────────────────────────────────┐
│                    应用层 (samples/)                       │
│       第三方应用 | 开源应用 | PSP示例                       │
├─────────────────────────────────────────────────────────────┤
│                    接口层 (include/)                       │
│        notcontrolOS API | MCP协议 | 用户空间API            │
├─────────────────────────────────────────────────────────────┤
│                    服务层 (lib/ + tools/)                  │
│   PSP库 | AI工具库 | 上下文管理库 | 开发工具               │
├─────────────────────────────────────────────────────────────┤
│                 子系统层 (fs/ + net/ + security/)          │
│   知识文件系统 | 模型路由网络 | 隐私安全                   │
├─────────────────────────────────────────────────────────────┤
│                    内核层 (kernel/)                        │
│    上下文管理 | 会话管理 | AI推理 | 系统调用               │
├─────────────────────────────────────────────────────────────┤
│                 硬件层 (arch/ + drivers/)                  │
│     架构抽象 | AI硬件驱动 | 设备驱动                      │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

### 核心组件

- **`kernel/`** - notcontrolOS内核
  - `core/` - 核心子系统 (上下文管理、会话、调度、系统调用)
  - `mm/` - 内存管理 (上下文、知识、压缩、分页)
  - `ai/` - AI推理子系统 (推理、路由、优化、学习)
  - `init/` - 内核初始化 (引导、PSP加载器、配置)

- **`arch/`** - 架构相关代码
  - `x86_64/` `arm64/` `riscv/` `common/`

- **`drivers/`** - 设备驱动
  - `ai/` - AI硬件驱动 (NPU/GPU/TPU)
  - `sensors/` `storage/` `network/`

### 系统服务

- **`fs/`** - 文件系统
  - `knowledge/` - 通用知识文件系统框架
  - `pspfs/` - PSP文件系统
  - `vector/` `cache/`

- **`net/`** - 网络子系统
  - `model_routing/` - 智能模型路由
  - `cloud_bridge/` - 云端协作桥接
  - `privacy/` `federation/`

- **`security/`** - 安全子系统
  - `privacy/` `encryption/` `access_control/` `audit/`

### 开发支持

- **`lib/`** - 核心库
  - `psp/` - Personal System Prompt库
  - `ai_utils/` `compression/` `crypto/`

- **`include/`** - 头文件和接口
  - `notcontrolos/` - notcontrolOS系统接口
  - `uapi/` - 用户空间API

- **`tools/`** - 开发工具
  - `psp_compiler/` `debugger/` `profiler/` `migration/`

- **`samples/`** - 示例代码
  - `psp_examples/` `applications/` `drivers/`

### 文档和构建

- **`Documentation/`** - 完整文档
  - `admin-guide/` `dev-guide/` `user-guide/` `api/`

- **`scripts/`** - 构建脚本
  - `build/` `config/` `packaging/`

## 快速开始

### 构建系统

```bash
# 配置构建
make config

# 构建内核和模块
make all

# 构建PSP支持
make psp

# 构建AI子系统
make ai

# 构建开发工具
make tools
```

### 开发环境

```bash
# 安装依赖
./scripts/build/install-deps.sh

# 配置开发环境
./scripts/config/setup-dev.sh

# 运行测试
make test
```

## 核心特性

### 1. Context Engineering核心

基于Andrew Karpathy的理念，notcontrolOS提供了世界级的上下文管理能力：

- **智能上下文窗口管理**: 动态选择最相关信息填充上下文
- **PSP驱动优化**: 基于个人偏好的上下文优先级调整
- **多模态上下文集成**: 文本、图像、音频的统一上下文管理
- **成本效益优化**: 在质量和成本之间找到最佳平衡点

### 2. Personal System Prompt (PSP)系统

PSP是notcontrolOS的核心创新，将个人偏好转化为AI可理解的程序：

- **PSP_master**: 核心个人档案，所有AI交互的基础
- **功能PSP**: 针对特定功能的专门化PSP
- **工作流PSP**: 复杂任务的多步骤编排

### 3. 混合推理引擎

智能的本地-云端协作架构：

- **本地优先**: PSP相关任务完全本地处理
- **云端协作**: 复杂推理任务的智能路由
- **成本优化**: 智能模型选择降低AI使用成本

### 4. 通用知识管理框架

开放的个人知识存储和检索框架：

- **抽象接口**: 支持多种知识组织模式的标准接口
- **语义检索**: 基于向量的智能搜索框架
- **隐私保护**: 完全本地化的知识管理架构

## 文档

- [架构概览](ARCHITECTURE.md)
- [架构设计](Documentation/admin-guide/notcontrolOS_ARCHITECTURE.md)
- [Context Engineering指南](Documentation/admin-guide/notcontrolOS_CONTEXT_ENGINEERING_ROADMAP.md)
- [数据自主权宣言](Documentation/admin-guide/数据自主权宣言.md)
- [开发指南](Documentation/dev-guide/)
- [API参考](Documentation/api/)
- [变更日志](CHANGELOG.md)

## 项目标准

- [贡献指南](CONTRIBUTING.md) - 如何为项目贡献
- [开发标准](standards/development/Project_Development_Standards.md) - 编码和开发标准
- [双语文档指南](standards/documentation/Bilingual_Documentation_Guidelines.md) - 双语文档标准

## 开源发布路线图

详见 [开源路线图](Documentation/admin-guide/OPENSOURCE_ROADMAP.md)

### 当前状态
- ✅ 核心架构设计完成
- ✅ Context Engineering框架实现
- ✅ 目录结构重组完成
- 🔄 代码重构进行中
- 📅 Q2 2025: Alpha版本发布

## 贡献

notcontrolOS欢迎社区贡献！请查看：

- [贡献指南](Documentation/dev-guide/CONTRIBUTING.md)
- [代码规范](Documentation/dev-guide/CODING_STYLE.md)
- [维护者列表](MAINTAINERS)

## 许可证

notcontrolOS采用MIT许可证，确保完全开源并促进商业和学术使用。

## 致谢

特别感谢Andrew Karpathy提出的context engineering理念，为notcontrolOS的核心设计提供了重要指导。

---

**notcontrolOS** - *让Context Engineering变得简单而强大* 🚀 
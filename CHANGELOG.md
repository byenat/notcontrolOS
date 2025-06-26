# notcontrolOS 变更日志 / Changelog

## [Unreleased]

### 主要特性 / Major Features
- ✨ Context Engineering 核心框架 - Andrew Karpathy理念的系统级实现
- ✨ PSP (Personal System Prompt) 四层架构体系 
- ✨ 通用知识管理框架 - 支持多种知识组织模式
- ✨ 双语开发标准 - 面向全球开发者的国际化框架

### 新增功能 / Added
- 🎯 `kernel/core/context/` - 智能上下文窗口管理
- 🎯 `kernel/core/execution/` - 任务分解与并行执行控制器
- 🎯 `kernel/core/prefetch/` - 预获取优化引擎
- 🎯 `psp/` - PSP系统独立顶级目录，四层架构完整
- 🎯 `fs/knowledge/` - 抽象知识管理接口
- 🎯 `Documentation/` - 结构化双语文档体系
- 🎯 `standards/` - 项目开发和文档标准

### 改进功能 / Improved  
- 🔧 经典操作系统架构对齐 - 清晰的分层设计
- 🔧 模块化接口设计 - 标准化的组件边界
- 🔧 双语文档体系 - 英文/中文并行支持
- 🔧 开源社区治理框架 - 透明的贡献和决策流程

### 技术架构 / Technical Architecture
- 📦 **内核层**: `kernel/` - AI原生操作系统核心
- 📦 **文件系统**: `fs/` - 知识管理和存储抽象
- 📦 **PSP系统**: `psp/` - 个人化AI系统框架  
- 📦 **网络层**: `net/` - 分布式AI协作网络
- 📦 **安全层**: `security/` - 数据自主权技术实现
- 📦 **库层**: `lib/` - 系统工具和算法库

### 开发工具 / Development Tools
- 🛠️ PSP编译器和验证器
- 🛠️ Context Engineering开发套件
- 🛠️ 双语文档生成工具
- 🛠️ 模块化构建系统 (Makefile + Kconfig)

## 项目理念 / Project Philosophy

### Context, Not Control
**English**: In the AI era, providing rich context is more powerful than attempting to control every aspect of computation.

**中文**: 在AI时代，提供丰富的上下文比试图控制计算的每个方面更加强大。

### 数据自主权 / Data Sovereignty  
**English**: Users should own, control, and benefit from their personal data.

**中文**: 用户应该拥有、控制并从个人数据中受益。

### AI原生设计 / AI-Native Design
**English**: System components designed with AI-first thinking, where context is a first-class citizen.

**中文**: 以AI优先思维设计系统组件，上下文作为一等公民。

## 贡献指南 / Contributing

我们欢迎全球开发者的贡献！请查看：
- [贡献指南 / Contributing Guidelines](CONTRIBUTING.md)
- [开发标准 / Development Standards](standards/development/Project_Development_Standards.md)
- [双语文档指南 / Bilingual Documentation Guidelines](standards/documentation/Bilingual_Documentation_Guidelines.md)

## 致谢 / Acknowledgments

- Andrew Karpathy - Context Engineering理念启发
- 开源社区 - Linux内核架构设计参考
- 全球贡献者 - 多元化的技术视角和文化理解

---

**注意 / Note**: notcontrolOS正在积极开发中，API可能会发生变化。请关注版本发布和变更日志。

**Notice**: notcontrolOS is under active development. APIs may change. Please follow releases and changelog. 
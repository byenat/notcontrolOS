# notcontrolOS Documentation Center / notcontrolOS 文档中心

**English**: Welcome to the notcontrolOS Documentation Center! notcontrolOS is a personal operating system architecture designed for the AI era, built on the "Context, Not Control" philosophy, providing an open-source foundation framework for building AI-native applications.

**中文**: 欢迎来到 notcontrolOS 文档中心！notcontrolOS 是为AI时代设计的个人操作系统架构，基于"Context, Not Control"理念构建，提供构建AI-native应用的开源基础框架。

## 🚀 Quick Start / 快速开始

### Getting Started Guide / 新手指南
- [notcontrolOS Introduction / notcontrolOS 简介](core/introduction.md) - Understanding notcontrolOS core philosophy / 了解notcontrolOS的核心理念
- [System Architecture Overview / 系统架构概览](core/architecture/overview.md) - Overall architecture design / 整体架构设计
- [Installation Guide / 安装指南](user-guide/installation.md) - Quick installation and configuration / 快速安装配置
- [First Application / 第一个应用](user-guide/getting-started.md) - Creating your first notcontrolOS application / 创建你的第一个notcontrolOS应用

## 📚 Core Documentation / 核心文档

### System Architecture / 系统架构
- [Operating System Architecture / 操作系统架构](admin-guide/notcontrolOS_ARCHITECTURE.md) - Complete system architecture design / 完整的系统架构设计
- [PSP System Architecture / PSP系统架构](../psp/Documentation/architecture/PSP_ARCHITECTURE.md) - Personal System Prompt detailed design / Personal System Prompt详细设计
- [Knowledge Management Framework / 知识管理框架](../fs/knowledge/README.md) - Universal knowledge management infrastructure / 通用知识管理基础设施

### Developer Guide / 开发指南
- [Development Environment Setup / 开发环境搭建](dev-guide/environment-setup.md) - Development environment configuration / 开发环境配置
- [API Reference / API 参考](api/overview.md) - Complete API documentation / 完整的API文档
- [PSP Development Guide / PSP 开发指南](../psp/standards/format/PSP_FORMAT_SPEC.md) - PSP format specification / PSP格式规范
- [Best Practices / 最佳实践](dev-guide/best-practices.md) - Development best practices / 开发最佳实践

### 管理指南
- [系统管理](admin-guide/system-management.md) - 系统管理和维护
- [安全配置](admin-guide/security-config.md) - 安全策略配置
- [性能调优](admin-guide/performance-tuning.md) - 系统性能优化

## 🏗️ 项目管理

### 架构决策
- [开源架构文档](admin-guide/notcontrolOS_ARCHITECTURE.md) - notcontrolOS开源架构设计
- [开源发布路线图](admin-guide/OPENSOURCE_ROADMAP.md) - 开源发布计划
- [Core Framework Definition / 核心框架定义](admin-guide/PRD_Core_notcontrolOS_框架定义.md) - notcontrolOS core concepts / notcontrolOS核心概念
- [Data Sovereignty Manifesto / 数据自主权宣言](admin-guide/数据自主权宣言.md) - User data sovereignty philosophy and implementation / 用户数据主权理念与实现
- [Data Sovereignty Manifesto (English)](admin-guide/Data_Sovereignty_Manifesto.md) - English version for international developers / 面向国际开发者的英文版本

## 🔧 技术规范

### 数据格式
- [notcontrolOS文档格式规范](core/data-formats/notcontrolos-document-format-specification.md)
- [Markdown到JSON技术可行性](core/data-formats/md-to-json-technical-feasibility.md)

### 工具集成
- [工具调用与Prompt及MCP](admin-guide/工具调用与Prompt及MCP_.md)
- [统一笔记结构设计](admin-guide/统一笔记结构设计探讨_.md)

## 🌟 核心特性

### PSP (Personal System Prompt) System / PSP (Personal System Prompt) 系统
**English**: notcontrolOS's core innovation, transforming personal preferences into AI-understandable Context programs:
- **Four-layer Architecture**: PSP_master → Functional PSPs → Workflow PSPs → Temporary PSPs
- **Inheritance Mechanism**: Support for inheritance and override between PSPs
- **Access Control**: Fine-grained permission management
- **Personal Customization**: Achieving truly personal AI experiences

**中文**: notcontrolOS的核心创新，将个人偏好转化为AI可理解的Context程序：
- **四层架构**: PSP_master → 功能PSP → 工作流PSP → 临时PSP
- **继承机制**: 支持PSP间的继承和覆盖
- **访问控制**: 细粒度的权限管理
- **个人定制**: 实现真正的个人AI体验

For detailed information, please refer to [PSP System Documentation](../psp/README.md) / 详细信息请参阅 [PSP系统文档](../psp/README.md)

### 通用知识管理框架
提供开放、可扩展的知识组织基础设施：
- **抽象接口**: 不绑定特定的知识组织模式
- **可插拔设计**: 支持多种处理器和存储适配器
- **第三方集成**: 兼容Obsidian、Notion等主流工具
- **隐私保护**: 本地化的知识处理和存储

详细信息请参阅 [知识管理框架文档](../fs/knowledge/README.md)

### MCP协议集成
标准化的工具调用和上下文共享：
- **工具发现**: 自动发现和注册可用工具
- **上下文传递**: 安全的上下文共享机制
- **错误处理**: 统一的错误报告和恢复

## 🤝 社区参与

### 贡献指南
- [贡献者指南](../MAINTAINERS) - 如何参与notcontrolOS开发
- [代码规范](dev-guide/coding-standards.md) - 代码风格和规范
- [提交流程](dev-guide/contribution-workflow.md) - Pull Request流程

### 社区治理
- [治理模式](community/governance/overview.md) - 社区治理结构
- [决策流程](community/governance/decision-process.md) - 重大决策流程
- [行为准则](community/code-of-conduct.md) - 社区行为规范

## 📖 用户指南

### 基础使用
- [安装配置](user-guide/installation.md) - 系统安装和配置
- [基本操作](user-guide/basic-operations.md) - 日常使用指南
- [故障排除](user-guide/troubleshooting.md) - 常见问题解决

### 高级功能
- [PSP配置](user-guide/psp-configuration.md) - 个人化PSP设置
- [知识管理](user-guide/knowledge-management.md) - 知识组织和管理
- [工具集成](user-guide/tool-integration.md) - 第三方工具集成

## 🔍 技术深度

### 架构设计
- [内核设计](technical/kernel-design.md) - 内核架构详解
- [文件系统](technical/filesystem-design.md) - 文件系统设计
- [网络架构](technical/network-architecture.md) - 网络子系统

### 性能优化
- [内存管理](technical/memory-management.md) - 内存使用优化
- [AI推理优化](technical/ai-inference-optimization.md) - AI推理性能
- [存储优化](technical/storage-optimization.md) - 存储性能优化

## 📋 参考资料

### API文档
- [核心API](api/core-api.md) - 核心系统API
- [PSP API](api/psp-api.md) - PSP系统编程接口
- [知识管理API](api/knowledge-api.md) - 知识管理接口

### 工具文档
- [构建工具](tools/build-tools.md) - 构建系统使用
- [调试工具](tools/debugging.md) - 调试和诊断
- [性能分析](tools/performance-analysis.md) - 性能分析工具

## 🚀 开源战略

### 边界定义
notcontrolOS作为开源项目，专注于提供AI时代个人操作系统的基础设施：

**开源范围** (notcontrolOS):
- 系统架构和接口定义
- PSP系统的标准实现
- 通用知识管理框架
- MCP协议实现
- 开发工具和文档

**商业实现** (如ZentaN):
- 具体的知识组织策略
- 专有的AI模型和算法
- 特定的用户界面设计
- 商业化的应用功能

这种策略类似于Android AOSP与Google Services的关系，既保证了开源生态的健康发展，又为商业创新留出了空间。

## 📞 获取帮助

### 技术支持
- [常见问题](faq.md) - 常见问题解答
- [GitHub Issues](https://github.com/byenat/notcontrolos/issues) - 问题报告和功能请求
- [讨论区](https://github.com/byenat/notcontrolos/discussions) - 技术讨论

### 联系方式
- 项目主页: [https://github.com/byenat/notcontrolos](https://github.com/byenat/notcontrolos)
- 文档网站: [https://docs.notcontrolos.org](https://docs.notcontrolos.org)
- 社区论坛: [https://community.notcontrolos.org](https://community.notcontrolos.org)

---

**版本**: v2.0  
**最后更新**: 2024年12月  
**维护者**: notcontrolOS社区 
# Contributing to notcontrolOS / 为notcontrolOS做贡献

> **"Context, Not Control" - Join us in building the future of AI-native operating systems**  
> **"Context, Not Control" - 加入我们，共同构建AI原生操作系统的未来**

**English**: Thank you for your interest in contributing to notcontrolOS! This guide will help you understand our contribution process, coding standards, and community guidelines.

**中文**: 感谢您对为notcontrolOS做贡献的兴趣！本指南将帮助您了解我们的贡献流程、编码标准和社区指南。

## Table of Contents / 目录

- [Getting Started / 开始贡献](#getting-started--开始贡献)
- [Development Setup / 开发环境设置](#development-setup--开发环境设置)
- [Contribution Types / 贡献类型](#contribution-types--贡献类型)
- [Bilingual Documentation Requirements / 双语文档要求](#bilingual-documentation-requirements--双语文档要求)
- [Code Standards / 代码标准](#code-standards--代码标准)
- [Submission Process / 提交流程](#submission-process--提交流程)
- [Review Process / 审查流程](#review-process--审查流程)
- [Community Guidelines / 社区指南](#community-guidelines--社区指南)

## Getting Started / 开始贡献

### Prerequisites / 前提条件

**English**: Before contributing, ensure you have:

**中文**: 在贡献之前，请确保您具备：

- **Development Environment / 开发环境**: Node.js 18+, TypeScript, Git
- **Language Skills / 语言技能**: 
  - For core contributions: English proficiency required / 核心贡献：需要英语熟练
  - For Chinese community: Chinese proficiency helpful / 中文社区：中文熟练有帮助
  - For bilingual docs: Both languages preferred / 双语文档：两种语言均可优先考虑
- **Technical Knowledge / 技术知识**: Understanding of AI/LLM concepts, operating system basics

### First Steps / 第一步

1. **Fork the Repository / 分叉仓库**
   ```bash
   # Fork on GitHub, then clone / 在GitHub上分叉，然后克隆
   git clone https://github.com/byenat/notcontrolos.git
   cd notcontrolos
   ```

2. **Set Up Development Environment / 设置开发环境**
   ```bash
   # Install dependencies / 安装依赖
   make install
   
   # Build the project / 构建项目
   make build
   
   # Run tests / 运行测试
   make test
   ```

3. **Explore the Codebase / 探索代码库**
   - Read the [Architecture Documentation](Documentation/admin-guide/notcontrolOS_ARCHITECTURE.md)
   - Browse [PSP System Documentation](psp/README.md)
   - Check [existing issues](https://github.com/byenat/notcontrolos/issues) for contribution opportunities

## Development Setup / 开发环境设置

### Required Tools / 必需工具

```bash
# Install development dependencies / 安装开发依赖
npm install -g typescript
npm install -g eslint
npm install -g prettier

# Install project dependencies / 安装项目依赖
npm install

# Set up pre-commit hooks / 设置预提交钩子
npm run prepare
```

### IDE Configuration / IDE配置

**English**: We recommend using VS Code with the following extensions:

**中文**: 我们推荐使用VS Code配合以下扩展：

- **TypeScript / TypeScript**: Official TypeScript support
- **ESLint**: Code linting and formatting / 代码检查和格式化
- **Prettier**: Code formatting / 代码格式化
- **Markdown All in One**: Documentation editing / 文档编辑
- **Chinese Language Pack**: For Chinese contributors / 中文贡献者适用

## Contribution Types / 贡献类型

### 🔧 Code Contributions / 代码贡献

#### Core System Development / 核心系统开发
- **Context Management / 上下文管理**: Improve context window optimization
- **PSP System / PSP系统**: Enhance Personal System Prompt functionality
- **AI Inference / AI推理**: Optimize local LLM integration
- **Knowledge Management / 知识管理**: Expand knowledge filesystem capabilities

#### Driver and Integration / 驱动和集成
- **AI Hardware Drivers / AI硬件驱动**: GPU, NPU, TPU support
- **MCP Tools / MCP工具**: Model Context Protocol integrations
- **Third-party APIs / 第三方API**: External service integrations

### 📝 Documentation Contributions / 文档贡献

#### Required Bilingual Documentation / 必需双语文档
**English**: These documents must be maintained in both English and Chinese:

**中文**: 这些文档必须用英文和中文维护：

- **Core README files / 核心README文件**
- **API documentation / API文档**
- **Architecture guides / 架构指南**
- **Installation instructions / 安装说明**
- **User tutorials / 用户教程**

#### Optional Bilingual Documentation / 可选双语文档
- **Technical specifications / 技术规范**
- **Development guides / 开发指南**
- **Community policies / 社区政策**

### 🌐 Translation Contributions / 翻译贡献

**English**: Help us maintain high-quality translations:

**中文**: 帮助我们维护高质量的翻译：

- **English to Chinese / 英译中**: Translate English documentation to Chinese
- **Chinese to English / 中译英**: Translate Chinese content to English  
- **Technical Review / 技术审查**: Review translations for technical accuracy
- **Cultural Adaptation / 文化适应**: Ensure content is culturally appropriate

### 🧪 Testing and Quality Assurance / 测试和质量保证

- **Unit Tests / 单元测试**: Write comprehensive test coverage
- **Integration Tests / 集成测试**: Test component interactions
- **Performance Testing / 性能测试**: Benchmark and optimize performance
- **Documentation Testing / 文档测试**: Verify documentation accuracy

## Bilingual Documentation Requirements / 双语文档要求

### 🚨 Mandatory for Core Files / 核心文件强制要求

**English**: All contributors modifying core project files must provide bilingual content.

**中文**: 所有修改核心项目文件的贡献者必须提供双语内容。

#### Format Standards / 格式标准

```markdown
# English Title / 中文标题

## Section Name / 章节名称

**English**: English explanation of the concept goes here.

**中文**: 概念的中文解释在这里。

### Subsection / 子章节

- **Feature / 功能**: Description in both languages / 双语描述
- **API Method / API方法**: `methodName()` - Purpose / 用途
```

#### Translation Quality Standards / 翻译质量标准

1. **Technical Accuracy / 技术准确性**: Translations must preserve technical meaning
2. **Consistency / 一致性**: Use standardized terminology across documents
3. **Clarity / 清晰度**: Ensure content is understandable to the target audience
4. **Cultural Appropriateness / 文化适应性**: Adapt content for cultural context when needed

### Translation Workflow / 翻译工作流程

#### For English Contributors / 英文贡献者

1. **Create English Content / 创建英文内容**: Write complete English documentation
2. **Add Chinese Placeholders / 添加中文占位符**: Mark sections needing translation
   ```markdown
   **中文**: [此章节需要中文翻译 / Chinese translation needed]
   ```
3. **Request Translation Review / 请求翻译审查**: Tag Chinese-speaking maintainers

#### For Chinese Contributors / 中文贡献者

1. **Create Chinese Content / 创建中文内容**: Write complete Chinese documentation
2. **Add English Placeholders / 添加英文占位符**: Mark sections needing translation
   ```markdown
   **English**: [English translation needed / 需要英文翻译]
   ```
3. **Request Translation Review / 请求翻译审查**: Tag English-speaking maintainers

## Code Standards / 代码标准

### Naming Conventions / 命名规范

**English**: Follow PascalCase for key identifiers as specified in project rules.

**中文**: 按照项目规则，对关键标识符使用PascalCase命名方式。

```typescript
// Correct naming / 正确命名
interface ContextManager {
  LoadContext(): Promise<Context>;
  SaveUserPreferences(): void;
}

class PSPLoader {
  LoadFunctionalPSP(name: string): PSPConfig;
}

// File naming / 文件命名
ContextManager.ts
PSPLoader.ts
SessionController.ts
```

### Code Documentation / 代码文档

```typescript
/**
 * Context Window Manager / 上下文窗口管理器
 * 
 * English: Manages LLM context windows with intelligent prioritization.
 * 中文: 通过智能优先级管理LLM上下文窗口。
 */
export class ContextWindowManager {
  
  /**
   * Load context for inference / 为推理加载上下文
   * @param contextId Context identifier / 上下文标识符
   * @param options Load options / 加载选项
   * @returns Promise<Context> Loaded context / 加载的上下文
   */
  async LoadContext(
    contextId: string, 
    options?: LoadOptions
  ): Promise<Context> {
    // Implementation / 实现
  }
}
```

### Error Handling / 错误处理

```typescript
// Bilingual error messages / 双语错误消息
export const ErrorMessages = {
  PSP_NOT_FOUND: {
    en: "PSP configuration file not found",
    zh: "未找到PSP配置文件"
  },
  CONTEXT_OVERFLOW: {
    en: "Context window size exceeded",
    zh: "上下文窗口大小超限"
  }
} as const;
```

## Submission Process / 提交流程

### Before Submitting / 提交前准备

#### Self-Check Checklist / 自检清单

- [ ] **Code Quality / 代码质量**: Follows TypeScript best practices
- [ ] **Tests / 测试**: All tests pass locally
- [ ] **Documentation / 文档**: Public APIs documented in both languages
- [ ] **Formatting / 格式**: Code properly formatted with Prettier
- [ ] **Linting / 代码检查**: No ESLint errors

#### For Bilingual Documentation / 双语文档

- [ ] **English Content / 英文内容**: Grammatically correct and technically accurate
- [ ] **Chinese Content / 中文内容**: 语法正确且技术准确
- [ ] **Consistency / 一致性**: Both versions convey the same meaning
- [ ] **Format / 格式**: Follows bilingual formatting standards

### Commit Standards / 提交标准

#### Commit Message Format / 提交消息格式

```bash
# For major changes / 重大更改
type(scope): English description / 中文描述

# Examples / 示例
feat(psp): Add PSP inheritance mechanism / 添加PSP继承机制
fix(context): Resolve memory leak in context manager / 修复上下文管理器内存泄漏
docs(readme): Update bilingual installation guide / 更新双语安装指南

# For minor changes, English only is acceptable / 小更改仅英文可接受
fix: Update dependency versions
chore: Remove unused imports
style: Fix code formatting
```

#### Commit Types / 提交类型

- `feat`: New feature / 新功能
- `fix`: Bug fix / 错误修复
- `docs`: Documentation changes / 文档更改
- `style`: Code style changes / 代码样式更改
- `refactor`: Code refactoring / 代码重构
- `test`: Test additions or modifications / 测试添加或修改
- `chore`: Maintenance tasks / 维护任务

### Pull Request Process / 拉取请求流程

#### PR Title and Description / PR标题和描述

```markdown
# Add PSP inheritance mechanism / 添加PSP继承机制

## Description / 描述

**English**: 
This PR implements the PSP inheritance mechanism that allows functional PSPs to inherit configuration from PSP_master while maintaining their specialized behavior.

**中文**:
此PR实现了PSP继承机制，允许功能PSP从PSP_master继承配置，同时保持其专门的行为。

## Type of Change / 更改类型
- [x] New feature / 新功能
- [ ] Bug fix / 错误修复
- [ ] Documentation update / 文档更新
- [ ] Breaking change / 破坏性更改

## Testing / 测试
- [x] Unit tests added / 添加单元测试
- [x] Integration tests pass / 集成测试通过
- [x] Manual testing completed / 完成手动测试

## Checklist / 检查清单
- [x] Code follows project standards / 代码遵循项目标准
- [x] Self-review completed / 完成自我审查
- [x] Documentation updated / 更新文档
- [x] Tests added for new functionality / 为新功能添加测试
```

## Review Process / 审查流程

### Review Types / 审查类型

#### Technical Review / 技术审查
**English**: Code quality, architecture compliance, performance impact

**中文**: 代码质量、架构合规性、性能影响

- **Reviewer Assignment / 审查者指派**: Automatically assigned based on modified files
- **Required Approvals / 必需批准**: At least 2 maintainer approvals for core changes
- **Review Criteria / 审查标准**: Code quality, test coverage, documentation completeness

#### Language Review / 语言审查
**English**: For bilingual documentation changes

**中文**: 用于双语文档更改

- **English Review / 英文审查**: Native or fluent English speakers
- **Chinese Review / 中文审查**: 中文母语或流利使用者
- **Cross-language Consistency / 跨语言一致性**: Ensure both versions convey the same meaning

#### Security Review / 安全审查
**English**: For security-sensitive changes

**中文**: 用于安全敏感更改

- **Security Team Review / 安全团队审查**: Required for auth, crypto, or privacy changes
- **Threat Assessment / 威胁评估**: Evaluate potential security implications
- **Compliance Check / 合规性检查**: Ensure adherence to security standards

### Review Timelines / 审查时间表

- **Initial Response / 初始响应**: Within 48 hours / 48小时内
- **Technical Review / 技术审查**: 3-5 business days / 3-5个工作日
- **Language Review / 语言审查**: 2-3 business days / 2-3个工作日
- **Final Approval / 最终批准**: After all requirements met / 满足所有要求后

## Community Guidelines / 社区指南

### Code of Conduct / 行为准则

**English**: We are committed to providing a welcoming and inclusive environment for all contributors.

**中文**: 我们致力于为所有贡献者提供友好和包容的环境。

#### Our Standards / 我们的标准

- **Respectful Communication / 尊重沟通**: Be respectful and professional in all interactions
- **Inclusive Language / 包容性语言**: Use language that welcomes all contributors
- **Constructive Feedback / 建设性反馈**: Provide helpful and actionable feedback
- **Cultural Sensitivity / 文化敏感性**: Be aware of cultural differences in our global community

#### Unacceptable Behavior / 不可接受的行为

- **Harassment / 骚扰**: Any form of harassment or discrimination
- **Trolling / 恶意挑衅**: Deliberate inflammatory or off-topic comments
- **Spam / 垃圾信息**: Excessive self-promotion or irrelevant content
- **Disrespectful Language / 不敬语言**: Insults, personal attacks, or offensive language

### Getting Help / 获取帮助

#### For Technical Questions / 技术问题

- **GitHub Discussions / GitHub讨论**: Public technical discussions
- **Issues / 问题**: Bug reports and feature requests  
- **Discord / Discord**: Real-time community chat
- **Email / 电子邮件**: direct contact for sensitive issues

#### For Language Support / 语言支持

- **English Support / 英文支持**: Available in GitHub Discussions and Discord
- **Chinese Support / 中文支持**: 在微信群和QQ群中提供支持
- **Translation Help / 翻译帮助**: Tag `@translation-team` for translation assistance

### Recognition / 贡献认可

**English**: We value all contributions and provide recognition through:

**中文**: 我们重视所有贡献，并通过以下方式提供认可：

- **Contributors List / 贡献者列表**: Listed in CONTRIBUTORS.md
- **Release Notes / 发布说明**: Major contributions highlighted in releases
- **Community Events / 社区活动**: Speaking opportunities at community events
- **Maintainer Path / 维护者路径**: Path to becoming a project maintainer

---

## Quick Reference / 快速参考

### Essential Commands / 基本命令

```bash
# Setup / 设置
make install              # Install dependencies / 安装依赖
make build               # Build project / 构建项目
make test                # Run tests / 运行测试

# Development / 开发
make dev                 # Start development mode / 启动开发模式
make lint                # Run linter / 运行检查工具
make format              # Format code / 格式化代码

# Documentation / 文档
make docs                # Build documentation / 构建文档
make docs-serve          # Serve docs locally / 本地运行文档
```

### Key Resources / 关键资源

- **Architecture Guide / 架构指南**: [notcontrolOS_ARCHITECTURE.md](Documentation/admin-guide/notcontrolOS_ARCHITECTURE.md)
- **PSP Documentation / PSP文档**: [PSP README](psp/README.md)
- **Development Standards / 开发标准**: [Project_Development_Standards.md](standards/development/Project_Development_Standards.md)
- **Bilingual Guidelines / 双语指南**: [Bilingual_Documentation_Guidelines.md](standards/documentation/Bilingual_Documentation_Guidelines.md)

---

**English**: Thank you for contributing to notcontrolOS! Together, we're building the future of AI-native operating systems.

**中文**: 感谢您为notcontrolOS做出贡献！我们正在共同构建AI原生操作系统的未来。

---

**Document Version / 文档版本**: 1.0.0  
**Last Updated / 最后更新**: 2025-01-24  
**Questions / 问题**: Create an issue or contact maintainers / 创建issue或联系维护者 
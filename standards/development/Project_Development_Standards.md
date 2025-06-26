# notcontrolOS Project Development Standards / notcontrolOS 项目开发标准

## Overview / 概述

**English**: This document defines the development standards, coding guidelines, and contribution requirements for the notcontrolOS project, including mandatory bilingual documentation requirements for international collaboration.

**中文**: 本文档定义了notcontrolOS项目的开发标准、编码指南和贡献要求，包括国际协作所需的强制性双语文档要求。

## 🌐 Language and Documentation Requirements / 语言和文档要求

### Mandatory Bilingual Documentation / 强制双语文档
**English**: All contributors must follow bilingual documentation standards for core project files.

**中文**: 所有贡献者必须遵循核心项目文件的双语文档标准。

#### Required Bilingual Content / 必须双语内容
- **README files / README文件**: Root and major component README files
- **API documentation / API文档**: All public APIs and interfaces  
- **Architecture documents / 架构文档**: System design and technical specifications
- **User guides / 用户指南**: Installation, configuration, and usage instructions
- **Contribution guidelines / 贡献指南**: How to contribute to the project

#### Bilingual Format Standards / 双语格式标准
```markdown
# English Title / 中文标题

**English**: English explanation of the concept.

**中文**: 概念的中文解释。

## Section Name / 章节名称

### Method A: Parallel Structure / 方法A：并行结构
**English**: Detailed English content here.

**中文**: 详细的中文内容在这里。

### Method B: Integrated Structure / 方法B：集成结构
- **Feature Name / 功能名称**: Description in both languages / 双语描述
```

#### Enforcement / 执行
- **Pull Request Reviews / 拉取请求审查**: All PRs affecting core documentation must include bilingual content
- **Automated Checks / 自动检查**: CI/CD pipelines verify bilingual compliance
- **Community Review / 社区审查**: Native speakers of both languages must review translations

## 💻 Code Development Standards / 代码开发标准

### Naming Conventions / 命名规范

#### File and Directory Names / 文件和目录命名
**English**: Use PascalCase for key identifiers as specified in user rules.

**中文**: 按照用户规则，对关键标识符使用PascalCase命名方式。

```typescript
// Correct / 正确
interface ContextManager {
  LoadContext(): Context;
  SaveContext(): void;
}

// Component files / 组件文件
ContextManager.ts
SessionController.ts
PSPLoader.ts

// Configuration / 配置
const DefaultSettings = {
  ContextWindowSize: 4096,
  MaxRetryCount: 3
};
```

#### Code Comments / 代码注释
```typescript
/**
 * Context Window Manager / 上下文窗口管理器
 * 
 * English: Manages LLM context windows with intelligent prioritization
 * and memory optimization for optimal inference performance.
 * 
 * 中文: 通过智能优先级排序和内存优化管理LLM上下文窗口，
 * 以获得最佳推理性能。
 */
export class ContextWindowManager {
  
  /**
   * Load context data / 加载上下文数据
   * @param contextId Context identifier / 上下文标识符
   * @returns Promise<Context> Loaded context / 加载的上下文
   */
  async LoadContext(contextId: string): Promise<Context> {
    // Implementation details / 实现细节
  }
}
```

### Code Quality Standards / 代码质量标准

#### TypeScript/JavaScript Standards / TypeScript/JavaScript标准
**English**: Follow strict TypeScript standards with comprehensive type safety.

**中文**: 遵循严格的TypeScript标准，提供全面的类型安全。

```typescript
// Enforce strict typing / 强制严格类型
interface PSPConfig {
  readonly Name: string;
  readonly Version: string;
  readonly InheritFrom?: string;
  readonly Tools: readonly string[];
}

// Use explicit return types / 使用明确的返回类型
function LoadPSP(configPath: string): Promise<PSPConfig> {
  // Implementation / 实现
}

// Error handling with types / 带类型的错误处理
type LoadResult<T> = {
  Success: true;
  Data: T;
} | {
  Success: false;
  Error: string;
};
```

#### Error Handling / 错误处理
```typescript
// Bilingual error messages / 双语错误消息
export enum ErrorCodes {
  PSP_NOT_FOUND = "PSP_NOT_FOUND",
  INVALID_CONFIG = "INVALID_CONFIG",
  CONTEXT_OVERFLOW = "CONTEXT_OVERFLOW"
}

export const ErrorMessages = {
  [ErrorCodes.PSP_NOT_FOUND]: {
    en: "PSP configuration file not found",
    zh: "未找到PSP配置文件"
  },
  [ErrorCodes.INVALID_CONFIG]: {
    en: "Invalid PSP configuration format", 
    zh: "PSP配置格式无效"
  }
} as const;
```

## 📝 Git and Version Control Standards / Git和版本控制标准

### Commit Message Format / 提交消息格式
**English**: Use conventional commit format with bilingual descriptions for major changes.

**中文**: 对重大更改使用带有双语描述的约定提交格式。

```bash
# Format / 格式
type(scope): English description / 中文描述

# Examples / 示例
feat(psp): Add PSP inheritance mechanism / 添加PSP继承机制

fix(context): Resolve memory leak in context manager / 修复上下文管理器内存泄漏

docs(readme): Update bilingual installation guide / 更新双语安装指南

# For simple changes, English only is acceptable / 简单更改仅用英文也可接受
fix: Update dependency version
chore: Remove unused imports
```

### Branch Naming / 分支命名
```bash
# Feature branches / 功能分支
feature/context-optimization
feature/psp-inheritance-system

# Bug fix branches / 错误修复分支  
fix/memory-leak-context-manager
fix/psp-validation-error

# Documentation branches / 文档分支
docs/bilingual-api-reference
docs/architecture-update
```

### Pull Request Requirements / 拉取请求要求

#### PR Title and Description / PR标题和描述
```markdown
# PR Title / PR标题
Add PSP inheritance mechanism / 添加PSP继承机制

## Description / 描述

**English**: 
This PR implements the PSP inheritance mechanism that allows functional PSPs to inherit configuration from PSP_master while maintaining their specialized behavior.

**中文**:
此PR实现了PSP继承机制，允许功能PSP从PSP_master继承配置，同时保持其专门的行为。

## Changes / 更改
- [x] Implement inheritance logic / 实现继承逻辑
- [x] Add validation for inheritance chains / 添加继承链验证
- [x] Update documentation / 更新文档
- [x] Add comprehensive tests / 添加全面测试

## Breaking Changes / 破坏性更改
None / 无

## Testing / 测试
- [x] Unit tests pass / 单元测试通过
- [x] Integration tests pass / 集成测试通过
- [x] Documentation examples verified / 文档示例已验证
```

#### Review Requirements / 审查要求
**English**: All PRs must pass the following reviews:

**中文**: 所有PR必须通过以下审查：

1. **Technical Review / 技术审查**: Code quality, architecture compliance, performance impact
2. **Language Review / 语言审查**: For bilingual content, native speakers must review both languages
3. **Documentation Review / 文档审查**: Ensure documentation is complete and accurate
4. **Security Review / 安全审查**: For security-sensitive changes

## 🧪 Testing Standards / 测试标准

### Test Organization / 测试组织
```typescript
// Test file naming / 测试文件命名
// Pattern: ComponentName.test.ts
ContextManager.test.ts
PSPLoader.test.ts
SessionController.test.ts

// Test structure / 测试结构
describe('ContextManager / 上下文管理器', () => {
  describe('LoadContext / 加载上下文', () => {
    it('should load valid context successfully / 应成功加载有效上下文', async () => {
      // Test implementation / 测试实现
    });
    
    it('should handle invalid context gracefully / 应优雅处理无效上下文', async () => {
      // Test implementation / 测试实现  
    });
  });
});
```

### Test Coverage Requirements / 测试覆盖率要求
**English**: Maintain minimum test coverage standards:

**中文**: 保持最低测试覆盖率标准：

- **Core modules / 核心模块**: ≥90% line coverage
- **API interfaces / API接口**: ≥95% line coverage  
- **Critical paths / 关键路径**: 100% coverage
- **Error handling / 错误处理**: ≥85% coverage

## 🏗️ Architecture Standards / 架构标准

### Module Organization / 模块组织
**English**: Follow the established directory structure and module boundaries.

**中文**: 遵循既定的目录结构和模块边界。

```
notcontrolOS/
├── kernel/                    # Core OS functionality / 核心操作系统功能
│   ├── core/                 # Core subsystems / 核心子系统  
│   ├── ai/                   # AI inference engine / AI推理引擎
│   └── mm/                   # Memory management / 内存管理
├── psp/                      # PSP system / PSP系统
│   ├── core/                 # PSP core logic / PSP核心逻辑
│   ├── functional/           # Functional PSPs / 功能PSP
│   └── standards/            # PSP standards / PSP标准
├── fs/                       # File systems / 文件系统
│   ├── knowledge/            # Knowledge management / 知识管理
│   └── vector/               # Vector storage / 向量存储
└── Documentation/            # Project documentation / 项目文档
```

### Interface Design / 接口设计
```typescript
// Standard interface pattern / 标准接口模式
export interface ComponentInterface {
  // Method names use PascalCase / 方法名使用PascalCase
  Initialize(): Promise<void>;
  Process(input: InputType): Promise<OutputType>;
  Cleanup(): Promise<void>;
}

// Configuration interfaces / 配置接口
export interface ComponentConfig {
  readonly Name: string;
  readonly Version: string;
  readonly Settings: Record<string, unknown>;
}
```

## 📋 Code Review Checklist / 代码审查检查表

### For Reviewers / 审查者检查项

#### Technical Review / 技术审查
- [ ] **Code Quality / 代码质量**: Follows TypeScript best practices, proper error handling
- [ ] **Architecture / 架构**: Adheres to module boundaries and interface contracts  
- [ ] **Performance / 性能**: No obvious performance regressions
- [ ] **Security / 安全**: No security vulnerabilities introduced
- [ ] **Tests / 测试**: Adequate test coverage for new functionality

#### Bilingual Documentation Review / 双语文档审查
- [ ] **English Content / 英文内容**: Accurate, clear, grammatically correct
- [ ] **Chinese Content / 中文内容**: 准确、清晰、语法正确
- [ ] **Consistency / 一致性**: Both languages convey the same technical meaning
- [ ] **Terminology / 术语**: Uses standardized translations for technical terms
- [ ] **Format / 格式**: Follows bilingual formatting standards

#### Compliance Review / 合规性审查
- [ ] **Naming Conventions / 命名规范**: PascalCase used for key identifiers
- [ ] **File Organization / 文件组织**: Files placed in correct directories
- [ ] **Documentation / 文档**: All public APIs documented in both languages
- [ ] **License / 许可证**: Proper license headers where required

### For Contributors / 贡献者检查项

#### Before Submitting PR / 提交PR前
- [ ] **Self Review / 自我审查**: Code reviewed for quality and standards compliance
- [ ] **Testing / 测试**: All tests pass locally
- [ ] **Documentation / 文档**: Public APIs documented in both languages
- [ ] **Commit Messages / 提交消息**: Follow conventional commit format
- [ ] **Branch / 分支**: Created from latest main branch

#### PR Description / PR描述
- [ ] **Bilingual Description / 双语描述**: Major changes described in both languages
- [ ] **Change List / 更改列表**: Clear list of what was modified
- [ ] **Breaking Changes / 破坏性更改**: Any breaking changes clearly identified
- [ ] **Testing Notes / 测试说明**: How the changes were tested

## 🔄 Continuous Integration / 持续集成

### Automated Checks / 自动检查
**English**: All submissions must pass automated quality gates:

**中文**: 所有提交必须通过自动化质量门：

```yaml
# CI Pipeline checks / CI流水线检查
- name: Code Quality / 代码质量
  steps:
    - TypeScript compilation / TypeScript编译
    - ESLint static analysis / ESLint静态分析
    - Unit test execution / 单元测试执行
    - Test coverage validation / 测试覆盖率验证

- name: Documentation Quality / 文档质量  
  steps:
    - Markdown linting / Markdown检查
    - Bilingual format validation / 双语格式验证
    - Link validation / 链接验证
    - Spell checking (EN/ZH) / 拼写检查(英文/中文)

- name: Architecture Compliance / 架构合规性
  steps:
    - Module dependency analysis / 模块依赖分析
    - Interface contract validation / 接口契约验证
    - Performance regression tests / 性能回归测试
```

## 📚 Reference Documents / 参考文档

### Related Standards / 相关标准
- [Bilingual Documentation Guidelines](../documentation/Bilingual_Documentation_Guidelines.md) - Detailed bilingual formatting rules / 详细双语格式规则
- [PSP Format Specification](../../psp/standards/format/PSP_FORMAT_SPEC.md) - PSP standard format / PSP标准格式
- [API Design Guidelines](./API_Design_Guidelines.md) - Interface design standards / 接口设计标准

### Tools and Resources / 工具和资源
- **TypeScript Style Guide / TypeScript样式指南**: [Microsoft TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Testing Framework / 测试框架**: Jest with TypeScript support
- **Documentation Tools / 文档工具**: Markdown linters, translation memory tools
- **CI/CD Platform / CI/CD平台**: GitHub Actions with bilingual validation

---

## Enforcement and Updates / 执行和更新

### Compliance Monitoring / 合规性监控
**English**: Project maintainers will regularly audit compliance with these standards and provide feedback to contributors.

**中文**: 项目维护者将定期审计这些标准的合规性，并向贡献者提供反馈。

### Standard Updates / 标准更新
**English**: These standards are living documents that will be updated based on project evolution and community feedback.

**中文**: 这些标准是活跃文档，将根据项目发展和社区反馈进行更新。

### Questions and Support / 问题和支持
**English**: For questions about these standards, please create an issue in the GitHub repository or contact the maintainers.

**中文**: 有关这些标准的问题，请在GitHub仓库中创建issue或联系维护者。

---

**Document Version / 文档版本**: 1.0.0  
**Last Updated / 最后更新**: 2025-01-24  
**Maintained by / 维护者**: notcontrolOS Core Team / notcontrolOS核心团队 
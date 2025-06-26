# Bilingual Documentation Guidelines / 双语文档编写规范

## Overview / 概述

**English**: This document establishes the standards for bilingual (English/Chinese) documentation in the notcontrolOS project to ensure consistency, accessibility, and international collaboration.

**中文**: 本文档建立了notcontrolOS项目双语（英文/中文）文档的标准，以确保一致性、可访问性和国际协作。

## Core Principles / 核心原则

### 1. Accessibility First / 可访问性优先
**English**: All core documentation must be accessible to both English and Chinese-speaking developers.

**中文**: 所有核心文档必须对英文和中文开发者都可访问。

### 2. Consistency in Formatting / 格式一致性
**English**: Use standardized bilingual formatting throughout all documentation.

**中文**: 在所有文档中使用标准化的双语格式。

### 3. Technical Accuracy / 技术准确性
**English**: Ensure technical terms and concepts are accurately translated and consistently used.

**中文**: 确保技术术语和概念准确翻译并一致使用。

## Documentation Categories / 文档分类

### 🔴 Category A: Must Be Bilingual / A类：必须双语
**Required bilingual documentation / 需要双语的文档:**

- **Core project files / 核心项目文件**:
  - `README.md`
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`

- **Architecture and design documents / 架构和设计文档**:
  - System architecture overviews / 系统架构概览
  - Core concept explanations / 核心概念说明
  - PSP system documentation / PSP系统文档

- **Developer onboarding / 开发者入门**:
  - Getting started guides / 入门指南
  - Installation instructions / 安装说明
  - Quick start tutorials / 快速开始教程

- **API documentation / API文档**:
  - Core API references / 核心API参考
  - Interface specifications / 接口规范
  - Integration guides / 集成指南

### 🟡 Category B: Bilingual Recommended / B类：推荐双语
**Recommended bilingual documentation / 推荐双语的文档:**

- **Technical specifications / 技术规范**:
  - Protocol documentation / 协议文档
  - Format specifications / 格式规范
  - Configuration guides / 配置指南

- **Community documentation / 社区文档**:
  - Governance documents / 治理文档
  - Project roadmaps / 项目路线图
  - Release notes / 发布说明

### 🟢 Category C: English Primary / C类：英文为主
**English-primary documentation (Chinese optional) / 英文为主的文档（中文可选）:**

- **Internal development / 内部开发**:
  - Code comments / 代码注释
  - Internal technical notes / 内部技术笔记
  - Debugging guides / 调试指南

- **Advanced technical content / 高级技术内容**:
  - Research papers / 研究论文
  - Performance analysis / 性能分析
  - Security audits / 安全审计

## Formatting Standards / 格式标准

### 1. Title Format / 标题格式
```markdown
# English Title / 中文标题
## English Subtitle / 中文副标题
### English Section / 中文章节
```

### 2. Content Structure / 内容结构

#### Method A: Parallel Content / 方法A：并行内容
For substantial content blocks / 适用于大段内容：

```markdown
## Section Title / 章节标题

**English**: English content explaining the concept in detail. This method works well for longer explanations and comprehensive descriptions.

**中文**: 中文内容详细解释概念。这种方法适合较长的解释和全面的描述。
```

#### Method B: Integrated Lists / 方法B：集成列表
For lists and bullet points / 适用于列表和要点：

```markdown
- **English Point / 中文要点**: Additional explanation / 补充说明
- **Technical Term / 技术术语**: Definition in both languages / 双语定义
```

#### Method C: Code with Comments / 方法C：代码加注释
For technical examples / 适用于技术示例：

```bash
# Install dependencies / 安装依赖
make install

# Build the project / 构建项目
make build
```

### 3. Technical Terms / 技术术语

#### Standardized Translations / 标准化翻译
Maintain consistency in technical term translations / 保持技术术语翻译的一致性：

| English | 中文 | Notes / 注释 |
|---------|------|-------------|
| Context | Context/上下文 | Keep "Context" in English when referring to core concept / 指代核心概念时保持英文 |
| Personal System Prompt | 个人系统提示词 | Always include PSP abbreviation / 始终包含PSP缩写 |
| Data Sovereignty | 数据自主权 | Core political/technical concept / 核心政治/技术概念 |
| Local-first | 本地优先 | Architecture principle / 架构原则 |
| Knowledge Management | 知识管理 | Common translation / 通用翻译 |
| Inference Engine | 推理引擎 | AI/ML terminology / AI/ML术语 |
| Workflow | 工作流 | Process-related term / 流程相关术语 |

#### Term Consistency Rules / 术语一致性规则
1. **First mention / 首次提及**: Always provide both languages 
   ```
   Personal System Prompt (PSP) / 个人系统提示词 (PSP)
   ```

2. **Subsequent mentions / 后续提及**: Use primary language with abbreviation
   ```
   English docs: PSP system
   Chinese docs: PSP系统
   ```

3. **Technical APIs / 技术API**: Keep English names
   ```
   // Correct / 正确
   const psp = PSPLoader.load("functional_messaging");
   
   // Incorrect / 错误  
   const psp = PSP加载器.load("功能性消息");
   ```

## File Organization / 文件组织

### 1. Bilingual Files / 双语文件
For Category A documents, use single files with bilingual content / A类文档使用单文件双语内容：

```
Documentation/
├── README.md                    # Bilingual / 双语
├── admin-guide/
│   ├── notcontrolOS_ARCHITECTURE.md    # Bilingual / 双语
│   └── Data_Sovereignty_Manifesto.md   # English only / 仅英文
│   └── 数据自主权宣言.md                # Chinese only / 仅中文
```

### 2. Separate Language Files / 分离语言文件
For complex documents, create separate versions when needed / 复杂文档可根据需要创建分离版本：

```
Documentation/
├── developer-guide/
│   ├── getting-started.md       # Bilingual / 双语
│   ├── advanced-topics.en.md    # English version / 英文版
│   └── advanced-topics.zh.md    # Chinese version / 中文版
```

### 3. Code Documentation / 代码文档
```typescript
/**
 * Context Window Manager / 上下文窗口管理器
 * 
 * Manages the context window for LLM inference, ensuring optimal
 * context utilization while maintaining performance.
 * 
 * 管理LLM推理的上下文窗口，确保在保持性能的同时优化上下文利用率。
 */
interface ContextWindowManager {
  // Core methods should have bilingual comments / 核心方法应有双语注释
  
  /**
   * Load context for inference / 为推理加载上下文
   * @param contextId Context identifier / 上下文标识符
   * @returns Promise<Context> / 返回Promise<Context>
   */
  loadContext(contextId: string): Promise<Context>;
}
```

## Quality Assurance / 质量保证

### 1. Review Process / 审查流程

#### Language Quality Checks / 语言质量检查
**English**:
- Native or fluent English speaker review
- Technical accuracy verification
- Consistency with project terminology

**中文**:
- 中文母语或流利使用者审查
- 技术准确性验证
- 项目术语一致性检查

#### Cross-Language Consistency / 跨语言一致性
- Ensure both versions convey the same meaning / 确保两个版本传达相同含义
- Verify technical details match exactly / 验证技术细节完全匹配
- Check for cultural adaptation where appropriate / 适当检查文化适应性

### 2. Maintenance Guidelines / 维护指南

#### Update Synchronization / 更新同步
1. **Simultaneous updates / 同步更新**: When updating bilingual documents, update both languages simultaneously / 更新双语文档时，同时更新两种语言

2. **Version tracking / 版本追踪**: Use git to track language-specific changes / 使用git追踪特定语言的变更

3. **Review requirements / 审查要求**: All bilingual changes require review by speakers of both languages / 所有双语变更需要两种语言使用者的审查

#### Tools and Automation / 工具和自动化
- **Linting / 检查工具**: Use markdown linters to ensure consistent formatting / 使用markdown检查工具确保格式一致
- **Translation memory / 翻译记忆库**: Maintain glossary of technical terms / 维护技术术语词汇表
- **Automated checks / 自动检查**: CI/CD pipelines should verify bilingual format compliance / CI/CD流水线应验证双语格式合规性

## Implementation Guidelines / 实施指南

### 1. Migration Strategy / 迁移策略

#### Phase 1: Core Documents / 第一阶段：核心文档
- Convert existing English-only documents to bilingual format / 将现有纯英文文档转换为双语格式
- Prioritize README, architecture, and getting started guides / 优先处理README、架构和入门指南

#### Phase 2: Developer Documentation / 第二阶段：开发者文档
- Add Chinese translations to API documentation / 为API文档添加中文翻译
- Create bilingual developer tutorials / 创建双语开发者教程

#### Phase 3: Community Documentation / 第三阶段：社区文档
- Translate governance and contribution guidelines / 翻译治理和贡献指南
- Establish bilingual community communication channels / 建立双语社区沟通渠道

### 2. Contributor Guidelines / 贡献者指南

#### For English Contributors / 英文贡献者指南
- When creating new documentation, include placeholder Chinese sections / 创建新文档时，包含中文占位符章节
- Mark sections that need translation with `[需要中文翻译]` / 用`[需要中文翻译]`标记需要翻译的章节
- Request Chinese language review for bilingual contributions / 为双语贡献请求中文语言审查

#### For Chinese Contributors / 中文贡献者指南  
- When creating new documentation, include placeholder English sections / 创建新文档时，包含英文占位符章节
- Mark sections that need translation with `[Needs English Translation]` / 用`[Needs English Translation]`标记需要翻译的章节
- Request English language review for bilingual contributions / 为双语贡献请求英文语言审查

### 3. Exception Handling / 异常处理

#### Temporary Single-Language Content / 临时单语言内容
When immediate bilingual content is not feasible / 当无法立即提供双语内容时：

```markdown
## Section Title / 章节标题

**English**: Full English content here.

**中文**: [此章节的中文翻译正在进行中 / Chinese translation in progress]

或者 / Or:

**English**: [English translation in progress / 英文翻译正在进行中]

**中文**: 完整的中文内容在这里。
```

## Success Metrics / 成功指标

### Documentation Coverage / 文档覆盖率
- **Target / 目标**: 90% of Category A documents fully bilingual / 90%的A类文档完全双语化
- **Measurement / 测量**: Automated scripts to check bilingual compliance / 自动化脚本检查双语合规性

### Community Engagement / 社区参与度
- **Target / 目标**: Balanced participation from English and Chinese speaking contributors / 英文和中文贡献者的平衡参与
- **Measurement / 测量**: Track contributor demographics and contribution languages / 追踪贡献者人口统计和贡献语言

### Translation Quality / 翻译质量
- **Target / 目标**: Professional-grade translations for all technical content / 所有技术内容的专业级翻译
- **Measurement / 测量**: Regular native speaker reviews and feedback / 定期的母语使用者审查和反馈

---

## Appendix: Template Examples / 附录：模板示例

### Bilingual README Template / 双语README模板
```markdown
# Project Name / 项目名称

**English**: Brief project description in English.

**中文**: 项目的中文简要描述。

## Quick Start / 快速开始

### Installation / 安装

```bash
# Install dependencies / 安装依赖
npm install
```

**English**: Follow these steps to install the project.

**中文**: 按照以下步骤安装项目。
```

### Bilingual API Documentation Template / 双语API文档模板
```markdown
## API Reference / API 参考

### `functionName()` / `函数名()`

**English**: Function description and usage.

**中文**: 函数描述和用法。

#### Parameters / 参数
- `param1` (string): Parameter description / 参数描述
- `param2` (boolean): Parameter description / 参数描述

#### Returns / 返回值
**English**: Description of return value.

**中文**: 返回值描述。
```

---

**Document Version / 文档版本**: 1.0.0  
**Last Updated / 最后更新**: 2025-01-24  
**Maintained by / 维护者**: notcontrolOS Documentation Team / notcontrolOS文档团队 
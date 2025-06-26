# notcontrolOS 核心数据定义

本文档定义了 notcontrolOS 知识管理框架中的核心数据概念，包括原始物料 (`LibraryItem`)、结构化知识产出 (`StructuredKnowledge`)，以及进一步萃取的知识单元 (`KnowledgeBlock`)。

## 设计原则

本数据结构设计遵循notcontrolOS的核心原则：
- **开放性**: 支持多种知识管理模式和实现
- **可扩展性**: 允许第三方定制和扩展
- **标准化**: 提供清晰的接口和数据格式规范
- **互操作性**: 确保不同实现间的数据互通

## 1. LibraryItem (原始物料)

`LibraryItem` 是用户导入或收集的原始信息物料，作为知识管理流程的起点。

**核心属性:**

*   `id`: String (UUID)，唯一标识符。
*   `title`: String，物料标题或名称。
*   `type`: Enum，物料类型 (如: 'webpage', 'pdf', 'image', 'video', 'audio', 'text', 'code')。
*   `content`: Object，包含原始内容的结构化表示。
*   `source`: Object，来源信息 (URL、文件路径、导入方式等)。
*   `metadata`: Object，元数据信息 (创建时间、修改时间、大小、格式等)。
*   `processingStatus`: Enum，处理状态 ('pending', 'processing', 'completed', 'failed')。

**核心特性:**

*   支持多种媒体类型和数据格式
*   保持原始内容的完整性和可追溯性
*   不同类型的 `LibraryItem` 会有不同的预处理工作流，目标是将其内容转换为适合进行知识结构化提取的中间形态（通常是规范化的 Markdown 文本）。
*   `LibraryItem` 本身作为原始物料被存储，其处理后的结构化数据将作为派生产物单独管理。

## 2. StructuredKnowledge (结构化知识产出)

`StructuredKnowledge` 是对一个 `LibraryItem` 进行标准化处理和知识要素提取后的直接产物，代表了对原始物料的第一次结构化理解。

**核心构成 (基于通用知识管理要素):**

*   `id`: String (UUID)，唯一标识符。
*   `sourceItemId`: String (UUID)，关联的 `LibraryItem` ID。
*   `summary`: String，物料的核心摘要或最重要的内容概述。
*   `content`: String (Markdown/Rich Text)，规范化的内容表示、提取的关键信息集合或初步的结构化笔记。
*   `references`: Array of Objects (Optional)，结构化的来源、引用信息（如原始URL、相关文件路径、内部链接等）。
*   `tags`: Array of Strings/Objects (Optional)，提取或推荐的分类标签。
*   `accessControl`: Object (Optional)，访问控制信息。
*   `processedContentVersion`: String (Optional)，指向用于生成此结构化知识的 `LibraryItem` 内容的特定版本。
*   `processingMetadata`: Object，处理过程的元数据 (处理时间、使用的算法、置信度等)。

**核心特性:**

*   每个 `LibraryItem` 在成功处理后，应有其对应的 `StructuredKnowledge`。
*   采用标准化的知识表示格式，便于后续处理和查询。
*   它存储在知识库中，与原始 `LibraryItem` 分离但保持关联。

## 3. KnowledgeBlock (知识单元)

`KnowledgeBlock` 是从 `StructuredKnowledge` 中进一步萃取、提炼或由用户独立创建的更细粒度、更原子化的知识单元。它是 notcontrolOS 中进行深度知识管理和应用的核心。

**核心结构 (基于通用知识管理原则):**

*   `id`: String (UUID)，唯一标识符。
*   `type`: Enum，知识块类型 ('concept', 'fact', 'procedure', 'insight', 'question', 'reference')。
*   `title`: String，知识块的核心主题或标题。
*   `content`: String (Markdown/Rich Text)，知识块的详细内容、解释或扩展信息。
*   `references`: Array of Objects，来源、引用或关联信息。可以链接到其他 `KnowledgeBlock`、`LibraryItem` (通过其 `StructuredKnowledge`)、外部URL等。
*   `tags`: Array of Strings/Objects，用于分类和组织知识块的标签。
*   `accessControl`: Object，定义知识块的访问权限控制信息。
*   `metadata`: Object，创建时间、修改时间、使用频率、质量评分等元信息。

**关联关系:**

*   `sourceStructureId`: UUID (Optional)，如果此知识块是从某个 `StructuredKnowledge` 萃取而来，则记录源结构的ID。
*   `derivationPath`: String/JSON (Optional)，描述此 `KnowledgeBlock` 是如何从源结构（或另一个 `KnowledgeBlock`）萃取出来的路径或逻辑。
*   `relatedBlocks`: Array of Objects，与其他知识块的关联关系 (type: 'similar', 'contradicts', 'extends', 'requires')。

**核心特性:**

*   一个 `StructuredKnowledge` 可以被萃取成多个 `KnowledgeBlock`。
*   `KnowledgeBlock` 可以独立存在，也可以与其他块形成知识网络。
*   支持多种知识关联模式和查询方式。

## 4. 数据流程

整个数据处理流程遵循以下模式：

1. **导入阶段**: 用户导入或收集原始物料 → 创建 `LibraryItem`
2. **处理阶段**: 系统对 `LibraryItem` 进行自动化或半自动化处理 → 生成 `StructuredKnowledge`
3. **萃取阶段**: 从 `StructuredKnowledge` 中提取或用户创建 → 多个 `KnowledgeBlock`
4. **应用阶段**: 基于 `KnowledgeBlock` 进行知识检索、关联、推理等应用

## 5. 接口兼容性

本数据结构设计确保与notcontrolOS知识管理接口 (`KnowledgeInterface.ts`) 完全兼容，支持：

- 多种知识管理实现的插拔
- 标准化的数据交换格式
- 统一的查询和操作接口
- 可扩展的元数据和属性系统

## 总结

通过这种分层的数据架构设计，notcontrolOS提供了一个灵活、可扩展的知识管理基础设施，既保持了数据处理的标准化，又允许不同的知识管理实现在此基础上构建个性化的功能和体验。
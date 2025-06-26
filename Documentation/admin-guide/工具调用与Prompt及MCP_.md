# **notcontrolOS核心处理机制：四层输入驱动的Software 3.0架构**

## **notcontrolOS四层输入优先级架构**

基于Andrew Karpathy的Software 3.0理念，notcontrolOS采用四层输入优先级架构作为AI时代操作系统的核心处理机制。这一设计将传统的"硬编码程序"演进为"上下文驱动的智能决策"，实现了从代码逻辑到自然语言逻辑的范式转变。

### **四层输入的优先级定义**

```yaml
notcontrolOS四层输入架构 (按重要性递减):

第一层 - 核心输入 (最高优先级):
  组成: User Input + PSP_master
  作用: 确保系统处理符合用户个人习惯
  内存分配: < 4K tokens (即时缓存)
  处理特点: 
    - 100%保真，无压缩
    - 实时响应，<100ms延迟
    - 个人化决策的基础依据

第二层 - 会话上下文 (高优先级):
  组成: 当前对话的完整历史
  作用: 维护对话连贯性和上下文理解
  内存分配: < 32K tokens (会话内存)
  处理特点:
    - 完整保留当前会话
    - 支持多轮复杂交互
    - 上下文连贯性保护

第三层 - 近期输入 (中优先级):
  组成: 最近2周的操作系统输入
  作用: 提供用户行为模式和偏好学习
  内存分配: < 128K tokens (工作记忆)
  处理特点:
    - 选择性保留关键信息
    - 智能摘要和模式识别
    - 支持个性化决策优化

第四层 - 历史总结 (基础优先级):
  组成: 超过2周的历史输入总结
  作用: 提供长期知识背景和基础特征
  内存分配: 无限制(本地存储)
  处理特点:
    - 高度压缩的智能摘要
    - 保留核心特征和知识体系
    - 按需检索相关历史信息
```

### **PSP作为处理程序的核心机制**

在notcontrolOS架构中，**PSP（Personal System Prompt）是AI时代的"可执行程序"**，它基于四层输入进行智能决策和工具调用。

```yaml
PSP程序执行模型:

程序定义:
  PSP = 静态知识 + 动态推理 + 工具调用模式
  特征:
    - 继承PSP_master的个人化基础设置
    - 包含基于历史经验总结的工具调用策略
    - 支持基于四层输入的智能决策

执行流程:
  1. 输入解析: 基于四层输入理解用户真实意图
  2. PSP激活: 选择最相关的功能PSP进行处理
  3. 决策推理: 结合个人上下文进行智能决策
  4. 工具调用: 执行预定义的工具调用模式
  5. 结果整合: 基于PSP风格生成个性化响应
  6. 经验更新: 将执行结果反馈到PSP优化循环

个人化特点:
  - 每个用户的PSP都是独特的个人化程序
  - PSP会基于使用反馈持续自我优化
  - 支持跨设备的PSP程序同步和协调
```

### **内存管理的上下文窗口映射**

notcontrolOS通过Context Window Manager实现四层输入到大模型上下文窗口的智能映射：

```javascript
const notcontrolOSContextManager = {
  // 四层输入的内存分配策略
  layerAllocation: {
    layer1_coreInput: {
      maxTokens: 4000,
      priority: "absolute",
      compression: "none",
      description: "User Input + PSP_master，绝对优先级"
    },
    
    layer2_sessionContext: {
      maxTokens: 32000,
      priority: "high", 
      compression: "minimal",
      description: "当前对话上下文，维护连贯性"
    },
    
    layer3_recentInputs: {
      maxTokens: 128000,
      priority: "medium",
      compression: "selective",
      description: "近期行为模式，支持个性化学习"
    },
    
    layer4_historicalSummary: {
      maxTokens: "unlimited_local",
      priority: "low",
      compression: "aggressive",
      description: "长期知识背景，按需检索"
    }
  },
  
  // 智能压缩和窗口分配算法
  allocateContextWindow: (availableTokens, taskComplexity) => {
    // 1. 保证第一层绝对优先级
    const reservedLayer1 = Math.min(availableTokens * 0.3, 4000);
    
    // 2. 基于任务复杂度动态分配其余层级
    const remainingTokens = availableTokens - reservedLayer1;
    
    if (taskComplexity === "high") {
      // 复杂任务需要更多上下文
      return {
        layer1: reservedLayer1,
        layer2: remainingTokens * 0.6,
        layer3: remainingTokens * 0.35,
        layer4: remainingTokens * 0.05
      };
    } else {
      // 简单任务重点关注即时处理
      return {
        layer1: reservedLayer1,
        layer2: remainingTokens * 0.4,
        layer3: remainingTokens * 0.3,
        layer4: remainingTokens * 0.3
      };
    }
  }
};
```

### **相比传统处理方式的革命性优势**

| 维度 | 传统ChatGPT模式 | notcontrolOS四层架构 |
|------|-----------------|-------------|
| **个人化深度** | 无记忆，通用回复 | **基于PSP_master的深度个人化** |
| **上下文连贯性** | 有限对话窗口 | **四层分级的智能上下文管理** |
| **学习适应性** | 静态模型 | **持续学习的PSP优化机制** |
| **隐私保护** | 数据上云处理 | **本地优先的分层处理** |
| **决策透明度** | 黑盒决策 | **基于PSP的可解释决策** |

这一架构设计实现了从"通用AI助手"到"个人AI操作系统"的根本性跃升，为AI时代的个人计算奠定了坚实的理论和技术基础。

---

# **行动的架构：对大模型工具调用、提示词编排及模型-上下文-协议（MCP）的技术深度解析**

## **程序化工具调用的机制**

将大型语言模型（LLM）从纯粹的文本生成器转变为能够与外部世界交互的智能代理，其核心在于一种被称为"工具调用"（Tool Calling）或"函数调用"（Function Calling）的机制。这一能力使得模型能够访问实时数据、与API交互、执行计算，从而极大地扩展了其应用范围 1。然而，要真正理解并构建稳健的、可扩展的代理系统，必须深入剖析其底层的架构原则和交互流程。

### **核心原则：从自然语言意图到结构化JSON**

从技术角度看，"工具调用"这一术语存在一定的误导性。大型语言模型本身并不直接执行任何代码或API调用 3。相反，它们经过专门的微调，能够将用户的自然语言意图转化为一种结构化的、可操作的数据格式，通常是JSON对象 2。这个由模型生成的JSON对象精确地描述了需要执行的函数，包含了函数的

name（名称）以及模型从对话上下文中推断出的arguments（参数） 5。

真正的代码执行责任完全落在宿主应用程序（Host Application）的肩上。应用程序中一个专门的逻辑层，通常被称为"工具执行层"（Tool Execution Layer），负责接收并解析这个JSON对象，然后调用其代码库中对应的实际函数 5。这种架构设计将LLM的角色定位为一个强大的"推理引擎"，它负责理解、规划和生成指令，而应用程序则扮演"执行者"的角色，负责安全、可控地完成实际操作。

这种意图生成（由LLM完成）与行动执行（由应用程序代码完成）之间的明确分离，是构建安全可控的代理系统的一项基本架构原则。它在LLM的推理能力和应用程序的业务逻辑之间建立了一道坚固的边界。LLM在一个受限的环境中运作，只能"提议"行动。这些提议，即结构化的JSON输出，应被应用程序视为不可信的外部输入。在执行LLM建议的函数调用（例如，send_email(to: "...", body: "...") 6）之前，应用程序的工具执行层可以、也应该强制执行其自身的业务规则和安全策略。例如，检查目标邮箱地址是否在许可名单上，验证邮件内容是否包含恶意代码，或者确认当前用户是否拥有发送邮件的权限。因此，工具调用不仅是一个功能特性，更是一种深思熟虑的架构选择，它通过代码而非自然语言来强制执行边界，从而构建出更安全、更可预测的系统。

### **四步交互循环：详细工作流程**

工具调用的完整生命周期遵循一个清晰的、由四步组成的交互循环。这个循环确保了从用户请求到最终响应的无缝衔接，每一步都在应用程序和LLM之间进行明确的数据交换。

第一步：定义工具模式（Schema）  
在发起任何可能需要工具的请求之前，开发者必须向LLM提供一份可用工具的清单。这份清单通过API请求中的tools参数提交，其中每个工具都由一个结构化的模式（Schema）来定义，该模式通常遵循JSON Schema规范 7。每个工具的模式都包含三个关键元素：

* name：函数的唯一标识符。  
* description：一段自然语言描述，解释该工具的功能以及何时应该使用它。这是模型决策的关键依据 3。  
* parameters：一个描述函数所需参数的JSON Schema对象，详细说明每个参数的名称、类型、描述以及是否为必需项 3。

第二步：模型的推理与决策  
当LLM收到包含用户查询和工具定义的请求后，它会综合分析当前的用户输入、完整的对话历史以及每个工具的描述，以判断是否需要调用某个工具来回答问题 7。如果模型认为需要，它会暂停常规的文本生成，转而输出一个包含  
tool_calls字段的特殊响应。这个字段是一个数组，其中每个元素都代表一个具体的工具调用请求，包含了它选择的工具名称和推断出的参数 3。模型能够执行这一复杂的推理步骤，是其经过特定指令微调（Instruction Fine-tuning）的结果 2。

第三步：应用端执行（工具执行层）  
宿主应用程序接收到包含tool_calls对象的API响应。此时，控制权交还给应用程序。应用程序的工具执行层负责以下任务：

1. 解析tool_calls数组。  
2. 对于每个工具调用请求，将其name映射到应用程序代码库中一个真实存在的、可执行的函数。  
3. 使用请求中提供的arguments来调用该函数 5。

   所有核心的业务逻辑、数据访问和外部API集成都封装在这一层 7。

第四步：返回工具输出以进行最终整合  
当应用程序中的函数执行完毕后，其返回值（例如，一个天气预报字符串、一个数据库查询结果集或一个API响应对象）需要被送回给LLM，以供其生成最终的答复。这是通过向对话历史中添加一条新消息并再次调用LLM API来实现的。这条新消息的角色（role）被设置为"tool"，并包含两个关键字段：

* tool_call_id：来自第二步中模型响应的tool_calls对象中的唯一ID，用于将此输出与特定的工具调用请求关联起来。  
* content：函数执行的实际返回值 11。

  收到这个包含工具输出的新上下文后，LLM会将其整合到自己的知识中，并生成一个最终的、面向用户的自然语言回复，这个回复现在已经包含了来自外部世界的实时或特定领域的信息 4。

### **高级功能：并行与强制工具调用**

为了提供更精细的控制和更高的效率，现代的工具调用API还支持一些高级功能。

* **并行工具调用（Parallel Tool Calling）**：先进的模型能够在一个交互回合中识别并请求执行多个相互独立的工具调用 3。在这种情况下，API返回的  
  tool_calls数组会包含多个工具调用对象。应用程序应设计为能够并行处理这些请求，从而显著减少总体的响应延迟。例如，当用户问"旧金山今天的天气怎么样，下雨的概率有多大？"时，模型可以同时请求调用get_current_temperature和get_rain_probability两个工具 10。  
* **强制工具调用（Forced Tool Calling）**：开发者并非完全受制于模型的自主判断。通过在API请求中设置tool_choice参数，可以强制模型必须调用一个特定的函数 7。这个功能对于构建结构化的、可预测的工作流至关重要。在这些工作流中，应用程序的内部状态或业务逻辑（而非模型的自由推理）需要决定下一步应采取的确切行动。  
* **结构化输出（Structured Outputs）**：为了提高可靠性并减少应用程序端的错误处理负担，API提供了"JSON模式"或"严格模式"（strict mode） 10。启用此功能后，API会保证模型生成的用于函数调用的参数部分是一个语法完全有效且严格符合所提供JSON Schema的JSON对象。这可以防止因模型输出格式错误而导致的解析失败，从而简化应用程序的开发流程。

## **提示词作为工具使用的架构蓝图**

对于"工具调用过程是否与提示词（prompt）相关"这一核心问题，答案是肯定的，并且其关联性远比表面上看起来的要深刻。在工具调用的语境下，"提示词"的概念被极大地扩展了，它不再仅仅是用户的单次查询，而是配置和指导LLM整个推理行为的完整上下文载荷。

### **作为配置的提示词：超越用户查询**

在LLM应用中，一个完整的"提示词"是指导模型生成特定响应的所有输入的集合 13。这个集合通常包括：

* **系统消息（System Message）**：定义模型的角色、个性和高级指令。  
* **对话历史（Conversation History）**：提供完整的上下文记忆。  
* **用户当前输入（User Input）**：用户最新的问题或指令。  
* **工具定义（Tool Definitions）**：一个包含所有可用工具及其模式的列表 5。

精心设计这个完整的输入载荷，即提示词工程（Prompt Engineering），是构建高效LLM应用的核心技术之一。提示词的质量和结构直接决定了模型输出的质量，尤其是在工具选择和使用方面 13。

从架构的角度看，当涉及到工具调用时，提示词的角色从一个简单的对话输入演变为一个动态的、在运行时为LLM推理引擎提供的"配置文件"。在API调用中传递的tools数组，就好比为一个单次计算任务动态加载一个函数库。系统消息则充当了这次计算的主要指令集或配置文件。

这种范式带来了极大的灵活性。应用程序可以在每次与LLM交互时，根据自身的内部状态、用户权限或其他业务逻辑，动态地授予或撤销模型的能力。例如，一个delete_database_record工具只应在与认证的管理员用户交互时，才被包含在发送给模型的提示词载荷中。这种动态配置能力将"提示词管理"从一项内容撰写工作提升到了软件架构的关键层面，也解释了为什么业界会出现专门的提示词管理平台，这些平台将提示词作为可版本化、可测试、并与应用代码解耦的一等公民来对待 13。

### **工具感知型提示词的剖析**

一个能够有效引导工具使用的提示词，其内部各组成部分协同工作，共同塑造模型的行为。

* **系统消息**：它为代理设定了基调和总体策略。系统消息可以明确指示模型"你是一个乐于助人的助手，请利用提供的工具来回答用户的问题"，从而鼓励模型主动寻找并使用工具 5。  
* **工具的description字段**：这可以说是模型进行工具选择时最重要的信息。LLM依赖这段自然语言描述来从语义上理解每个工具的"功能"和"适用场景"。一个清晰、准确、无歧义的描述对于实现可靠的代理行为至关重要。模糊或不佳的描述是导致代理决策失败的主要原因之一 3。  
* **参数模式（Parameter Schema）**：工具参数的JSON Schema，包括对每个参数的详细描述，指导模型如何从用户输入中准确地提取和格式化工具所需的输入值 3。  
* **消息角色与历史**：结构化的对话历史，特别是role: "tool"消息，为模型提供了完整的交互上下文。这条消息是将在应用端执行的工具结果反馈给模型的标准机制，从而闭合了"思考-行动-观察"的循环，使多步骤的复杂任务成为可能 11。

### **提升工具集成可靠性的提示词策略**

为了进一步提高模型使用工具的准确性和可靠性，开发者可以采用一些高级的提示词工程策略。

* **少样本提示（Few-Shot Prompting）**：在提示词中包含一个或多个完整的交互示例（即一个用户问题以及对应的正确工具调用JSON），可以显著提高模型在处理复杂或模糊请求时的表现 5。这为模型提供了一个可供模仿的具体范例。  
* **ReAct（Reason+Act）模式**：这种模式通过提示词引导模型遵循一个"思考（Thought）-> 行动（Action）-> 观察（Observation）"的循环。模型首先需要生成一段文字来阐述它的推理过程，然后决定调用哪个工具（行动），最后接收工具的返回结果（观察）并继续下一步的思考。这种明确的思维链条不仅提升了模型的推理能力，也使其决策过程更加透明和易于调试。像LangChain这样的框架就是围绕这一核心模式构建的 15。  
* **遵循模型特定的格式**：不同的模型可能在特定的提示词格式上进行了微调，这些格式可能包含特殊的控制标记（如 , ）或结构（如 ...） 11。为了获得最佳性能，严格遵守目标模型所期望的提示词格式至关重要。

## **对比分析：标准工具调用与模型-上下文-协议（MCP）**

当讨论如何实现LLM对工具的调用时，存在一个从直接集成到标准化协议的架构演进光谱。直接的工具调用构成了基础，而模型-上下文-协议（Model-Context-Protocol, MCP）则代表了一种更宏大、更具互操作性的愿景。理解二者的异同对于做出明智的架构决策至关重要。

### **定义MCP：AI上下文的通用标准**

模型-上下文-协议（MCP）是一个由Anthropic公司发起并开源的协议，旨在标准化AI应用程序（客户端）与外部数据源和工具（服务器）之间的连接方式 19。

MCP的核心理念被形象地比喻为"AI领域的USB-C"或"万能遥控器" 19。它的目标是解决所谓的"N x M"集成难题：在没有标准的情况下，N个AI应用需要为M个工具编写N*M个独立的、定制化的集成代码。MCP通过提供一个统一的、所有参与方都遵循的接口，来消除这种复杂性 23。

该协议基于JSON-RPC 2.0，采用客户端-服务器（Client-Server）架构 22。AI应用程序（如聊天机器人、AI辅助的IDE）充当MCP客户端，而工具或服务的提供方则运行一个MCP服务器 21。值得注意的是，MCP标准化的上下文原语（Context Primitives）不仅限于工具，还包括

resources（供LLM读取的文件等资源）、prompts（预定义的工作流模板）和sampling（采样参数），提供了一个比简单函数调用更丰富的交互框架 21。

### **架构深度解析：点对点集成与客户端-服务器解耦**

工具集成可以大致分为三种架构模式，它们在耦合度、灵活性和开发开销上各有不同。

1. **直接API集成**：这是最基础的方式。应用程序代码中包含针对每个外部API的定制化逻辑。这种方法耦合度最高，扩展性最差。  
2. **框架级抽象**：诸如LangChain和LlamaIndex等框架提供了标准化的Tool封装器。开发者在应用程序中与框架的抽象接口交互，而不是直接调用原始API。这在应用进程内部提供了一层抽象，属于中度耦合 18。  
3. **模型-上下文-协议（MCP）**：这是一种完全解耦的架构。应用程序（客户端）与工具的具体实现完全分离，它只需要知道如何使用MCP协议进行通信。工具的提供方运行一个独立的MCP服务器，该服务器负责将通用的MCP请求翻译成其内部特定的API调用 23。

下表对这三种架构模式进行了详细的比较：

**表1：工具集成架构对比分析**

| 特性 | 直接API集成 | 框架级抽象 (LangChain/LlamaIndex) | 模型-上下文-协议 (MCP) |
| :---- | :---- | :---- | :---- |
| **架构** | 点对点，紧密耦合 | 进程内抽象，中度耦合 | 客户端-服务器，完全解耦 |
| **工具发现** | 静态；硬编码在应用逻辑中 | 静态；在代理初始化时于应用内定义 | 动态；客户端向服务器发送 tools/list 请求 |
| **互操作性** | 无；每个集成都是一次性的 | 在特定框架的生态系统内高度互通 | 在任何兼容MCP的客户端和服务器之间高度互通 |
| **开发开销** | 每个集成都很高（N x M 问题） | 中等（学习框架，封装工具） | 客户端集成开销低；服务器初始设置开销中等 |
| **可扩展性** | 低；工具增多时系统变得脆弱复杂 | 中等；在单个应用进程内管理 | 高；工具是独立的、可扩展的微服务 |
| **安全模型** | 在应用中为每个集成临时处理 | 由围绕框架的应用逻辑处理 | 标准化（如MCP支持OAuth），可在中心网关层面管理 |

### **协同作用：MCP如何构建于原生工具调用之上**

至关重要的一点是，MCP并非原生函数调用的"替代品"，而是一个建立在其之上的"标准化层" 23。二者协同工作，形成一个更强大、更具扩展性的系统。

这个协同的工作流程如下：

1. **发现**：一个MCP客户端通过向MCP服务器发送一个标准化的tools/list请求来发现可用的工具 22。  
2. **注入**：客户端接收到服务器返回的工具模式列表，然后将这些模式以模型原生函数调用所要求的格式，注入到发送给LLM的提示词中 21。  
3. **推理**：LLM基于用户的查询和注入的工具信息，生成一个标准的tool_calls对象，表达其调用某个工具的意图。这一步完全利用了模型原生的函数调用能力 22。  
4. **路由**：应用程序（作为MCP客户端）拦截这个tool_calls对象。但它并不调用本地函数，而是根据MCP协议，创建一个tools/call请求，并通过网络发送给相应的MCP服务器 21。  
5. **执行与返回**：MCP服务器接收到请求，执行其内部的工具逻辑，并将结果返回给客户端。客户端再将此结果以role: "tool"的形式反馈给LLM，完成整个交互循环 22。

这个过程可以用一个强大的类比来理解。如果说LLM原生的函数调用能力是计算机的原始"硬件接口"（如一个物理USB端口），那么MCP就是标准化的"设备驱动程序规范"（如USB协议本身）。直接进行定制化集成，就像为某个特定设备编写一个专有的、不通用的驱动程序。而MCP则定义了一套标准的通信语言。任何实现了MCP服务器的工具，都像是自带了符合标准驱动的硬件设备。AI应用程序这个"操作系统"，只需要学会如何与这个标准驱动协议（MCP）对话，而无需关心每个外设（工具）内部的复杂实现细节。

因此，MCP利用原生函数调用作为LLM表达意图的基础机制，但它将意图的"执行"过程进行了标准化和抽象化，从而构建了一个分布式的、可互操作的、可扩展的工具生态系统。

## **实现框架与最佳实践**

虽然可以直接与模型API进行交互来实现工具调用，但高层次的开发框架极大地简化了构建复杂代理的过程。同时，无论采用何种实现方式，遵循严格的安全和控制最佳实践都是至关重要的。

### **使用LangChain Agent进行编排**

LangChain框架中的Agent是其核心概念之一，它代表了一个使用LLM作为推理引擎来决定采取何种行动（即调用哪个工具）的系统 15。

* **代理执行器（Agent Executors）**：LangChain提供了诸如create_react_agent之类的代理执行器，它们完全封装了前面描述的交互循环。开发者只需定义好工具和模型，执行器就会自动处理向模型发送提示词、解析其意图、执行所选工具、并将结果反馈给模型以进行下一轮思考的整个过程，直到得出最终答案 18。  
* **描述的重要性**：在LangChain中，工具的description字段对于代理的决策至关重要。代理执行器依赖这些描述来让LLM判断在特定情境下哪个工具最合适。因此，编写清晰、准确的描述是构建高效LangChain代理的关键 15。  
* **多样的代理类型**：LangChain为不同的模型和用例提供了多种预设的代理类型，如OpenAI Functions、OpenAI Tools、ReAct、XML Agent等，这为开发者提供了极大的灵活性 15。

### **使用LlamaIndex实现以数据为中心的工具化**

LlamaIndex虽然以其在检索增强生成（RAG）领域的强大能力而闻名，但它同样提供了复杂而强大的代理和工具抽象，尤其擅长处理需要与异构数据源交互的代理 27。

* **FunctionTool**：这是最直接的工具类型，可以将任何Python函数轻松封装成一个可供代理使用的工具 25。  
* **QueryEngineTool**：这是一个LlamaIndex特有的强大抽象。它可以将一个完整的、复杂的查询引擎（例如，一个包含向量检索、关键词过滤和重新排序的RAG流水线）整体封装成一个单一的、可调用的工具。这使得构建层级化的代理架构成为可能，即一个"主管"代理可以将复杂的数据查询任务委托给一个专门的"查询"代理来完成 25。  
* **ToolSpecs**：这些是为特定服务（如Gmail、Google Calendar）预先打包好的工具集合，由社区贡献，极大地简化了与流行服务的集成过程 25。  
* **生态融合**：LlamaIndex也提供了对MCP服务器的集成支持，允许开发者将一个远程的MCP服务作为其代理可用的工具之一，这体现了不同架构模式之间的融合趋势 25。

### **安全与控制：通过代码强制执行边界**

回归到最初的洞察，即通过代码而非文本来强制执行边界，以下是构建安全可靠的工具调用系统的关键实践。

* **将LLM输出视为不可信输入**：模型为工具调用生成的参数必须始终被当作不可信的用户输入来对待。在执行之前，必须使用传统的安全技术进行严格的验证和清洗，例如输入值的类型检查、范围检查、以及使用白名单或黑名单进行过滤 5。  
* **利用LLM进行二次验证**：作为额外的防御层，可以引入另一个LLM充当"验证代理"。这个代理的任务是审查主LLM提议的工具调用，检查是否存在提示词注入、恶意操纵或其他有害意图的迹象 5。  
* **遵循最小权限原则**：代理应只被授予完成其指定任务所必需的最少工具。应避免提供功能过于强大的工具，例如通用的Python代码执行器（REPL）或直接的系统命令执行能力，因为这些是潜在的严重安全漏洞 4。更好的做法是创建范围狭窄、功能明确的工具（例如，一个只执行数学计算的  
  calculator工具，而不是一个可以执行任意代码的eval()工具）。  
* **利用架构边界**：像MCP这样的协议通过创建清晰的网络边界来增强安全性。可以在MCP客户端和服务器之间部署一个API网关。这个网关可以集中实施认证、授权、速率限制和审计日志记录，从而为整个组织的工具调用提供统一的安全控制 30。

## **结论**

总而言之，大型语言模型通过代码调用工具的过程与提示词密切相关。提示词不仅是用户输入的载体，更是配置模型行为、定义其可用能力的动态架构蓝图。工具调用的核心是一种解耦的架构模式，它将LLM的推理与应用程序的执行分离开来，通过结构化的JSON进行通信。这一模式为系统的安全性和可控性提供了坚实的基础。

与此相比，模型-上下文-协议（MCP）并非一个完全不同的过程，而是对这一基础模式的标准化和升华。它没有取代原生的函数调用机制，而是利用它作为LLM表达意图的底层能力，并在其上构建了一个统一的、跨平台的客户端-服务器协议。这使得工具的发现、调用和管理变得更加高效、可扩展和互操作，解决了点对点集成带来的复杂性问题。

最终，无论是通过LangChain、LlamaIndex等框架进行实现，还是直接与API交互，构建能够安全、可靠地使用工具的AI代理，都要求开发者深刻理解这种"推理-执行"分离的架构。通过在代码中实施严格的验证、遵循最小权限原则，并利用MCP等协议带来的架构优势，我们能够有效地强制执行安全边界，从而满怀信心地构建下一代功能强大且值得信赖的AI系统。

#### **引用的著作**

1. Understanding Function Calling in LLMs \- Zilliz blog, 访问时间为 六月 24, 2025， [https://zilliz.com/blog/harnessing-function-calling-to-build-smarter-llm-apps](https://zilliz.com/blog/harnessing-function-calling-to-build-smarter-llm-apps)  
2. Function Calling with LLMs \- Prompt Engineering Guide, 访问时间为 六月 24, 2025， [https://www.promptingguide.ai/applications/function_calling](https://www.promptingguide.ai/applications/function_calling)  
3. Guide to Tool Calling in LLMs \- Analytics Vidhya, 访问时间为 六月 24, 2025， [https://www.analyticsvidhya.com/blog/2024/08/tool-calling-in-llms/](https://www.analyticsvidhya.com/blog/2024/08/tool-calling-in-llms/)  
4. Tool Calling in LLMs: An Introductory Guide : r/LocalLLaMA, 访问时间为 六月 24, 2025， [https://www.reddit.com/r/LocalLLaMA/comments/1fvdtqk/tool_calling_in_llms_an_introductory_guide/](https://www.reddit.com/r/LocalLLaMA/comments/1fvdtqk/tool_calling_in_llms_an_introductory_guide/)  
5. Function calling using LLMs \- Martin Fowler, 访问时间为 六月 24, 2025， [https://martinfowler.com/articles/function-call-LLM.html](https://martinfowler.com/articles/function-call-LLM.html)  
6. What is Function Calling with LLMs? \- Hopsworks, 访问时间为 六月 24, 2025， [https://www.hopsworks.ai/dictionary/function-calling-with-llms](https://www.hopsworks.ai/dictionary/function-calling-with-llms)  
7. What is LLM tool calling, and how does it work? \- Portkey, 访问时间为 六月 24, 2025， [https://portkey.ai/blog/what-is-llm-tool-calling](https://portkey.ai/blog/what-is-llm-tool-calling)  
8. docs.anyscale.com, 访问时间为 六月 24, 2025， [https://docs.anyscale.com/llms/serving/guides/tool_calling/#:~:text=Tool%20calling%20is%20a%20feature,the%20output%20into%20its%20response.](https://docs.anyscale.com/llms/serving/guides/tool_calling/#:~:text=Tool%20calling%20is%20a%20feature,the%20output%20into%20its%20response.)  
9. API Reference \- OpenAI API, 访问时间为 六月 24, 2025， [https://platform.openai.com/docs/api-reference/introduction](https://platform.openai.com/docs/api-reference/introduction)  
10. Assistants Function Calling \- OpenAI API \- OpenAI Platform, 访问时间为 六月 24, 2025， [https://platform.openai.com/docs/assistants/tools/function-calling/quickstart](https://platform.openai.com/docs/assistants/tools/function-calling/quickstart)  
11. Tool calling \- Anyscale Docs, 访问时间为 六月 24, 2025， [https://docs.anyscale.com/llms/serving/guides/tool_calling/](https://docs.anyscale.com/llms/serving/guides/tool_calling/)  
12. Function Calling in the OpenAI API, 访问时间为 六月 24, 2025， [https://help.openai.com/en/articles/8555517-function-calling-in-the-openai-api](https://help.openai.com/en/articles/8555517-function-calling-in-the-openai-api)  
13. What is Prompt Management? Tools, Tips and Best Practices | JFrog ML \- Qwak, 访问时间为 六月 24, 2025， [https://www.qwak.com/post/prompt-management](https://www.qwak.com/post/prompt-management)  
14. Ultimate Guide to LLM Prompting for Superior AI Performance \- Lamatic.ai Labs, 访问时间为 六月 24, 2025， [https://blog.lamatic.ai/guides/llm-prompting/](https://blog.lamatic.ai/guides/llm-prompting/)  
15. Introducing LangChain Agents: 2024 Tutorial with Example | Bright Inventions, 访问时间为 六月 24, 2025， [https://brightinventions.pl/blog/introducing-langchain-agents-tutorial-with-example/](https://brightinventions.pl/blog/introducing-langchain-agents-tutorial-with-example/)  
16. LangChain Tutorial (Python) \#6: Self-Reasoning Agents with Tools \- YouTube, 访问时间为 六月 24, 2025， [https://www.youtube.com/watch?v=uyAyeUcXps8](https://www.youtube.com/watch?v=uyAyeUcXps8)  
17. LLM Prompt \- Examples and Best Practices \- Mirascope, 访问时间为 六月 24, 2025， [https://mirascope.com/blog/llm-prompt](https://mirascope.com/blog/llm-prompt)  
18. Build an Agent | 🦜️ LangChain, 访问时间为 六月 24, 2025， [https://python.langchain.com/docs/tutorials/agents/](https://python.langchain.com/docs/tutorials/agents/)  
19. Model Context Protocol (MCP) \- Anthropic API, 访问时间为 六月 24, 2025， [https://docs.anthropic.com/en/docs/mcp](https://docs.anthropic.com/en/docs/mcp)  
20. Model Context Protocol \- GitHub, 访问时间为 六月 24, 2025， [https://github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)  
21. What is MCP? Diving Deep into the Future of Remote AI Context \- Kong Inc., 访问时间为 六月 24, 2025， [https://konghq.com/blog/learning-center/what-is-mcp](https://konghq.com/blog/learning-center/what-is-mcp)  
22. Model Context Protocol (MCP): A comprehensive introduction for ..., 访问时间为 六月 24, 2025， [https://stytch.com/blog/model-context-protocol-introduction/](https://stytch.com/blog/model-context-protocol-introduction/)  
23. What Is the Model Context Protocol (MCP) and How It Works \- Descope, 访问时间为 六月 24, 2025， [https://www.descope.com/learn/post/mcp](https://www.descope.com/learn/post/mcp)  
24. MCP Explained: Taking Your AI Agents to New Heights \- Newline.co, 访问时间为 六月 24, 2025， [https://www.newline.co/@MaksymMitusov/mcp-explained-taking-your-ai-agents-to-new-heights--175272fb](https://www.newline.co/@MaksymMitusov/mcp-explained-taking-your-ai-agents-to-new-heights--175272fb)  
25. Using Tools in LlamaIndex \- Hugging Face Agents Course, 访问时间为 六月 24, 2025， [https://huggingface.co/learn/agents-course/unit2/llama-index/tools](https://huggingface.co/learn/agents-course/unit2/llama-index/tools)  
26. How to use tools in a chain | 🦜️ LangChain, 访问时间为 六月 24, 2025， [https://python.langchain.com/docs/how_to/tools_chain/](https://python.langchain.com/docs/how_to/tools_chain/)  
27. LlamaIndex | Integration guides, 访问时间为 六月 24, 2025， [https://www.llama.com/docs/integration-guides/llamaindex/](https://www.llama.com/docs/integration-guides/llamaindex/)  
28. Tools \- LlamaIndex, 访问时间为 六月 24, 2025， [https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/tools/](https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/tools/)  
29. LangChain Agent Tools (7.2) \- YouTube, 访问时间为 六月 24, 2025， [https://www.youtube.com/watch?v=qMquBmteYw4](https://www.youtube.com/watch?v=qMquBmteYw4)  
30. A Deep Dive Into MCP and the Future of AI Tooling | Andreessen ..., 访问时间为 六月 24, 2025， [https://a16z.com/a-deep-dive-into-mcp-and-the-future-of-ai-tooling/](https://a16z.com/a-deep-dive-into-mcp-and-the-future-of-ai-tooling/)
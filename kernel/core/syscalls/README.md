# AI工具调用系统 (AI Tool Calling System)

## 概述

AI工具调用系统是notcontrolOS八大核心组件之一，负责管理和执行所有AI工具的调用。该系统基于**四层架构设计**和**PSP增强机制**，实现了本地工具和云端服务的统一管理、智能路由和安全执行。

## 核心架构

### 四层工具调用架构

```yaml
第一层 - 混合意图理解层 (Hybrid Intent Understanding):
  localLLM意图解析:
    - 基于PSP_master的深度意图识别
    - 隐私边界判断和路由决策
    - 简单工具调用的参数推理
    - 上下文连贯性保护
  
  云端大模型协作:
    - 复杂推理任务的意图分解
    - 多步骤工作流的智能规划
    - 跨领域知识的整合分析
    - 创意生成和专业咨询

第二层 - 智能工具路由层 (Intelligent Tool Routing):
  PSP驱动的路由决策:
    路由优先级矩阵:
      1. PSP相关任务 → localLLM + 本地工具
      2. 隐私敏感操作 → 强制本地处理  
      3. 实时响应需求 → 边缘计算优先
      4. 复杂分析任务 → 云端协作 + MCP工具
    
    个性化路由策略:
      - 基于PSP的个人偏好权重
      - 成本-质量-速度的动态权衡
      - 用户历史满意度的学习优化
      - 透明的决策解释和用户干预选项
  
  MCP协议集成:
    标准化接口:
      - JSON-RPC 2.0协议的完整实现
      - 工具发现和能力声明机制
      - PSP增强的参数验证和类型检查
      - 智能错误处理和重试策略

第三层 - 安全执行控制层 (Secure Execution Control):
  三重安全验证:
    PSP级别验证:
      - 用户意图与PSP设置的一致性检查
      - 权限边界和隐私设置的严格验证
      - 个人安全策略的自动执行
    
    系统级别验证:
      - JSON Schema的严格类型检查
      - 业务规则的代码层强制执行
      - 参数边界和格式的安全验证
    
    执行级别监控:
      - 工具执行过程的实时监控
      - 资源使用和性能的动态控制
      - 异常行为的快速检测和响应
      - 完整的审计日志和行为追踪

第四层 - 混合工具实现层 (Hybrid Tool Implementation):
  本地工具生态:
    PSP专用工具:
      - PSP_master管理和优化工具
      - 个人数据处理和隐私计算
      - 本地知识检索和语义搜索
      - 设备控制和传感器访问
    
    系统级工具:
      - 文件系统操作和管理
      - 网络通信和数据传输
      - 硬件控制和状态查询
      - 安全计算和加密处理
  
  云端工具生态:
    MCP标准服务:
      - 第三方API的标准化集成
      - 在线服务和实时信息获取
      - 专业分析和计算工具
      - 创意生成和内容处理
```

## 工具调用完整生命周期

### 四步交互循环

```yaml
第一步: 定义工具模式 (Schema Definition)
  工具清单提供:
    - 通过API请求的tools参数提交
    - 遵循JSON Schema规范的结构化定义
    - 包含name、description、parameters三个关键元素
    - PSP增强的工具选择优先级定义

第二步: 模型推理与决策 (Model Reasoning & Decision)
  混合推理机制:
    localLLM处理:
      - 基于PSP的意图理解和工具预选择
      - 隐私敏感判断和本地工具优先路由
      - 简单工具调用的完整处理流程
    
    云端协作:
      - 复杂推理任务的工具组合规划
      - 多步骤工作流的智能编排
      - 专业工具的深度参数推理
  
  输出格式:
    - 标准tool_calls对象包含工具名称和参数
    - 增强的PSP_context字段包含个人化上下文
    - 路由决策说明和透明度信息

第三步: 应用端执行 (Application Execution)
  工具执行层职责:
    1. 解析tool_calls数组和PSP上下文
    2. 基于PSP权限验证和安全检查
    3. 路由到本地工具或MCP服务器
    4. 执行工具并收集结果和元数据

第四步: 结果整合与学习 (Result Integration & Learning)
  智能结果处理:
    - role: "tool"消息的标准化返回
    - localLLM整合结果和个人上下文
    - 基于PSP风格的个性化响应生成
    - 执行结果反馈到PSP优化循环
```

## 核心优势

### 相比传统工具调用的创新

| 维度 | 传统ChatGPT模式 | Cursor模式 | **notcontrolOS混合架构** |
|------|-----------------|------------|------------------|
| **个人化深度** | 无记忆，通用回复 | 基于代码上下文 | **基于PSP_master的深度个人化** |
| **隐私保护** | 全云端处理 | 全云端处理 | **localLLM本地优先+云端协作** |
| **推理能力** | 依赖单一大模型 | 依赖单一大模型 | **7B本地+云端大模型混合推理** |
| **上下文连贯性** | 有限对话窗口 | 经常丢失(用户痛点) | **四层分级+PSP连贯性保护** |
| **成本效率** | 按Token收费 | 隐藏成本控制 | **本地优先+智能路由优化** |
| **工具生态** | 有限工具集成 | 代码工具专精 | **MCP标准+本地云端混合工具** |

### PSP驱动的工具调用创新

```yaml
传统工具调用限制 vs notcontrolOS PSP驱动解决:
  
  个性化缺失:
    传统问题: 所有用户使用相同的工具调用逻辑
    notcontrolOS解决: 基于PSP的深度个性化工具选择和参数填充
  
  隐私安全风险:
    传统问题: 敏感数据必须上传到云端进行处理  
    notcontrolOS解决: localLLM本地处理隐私敏感的工具调用
  
  推理能力限制:
    传统问题: 单一模型的能力上限限制
    notcontrolOS解决: 混合推理引擎，7B本地+云端大模型协作
  
  上下文丢失:
    传统问题: 工具调用后的上下文连贯性难以保证
    notcontrolOS解决: PSP_master确保跨工具调用的个人上下文连贯性
  
  透明度不足:
    传统问题: 用户不清楚为什么选择某个工具或参数
    notcontrolOS解决: 基于PSP的决策解释和用户可控的工具选择
  
  生态割裂:
    传统问题: 不同平台的工具调用标准不统一
    notcontrolOS解决: MCP协议的扩展实现和标准化工具生态
```

## 技术规范

### 工具定义标准

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
    }>;
    required?: string[];
  };
  metadata: {
    category: 'local' | 'cloud' | 'hybrid';
    privacy_level: 'public' | 'private' | 'sensitive';
    cost_estimate: 'free' | 'low' | 'medium' | 'high';
    latency_expectation: 'realtime' | 'fast' | 'normal' | 'slow';
    required_permissions: string[];
    psp_integration: boolean;
  };
}
```

### 工具调用执行标准

```typescript
interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, any>;
  context: PSPContext;
  metadata: {
    requested_by: 'local_llm' | 'cloud_model';
    priority: 'high' | 'normal' | 'low';
    timeout: number;
    user_id: string;
    session_id: string;
  };
}

interface ToolCallResult {
  id: string;
  status: 'success' | 'error' | 'timeout' | 'permission_denied';
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
    suggestion?: string;
  };
  metadata: {
    execution_time: number;
    cost_incurred: number;
    resources_used: Record<string, any>;
    route_taken: 'local' | 'cloud' | 'hybrid';
  };
}
```

## MCP协议集成

### notcontrolOS增强的MCP实现

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "工具名称",
    "arguments": {
      "标准MCP参数": "值"
    },
    "notcontrolos_extensions": {
      "psp_context": "PSP上下文增强",
      "user_id": "用户标识符",
      "privacy_level": "隐私级别要求",
      "cost_constraints": "成本约束条件",
      "personalization_hints": "个性化提示"
    }
  },
  "id": "请求ID"
}
```

### 工具发现增强

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "result": {
    "tools": [
      {
        "name": "标准MCP工具定义",
        "description": "工具描述",
        "inputSchema": "JSON Schema",
        "notcontrolos_metadata": {
          "psp_compatibility": ["兼容的PSP类型"],
          "personalization_support": true/false,
          "privacy_safe": true/false,
          "cost_model": "成本模型描述",
          "performance_characteristics": "性能特征"
        }
      }
    ]
  }
}
```

## 核心接口

工具调用系统必须实现以下核心接口：

1. **ToolController**: 工具调用的主控制器
2. **IntentRouter**: 意图识别和路由决策
3. **ExecutionEngine**: 工具执行引擎
4. **SecurityValidator**: 安全验证器

详细接口定义请参考：[interfaces/](./interfaces/)

## 安全模型

### 三重安全验证

```yaml
第一重: PSP级别验证
  用户意图验证: 确认操作符合用户真实意图
  权限边界检查: 验证操作在PSP定义的权限范围内
  隐私保护验证: 确保不违反用户隐私设置
  安全策略执行: 应用PSP中定义的安全规则

第二重: 系统级别验证
  参数格式验证: JSON Schema严格验证
  类型安全检查: 参数类型和范围验证
  业务规则验证: 应用层业务逻辑检查  
  沙箱边界确认: 确保操作在安全沙箱内执行

第三重: 执行级别监控
  实时行为监控: 监控工具执行过程中的异常行为
  资源使用控制: 限制工具的资源消耗和访问范围
  审计日志记录: 完整记录工具调用的审计轨迹
  异常快速响应: 检测到异常时的自动中断和恢复
```

## 性能要求

- **工具调用延迟**: 本地工具 < 100ms，云端工具 < 2s
- **并发处理能力**: 支持同时处理10+工具调用
- **错误恢复时间**: < 1s
- **资源使用优化**: 内存使用 < 512MB

## 扩展机制

### 工具插件开发

1. **本地工具插件**: 实现LocalTool接口
2. **MCP服务器**: 遵循MCP协议标准
3. **混合工具**: 结合本地和云端能力

### 社区贡献

- **工具库贡献**: 提交新的工具实现
- **路由算法优化**: 改进智能路由策略
- **安全增强**: 提升安全验证机制
- **性能优化**: 优化执行效率

## 测试套件

- **单元测试**: 各个组件的独立测试
- **集成测试**: 端到端工具调用流程测试
- **性能测试**: 并发和延迟性能验证
- **安全测试**: 权限控制和安全验证测试

## 路线图

### 短期目标 (2025 Q1-Q2)

- [ ] 完善四层架构的核心实现
- [ ] MCP协议的notcontrolOS扩展实现
- [ ] PSP驱动的路由机制优化
- [ ] 安全验证体系的建立

### 中期目标 (2025 Q3-Q4)

- [ ] 丰富的工具生态建设
- [ ] 跨平台工具兼容性
- [ ] 企业级安全和合规
- [ ] 性能优化和扩展性

### 长期愿景 (2026+)

- [ ] 成为AI工具调用的行业标准
- [ ] 支持任意工具的即插即用
- [ ] 完全自动化的工具编排
- [ ] 全球化的工具市场生态

## 相关文档

- [工具调用架构详细说明](./specifications/tool-calling-architecture.md)
- [PSP增强路由规范](./specifications/psp-enhanced-routing.md)
- [安全验证详细规范](./specifications/security-validation.md)
- [MCP协议notcontrolOS扩展](./protocols/mcp-notcontrolos-extension.md)
- [工具发现协议](./protocols/tool-discovery.md) 
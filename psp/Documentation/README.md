# notcontrolOS PSPs (Personal System Prompts) 标准库

## 概述
PSP（Personal System Prompt）是notcontrolOS的核心组件，每个PSP都是一个可执行的个人上下文程序。PSP将传统应用程序的功能转化为AI可理解和执行的自然语言程序，实现AI时代的"Software 3.0"范式。

## PSP标准格式

### 基础结构
```yaml
# PSP标准格式 v1.0
metadata:
  name: "PSP名称"
  version: "1.0.0"
  category: "功能分类"
  description: "PSP功能描述"
  author: "notcontrolOS Core Team"
  created_date: "2025-01-24"
  updated_date: "2025-01-24"
  
system_prompt:
  role: "你是用户的[具体角色]助手"
  context: |
    上下文描述和背景信息
  capabilities: |
    你具备以下能力：
    - 能力1
    - 能力2
  limitations: |
    你的限制包括：
    - 限制1
    - 限制2
    
execution_logic:
  input_processing: |
    输入处理逻辑
  decision_tree: |
    决策树和判断逻辑
  output_format: |
    输出格式规范
    
tools_integration:
  local_tools:
    - tool_name: "工具名称"
      mcp_protocol: "协议版本"
      usage: "使用场景"
  online_services:
    - service_name: "服务名称"
      api_endpoint: "API地址"
      auth_required: true/false
      
privacy_settings:
  data_retention: "数据保留策略"
  sensitive_handling: "敏感信息处理"
  sharing_permissions: "共享权限设置"
  
examples:
  - user_input: "用户输入示例"
    expected_output: "期望输出示例"
    reasoning: "推理过程说明"
```

## PSP分类体系

### 1. 功能PSP (Functional PSPs)
基于传统应用程序功能设计的PSP，对应移动操作系统的常用应用。

### 2. 工作流PSP (Workflow PSPs)  
针对特定工作流程和业务场景设计的复合PSP。

### 3. 个性化PSP (Personalized PSPs)
基于用户行为数据和偏好动态生成的定制PSP。

### 4. 领域PSP (Domain PSPs)
针对特定专业领域（医疗、法律、教育等）的专业PSP。

## 目录结构
```
PSPs/
├── README.md                    # 本文档
├── STANDARD.md                  # PSP标准格式详细规范
├── functional/                  # 功能PSP
│   ├── communication/           # 通讯类
│   ├── productivity/            # 生产力类
│   ├── entertainment/           # 娱乐类
│   ├── utilities/               # 工具类
│   ├── health/                  # 健康类
│   ├── finance/                 # 财务类
│   ├── navigation/              # 导航类
│   └── media/                   # 媒体类
├── workflow/                    # 工作流PSP
├── personalized/                # 个性化PSP模板
├── domain/                      # 领域专业PSP
└── examples/                    # 示例和教程
```

## 使用指南

### 开发新PSP
1. 选择合适的分类目录
2. 复制PSP模板文件
3. 按照标准格式填写内容
4. 测试PSP功能和性能
5. 提交到PSP库

### PSP调用方式
```python
# localLLM调用PSP示例
psp = notcontrolOS.load_psp("functional/communication/messaging")
result = psp.execute(user_intent="发送消息给张三")
```

### 版本控制
- 遵循语义化版本号 (Semantic Versioning)
- 主版本号：不兼容的API修改
- 次版本号：向下兼容的功能新增
- 修订号：向下兼容的问题修正

## 贡献指南
欢迎社区贡献新的PSP或改进现有PSP。请遵循：
1. PSP标准格式要求
2. 代码质量和测试标准
3. 文档完整性要求
4. 隐私和安全准则

---
**维护团队**: notcontrolOS Core Team  
**最后更新**: 2025年1月24日 

# PSP (Personal System Prompt) 体系

## 概述

PSP体系是notcontrolOS的核心创新，实现了Software 3.0的自然语言编程范式。通过分层架构设计，PSP体系能够提供高度个性化的AI交互体验。

## 架构层级

### 1. PSP_master (个人主档案)
- **位置**: `PSP_master.yaml`
- **作用**: 所有PSP的基础上下文，类似Cursor的workspace rules
- **内容**: 个人偏好、沟通风格、行为模式、关系网络等
- **更新**: 通过用户显式设置 + 功能PSP学习反馈

### 2. 功能PSP层
- **位置**: `functional/` 目录
- **作用**: 对应传统应用的核心功能，继承PSP_master设置
- **内容**: 9个核心PSP，专注于需要个性化的功能
- **更新**: 基于用户使用反馈和领域专业知识

### 3. 工作流PSP层 (规划中)
- **位置**: `workflow/` 目录  
- **作用**: 组合多个功能PSP的复杂流程
- **示例**: 晨间例程、会议准备、旅行规划等

### 4. 临时PSP层 (规划中)
- **位置**: `temp/` 目录
- **作用**: 短期任务和实验性功能

## 继承机制

```yaml
# 继承关系示例
消息助手PSP:
  基础上下文: 从PSP_master继承
    - 沟通风格 (正式/轻松/幽默)
    - 响应长度偏好 (简洁/详细)
    - 隐私边界设置
    
  专业化扩展:
    - 消息分类逻辑
    - 回复建议模板
    - 紧急消息处理
```

## PSP适用判断标准

只有满足以下标准的功能才设计为PSP，否则使用标准MCP工具：

1. **个人偏好差异性**: 不同用户有显著不同的使用偏好
2. **上下文依赖性**: 需要结合个人情况做决策  
3. **决策复杂性**: 涉及多因素权衡和个性化判断
4. **学习适应性**: 能够根据使用反馈不断优化

## 核心功能PSP列表

### 需要PSP的功能 (9个)
- [x] **消息助手** - 个性化消息处理和回复建议
- [x] **电话助手** - 来电处理和通话管理
- [x] **日历助手** - 个性化时间管理和会议安排
- [ ] **笔记助手** - 个人知识管理和记录习惯
- [ ] **提醒助手** - 个性化提醒方式和时机
- [ ] **相机助手** - 摄影偏好和照片管理
- [ ] **音乐助手** - 音乐品味和播放习惯
- [ ] **健康助手** - 个人健康数据和目标管理
- [ ] **钱包助手** - 个人财务管理和支付习惯

### 使用标准工具的功能
- 时钟、计算器、天气、手电筒、录音等基础工具

## 开发指南

### 创建新PSP
1. 确认功能符合PSP适用标准
2. 确定功能分类目录
3. 使用标准PSP格式模板
4. 明确声明继承关系
5. 编写使用示例

### PSP文件命名规范
- 功能PSP: `PSP_功能名称_助手.yaml`
- 工作流PSP: `PSP_Workflow_流程名称.yaml`  
- 临时PSP: `PSP_Temp_任务描述.yaml`

### 继承声明格式
```yaml
master_inheritance:
  inherited_from_master:
    - "communication_style"
    - "privacy_settings" 
    - "time_preferences"
  specialized_overrides:
    - "domain_specific_logic"
    - "tool_integrations"
```

## 版本控制

- **PSP_master**: 核心版本，向后兼容
- **功能PSP**: 独立版本控制，支持热更新
- **架构版本**: 遵循语义化版本规范

## 隐私和安全

- **数据分级**: 高敏感信息仅本地处理
- **继承控制**: 功能PSP只能访问授权的master信息
- **更新审计**: 所有PSP更新都有审计日志 
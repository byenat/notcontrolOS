# notcontrolOS PSP System (Personal System Prompt)

> **English**: The PSP system is notcontrolOS's core innovation, transforming personal preferences into AI-understandable Context programs, achieving truly personalized AI
> 
> **中文**: PSP系统是notcontrolOS的核心创新，将个人偏好转化为AI可理解的Context程序，实现真正的个人定制AI

## 🏗️ PSP Layered Architecture / PSP分层架构

### Layer 1: PSP_master (Personal Main Profile) / 第一层：PSP_master (个人主档案)
**English**:
- **Location**: `psp/master/`  
- **Role**: Base context for all PSPs, similar to Cursor's workspace rules  
- **Characteristics**: Basic personalization settings without considering specific scenarios

**中文**:
- **位置**: `psp/master/`  
- **作用**: 所有PSP的基础上下文，类似Cursor的workspace rules  
- **特点**: 不考虑具体场景的基础个人化设置

### Layer 2: Scenario-specific PSPs / 第二层：场景化PSP
#### Functional PSPs / 功能PSP (Functional PSPs)  
**English**:
- **Location**: `psp/functional/`  
- **Role**: Corresponding to traditional application functions, inheriting PSP_master settings  
- **Content**: 9 core PSPs (messaging assistant, calendar assistant, etc.)

**中文**:
- **位置**: `psp/functional/`  
- **作用**: 对应传统应用功能，继承PSP_master设置  
- **内容**: 9个核心PSP（消息助手、日历助手等）

#### Workflow PSPs / 工作流PSP (Workflow PSPs)
**English**:
- **Location**: `psp/workflow/`  
- **Role**: Complex processes combining multiple functional PSPs  
- **Examples**: Morning routines, meeting preparation, travel planning

**中文**:
- **位置**: `psp/workflow/`  
- **作用**: 组合多个功能PSP的复杂流程  
- **示例**: 晨间例程、会议准备、旅行规划

### Layer 3: Temporary PSPs / 第三层：临时PSP (Temporary PSPs)
**English**:
- **Location**: `psp/temporary/`  
- **Role**: Short-term tasks and experimental features  
- **Characteristics**: Context-specific, one-time needs

**中文**:
- **位置**: `psp/temporary/`  
- **作用**: 短期任务和实验性功能  
- **特点**: 情境特定、一次性需求

## 📂 目录结构

```
psp/
├── core/                      # PSP核心系统
│   ├── loader/                # PSP加载器
│   ├── compiler/              # PSP编译器
│   ├── interpreter/           # PSP解释器
│   ├── scheduler/             # PSP调度器
│   ├── learning/              # PSP学习引擎
│   └── validator/             # PSP验证器
│
├── storage/                   # PSP存储管理
│   ├── master/                # PSP_master专门存储
│   ├── functional/            # 功能PSP存储
│   ├── workflow/              # 工作流PSP存储
│   ├── temporary/             # 临时PSP存储
│   └── cache/                 # PSP缓存系统
│
├── runtime/                   # PSP运行时环境
│   ├── context/               # 上下文管理
│   ├── inheritance/           # 继承关系处理
│   ├── execution/             # PSP执行引擎
│   └── monitoring/            # PSP运行监控
│
├── master/                    # PSP_master层 (第一层)
│   ├── base/                  # 基础PSP_master模板
│   ├── profiles/              # 用户个人档案
│   ├── learning/              # 学习数据和模式
│   └── migration/             # PSP_master迁移工具
│
├── functional/                # 功能PSP层 (第二层)
│   ├── communication/         # 通讯功能PSP
│   ├── productivity/          # 生产力功能PSP
│   └── utilities/             # 工具功能PSP
│
├── workflow/                  # 工作流PSP层 (第二层)
│   ├── daily-routines/        # 日常例程
│   ├── meeting-prep/          # 会议准备
│   ├── travel-planning/       # 旅行规划
│   └── project-management/    # 项目管理
│
├── temporary/                 # 临时PSP层 (第三层)
│   ├── experiments/           # 实验性PSP
│   ├── one-time-tasks/        # 一次性任务PSP
│   └── context-specific/      # 情境特定PSP
│
├── interfaces/                # PSP接口层
│   ├── api/                   # PSP标准API
│   ├── mcp/                   # MCP协议集成
│   └── tools/                 # 工具集成接口
│
├── standards/                 # PSP标准规范
│   ├── format/                # PSP格式规范
│   ├── inheritance/           # 继承规范
│   ├── security/              # 安全规范
│   └── compatibility/         # 兼容性规范
│
├── tools/                     # PSP开发工具
│   ├── editor/                # PSP编辑器
│   ├── debugger/              # PSP调试器
│   ├── tester/                # PSP测试器
│   └── migrator/              # PSP迁移工具
│
└── Documentation/             # PSP专门文档
    ├── architecture/          # PSP架构文档
    ├── api-reference/         # API参考文档
    ├── tutorials/             # PSP开发教程
    ├── best-practices/        # 最佳实践
    └── examples/              # PSP示例
```

## 🔄 PSP Inheritance Mechanism / PSP继承机制

**English**: Inheritance relationship example:
```yaml
Inheritance Example:
  PSP_master (Base Context):
    - Personal preference settings
    - Communication style definition
    - Privacy boundary settings
    - Behavior pattern records
    
  ↓ Inherits
  
  Functional PSP (Calendar Assistant):
    - Inherits: Communication style, time preferences
    - Extends: Meeting type preferences, reminder methods
    - Specializes: Schedule conflict handling logic
    
  ↓ Composes
  
  Workflow PSP (Meeting Preparation):
    - Combines: Calendar Assistant + Message Assistant + Note Assistant
    - Process: Check schedule → Prepare materials → Send notifications
    - Personalizes: Customized based on user meeting habits
```

**中文**: 继承关系示例:
```yaml
继承关系示例:
  PSP_master (基础上下文):
    - 个人偏好设置
    - 沟通风格定义
    - 隐私边界设定
    - 行为模式记录
    
  ↓ 继承
  
  功能PSP (日历助手):
    - 继承: 沟通风格、时间偏好
    - 扩展: 会议类型偏好、提醒方式
    - 专业化: 日程冲突处理逻辑
    
  ↓ 组合
  
  工作流PSP (会议准备):
    - 组合: 日历助手 + 消息助手 + 笔记助手
    - 流程: 检查日程 → 准备材料 → 发送通知
    - 个性化: 基于用户会议习惯定制
```

## 🛠️ Usage Guide / 使用指南

### Developing New PSPs / 开发新PSP
**English**:
1. **Determine PSP Layer**: Identify which layer it belongs to (master/functional/workflow/temporary)
2. **Choose Inheritance Base**: Determine which settings to inherit from PSP_master
3. **Use Standard Format**: Follow PSP standard format specifications
4. **Define Tool Integration**: Clarify which MCP tools need to be integrated
5. **Test and Validate**: Use PSP testing tools to verify functionality

**中文**:
1. **确定PSP层级**: 判断属于哪一层（master/functional/workflow/temporary）
2. **选择继承基础**: 确定从PSP_master继承哪些设置
3. **使用标准格式**: 遵循PSP标准格式规范
4. **定义工具集成**: 明确需要集成的MCP工具
5. **测试验证**: 使用PSP测试工具验证功能

### PSP调用示例
```python
# 加载PSP_master
psp_master = notcontrolOS.PSP.load_master(user_id="user123")

# 创建功能PSP实例
calendar_psp = notcontrolOS.PSP.load_functional(
    "calendar", 
    inherit_from=psp_master
)

# 执行PSP
result = calendar_psp.execute(
    user_intent="明天约个重要客户吃饭",
    context=current_context
)
```

## 🔐 安全和隐私

- **分层权限**: 不同层级PSP有不同的访问权限
- **继承控制**: 功能PSP只能访问授权的master信息
- **本地优先**: PSP相关处理优先在本地完成
- **审计日志**: 所有PSP操作都有完整的审计轨迹

## 🚀 开发路线图

### Phase 1: 核心系统 (当前)
- [x] PSP分层架构设计
- [x] 基础目录结构创建
- [ ] PSP加载器开发
- [ ] PSP继承机制实现

### Phase 2: 工具链 
- [ ] PSP编译器开发
- [ ] PSP调试器实现
- [ ] PSP验证器完善
- [ ] 开发工具集成

### Phase 3: 生态建设
- [ ] 标准PSP库扩展
- [ ] 社区贡献流程
- [ ] 第三方PSP市场
- [ ] 性能优化和监控

---

**维护团队**: notcontrolOS Core Team  
**最后更新**: 2025年1月24日

> PSP系统是notcontrolOS实现"Context, Not Control"理念的核心技术，通过将个人偏好转化为Context程序，让每个人都拥有真正的个人AI。 
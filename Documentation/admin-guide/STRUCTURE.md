# notcontrolOS 项目结构文档

## 概述

本文档详细描述了 notcontrolOS (Context, Not Control OS) 项目的完整目录结构、文件组织方式和各组件的功能职责。

## 顶级目录结构

```
notcontrolos/
├── README.md                 # 项目简介和快速开始指南
├── MAINTAINERS              # 维护者信息和代码责任分工
├── MIGRATION_STATUS.md      # 项目重组状态和进度追踪
├── Makefile                 # 主构建脚本
├── Kconfig                  # 内核配置选项
├── arch/                    # 硬件架构相关代码
├── drivers/                 # 设备驱动程序
├── fs/                      # 文件系统实现
├── include/                 # 公共头文件和接口定义
├── kernel/                  # 内核核心功能
├── lib/                     # 系统库和工具函数
├── net/                     # 网络子系统
├── psp/                     # PSP (Personal System Prompt) 系统
├── samples/                 # 示例代码和应用
├── security/                # 安全框架和机制
├── tools/                   # 开发和构建工具
└── Documentation/           # 项目文档
```

## 详细目录结构

### Documentation/ - 项目文档
```
Documentation/
├── README.md               # 文档导航和使用指南
├── admin-guide/           # 管理员和开发者指南
│   ├── MIGRATION_PLAN.md
│   ├── MIGRATION_STATUS.md
│   ├── OPENSOURCE_ROADMAP.md
│   ├── PRD_Core_notcontrolOS_框架定义.md
│   ├── STRUCTURE.md
│   ├── notcontrolOS_CONTEXT_ENGINEERING_ROADMAP.md
│   ├── notcontrolOS_OS_ARCHITECTURE.md
│   ├── 工具调用与Prompt及MCP_.md
│   └── 统一笔记结构设计探讨_.md
├── community/             # 社区治理相关文档
│   └── governance/
│       └── overview.md
└── core/                  # 核心技术文档
    ├── architecture/
    │   └── overview.md
    ├── data-formats/      # 数据格式规范
    │   ├── md-to-json-technical-feasibility.md
    │   ├── migration-compatibility-strategy.md
    │   └── notcontrolos-document-format-specification.md
    └── introduction.md
```

### arch/ - 硬件架构抽象层
```
arch/
├── x86_64/               # x86-64 架构支持
├── arm64/                # ARM64 架构支持
├── riscv/                # RISC-V 架构支持
└── common/               # 通用架构代码
```

### drivers/ - 设备驱动
```
drivers/
├── ai/                   # AI 加速器驱动
│   ├── gpu/             # GPU 驱动 (CUDA, Metal, OpenCL)
│   └── npu/             # NPU 专用驱动
├── input/                # 输入设备驱动
│   ├── voice/           # 语音输入
│   ├── gesture/         # 手势识别
│   └── eye-tracking/    # 眼动追踪
├── storage/              # 存储设备驱动
│   ├── nvme/            # NVMe SSD 驱动
│   └── cloud/           # 云存储接口
└── network/              # 网络设备驱动
    ├── wifi/            # WiFi 连接
    └── bluetooth/       # 蓝牙通信
```

### fs/ - 文件系统
```
fs/
├── knowledge/            # 通用知识管理文件系统
│   ├── README.md
│   ├── data/
│   │   └── PRD_Core_Data_Definitions.md
│   └── interfaces/
│       └── KnowledgeInterface.ts
├── pspfs/               # PSP 文件系统
├── vector/              # 向量数据存储
├── cache/               # 缓存文件系统
└── vfs/                 # 虚拟文件系统层
```

### include/ - 头文件和接口定义
```
include/
├── notcontrolos/                # notcontrolOS 系统头文件
│   ├── core.h          # 核心系统定义
│   ├── ai.h            # AI 接口定义
│   ├── memory.h        # 内存管理
│   ├── session.h       # 会话管理
│   └── syscalls.h      # 系统调用接口
├── psp/                 # PSP 相关头文件
│   ├── format.h        # PSP 格式定义
│   └── runtime.h       # PSP 运行时
└── drivers/             # 驱动程序接口
    ├── ai-device.h     # AI 设备接口
    └── storage.h       # 存储接口
```

### kernel/ - 内核核心
```
kernel/
├── Makefile            # 内核构建配置
├── ai/                 # AI 推理子系统
│   └── inference/
│       └── README.md
├── core/               # 核心功能
│   ├── context/        # 上下文管理
│   │   └── ContextWindowManager.ts
│   ├── execution/      # 执行控制
│   │   └── FlowController.ts
│   ├── prefetch/       # 预取引擎
│   │   └── PrefetchEngine.ts
│   ├── session/        # 会话管理
│   │   ├── README.md
│   │   └── interfaces/
│   │       └── session-manager.interface.ts
│   └── syscalls/       # 系统调用实现
│       ├── README.md
│       ├── MCPIntegration.ts
│       ├── ToolController.ts
│       ├── ToolControllerExample.ts
│       ├── notcontrolOSToolController.ts
│       └── interfaces/
│           ├── MCPIntegration.ts
│           ├── ToolController.ts
│           ├── ToolControllerExample.ts
│           └── notcontrolOSToolController.ts
├── mm/                 # 内存管理
│   ├── context-memory.c
│   └── psp-cache.c
├── sched/              # 调度器
│   ├── ai-scheduler.c
│   └── session-sched.c
└── init/               # 系统初始化
    └── main.c
```

### lib/ - 系统库
```
lib/
├── Makefile            # 库构建配置
├── ai/                 # AI 相关库
│   ├── inference/      # 推理引擎库
│   ├── nlp/           # 自然语言处理
│   └── vector/        # 向量计算库
├── crypto/             # 加密库
│   ├── aes/           # AES 加密
│   └── rsa/           # RSA 加密
├── compress/           # 压缩库
│   ├── context-compress/  # 上下文压缩
│   └── general/       # 通用压缩
└── utils/              # 工具函数
    ├── string/        # 字符串处理
    └── math/          # 数学计算
```

### net/ - 网络子系统
```
net/
├── model_routing/      # AI 模型路由
│   ├── router.c       # 路由核心逻辑
│   └── balancer.c     # 负载均衡
├── mcp/               # MCP 协议实现
│   ├── protocol.c     # 协议处理
│   └── client.c       # 客户端实现
├── api/               # API 网关
│   ├── gateway.c      # 网关服务
│   └── auth.c         # 认证授权
└── websocket/         # WebSocket 支持
    └── server.c       # WebSocket 服务器
```

### psp/ - PSP 系统
```
psp/
├── README.md                      # PSP 系统概述
├── Documentation/                 # PSP 专用文档
│   ├── README.md
│   └── architecture/
│       └── PSP_ARCHITECTURE.md
├── core/                         # PSP 核心组件
│   ├── compiler/                 # PSP 编译器
│   │   └── PSPCompiler.ts
│   ├── loader/                   # PSP 加载器
│   │   └── PSPLoader.ts
│   └── validator/                # PSP 验证器
│       └── PSPValidator.ts
├── functional/                   # 功能 PSP 库
│   ├── INDEX.md                 # 功能索引
│   ├── communication/           # 通信类 PSP
│   │   ├── messaging.yaml
│   │   └── phone.yaml
│   ├── productivity/            # 生产力类 PSP
│   │   └── calendar.yaml
│   └── utilities/               # 工具类 PSP
│       ├── calculator.yaml
│       └── clock.yaml
├── interfaces/                   # PSP 接口定义
│   └── api/
│       └── PSPContext.ts
├── master/                       # 主 PSP 模板
│   └── base/
│       └── PSP_master.yaml
└── standards/                    # PSP 标准规范
    └── format/
        └── PSP_FORMAT_SPEC.md
```

### samples/ - 示例代码
```
samples/
├── hello-world/        # Hello World 示例
│   ├── main.c         # C 语言示例
│   └── app.ts         # TypeScript 示例
├── ai-chat/           # AI 对话示例
│   ├── simple-chat.c  # 简单对话
│   └── context-chat.c # 上下文对话
├── psp-examples/      # PSP 使用示例
│   ├── basic-psp/     # 基础 PSP
│   └── advanced-psp/  # 高级 PSP
└── tools/             # 工具开发示例
    ├── simple-tool/   # 简单工具
    └── mcp-tool/      # MCP 工具
```

### security/ - 安全框架
```
security/
├── privacy/           # 隐私保护
│   ├── encryption.c   # 数据加密
│   └── anonymization.c # 数据匿名化
├── access-control/    # 访问控制
│   ├── permissions.c  # 权限管理
│   └── roles.c        # 角色管理
├── audit/             # 审计日志
│   ├── logger.c       # 日志记录
│   └── analyzer.c     # 日志分析
└── sandbox/           # 沙箱环境
    ├── container.c    # 容器化
    └── isolation.c    # 进程隔离
```

### tools/ - 开发工具
```
tools/
├── build/             # 构建工具
│   ├── configure      # 配置脚本
│   └── package.sh     # 打包脚本
├── debug/             # 调试工具
│   ├── debugger/      # 调试器
│   └── profiler/      # 性能分析器
├── test/              # 测试工具
│   ├── unit-test/     # 单元测试框架
│   └── integration/   # 集成测试
└── deployment/        # 部署工具
    ├── docker/        # Docker 相关
    └── k8s/           # Kubernetes 相关
```

## 文件命名规范

### 1. 通用规则
- **源代码文件**: 使用小写字母和下划线 (例如: `context_manager.c`)
- **头文件**: 使用小写字母和下划线 (例如: `session_manager.h`)
- **配置文件**: 使用小写字母和连字符 (例如: `build-config.yaml`)
- **文档文件**: 使用大写字母和下划线 (例如: `README.md`, `API_REFERENCE.md`)

### 2. PSP 文件规范
- **PSP 配置文件**: 使用小写字母和连字符，以 `.psp.yaml` 结尾
- **PSP 文档**: 使用大写字母和下划线，以 `.md` 结尾
- **PSP 示例**: 在文件名中包含 `example` 或 `sample`

### 3. TypeScript/JavaScript 规范
- **类文件**: 使用 PascalCase (例如: `ContextManager.ts`)
- **接口文件**: 使用 PascalCase 并在文件名中包含 Interface (例如: `SessionInterface.ts`)
- **工具函数**: 使用 camelCase (例如: `stringUtils.ts`)

## 模块依赖关系

```
依赖层次 (从底层到顶层):

Level 1: 硬件抽象层
├── arch/              # 硬件架构
└── drivers/           # 设备驱动

Level 2: 内核核心
├── kernel/core/       # 核心功能
├── kernel/mm/         # 内存管理
├── kernel/sched/      # 调度器
└── lib/               # 系统库

Level 3: 子系统
├── fs/                # 文件系统
├── net/               # 网络
├── security/          # 安全
└── kernel/ai/         # AI 子系统

Level 4: 应用框架
├── psp/               # PSP 系统
└── include/           # 接口定义

Level 5: 应用和工具
├── samples/           # 示例应用
├── tools/             # 开发工具
└── Documentation/     # 文档
```

## 构建系统

### Makefile 结构
```
顶级 Makefile          # 整体构建控制
├── kernel/Makefile    # 内核构建
├── lib/Makefile       # 库构建
├── psp/Makefile       # PSP 系统构建
└── tools/Makefile     # 工具构建
```

### Kconfig 配置
```
内核配置选项:
├── notcontrolOS_DEBUG         # 调试模式
├── PSP_SUPPORT        # PSP 支持
├── AI_INFERENCE       # AI 推理引擎
├── KNOWLEDGE_FS       # 知识管理文件系统
└── MCP_PROTOCOL       # MCP 协议支持
```

## 开发工作流

### 1. 添加新功能
1. 在相应子系统目录下创建功能代码
2. 更新相关头文件和接口定义
3. 添加或更新 Kconfig 选项
4. 编写测试代码
5. 更新文档

### 2. PSP 开发
1. 在 `psp/functional/` 或 `psp/workflow/` 下创建 PSP 文件
2. 使用 PSP 编译器验证格式
3. 编写使用示例
4. 更新 PSP 索引文档

### 3. API 开发
1. 在 `include/notcontrolos/` 下定义接口
2. 在 `kernel/core/syscalls/` 下实现系统调用
3. 在 `samples/` 下提供使用示例
4. 更新 API 文档

## 版本管理

### 文件版本控制
- 所有源代码文件包含版本信息头
- PSP 文件使用语义化版本号
- API 接口变更遵循向后兼容原则

### 发布管理
- 使用 Git 标签标记发布版本
- 维护 CHANGELOG.md 记录变更
- 构建脚本自动生成发布包

---

**维护说明**: 本文档随项目结构变化定期更新，当前版本对应 notcontrolOS v1.0 架构。
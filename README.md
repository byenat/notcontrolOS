# notcontrolOS - AI-Native Operating System

> **"Context, Not Control" - Empowering Users in the AI Era Through Context**  
> "Context engineering is the delicate art and science of filling the context window with just the right information for the next step." - Andrew Karpathy

**🌐 Language / 语言**: [English](README.md) | [中文](README_CN.md)

[![Version](https://img.shields.io/badge/version-0.1.0--alpha-orange)](https://github.com/byenat/notcontrolos)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Architecture](https://img.shields.io/badge/architecture-context--engineered-green)](Documentation/admin-guide/)

## Overview

notcontrolOS is an open-source operating system framework designed specifically for the AI era, built on the "Context, Not Control" philosophy. In the AI age, **Context is the new program** — with precise context, LLMs as supercomputers can truly serve users. notcontrolOS aims to be the "open-source infrastructure for the AI era," enabling everyone to have fully customized personal AI through intelligent context management and Personal System Prompts (PSP).

## Core Philosophy

### Context is the New Program
> "In the AI era, Context is the new program"  
> Traditional programs are instruction sequences for CPUs, while in the AI era, Context is cognitive instruction sequences for LLMs.

**Why Context is Critical?**
- **LLM Nature**: LLMs are universal supercomputers, but require precise Context to produce desired behavior
- **Personalization Needs**: Each user has different needs, preferences, and working styles, requiring personalized Context
- **Efficiency Optimization**: Good Context enables AI to understand user intent more accurately, reducing ineffective interactions

### Context, Not Control
The project name originates from the core philosophy of "Context, Not Control":
- **Original Idea**: We wanted to register the "context" domain but couldn't obtain it
- **Philosophical Evolution**: Borrowed from "Context, Not Control" to express our core belief
- **Design Philosophy**: Not to control AI, but to enable AI to better understand and serve users through Context

### Core Value Propositions

notcontrolOS is built around two core pillars:

#### 1. Data Sovereignty in the AI Era
> "User data belongs to users, not platforms"  
> 
> In the AI era, we firmly oppose big companies treating user data as their own assets. Users must have absolute control over their data.

#### 2. Personalized AI for Everyone
> "Through PSP, everyone can have a unique personal AI"  
> 
> Through the Personal System Prompt (PSP) system, personal preferences, working styles, and professional knowledge are transformed into AI-understandable Context programs, achieving truly personalized AI experiences.

### Data Sovereignty Philosophy

notcontrolOS upholds user data sovereignty principles:
> "User data belongs to users, not platforms"  
> In the AI era, we firmly oppose big companies treating user data as their own assets.

**Core Positions**:
- **Reject Data Monopoly**: Oppose practices like Salesforce modifying user agreements to prohibit users from using their own data to train AI
- **Data Autonomy**: Users have absolute control and usage rights over their own data
- **Fair Value Sharing**: If users choose to share data, they must receive corresponding value returns (referencing Grok's model of providing $30/month credits to data providers)
- **Transparent Processing**: All data processing is completely transparent, users clearly know how data is used
- **Portability Rights**: Users can export or delete their own data completely at any time

notcontrolOS ensures the implementation of these principles through technical architecture, allowing users to truly own their digital assets.

### Context-Driven Technical Advantages

- **Context as Programs**: Transform personal needs into executable Context programs for LLMs
- **PSP Personal Customization System**: Personal System Prompt enables AI to truly understand and adapt to each user's unique needs
- **Intelligent Context Management**: Precisely fill context windows, enabling LLMs as supercomputers to achieve maximum efficiency
- **Hybrid Inference Architecture**: Collaboration between local LLMs and cloud-based large models, finding balance between privacy and performance
- **Data Sovereignty Protection**: Complete local control of user data, rejecting platform data monopoly
- **Open Ecosystem Building**: Standardized tool ecosystem supporting MCP protocol, avoiding vendor lock-in

## Architecture Overview

notcontrolOS adopts a classic operating system layered architecture design, optimized specifically for context engineering:

```
notcontrolOS Architecture:

┌─────────────────────────────────────────────────────────────┐
│                   Application Layer (samples/)             │
│     Third-party Apps | Open Source Apps | PSP Examples     │
├─────────────────────────────────────────────────────────────┤
│                    Interface Layer (include/)              │
│        notcontrolOS API | MCP Protocol | User Space API    │
├─────────────────────────────────────────────────────────────┤
│                  Services Layer (lib/ + tools/)            │
│   PSP Library | AI Utils | Context Management | Dev Tools  │
├─────────────────────────────────────────────────────────────┤
│               Subsystems Layer (fs/ + net/ + security/)     │
│   Knowledge FS | Model Routing Network | Privacy Security  │
├─────────────────────────────────────────────────────────────┤
│                    Kernel Layer (kernel/)                  │
│  Context Management | Session Management | AI Inference    │
├─────────────────────────────────────────────────────────────┤
│                 Hardware Layer (arch/ + drivers/)          │
│   Architecture Abstraction | AI Hardware Drivers          │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

### Core Components

- **`kernel/`** - notcontrolOS kernel
  - `core/` - Core subsystems (context management, sessions, scheduling, syscalls)
  - `mm/` - Memory management (context, knowledge, compression, paging)
  - `ai/` - AI inference subsystem (inference, routing, optimization, learning)
  - `init/` - Kernel initialization (boot, PSP loader, config)

- **`arch/`** - Architecture-specific code
  - `x86_64/` `arm64/` `riscv/` `common/`

- **`drivers/`** - Device drivers
  - `ai/` - AI hardware drivers (NPU/GPU/TPU)
  - `sensors/` `storage/` `network/`

### System Services

- **`fs/`** - File systems
  - `knowledge/` - Universal knowledge file system framework
  - `pspfs/` - PSP file system
  - `vector/` `cache/`

- **`net/`** - Network subsystem
  - `model_routing/` - Intelligent model routing
  - `cloud_bridge/` - Cloud collaboration bridge
  - `privacy/` `federation/`

- **`security/`** - Security subsystem
  - `privacy/` `encryption/` `access_control/` `audit/`

### Development Support

- **`lib/`** - Core libraries
  - `psp/` - Personal System Prompt library
  - `ai_utils/` `compression/` `crypto/`

- **`include/`** - Headers and interfaces
  - `notcontrolos/` - notcontrolOS system interfaces
  - `uapi/` - User space API

- **`tools/`** - Development tools
  - `psp_compiler/` `debugger/` `profiler/` `migration/`

- **`samples/`** - Example code
  - `psp_examples/` `applications/` `drivers/`

### Documentation and Build

- **`Documentation/`** - Complete documentation
  - `admin-guide/` `dev-guide/` `user-guide/` `api/`

- **`scripts/`** - Build scripts
  - `build/` `config/` `packaging/`

## Quick Start

### Build System

```bash
# Configure build
make config

# Build kernel and modules
make all

# Build PSP support
make psp

# Build AI subsystem
make ai

# Build development tools
make tools
```

### Development Environment

```bash
# Install dependencies
./scripts/build/install-deps.sh

# Setup development environment
./scripts/config/setup-dev.sh

# Run tests
make test
```

## Core Features

### 1. Context Engineering Core

Based on Andrew Karpathy's philosophy, notcontrolOS provides world-class context management capabilities:

- **Intelligent Context Window Management**: Dynamically select the most relevant information to fill context
- **PSP-Driven Optimization**: Context priority adjustment based on personal preferences
- **Multimodal Context Integration**: Unified context management for text, images, and audio
- **Cost-Effectiveness Optimization**: Find the optimal balance between quality and cost

### 2. Personal System Prompt (PSP) System

PSP is notcontrolOS's core innovation, transforming personal preferences into AI-understandable programs:

- **PSP_master**: Core personal profile, foundation for all AI interactions
- **Functional PSP**: Specialized PSP for specific functions
- **Workflow PSP**: Multi-step orchestration for complex tasks

### 3. Hybrid Inference Engine

Intelligent local-cloud collaboration architecture:

- **Local First**: PSP-related tasks processed completely locally
- **Cloud Collaboration**: Intelligent routing for complex inference tasks
- **Cost Optimization**: Smart model selection reduces AI usage costs

### 4. Universal Knowledge Management Framework

Open personal knowledge storage and retrieval framework:

- **Abstract Interface**: Standard interface supporting multiple knowledge organization modes
- **Semantic Retrieval**: Vector-based intelligent search framework
- **Privacy Protection**: Completely localized knowledge management architecture

## Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Architecture Design](Documentation/admin-guide/notcontrolOS_ARCHITECTURE.md)
- [Context Engineering Guide](Documentation/admin-guide/notcontrolOS_CONTEXT_ENGINEERING_ROADMAP.md)
- [Data Sovereignty Manifesto](Documentation/admin-guide/Data_Sovereignty_Manifesto.md)
- [Developer Guide](Documentation/dev-guide/)
- [API Reference](Documentation/api/)
- [Changelog](CHANGELOG.md)

## Project Standards

- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- [Development Standards](standards/development/Project_Development_Standards.md) - Coding and development standards
- [Bilingual Documentation Guidelines](standards/documentation/Bilingual_Documentation_Guidelines.md) - Bilingual documentation standards

## Open Source Roadmap

See [Open Source Roadmap](Documentation/admin-guide/OPENSOURCE_ROADMAP.md)

### Current Status
- ✅ Core architecture design completed
- ✅ Context Engineering framework implemented
- ✅ Directory structure reorganization completed
- 🔄 Code refactoring in progress
- 📅 Q2 2025: Alpha release

## Contributing

notcontrolOS welcomes community contributions! Please check:

- [Contributing Guide](Documentation/dev-guide/CONTRIBUTING.md)
- [Code Standards](Documentation/dev-guide/CODING_STYLE.md)
- [Maintainers List](MAINTAINERS)

## License

notcontrolOS is licensed under the MIT License, ensuring complete open source and promoting commercial and academic use.

## Acknowledgments

Special thanks to Andrew Karpathy for proposing the context engineering philosophy, which provided important guidance for the core design of notcontrolOS.

---

**notcontrolOS** - *Make Context Engineering Simple and Powerful* 🚀 
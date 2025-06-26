/**
 * notcontrolOS工具调用系统使用示例
 * 展示如何集成和使用四层工具调用架构
 */

import { 
  NotcontrolosToolController, 
  IntentRouter, 
  ExecutionController,
  ToolDefinition,
  PSPContext 
} from './ToolController';
import { NotcontrolosMCPAdapter } from './MCPIntegration';

// ============================================================================
// 示例：完整的notcontrolOS工具调用系统初始化
// ============================================================================

export class NotcontrolosToolControllerFactory {
  static async createController(): Promise<NotcontrolosToolController> {
    // 1. 创建MCP适配器
    const mcpAdapter = new NotcontrolosMCPAdapter();

    // 2. 创建意图路由器
    const intentRouter = new IntentRouter();

    // 3. 创建执行控制器
    const executionController = new ExecutionController(
      new LocalToolExecutorImpl(mcpAdapter),
      new CloudToolExecutorImpl(),
      new SecurityValidatorImpl()
    );

    // 4. 创建工具注册表
    const toolRegistry = new ToolRegistryImpl(mcpAdapter);

    // 5. 创建PSP管理器
    const pspManager = new PSPManagerImpl();

    // 6. 组装完整的控制器
    return new NotcontrolosToolController(
      intentRouter,
      executionController,
      toolRegistry,
      pspManager
    );
  }
}

// ============================================================================
// 具体实现类
// ============================================================================

class LocalToolExecutorImpl {
  constructor(private mcpAdapter: NotcontrolosMCPAdapter) {}

  async execute(toolCall: any): Promise<{data: any; cost?: number; resources?: Record<string, any>}> {
    // 通过MCP适配器执行本地工具
    return await this.mcpAdapter.executeToolCall(toolCall);
  }
}

class CloudToolExecutorImpl {
  async execute(toolCall: any): Promise<{data: any; cost?: number; resources?: Record<string, any>}> {
    // 模拟云端工具执行
    console.log(`执行云端工具: ${toolCall.name}`);
    
    // 这里可以集成实际的云端服务
    // 例如：OpenAI API、Google Cloud Functions等
    
    return {
      data: {
        result: `云端执行结果: ${toolCall.name}`,
        timestamp: new Date().toISOString()
      },
      cost: 0.05, // 云端工具通常有成本
      resources: {
        cloud_provider: 'openai',
        model_used: 'gpt-4',
        tokens_used: 150
      }
    };
  }
}

class SecurityValidatorImpl {
  async validatePSPLevel(toolCall: any): Promise<void> {
    // PSP级别的安全验证
    const pspContext = toolCall.context;
    
    // 检查用户意图是否与PSP一致
    if (!this.isIntentConsistentWithPSP(toolCall, pspContext)) {
      throw new Error('工具调用意图与用户PSP不一致');
    }

    // 检查权限边界
    if (!this.isWithinPermissionBoundary(toolCall, pspContext)) {
      throw new Error('工具调用超出PSP权限边界');
    }
  }

  async validateSystemLevel(toolCall: any): Promise<void> {
    // 系统级别的安全验证
    
    // 参数类型验证
    if (!this.validateParameterTypes(toolCall.arguments)) {
      throw new Error('工具参数类型验证失败');
    }

    // 注入攻击检测
    if (this.detectInjectionAttack(toolCall.arguments)) {
      throw new Error('检测到潜在的注入攻击');
    }

    // 资源限制检查
    if (!this.checkResourceLimits(toolCall)) {
      throw new Error('工具调用超出资源限制');
    }
  }

  private isIntentConsistentWithPSP(toolCall: any, pspContext: PSPContext): boolean {
    // 检查工具调用是否符合用户的PSP设定
    const allowedTools = pspContext.psp_master.allowed_tools || [];
    
    if (allowedTools.length > 0 && !allowedTools.includes(toolCall.name)) {
      return false;
    }
    
    return true;
  }

  private isWithinPermissionBoundary(toolCall: any, pspContext: PSPContext): boolean {
    const userConstraints = pspContext.security_constraints;
    
    // 检查是否有执行此工具的权限
    if (toolCall.name.includes('delete') && !userConstraints.includes('delete')) {
      return false;
    }
    
    if (toolCall.name.includes('admin') && !userConstraints.includes('admin')) {
      return false;
    }
    
    return true;
  }

  private validateParameterTypes(args: Record<string, any>): boolean {
    // 简单的类型验证
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'undefined' || value === null) {
        continue;
      }
      
      // 防止传入函数或复杂对象
      if (typeof value === 'function') {
        return false;
      }
    }
    
    return true;
  }

  private detectInjectionAttack(args: Record<string, any>): boolean {
    const dangerousPatterns = [
      /eval\(/,
      /exec\(/,
      /system\(/,
      /require\(/,
      /__import__/,
      /script>/i,
      /javascript:/i
    ];

    const argString = JSON.stringify(args);
    
    return dangerousPatterns.some(pattern => pattern.test(argString));
  }

  private checkResourceLimits(toolCall: any): boolean {
    // 检查资源限制
    const maxTimeout = 60000; // 最大60秒
    const maxMemory = 100 * 1024 * 1024; // 最大100MB
    
    if (toolCall.metadata.timeout > maxTimeout) {
      return false;
    }
    
    // 这里可以添加更多资源检查
    return true;
  }
}

class ToolRegistryImpl {
  constructor(private mcpAdapter: NotcontrolosMCPAdapter) {}

  async getAvailableTools(pspContext: PSPContext): Promise<ToolDefinition[]> {
    return await this.mcpAdapter.getAvailableTools(pspContext);
  }

  async registerTool(tool: ToolDefinition): Promise<void> {
    this.mcpAdapter.registerTool(tool);
  }
}

class PSPManagerImpl {
  private pspStore: Map<string, PSPContext> = new Map();

  async loadUserPSPContext(userId: string, sessionContext?: Record<string, any>): Promise<PSPContext> {
    // 从存储中加载用户的PSP上下文
    let pspContext = this.pspStore.get(userId);
    
    if (!pspContext) {
      // 创建默认的PSP上下文
      pspContext = this.createDefaultPSPContext(userId);
      this.pspStore.set(userId, pspContext);
    }

    // 合并会话上下文
    if (sessionContext) {
      pspContext = this.mergePSPWithSession(pspContext, sessionContext);
    }

    return pspContext;
  }

  async updatePSPWithFeedback(pspContext: PSPContext, feedback: any): Promise<void> {
    // 基于反馈更新PSP
    
    // 更新工具使用统计
    if (!pspContext.psp_master.tool_usage_stats) {
      pspContext.psp_master.tool_usage_stats = {};
    }
    
    const toolName = feedback.tool_name;
    if (!pspContext.psp_master.tool_usage_stats[toolName]) {
      pspContext.psp_master.tool_usage_stats[toolName] = {
        total_calls: 0,
        successful_calls: 0,
        total_cost: 0,
        avg_execution_time: 0
      };
    }

    const stats = pspContext.psp_master.tool_usage_stats[toolName];
    stats.total_calls += 1;
    
    if (feedback.success) {
      stats.successful_calls += 1;
    }
    
    stats.total_cost += feedback.cost || 0;
    stats.avg_execution_time = (stats.avg_execution_time + feedback.execution_time) / 2;

    // 学习用户偏好
    if (feedback.user_satisfaction_score > 0.8) {
      // 高满意度的工具调用，记录为偏好
      if (!pspContext.user_preferences.preferred_tools) {
        pspContext.user_preferences.preferred_tools = [];
      }
      
      if (!pspContext.user_preferences.preferred_tools.includes(toolName)) {
        pspContext.user_preferences.preferred_tools.push(toolName);
      }
    }

    // 保存更新后的PSP
    const userId = this.extractUserIdFromPSP(pspContext);
    this.pspStore.set(userId, pspContext);
  }

  private createDefaultPSPContext(userId: string): PSPContext {
    return {
      psp_master: {
        user_id: userId,
        version: '1.0',
        created_at: new Date().toISOString(),
        allowed_tools: [], // 空数组表示允许所有工具
        tool_defaults: {},
        tool_usage_stats: {},
        learning_data: {}
      },
      current_psp: {
        session_id: `session_${Date.now()}`,
        context: 'default',
        active_since: new Date().toISOString()
      },
      user_preferences: {
        language: 'zh-CN',
        privacy_level: 'private',
        cost_sensitivity: 'medium',
        performance_priority: 'balanced'
      },
      security_constraints: ['read', 'write'], // 默认读写权限
      privacy_level: 'private'
    };
  }

  private mergePSPWithSession(pspContext: PSPContext, sessionContext: Record<string, any>): PSPContext {
    // 合并会话特定的上下文信息
    const mergedContext = { ...pspContext };
    
    if (sessionContext.privacy_override) {
      mergedContext.privacy_level = sessionContext.privacy_override;
    }
    
    if (sessionContext.temporary_permissions) {
      mergedContext.security_constraints.push(...sessionContext.temporary_permissions);
    }
    
    return mergedContext;
  }

  private extractUserIdFromPSP(pspContext: PSPContext): string {
    return pspContext.psp_master.user_id || 'unknown_user';
  }
}

// ============================================================================
// 使用示例
// ============================================================================

export async function demonstrateNotcontrolosToolCalling(): Promise<void> {
  console.log('🚀 notcontrolOS工具调用系统演示开始');

  try {
    // 1. 初始化控制器
    const toolController = await NotcontrolosToolControllerFactory.createController();
    console.log('✅ 工具调用控制器初始化完成');

    // 2. 模拟用户请求
    const userInput = '帮我搜索关于notcontrolOS架构的书签，然后创建一个新的笔记';
    const userId = 'demo_user_001';
    
    console.log(`📝 用户输入: ${userInput}`);

    // 3. 处理用户请求
    const result = await toolController.processUserRequest(userInput, userId);
    
    console.log('📊 执行结果:');
    console.log(`- 总工具调用数: ${result.results.length}`);
    console.log(`- 成功调用数: ${result.results.filter(r => r.status === 'success').length}`);
    console.log(`- 执行摘要: ${result.summary}`);
    
    // 4. 显示详细结果
    result.results.forEach((toolResult, index) => {
      console.log(`\n🔧 工具调用 ${index + 1}:`);
      console.log(`  - ID: ${toolResult.id}`);
      console.log(`  - 状态: ${toolResult.status}`);
      console.log(`  - 执行时间: ${toolResult.metadata.execution_time}ms`);
      console.log(`  - 成本: ¥${toolResult.metadata.cost_incurred.toFixed(4)}`);
      console.log(`  - 路由: ${toolResult.metadata.route_taken}`);
      
      if (toolResult.result) {
        console.log(`  - 结果: ${JSON.stringify(toolResult.result, null, 2)}`);
      }
      
      if (toolResult.error) {
        console.log(`  - 错误: ${toolResult.error.message}`);
        if (toolResult.error.suggestion) {
          console.log(`  - 建议: ${toolResult.error.suggestion}`);
        }
      }
    });

    console.log('\n🎯 上下文更新:');
    console.log(JSON.stringify(result.context_updates, null, 2));

  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
  }

      console.log('\n✨ notcontrolOS工具调用系统演示完成');
}

// ============================================================================
// 高级使用示例：自定义工具注册
// ============================================================================

export async function demonstrateCustomToolRegistration(): Promise<void> {
  console.log('🔧 自定义工具注册演示');

  const toolController = await NotcontrolosToolControllerFactory.createController();

  // 注册自定义工具
  const customTool: ToolDefinition = {
    name: 'analyze-sentiment',
    description: '分析文本的情感倾向',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '要分析的文本内容'
        },
        language: {
          type: 'string',
          description: '文本语言',
          required: false
        }
      },
      required: ['text']
    },
    metadata: {
      category: 'cloud',
      privacy_level: 'public',
      cost_estimate: 'low',
      latency_expectation: 'normal',
      required_permissions: ['read'],
      psp_integration: true
    }
  };

  // 这里需要通过实际的工具注册表进行注册
  console.log('✅ 自定义工具注册完成:', customTool.name);
}

// 运行演示的辅助函数
export async function runDemonstration(): Promise<void> {
  await demonstrateNotcontrolosToolCalling();
  await demonstrateCustomToolRegistration();
} 
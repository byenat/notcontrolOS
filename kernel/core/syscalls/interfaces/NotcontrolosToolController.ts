import { z } from 'zod';
import { EventEmitter } from 'events';

// ============================================================================
// 类型定义 - 参考Claude和Gemini的工具调用标准
// ============================================================================

interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, any>;
  context: PSPContext;
  metadata: ToolCallMetadata;
}

interface ToolCallResult {
  id: string;
  status: 'success' | 'error' | 'timeout' | 'permission_denied';
  result?: any;
  error?: ToolCallError;
  metadata: ExecutionMetadata;
}

interface ToolCallError {
  code: string;
  message: string;
  details?: any;
  suggestion?: string;
}

interface PSPContext {
  psp_master: any;
  current_psp: any;
  user_preferences: Record<string, any>;
  security_constraints: string[];
  privacy_level: 'public' | 'private' | 'sensitive';
}

interface ToolCallMetadata {
  requested_by: 'local_llm' | 'cloud_model';
  priority: 'high' | 'normal' | 'low';
  timeout: number;
  retry_policy: RetryPolicy;
  cost_constraints?: CostConstraints;
}

interface ExecutionMetadata {
  execution_time: number;
  cost_incurred: number;
  resources_used: Record<string, any>;
  route_taken: 'local' | 'cloud' | 'hybrid' | 'error';
}

interface RetryPolicy {
  max_retries: number;
  backoff_strategy: 'linear' | 'exponential';
  retry_conditions: string[];
}

interface CostConstraints {
  max_cost_per_call: number;
  daily_budget: number;
  prefer_local: boolean;
}

// ============================================================================
// 第一层：意图理解层 (Intent Understanding Layer)
// ============================================================================

class IntentUnderstandingLayer {
  private localLLM: LocalLLMService;
  private cloudLLMRouter: CloudLLMRouter;

  constructor(localLLM: LocalLLMService, cloudLLMRouter: CloudLLMRouter) {
    this.localLLM = localLLM;
    this.cloudLLMRouter = cloudLLMRouter;
  }

  async parseUserIntent(
    userInput: string, 
    pspContext: PSPContext
  ): Promise<{
    tool_calls: ToolCallRequest[];
    routing_decision: RoutingDecision;
    confidence: number;
  }> {
    // PSP增强的意图理解
    const enhancedPrompt = this.buildPSPEnhancedPrompt(userInput, pspContext);
    
    // 安全边界预验证
    const securityCheck = await this.performSecurityPrecheck(userInput, pspContext);
    if (!securityCheck.passed) {
      throw new Error(`Security violation: ${securityCheck.reason}`);
    }

    // 基于PSP的路由决策
    const routingDecision = await this.determineRouting(userInput, pspContext);
    
    let toolCalls: ToolCallRequest[] = [];
    let confidence = 0;

    if (routingDecision.useLocal) {
      // 本地LLM处理PSP相关任务
      const localResult = await this.localLLM.parseIntent(enhancedPrompt, pspContext);
      toolCalls = localResult.tool_calls;
      confidence = localResult.confidence;
    } else {
      // 云端大模型处理复杂推理
      const cloudResult = await this.cloudLLMRouter.parseIntent(enhancedPrompt, pspContext);
      toolCalls = cloudResult.tool_calls;
      confidence = cloudResult.confidence;
    }

    return {
      tool_calls: toolCalls,
      routing_decision: routingDecision,
      confidence
    };
  }

  private buildPSPEnhancedPrompt(userInput: string, pspContext: PSPContext): string {
    // 基于PSP_master构建个性化提示词
    const personalizedContext = this.extractPersonalizedContext(pspContext);
    const toolDefinitions = this.getAvailableTools(pspContext);
    
    return `
## Personal Context (from PSP_master)
${JSON.stringify(personalizedContext, null, 2)}

## Available Tools
${JSON.stringify(toolDefinitions, null, 2)}

## User Input
${userInput}

## Instructions
Based on the user's personal context and preferences, determine which tools to call and with what parameters.
Consider the user's privacy level, cost sensitivity, and historical preferences when making decisions.
`;
  }

  private async performSecurityPrecheck(
    userInput: string, 
    pspContext: PSPContext
  ): Promise<{passed: boolean; reason?: string}> {
    // 检查是否超出PSP定义的权限边界
    const permissionCheck = this.checkPSPPermissions(userInput, pspContext);
    if (!permissionCheck.passed) {
      return { passed: false, reason: permissionCheck.reason };
    }

    // 检查隐私约束
    const privacyCheck = this.checkPrivacyConstraints(userInput, pspContext);
    if (!privacyCheck.passed) {
      return { passed: false, reason: privacyCheck.reason };
    }

    return { passed: true };
  }

  private async determineRouting(
    userInput: string, 
    pspContext: PSPContext
  ): Promise<RoutingDecision> {
    // PSP相关性判断
    const isPSPRelated = this.isPSPRelatedTask(userInput, pspContext);
    if (isPSPRelated) {
      return {
        useLocal: true,
        reason: 'PSP相关任务本地优先处理',
        confidence: 0.95
      };
    }

    // 隐私敏感度判断
    const isPrivacySensitive = this.isPrivacySensitive(userInput, pspContext);
    if (isPrivacySensitive) {
      return {
        useLocal: true,
        reason: '隐私敏感任务严格本地处理',
        confidence: 0.9
      };
    }

    // 复杂度判断
    const complexity = this.analyzeTaskComplexity(userInput);
    if (complexity > 0.7) {
      return {
        useLocal: false,
        reason: '复杂推理任务云端协作',
        confidence: 0.8
      };
    }

    // 默认本地优先
    return {
      useLocal: true,
      reason: '默认本地优先策略',
      confidence: 0.6
    };
  }

  // 辅助方法的骨架实现
  private extractPersonalizedContext(pspContext: PSPContext) { /* 实现细节 */ }
  private getAvailableTools(pspContext: PSPContext) { /* 实现细节 */ }
  private checkPSPPermissions(userInput: string, pspContext: PSPContext) { return { passed: true }; }
  private checkPrivacyConstraints(userInput: string, pspContext: PSPContext) { return { passed: true }; }
  private isPSPRelatedTask(userInput: string, pspContext: PSPContext): boolean { return false; }
  private isPrivacySensitive(userInput: string, pspContext: PSPContext): boolean { return false; }
  private analyzeTaskComplexity(userInput: string): number { return 0.5; }
}

// ============================================================================
// 第二层：工具路由层 (Tool Routing Layer)
// ============================================================================

class ToolRoutingLayer {
  private mcpClient: MCPClient;
  private localToolRegistry: LocalToolRegistry;
  private routingPolicy: RoutingPolicy;

  constructor(
    mcpClient: MCPClient,
    localToolRegistry: LocalToolRegistry,
    routingPolicy: RoutingPolicy
  ) {
    this.mcpClient = mcpClient;
    this.localToolRegistry = localToolRegistry;
    this.routingPolicy = routingPolicy;
  }

  async routeToolCall(
    toolCall: ToolCallRequest,
    pspContext: PSPContext
  ): Promise<ToolExecutionPlan> {
    // 1. 工具发现和验证
    const toolDefinition = await this.discoverTool(toolCall.name, pspContext);
    if (!toolDefinition) {
      throw new Error(`Tool not found: ${toolCall.name}`);
    }

    // 2. 参数验证和PSP增强
    const validatedArgs = await this.validateAndEnhanceArguments(
      toolCall.arguments,
      toolDefinition,
      pspContext
    );

    // 3. 路由决策
    const routingDecision = await this.makeRoutingDecision(
      toolDefinition,
      pspContext,
      toolCall.metadata
    );

    // 4. 成本估算
    const costEstimate = await this.estimateCost(toolDefinition, routingDecision);

    return {
      tool_call: {
        ...toolCall,
        arguments: validatedArgs
      },
      routing: routingDecision,
      cost_estimate: costEstimate,
      execution_plan: this.buildExecutionPlan(routingDecision)
    };
  }

  private async discoverTool(
    toolName: string, 
    pspContext: PSPContext
  ): Promise<ToolDefinition | null> {
    // 首先在本地工具注册表中查找
    const localTool = await this.localToolRegistry.getTool(toolName);
    if (localTool && this.isToolCompatibleWithPSP(localTool, pspContext)) {
      return localTool;
    }

    // 然后通过MCP协议查找
    const mcpTools = await this.mcpClient.listTools();
    const mcpTool = mcpTools.find(tool => 
      tool.name === toolName && 
      this.isToolCompatibleWithPSP(tool, pspContext)
    );

    return mcpTool || null;
  }

  private async validateAndEnhanceArguments(
    arguments: Record<string, any>,
    toolDefinition: ToolDefinition,
    pspContext: PSPContext
  ): Promise<Record<string, any>> {
    // JSON Schema验证
    const validationResult = this.validateAgainstSchema(arguments, toolDefinition.inputSchema);
    if (!validationResult.valid) {
      throw new Error(`Parameter validation failed: ${validationResult.errors.join(', ')}`);
    }

    // PSP个性化参数增强
    const enhancedArgs = await this.enhanceWithPSPDefaults(
      arguments,
      toolDefinition,
      pspContext
    );

    return enhancedArgs;
  }

  private async makeRoutingDecision(
    toolDefinition: ToolDefinition,
    pspContext: PSPContext,
    metadata: ToolCallMetadata
  ): Promise<RoutingDecision> {
    const factors = {
      privacy_level: this.evaluatePrivacyRequirement(toolDefinition, pspContext),
      cost_sensitivity: this.evaluateCostSensitivity(pspContext, metadata),
      performance_requirement: this.evaluatePerformanceRequirement(metadata),
      availability: await this.checkToolAvailability(toolDefinition)
    };

    return this.routingPolicy.decide(factors);
  }

  // 辅助方法骨架
  private isToolCompatibleWithPSP(tool: any, pspContext: PSPContext): boolean { return true; }
  private validateAgainstSchema(args: any, schema: any) { return { valid: true, errors: [] }; }
  private async enhanceWithPSPDefaults(args: any, tool: any, psp: any) { return args; }
  private evaluatePrivacyRequirement(tool: any, psp: any): number { return 0.5; }
  private evaluateCostSensitivity(psp: any, metadata: any): number { return 0.5; }
  private evaluatePerformanceRequirement(metadata: any): number { return 0.5; }
  private async checkToolAvailability(tool: any) { return { local: true, cloud: true }; }
  private async estimateCost(tool: any, routing: any) { return { estimated_cost: 0.01 }; }
  private buildExecutionPlan(routing: any) { return { steps: [] }; }
}

// ============================================================================
// 第三层：执行控制层 (Execution Control Layer)
// ============================================================================

class ExecutionControlLayer extends EventEmitter {
  private securityEngine: SecurityEngine;
  private sandboxManager: SandboxManager;
  private auditLogger: AuditLogger;

  constructor(
    securityEngine: SecurityEngine,
    sandboxManager: SandboxManager,
    auditLogger: AuditLogger
  ) {
    super();
    this.securityEngine = securityEngine;
    this.sandboxManager = sandboxManager;
    this.auditLogger = auditLogger;
  }

  async executeToolCall(
    executionPlan: ToolExecutionPlan,
    pspContext: PSPContext
  ): Promise<ToolCallResult> {
    const startTime = Date.now();
    const toolCall = executionPlan.tool_call;

    try {
      // 第一重：PSP级别验证
      await this.performPSPLevelValidation(toolCall, pspContext);

      // 第二重：系统级别验证
      await this.performSystemLevelValidation(toolCall);

      // 创建执行沙箱
      const sandbox = await this.sandboxManager.createSandbox(toolCall, pspContext);

      // 记录执行开始
      await this.auditLogger.logExecutionStart(toolCall, pspContext);

      // 执行工具调用
      this.emit('execution_started', { tool_call: toolCall, timestamp: startTime });

      const result = await this.executeInSandbox(toolCall, sandbox, pspContext);

      // 第三重：执行级别监控
      await this.performExecutionLevelMonitoring(result, sandbox);

      const endTime = Date.now();
      const executionMetadata: ExecutionMetadata = {
        execution_time: endTime - startTime,
        cost_incurred: this.calculateActualCost(result),
        resources_used: sandbox.getResourceUsage(),
        route_taken: executionPlan.routing.target
      };

      // 记录成功执行
      await this.auditLogger.logExecutionSuccess(toolCall, result, executionMetadata);

      this.emit('execution_completed', { 
        tool_call: toolCall, 
        result, 
        metadata: executionMetadata 
      });

      return {
        id: toolCall.id,
        status: 'success',
        result: result.data,
        metadata: executionMetadata
      };

    } catch (error) {
      const endTime = Date.now();
      const errorResult = this.handleExecutionError(error, toolCall, startTime, endTime);
      
      await this.auditLogger.logExecutionError(toolCall, error, pspContext);
      
      this.emit('execution_failed', { 
        tool_call: toolCall, 
        error,
        timestamp: endTime 
      });

      return errorResult;
    }
  }

  private async performPSPLevelValidation(
    toolCall: ToolCallRequest,
    pspContext: PSPContext
  ): Promise<void> {
    // 用户意图验证
    const intentValid = await this.securityEngine.validateUserIntent(toolCall, pspContext);
    if (!intentValid.valid) {
      throw new Error(`Intent validation failed: ${intentValid.reason}`);
    }

    // 权限边界检查
    const permissionValid = await this.securityEngine.checkPermissionBoundary(toolCall, pspContext);
    if (!permissionValid.valid) {
      throw new Error(`Permission boundary violation: ${permissionValid.reason}`);
    }

    // 隐私保护验证
    const privacyValid = await this.securityEngine.validatePrivacyCompliance(toolCall, pspContext);
    if (!privacyValid.valid) {
      throw new Error(`Privacy compliance violation: ${privacyValid.reason}`);
    }
  }

  private async performSystemLevelValidation(toolCall: ToolCallRequest): Promise<void> {
    // 参数格式验证
    const formatValid = this.securityEngine.validateParameterFormat(toolCall.arguments);
    if (!formatValid.valid) {
      throw new Error(`Parameter format validation failed: ${formatValid.errors.join(', ')}`);
    }

    // 类型安全检查
    const typeValid = this.securityEngine.validateParameterTypes(toolCall.arguments);
    if (!typeValid.valid) {
      throw new Error(`Type safety validation failed: ${typeValid.errors.join(', ')}`);
    }

    // 业务规则验证
    const businessValid = await this.securityEngine.validateBusinessRules(toolCall);
    if (!businessValid.valid) {
      throw new Error(`Business rule validation failed: ${businessValid.reason}`);
    }
  }

  private async executeInSandbox(
    toolCall: ToolCallRequest,
    sandbox: ExecutionSandbox,
    pspContext: PSPContext
  ): Promise<any> {
    // 设置超时控制
    const timeout = toolCall.metadata.timeout || 30000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tool execution timeout')), timeout);
    });

    // 执行工具调用
    const executionPromise = sandbox.execute(toolCall, pspContext);

    return Promise.race([executionPromise, timeoutPromise]);
  }

  private async performExecutionLevelMonitoring(
    result: any,
    sandbox: ExecutionSandbox
  ): Promise<void> {
    // 检查异常行为
    const anomalies = sandbox.detectAnomalies();
    if (anomalies.length > 0) {
      console.warn('Execution anomalies detected:', anomalies);
    }

    // 资源使用检查
    const resourceUsage = sandbox.getResourceUsage();
    if (resourceUsage.cpu > 0.8 || resourceUsage.memory > 0.8) {
      console.warn('High resource usage detected:', resourceUsage);
    }
  }

  private handleExecutionError(
    error: any,
    toolCall: ToolCallRequest,
    startTime: number,
    endTime: number
  ): ToolCallResult {
    let status: 'error' | 'timeout' | 'permission_denied' = 'error';
    
    if (error.message?.includes('timeout')) {
      status = 'timeout';
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      status = 'permission_denied';
    }

    return {
      id: toolCall.id,
      status,
      error: {
        code: error.code || 'EXECUTION_ERROR',
        message: error.message,
        details: error.details,
        suggestion: this.generateErrorSuggestion(error)
      },
      metadata: {
        execution_time: endTime - startTime,
        cost_incurred: 0,
        resources_used: {},
        route_taken: 'error'
      }
    };
  }

  private calculateActualCost(result: any): number {
    // 实现成本计算逻辑
    return 0.01;
  }

  private generateErrorSuggestion(error: any): string {
    // 基于错误类型生成修复建议
    if (error.message?.includes('permission')) {
      return 'Check your PSP permissions and try again';
    }
    if (error.message?.includes('timeout')) {
      return 'Consider increasing the timeout or breaking down the task';
    }
    return 'Please check the tool parameters and try again';
  }
}

// ============================================================================
// notcontrolOS工具调用控制器主类
// ============================================================================

export class NotcontrolosToolController extends EventEmitter {
  private intentLayer: IntentUnderstandingLayer;
  private routingLayer: ToolRoutingLayer;
  private executionLayer: ExecutionControlLayer;
  private pspManager: PSPManager;

  constructor(
    intentLayer: IntentUnderstandingLayer,
    routingLayer: ToolRoutingLayer,
    executionLayer: ExecutionControlLayer,
    pspManager: PSPManager
  ) {
    super();
    this.intentLayer = intentLayer;
    this.routingLayer = routingLayer;
    this.executionLayer = executionLayer;
    this.pspManager = pspManager;

    // 设置事件转发
    this.setupEventForwarding();
  }

  /**
   * 主要的工具调用入口点
   * 实现完整的四层架构处理流程
   */
  async processUserInput(
    userInput: string,
    userId: string,
    sessionContext?: any
  ): Promise<ToolCallResult[]> {
    try {
      // 加载用户的PSP上下文
      const pspContext = await this.pspManager.loadPSPContext(userId, sessionContext);

      // 第一层：意图理解
      this.emit('intent_analysis_started', { userInput, userId });
      const intentResult = await this.intentLayer.parseUserIntent(userInput, pspContext);
      this.emit('intent_analysis_completed', { intentResult });

      // 如果没有工具调用需求，直接返回
      if (intentResult.tool_calls.length === 0) {
        return [];
      }

      // 处理每个工具调用
      const results: ToolCallResult[] = [];
      
      for (const toolCall of intentResult.tool_calls) {
        try {
          // 第二层：工具路由
          this.emit('tool_routing_started', { toolCall });
          const executionPlan = await this.routingLayer.routeToolCall(toolCall, pspContext);
          this.emit('tool_routing_completed', { executionPlan });

          // 第三层：执行控制
          const result = await this.executionLayer.executeToolCall(executionPlan, pspContext);
          results.push(result);

          // 第四层：PSP学习反馈
          await this.providePSPFeedback(result, toolCall, pspContext);

        } catch (error) {
          // 单个工具调用失败不影响其他工具
          const errorResult: ToolCallResult = {
            id: toolCall.id,
            status: 'error',
            error: {
              code: 'TOOL_CALL_FAILED',
              message: error.message,
              details: error
            },
            metadata: {
              execution_time: 0,
              cost_incurred: 0,
              resources_used: {},
              route_taken: 'error'
            }
          };
          results.push(errorResult);
        }
      }

      return results;

    } catch (error) {
      this.emit('processing_failed', { userInput, userId, error });
      throw error;
    }
  }

  /**
   * PSP学习反馈机制
   */
  private async providePSPFeedback(
    result: ToolCallResult,
    toolCall: ToolCallRequest,
    pspContext: PSPContext
  ): Promise<void> {
    const feedback = {
      tool_name: toolCall.name,
      success: result.status === 'success',
      execution_time: result.metadata.execution_time,
      cost: result.metadata.cost_incurred,
      user_satisfaction: this.inferUserSatisfaction(result),
      context_continuity: this.evaluateContextContinuity(result, pspContext)
    };

    await this.pspManager.updateWithFeedback(pspContext, feedback);
  }

  private setupEventForwarding(): void {
    // 转发执行层事件
    this.executionLayer.on('execution_started', (data) => {
      this.emit('execution_started', data);
    });
    
    this.executionLayer.on('execution_completed', (data) => {
      this.emit('execution_completed', data);
    });
    
    this.executionLayer.on('execution_failed', (data) => {
      this.emit('execution_failed', data);
    });
  }

  private inferUserSatisfaction(result: ToolCallResult): number {
    // 基于执行结果推断用户满意度
    if (result.status === 'success') {
      return 0.8; // 基础满意度
    }
    return 0.2;
  }

  private evaluateContextContinuity(result: ToolCallResult, pspContext: PSPContext): number {
    // 评估上下文连贯性
    return 0.8; // 简化实现
  }
}

// ============================================================================
// 辅助接口和类型定义
// ============================================================================

interface RoutingDecision {
  useLocal?: boolean;
  target?: 'local' | 'cloud' | 'hybrid';
  reason: string;
  confidence: number;
}

interface ToolExecutionPlan {
  tool_call: ToolCallRequest;
  routing: RoutingDecision;
  cost_estimate: any;
  execution_plan: any;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  metadata: any;
}

// 服务接口定义（需要具体实现）
interface LocalLLMService {
  parseIntent(prompt: string, context: PSPContext): Promise<{tool_calls: ToolCallRequest[]; confidence: number}>;
}

interface CloudLLMRouter {
  parseIntent(prompt: string, context: PSPContext): Promise<{tool_calls: ToolCallRequest[]; confidence: number}>;
}

interface MCPClient {
  listTools(): Promise<ToolDefinition[]>;
  callTool(name: string, args: any): Promise<any>;
}

interface LocalToolRegistry {
  getTool(name: string): Promise<ToolDefinition | null>;
  registerTool(tool: ToolDefinition): Promise<void>;
}

interface RoutingPolicy {
  decide(factors: any): RoutingDecision;
}

interface SecurityEngine {
  validateUserIntent(toolCall: ToolCallRequest, pspContext: PSPContext): Promise<{valid: boolean; reason?: string}>;
  checkPermissionBoundary(toolCall: ToolCallRequest, pspContext: PSPContext): Promise<{valid: boolean; reason?: string}>;
  validatePrivacyCompliance(toolCall: ToolCallRequest, pspContext: PSPContext): Promise<{valid: boolean; reason?: string}>;
  validateParameterFormat(args: any): {valid: boolean; errors: string[]};
  validateParameterTypes(args: any): {valid: boolean; errors: string[]};
  validateBusinessRules(toolCall: ToolCallRequest): Promise<{valid: boolean; reason?: string}>;
}

interface SandboxManager {
  createSandbox(toolCall: ToolCallRequest, pspContext: PSPContext): Promise<ExecutionSandbox>;
}

interface ExecutionSandbox {
  execute(toolCall: ToolCallRequest, pspContext: PSPContext): Promise<any>;
  detectAnomalies(): any[];
  getResourceUsage(): any;
}

interface AuditLogger {
  logExecutionStart(toolCall: ToolCallRequest, pspContext: PSPContext): Promise<void>;
  logExecutionSuccess(toolCall: ToolCallRequest, result: any, metadata: ExecutionMetadata): Promise<void>;
  logExecutionError(toolCall: ToolCallRequest, error: any, pspContext: PSPContext): Promise<void>;
}

interface PSPManager {
  loadPSPContext(userId: string, sessionContext?: any): Promise<PSPContext>;
  updateWithFeedback(pspContext: PSPContext, feedback: any): Promise<void>;
} 
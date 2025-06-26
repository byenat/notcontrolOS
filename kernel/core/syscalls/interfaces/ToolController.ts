/**
 * notcontrolOS工具调用控制器
 * 基于Claude和Gemini的成熟工具调用架构设计
 * 实现四层工具调用架构：意图理解 -> 路由决策 -> 执行控制 -> 结果处理
 */

// ============================================================================
// 核心类型定义
// ============================================================================

export interface ToolDefinition {
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

export interface ToolCallRequest {
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

export interface ToolCallResult {
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

export interface PSPContext {
  psp_master: Record<string, any>;
  current_psp: Record<string, any>;
  user_preferences: Record<string, any>;
  security_constraints: string[];
  privacy_level: 'public' | 'private' | 'sensitive';
}

// ============================================================================
// 第一层：意图理解和路由决策
// ============================================================================

export class IntentRouter {
  private localTools: Map<string, ToolDefinition> = new Map();
  private cloudTools: Map<string, ToolDefinition> = new Map();

  /**
   * 解析用户输入，基于PSP上下文生成工具调用意图
   * 参考Claude的函数调用机制
   */
  async parseToolCalls(
    userInput: string,
    availableTools: ToolDefinition[],
    pspContext: PSPContext
  ): Promise<ToolCallRequest[]> {
    // 1. PSP增强的意图分析
    const intentAnalysis = this.analyzePSPEnhancedIntent(userInput, pspContext);
    
    // 2. 安全预检查
    await this.performSecurityPrecheck(userInput, pspContext);
    
    // 3. 工具匹配和参数推理
    const matchedTools = this.matchToolsToIntent(intentAnalysis, availableTools, pspContext);
    
    // 4. 生成结构化工具调用请求
    return this.generateToolCallRequests(matchedTools, pspContext);
  }

  /**
   * 智能路由决策：本地 vs 云端
   * 参考Gemini的多模型路由策略
   */
  routeToolCall(toolCall: ToolCallRequest): {
    target: 'local' | 'cloud' | 'hybrid';
    reason: string;
    confidence: number;
  } {
    const factors = this.analyzeRoutingFactors(toolCall);
    
    // PSP相关任务优先本地处理
    if (factors.isPSPRelated) {
      return {
        target: 'local',
        reason: 'PSP相关任务本地优先，保护用户隐私',
        confidence: 0.95
      };
    }

    // 隐私敏感任务强制本地处理
    if (factors.isPrivacySensitive) {
      return {
        target: 'local',
        reason: '隐私敏感数据不允许云端处理',
        confidence: 0.9
      };
    }

    // 复杂推理任务云端协作
    if (factors.complexity > 0.7) {
      return {
        target: 'cloud',
        reason: '复杂推理任务需要云端大模型协作',
        confidence: 0.8
      };
    }

    // 实时响应需求本地优先
    if (factors.latencyRequirement === 'realtime') {
      return {
        target: 'local',
        reason: '实时响应需求，本地处理延迟更低',
        confidence: 0.85
      };
    }

    // 默认策略：成本优化的混合路由
    return {
      target: 'hybrid',
      reason: '采用混合策略，平衡性能、成本和隐私',
      confidence: 0.7
    };
  }

  private analyzePSPEnhancedIntent(userInput: string, pspContext: PSPContext): any {
    // 基于PSP_master分析用户真实意图
    return {
      intent: 'tool_call',
      confidence: 0.8,
      personal_context: pspContext.psp_master,
      inferred_parameters: {}
    };
  }

  private async performSecurityPrecheck(userInput: string, pspContext: PSPContext): Promise<void> {
    // 检查是否违反PSP安全边界
    const securityViolations = this.checkSecurityBoundaries(userInput, pspContext);
    if (securityViolations.length > 0) {
      throw new Error(`安全检查失败: ${securityViolations.join(', ')}`);
    }
  }

  private checkSecurityBoundaries(userInput: string, pspContext: PSPContext): string[] {
    const violations: string[] = [];
    
    // 检查权限边界
    if (this.exceedsPermissionBoundary(userInput, pspContext)) {
      violations.push('超出用户权限范围');
    }

    // 检查隐私边界
    if (this.violatesPrivacyConstraints(userInput, pspContext)) {
      violations.push('违反隐私约束条件');
    }

    return violations;
  }

  private matchToolsToIntent(
    intentAnalysis: any, 
    availableTools: ToolDefinition[], 
    pspContext: PSPContext
  ): Array<{tool: ToolDefinition; parameters: Record<string, any>}> {
    // 基于语义匹配和PSP偏好选择合适的工具
    return availableTools
      .filter(tool => this.isToolRelevant(tool, intentAnalysis, pspContext))
      .map(tool => ({
        tool,
        parameters: this.inferParameters(tool, intentAnalysis, pspContext)
      }));
  }

  private generateToolCallRequests(
    matchedTools: Array<{tool: ToolDefinition; parameters: Record<string, any>}>,
    pspContext: PSPContext
  ): ToolCallRequest[] {
    return matchedTools.map((match, index) => ({
      id: this.generateCallId(),
      name: match.tool.name,
      arguments: match.parameters,
      context: pspContext,
      metadata: {
        requested_by: this.determineRequestor(match.tool, pspContext),
        priority: this.determinePriority(match.tool, pspContext),
        timeout: this.calculateTimeout(match.tool),
        user_id: 'current_user', // 应从pspContext获取
        session_id: 'current_session'
      }
    }));
  }

  private analyzeRoutingFactors(toolCall: ToolCallRequest): any {
    return {
      isPSPRelated: this.isPSPRelatedTool(toolCall.name),
      isPrivacySensitive: toolCall.context.privacy_level === 'sensitive',
      complexity: this.estimateTaskComplexity(toolCall),
      latencyRequirement: this.getLatencyRequirement(toolCall)
    };
  }

  // 辅助方法
  private exceedsPermissionBoundary(userInput: string, pspContext: PSPContext): boolean { return false; }
  private violatesPrivacyConstraints(userInput: string, pspContext: PSPContext): boolean { return false; }
  private isToolRelevant(tool: ToolDefinition, intent: any, psp: PSPContext): boolean { return true; }
  private inferParameters(tool: ToolDefinition, intent: any, psp: PSPContext): Record<string, any> { return {}; }
  private generateCallId(): string { return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  private determineRequestor(tool: ToolDefinition, psp: PSPContext): 'local_llm' | 'cloud_model' { return 'local_llm'; }
  private determinePriority(tool: ToolDefinition, psp: PSPContext): 'high' | 'normal' | 'low' { return 'normal'; }
  private calculateTimeout(tool: ToolDefinition): number { return 30000; }
  private isPSPRelatedTool(toolName: string): boolean { return toolName.includes('psp'); }
  private estimateTaskComplexity(toolCall: ToolCallRequest): number { return 0.5; }
  private getLatencyRequirement(toolCall: ToolCallRequest): string { return 'normal'; }
}

// ============================================================================
// 第二层：执行控制和安全验证
// ============================================================================

export class ExecutionController {
  private localExecutor: LocalToolExecutor;
  private cloudExecutor: CloudToolExecutor;
  private securityValidator: SecurityValidator;

  constructor(
    localExecutor: LocalToolExecutor,
    cloudExecutor: CloudToolExecutor,
    securityValidator: SecurityValidator
  ) {
    this.localExecutor = localExecutor;
    this.cloudExecutor = cloudExecutor;
    this.securityValidator = securityValidator;
  }

  /**
   * 执行工具调用，实现三重安全验证
   * 参考Claude的安全执行模式
   */
  async executeToolCall(
    toolCall: ToolCallRequest,
    routingDecision: {target: 'local' | 'cloud' | 'hybrid'; reason: string; confidence: number}
  ): Promise<ToolCallResult> {
    const startTime = Date.now();

    try {
      // 第一重：PSP级别验证
      await this.securityValidator.validatePSPLevel(toolCall);

      // 第二重：系统级别验证
      await this.securityValidator.validateSystemLevel(toolCall);

      // 第三重：执行级别验证
      const executionResult = await this.performExecution(toolCall, routingDecision);

      const endTime = Date.now();
      
      return {
        id: toolCall.id,
        status: 'success',
        result: executionResult.data,
        metadata: {
          execution_time: endTime - startTime,
          cost_incurred: executionResult.cost || 0,
          resources_used: executionResult.resources || {},
          route_taken: routingDecision.target
        }
      };

    } catch (error) {
      return this.handleExecutionError(error, toolCall, startTime);
    }
  }

  private async performExecution(
    toolCall: ToolCallRequest,
    routingDecision: {target: 'local' | 'cloud' | 'hybrid'}
  ): Promise<{data: any; cost?: number; resources?: Record<string, any>}> {
    switch (routingDecision.target) {
      case 'local':
        return await this.localExecutor.execute(toolCall);
      case 'cloud':
        return await this.cloudExecutor.execute(toolCall);
      case 'hybrid':
        return await this.executeHybrid(toolCall);
      default:
        throw new Error(`Unknown routing target: ${routingDecision.target}`);
    }
  }

  private async executeHybrid(toolCall: ToolCallRequest): Promise<any> {
    // 混合执行策略：先尝试本地，失败则云端
    try {
      return await this.localExecutor.execute(toolCall);
    } catch (localError) {
      console.warn('Local execution failed, falling back to cloud:', localError.message);
      return await this.cloudExecutor.execute(toolCall);
    }
  }

  private handleExecutionError(error: any, toolCall: ToolCallRequest, startTime: number): ToolCallResult {
    const endTime = Date.now();
    
    let status: 'error' | 'timeout' | 'permission_denied' = 'error';
    if (error.message?.includes('timeout')) {
      status = 'timeout';
    } else if (error.message?.includes('permission') || error.message?.includes('权限')) {
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
        route_taken: 'local' // 错误情况下的默认值
      }
    };
  }

  private generateErrorSuggestion(error: any): string {
    if (error.message?.includes('permission') || error.message?.includes('权限')) {
      return '请检查您的PSP权限设置，或联系管理员获取相应权限';
    }
    if (error.message?.includes('timeout')) {
      return '任务执行超时，建议增加超时时间或简化任务复杂度';
    }
    if (error.message?.includes('parameter') || error.message?.includes('参数')) {
      return '请检查工具参数格式和类型是否正确';
    }
    return '请检查工具配置和网络连接，如问题持续请联系技术支持';
  }
}

// ============================================================================
// 第三层：notcontrolOS工具调用主控制器
// ============================================================================

export class NotcontrolosToolController {
  private intentRouter: IntentRouter;
  private executionController: ExecutionController;
  private toolRegistry: ToolRegistry;
  private pspManager: PSPManager;

  constructor(
    intentRouter: IntentRouter,
    executionController: ExecutionController,
    toolRegistry: ToolRegistry,
    pspManager: PSPManager
  ) {
    this.intentRouter = intentRouter;
    this.executionController = executionController;
    this.toolRegistry = toolRegistry;
    this.pspManager = pspManager;
  }

  /**
   * 主要入口：处理用户输入并执行工具调用
   * 整合四层架构的完整流程
   */
  async processUserRequest(
    userInput: string,
    userId: string,
    sessionContext?: Record<string, any>
  ): Promise<{
    results: ToolCallResult[];
    summary: string;
    context_updates: any;
  }> {
    // 1. 加载PSP上下文
    const pspContext = await this.pspManager.loadUserPSPContext(userId, sessionContext);

    // 2. 获取可用工具列表
    const availableTools = await this.toolRegistry.getAvailableTools(pspContext);

    // 3. 意图理解和工具调用生成
    const toolCalls = await this.intentRouter.parseToolCalls(userInput, availableTools, pspContext);

    if (toolCalls.length === 0) {
      return {
        results: [],
        summary: '未识别到需要工具调用的任务',
        context_updates: {}
      };
    }

    // 4. 执行所有工具调用
    const results: ToolCallResult[] = [];
    
    for (const toolCall of toolCalls) {
      // 路由决策
      const routingDecision = this.intentRouter.routeToolCall(toolCall);
      
      // 执行工具调用
      const result = await this.executionController.executeToolCall(toolCall, routingDecision);
      results.push(result);
      
      // PSP学习反馈
      await this.providePSPFeedback(toolCall, result, pspContext);
    }

    // 5. 生成执行摘要
    const summary = this.generateExecutionSummary(results, userInput);

    // 6. 更新上下文
    const contextUpdates = await this.updateContextWithResults(results, pspContext);

    return {
      results,
      summary,
      context_updates: contextUpdates
    };
  }

  /**
   * PSP学习反馈机制
   * 基于执行结果优化用户的个人系统提示词
   */
  private async providePSPFeedback(
    toolCall: ToolCallRequest,
    result: ToolCallResult,
    pspContext: PSPContext
  ): Promise<void> {
    const feedback = {
      tool_name: toolCall.name,
      success: result.status === 'success',
      execution_time: result.metadata.execution_time,
      cost: result.metadata.cost_incurred,
      route_taken: result.metadata.route_taken,
      user_satisfaction_score: this.calculateSatisfactionScore(result),
      improvement_suggestions: this.generateImprovementSuggestions(toolCall, result)
    };

    await this.pspManager.updatePSPWithFeedback(pspContext, feedback);
  }

  private generateExecutionSummary(results: ToolCallResult[], userInput: string): string {
    const successful = results.filter(r => r.status === 'success').length;
    const total = results.length;
    const totalTime = results.reduce((sum, r) => sum + r.metadata.execution_time, 0);
    const totalCost = results.reduce((sum, r) => sum + r.metadata.cost_incurred, 0);

    return `执行完成：${successful}/${total} 个工具调用成功，总耗时 ${totalTime}ms，总成本 ¥${totalCost.toFixed(4)}`;
  }

  private async updateContextWithResults(
    results: ToolCallResult[],
    pspContext: PSPContext
  ): Promise<Record<string, any>> {
    // 基于工具调用结果更新会话上下文
    return {
      last_tool_calls: results.map(r => ({
        tool: r.id,
        status: r.status,
        timestamp: Date.now()
      })),
      updated_preferences: await this.extractUpdatedPreferences(results, pspContext)
    };
  }

  private calculateSatisfactionScore(result: ToolCallResult): number {
    if (result.status === 'success') {
      // 基于执行时间和成本计算满意度
      const timeScore = Math.max(0, 1 - result.metadata.execution_time / 10000); // 10s为基准
      const costScore = Math.max(0, 1 - result.metadata.cost_incurred / 0.1); // ¥0.1为基准
      return (timeScore + costScore) / 2;
    }
    return 0.2; // 失败情况下的基础分数
  }

  private generateImprovementSuggestions(
    toolCall: ToolCallRequest,
    result: ToolCallResult
  ): string[] {
    const suggestions: string[] = [];

    if (result.status !== 'success') {
      suggestions.push('考虑调整工具参数或选择替代工具');
    }

    if (result.metadata.execution_time > 5000) {
      suggestions.push('执行时间较长，建议优化参数或使用本地工具');
    }

    if (result.metadata.cost_incurred > 0.05) {
      suggestions.push('成本较高，建议使用免费的本地工具替代');
    }

    return suggestions;
  }

  private async extractUpdatedPreferences(
    results: ToolCallResult[],
    pspContext: PSPContext
  ): Promise<Record<string, any>> {
    // 从执行结果中提取用户偏好更新
    const preferences: Record<string, any> = {};

    const successfulLocalCalls = results.filter(r => 
      r.status === 'success' && r.metadata.route_taken === 'local'
    ).length;

    const successfulCloudCalls = results.filter(r => 
      r.status === 'success' && r.metadata.route_taken === 'cloud'
    ).length;

    if (successfulLocalCalls > successfulCloudCalls) {
      preferences.preferred_execution_mode = 'local';
    } else if (successfulCloudCalls > successfulLocalCalls) {
      preferences.preferred_execution_mode = 'cloud';
    }

    return preferences;
  }
}

// ============================================================================
// 辅助接口定义
// ============================================================================

interface LocalToolExecutor {
  execute(toolCall: ToolCallRequest): Promise<{data: any; cost?: number; resources?: Record<string, any>}>;
}

interface CloudToolExecutor {
  execute(toolCall: ToolCallRequest): Promise<{data: any; cost?: number; resources?: Record<string, any>}>;
}

interface SecurityValidator {
  validatePSPLevel(toolCall: ToolCallRequest): Promise<void>;
  validateSystemLevel(toolCall: ToolCallRequest): Promise<void>;
}

interface ToolRegistry {
  getAvailableTools(pspContext: PSPContext): Promise<ToolDefinition[]>;
  registerTool(tool: ToolDefinition): Promise<void>;
}

interface PSPManager {
  loadUserPSPContext(userId: string, sessionContext?: Record<string, any>): Promise<PSPContext>;
  updatePSPWithFeedback(pspContext: PSPContext, feedback: any): Promise<void>;
}

export { NotcontrolosToolController as default }; 
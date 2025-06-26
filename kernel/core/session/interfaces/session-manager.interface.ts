/**
 * notcontrolOS Session Manager Interface
 *
 * 定义notcontrolOS会话进程管理的核心接口规范
 * 所有会话管理实现必须遵循此接口
 */

export interface SessionContext {
  /** 会话唯一标识符 */
  sessionId: string;
  /** 用户ID */
  userId: string;
  /** 会话创建时间 */
  createdAt: Date;
  /** 最后活跃时间 */
  lastActiveAt: Date;
  /** 会话状态 */
  status: SessionStatus;
  /** PSP上下文 */
  pspContext: PSPContext;
  /** 会话配置 */
  config: SessionConfig;
  /** 会话元数据 */
  metadata: Record<string, any>;
}

export enum SessionStatus {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  IDLE = 'idle',
  SUSPENDED = 'suspended',
  TERMINATING = 'terminating',
  TERMINATED = 'terminated',
  ERROR = 'error'
}

export interface SessionConfig {
  /** 最大空闲时间（毫秒） */
  maxIdleTime: number;
  /** 上下文窗口大小 */
  contextWindowSize: number;
  /** 会话优先级 */
  priority: SessionPriority;
  /** 是否持久化 */
  persistent: boolean;
  /** 资源限制 */
  resourceLimits: ResourceLimits;
}

export enum SessionPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface ResourceLimits {
  /** 最大内存使用（MB） */
  maxMemoryMB: number;
  /** 最大CPU使用率（%） */
  maxCpuPercent: number;
  /** 最大并发工具调用数 */
  maxConcurrentTools: number;
  /** 最大会话时长（毫秒） */
  maxSessionDuration: number;
}

export interface PSPContext {
  /** PSP_master内容 */
  pspMaster: PSPMaster;
  /** 当前激活的功能PSP */
  activePSPs: Map<string, FunctionalPSP>;
  /** PSP执行历史 */
  pspHistory: PSPExecutionRecord[];
  /** 学习数据 */
  learningData: PSPLearningData;
}

export interface PSPMaster {
  /** PSP_master版本 */
  version: string;
  /** 个人档案 */
  personalProfile: Record<string, any>;
  /** 行为模式 */
  behavioralPatterns: Record<string, any>;
  /** 关系网络 */
  relationshipContext: Record<string, any>;
  /** 偏好约束 */
  preferencesAndConstraints: Record<string, any>;
  /** 系统提示词 */
  systemPromptForPSPs: string;
  /** PSP集成规则 */
  pspIntegrationRules: Record<string, any>;
}

export interface FunctionalPSP {
  /** PSP名称 */
  name: string;
  /** PSP版本 */
  version: string;
  /** PSP类型 */
  category: string;
  /** 系统提示词 */
  systemPrompt: string;
  /** 执行逻辑 */
  executionLogic: Record<string, any>;
  /** 工具集成 */
  toolsIntegration: Record<string, any>;
  /** 隐私设置 */
  privacySettings: Record<string, any>;
}

export interface PSPExecutionRecord {
  /** 执行时间 */
  timestamp: Date;
  /** PSP名称 */
  pspName: string;
  /** 输入内容 */
  input: string;
  /** 输出结果 */
  output: string;
  /** 执行耗时 */
  executionTime: number;
  /** 用户反馈 */
  userFeedback?: UserFeedback;
}

export interface PSPLearningData {
  /** 使用频率统计 */
  usageStats: Map<string, number>;
  /** 成功率统计 */
  successRates: Map<string, number>;
  /** 用户偏好变化 */
  preferenceChanges: PreferenceChange[];
  /** 优化建议 */
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface UserFeedback {
  /** 满意度评分 (1-5) */
  satisfaction: number;
  /** 反馈内容 */
  feedback?: string;
  /** 纠正建议 */
  corrections?: string[];
}

export interface PreferenceChange {
  /** 变化时间 */
  timestamp: Date;
  /** 变化类型 */
  type: string;
  /** 旧值 */
  oldValue: any;
  /** 新值 */
  newValue: any;
  /** 置信度 */
  confidence: number;
}

export interface OptimizationSuggestion {
  /** 建议类型 */
  type: string;
  /** 建议描述 */
  description: string;
  /** 预期改进 */
  expectedImprovement: number;
  /** 风险评估 */
  riskAssessment: string;
}

export interface SessionCreationRequest {
  /** 用户ID */
  userId: string;
  /** 会话配置 */
  config?: Partial<SessionConfig>;
  /** 初始PSP上下文 */
  initialPSPContext?: Partial<PSPContext>;
  /** 会话元数据 */
  metadata?: Record<string, any>;
}

export interface SessionUpdateRequest {
  /** 会话ID */
  sessionId: string;
  /** 更新的配置 */
  config?: Partial<SessionConfig>;
  /** 更新的PSP上下文 */
  pspContext?: Partial<PSPContext>;
  /** 更新的元数据 */
  metadata?: Record<string, any>;
}

export interface SessionQueryOptions {
  /** 用户ID过滤 */
  userId?: string;
  /** 状态过滤 */
  status?: SessionStatus[];
  /** 创建时间范围 */
  createdAfter?: Date;
  createdBefore?: Date;
  /** 分页参数 */
  limit?: number;
  offset?: number;
  /** 排序方式 */
  sortBy?: 'createdAt' | 'lastActiveAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * notcontrolOS Session Manager 主接口
 * 
 * 定义会话生命周期管理的核心功能
 */
export interface SessionManager {
  /**
   * 创建新会话
   * @param request 会话创建请求
   * @returns 创建的会话上下文
   */
  createSession(request: SessionCreationRequest): Promise<SessionContext>;

  /**
   * 获取会话信息
   * @param sessionId 会话ID
   * @returns 会话上下文
   */
  getSession(sessionId: string): Promise<SessionContext | null>;

  /**
   * 更新会话
   * @param request 会话更新请求
   * @returns 更新后的会话上下文
   */
  updateSession(request: SessionUpdateRequest): Promise<SessionContext>;

  /**
   * 终止会话
   * @param sessionId 会话ID
   * @param reason 终止原因
   */
  terminateSession(sessionId: string, reason?: string): Promise<void>;

  /**
   * 查询会话
   * @param options 查询选项
   * @returns 符合条件的会话列表
   */
  querySessions(options: SessionQueryOptions): Promise<SessionContext[]>;

  /**
   * 暂停会话
   * @param sessionId 会话ID
   */
  suspendSession(sessionId: string): Promise<void>;

  /**
   * 恢复会话
   * @param sessionId 会话ID
   */
  resumeSession(sessionId: string): Promise<void>;

  /**
   * 获取会话统计信息
   * @param userId 用户ID（可选）
   * @returns 统计信息
   */
  getSessionStats(userId?: string): Promise<SessionStats>;

  /**
   * 清理空闲会话
   * @param maxIdleTime 最大空闲时间
   * @returns 清理的会话数量
   */
  cleanupIdleSessions(maxIdleTime?: number): Promise<number>;
}

export interface SessionStats {
  /** 总会话数 */
  totalSessions: number;
  /** 活跃会话数 */
  activeSessions: number;
  /** 空闲会话数 */
  idleSessions: number;
  /** 平均会话时长 */
  averageSessionDuration: number;
  /** PSP使用统计 */
  pspUsageStats: Map<string, number>;
  /** 资源使用统计 */
  resourceUsageStats: ResourceUsageStats;
}

export interface ResourceUsageStats {
  /** 平均内存使用 */
  averageMemoryUsage: number;
  /** 峰值内存使用 */
  peakMemoryUsage: number;
  /** 平均CPU使用率 */
  averageCpuUsage: number;
  /** 峰值CPU使用率 */
  peakCpuUsage: number;
} 
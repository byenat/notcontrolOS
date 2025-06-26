/**
 * notcontrolOS-MCP集成模块
 * 基于Model Context Protocol (MCP) 实现工具调用的标准化集成
 * 参考Claude Desktop和其他成熟MCP客户端的实现模式
 */

import { ToolDefinition, ToolCallRequest, PSPContext } from './ToolController';

// ============================================================================
// MCP协议标准类型定义
// ============================================================================

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

interface MCPToolCallResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
  _meta?: Record<string, any>;
}

interface MCPListToolsResponse {
  tools: MCPTool[];
}

// ============================================================================
// notcontrolOS-MCP适配器
// ============================================================================

class NotcontrolosMCPAdapter {
  private toolRegistry: Map<string, ToolDefinition> = new Map();
  private serverConfigs: Map<string, any> = new Map();

  constructor() {
    this.initializeBuiltinTools();
  }

  /**
   * 初始化内置工具定义
   * 基于现有的Karakeep MCP实现
   */
  private initializeBuiltinTools(): void {
    // 基于现有karakeep MCP工具定义
    this.registerTool({
      name: 'search-bookmarks',
      description: '搜索匹配特定查询的书签',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询，支持全文搜索和限定符'
          },
          limit: {
            type: 'number',
            description: '单次查询返回的结果数量',
            required: false
          }
        },
        required: ['query']
      },
      metadata: {
        category: 'hybrid',
        privacy_level: 'private',
        cost_estimate: 'free',
        latency_expectation: 'fast',
        required_permissions: ['read'],
        psp_integration: true
      }
    });

    this.registerTool({
      name: 'get-bookmark',
      description: '根据ID获取书签详情',
      parameters: {
        type: 'object',
        properties: {
          bookmarkId: {
            type: 'string',
            description: '要获取的书签ID'
          }
        },
        required: ['bookmarkId']
      },
      metadata: {
        category: 'hybrid',
        privacy_level: 'private',
        cost_estimate: 'free',
        latency_expectation: 'fast',
        required_permissions: ['read'],
        psp_integration: false
      }
    });

    this.registerTool({
      name: 'create-bookmark',
      description: '创建链接书签或文本书签',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: '书签类型：link 或 text'
          },
          title: {
            type: 'string',
            description: '书签标题',
            required: false
          },
          content: {
            type: 'string',
            description: '如果类型是text，则为要收藏的文本；如果类型是link，则为URL'
          }
        },
        required: ['type', 'content']
      },
      metadata: {
        category: 'hybrid',
        privacy_level: 'private',
        cost_estimate: 'free',
        latency_expectation: 'normal',
        required_permissions: ['write'],
        psp_integration: true
      }
    });

    // PSP相关工具
    this.registerTool({
      name: 'update-psp-preferences',
      description: '更新用户的个人系统提示词偏好设置',
      parameters: {
        type: 'object',
        properties: {
          preference_type: {
            type: 'string',
            description: '偏好类型：language, format, privacy, etc.'
          },
          value: {
            type: 'string',
            description: '偏好值'
          }
        },
        required: ['preference_type', 'value']
      },
      metadata: {
        category: 'local',
        privacy_level: 'sensitive',
        cost_estimate: 'free',
        latency_expectation: 'realtime',
        required_permissions: ['write'],
        psp_integration: true
      }
    });

    this.registerTool({
      name: 'get-psp-context',
      description: '获取当前用户的PSP上下文信息',
      parameters: {
        type: 'object',
        properties: {
          context_type: {
            type: 'string',
            description: '上下文类型：master, current, preferences, constraints'
          }
        },
        required: ['context_type']
      },
      metadata: {
        category: 'local',
        privacy_level: 'sensitive',
        cost_estimate: 'free',
        latency_expectation: 'realtime',
        required_permissions: ['read'],
        psp_integration: true
      }
    });
  }

  /**
   * 注册工具到内部注册表
   */
  registerTool(toolDef: ToolDefinition): void {
    this.toolRegistry.set(toolDef.name, toolDef);
  }

  /**
   * 获取所有可用工具
   */
  async getAvailableTools(pspContext?: PSPContext): Promise<ToolDefinition[]> {
    const tools = Array.from(this.toolRegistry.values());
    
    // 基于PSP上下文过滤工具
    if (pspContext) {
      return tools.filter(tool => this.isToolAccessible(tool, pspContext));
    }
    
    return tools;
  }

  /**
   * 执行工具调用
   */
  async executeToolCall(toolCall: ToolCallRequest): Promise<{
    data: any;
    cost?: number;
    resources?: Record<string, any>;
  }> {
    const toolDef = this.toolRegistry.get(toolCall.name);
    
    if (!toolDef) {
      throw new Error(`工具 ${toolCall.name} 未找到`);
    }

    // PSP增强的参数处理
    const enhancedArgs = await this.enhanceParametersWithPSP(
      toolCall.arguments,
      toolCall.context,
      toolDef
    );

    // 执行具体工具的逻辑
    const result = await this.executeSpecificTool(toolCall.name, enhancedArgs, toolCall.context);

    return {
      data: result,
      cost: this.calculateToolCost(toolCall.name),
      resources: {
        tool: toolCall.name,
        execution_time: Date.now()
      }
    };
  }

  /**
   * 执行具体工具的业务逻辑
   */
  private async executeSpecificTool(
    toolName: string,
    args: Record<string, any>,
    pspContext: PSPContext
  ): Promise<any> {
    switch (toolName) {
      case 'search-bookmarks':
        return this.searchBookmarks(args.query, args.limit, pspContext);
      
      case 'get-bookmark':
        return this.getBookmark(args.bookmarkId, pspContext);
      
      case 'create-bookmark':
        return this.createBookmark(args.type, args.content, args.title, pspContext);
      
      case 'update-psp-preferences':
        return this.updatePSPPreferences(args.preference_type, args.value, pspContext);
      
      case 'get-psp-context':
        return this.getPSPContext(args.context_type, pspContext);
      
      default:
        throw new Error(`工具 ${toolName} 未实现`);
    }
  }

  // ============================================================================
  // 具体工具实现
  // ============================================================================

  private async searchBookmarks(
    query: string,
    limit: number = 10,
    pspContext: PSPContext
  ): Promise<any> {
    // 基于PSP偏好调整搜索行为
    const userPrefs = pspContext.user_preferences;
    const enhancedQuery = this.enhanceSearchQuery(query, userPrefs);
    
    // 模拟搜索结果
    return {
      bookmarks: [
        {
          id: 'bm_001',
          title: '示例书签',
          url: 'https://example.com',
          tags: ['示例', 'notcontrolOS'],
          created_at: new Date().toISOString()
        }
      ],
      nextCursor: null,
      total: 1
    };
  }

  private async getBookmark(bookmarkId: string, pspContext: PSPContext): Promise<any> {
    // 权限检查
    if (!this.hasPermission(pspContext, 'read', bookmarkId)) {
      throw new Error('没有访问此书签的权限');
    }

    return {
      id: bookmarkId,
      title: '示例书签详情',
      url: 'https://example.com',
      content: '这是一个示例书签的详细内容',
      tags: ['示例'],
      created_at: new Date().toISOString()
    };
  }

  private async createBookmark(
    type: 'link' | 'text',
    content: string,
    title?: string,
    pspContext?: PSPContext
  ): Promise<any> {
    // 基于PSP自动生成标题和标签
    const autoTitle = title || this.generateAutoTitle(content, type, pspContext);
    const autoTags = this.generateAutoTags(content, pspContext);

    const newBookmark = {
      id: `bm_${Date.now()}`,
      type,
      title: autoTitle,
      content,
      tags: autoTags,
      created_at: new Date().toISOString()
    };

    // PSP学习：记录用户创建偏好
    await this.updatePSPLearning(pspContext, 'bookmark_creation', {
      type,
      auto_title_used: !title,
      generated_tags: autoTags
    });

    return newBookmark;
  }

  private async updatePSPPreferences(
    preferenceType: string,
    value: string,
    pspContext: PSPContext
  ): Promise<any> {
    // 更新PSP偏好设置
    pspContext.user_preferences[preferenceType] = value;
    
    return {
      success: true,
      updated_preference: preferenceType,
      new_value: value,
      timestamp: new Date().toISOString()
    };
  }

  private async getPSPContext(
    contextType: string,
    pspContext: PSPContext
  ): Promise<any> {
    switch (contextType) {
      case 'master':
        return { psp_master: pspContext.psp_master };
      case 'current':
        return { current_psp: pspContext.current_psp };
      case 'preferences':
        return { user_preferences: pspContext.user_preferences };
      case 'constraints':
        return { security_constraints: pspContext.security_constraints };
      default:
        return pspContext;
    }
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private isToolAccessible(tool: ToolDefinition, pspContext: PSPContext): boolean {
    // 检查隐私级别权限
    if (tool.metadata.privacy_level === 'sensitive' && 
        pspContext.privacy_level !== 'sensitive') {
      return false;
    }

    // 检查所需权限
    const userPermissions = pspContext.security_constraints || [];
    const requiredPermissions = tool.metadata.required_permissions;
    
    return requiredPermissions.every(perm => 
      userPermissions.includes(perm) || userPermissions.includes('admin')
    );
  }

  private async enhanceParametersWithPSP(
    originalArgs: Record<string, any>,
    pspContext: PSPContext,
    toolDef: ToolDefinition
  ): Promise<Record<string, any>> {
    const enhancedArgs = { ...originalArgs };

    // 从PSP中提取默认值
    const pspDefaults = pspContext.psp_master.tool_defaults?.[toolDef.name] || {};
    
    // 应用默认值（不覆盖已提供的参数）
    for (const [key, defaultValue] of Object.entries(pspDefaults)) {
      if (!(key in enhancedArgs)) {
        enhancedArgs[key] = defaultValue;
      }
    }

    // 应用用户偏好
    if (pspContext.user_preferences.language && !enhancedArgs.language) {
      enhancedArgs.language = pspContext.user_preferences.language;
    }

    return enhancedArgs;
  }

  private enhanceSearchQuery(query: string, userPrefs: Record<string, any>): string {
    // 基于用户偏好增强搜索查询
    let enhancedQuery = query;
    
    // 添加用户偏好的标签过滤
    if (userPrefs.preferred_tags) {
      const tags = userPrefs.preferred_tags.join(' OR #');
      enhancedQuery += ` AND (#${tags})`;
    }
    
    // 添加时间范围偏好
    if (userPrefs.time_range) {
      enhancedQuery += ` after:${userPrefs.time_range}`;
    }
    
    return enhancedQuery;
  }

  private hasPermission(
    pspContext: PSPContext,
    action: string,
    resourceId: string
  ): boolean {
    const constraints = pspContext.security_constraints;
    
    // 简化的权限检查逻辑
    if (constraints.includes('admin')) {
      return true;
    }
    
    if (action === 'read' && constraints.includes('read')) {
      return true;
    }
    
    if (action === 'write' && constraints.includes('write')) {
      return true;
    }
    
    return false;
  }

  private generateAutoTitle(
    content: string,
    type: 'link' | 'text',
    pspContext?: PSPContext
  ): string {
    if (type === 'link') {
      try {
        const url = new URL(content);
        return `来自 ${url.hostname} 的链接`;
      } catch {
        return '链接书签';
      }
    } else {
      // 生成文本书签的标题
      const words = content.split(' ').slice(0, 5);
      return words.join(' ') + (content.split(' ').length > 5 ? '...' : '');
    }
  }

  private generateAutoTags(content: string, pspContext?: PSPContext): string[] {
    const tags: string[] = [];
    
    // 基于内容生成标签
    if (content.includes('notcontrolOS') || content.includes('notcontrolos')) {
      tags.push('notcontrolOS');
    }
    
    if (content.includes('AI') || content.includes('人工智能')) {
      tags.push('AI');
    }
    
    // 基于PSP偏好添加默认标签
    const userTags = pspContext?.user_preferences.default_tags || [];
    tags.push(...userTags);
    
    return [...new Set(tags)]; // 去重
  }

  private async updatePSPLearning(
    pspContext: PSPContext | undefined,
    actionType: string,
    data: any
  ): Promise<void> {
    if (!pspContext) return;
    
    // 更新PSP学习数据
    if (!pspContext.psp_master.learning_data) {
      pspContext.psp_master.learning_data = {};
    }
    
    if (!pspContext.psp_master.learning_data[actionType]) {
      pspContext.psp_master.learning_data[actionType] = [];
    }
    
    pspContext.psp_master.learning_data[actionType].push({
      timestamp: Date.now(),
      data
    });
  }

  private calculateToolCost(toolName: string): number {
    // 简单的成本计算
    const costMap: Record<string, number> = {
      'search-bookmarks': 0.001,
      'get-bookmark': 0.0005,
      'create-bookmark': 0.002,
      'update-psp-preferences': 0,
      'get-psp-context': 0
    };
    
    return costMap[toolName] || 0.001;
  }
}

export { NotcontrolosMCPAdapter }; 
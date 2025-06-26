/**
 * PSP上下文接口定义
 * 
 * 为notcontrolOS系统提供统一的PSP上下文访问接口
 */

export interface PSPContext {
  // PSP基础信息
  pspId: string;
  pspType: PSPType;
  layer: PSPLayer;
  version: string;
  
  // 继承关系
  parentPSP?: string;
  inheritedProperties: Record<string, any>;
  
  // 上下文数据
  userPreferences: UserPreferences;
  sessionData: SessionData;
  executionHistory: ExecutionRecord[];
  
  // 方法
  getInheritedProperty(key: string): any;
  setContextProperty(key: string, value: any): void;
  validateAccess(operation: string, resource: string): boolean;
  createChildContext(childPSPId: string): PSPContext;
}

export enum PSPType {
  MASTER = 'master',
  FUNCTIONAL = 'functional', 
  WORKFLOW = 'workflow',
  TEMPORARY = 'temporary'
}

export enum PSPLayer {
  MASTER = 1,
  FUNCTIONAL = 2,
  WORKFLOW = 2,
  TEMPORARY = 3
}

export interface UserPreferences {
  communicationStyle: string;
  languagePreferences: string[];
  privacySettings: PrivacySettings;
  timezoneSettings: TimezoneSettings;
  behaviorPatterns: Record<string, any>;
}

export interface PrivacySettings {
  dataRetention: 'session' | 'persistent' | 'custom';
  shareWithParentPSP: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed';
  encryptionRequired: boolean;
}

export interface TimezoneSettings {
  timezone: string;
  locale: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export interface SessionData {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  activeTools: string[];
  contextVariables: Record<string, any>;
}

export interface ExecutionRecord {
  timestamp: Date;
  operation: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
  error?: string;
} 
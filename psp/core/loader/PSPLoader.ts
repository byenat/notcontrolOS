/**
 * PSP加载器
 * 
 * 负责加载、验证和初始化PSP实例
 */

import { PSPContext, PSPType, PSPLayer } from '../../interfaces/api/PSPContext';
import { CompiledPSP } from '../compiler/PSPCompiler';
import { PSPValidator } from '../validator/PSPValidator';

export class PSPLoader {
    private static instance: PSPLoader;
    private loadedPSPs: Map<string, CompiledPSP> = new Map();
    private pspValidator: PSPValidator;
    
    private constructor() {
        this.pspValidator = new PSPValidator();
    }
    
    public static getInstance(): PSPLoader {
        if (!PSPLoader.instance) {
            PSPLoader.instance = new PSPLoader();
        }
        return PSPLoader.instance;
    }
    
    /**
     * 加载PSP实例
     */
    public async loadPSP(pspId: string, userId: string): Promise<PSPContext> {
        try {
            // 1. 检查缓存
            if (this.loadedPSPs.has(pspId)) {
                return this.createContextFromCached(pspId, userId);
            }
            
            // 2. 加载PSP定义
            const pspDefinition = await this.loadPSPDefinition(pspId);
            
            // 3. 验证PSP
            const validationResult = await this.pspValidator.validate(pspDefinition);
            if (!validationResult.isValid) {
                throw new Error(`PSP验证失败: ${validationResult.errors.join(', ')}`);
            }
            
            // 4. 解析继承关系
            const resolvedPSP = await this.resolveInheritance(pspDefinition, userId);
            
            // 5. 创建PSP上下文
            const context = await this.createPSPContext(resolvedPSP, userId);
            
            // 6. 缓存已加载的PSP
            this.loadedPSPs.set(pspId, resolvedPSP);
            
            return context;
            
        } catch (error) {
            console.error(`加载PSP失败 [${pspId}]:`, error);
            throw error;
        }
    }
    
    /**
     * 解析PSP继承关系
     */
    private async resolveInheritance(pspDefinition: any, userId: string): Promise<CompiledPSP> {
        const inheritanceChain = await this.buildInheritanceChain(pspDefinition);
        
        // 从最顶层（PSP_master）开始合并属性
        let resolvedPSP = { ...pspDefinition };
        
        for (const parentPSP of inheritanceChain.reverse()) {
            resolvedPSP = this.mergeWithParent(resolvedPSP, parentPSP);
        }
        
        return resolvedPSP as CompiledPSP;
    }
    
    /**
     * 构建继承链
     */
    private async buildInheritanceChain(pspDefinition: any): Promise<any[]> {
        const chain: any[] = [];
        let current = pspDefinition;
        
        while (current.inherit_from) {
            const parentPSP = await this.loadPSPDefinition(current.inherit_from);
            chain.push(parentPSP);
            current = parentPSP;
        }
        
        return chain;
    }
    
    /**
     * 合并子PSP和父PSP的属性
     */
    private mergeWithParent(childPSP: any, parentPSP: any): any {
        const merged = { ...parentPSP };
        
        // 合并配置
        if (childPSP.psp_config) {
            merged.psp_config = {
                ...merged.psp_config,
                ...childPSP.psp_config
            };
        }
        
        // 处理工具继承
        if (childPSP.psp_config?.tools) {
            merged.psp_config.tools = {
                required: [
                    ...(merged.psp_config?.tools?.required || []),
                    ...(childPSP.psp_config.tools.required || [])
                ],
                optional: [
                    ...(merged.psp_config?.tools?.optional || []),
                    ...(childPSP.psp_config.tools.optional || [])
                ]
            };
        }
        
        // 保留子PSP的元数据
        if (childPSP.psp_metadata) {
            merged.psp_metadata = childPSP.psp_metadata;
        }
        
        return merged;
    }
    
    /**
     * 创建PSP上下文
     */
    private async createPSPContext(compiledPSP: CompiledPSP, userId: string): Promise<PSPContext> {
        const sessionData = await this.loadSessionData(userId);
        const userPreferences = await this.loadUserPreferences(userId);
        
        return {
            pspId: compiledPSP.psp_metadata.name,
            pspType: compiledPSP.psp_metadata.type as PSPType,
            layer: compiledPSP.psp_metadata.layer as PSPLayer,
            version: compiledPSP.psp_metadata.version,
            parentPSP: compiledPSP.psp_metadata.inherit_from,
            inheritedProperties: this.extractInheritedProperties(compiledPSP),
            userPreferences,
            sessionData,
            executionHistory: [],
            
            // 方法实现
            getInheritedProperty: (key: string) => {
                return this.getInheritedProperty(compiledPSP, key);
            },
            setContextProperty: (key: string, value: any) => {
                sessionData.contextVariables[key] = value;
            },
            validateAccess: (operation: string, resource: string) => {
                return this.validateAccess(compiledPSP, operation, resource);
            },
            createChildContext: (childPSPId: string) => {
                return this.loadPSP(childPSPId, userId);
            }
        };
    }
    
    /**
     * 加载PSP定义文件
     */
    private async loadPSPDefinition(pspId: string): Promise<any> {
        // 根据PSP类型确定加载路径
        const pspPath = this.resolvePSPPath(pspId);
        
        // 这里应该从文件系统或数据库加载PSP定义
        // 暂时返回模拟数据
        if (pspId === 'PSP_master') {
            return await this.loadMasterPSP();
        }
        
        // 加载其他类型的PSP
        return await this.loadPSPFromPath(pspPath);
    }
    
    private async loadMasterPSP(): Promise<any> {
        // 加载PSP_master
        return {
            psp_metadata: {
                name: 'PSP_master',
                type: 'master',
                layer: 1,
                version: '1.0.0'
            },
            psp_config: {
                base_prompt: '你是一个个性化AI助手...',
                user_preferences: {},
                behavior_patterns: {},
                security: {
                    access_level: 'master'
                }
            }
        };
    }
    
    private resolvePSPPath(pspId: string): string {
        // 根据PSP命名约定解析路径
        if (pspId.startsWith('functional_')) {
            return `../functional/${pspId.replace('functional_', '')}`;
        } else if (pspId.startsWith('workflow_')) {
            return `../workflow/${pspId.replace('workflow_', '')}`;
        } else if (pspId.startsWith('temp_')) {
            return `../temporary/${pspId.replace('temp_', '')}`;
        }
        return `../master/${pspId}`;
    }
    
    private async loadPSPFromPath(path: string): Promise<any> {
        // 实际实现应该从文件系统加载
        throw new Error(`加载PSP失败: ${path}`);
    }
    
    private async loadSessionData(userId: string): Promise<any> {
        // 加载用户会话数据
        return {
            sessionId: `session_${Date.now()}`,
            startTime: new Date(),
            lastActivity: new Date(),
            activeTools: [],
            contextVariables: {}
        };
    }
    
    private async loadUserPreferences(userId: string): Promise<any> {
        // 加载用户偏好设置
        return {
            communicationStyle: 'professional',
            languagePreferences: ['zh-CN'],
            privacySettings: {
                dataRetention: 'session',
                shareWithParentPSP: true,
                logLevel: 'standard',
                encryptionRequired: false
            },
            timezoneSettings: {
                timezone: 'Asia/Shanghai',
                locale: 'zh-CN',
                dateFormat: 'YYYY-MM-DD',
                timeFormat: '24h'
            },
            behaviorPatterns: {}
        };
    }
    
    private extractInheritedProperties(compiledPSP: CompiledPSP): Record<string, any> {
        return compiledPSP.psp_config?.inheritance?.from_master || {};
    }
    
    private getInheritedProperty(compiledPSP: CompiledPSP, key: string): any {
        return compiledPSP.psp_config?.inheritance?.from_master?.[key];
    }
    
    private validateAccess(compiledPSP: CompiledPSP, operation: string, resource: string): boolean {
        const accessLevel = compiledPSP.psp_config?.security?.access_level;
        
        // 基础访问控制逻辑
        switch (accessLevel) {
            case 'master':
                return true;
            case 'functional':
                return operation !== 'admin';
            case 'temporary':
                return operation === 'read' || operation === 'execute';
            default:
                return false;
        }
    }
    
    private createContextFromCached(pspId: string, userId: string): Promise<PSPContext> {
        const cachedPSP = this.loadedPSPs.get(pspId)!;
        return this.createPSPContext(cachedPSP, userId);
    }
} 
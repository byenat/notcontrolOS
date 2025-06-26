/**
 * PSP验证器
 * 
 * 负责验证PSP定义的正确性和安全性
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export class PSPValidator {
    
    /**
     * 验证PSP定义
     */
    public async validate(pspDefinition: any): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        try {
            // 1. 结构验证
            this.validateStructure(pspDefinition, errors);
            
            // 2. 类型验证
            this.validateTypes(pspDefinition, errors);
            
            // 3. 继承关系验证
            await this.validateInheritance(pspDefinition, errors);
            
            // 4. 安全性验证
            this.validateSecurity(pspDefinition, errors, warnings);
            
            // 5. 工具依赖验证
            this.validateToolDependencies(pspDefinition, errors, warnings);
            
        } catch (error) {
            errors.push(`验证过程异常: ${error}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * 验证PSP结构
     */
    private validateStructure(psp: any, errors: string[]): void {
        // 检查顶级字段
        if (!psp.psp_metadata) {
            errors.push('缺少必需字段: psp_metadata');
        }
        
        if (!psp.psp_config) {
            errors.push('缺少必需字段: psp_config');
        }
        
        // 验证元数据结构
        if (psp.psp_metadata) {
            const metadata = psp.psp_metadata;
            
            if (!metadata.name || typeof metadata.name !== 'string') {
                errors.push('psp_metadata.name 必须是非空字符串');
            }
            
            if (!metadata.version || typeof metadata.version !== 'string') {
                errors.push('psp_metadata.version 必须是非空字符串');
            }
            
            if (!metadata.type || typeof metadata.type !== 'string') {
                errors.push('psp_metadata.type 必须是非空字符串');
            }
            
            if (!metadata.layer || typeof metadata.layer !== 'number') {
                errors.push('psp_metadata.layer 必须是数字');
            }
        }
        
        // 验证配置结构
        if (psp.psp_config) {
            const config = psp.psp_config;
            
            if (!config.base_prompt || typeof config.base_prompt !== 'string') {
                errors.push('psp_config.base_prompt 必须是非空字符串');
            }
        }
    }
    
    /**
     * 验证PSP类型
     */
    private validateTypes(psp: any, errors: string[]): void {
        const validTypes = ['master', 'functional', 'workflow', 'temporary'];
        const type = psp.psp_metadata?.type;
        
        if (!validTypes.includes(type)) {
            errors.push(`无效的PSP类型: ${type}. 有效类型: ${validTypes.join(', ')}`);
        }
        
        // 验证层级与类型的对应关系
        const layer = psp.psp_metadata?.layer;
        
        switch (type) {
            case 'master':
                if (layer !== 1) {
                    errors.push('master类型的PSP必须在第1层');
                }
                break;
            case 'functional':
            case 'workflow':
                if (layer !== 2) {
                    errors.push('functional和workflow类型的PSP必须在第2层');
                }
                break;
            case 'temporary':
                if (layer !== 3) {
                    errors.push('temporary类型的PSP必须在第3层');
                }
                break;
        }
    }
    
    /**
     * 验证继承关系
     */
    private async validateInheritance(psp: any, errors: string[]): Promise<void> {
        const type = psp.psp_metadata?.type;
        const inheritFrom = psp.psp_metadata?.inherit_from;
        
        // master类型不能有父PSP
        if (type === 'master' && inheritFrom) {
            errors.push('master类型的PSP不能指定inherit_from');
        }
        
        // 非master类型必须有父PSP
        if (type !== 'master' && !inheritFrom) {
            errors.push('非master类型的PSP必须指定inherit_from');
        }
        
        // 验证继承链的合理性
        if (inheritFrom) {
            const parentValid = await this.validateParentPSP(inheritFrom, type);
            if (!parentValid) {
                errors.push(`无效的父PSP: ${inheritFrom}`);
            }
        }
        
        // 验证继承配置
        if (psp.psp_config?.inheritance) {
            this.validateInheritanceConfig(psp.psp_config.inheritance, errors);
        }
    }
    
    /**
     * 验证父PSP的有效性
     */
    private async validateParentPSP(parentId: string, childType: string): Promise<boolean> {
        // 这里应该检查父PSP是否存在并且类型合法
        
        // 检查继承规则
        if (childType === 'functional' && parentId !== 'PSP_master') {
            return false; // functional PSP只能继承自PSP_master
        }
        
        if (childType === 'workflow') {
            // workflow PSP可以继承自master或functional
            return parentId === 'PSP_master' || parentId.startsWith('functional_');
        }
        
        if (childType === 'temporary') {
            // temporary PSP可以继承自任何类型
            return true;
        }
        
        return true;
    }
    
    /**
     * 验证继承配置
     */
    private validateInheritanceConfig(inheritance: any, errors: string[]): void {
        if (inheritance.from_master && !Array.isArray(inheritance.from_master)) {
            errors.push('inheritance.from_master 必须是数组');
        }
        
        // 验证继承的属性是否有效
        if (Array.isArray(inheritance.from_master)) {
            const validProperties = [
                'communication_style',
                'privacy_preferences', 
                'language_preferences',
                'timezone_settings',
                'behavior_patterns'
            ];
            
            for (const prop of inheritance.from_master) {
                if (!validProperties.includes(prop)) {
                    errors.push(`无效的继承属性: ${prop}`);
                }
            }
        }
    }
    
    /**
     * 验证安全性设置
     */
    private validateSecurity(psp: any, errors: string[], warnings: string[]): void {
        const security = psp.psp_config?.security;
        
        if (!security) {
            warnings.push('建议配置security设置');
            return;
        }
        
        // 验证访问级别
        const validAccessLevels = ['master', 'functional', 'workflow', 'temporary'];
        if (security.access_level && !validAccessLevels.includes(security.access_level)) {
            errors.push(`无效的访问级别: ${security.access_level}`);
        }
        
        // 验证数据保留策略
        const validRetentionPolicies = ['session_based', 'persistent', 'custom'];
        if (security.data_retention && !validRetentionPolicies.includes(security.data_retention)) {
            errors.push(`无效的数据保留策略: ${security.data_retention}`);
        }
        
        // 验证日志级别
        const validLogLevels = ['minimal', 'essential_only', 'standard', 'detailed'];
        if (security.logging && !validLogLevels.includes(security.logging)) {
            errors.push(`无效的日志级别: ${security.logging}`);
        }
        
        // 安全建议
        if (security.access_level === 'master' && security.logging !== 'detailed') {
            warnings.push('master级别的PSP建议使用detailed日志级别');
        }
    }
    
    /**
     * 验证工具依赖
     */
    private validateToolDependencies(psp: any, errors: string[], warnings: string[]): void {
        const tools = psp.psp_config?.tools;
        
        if (!tools) {
            warnings.push('未定义工具依赖');
            return;
        }
        
        // 验证必需工具
        if (tools.required && !Array.isArray(tools.required)) {
            errors.push('tools.required 必须是数组');
        }
        
        // 验证可选工具
        if (tools.optional && !Array.isArray(tools.optional)) {
            errors.push('tools.optional 必须是数组');
        }
        
        // 检查工具名称格式
        const allTools = [...(tools.required || []), ...(tools.optional || [])];
        for (const tool of allTools) {
            if (typeof tool !== 'string' || tool.length === 0) {
                errors.push(`无效的工具名称: ${tool}`);
            }
        }
        
        // 检查重复工具
        const requiredSet = new Set(tools.required || []);
        const optionalSet = new Set(tools.optional || []);
        const duplicates = [...requiredSet].filter(tool => optionalSet.has(tool));
        
        if (duplicates.length > 0) {
            warnings.push(`工具重复定义: ${duplicates.join(', ')}`);
        }
    }
} 
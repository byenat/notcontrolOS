/**
 * PSP编译器
 * 
 * 负责将PSP YAML定义编译为可执行的PSP对象
 */

export interface CompiledPSP {
    psp_metadata: {
        name: string;
        version: string;
        type: string;
        layer: number;
        inherit_from?: string;
        created_at: string;
        author: string;
    };
    psp_config: {
        base_prompt: string;
        inheritance?: {
            from_master: string[];
        };
        tools: {
            required: string[];
            optional: string[];
        };
        behavior_patterns: Record<string, any>;
        security: {
            access_level: string;
            data_retention: string;
            logging: string;
        };
    };
    compiled_at: Date;
    checksum: string;
}

export class PSPCompiler {
    private static instance: PSPCompiler;
    
    public static getInstance(): PSPCompiler {
        if (!PSPCompiler.instance) {
            PSPCompiler.instance = new PSPCompiler();
        }
        return PSPCompiler.instance;
    }
    
    /**
     * 编译PSP定义
     */
    public async compile(pspSource: string): Promise<CompiledPSP> {
        try {
            // 1. 解析YAML
            const parsed = this.parseYAML(pspSource);
            
            // 2. 语法验证
            this.validateSyntax(parsed);
            
            // 3. 语义分析
            this.analyzeSemantics(parsed);
            
            // 4. 生成编译后的PSP
            const compiled = this.generateCompiledPSP(parsed);
            
            return compiled;
            
        } catch (error) {
            console.error('PSP编译失败:', error);
            throw error;
        }
    }
    
    private parseYAML(source: string): any {
        // 这里应该使用YAML解析库
        try {
            return JSON.parse(source); // 临时使用JSON解析
        } catch (error) {
            throw new Error('YAML解析失败: ' + error);
        }
    }
    
    private validateSyntax(parsed: any): void {
        // 检查必需字段
        if (!parsed.psp_metadata) {
            throw new Error('缺少psp_metadata字段');
        }
        
        if (!parsed.psp_config) {
            throw new Error('缺少psp_config字段');
        }
        
        // 检查元数据
        const metadata = parsed.psp_metadata;
        if (!metadata.name || !metadata.version || !metadata.type) {
            throw new Error('psp_metadata缺少必需字段');
        }
        
        // 检查配置
        const config = parsed.psp_config;
        if (!config.base_prompt) {
            throw new Error('psp_config缺少base_prompt字段');
        }
    }
    
    private analyzeSemantics(parsed: any): void {
        // 语义验证
        const type = parsed.psp_metadata.type;
        
        // 检查继承关系的合理性
        if (type !== 'master' && !parsed.psp_metadata.inherit_from) {
            throw new Error('非master类型的PSP必须指定inherit_from');
        }
        
        if (type === 'master' && parsed.psp_metadata.inherit_from) {
            throw new Error('master类型的PSP不能有inherit_from');
        }
        
        // 检查层级关系
        const layer = parsed.psp_metadata.layer;
        if (type === 'master' && layer !== 1) {
            throw new Error('master类型的PSP必须在第1层');
        }
        
        if ((type === 'functional' || type === 'workflow') && layer !== 2) {
            throw new Error('functional和workflow类型的PSP必须在第2层');
        }
        
        if (type === 'temporary' && layer !== 3) {
            throw new Error('temporary类型的PSP必须在第3层');
        }
    }
    
    private generateCompiledPSP(parsed: any): CompiledPSP {
        const compiled: CompiledPSP = {
            psp_metadata: {
                name: parsed.psp_metadata.name,
                version: parsed.psp_metadata.version,
                type: parsed.psp_metadata.type,
                layer: parsed.psp_metadata.layer,
                inherit_from: parsed.psp_metadata.inherit_from,
                created_at: parsed.psp_metadata.created_at || new Date().toISOString(),
                author: parsed.psp_metadata.author || 'Unknown'
            },
            psp_config: {
                base_prompt: parsed.psp_config.base_prompt,
                inheritance: parsed.psp_config.inheritance,
                tools: {
                    required: parsed.psp_config.tools?.required || [],
                    optional: parsed.psp_config.tools?.optional || []
                },
                behavior_patterns: parsed.psp_config.behavior_patterns || {},
                security: {
                    access_level: parsed.psp_config.security?.access_level || 'functional',
                    data_retention: parsed.psp_config.security?.data_retention || 'session_based',
                    logging: parsed.psp_config.security?.logging || 'essential_only'
                }
            },
            compiled_at: new Date(),
            checksum: this.generateChecksum(parsed)
        };
        
        return compiled;
    }
    
    private generateChecksum(data: any): string {
        // 生成数据的校验和
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash.toString(16);
    }
} 
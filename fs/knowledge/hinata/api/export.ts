/**
 * Export API - HiNATA 导出接口
 * 
 * 提供数据导出功能，支持多种格式和导出选项
 * 包括JSON、XML、Markdown、CSV等格式的导出
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  HiNATAKnowledgeItem,
  KnowledgeItemId,
  ContentType,
  AccessLevel
} from '../core/types';
import { KnowledgeItemStorage } from '../storage/knowledge_item';
import { RelationStorage, RelationType } from '../storage/relations';
import { TagStorage } from '../storage/tags';
import { QueryEngine, QueryOptions } from './query';

/**
 * 导出格式
 */
export enum ExportFormat {
  /** JSON格式 */
  JSON = 'json',
  /** XML格式 */
  XML = 'xml',
  /** Markdown格式 */
  MARKDOWN = 'markdown',
  /** CSV格式 */
  CSV = 'csv',
  /** HTML格式 */
  HTML = 'html',
  /** PDF格式 */
  PDF = 'pdf',
  /** YAML格式 */
  YAML = 'yaml',
  /** 自定义格式 */
  CUSTOM = 'custom'
}

/**
 * 导出范围
 */
export enum ExportScope {
  /** 所有数据 */
  ALL = 'all',
  /** 指定项目 */
  SPECIFIC_ITEMS = 'specific_items',
  /** 查询结果 */
  QUERY_RESULT = 'query_result',
  /** 标签相关 */
  TAG_BASED = 'tag_based',
  /** 时间范围 */
  TIME_RANGE = 'time_range',
  /** 内容类型 */
  CONTENT_TYPE = 'content_type'
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat;
  /** 导出范围 */
  scope: ExportScope;
  /** 范围参数 */
  scopeParams?: {
    /** 指定项目ID列表 */
    itemIds?: KnowledgeItemId[];
    /** 查询选项 */
    queryOptions?: QueryOptions;
    /** 标签列表 */
    tags?: string[];
    /** 时间范围 */
    dateRange?: {
      start: Date;
      end: Date;
      field?: 'created' | 'modified' | 'accessed';
    };
    /** 内容类型 */
    contentTypes?: ContentType[];
    /** 访问级别 */
    accessLevels?: AccessLevel[];
  };
  /** 包含关系数据 */
  includeRelations?: boolean;
  /** 包含标签数据 */
  includeTags?: boolean;
  /** 包含元数据 */
  includeMetadata?: boolean;
  /** 包含内容 */
  includeContent?: boolean;
  /** 压缩输出 */
  compress?: boolean;
  /** 输出文件路径 */
  outputPath?: string;
  /** 文件名模板 */
  filenameTemplate?: string;
  /** 自定义格式化器 */
  customFormatter?: (data: any) => string;
  /** 分块大小（大数据集） */
  chunkSize?: number;
  /** 最大文件大小(MB) */
  maxFileSize?: number;
  /** 编码格式 */
  encoding?: 'utf8' | 'utf16le' | 'base64';
  /** 格式化选项 */
  formatOptions?: {
    /** JSON缩进 */
    jsonIndent?: number;
    /** Markdown样式 */
    markdownStyle?: 'github' | 'standard' | 'custom';
    /** CSV分隔符 */
    csvDelimiter?: string;
    /** HTML模板 */
    htmlTemplate?: string;
  };
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 导出ID */
  exportId: string;
  /** 导出状态 */
  status: 'success' | 'partial' | 'failed';
  /** 输出文件路径列表 */
  outputFiles: string[];
  /** 导出统计 */
  stats: {
    /** 总项目数 */
    totalItems: number;
    /** 成功导出数 */
    exportedItems: number;
    /** 失败项目数 */
    failedItems: number;
    /** 文件大小(bytes) */
    totalSize: number;
    /** 导出耗时(ms) */
    duration: number;
  };
  /** 错误信息 */
  errors?: Array<{
    itemId?: KnowledgeItemId;
    error: string;
    details?: any;
  }>;
  /** 导出元数据 */
  metadata: {
    /** 导出时间 */
    timestamp: Date;
    /** 导出选项 */
    options: ExportOptions;
    /** 版本信息 */
    version: string;
  };
}

/**
 * 导出进度信息
 */
export interface ExportProgress {
  /** 导出ID */
  exportId: string;
  /** 当前阶段 */
  stage: 'preparing' | 'querying' | 'formatting' | 'writing' | 'compressing' | 'completed';
  /** 进度百分比 */
  progress: number;
  /** 当前处理项目 */
  currentItem?: string;
  /** 已处理项目数 */
  processedItems: number;
  /** 总项目数 */
  totalItems: number;
  /** 预计剩余时间(ms) */
  estimatedTimeRemaining?: number;
}

/**
 * 导出配置
 */
export interface ExportConfig {
  /** 默认输出目录 */
  defaultOutputDir: string;
  /** 最大并发导出数 */
  maxConcurrentExports: number;
  /** 临时文件目录 */
  tempDir: string;
  /** 启用压缩 */
  enableCompression: boolean;
  /** 默认编码 */
  defaultEncoding: 'utf8' | 'utf16le' | 'base64';
  /** 清理临时文件 */
  cleanupTempFiles: boolean;
}

/**
 * 导出引擎
 */
export class ExportEngine extends EventEmitter {
  private config: ExportConfig;
  private knowledgeStorage: KnowledgeItemStorage;
  private relationStorage: RelationStorage;
  private tagStorage: TagStorage;
  private queryEngine: QueryEngine;
  private activeExports: Map<string, ExportProgress>;

  constructor(
    config: ExportConfig,
    knowledgeStorage: KnowledgeItemStorage,
    relationStorage: RelationStorage,
    tagStorage: TagStorage,
    queryEngine: QueryEngine
  ) {
    super();
    this.config = config;
    this.knowledgeStorage = knowledgeStorage;
    this.relationStorage = relationStorage;
    this.tagStorage = tagStorage;
    this.queryEngine = queryEngine;
    this.activeExports = new Map();
  }

  /**
   * 执行导出
   */
  async export(options: ExportOptions): Promise<ExportResult> {
    const exportId = this.generateExportId();
    const startTime = Date.now();
    
    this.emit('export:started', exportId, options);
    
    try {
      // 初始化进度
      const progress: ExportProgress = {
        exportId,
        stage: 'preparing',
        progress: 0,
        processedItems: 0,
        totalItems: 0
      };
      this.activeExports.set(exportId, progress);
      this.emit('export:progress', progress);

      // 准备数据
      progress.stage = 'querying';
      progress.progress = 10;
      this.emit('export:progress', progress);
      
      const items = await this.collectItems(options);
      progress.totalItems = items.length;
      progress.progress = 30;
      this.emit('export:progress', progress);

      // 格式化数据
      progress.stage = 'formatting';
      progress.progress = 40;
      this.emit('export:progress', progress);
      
      const formattedData = await this.formatData(items, options, progress);
      progress.progress = 70;
      this.emit('export:progress', progress);

      // 写入文件
      progress.stage = 'writing';
      progress.progress = 80;
      this.emit('export:progress', progress);
      
      const outputFiles = await this.writeFiles(formattedData, options, progress);
      progress.progress = 90;
      this.emit('export:progress', progress);

      // 压缩（如果需要）
      if (options.compress) {
        progress.stage = 'compressing';
        progress.progress = 95;
        this.emit('export:progress', progress);
        
        await this.compressFiles(outputFiles);
      }

      // 完成
      progress.stage = 'completed';
      progress.progress = 100;
      this.emit('export:progress', progress);
      
      const result: ExportResult = {
        exportId,
        status: 'success',
        outputFiles,
        stats: {
          totalItems: items.length,
          exportedItems: items.length,
          failedItems: 0,
          totalSize: await this.calculateTotalSize(outputFiles),
          duration: Date.now() - startTime
        },
        metadata: {
          timestamp: new Date(),
          options,
          version: '1.0.0'
        }
      };

      this.activeExports.delete(exportId);
      this.emit('export:completed', exportId, result);
      
      return result;
    } catch (error) {
      this.activeExports.delete(exportId);
      this.emit('export:failed', exportId, error);
      throw error;
    }
  }

  /**
   * 快速导出为JSON
   */
  async exportToJSON(
    items: HiNATAKnowledgeItem[],
    outputPath?: string,
    options: Partial<ExportOptions> = {}
  ): Promise<string> {
    const exportOptions: ExportOptions = {
      format: ExportFormat.JSON,
      scope: ExportScope.SPECIFIC_ITEMS,
      scopeParams: { itemIds: items.map(item => item.id!) },
      outputPath,
      includeRelations: true,
      includeTags: true,
      includeMetadata: true,
      includeContent: true,
      ...options
    };

    const result = await this.export(exportOptions);
    return result.outputFiles[0];
  }

  /**
   * 快速导出为Markdown
   */
  async exportToMarkdown(
    items: HiNATAKnowledgeItem[],
    outputPath?: string,
    options: Partial<ExportOptions> = {}
  ): Promise<string> {
    const exportOptions: ExportOptions = {
      format: ExportFormat.MARKDOWN,
      scope: ExportScope.SPECIFIC_ITEMS,
      scopeParams: { itemIds: items.map(item => item.id!) },
      outputPath,
      includeRelations: true,
      includeTags: true,
      includeMetadata: true,
      includeContent: true,
      formatOptions: {
        markdownStyle: 'github'
      },
      ...options
    };

    const result = await this.export(exportOptions);
    return result.outputFiles[0];
  }

  /**
   * 导出查询结果
   */
  async exportQueryResult(
    queryOptions: QueryOptions,
    format: ExportFormat = ExportFormat.JSON,
    outputPath?: string
  ): Promise<ExportResult> {
    const exportOptions: ExportOptions = {
      format,
      scope: ExportScope.QUERY_RESULT,
      scopeParams: { queryOptions },
      outputPath,
      includeRelations: true,
      includeTags: true,
      includeMetadata: true,
      includeContent: true
    };

    return this.export(exportOptions);
  }

  /**
   * 批量导出（按标签）
   */
  async exportByTags(
    tags: string[],
    format: ExportFormat = ExportFormat.JSON,
    outputDir?: string
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (const tag of tags) {
      const outputPath = outputDir 
        ? path.join(outputDir, `${tag}.${format}`)
        : undefined;
        
      const exportOptions: ExportOptions = {
        format,
        scope: ExportScope.TAG_BASED,
        scopeParams: { tags: [tag] },
        outputPath,
        includeRelations: true,
        includeTags: true,
        includeMetadata: true,
        includeContent: true
      };

      const result = await this.export(exportOptions);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 获取导出进度
   */
  getExportProgress(exportId: string): ExportProgress | null {
    return this.activeExports.get(exportId) || null;
  }

  /**
   * 取消导出
   */
  async cancelExport(exportId: string): Promise<boolean> {
    if (this.activeExports.has(exportId)) {
      this.activeExports.delete(exportId);
      this.emit('export:cancelled', exportId);
      return true;
    }
    return false;
  }

  /**
   * 获取活动导出列表
   */
  getActiveExports(): ExportProgress[] {
    return Array.from(this.activeExports.values());
  }

  // 私有方法

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async collectItems(options: ExportOptions): Promise<HiNATAKnowledgeItem[]> {
    switch (options.scope) {
      case ExportScope.ALL:
        return this.knowledgeStorage.query({});
        
      case ExportScope.SPECIFIC_ITEMS:
        if (!options.scopeParams?.itemIds) {
          throw new Error('Item IDs required for specific items scope');
        }
        const items: HiNATAKnowledgeItem[] = [];
        for (const itemId of options.scopeParams.itemIds) {
          const item = await this.knowledgeStorage.retrieve(itemId);
          if (item) items.push(item);
        }
        return items;
        
      case ExportScope.QUERY_RESULT:
        if (!options.scopeParams?.queryOptions) {
          throw new Error('Query options required for query result scope');
        }
        const queryResult = await this.queryEngine.query(options.scopeParams.queryOptions);
        return queryResult.items.map(item => item.item);
        
      case ExportScope.TAG_BASED:
        return this.knowledgeStorage.query({
          tags: options.scopeParams?.tags,
          contentTypes: options.scopeParams?.contentTypes,
          accessLevels: options.scopeParams?.accessLevels
        });
        
      case ExportScope.TIME_RANGE:
        return this.knowledgeStorage.query({
          dateRange: options.scopeParams?.dateRange,
          contentTypes: options.scopeParams?.contentTypes,
          accessLevels: options.scopeParams?.accessLevels
        });
        
      case ExportScope.CONTENT_TYPE:
        return this.knowledgeStorage.query({
          contentTypes: options.scopeParams?.contentTypes,
          accessLevels: options.scopeParams?.accessLevels
        });
        
      default:
        throw new Error(`Unsupported export scope: ${options.scope}`);
    }
  }

  private async formatData(
    items: HiNATAKnowledgeItem[],
    options: ExportOptions,
    progress: ExportProgress
  ): Promise<string | string[]> {
    const enrichedItems = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      progress.currentItem = item.content.title || item.id!;
      progress.processedItems = i + 1;
      this.emit('export:progress', progress);
      
      const enrichedItem: any = {
        ...item
      };
      
      // 添加关系数据
      if (options.includeRelations) {
        enrichedItem.relations = await this.relationStorage.getItemRelations(item.id!, false);
      }
      
      // 添加标签数据
      if (options.includeTags) {
        enrichedItem.tagDetails = [];
        for (const tagName of item.metadata.tags) {
          const tags = await this.tagStorage.queryTags({ namePattern: tagName });
          if (tags.length > 0) {
            enrichedItem.tagDetails.push(tags[0]);
          }
        }
      }
      
      // 过滤数据
      if (!options.includeContent) {
        delete enrichedItem.content;
      }
      if (!options.includeMetadata) {
        delete enrichedItem.metadata;
      }
      
      enrichedItems.push(enrichedItem);
    }

    // 根据格式进行格式化
    switch (options.format) {
      case ExportFormat.JSON:
        return this.formatAsJSON(enrichedItems, options);
      case ExportFormat.XML:
        return this.formatAsXML(enrichedItems, options);
      case ExportFormat.MARKDOWN:
        return this.formatAsMarkdown(enrichedItems, options);
      case ExportFormat.CSV:
        return this.formatAsCSV(enrichedItems, options);
      case ExportFormat.HTML:
        return this.formatAsHTML(enrichedItems, options);
      case ExportFormat.YAML:
        return this.formatAsYAML(enrichedItems, options);
      case ExportFormat.CUSTOM:
        if (!options.customFormatter) {
          throw new Error('Custom formatter required for custom format');
        }
        return options.customFormatter(enrichedItems);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private formatAsJSON(items: any[], options: ExportOptions): string {
    const indent = options.formatOptions?.jsonIndent || 2;
    return JSON.stringify(items, null, indent);
  }

  private formatAsXML(items: any[], options: ExportOptions): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<knowledge_items>\n';
    
    for (const item of items) {
      xml += '  <item>\n';
      xml += `    <id>${this.escapeXML(item.id)}</id>\n`;
      xml += `    <title>${this.escapeXML(item.content?.title || '')}</title>\n`;
      xml += `    <content>${this.escapeXML(item.content?.text || '')}</content>\n`;
      xml += `    <created>${item.metadata?.created}</created>\n`;
      xml += `    <modified>${item.metadata?.modified}</modified>\n`;
      
      if (item.metadata?.tags?.length > 0) {
        xml += '    <tags>\n';
        for (const tag of item.metadata.tags) {
          xml += `      <tag>${this.escapeXML(tag)}</tag>\n`;
        }
        xml += '    </tags>\n';
      }
      
      xml += '  </item>\n';
    }
    
    xml += '</knowledge_items>';
    return xml;
  }

  private formatAsMarkdown(items: any[], options: ExportOptions): string {
    const style = options.formatOptions?.markdownStyle || 'github';
    let markdown = '# Knowledge Export\n\n';
    
    for (const item of items) {
      markdown += `## ${item.content?.title || item.id}\n\n`;
      
      if (item.content?.text) {
        markdown += `${item.content.text}\n\n`;
      }
      
      if (item.metadata?.tags?.length > 0) {
        markdown += `**Tags:** ${item.metadata.tags.map((tag: string) => `\`${tag}\``).join(', ')}\n\n`;
      }
      
      markdown += `**Created:** ${new Date(item.metadata?.created).toLocaleString()}\n`;
      markdown += `**Modified:** ${new Date(item.metadata?.modified).toLocaleString()}\n\n`;
      
      if (item.relations?.length > 0) {
        markdown += '**Relations:**\n';
        for (const relation of item.relations) {
          markdown += `- ${relation.type}: ${relation.targetId} (strength: ${relation.strength})\n`;
        }
        markdown += '\n';
      }
      
      markdown += '---\n\n';
    }
    
    return markdown;
  }

  private formatAsCSV(items: any[], options: ExportOptions): string {
    const delimiter = options.formatOptions?.csvDelimiter || ',';
    const headers = ['ID', 'Title', 'Content', 'Tags', 'Created', 'Modified', 'Content Type', 'Access Level'];
    
    let csv = headers.join(delimiter) + '\n';
    
    for (const item of items) {
      const row = [
        this.escapeCSV(item.id || ''),
        this.escapeCSV(item.content?.title || ''),
        this.escapeCSV(item.content?.text || ''),
        this.escapeCSV(item.metadata?.tags?.join(';') || ''),
        this.escapeCSV(item.metadata?.created || ''),
        this.escapeCSV(item.metadata?.modified || ''),
        this.escapeCSV(item.metadata?.contentType || ''),
        this.escapeCSV(item.metadata?.accessLevel || '')
      ];
      
      csv += row.join(delimiter) + '\n';
    }
    
    return csv;
  }

  private formatAsHTML(items: any[], options: ExportOptions): string {
    const template = options.formatOptions?.htmlTemplate || this.getDefaultHTMLTemplate();
    
    let itemsHTML = '';
    for (const item of items) {
      itemsHTML += `
        <div class="knowledge-item">
          <h2>${this.escapeHTML(item.content?.title || item.id)}</h2>
          <div class="content">${this.escapeHTML(item.content?.text || '')}</div>
          <div class="metadata">
            <p><strong>Created:</strong> ${new Date(item.metadata?.created).toLocaleString()}</p>
            <p><strong>Modified:</strong> ${new Date(item.metadata?.modified).toLocaleString()}</p>
            ${item.metadata?.tags?.length > 0 ? `<p><strong>Tags:</strong> ${item.metadata.tags.map((tag: string) => `<span class="tag">${this.escapeHTML(tag)}</span>`).join(' ')}</p>` : ''}
          </div>
        </div>
      `;
    }
    
    return template.replace('{{ITEMS}}', itemsHTML);
  }

  private formatAsYAML(items: any[], options: ExportOptions): string {
    // 简化的YAML格式化（实际项目中应使用专门的YAML库）
    let yaml = 'knowledge_items:\n';
    
    for (const item of items) {
      yaml += `  - id: "${item.id}"\n`;
      yaml += `    title: "${item.content?.title || ''}"\n`;
      yaml += `    content: "${(item.content?.text || '').replace(/"/g, '\\"')}"\n`;
      yaml += `    created: "${item.metadata?.created}"\n`;
      yaml += `    modified: "${item.metadata?.modified}"\n`;
      
      if (item.metadata?.tags?.length > 0) {
        yaml += '    tags:\n';
        for (const tag of item.metadata.tags) {
          yaml += `      - "${tag}"\n`;
        }
      }
    }
    
    return yaml;
  }

  private async writeFiles(
    data: string | string[],
    options: ExportOptions,
    progress: ExportProgress
  ): Promise<string[]> {
    const outputFiles: string[] = [];
    const dataArray = Array.isArray(data) ? data : [data];
    
    for (let i = 0; i < dataArray.length; i++) {
      const fileData = dataArray[i];
      const outputPath = this.generateOutputPath(options, i);
      
      // 确保输出目录存在
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // 写入文件
      const encoding = options.encoding || this.config.defaultEncoding;
      await fs.writeFile(outputPath, fileData, encoding);
      
      outputFiles.push(outputPath);
      
      // 更新进度
      progress.processedItems = i + 1;
      this.emit('export:progress', progress);
    }
    
    return outputFiles;
  }

  private generateOutputPath(options: ExportOptions, index = 0): string {
    if (options.outputPath) {
      return options.outputPath;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.filenameTemplate 
      ? options.filenameTemplate.replace('{{timestamp}}', timestamp).replace('{{index}}', index.toString())
      : `hinata_export_${timestamp}${index > 0 ? `_${index}` : ''}.${options.format}`;
    
    return path.join(this.config.defaultOutputDir, filename);
  }

  private async compressFiles(filePaths: string[]): Promise<void> {
    // 实际实现中会使用压缩库（如 node-gzip）
    // 这里提供接口定义
    for (const filePath of filePaths) {
      // 压缩文件逻辑
    }
  }

  private async calculateTotalSize(filePaths: string[]): Promise<number> {
    let totalSize = 0;
    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      } catch (error) {
        // 忽略错误
      }
    }
    return totalSize;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeCSV(text: string): string {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  private getDefaultHTMLTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HiNATA Knowledge Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .knowledge-item { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 5px; }
        .knowledge-item h2 { color: #333; margin-top: 0; }
        .content { margin: 10px 0; line-height: 1.6; }
        .metadata { font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
        .tag { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; margin-right: 5px; }
    </style>
</head>
<body>
    <h1>HiNATA Knowledge Export</h1>
    {{ITEMS}}
</body>
</html>
    `;
  }
}

/**
 * 创建导出引擎实例
 */
export function createExportEngine(
  knowledgeStorage: KnowledgeItemStorage,
  relationStorage: RelationStorage,
  tagStorage: TagStorage,
  queryEngine: QueryEngine,
  config: Partial<ExportConfig> = {}
): ExportEngine {
  const defaultConfig: ExportConfig = {
    defaultOutputDir: './exports',
    maxConcurrentExports: 3,
    tempDir: './temp',
    enableCompression: false,
    defaultEncoding: 'utf8',
    cleanupTempFiles: true
  };

  return new ExportEngine(
    { ...defaultConfig, ...config },
    knowledgeStorage,
    relationStorage,
    tagStorage,
    queryEngine
  );
}

export default ExportEngine;
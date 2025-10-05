// 通过执行` bun run .\scripts\modelMap.ts` 生成模型的文件信息
import * as fs from 'fs';
import * as path from 'path';
import * as jsonc from 'jsonc-parser';

interface ModelConfig {
    name: string;
    gateway: string;
    userId: number;
    appId: number;
    authType: string;
    authTokenName: string;
    modelDir: string;
    authKeyPath: string;
    accessToken: string;
    auth: Array<{
        name: string;
        model: string;
        plugins: any[];
    }>;
}

interface ModelData {
    space: string;
    name: string;
    table: string;
    row: {
        name: string;
        title: string;
        type: string;
        img: string;
        options: any;
        storage_engine: string;
        updatetime: number;
    };
    items: any[];
}

interface StorageEngine {
    id: number;
    user_id: number;
    title: string;
    name: string;
    describe: string;
    type: string;
    mysql_database: string | null;
    is_default: number;
    connect: {
        name: string;
        host: string;
        username: string;
        password: string;
        database: string;
        port: string;
        charset?: string;
    };
    createtime: string | null;
    updatetime: string | null;
    productions?: Array<{
        id: number;
        user_id: number;
        storage_engine_id: number;
        title: string;
        connect: {
            name: string;
            host: string;
            username: string;
            password: string;
            database: string;
            port: string;
        };
        status: number;
        createtime: string | null;
        updatetime: string | null;
    }>;
}

interface FileStorage {
    id: number;
    title: string;
    user_id: number;
    name: string;
    type: string;
    config: any;
    upload_config: any;
    createtime: string | null;
    updatetime: number | null;
    deletetime: string | null;
}

class ModelMapGenerator {
    private modelConfig: ModelConfig;
    private modelDir: string;

    constructor() {
        this.loadModelConfig();
        this.modelDir = path.resolve(this.modelConfig.modelDir);
    }

    private loadModelConfig(): void {
        const configPath = path.resolve('model.config.json');
        if (!fs.existsSync(configPath)) {
            throw new Error('model.config.json not found');
        }
        
        const configContent = fs.readFileSync(configPath, 'utf-8');
        // 使用jsonc-parser解析带注释的JSON
        this.modelConfig = jsonc.parse(configContent) as ModelConfig;
    }

    private scanSpaces(): string[] {
        if (!fs.existsSync(this.modelDir)) {
            throw new Error(`Model directory not found: ${this.modelDir}`);
        }

        return fs.readdirSync(this.modelDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }

    private scanModels(spaceName: string): ModelData[] {
        const modelsDir = path.join(this.modelDir, spaceName, 'models');
        if (!fs.existsSync(modelsDir)) {
            return [];
        }

        const modelFiles = fs.readdirSync(modelsDir)
            .filter(file => file.endsWith('.json'));

        const models: ModelData[] = [];
        for (const file of modelFiles) {
            try {
                const filePath = path.join(modelsDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const modelData: ModelData = JSON.parse(content);
                models.push(modelData);
            } catch (error) {
                console.warn(`Failed to parse model file ${file}:`, error);
            }
        }

        return models;
    }

    private scanStorageEngines(spaceName: string): StorageEngine[] {
        const storageEnginePath = path.join(this.modelDir, spaceName, 'storageEngine.json');
        if (!fs.existsSync(storageEnginePath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(storageEnginePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.warn(`Failed to parse storage engine file for ${spaceName}:`, error);
            return [];
        }
    }

    private scanFileStorages(spaceName: string): FileStorage[] {
        const storagePath = path.join(this.modelDir, spaceName, 'storage.json');
        if (!fs.existsSync(storagePath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(storagePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.warn(`Failed to parse file storage file for ${spaceName}:`, error);
            return [];
        }
    }

    private generateReadmeContent(spaceName: string): string {
        const models = this.scanModels(spaceName);
        const storageEngines = this.scanStorageEngines(spaceName);
        const fileStorages = this.scanFileStorages(spaceName);

        let content = `\n#  ${spaceName}\n\n`;

        // 生成模型列表
        if (models.length > 0) {
            content += `## 模型\n\n`;
            for (const model of models) {
                content += `- [${model.name} ${model.row.title}](${spaceName}/models/${model.name}.json)\n`;
            }
            content += '\n';
        }

        // 生成存储引擎配置
        if (storageEngines.length > 0) {
            content += `## 存储引擎\n\n[存储引擎配置](${spaceName}/StorageEngine.json)\n\n`;
            
            for (const engine of storageEngines) {
                content += `### ${engine.name}\n\n`;
                content += `> 测试环境\n\n`;
                content += '```json\n';
                content += JSON.stringify(engine.connect, null, 4);
                content += '\n```\n\n';

                if (engine.productions && engine.productions.length > 0) {
                    for (const prod of engine.productions) {
                        content += `> 生产环境\n\n`;
                        content += '```json\n';
                        content += JSON.stringify(prod.connect, null, 4);
                        content += '\n```\n\n';
                    }
                }
            }
        }

        // 生成文件存储配置
        if (fileStorages.length > 0) {
            content += `## 文件存储\n\n[文件存储配置](${spaceName}/storage.json)\n\n`;
            
            for (const storage of fileStorages) {
                content += `### ${storage.name} ${storage.title}\n`;
                if (storage.config) {
                    content += '```json\n';
                    content += JSON.stringify(storage.config, null, 4);
                    content += '\n```\n\n';
                } else {
                    content += '```json\n\n```\n\n';
                }
            }
        }

        return content;
    }

    public generate(): void {
        console.log('开始扫描模型结构...');
        
        const spaces = this.scanSpaces();
        console.log(`发现 ${spaces.length} 个空间:`, spaces);

        const spaceContents: Array<{ spaceName: string; content: string }> = [];

        for (const spaceName of spaces) {
            console.log(`\n处理空间: ${spaceName}`);
            
            const models = this.scanModels(spaceName);
            const storageEngines = this.scanStorageEngines(spaceName);
            const fileStorages = this.scanFileStorages(spaceName);
            
            console.log(`  - 模型数量: ${models.length}`);
            console.log(`  - 存储引擎数量: ${storageEngines.length}`);
            console.log(`  - 文件存储数量: ${fileStorages.length}`);

            // 生成空间的README内容
            const readmeContent = this.generateReadmeContent(spaceName);
            
            // 保存到空间目录，文件名为空间名.md
            const spaceReadmePath = path.join(this.modelDir, spaceName, `${spaceName}.md`);
            fs.writeFileSync(spaceReadmePath, readmeContent, 'utf-8');
            console.log(`  - 生成空间文档: ${spaceReadmePath}`);

            // 收集内容用于合并
            spaceContents.push({ spaceName, content: readmeContent });
        }

        // 生成合并的总README.md
        this.generateMergedReadme(spaceContents);

        console.log('\n模型结构扫描完成！');
    }

    private generateMergedReadme(spaceContents: Array<{ spaceName: string; content: string }>): void {
        let mergedContent = '# 模型文档\n\n';
        mergedContent += '## 目录\n\n';
        
        // 生成目录索引
        for (const { spaceName } of spaceContents) {
            mergedContent += `- [${spaceName}](#${spaceName})\n`;
        }
        mergedContent += '\n---\n\n';

        // 合并所有空间的内容
        for (const { spaceName, content } of spaceContents) {
            // 添加锚点标识
            mergedContent += `<a name="${spaceName}"></a>\n\n`;
            mergedContent += content;
            mergedContent += '\n---\n\n';
        }

        // 写入根目录的README.md
        const mergedReadmePath = path.join(this.modelDir, 'README.md');
        fs.writeFileSync(mergedReadmePath, mergedContent, 'utf-8');
        console.log(`\n生成合并文档: ${mergedReadmePath}`);
    }
}

// 执行扫描
try {
    const generator = new ModelMapGenerator();
    generator.generate();
} catch (error) {
    console.error('扫描失败:', error);
    process.exit(1);
}





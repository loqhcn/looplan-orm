import Db from '../Db';
import { modelConfig } from './config/ModelConfig';
import ModelRow from './data/ModelRow';
import ModelList from './data/ModelList';

export interface ModelInterface {
    table: string;
    row?: {
        storage_engine?: string;
        [key: string]: any;
    };
    relations?: Array<{
        name: string;
        model_field: string;
        relation_model_name: string;
        relation_model_field: string;
        relation_type: string;
    }>;
    [key: string]: any;
}

class Model {
    private modelName: string;
    private spaceName: string = 'default'; // 默认空间
    private modelData: ModelInterface | null = null;
    private dbInstance: Db;
    private withRelations: string[] = [];
    [key: string]: any; // 添加索引签名

    constructor(modelName: string) {
        // 解析空间和模型名
        const { space, name } = this.parseModelName(modelName);
        this.spaceName = space;
        this.modelName = name;

        // 先使用默认连接初始化
        this.dbInstance = Db.connect('default').table(name);

        // 尝试加载模型定义
        try {
            const modelTool = modelConfig.config('modelTool');
            if (modelTool) {
                this.modelData = modelTool.getModel(modelName);

                if (this.modelData) {
                    // 根据storage_engine设置连接名
                    const connectionName = this.getConnectionName();
                    console.log(`模型 ${modelName} 连接名: ${connectionName}`);
                    // console.log(`模型数据:`, this.modelData);

                    // 如果模型定义中有表名，则以它为准
                    const tableName = this.modelData.table || name;

                    // 重新设置数据库实例，使用正确的连接名和表名
                    this.dbInstance = Db.connect(connectionName).table(tableName);
                }
            }
        } catch (error: any) {
            console.warn(`获取模型数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 解析模型名称，提取空间和模型名
     * @param modelName 模型名称，格式为 "空间/模型名" 或 "模型名"
     */
    private parseModelName(modelName: string): { space: string; name: string } {
        if (modelName.includes('/')) {
            const [space, name] = modelName.split('/');
            return { space, name };
        }
        const defaultSpace = modelConfig.config('modelDefaultSpace') || 'default';
        return { space: defaultSpace, name: modelName };
    }

    /**
     * 获取连接名称
     * 连接名规则：空间@存储引擎名称
     */
    getConnectionName(): string {
        if (this.modelData && this.modelData.row && this.modelData.row.storage_engine) {
            return `${this.spaceName}@${this.modelData.row.storage_engine}`;
        }
        return 'default';
    }

    /**
     * 设置关联查询
     * @param relations 关联名称数组
     */
    with(relations: string[]): Model {
        this.withRelations = relations;
        return this;
    }

    /**
     * 查询所有符合条件的数据
     */
    async select(): Promise<ModelList | string> {
        const rows = await this.dbInstance.select();

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.dbInstance.options.fetchSql) {
            return rows as string;
        }

        // 处理关联数据
        let processedRows = rows as any[];
        if (this.withRelations.length > 0 && this.modelData) {
            processedRows = await this.loadRelations(rows as any[]);
        }

        // 获取表名 - 优先使用模型定义中的表名，否则使用模型名
        const tableName = this.modelData?.table || this.modelName;
        const connectionName = this.getConnectionName();

        return new ModelList(tableName, processedRows, 'id', connectionName);
    }

    /**
     * 查询单条记录
     * @param id 可选的主键ID
     */
    async find(id?: any): Promise<ModelRow | string | null> {
        let queryInstance = this.dbInstance;

        // 如果提供了ID，添加where条件
        if (id !== undefined) {
            queryInstance = this.dbInstance.where('id', id);
        }

        const row = await queryInstance.find();

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.dbInstance.options.fetchSql) {
            return row as string;
        }

        if (!row) {
            return null;
        }

        // 处理关联数据
        let processedRow = row;
        if (this.withRelations.length > 0 && this.modelData) {
            const rows = await this.loadRelations([row]);
            processedRow = rows[0];
        }

        // 获取表名 - 优先使用模型定义中的表名，否则使用模型名
        const tableName = this.modelData?.table || this.modelName;
        const connectionName = this.getConnectionName();

        return new ModelRow(tableName, processedRow, 'id', connectionName);
    }

    /**
     * 加载关联数据
     * @param rows 主表数据
     */
    private async loadRelations(rows: any[]): Promise<any[]> {
        if (!rows.length || !this.modelData || !this.modelData.relations) {
            return rows;
        }

        // 复制一份数据，避免修改原始数据
        const result = JSON.parse(JSON.stringify(rows));

        // 查找要加载的关联
        for (const relationName of this.withRelations) {
            const relation = this.modelData.relations.find(r => r.name === relationName);

            if (!relation) continue;

            // 收集主表中的关联字段值
            const fieldValues = rows.map(row => row[relation.model_field]).filter(v => v !== undefined && v !== null);

            if (fieldValues.length === 0) continue;

            // 查询关联表 - 使用关联模型的连接配置
            let relationDbInstance: Db;

            try {
                // 尝试获取关联模型的配置
                const modelTool = modelConfig.config('modelTool');
                if (modelTool) {
                    const relationModelData = modelTool.getModel(relation.relation_model_name);
                    if (relationModelData && relationModelData.row && relationModelData.row.storage_engine) {
                        // 解析关联模型的空间名
                        const { space: relationSpace } = this.parseModelName(relation.relation_model_name);
                        const relationConnectionName = `${relationSpace}@${relationModelData.row.storage_engine}`;
                        const relationTableName = relationModelData.table || relation.relation_model_name.split('/').pop();
                        relationDbInstance = Db.connect(relationConnectionName).table(relationTableName);
                    } else {
                        // 如果没有找到关联模型配置，使用默认连接
                        relationDbInstance = Db.table(relation.relation_model_name);
                    }
                } else {
                    relationDbInstance = Db.table(relation.relation_model_name);
                }
            } catch (error) {
                // 如果获取关联模型配置失败，使用默认连接
                relationDbInstance = Db.table(relation.relation_model_name);
            }

            const relationData = await relationDbInstance
                .where(relation.relation_model_field, 'in', fieldValues)
                .select() as any[];

            // 一对一关联
            if (relation.relation_type === 'row') {
                result.forEach((row: any) => {
                    const related = relationData.find((r: any) => r[relation.relation_model_field] == row[relation.model_field]);
                    if (related) {
                        // 获取关联模型的连接名
                        let relationConnectionName = 'default';
                        try {
                            const modelTool = modelConfig.config('modelTool');
                            if (modelTool) {
                                const relationModelData = modelTool.getModel(relation.relation_model_name);
                                if (relationModelData && relationModelData.row && relationModelData.row.storage_engine) {
                                    const { space: relationSpace } = this.parseModelName(relation.relation_model_name);
                                    relationConnectionName = `${relationSpace}@${relationModelData.row.storage_engine}`;
                                }
                            }
                        } catch (error) {
                            // 使用默认连接名
                        }
                        
                        // 创建关联模型的ModelRow实例
                        const relationTableName = relation.relation_model_name.split('/').pop() || relation.relation_model_name;
                        row[relation.name] = new ModelRow(relationTableName, related, 'id', relationConnectionName);
                    } else {
                        row[relation.name] = null;
                    }
                });
            }
            // 一对多关联
            else if (relation.relation_type === 'list') {
                result.forEach((row: any) => {
                    const relatedList = relationData.filter((r: any) => r[relation.relation_model_field] == row[relation.model_field]);
                    
                    // 获取关联模型的连接名
                    let relationConnectionName = 'default';
                    try {
                        const modelTool = modelConfig.config('modelTool');
                        if (modelTool) {
                            const relationModelData = modelTool.getModel(relation.relation_model_name);
                            if (relationModelData && relationModelData.row && relationModelData.row.storage_engine) {
                                const { space: relationSpace } = this.parseModelName(relation.relation_model_name);
                                relationConnectionName = `${relationSpace}@${relationModelData.row.storage_engine}`;
                            }
                        }
                    } catch (error) {
                        // 使用默认连接名
                    }
                    
                    // 创建关联模型的ModelList实例
                    const relationTableName = relation.relation_model_name.split('/').pop() || relation.relation_model_name;
                    row[relation.name] = new ModelList(relationTableName, relatedList, 'id', relationConnectionName);
                });
            }
        }

        return result;
    }

    /**
     * 保存数据（插入或更新）
     * @param data 要保存的数据
     */
    async save(data: Record<string, any>): Promise<any> {
        // 如果有where条件，则为更新操作
        if (this.dbInstance.options.where.length > 0) {
            return this.dbInstance.update(data);
        }
        // 否则为插入操作
        else {
            return this.dbInstance.insert(data);
        }
    }

    /**
     * 删除数据
     */
    async delete(): Promise<any> {
        return this.dbInstance.delete();
    }

    /**
     * 分页查询
     * @param page 页码
     * @param limit 每页条数
     */
    async paginate(page: number, limit: number): Promise<{
        data: ModelList | any;
        total: number | string;
        page: number;
        limit: number;
        hasMore: boolean;
        lastPage: number;
    }> {
        const result = await this.dbInstance.paginate(page, limit);

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.dbInstance.options.fetchSql) {
            return result as any; // 直接返回SQL字符串
        }

        // 处理关联数据
        let processedRows = result.data;
        if (this.withRelations.length > 0 && this.modelData) {
            processedRows = await this.loadRelations(result.data);
        }

        // 获取表名 - 优先使用模型定义中的表名，否则使用模型名
        const tableName = this.modelData?.table || this.modelName;
        const connectionName = this.getConnectionName();

        return {
            data: new ModelList(tableName, processedRows, 'id', connectionName),
            total: result.total,
            page: result.page,
            limit: result.limit,
            hasMore: result.hasMore,
            lastPage: result.lastPage
        };
    }

    /**
     * 大数据分页查询
     * @param lastIndex 上一页最后一条记录的索引值
     * @param options 分页选项
     */
    async paginateX(lastIndex: number, options: {
        orderField: string;
        orderType: 'ASC' | 'DESC';
        limit?: number;
    }): Promise<{
        data: ModelList | any;
        hasMore: boolean;
        lastIndex: any;
    }> {
        const result = await this.dbInstance.paginateX(lastIndex, options);

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.dbInstance.options.fetchSql) {
            return result as any; // 直接返回SQL字符串
        }

        // 处理关联数据
        let processedRows = result.data;
        if (this.withRelations.length > 0 && this.modelData) {
            processedRows = await this.loadRelations(result.data);
        }

        // 获取表名 - 优先使用模型定义中的表名，否则使用模型名
        const tableName = this.modelData?.table || this.modelName;
        const connectionName = this.getConnectionName();

        return {
            data: new ModelList(tableName, processedRows, 'id', connectionName),
            hasMore: result.hasMore,
            lastIndex: result.lastIndex
        };
    }

    /**
     * 将方法调用转发到Db实例
     */
    passToDb(method: string, args: any[] = []): Model {
        // 如果是分页方法，直接调用Model的方法而不是转发
        if (method === 'paginate' || method === 'paginateX') {
            return (this as any)[method](...args);
        }

        if (typeof (this.dbInstance as any)[method] === 'function') {
            // 创建新的Model实例，避免状态相互影响
            const newModel = new Model(`${this.spaceName}/${this.modelName}`);
            newModel.modelData = this.modelData;
            newModel.withRelations = [...this.withRelations];
            newModel.dbInstance = (this.dbInstance as any)[method](...args);
            return newModel;
        }
        throw new Error(`方法 ${method} 在 Db 中不存在`);
    }
}

/**
 * 创建模型实例
 * @param modelName 模型名称
 */
function model(modelName: string) {
    const modelInstance = new Model(modelName);

    return new Proxy(modelInstance, {
        get(target: any, prop: string | symbol) {
            // 优先从Model类获取方法
            if (prop in target) {
                return target[prop];
            }

            // 否则尝试将调用转发到Db类
            return function (...args: any[]) {
                return target.passToDb(prop as string, args);
            };
        }
    });
}



export { model }


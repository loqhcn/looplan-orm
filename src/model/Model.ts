import Db from '../Db';
import { modelConfig } from './config/ModelConfig';
import ModelRow from './data/ModelRow';
import ModelList from './data/ModelList';

export interface ModelInterface {
    table: string;
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
    private modelData: ModelInterface | null = null;
    private dbInstance: Db;
    private withRelations: string[] = [];
    [key: string]: any; // 添加索引签名

    constructor(modelName: string) {
        this.modelName = modelName;
        this.dbInstance = Db.table(modelName);

        // 尝试加载模型定义
        try {
            const modelTool = modelConfig.config('modelTool');
            if (modelTool) {
                this.modelData = modelTool.getModel(modelName);
                // 如果模型定义中有表名，则以它为准
                if (this.modelData && this.modelData.table) {
                    this.dbInstance = Db.table(this.modelData.table);
                }
            }
        } catch (error: any) {
            console.warn(`获取模型数据失败: ${error.message}`);
            throw error;
        }
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

        return new ModelList(tableName, processedRows);
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

        return new ModelRow(tableName, processedRow);
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

            // 查询关联表
            const relationData = await Db.table(relation.relation_model_name)
                .where(relation.relation_model_field, 'in', fieldValues)
                .select() as any[];

            // 一对一关联
            if (relation.relation_type === 'row') {
                result.forEach((row: any) => {
                    const related = relationData.find((r: any) => r[relation.relation_model_field] == row[relation.model_field]);
                    if (related) {
                        // 创建关联模型的ModelRow实例
                        row[relation.name] = new ModelRow(relation.relation_model_name, related);
                    } else {
                        row[relation.name] = null;
                    }
                });
            }
            // 一对多关联
            else if (relation.relation_type === 'list') {
                result.forEach((row: any) => {
                    const relatedList = relationData.filter((r: any) => r[relation.relation_model_field] == row[relation.model_field]);
                    // 创建关联模型的ModelList实例
                    row[relation.name] = new ModelList(relation.relation_model_name, relatedList);
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

        return {
            data: new ModelList(tableName, processedRows),
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

        return {
            data: new ModelList(tableName, processedRows),
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
            const newModel = new Model(this.modelName);
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


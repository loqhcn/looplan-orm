import { MongoClient, Db as MongoDb } from 'mongodb';
import type { Sort } from 'mongodb';
import Db from '../Db';

interface MongoConfig {
    url: string;
    dbName: string;
}

class MongodbGateway {
    db: Db | null;
    client: MongoClient | null;
    connection: MongoDb | null;
    actionName: string;
    config: MongoConfig;

    constructor() {
        this.db = null;
        this.client = null;
        this.connection = null;
        this.actionName = '';
        this.config = {
            url: 'mongodb://localhost:27017',
            dbName: 'mulo-content'
        };
    }

    static src(db: Db): MongodbGateway {
        const obj = new MongodbGateway();
        obj.db = db;
        return obj;
    }

    action(name: string): MongodbGateway {
        this.actionName = name;
        return this;
    }

    async connect(): Promise<void> {
        this.client = new MongoClient(this.config.url);
        await this.client.connect();
        this.connection = this.client.db(this.config.dbName);
    }

    // 构建查询条件
    buildQuery(): Record<string, any> {
        if (!this.db) return {};
        
        const { where } = this.db.options;
        if (!where || where.length === 0) return {};
        
        const query: Record<string, any> = {};
        
        where.forEach(condition => {
            if (Array.isArray(condition)) {
                if (condition.length === 3) {
                    // [字段, 操作符, 值]
                    const [field, operator, value] = condition;
                    
                    // MongoDB操作符映射
                    const operatorMap: Record<string, any> = {
                        '=': value,
                        '!=': { $ne: value },
                        '>': { $gt: value },
                        '>=': { $gte: value },
                        '<': { $lt: value },
                        '<=': { $lte: value },
                        'in': { $in: Array.isArray(value) ? value : [value] },
                        'not in': { $nin: Array.isArray(value) ? value : [value] },
                        'like': { $regex: value.replace(/%/g, '.*'), $options: 'i' }
                    };
                    
                    query[field] = operatorMap[operator] || value;
                } else if (condition.length === 2) {
                    // [字段, 值] - 默认为等于
                    const [field, value] = condition;
                    query[field] = value;
                }
            } else if (typeof condition === 'string') {
                // MongoDB不支持原始SQL片段，这里忽略
                console.warn('MongoDB不支持原始SQL条件:', condition);
            }
        });
        
        return query;
    }
    
    // 构建排序
    buildSort(): Sort {
        if (!this.db) return {};
        
        const { orderBy } = this.db.options;
        if (!orderBy || orderBy.length === 0) return {};
        
        const sort: Record<string, 1 | -1> = {};
        
        orderBy.forEach(item => {
            if (Array.isArray(item)) {
                const [field, direction] = item;
                sort[field] = direction.toUpperCase() === 'DESC' ? -1 : 1;
            } else if (typeof item === 'string') {
                sort[item] = 1; // 默认升序
            }
        });
        
        return sort;
    }

    async dest(): Promise<any> {
        if (!this.connection) {
            await this.connect();
        }
        
        if (!this.db) {
            throw new Error('Database instance is not initialized');
        }
        
        try {
            const { table } = this.db.options;
            if (!this.connection) {
                throw new Error('Database connection is not established');
            }
            
            const collection = this.connection.collection(table);
            
            let result;
            
            if (this.actionName === 'select') {
                const query = this.buildQuery();
                const sort = this.buildSort();
                const { limitValue, fields } = this.db.options;
                
                let cursor = collection.find(query);
                
                // 投影
                if (fields && fields !== '*') {
                    const projection: Record<string, number> = {};
                    const fieldList = Array.isArray(fields) ? fields : fields.split(',');
                    
                    fieldList.forEach(field => {
                        field = field.trim();
                        projection[field] = 1;
                    });
                    
                    cursor = cursor.project(projection);
                }
                
                // 排序
                if (Object.keys(sort).length > 0) {
                    cursor = cursor.sort(sort);
                }
                
                // 限制结果数量
                if (limitValue) {
                    if (Array.isArray(limitValue)) {
                        cursor = cursor.skip(limitValue[0]).limit(limitValue[1]);
                    } else {
                        cursor = cursor.limit(limitValue);
                    }
                }
                
                result = await cursor.toArray();
            } else if (this.actionName === 'insert') {
                const { data } = this.db.options;
                
                if (Array.isArray(data)) {
                    result = await collection.insertMany(data);
                } else {
                    result = await collection.insertOne(data);
                }
            } else if (this.actionName === 'update') {
                const query = this.buildQuery();
                const { data } = this.db.options;
                
                result = await collection.updateMany(query, { $set: data });
            } else if (this.actionName === 'delete') {
                const query = this.buildQuery();
                
                result = await collection.deleteMany(query);
            } else if (this.actionName === 'count') {
                const query = this.buildQuery();
                
                const count = await collection.countDocuments(query);
                result = [{ count }];
            } else if (this.actionName === 'sum' || 
                      this.actionName === 'avg' || 
                      this.actionName === 'max' || 
                      this.actionName === 'min') {
                const query = this.buildQuery();
                const { field } = this.db.options;
                
                if (!field) {
                    throw new Error(`${this.actionName}操作需要指定字段`);
                }
                
                const aggregateMap: Record<string, any> = {
                    'sum': { $sum: `$${field}` },
                    'avg': { $avg: `$${field}` },
                    'max': { $max: `$${field}` },
                    'min': { $min: `$${field}` }
                };
                
                const pipeline = [
                    { $match: query },
                    { $group: { _id: null, [this.actionName]: aggregateMap[this.actionName] } }
                ];
                
                const aggregateResult = await collection.aggregate(pipeline).toArray();
                result = aggregateResult.length ? [{ [this.actionName]: aggregateResult[0][this.actionName] }] : [{ [this.actionName]: null }];
            } else {
                throw new Error('暂不支持的操作类型: ' + this.actionName);
            }
            
            return result;
        } catch (error) {
            console.error('MongoDB执行错误:', error);
            throw error;
        } finally {
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.connection = null;
            }
        }
    }
}

export default MongodbGateway; 
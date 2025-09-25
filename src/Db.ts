import type {
    DbOptions,
    PaginateResult,
    PaginateXOptions,
    OrderType,
    QueryGateway
} from './types';


import { databaseConfig } from './config';
import DbRaw from './DbRaw';
import { DbException } from './exception/DbException';

class Db {
    options: DbOptions;
    static transactionConnection: any = null;
    static inTransaction: boolean = false;

    constructor() {
        this.options = {
            alias: '', // 表别名，用于SQL中的AS语句
            connectionName: '', // 数据库连接名称
            table: '',
            fields: '*',
            where: [],
            orderBy: [],
            limitValue: null,
            groupBy: [],
            data: {},
            distinct: false,
            fetchSql: false,
            field: null, // 用于聚合函数
            join: [],
            transaction: false,
            params: {},
            paramCounter: 0
        }
    }

    /**
     * 设置表名
     * @param tableName 表名
     */
    static table(tableName: string): Db {
        const obj = new Db();
        obj.options.table = tableName;
        if (Db.inTransaction) {
            obj.options.transaction = true;
        }
        return obj;
    }
    /**
     * 设置表名
     * @param tableName 表名
     */
    table(tableName: string): Db {
        this.options.table = tableName;
        return this;
    }

    /**
     * 设置表别名
     * @param alias 表别名
     */
    alias(alias: string): Db {
        this.options.alias = alias;
        return this;
    }



    // SECTION 功能方法

    field(fields: string | string[]): Db {
        this.options.fields = fields;
        return this;
    }

    where(conditions: Record<string, any>): Db;
    where(callback: (db: Db) => void): Db;
    where(rawSql: string): Db;
    where(field: string, value: any): Db;
    where(field: string, operator: string, value: any): Db;
    where(arg1: any, arg2?: any, arg3?: any): Db {
        // console.log(`参数长度${arguments.length}`,arguments);

        if (Array.from(arguments).includes(undefined)) {
            throw new DbException('where条件参数不能包含undefined',0,{
                args: Array.from(arguments),
            });
        }

        if (arguments.length === 1) {
            if (typeof arg1 === 'function') {
                // 闭包查询
                arg1(this);
            } else if (typeof arg1 === 'string') {
                // 原始SQL条件
                this.options.where.push(arg1);
            } else if (typeof arg1 === 'object') {
                // 对象形式的条件
                Object.entries(arg1).forEach(([key, value]) => {
                    this.options.where.push([key, value]);
                });
            }
        } else if (arguments.length === 2) {
            // 字段和值
            this.options.where.push([arg1, arg2]);
        } else if (arguments.length === 3) {
            // 字段，操作符，值
            this.options.where.push([arg1, arg2, arg3]);
        }

        return this;
    }

    orWhere(conditions: Record<string, any>): Db;
    orWhere(callback: (db: Db) => void): Db;
    orWhere(rawSql: string): Db;
    orWhere(field: string, value: any): Db;
    orWhere(field: string, operator: string, value: any): Db;
    orWhere(arg1: any, arg2?: any, arg3?: any): Db {
        if (arguments.length === 1) {
            if (typeof arg1 === 'function') {
                // 闭包查询 - 创建一个新的查询实例用于构建OR子句
                const subQuery = new Db();
                arg1(subQuery);
                // 如果子查询有条件, 将其作为OR条件添加
                if (subQuery.options.where.length > 0) {
                    // 延迟格式化，将原始条件存储
                    this.options.where.push({ type: 'or', value: { subQuery: subQuery.options.where } });
                }
            } else if (typeof arg1 === 'string') {
                // 原始SQL条件
                this.options.where.push({ type: 'or', value: arg1 });
            } else if (typeof arg1 === 'object') {
                // 对象形式的条件 - 延迟格式化
                this.options.where.push({ type: 'or', value: { object: arg1 } });
            }
        } else if (arguments.length === 2) {
            // 字段和值 - 延迟格式化
            this.options.where.push({ type: 'or', value: { condition: [arg1, arg2] } });
        } else if (arguments.length === 3) {
            // 字段，操作符，值 - 延迟格式化
            this.options.where.push({ type: 'or', value: { condition: [arg1, arg2, arg3] } });
        }

        return this;
    }

    private formatWhereItem(item: any[], forDisplay: boolean = false): string {
        if (item.length === 2) {
            const [field, value] = item;
            if (value === null) {
                return `${field} IS NULL`;
            }
            return `${field} = ${this.formatValue(value, forDisplay, field)}`;
        } else if (item.length === 3) {
            const [field, operator, value] = item;
            const op = operator.toLowerCase();

            if (value === null) {
                if (op === '=' || op === 'is') {
                    return `${field} IS NULL`;
                } else if (op === '!=' || op === '<>' || op === 'is not') {
                    return `${field} IS NOT NULL`;
                }
            }

            if (op === 'in' && Array.isArray(value)) {
                const values = value.map(v => this.formatValue(v, forDisplay, field)).join(', ');
                return `${field} IN (${values})`;
            } else if (op === 'not in' && Array.isArray(value)) {
                const values = value.map(v => this.formatValue(v, forDisplay, field)).join(', ');
                return `${field} NOT IN (${values})`;
            } else if (op === 'between' && Array.isArray(value) && value.length >= 2) {
                return `${field} BETWEEN ${this.formatValue(value[0], forDisplay, field)} AND ${this.formatValue(value[1], forDisplay, field)}`;
            } else if ((op === 'not between') && Array.isArray(value) && value.length >= 2) {
                return `${field} NOT BETWEEN ${this.formatValue(value[0], forDisplay, field)} AND ${this.formatValue(value[1], forDisplay, field)}`;
            } else if (op === 'like') {
                return `${field} LIKE ${this.formatValue(value, forDisplay, field)}`;
            } else if (op === 'not like') {
                return `${field} NOT LIKE ${this.formatValue(value, forDisplay, field)}`;
            } else {
                return `${field} ${operator} ${this.formatValue(value, forDisplay, field)}`;
            }
        }

        return '';
    }

    /**
     * 格式化值，处理原生SQL和普通值
     * @param value 要格式化的值
     * @param forDisplay 是否用于显示（fetchSql模式）
     * @param fieldName 字段名，用于生成有意义的参数名
     */
    private formatValue(value: any, forDisplay: boolean = false, fieldName?: string): string {
        if (DbRaw.isRaw(value)) {
            // 如果是DbRaw对象，直接返回其值，不加引号
            return value.value;
        } else if (forDisplay) {
            // fetchSql模式：直接显示值（用于调试）
            if (value === null) {
                return 'NULL';
            } else if (typeof value === 'string') {
                return `'${value.replace(/'/g, "\\'")}'`; // 转义单引号
            } else {
                return String(value);
            }
        } else {
            // 参数化查询模式：使用命名占位符
            let paramName: string;
            if (fieldName) {
                // 清理字段名，去掉表前缀和特殊字符
                const cleanFieldName = fieldName.replace(/.*\./, '').replace(/[^a-zA-Z0-9_]/g, '');
                paramName = `${cleanFieldName}_${this.options.paramCounter++}`;
            } else {
                paramName = `param_${this.options.paramCounter++}`;
            }
            this.options.params[paramName] = value;
            return `:${paramName}`;
        }
    }

    order(field: string, sort?: string): Db;
    order(fieldOrder: Record<string, string>): Db;
    order(field: string | Record<string, string>, sort: string = 'ASC'): Db {
        if (typeof field === 'string') {
            this.options.orderBy.push([field, sort]);
        } else if (typeof field === 'object') {
            // 支持对象形式 {field: 'ASC'}
            Object.entries(field).forEach(([key, value]) => {
                this.options.orderBy.push([key, value]);
            });
        }
        return this;
    }

    limit(limit: number): Db;
    limit(offset: number, limit: number): Db;
    limit(arg1: number, arg2?: number): Db {
        if (arguments.length === 1) {
            this.options.limitValue = arg1;
        } else if (arguments.length === 2 && arg2 !== undefined) {
            this.options.limitValue = [arg1, arg2];
        }
        return this;
    }

    group(fields: string | string[]): Db {
        if (typeof fields === 'string') {
            this.options.groupBy = fields.split(',').map(item => item.trim());
        } else if (Array.isArray(fields)) {
            this.options.groupBy = fields;
        }
        return this;
    }

    distinct(isDistinct: boolean = true): Db {
        this.options.distinct = isDistinct;
        return this;
    }

    /**
     * 连接表
     * @param table 表名
     * @param condition 连接条件
     * @param type 连接类型，默认INNER
     */
    join(table: string, condition: string, type: string = 'INNER'): Db {
        this.options.join.push({
            table,
            condition,
            type
        });
        return this;
    }

    /**
     * 
     * @param table 
     * @param condition 
     * @returns 
     */
    leftJoin(table: string, condition: string): Db {
        return this.join(table, condition, 'LEFT');
    }

    rightJoin(table: string, condition: string): Db {
        return this.join(table, condition, 'RIGHT');
    }

    /**
     * 筛选条件，支持多个条件对象的组合查询
     * @param conditions 条件数组，每个元素是一个包含字段条件的对象
     * @param logic 条件间的逻辑连接符 'and' 或 'or'，默认为 'and'
     */
    filter(conditions: Record<string, any>[], logic: string = 'and'): Db {
        if (!Array.isArray(conditions) || conditions.length === 0) {
            return this;
        }

        const conditionGroups: string[] = [];

        conditions.forEach(conditionObj => {
            if (typeof conditionObj !== 'object' || conditionObj === null) {
                return;
            }

            const groupConditions: string[] = [];

            Object.entries(conditionObj).forEach(([field, value]) => {
                if (Array.isArray(value) && value.length >= 2) {
                    // 处理操作符形式：[操作符, 值]
                    const [operator, operatorValue] = value;
                    const op = operator.toLowerCase();

                    if (op === 'in' && Array.isArray(operatorValue)) {
                        const valueStr = operatorValue.map(v => this.formatValue(v, this.options.fetchSql, field)).join(', ');
                        groupConditions.push(`${field} IN (${valueStr})`);
                    } else if (op === 'not in' && Array.isArray(operatorValue)) {
                        const valueStr = operatorValue.map(v => this.formatValue(v, this.options.fetchSql, field)).join(', ');
                        groupConditions.push(`${field} NOT IN (${valueStr})`);
                    } else if (op === 'between' && Array.isArray(operatorValue) && operatorValue.length >= 2) {
                        groupConditions.push(`${field} BETWEEN ${this.formatValue(operatorValue[0], this.options.fetchSql, field)} AND ${this.formatValue(operatorValue[1], this.options.fetchSql, field)}`);
                    } else if (op === 'not between' && Array.isArray(operatorValue) && operatorValue.length >= 2) {
                        groupConditions.push(`${field} NOT BETWEEN ${this.formatValue(operatorValue[0], this.options.fetchSql, field)} AND ${this.formatValue(operatorValue[1], this.options.fetchSql, field)}`);
                    } else if (op === 'like') {
                        groupConditions.push(`${field} LIKE ${this.formatValue(operatorValue, this.options.fetchSql, field)}`);
                    } else if (op === 'not like') {
                        groupConditions.push(`${field} NOT LIKE ${this.formatValue(operatorValue, this.options.fetchSql, field)}`);
                    } else {
                        // 其他操作符
                        groupConditions.push(`${field} ${operator} ${this.formatValue(operatorValue, this.options.fetchSql, field)}`);
                    }
                } else {
                    // 处理直接值：字段 = 值
                    if (value === null) {
                        groupConditions.push(`${field} IS NULL`);
                    } else {
                        groupConditions.push(`${field} = ${this.formatValue(value, this.options.fetchSql, field)}`);
                    }
                }
            });

            if (groupConditions.length > 0) {
                // 单个条件对象内的条件用 AND 连接
                conditionGroups.push(`(${groupConditions.join(' AND ')})`);
            }
        });

        if (conditionGroups.length > 0) {
            // 多个条件对象之间用指定的逻辑连接符连接
            const logicOp = logic.toLowerCase() === 'or' ? 'OR' : 'AND';
            let finalCondition = conditionGroups.join(` ${logicOp} `);

            // 如果有多个条件对象，需要用括号包裹整个filter条件
            if (conditionGroups.length > 1) {
                finalCondition = `(${finalCondition})`;
            }

            // 添加到where条件中
            this.options.where.push(finalCondition);
        }

        return this;
    }

    // !SECTION 功能方法

    // SECTION 增删改查

    async find(): Promise<any> {
        const bak = this.options.limitValue;
        this.options.limitValue = 1;

        const gateway = await this.getQueryInstance();
        const result = await gateway.action('select').dest();

        // 恢复原来的limitValue
        this.options.limitValue = bak;

        if (this.options.fetchSql) {
            return result;
        }

        return result && result.length ? result[0] : null;
    }

    async select(): Promise<any[] | string> {
        const gateway = await this.getQueryInstance();
        const result = await gateway.action('select').dest();

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.options.fetchSql) {
            return result as string;
        }

        return result;
    }

    /**
     * 分页查询
     * @param page 页码
     * @param limit 每页条数
     * 
     */
    async paginate(page: number, limit: number): Promise<PaginateResult> {
        // 如果是fetchSql模式，直接返回SQL语句
        if (this.options.fetchSql) {
            // 计算偏移量并生成数据查询SQL
            const offset = (page - 1) * limit;
            this.limit(offset, limit);
            const dataSql = await this.select();

            return dataSql as any; // 直接返回SQL字符串
        }

        // 创建一个新的Db实例来计算总数，避免状态污染
        const countDb = new Db();
        // 复制当前查询条件到计算总数的实例
        countDb.options = {
            ...this.options,
            // 重置这些字段，避免影响count查询
            fields: '*',
            orderBy: [],
            limitValue: null,
            distinct: false,
            field: null
        };

        // 计算总数
        const total = await countDb.count() as number;

        // 计算偏移量
        const offset = (page - 1) * limit;

        // 设置limit和offset进行分页查询
        this.limit(offset, limit);

        // 查询数据
        const data = await this.select() as any[];

        // 计算是否有更多数据
        const hasMore = offset + limit < total;

        // 计算最后一页
        const lastPage = Math.ceil(total / limit) || 1; // 至少为1页

        return {
            data,
            total,
            page,
            limit,
            hasMore,
            lastPage
        };
    }

    /**
     * 大数据分页查询 - 基于游标的分页，适用于大数据集
     * @param lastIndex 上一页最后一条记录的索引值
     * @param options 分页选项
     */
    async paginateX(lastIndex: number, options: PaginateXOptions): Promise<any> {
        const { orderField, orderType, limit: pageLimit } = options;

        // 设置排序
        this.order(orderField, orderType);

        // 根据lastIndex设置where条件进行游标分页
        if (lastIndex > 0) {
            if (orderType === 'ASC') {
                // 升序：获取比lastIndex大的记录
                this.where(orderField, '>', lastIndex);
            } else {
                // 降序：获取比lastIndex小的记录
                this.where(orderField, '<', lastIndex);
            }
        }

        // 设置分页限制，优先使用options中的limit，其次使用当前设置的limitValue，最后使用默认值10
        const finalLimit = pageLimit || (Array.isArray(this.options.limitValue) ? this.options.limitValue[1] : this.options.limitValue) || 10;
        this.limit(finalLimit);

        // 查询数据
        const data = await this.select();

        // 如果是fetchSql模式，直接返回SQL语句
        if (this.options.fetchSql) {
            return data as any; // 直接返回SQL字符串
        }

        return {
            data,
            hasMore: data.length === finalLimit, // 如果返回的数据条数等于limit，说明可能还有更多数据
            lastIndex: data.length > 0 ? data[data.length - 1][orderField] : lastIndex // 返回最后一条记录的索引值
        };
    }

    async insert(data?: Record<string, any>): Promise<any> {
        if (data) {
            this.data(data);
        }

        const gateway = await this.getQueryInstance();
        return gateway.action('insert').dest();
    }

    async insertGetId(data?: Record<string, any>): Promise<number> {
        if (data) {
            this.data(data);
        }

        const gateway = await this.getQueryInstance();
        return gateway.action('insertGetId').dest();
    }

    async insertAll(dataList?: Record<string, any>[]): Promise<any> {
        if (dataList && Array.isArray(dataList)) {
            this.options.dataList = dataList;
        }

        const gateway = await this.getQueryInstance();
        return gateway.action('insertAll').dest();
    }

    data(data: Record<string, any>): Db {
        if (typeof data === 'object') {
            this.options.data = data;
        }
        return this;
    }

    async update(data?: Record<string, any>): Promise<any> {
        if (data) {
            this.data(data);
        }

        const gateway = await this.getQueryInstance();
        return gateway.action('update').dest();
    }

    async delete(): Promise<any> {
        const gateway = await this.getQueryInstance();
        return gateway.action('delete').dest();
    }

    async count(field: string = '*'): Promise<number | string> {
        this.options.field = field;
        const gateway = await this.getQueryInstance();
        const result = await gateway.action('count').dest();

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.options.fetchSql) {
            return result as string;
        }

        return result && result.length ? result[0].count : 0;
    }

    async sum(field: string): Promise<number | string> {
        this.options.field = field;
        const gateway = await this.getQueryInstance();
        const result = await gateway.action('sum').dest();

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.options.fetchSql) {
            return result as string;
        }

        return result && result.length ? result[0].sum : 0;
    }

    async avg(field: string): Promise<number | string> {
        this.options.field = field;
        const gateway = await this.getQueryInstance();
        const result = await gateway.action('avg').dest();

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.options.fetchSql) {
            return result as string;
        }

        return result && result.length ? result[0].avg : 0;
    }

    async max(field: string): Promise<number | string> {
        this.options.field = field;
        const gateway = await this.getQueryInstance();
        const result = await gateway.action('max').dest();

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.options.fetchSql) {
            return result as string;
        }

        return result && result.length ? result[0].max : 0;
    }

    async min(field: string): Promise<number | string> {
        this.options.field = field;
        const gateway = await this.getQueryInstance();
        const result = await gateway.action('min').dest();

        // 如果是fetchSql模式，直接返回SQL字符串
        if (this.options.fetchSql) {
            return result as string;
        }

        return result && result.length ? result[0].min : 0;
    }

    // !SECTION 增删改查

    // SECTION 辅助方法

    /**
     * 重置查询参数
     */
    private resetParams(): void {
        this.options.params = {};
        this.options.paramCounter = 0;
    }

    /**
     * 获取查询参数
     */
    getParams(): Record<string, any> {
        return this.options.params;
    }

    // !SECTION 辅助方法

    // SECTION 事务处理

    static async transaction(callback: () => Promise<any>): Promise<any> {
        try {
            await Db.startTrans();
            const result = await callback();
            await Db.commit();
            return result;
        } catch (error) {
            await Db.rollback();
            throw error;
        }
    }

    /**
     * 开启事务
     */
    static async startTrans(): Promise<void> {
        const db = new Db();
        db.options.transaction = true;
        Db.inTransaction = true;
        const gateway = await db.getQueryInstance();
        Db.transactionConnection = await gateway.startTransaction();
    }

    /**
     * 提交事务
     */
    static async commit(): Promise<void> {
        if (!Db.transactionConnection) {
            throw new Error('没有活动的事务连接');
        }

        const db = new Db();
        db.options.transaction = true;
        const gateway = await db.getQueryInstance();
        await gateway.commit(Db.transactionConnection);
        Db.transactionConnection = null;
        Db.inTransaction = false;
    }

    static async rollback(): Promise<void> {
        if (!Db.transactionConnection) {
            throw new Error('没有活动的事务连接');
        }

        const db = new Db();
        db.options.transaction = true;
        const gateway = await db.getQueryInstance();
        await gateway.rollback(Db.transactionConnection);
        Db.transactionConnection = null;
        Db.inTransaction = false;
    }

    // !SECTION 事务处理

    // SECTION 辅助功能

    fetchSql(fetch: boolean = true): Db {
        this.options.fetchSql = fetch;
        return this;
    }

    async getQueryInstance(): Promise<QueryGateway> {
        let objName = 'MysqlGateway'; // 默认使用MySQL

        // 可以根据配置决定使用哪个gateway
        if (this.options.connectionName && this.options.connectionName.toLowerCase() === 'mongodb') {
            objName = 'MongodbGateway';
        }

        const module = await import(`./gateways/${objName}.ts`);
        // console.log('getQueryInstance', module);

        // 传递事务连接
        if (this.options.transaction && Db.transactionConnection) {
            return module.default.src(this, Db.transactionConnection);
        }

        return module.default.src(this);
    }

    // 设置数据库类型
    database(type: string): Db {
        this.options.connectionName = type;
        return this;
    }

    // !SECTION 辅助功能

    // SECTION 原生SQL查询

    /**
     * 执行查询SQL，返回查询结果
     * @param sql SQL语句
     * @param params 参数绑定 [值1, 值2, ...] 或 {name1: 值1, name2: 值2, ...}
     */
    static async query(sql: string, params?: any[] | Record<string, any>): Promise<any[]> {
        const db = new Db();
        // 如果当前在事务中，设置事务标记
        if (Db.inTransaction) {
            db.options.transaction = true;
        }
        const gateway = await db.getQueryInstance();
        return gateway.rawQuery(sql, params);
    }

    /**
     * 执行更新SQL，返回受影响的行数
     * @param sql SQL语句
     * @param params 参数绑定 [值1, 值2, ...] 或 {name1: 值1, name2: 值2, ...}
     */
    static async execute(sql: string, params?: any[] | Record<string, any>): Promise<number> {
        const db = new Db();
        // 如果当前在事务中，设置事务标记
        if (Db.inTransaction) {
            db.options.transaction = true;
        }
        const gateway = await db.getQueryInstance();
        return gateway.rawExecute(sql, params);
    }

    // !SECTION 原生SQL查询

    // SECTION 连接管理

    /**
     * 选择数据库连接（推荐使用）
     * @param name 连接名称
     */
    static selectConnect(name: string): Db {
        const db = new Db();
        db.options.connectionName = name;
        return db;
    }

    /**
     * 选择数据库连接（为了兼容性保留）
     * @param name 连接名称
     *
     */
    static connect(name: string): Db {
        const db = new Db();
        db.options.connectionName = name;
        return db;
    }

    /**
     * 根据表名称自动添加表前缀
     * @param tableName 表名称(不含前缀)
     */
    static name(tableName: string): Db {
        const obj = new Db();
        if (Db.inTransaction) {
            obj.options.transaction = true;
        }

        // 获取默认配置
        const defaultConfig = databaseConfig.getDefaultConfig();
        const prefix = defaultConfig.prefix || '';

        // 设置带前缀的表名
        obj.options.table = prefix + tableName;

        return obj;
    }

    // !SECTION 连接管理

    // SECTION 原生SQL

    /**
     * 创建原生SQL片段
     * @param sql 原生SQL字符串
     */
    static raw(sql: string): DbRaw {
        return new DbRaw(sql);
    }

    // !SECTION 原生SQL
}

export default Db; 
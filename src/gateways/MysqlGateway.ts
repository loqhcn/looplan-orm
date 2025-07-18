import mysql from 'mysql2/promise';
import type { ResultSetHeader, Connection, Pool } from 'mysql2/promise';
import Db from '../Db';
import DbRaw from '../DbRaw';
import { databaseConfig, collectionPool } from '../config';

interface MysqlConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
}

class MysqlGateway {
    db: Db | null;
    connection: Connection | null;
    actionName: string;
    config: MysqlConfig;
    connectionName: string; // 添加连接名称属性

    constructor() {
        this.db = null;
        this.connection = null;
        this.actionName = '';
        this.connectionName = '';
        this.config = {
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'mulo-content'
        };
    }

    static src(db: Db, connection?: Connection): MysqlGateway {
        const obj = new MysqlGateway();
        obj.db = db;
        if (connection) {
            obj.connection = connection;
            console.log('使用事务连接', connection.threadId);
        }
        
        // 从配置中获取连接信息
        if (db.options.connectionName) {
            obj.connectionName = db.options.connectionName;
            const connectionConfig = databaseConfig.getConnection(db.options.connectionName);
            if (connectionConfig) {
                obj.config = {
                    host: connectionConfig.host,
                    user: connectionConfig.user,
                    password: connectionConfig.password,
                    database: connectionConfig.database,
                    port: connectionConfig.port
                };
            }
        } else {
            // 使用默认配置
            obj.connectionName = databaseConfig.getDefaultConfigName();
            const defaultConfig = databaseConfig.getDefaultConfig();
            if (defaultConfig) {
                obj.config = {
                    host: defaultConfig.host,
                    user: defaultConfig.user,
                    password: defaultConfig.password,
                    database: defaultConfig.database,
                    port: defaultConfig.port
                };
            }
        }
        
        return obj;
    }

    action(name: string): MysqlGateway {
        this.actionName = name;
        return this;
    }

    async connect(): Promise<void> {
        if (!this.connection) {
            // 通过连接池获取连接
            this.connection = await collectionPool.getConnection(this.connectionName);
        }
    }

    // 构建WHERE条件
    buildWhere(): string {
        if (!this.db) return '';
        
        const { where } = this.db.options;
        if (!where || where.length === 0) return '';
        
        const conditions: string[] = [];
        
        where.forEach(condition => {
            if (Array.isArray(condition)) {
                if (condition.length === 3) {
                    // [字段, 操作符, 值]
                    const [field, operator, value] = condition;
                    const op = operator.toLowerCase();
                    
                    if (op === 'in' && Array.isArray(value)) {
                        const valueStr = value.map(v => this.formatValue(v, field)).join(', ');
                        conditions.push(`${field} IN (${valueStr})`);
                    } else if (op === 'not in' && Array.isArray(value)) {
                        const valueStr = value.map(v => this.formatValue(v, field)).join(', ');
                        conditions.push(`${field} NOT IN (${valueStr})`);
                    } else if (op === 'between' && Array.isArray(value) && value.length >= 2) {
                        conditions.push(`${field} BETWEEN ${this.formatValue(value[0], field)} AND ${this.formatValue(value[1], field)}`);
                    } else if (op === 'not between' && Array.isArray(value) && value.length >= 2) {
                        conditions.push(`${field} NOT BETWEEN ${this.formatValue(value[0], field)} AND ${this.formatValue(value[1], field)}`);
                    } else if (op === 'like') {
                        conditions.push(`${field} LIKE ${this.formatValue(value, field)}`);
                    } else if (op === 'not like') {
                        conditions.push(`${field} NOT LIKE ${this.formatValue(value, field)}`);
                    } else {
                        conditions.push(`${field} ${operator} ${this.formatValue(value, field)}`);
                    }
                } else if (condition.length === 2) {
                    // [字段, 值] - 默认为等于
                    const [field, value] = condition;
                    if (value === null) {
                        conditions.push(`${field} IS NULL`);
                    } else {
                        conditions.push(`${field} = ${this.formatValue(value, field)}`);
                    }
                }
            } else if (typeof condition === 'string') {
                // 原始SQL片段
                conditions.push(condition);
            } else if (typeof condition === 'object' && 'type' in condition && 'value' in condition) {
                // 处理OR条件
                if (condition.type === 'or') {
                    const orValue = condition.value;
                    
                    if (typeof orValue === 'string') {
                        // 已经是字符串的条件
                        conditions.push(`OR ${orValue}`);
                    } else if (typeof orValue === 'object') {
                        // 需要格式化的延迟条件
                        let formattedOrCondition = '';
                        
                        if ('condition' in orValue && Array.isArray(orValue.condition)) {
                            // 处理 [字段, 值] 或 [字段, 操作符, 值] 格式
                            const conditionArr = orValue.condition;
                            if (conditionArr.length === 2) {
                                const [field, value] = conditionArr;
                                if (value === null) {
                                    formattedOrCondition = `${field} IS NULL`;
                                } else {
                                    formattedOrCondition = `${field} = ${this.formatValue(value, field)}`;
                                }
                            } else if (conditionArr.length === 3) {
                                const [field, operator, value] = conditionArr;
                                const op = operator.toLowerCase();
                                
                                if (value === null) {
                                    if (op === '=' || op === 'is') {
                                        formattedOrCondition = `${field} IS NULL`;
                                    } else if (op === '!=' || op === '<>' || op === 'is not') {
                                        formattedOrCondition = `${field} IS NOT NULL`;
                                    }
                                } else if (op === 'in' && Array.isArray(value)) {
                                    const valueStr = value.map(v => this.formatValue(v, field)).join(', ');
                                    formattedOrCondition = `${field} IN (${valueStr})`;
                                } else if (op === 'not in' && Array.isArray(value)) {
                                    const valueStr = value.map(v => this.formatValue(v, field)).join(', ');
                                    formattedOrCondition = `${field} NOT IN (${valueStr})`;
                                } else if (op === 'between' && Array.isArray(value) && value.length >= 2) {
                                    formattedOrCondition = `${field} BETWEEN ${this.formatValue(value[0], field)} AND ${this.formatValue(value[1], field)}`;
                                } else if (op === 'not between' && Array.isArray(value) && value.length >= 2) {
                                    formattedOrCondition = `${field} NOT BETWEEN ${this.formatValue(value[0], field)} AND ${this.formatValue(value[1], field)}`;
                                } else if (op === 'like') {
                                    formattedOrCondition = `${field} LIKE ${this.formatValue(value, field)}`;
                                } else if (op === 'not like') {
                                    formattedOrCondition = `${field} NOT LIKE ${this.formatValue(value, field)}`;
                                } else {
                                    formattedOrCondition = `${field} ${operator} ${this.formatValue(value, field)}`;
                                }
                            }
                        } else if ('object' in orValue) {
                            // 处理对象形式的条件
                            const objConditions: string[] = [];
                            Object.entries(orValue.object).forEach(([key, value]) => {
                                if (value === null) {
                                    objConditions.push(`${key} IS NULL`);
                                } else {
                                    objConditions.push(`${key} = ${this.formatValue(value, key)}`);
                                }
                            });
                            formattedOrCondition = `(${objConditions.join(' AND ')})`;
                        }
                        
                        if (formattedOrCondition) {
                            conditions.push(`OR ${formattedOrCondition}`);
                        }
                    }
                } else {
                    conditions.push(condition.value);
                }
            }
        });
        
        // 处理最终的SQL语句
        if (conditions.length > 0) {
            let whereStr = ' WHERE ';
            
            // 处理第一个条件（不加前缀）
            let firstCondition = conditions[0];
            if (typeof firstCondition === 'string' && firstCondition.startsWith('OR ')) {
                // 如果第一个条件是OR，需要去掉OR前缀
                whereStr += firstCondition.substring(3);
            } else {
                whereStr += firstCondition;
            }
            
            // 处理后续条件
            for (let i = 1; i < conditions.length; i++) {
                const condition = conditions[i];
                // 如果条件已经包含OR前缀，则直接添加，否则添加AND前缀
                if (typeof condition === 'string' && condition.startsWith('OR ')) {
                    whereStr += ` ${condition}`;
                } else {
                    whereStr += ` AND ${condition}`;
                }
            }
            
            return whereStr;
        }
        
        return '';
    }
    
    /**
     * 格式化值，处理原生SQL和普通值（用于参数化查询）
     * @param value 要格式化的值
     * @param fieldName 字段名，用于生成有意义的参数名
     */
    private formatValue(value: any, fieldName?: string): string {
        if (DbRaw.isRaw(value)) {
            // 如果是DbRaw对象，直接返回其值，不加引号
            return value.value;
        } else {
            // 参数化查询：生成命名占位符并记录参数
            let paramName: string;
            if (fieldName) {
                // 清理字段名，去掉表前缀和特殊字符
                const cleanFieldName = fieldName.replace(/.*\./, '').replace(/[^a-zA-Z0-9_]/g, '');
                paramName = `${cleanFieldName}_${this.db?.options.paramCounter || 0}`;
            } else {
                paramName = `param_${this.db?.options.paramCounter || 0}`;
            }
            if (this.db) {
                this.db.options.params[paramName] = value;
                this.db.options.paramCounter++;
            }
            return `:${paramName}`;
        }
    }
    
    // 构建ORDER BY
    buildOrderBy(): string {
        if (!this.db) return '';
        
        const { orderBy } = this.db.options;
        if (!orderBy || orderBy.length === 0) return '';
        
        const orders = orderBy.map(item => {
            if (typeof item === 'string') {
                return item;
            } else if (Array.isArray(item)) {
                return `${item[0]} ${item[1]}`;
            }
            return '';
        }).filter(Boolean);
        
        return orders.length > 0 ? ` ORDER BY ${orders.join(', ')}` : '';
    }
    
    // 构建LIMIT
    buildLimit(): string {
        if (!this.db) return '';
        
        const { limitValue } = this.db.options;
        if (!limitValue) return '';
        
        if (Array.isArray(limitValue)) {
            return ` LIMIT ${limitValue[0]}, ${limitValue[1]}`;
        } else {
            return ` LIMIT ${limitValue}`;
        }
    }
    
    // 构建GROUP BY
    buildGroupBy(): string {
        if (!this.db) return '';
        
        const { groupBy } = this.db.options;
        if (!groupBy || groupBy.length === 0) return '';
        
        return ` GROUP BY ${groupBy.join(', ')}`;
    }

    // 构建JOIN
    buildJoin(): string {
        if (!this.db) return '';
        
        const { join } = this.db.options;
        if (!join || join.length === 0) return '';
        
        return join.map(item => {
            return ` ${item.type} JOIN ${item.table} ON ${item.condition}`;
        }).join('');
    }

    // 开始事务
    async startTransaction(): Promise<Connection> {
        // 事务需要独立的连接，不能使用连接池
        const connection = await mysql.createConnection(this.config);
        await connection.beginTransaction();
        console.log('事务已开始，连接ID:', connection.threadId);
        return connection;
    }

    // 提交事务
    async commit(connection: Connection): Promise<void> {
        if (!connection) {
            throw new Error('提交事务失败：连接不存在');
        }
        console.log('提交事务，连接ID:', connection.threadId);
        await connection.commit();
        await connection.end();
    }

    // 回滚事务
    async rollback(connection: Connection): Promise<void> {
        if (!connection) {
            throw new Error('回滚事务失败：连接不存在');
        }
        console.log('回滚事务，连接ID:', connection.threadId);
        await connection.rollback();
        await connection.end();
    }

    async dest(): Promise<any> {
        if (!this.db) {
            throw new Error('Database instance is not initialized');
        }
        
        // 重置命名参数
        this.db.options.params = {};
        this.db.options.paramCounter = 0;
        
        // 生成sql语句
        let sql = '';
        
        if (this.actionName === 'select') {
            const {
                table,
                alias,
                fields,
                distinct
            } = this.db.options;

            // 构建表名，如果有别名则添加别名
            const tableWithAlias = alias ? `${table} ${alias}` : table;
            sql = `SELECT ${distinct ? 'DISTINCT ' : ''}${fields} FROM ${tableWithAlias}`;
            
            // 添加JOIN
            sql += this.buildJoin();
            
            // 添加WHERE条件
            sql += this.buildWhere();
            
            // 添加GROUP BY
            sql += this.buildGroupBy();
            
            // 添加ORDER BY
            sql += this.buildOrderBy();
            
            // 添加LIMIT
            sql += this.buildLimit();
            
            
        } else if (this.actionName === 'insert') {
            const { table, data } = this.db.options;
            
            const keys = Object.keys(data);
            const values = Object.values(data);
            
            // 将数据值添加到命名参数
            const placeholders = values.map((value, index) => {
                const fieldName = keys[index];
                const paramName = `${fieldName}_${this.db?.options.paramCounter || 0}`;
                if (this.db) {
                    this.db.options.params[paramName] = value;
                    this.db.options.paramCounter++;
                }
                return `:${paramName}`;
            }).join(', ');
            
            sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
            
        } else if (this.actionName === 'insertGetId') {
            const { table, data } = this.db.options;
            
            const keys = Object.keys(data);
            const values = Object.values(data);
            
            // 将数据值添加到命名参数
            const placeholders = values.map((value, index) => {
                const fieldName = keys[index];
                const paramName = `${fieldName}_${this.db?.options.paramCounter || 0}`;
                if (this.db) {
                    this.db.options.params[paramName] = value;
                    this.db.options.paramCounter++;
                }
                return `:${paramName}`;
            }).join(', ');
            
            sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
            
        } else if (this.actionName === 'insertAll') {
            const { table, dataList } = this.db.options;
            
            if (!dataList || dataList.length === 0) {
                throw new Error('批量插入数据不能为空');
            }
            
            // 获取所有字段（以第一个数据对象的键为准）
            const keys = Object.keys(dataList[0]);
            
            // 构建VALUES部分 - 使用命名参数化查询
            const valuesList = dataList.map((item, rowIndex) => {
                const values = keys.map(key => {
                    const val = item[key];
                    const paramName = `${key}_${rowIndex}_${this.db?.options.paramCounter || 0}`;
                    if (this.db) {
                        this.db.options.params[paramName] = val;
                        this.db.options.paramCounter++;
                    }
                    return `:${paramName}`;
                });
                return `(${values.join(', ')})`;
            });
            
            sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${valuesList.join(', ')}`;
            
        } else if (this.actionName === 'update') {
            const { table, alias, data } = this.db.options;
            
            const sets = Object.entries(data).map(([key, value]) => {
                const paramName = `${key}_${this.db?.options.paramCounter || 0}`;
                if (this.db) {
                    this.db.options.params[paramName] = value;
                    this.db.options.paramCounter++;
                }
                return `${key} = :${paramName}`;
            });
            
            // 构建表名，如果有别名则添加别名
            const tableWithAlias = alias ? `${table} ${alias}` : table;
            sql = `UPDATE ${tableWithAlias} SET ${sets.join(', ')}`;
            
            // 添加WHERE条件
            sql += this.buildWhere();
            
            
        } else if (this.actionName === 'delete') {
            const { table, alias } = this.db.options;
            
            // 构建表名，如果有别名则添加别名
            const tableWithAlias = alias ? `${table} ${alias}` : table;
            sql = `DELETE FROM ${tableWithAlias}`;
            
            // 添加WHERE条件
            sql += this.buildWhere();
            
            
        } else if (this.actionName === 'count' || this.actionName === 'sum' || 
                  this.actionName === 'avg' || this.actionName === 'max' || 
                  this.actionName === 'min') {
            const { table, alias, field } = this.db.options;
            
            // 构建表名，如果有别名则添加别名
            const tableWithAlias = alias ? `${table} ${alias}` : table;
            sql = `SELECT ${this.actionName.toUpperCase()}(${field || '*'}) AS ${this.actionName} FROM ${tableWithAlias}`;
            
            // 添加WHERE条件
            sql += this.buildWhere();
            
            
        } else {
            throw new Error('暂不支持的类型' + this.actionName);
        }
        
        // 执行sql语句
        let needReleaseConnection = false;

        try {
            // 如果需要返回sql语句
            if (this.db.options.fetchSql) {
                // fetchSql模式：返回填充了参数的SQL用于调试
                const params = this.db.getParams();
                let displaySql = sql;
                
                // 将命名占位符替换为实际值（仅用于显示）
                Object.entries(params).forEach(([paramName, paramValue]) => {
                    const placeholder = `:${paramName}`;
                    let replacement: string;
                    if (typeof paramValue === 'string') {
                        replacement = `'${paramValue.replace(/'/g, "\\'")}'`;
                    } else if (paramValue === null) {
                        replacement = 'NULL';
                    } else {
                        replacement = String(paramValue);
                    }
                    displaySql = displaySql.replace(placeholder, replacement);
                });
                
                return displaySql;
            }
            
            // 确保有连接可用
            if (!this.connection) {
                // 通过连接池获取连接
                this.connection = await collectionPool.getConnection(this.connectionName);
                needReleaseConnection = true; // 标记需要释放连接
                console.log('从连接池获取连接:', this.connection.threadId);
            } else {
                console.log('使用已有连接:', this.connection.threadId);
            }
            
            // 获取参数并执行参数化查询
            const namedParams = this.db.getParams();
            console.log('执行SQL:', sql);
            console.log('命名参数:', namedParams);
            
            // 将命名占位符转换为MySQL的?占位符
            let executableSql = sql;
            const paramValues: any[] = [];
            
            Object.entries(namedParams).forEach(([paramName, paramValue]) => {
                const placeholder = `:${paramName}`;
                executableSql = executableSql.replace(placeholder, '?');
                paramValues.push(paramValue);
            });
            
            console.log('可执行SQL:', executableSql);
            console.log('参数值数组:', paramValues);
            
            const [result] = await this.connection.execute(executableSql, paramValues);
            
            // 处理insertGetId的返回值，返回插入的ID
            if (this.actionName === 'insertGetId' && result && 'insertId' in result) {
                return (result as ResultSetHeader).insertId;
            }
            
            return result;
        } catch (error) {
            console.error('SQL执行错误:', error);
            throw error;
        } finally {
            // 只有在非事务模式且需要释放连接时，才释放连接
            if (this.connection && needReleaseConnection && !this.db.options.transaction) {
                await collectionPool.releaseConnection(this.connection, this.connectionName);
                this.connection = null;
                console.log('连接已释放回连接池');
            } else if (this.db.options.transaction) {
                // console.log('保持事务连接:', this.connection?.threadId);
            }
        }
    }

    /**
     * 执行原生查询SQL
     * @param sql SQL语句
     * @param params 参数绑定
     */
    async rawQuery(sql: string, params?: any[] | Record<string, any>): Promise<any[]> {
        // 处理SQL和参数
        const { formattedSql, formattedParams } = this.formatSql(sql, params);
        console.log('执行原生查询:', formattedSql, formattedParams);

        let needReleaseConnection = false;
        try {
            // 确保有连接可用
            if (!this.connection) {
                // 通过连接池获取连接
                this.connection = await collectionPool.getConnection(this.connectionName);
                needReleaseConnection = true;
                console.log('从连接池获取连接:', this.connection.threadId);
            } else {
                console.log('使用已有连接:', this.connection.threadId);
            }

            // 执行查询
            const [rows] = await this.connection.query(formattedSql, formattedParams || []);
            return rows as any[];
        } catch (error) {
            console.error('原生查询执行错误:', error);
            throw error;
        } finally {
            // 只有在非事务模式且需要释放连接时，才释放连接
            if (this.connection && needReleaseConnection && !this.db?.options.transaction) {
                await collectionPool.releaseConnection(this.connection, this.connectionName);
                this.connection = null;
                console.log('连接已释放回连接池');
            }
        }
    }

    /**
     * 执行原生更新SQL
     * @param sql SQL语句
     * @param params 参数绑定
     */
    async rawExecute(sql: string, params?: any[] | Record<string, any>): Promise<number> {
        // 处理SQL和参数
        const { formattedSql, formattedParams } = this.formatSql(sql, params);
        console.log('执行原生更新:', formattedSql, formattedParams);

        let needReleaseConnection = false;
        try {
            // 确保有连接可用
            if (!this.connection) {
                // 通过连接池获取连接
                this.connection = await collectionPool.getConnection(this.connectionName);
                needReleaseConnection = true;
                console.log('从连接池获取连接:', this.connection.threadId);
            } else {
                console.log('使用已有连接:', this.connection.threadId);
            }

            // 执行更新
            const [result] = await this.connection.execute(formattedSql, formattedParams || []);
            if (result && 'affectedRows' in result) {
                return (result as ResultSetHeader).affectedRows;
            }
            return 0;
        } catch (error) {
            console.error('原生更新执行错误:', error);
            throw error;
        } finally {
            // 只有在非事务模式且需要释放连接时，才释放连接
            if (this.connection && needReleaseConnection && !this.db?.options.transaction) {
                await collectionPool.releaseConnection(this.connection, this.connectionName);
                this.connection = null;
                console.log('连接已释放回连接池');
            }
        }
    }

    /**
     * 格式化SQL和参数
     * @param sql SQL语句
     * @param params 参数
     */
    private formatSql(sql: string, params?: any[] | Record<string, any>): { formattedSql: string, formattedParams: any[] | Record<string, any> | undefined } {
        // 如果没有参数，直接返回原始SQL
        if (!params) {
            return { formattedSql: sql, formattedParams: undefined };
        }

        // 处理命名参数 (:name)
        if (!Array.isArray(params) && typeof params === 'object') {
            let formattedSql = sql;
            const paramNames = Object.keys(params);
            
            // 查找所有命名参数并替换为?
            paramNames.forEach(name => {
                const regex = new RegExp(':' + name + '\\b', 'g');
                formattedSql = formattedSql.replace(regex, '?');
            });
            
            // 构建参数数组，按照SQL中参数出现的顺序
            const formattedParams: any[] = [];
            const paramRegex = /:(\w+)\b/g;
            let match;
            
            // 提取原始SQL中的所有命名参数
            const originalParams: string[] = [];
            while ((match = paramRegex.exec(sql)) !== null) {
                originalParams.push(match[1]);
            }
            
            // 按原始顺序添加参数值
            originalParams.forEach(name => {
                if (name in params) {
                    formattedParams.push(params[name]);
                }
            });
            
            return { formattedSql, formattedParams };
        }
        
        // 数组参数，直接使用
        return { formattedSql: sql, formattedParams: params };
    }
}

export default MysqlGateway; 
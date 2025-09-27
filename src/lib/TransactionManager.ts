import { DbException } from "../exception/DbException";

interface TransactionConnection {
    /**
     * 连接名称
     */
    name: string;
    /**
     * 连接类型
     * mysql | postgres | sqlite | mongodb
     */
    type: string,
    /**
     * 连接
     */
    connection: any;
}

/**
 * 事务连接
 */
type TransactionConnections = TransactionConnection[];

/**
 * 事务管理
 */
class TransactionManager {
    /**
     * 事务连接映射
     * @todo 存放开启事务的连接
     */
    public transactionMap: Map<string, TransactionConnections> = new Map<string, TransactionConnections>();

    getConnection(reqId: string, connectionName?: string): TransactionConnection | null {
        const connections = this.transactionMap.get(reqId);
        if (connections) {
            return connections.find(connection => connection.name === connectionName) || null;
        }
        return null;
    }

    setConnection(reqId: string, connectionName: string, connection: TransactionConnection) {
        const existingConnection = this.getConnection(reqId, connectionName);
        if (existingConnection) {
            return;
        }
        const transactionOption = this.transactionMap.get(reqId);
        if (!transactionOption) {
            return;
        }
        if (transactionOption) {
            transactionOption.push(connection);
        }
    }

    /**
     * 开始事务
     * @param reqId 
     */
    startTransaction(reqId: string) {
        this.transactionMap.set(reqId, []);
    }

    /**
     * 设置事务连接
     * @param reqId 
     * @param connection 
     */
    setTransactionConnection(reqId: string, connection: any) {
        const connections = this.transactionMap.get(reqId);
        if (connections) {
            connections.push(connection);
        }
    }

    /**
     * 提交事务
     * @param reqId 
     */
    async commitTransaction(reqId: string): Promise<void> {
        const connections = this.transactionMap.get(reqId);
        if (!connections) {
            throw new DbException(`事务 ${reqId} 不存在`);
        }

        for (const connection of connections) {
            // mysql2
            if (connection.type === 'mysql') {
                // 提交事务
                await connection.connection.commit();
                // 关闭连接
                await connection.connection.end();
            } else {
                throw new DbException(`连接 ${reqId} 类型为 ${connection.type} 暂未支持`);
            }
        }
        this.endTransaction(reqId);
    }

    /**
     * 结束事务
     * @param reqId 
     */
    endTransaction(reqId: string) {
        this.transactionMap.delete(reqId);
    }

    /**
     * 回滚事务
     * @param reqId 
     */
    async rollbackTransaction(reqId: string): Promise<void> {
        const connections = this.transactionMap.get(reqId);
        if (!connections) {
            throw new DbException(`事务 ${reqId} 不存在`);
        }

        for (const connection of connections) {
            // mysql2
            if (connection.type === 'mysql') {
                // 回滚
                await connection.connection.rollback();
                // 关闭连接
                await connection.connection.end();

            } else {
                throw new DbException(`连接 ${reqId} 类型为 ${connection.type} 暂未支持`);
            }
        }
        this.endTransaction(reqId);
    }

    /**
     * 检查是否存在事务
     * @param reqId 
     * @returns 
     */
    hasTransaction(reqId: string): boolean {
        return this.transactionMap.has(reqId);
    }
}

export const transactionManager = new TransactionManager();

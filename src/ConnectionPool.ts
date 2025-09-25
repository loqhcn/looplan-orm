import mysql from 'mysql2/promise';
import type { Pool, Connection, PoolConnection } from 'mysql2/promise';
import { databaseConfig } from './config';

/**
 * 连接池配置
 */
interface PoolConfig {
    /**
     * 连接池最大连接数
     */
    connectionLimit: number;
    /**
     * 连接池最小连接数
     */
    minLimit: number;
    /**
     * 连接超时时间
     */
    acquireTimeout?: number;
    /**
     * 连接超时时间
     */
    timeout?: number;
    /**
     * 是否自动重连
     */
    reconnect?: boolean;
    /**
     * 连接超时时间
     */
    idleTimeout?: number;
}

/**
 * 连接信息
 */
interface ConnectionInfo {
    pool?: Pool;
    config: PoolConfig;
    connectionConfig: any;
    isPoolEnabled: boolean;
}

class ConnectionPool {
    /**
     * 连接池映射表
     */
    private pools: Map<string, ConnectionInfo> = new Map();

    /**
     * 查询次数
     */
    queryCount: number = 0;

    /**
     * 是否已初始化
     */
    private initialized: boolean = false;

    constructor() {
        
    }

    /**
     * 初始化连接池
     * 根据配置创建各个数据库的连接池
     */
    initPool() {
        console.log('初始化连接池...');
        this.initialized = true;
        
        // 获取所有连接配置
        const connections = databaseConfig.configs.connections;
        
        for (const [connectionName, connectionConfig] of Object.entries(connections)) {
            // 检查是否配置了连接池
            const poolConfig = databaseConfig.getConnectionPoolConfig(connectionName);
            
            if (poolConfig) {
                console.log(`为连接 ${connectionName} 创建连接池，配置:`, poolConfig);
                
                // 创建mysql2连接池，使用正确的PoolOptions
                const pool = mysql.createPool({
                    host: (connectionConfig as any).host,
                    user: (connectionConfig as any).user,
                    password: (connectionConfig as any).password,
                    database: (connectionConfig as any).database,
                    port: (connectionConfig as any).port || 3306,
                    connectionLimit: poolConfig.connectionLimit,
                    waitForConnections: true,
                    queueLimit: 0,
                });

                this.pools.set(connectionName, {
                    pool,
                    config: poolConfig,
                    connectionConfig,
                    isPoolEnabled: true
                });
            } else {
                // 没有配置连接池，但仍然记录连接信息
                this.pools.set(connectionName, {
                    config: { connectionLimit: 1, minLimit: 0 },
                    connectionConfig,
                    isPoolEnabled: false
                });
            }
        }
    }

    /**
     * 获取连接
     * @param connectionName 连接名称，如果不指定则使用默认连接
     */
    async getConnection(connectionName?: string): Promise<Connection> {
        const name = connectionName || databaseConfig.getDefaultConfigName();
        
        // 如果没有初始化连接池，自动初始化基本连接信息
        if (!this.initialized) {
            this.initializeBasicConnections();
        }
        
        let connectionInfo = this.pools.get(name);
        
        // 如果连接信息不存在，创建基本连接信息
        if (!connectionInfo) {
            const connectionConfig = databaseConfig.getConnection(name);
            if (!connectionConfig) {
                throw new Error(`连接配置 ${name} 不存在`);
            }
            
            connectionInfo = {
                config: { connectionLimit: 1, minLimit: 0 },
                connectionConfig,
                isPoolEnabled: false
            };
            this.pools.set(name, connectionInfo);
        }

        this.queryCount++;

        if (connectionInfo.isPoolEnabled && connectionInfo.pool) {
            // 使用连接池获取连接
            console.log(`从连接池获取连接: ${name}`);
            return connectionInfo.pool.getConnection();
        } else {
            // 创建单独的连接
            console.log(`创建新连接: ${name}`);
            const config = connectionInfo.connectionConfig as any;
            return mysql.createConnection({
                host: config.host,
                user: config.user,
                password: config.password,
                database: config.database,
                port: config.port || 3306,
            });
        }
    }

    /**
     * 初始化基本连接信息（不使用连接池）
     */
    private initializeBasicConnections() {
        console.log('初始化基本连接信息...');
        this.initialized = true;
        
        // 获取所有连接配置
        const connections = databaseConfig.configs.connections;
        
        for (const [connectionName, connectionConfig] of Object.entries(connections)) {
            // 只创建基本连接信息，不创建连接池
            if (!this.pools.has(connectionName)) {
                this.pools.set(connectionName, {
                    config: { connectionLimit: 1, minLimit: 0 },
                    connectionConfig,
                    isPoolEnabled: false
                });
            }
        }

        
    }

    /**
     * 释放连接
     * @param connection 要释放的连接
     * @param connectionName 连接名称
     */
    async releaseConnection(connection: Connection, connectionName?: string): Promise<void> {
        const name = connectionName || databaseConfig.getDefaultConfigName();
        const connectionInfo = this.pools.get(name);
        
        if (!connectionInfo) {
            console.warn(`连接 ${name} 不存在，直接关闭连接`);
            await connection.end();
            return;
        }

        if (connectionInfo.isPoolEnabled) {
            // 连接池模式，释放连接回池中
            console.log(`释放连接回连接池: ${name}`);
            // 对于连接池连接，调用release方法
            (connection as PoolConnection).release();
        } else {
            // 非连接池模式，直接关闭连接
            console.log(`关闭连接: ${name}`);
            await connection.end();
        }

        this.onQueryEnd();
    }

    /**
     * 检查连接是否来自连接池
     * @param connectionName 连接名称
     */
    isPoolConnection(connectionName?: string): boolean {
        const name = connectionName || databaseConfig.getDefaultConfigName();
        const connectionInfo = this.pools.get(name);
        return connectionInfo?.isPoolEnabled || false;
    }

    /**
     * 获取连接池状态
     * @param connectionName 连接名称
     */
    getPoolStatus(connectionName?: string): any {
        const name = connectionName || databaseConfig.getDefaultConfigName();
        const connectionInfo = this.pools.get(name);
        
        if (!connectionInfo || !connectionInfo.pool) {
            return null;
        }

        return {
            connectionName: name,
            isPoolEnabled: connectionInfo.isPoolEnabled,
            config: connectionInfo.config,
        };
    }

    /**
     * 销毁所有连接池
     */
    async destroy(): Promise<void> {
        console.log('销毁所有连接池...');
        
        const destroyPromises: Promise<void>[] = [];
        
        for (const [name, connectionInfo] of this.pools.entries()) {
            if (connectionInfo.pool) {
                console.log(`销毁连接池: ${name}`);
                destroyPromises.push(connectionInfo.pool.end());
            }
        }
        
        await Promise.all(destroyPromises);
        this.pools.clear();
        this.initialized = false;
        console.log('所有连接池已销毁');
    }

    onQueryEnd() {
        this.queryCount = Math.max(0, this.queryCount - 1);
    }
}

export default ConnectionPool;
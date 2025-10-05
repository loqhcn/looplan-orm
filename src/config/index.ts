import ConnectionPool from '../lib/ConnectionPool';

/**
 * 数据库配置
 * 用于配置数据库连接信息,参考thinkphp的连接配置
 * 
 */
class DatabaseConfig {
    /**
     * 配置
     */
    configs: any;

    /**
     * 连接池配置映射表
     */
    private connectionPoolConfigs: Map<string, any> = new Map();

    constructor(configs: any = null) {
        this.configs = configs || {
            // 默认使用的数据库连接配置
            default: 'mysql',
            // 数据库连接配置列表
            connections: {
                mysql: {
                    type: 'mysql', // 数据库类型，这里是 MySQL
                    host: 'localhost', // 数据库主机地址
                    port: 3306, // 数据库端口
                    user: 'root', // 数据库用户名
                    password: 'root', // 数据库密码
                    database: 'mulo-content', // 数据库名称
                    prefix: 'ct_', // 表前缀，用于区分不同的表名
                }
            }
        };
    }

    static config(configs: any = null) {
        return new DatabaseConfig(configs);
    }
    

    /**
     * 设置配置
     * @param value 配置值
     */
    setConfig(value: any) {
        this.configs = value;
        return this;
    }

    /**
     * 获取配置
     * @param key 配置项
     * @returns 配置值
     */
    getConfig() {
        return this.configs;
    }

    /**
     * 获取默认配置
     * @returns 默认配置
     */
    getDefaultConfigName() {
        return this.configs.default;
    }
    
    /**
     * 设置默认配置
     * @param key 配置项
     */
    setDefaultConfigName(key: string) {
        this.configs.default = key;
        return this;
    }


    /**
     * 获取默认配置
     * @returns 默认配置
     */
    getDefaultConfig() {
        return this.configs.connections[this.getDefaultConfigName()];
    }

    /**
     * 获取连接配置
     * @param key 连接配置项
     * @returns 连接配置
     */
    getConnectionConfig(key: string) {
        return this.configs.connections[key];
    }

    /**
     * 设置连接配置
     * @param key 连接配置项
     * @param value 连接配置值
     */
    setConnectionConfig(key: string, value: any) {
        this.configs.connections[key] = value;
        return this;
    }

    /**
     * 取消设置连接配置
     * @param key 连接配置项
     */
    unsetConnectionConfig(key: string) {
        delete this.configs.connections[key];
        return this;
    }

    /**
     * 检查是否存在连接配置
     * @param key 连接配置项
     * @returns 是否存在连接配置
     */
    hasConnectionConfig(key: string): boolean {
        return this.configs.connections.hasOwnProperty(key);
    }

    /**
     * 设置连接池配置
     * @param connectionName    连接名称
     * @param value             连接池配置值
     */
    useConnectionPool(connectionName: string, value: any) {
        this.connectionPoolConfigs.set(connectionName, value);
        return this;
    }

    /**
     * 获取连接池配置
     * @param connectionName 连接名称
     * @returns 连接池配置
     */
    getConnectionPoolConfig(connectionName: string) {
        return this.connectionPoolConfigs.get(connectionName);
    }

    /**
     * 检查连接是否启用了连接池
     * @param connectionName 连接名称
     * @returns 是否启用连接池
     */
    hasConnectionPool(connectionName: string): boolean {
        return this.connectionPoolConfigs.has(connectionName);
    }

    /**
     * 获取所有连接池配置
     * @returns 所有连接池配置
     */
    getAllConnectionPoolConfigs(): Map<string, any> {
        return this.connectionPoolConfigs;
    }
}

const databaseConfig = DatabaseConfig.config();
const collectionPool = new ConnectionPool();
export {
    databaseConfig,
    DatabaseConfig,
    collectionPool
};
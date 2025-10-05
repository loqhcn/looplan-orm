interface MysqlConfig {
    type: 'mysql';
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
}


/**
 * 数据库连接配置
 */
type ConnectionConfig = MysqlConfig;

export type {
    MysqlConfig,
    ConnectionConfig,
}
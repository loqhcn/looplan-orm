import { modelConfig } from '../config/ModelConfig';
import { join } from 'path';
import fs from 'fs';
import type { ConnectionConfig, MysqlConfig } from '../../types/mysql';
import { databaseConfig } from '../../config';
import { DbException } from '../../exception/DbException';

function setupConnectConfig() {
    // const { MODEL_DIR } = Bun.env;
    // const { MODEL_SERVER_MODE, MODEL_SERVER_LOCAL_NAME } = Bun.env;

    const MODEL_DIR = modelConfig.config('modelDir');
    const MODEL_SERVER_LOCAL_NAME = modelConfig.config('modelServerLocalName');
    const MODEL_SERVER_MODE = modelConfig.config('modelServerMode');
 

    if (!MODEL_DIR) {
        throw new DbException('MODEL_DIR未配置 of .env', 0);
    }

    // TODO -- 读取数据库配置

    // 读取目录
    const dirs = fs.readdirSync(MODEL_DIR);
    // 读取数据库配置
    const dbConfigs: Record<string, any> = {};
    const logs = [];

    for (const dir of dirs) {
        const storageEnginePath = `${MODEL_DIR}/${dir}/storageEngine.json`;
        logs.push(`## space: ${dir}`);
        if (fs.existsSync(storageEnginePath)) {
            const storageEngineData = JSON.parse(fs.readFileSync(storageEnginePath, 'utf-8'));
            // 获取第一个存储引擎配置
            if (storageEngineData && storageEngineData.length > 0) {
                for (const storageEngine of storageEngineData) {
                    const connectionName = `${dir}@${storageEngine.name}`;
                    logs.push(connectionName);

                    let dbConfig = null;
                    if (MODEL_SERVER_MODE === 'prod') {
                        logs.push(`prod`);
                        // 生产环境：使用 productions 中的第一个配置
                        if (storageEngine.productions && storageEngine.productions.length > 0) {
                            const prodConfig = storageEngine.productions[0];
                            dbConfig = { ...prodConfig.connect };

                            // 如果 local_name 匹配，使用 local_host
                            if (MODEL_SERVER_LOCAL_NAME &&
                                prodConfig.connect.local_name === MODEL_SERVER_LOCAL_NAME &&
                                prodConfig.connect.local_host) {
                                logs.push(`prod-local`);
                                dbConfig.host = prodConfig.connect.local_host;
                            }
                        }
                    } else {
                        logs.push('dev');
                        // 开发环境：使用默认的 connect 配置
                        dbConfig = { ...storageEngine.connect };
                    }

                    dbConfig.type = storageEngine.type;
                    if (dbConfig) {
                        dbConfigs[connectionName] = dbConfig;
                    }
                }

            }
        }
    }

    // TODO -- 生成databaseConfig配置数据
    const db_connections: Record<string, ConnectionConfig> = {};
    for (const connectionName in dbConfigs) {
        const config = dbConfigs[connectionName];
        if (config.type === 'mysql') {
            db_connections[connectionName] = {
                type: 'mysql',
                host: config.host,
                user: config.username,
                password: config.password,
                database: config.database,
                port: config.port || 3306,
            } as MysqlConfig;
        } else {
            logs.push(`${connectionName}类型${config.type}暂为支持`);
        }
    }

    for (const connectionName in db_connections) {
        const config = db_connections[connectionName];
        databaseConfig.setConnectionConfig(connectionName, config);
    }

    return {
        dirs,
        logs,
        db_connections,
        dbConfigs
    }
}

export {
    setupConnectConfig
};
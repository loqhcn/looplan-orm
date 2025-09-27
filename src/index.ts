import Db from './Db';
import { DbException } from './exception/DbException';
import { transactionManager } from './lib/TransactionManager';
import { dbAsyncLocalStorage, getReqId, requestRun } from './lib/dbAsyncLocalStorage';

import {
    databaseConfig,
    collectionPool
} from './config';

import { model, type ModelInterface } from './model/Model';

export {
    // 数据库操作类
    Db,
    DbException,
    // 数据库配置 连接池
    databaseConfig,
    collectionPool,
    // 事务管理器
    transactionManager,
    dbAsyncLocalStorage,
    getReqId,
    // 模型
    model,
    type ModelInterface,
    requestRun,
};
export default Db;

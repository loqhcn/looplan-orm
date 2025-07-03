import { Db } from '../src';
import { databaseConfig } from '../src/config';


// 设置配置
const config = databaseConfig.setConfig({
    default: 'mysql',
    connections: {
        mysql: {
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'mulo-content',
            prefix: 'ct_',
        },
        mysql2: {
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'mulo-content-2',
            prefix: 'ct_',
        },
    },
});

console.log('test1');
const data1 = await Db.table('ct_test1').where('id', 1).find();
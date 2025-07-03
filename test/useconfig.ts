// 测试使用配置

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

// 使用默认连接
console.log('# 使用默认连接');
const data1 = await Db.table('ct_test1').where('id', 1).find();
console.log(data1);

// 选择连接，然后指定表名
console.log('# 选择连接，然后指定表名');
const data2 = await Db.connect('mysql2').table('ct_test1').where('id', 1).find();
console.log(data2);

// 使用name方法（自动添加前缀）
console.log('# 使用name方法（自动添加前缀）');
const data3 = await Db.name('test1').where('id', 1).find();
console.log(data3);

// node test/curd.js
import { Db } from '../../src';
import { databaseConfig } from "../../src";

// 设置配置
databaseConfig.setConfig({
    default: 'mysql',  // 默认连接
    connections: {
        mysql: {
            type:'mysql',
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'mulo-content',
            prefix: 'ct_',  // 表前缀
        },
        mysqlCon2: {
            type:'mysql',
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'mulo-content-2',
            prefix: 'ct_',  // 表前缀
        }
    },
});

let data = null;

data = await Db.connect('mysqlCon2').table('ct_test1').where({id:1}).find();
console.log(data);

// data = await Db.connect('mysql').table('ct_test1').where({id:2}).find();
// console.log(data);

// data = await Db.connect('mysqlCon2').table('ct_test1').where({id:1}).find();
// console.log(data);






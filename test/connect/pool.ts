// node test/curd.js
import { Db } from '../../src';
import { databaseConfig, collectionPool } from "../../src";

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
            database: 'mulo-content',
            prefix: 'ct_',  // 表前缀
        }
    },
});

console.log("## 测试连接池");
databaseConfig.useConnectionPool('mysql',{
    connectionLimit:10,
    minLimit:1,
});
databaseConfig.useConnectionPool('mysqlCon2',{
    connectionLimit:5,
    minLimit:2,
});

// 初始化连接池
collectionPool.initPool();

// 查看连接池状态
console.log("\n## 连接池状态");
console.log("mysql连接池状态:", collectionPool.getPoolStatus('mysql'));
console.log("mysqlCon2连接池状态:", collectionPool.getPoolStatus('mysqlCon2'));

// 执行多次查询测试连接复用
console.log("\n## 测试连接复用");
let data1 = await Db.table('ct_test1').where({ id: 1 }).find();
let data2 = await Db.table('ct_test1').where({ id: 2 }).find();
let data3 = await Db.table('ct_test1').alias('mysqlCon2').where({ id: 1 }).find();

console.log("\n## 测试事务（事务不使用连接池）");
try {
    await Db.transaction(async () => {
        console.log("开始事务...");
        
        // 在事务中执行操作
        await Db.table('ct_test1').where({ id: 1 }).update({ 
            name: '事务测试_' + Date.now() 
        });
        
        // 查询验证
        let result = await Db.table('ct_test1').where({ id: 1 }).find();
        console.log("事务中查询结果:", result?.name);
        
        console.log("事务提交成功");
    });
} catch (error) {
    console.error("事务执行失败:", error);
}

console.log("\n## 测试原生SQL查询");
let rawResult = await Db.query('SELECT COUNT(*) as count FROM ct_test1');
console.log("原生查询结果:", rawResult);

// 应用结束后,断开并销毁所有连接
await collectionPool.destroy();

console.log("\n## 查询结果");
console.log("data1:", data1);
console.log("data2:", data2);
console.log("data3:", data3);








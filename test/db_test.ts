// node test/curd.js
import { Db } from '../src';
import { databaseConfig, collectionPool } from "../src";

console.log("## 场景1: 不配置连接池，直接使用（每次创建新连接）");
let data1 = await Db.table('ct_test1').where({id:1}).find();
console.log("查询结果:", data1?.name);

console.log("\n## 场景2: 配置连接池后使用");
// 配置连接池
databaseConfig.useConnectionPool('mysql', {
    connectionLimit: 5,
    minLimit: 1,
});

// 初始化连接池
collectionPool.initPool();

let data2 = await Db.table('ct_test1').where({id:2}).find();
console.log("查询结果:", data2?.name);

let data3 = await Db.table('ct_test1').where({id:1}).find();
console.log("查询结果:", data3?.name);

// 清理连接池
await collectionPool.destroy();

console.log("\n## 场景3: 连接池销毁后再次使用（自动回退到单连接模式）");
let data4 = await Db.table('ct_test1').where({id:1}).find();
console.log("查询结果:", data4?.name);








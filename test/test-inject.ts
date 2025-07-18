// node test/curd.js
import { Db } from '../src';

let logs: any[] = [];

console.log("=== SQL注入防护测试 ===");

// 测试1: 基本的单引号注入
logs.push("---- 测试1: 基本单引号注入 ----");
let result = await Db.table('ct_user')
.where('username',"lqh'")
.find();
logs.push('查询结果:', result);

// 测试2: fetchSql模式 - 查看生成的SQL
logs.push("---- 测试2: fetchSql模式查看SQL ----");
let result2 = await Db.table('ct_user')
.where('username',"lqh'")
.fetchSql(true)
.find();
logs.push('生成的SQL:', result2);

// 测试3: 经典SQL注入攻击
logs.push("---- 测试3: 经典SQL注入攻击 ----");
let result3 = await Db.table('ct_user')
.where('username',"admin' OR '1'='1")
.fetchSql(true)
.find();
logs.push('SQL注入攻击SQL:', result3);

// 测试4: UNION注入攻击
logs.push("---- 测试4: UNION注入攻击 ----");
let result4 = await Db.table('ct_user')
.where('id',"1 UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12")
.fetchSql(true)
.find();
logs.push('UNION注入SQL:', result4);

// 测试5: 注释注入
logs.push("---- 测试5: 注释注入 ----");
let result5 = await Db.table('ct_user')
.where('username',"admin'--")
.fetchSql(true)
.find();
logs.push('注释注入SQL:', result5);

// 测试6: 多条件注入
logs.push("---- 测试6: 多条件注入 ----");
let result6 = await Db.table('ct_user')
.where('username',"test'; DROP TABLE ct_user; --")
.where('status', 1)
.fetchSql(true)
.find();
logs.push('多条件注入SQL:', result6);

// 测试7: 数字注入
logs.push("---- 测试7: 数字注入 ----");
let result7 = await Db.table('ct_user')
.where('id', "1 OR 1=1")
.fetchSql(true)
.find();
logs.push('数字注入SQL:', result7);

// 输出所有日志
logs.forEach(log => {
    console.log(log);
});



// node test/curd.js
import { Db } from '../src';

let logs: any[] = [];

logs.push("---- 使用raw ----");
let result = await Db.table('ct_test1')
.where('money_used', '>',Db.raw('money'))
.fetchSql(true)
.select();

logs.push(result);

logs.push("---- raw在IN中使用 ----");
let result2 = await Db.table('ct_test1')
.where('status', 'in', [1, 2, Db.raw('DEFAULT_STATUS')])
.fetchSql(true)
.select();

logs.push(result2);

logs.push("---- raw在BETWEEN中使用 ----");
let result3 = await Db.table('ct_test1')
.where('created_time', 'between', [Db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)'), Db.raw('NOW()')])
.fetchSql(true)
.select();

logs.push(result3);

logs.push("---- raw在LIKE中使用 ----");
let result4 = await Db.table('ct_test1')
.where('title', 'like', Db.raw("CONCAT('%', ?, '%')"))
.fetchSql(true)
.select();

logs.push(result4);

logs.push("---- raw与filter结合使用 ----");
let result5 = await Db.table('ct_test1')
.filter([
    {
        money: ['>', Db.raw('balance')],
        status: 1
    },
    {
        money: ['between', [Db.raw('MIN_MONEY'), Db.raw('MAX_MONEY')]],
        status: 2
    }
], 'or')
.fetchSql(true)
.select();

logs.push(result5);

// 输出所有日志
logs.forEach(log => {
    console.log(log);
});



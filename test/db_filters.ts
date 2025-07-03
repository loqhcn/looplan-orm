// node test/curd.js
import { Db } from '../src';

let logs: any[] = [];

logs.push("# filters");

logs.push("---- 筛选查询 ----");
let result = await Db.table('ct_test1').filter([
    {
        status: 1,
        page: ['in', [1, 2, 3]],
        money: ['between', [100, 200]],
        title: ['like', '王尼玛%']
    },
    {
        status: 2,
        age: ['in', [4, 5, 6]],
        money: ['between', [300, 400]],
        title: ['like', '张三%']
    }
], 'or')
.fetchSql(true)
.select();

logs.push(result);


logs.push("---- 筛选&where ----");
let result2 = await Db.table('ct_test1')
.filter([
    {
        age: ['in', [1, 2, 3]],
    },
    {
        age: ['in', [4, 5, 6]],
    }
],'or')
.where('status', 1)
.fetchSql(true)
.select();


logs.push(result2);

logs.push("---- 单个筛选条件 ----");
let result3 = await Db.table('ct_test1')
.filter([
    {
        age: ['in', [1, 2, 3]],
        status: 1
    }
])
.where('money', '>', 100)
.fetchSql(true)
.select();

logs.push(result3);

logs.push("---- 多个where + filter ----");
let result4 = await Db.table('ct_test1')
.where('deleted', 0)
.filter([
    {
        age: ['in', [1, 2, 3]],
    },
    {
        age: ['in', [4, 5, 6]],
    }
],'or')
.where('status', 1)
.fetchSql(true)
.select();

logs.push(result4);

// 输出所有日志
logs.forEach(log => {
    console.log(log);
});


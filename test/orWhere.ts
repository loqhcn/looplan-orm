// 测试命令 bun run test/orWhere.ts

import { Db } from '../src';

let logs: any[] = [];

let result: any = null;
// console.log('# 测试where');
// const data1 = await Db.table('ct_test1').where('id', 1).find();
// console.log(data1);

logs.push("## 测试orWhere");
result = await Db.table('ct_test1').where('id', 1).orWhere('id', 2).fetchSql().select();
logs.push(result);

logs.push("## 测试limit");
result = await Db.table('ct_test1').limit(1).fetchSql().select();
logs.push(result);

logs.push("## 测试delete");
result = await Db.table('ct_test1').where('id', 3).fetchSql().delete();
logs.push(result);

logs.push("## 测试update");
result = await Db.table('ct_test1').where('id', 1).fetchSql().update({
    title: '测试update'
});
logs.push(result);

logs.push("## 测试 min,max,avg,sum,count");
result = await Db.table('ct_test1').fetchSql().min('age');
logs.push(result);



logs.forEach(log => {
    console.log(log);
});

// console.log('# 测试limit-offset');
// const data_offset = await Db.table('ct_test1').limit(0,2).select();
// console.log(data_offset);

// console.log('# 测试group');
// const data_group = await Db.table('ct_test1').field('age,sum(money) as money_sum').group('age').select();
// console.log(data_group);

// console.log('# 测试page');
// const data_page = await Db.table('ct_test1').page(1,10).select();
// console.log(data_page);








// console.log('# 测试in');
// const data3 = await Db.table('ct_test1').where('id','in',[1,2]).select();
// console.log(data3);


// // console.log('# 测试like');
// // const data4 = await Db.table('ct_test1').where('title','like','%张%').select();
// // console.log(data4);


// console.log('# 测试between');
// const data5 = await Db.table('ct_test1').where('money','between',[100,200]).select();
// console.log(data5);


// console.log('# 测试not between');
// const data6 = await Db.table('ct_test1').where('money','not between',[100,200]).select();
// console.log(data6);









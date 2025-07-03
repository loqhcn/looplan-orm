// node test/curd.js
import { Db } from '../src';

let logs: any[] = [];

logs.push("---- 测试paginate ----");

let result = await Db.table('ct_test1').fetchSql().paginate(1,10);

logs.push(result);

logs.push("---- 测试paginateX大数据分页 ----");
let result2 = await Db.table('ct_test1').fetchSql().paginateX(5,{
    orderField:'id',
    orderType:'DESC',
    limit:10,
});
logs.push(result2);

// logs.push("---- 测试paginateX设置不同的limit ----");
// let result3 = await Db.table('ct_test1').paginateX(0,{
//     orderField:'id',
//     orderType:'ASC',
//     limit:3, // 测试小的limit值
// });
// logs.push(result3);

logs.forEach(log => {
    console.log(log);
});



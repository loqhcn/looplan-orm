import { initModel } from "../model-test-common";
import { model } from '../../src/model/Model';
// 通过 `bun run .\test\model-curd.ts` 运行
initModel();
console.log("# 查询&修改");


// console.log("## 获取多个数据");
const row = await model('looplan/ct_test1').where('id','>',24).select()
console.log(row.toData());
// row.name = 'test'+Date.now();
// await row.save();
// const row2 = await model('test_dev/sl_test_news').find()
// console.log(row2.toData());

// const query = model('looplan/ct_test1');



// async function buildQuery() {
//     const query = model('looplan/ct_test1');
//     // if (opt.where) {
//     //     query.where(opt.where);
//     // }
//     return query;
// }

// const query = await buildQuery();
// const row = await query.select();
// console.log(row.toData());


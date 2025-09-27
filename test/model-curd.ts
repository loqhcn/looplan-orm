import { initModel } from "./model-test-common";
import { model } from '../src/model/Model';

initModel();

console.log("# 查询&修改");

console.log("## 获取多个数据");
const row = await model('test_dev/sl_test_news').find()
console.log(row.toData());
// row.name = 'test'+Date.now();
// await row.save();


// const row2 = await model('ct_test1').where('id',2).find()
// let saveRet = await row2.save({
//     name:'name'+Date.now()
// });
// console.log(saveRet);

// console.log("# 删除");
// const row3 = await model('ct_test1').where('id',3).find()
// if(!row3){
//     console.log('数据不存在');
// }
// let res = await row3.delete();
// console.log(res);






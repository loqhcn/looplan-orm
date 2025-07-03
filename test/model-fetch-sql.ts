import { initModel } from "./model-test-common";
import { model } from '../src/model/Model';

initModel();


console.log("## 获取多个数据");
const row = await model('ct_test1').find()
console.log(row);
row.name = 'test11111111111';
await row.save();


const row2 = await model('ct_test1').where('id',2).find()
await row2.save({
    name:'test22222222222'
});
console.log(row2);







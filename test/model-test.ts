import { initModel } from "./model-test-common";
import { model } from '../src/model/Model';

initModel();


// console.log("## 测试find");
// const testModel1 = model('ct_test1');
// const row = await testModel1.find(1);



// 加入关联
console.log('# 加入关联');
let data4 = await model('ct_news').with(['user']).select();
console.log(JSON.stringify({
    data4:data4
}));

// console.log("## 获取多个数据");
// const testModel2 = model('ct_test1'); // 使用新的模型实例
// const rows = await testModel2.limit(3).select();
// console.log("获取到的数据数量:", rows.length);

// console.log("## 获取多个数据");
// const testModel2 = model('ct_test1'); // 使用新的模型实例
// const rows = await testModel2.fetchSql().find()
// console.log(rows);

// rows.data.forEach((row:any) => {
//     console.log(row.id,row.name);
// });


// console.log("## 测试模型分页功能");
// const testModelA = model('ct_test1');
// const rowsA = await testModelA.paginate(1,10);
// console.log("正常分页结果:", {
//     dataType: rowsA.data.constructor.name,
//     dataLength: rowsA.data.length,
//     total: rowsA.total,
//     page: rowsA.page,
//     lastPage: rowsA.lastPage
// });

// console.log("\n## 测试模型分页功能 - fetchSql模式");
// const testModelSql = model('ct_test1');
// const sqlRows = await testModelSql.fetchSql().paginate(1,10);
// console.log("fetchSql分页结果:", sqlRows);


// console.log("## 获取多个数据2");
// const testModel3 = model('ct_test1'); // 使用新的模型实例
// const rows2 = await testModel3.paginateX(10,{
//     orderField:'id',
//     orderType:'DESC',
//     limit:10,
// });
// console.log(rows2);


// // 查询所有
// console.log('# 查询所有');
// let data = await model('ct_news').select();
// console.log(data);

// // 查询一条
// console.log('# 查询一条');
// let row = await model('ct_test1').find();
// console.log(row);



// 筛选查询
// console.log('# 筛选查询');
// let data2 = model('ct_test1').filters({
//     status: 1,
//     age: ['in', [18, 19, 20]],
//     money: ['between', [100, 200]],
// }).select();
// console.log(data2);




// 加入关联
// console.log('# 加入关联');
// let data4 = await model('ct_news').with(['user']).select();
// console.log('data4',data4);

/*






// 筛选查询-or
console.log('# 筛选查询-or');
let data3 = model('ct_test1').filters([
    {
        status: 1,
        age: ['in', [18, 19, 20]],
    },
    {
        status: 2,
        money: ['between', [100, 200]],
    }
], 'or')
.order('id', 'desc')
.select();
console.log(data3);



// 添加
console.log('# 添加');
model('ct_test1').save({
    name: 'test',
    age: 18
});

// 更新
console.log('# 更新');
model('ct_test1').where('id', 1).save({
    name: 'test',
});

// 删除
console.log('# 删除');
model('ct_test1').where('id', 1).delete();





*/






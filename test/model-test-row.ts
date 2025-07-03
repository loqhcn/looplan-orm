import { initModel } from "./model-test-common";
import { model } from '../src/model/Model';

initModel();

let result: any = null;
let logs: any[] = [];

console.log("## 测试find");
const testModel1 = model('ct_test1');
const row = await testModel1.find(1);
// console.log("原始对象:", row);
console.log("JSON序列化:", JSON.stringify({
    row: row,
}));

// if (row) {
//     console.log("原始name:", row.name);
//     row.name = "测试修改";
//     console.log("修改后name:", row.name);
//     console.log("是否有修改:", row.isDirty());
    
//     // 保存修改
//     const saveResult = await row.save();
//     console.log("保存结果:", saveResult);
// }

// console.log("## 获取多个数据");
// const testModel2 = model('ct_test1'); // 使用新的模型实例
// const rows = await testModel2.limit(3).select();
// console.log("获取到的数据数量:", rows.length);
// console.log("ModelList JSON序列化:", JSON.stringify(rows));

// // 可以像数组一样遍历
// rows.forEach((row: any, index: number) => {
//     console.log(`第${index + 1}行 - name: ${row.name}, id: ${row.id}`);
// });

// // 可以转换为数组
// const rowsArr = rows.toArray();
// console.log("转换为数组的长度:", rowsArr.length);

// // 测试数组访问
// console.log("## 测试数组访问");
// console.log("第一行数据:", rows[0] ? rows[0].name : '无数据');
// console.log("通过get方法:", rows.get(0) ? rows.get(0)?.name : '无数据');

// // 测试ModelList的其他方法
// console.log("## 测试ModelList方法");
// console.log("第一行:", rows.first()?.name);
// console.log("最后一行:", rows.last()?.name);
// console.log("是否为空:", rows.isEmpty());

// // 测试查找
// const foundRow = rows.find((row: any) => row.id === 1);
// console.log("查找id=1的行:", foundRow ? foundRow.name : '未找到');

// // 测试过滤
// const filteredRows = rows.filter((row: any) => row.status === 1);
// console.log("status=1的行数:", filteredRows.length);

// // 测试批量修改
// console.log("## 测试批量修改");
// rows.forEach((row: any) => {
//     row.pay_title = `批量修改_${row.id}`;
// });

// // 测试批量保存
// console.log("执行批量保存...");
// const saveResults = await rows.saveAll();
// console.log("批量保存结果数量:", saveResults.length);

// console.log("## 测试 filters");
// const testModel3 = model('ct_test1'); // 使用新的模型实例
// const data = await testModel3.filter([
//     {
//        id:['in',[1,2,4]]
//     }
// ]).select();
// console.log("筛选结果数量:", data.length);
// data.forEach((row: any, index: number) => {
//     console.log(`筛选结果${index + 1}: id=${row.id}, name=${row.name}`);
// });

// // 测试for...of遍历
// console.log("## 测试for...of遍历");
// for (const row of data) {
//     console.log(`for...of: id=${row.id}, name=${row.name}`);
// }

// // 测试API返回格式
// console.log("## 测试API返回格式");
// const apiResponse = {
//     code: 200,
//     message: 'success',
//     data: {
//         single: row,
//         list: data,
//         total: data.length
//     }
// };
// console.log("API响应格式:", JSON.stringify(apiResponse, null, 2));

// 测试事务

import { Db, dbAsyncLocalStorage, requestRun } from '../src';
import { randomUUID } from 'node:crypto';


const reqId = randomUUID(); // e.g., "f47ac10b-58cc-4372-a567-0e02b2c3d479"
// // 方法1：使用transaction函数包装
// console.log('方法1：使用transaction函数');
// try {
//   const result = await Db.transaction(async () => {
//     const data1 = await Db.table('ct_test1').where('id', 1).find();
//     console.log('事务中查询1:', data1);



//     const data2 = await Db.table('ct_test1').where('id', 2).update({
//       name: '事务更新测试' + Date.now()
//     });
//     console.log('事务中查询2:', data2);


//     return { data1, data2 };
//   });
//   console.log('事务结果:', result);
// } catch (error) {
//   console.error('事务执行失败:', error);
// }

// 方法2：手动控制事务
async function testDbTransaction() {
  console.log('\n ## 方法2：手动控制事务');
  await Db.startTrans();
  try {
    const data1 = await Db.table('ct_test1').where('id', 1).find();
    console.log('事务中查询1:', data1);

    const data2 = await Db.table('ct_test1').where('id', 2).update({
      name: '事务更新测试' + Date.now()
    });
    console.log('事务中查询2:', data2);

    await Db.commit();

    return { data1, data2 };
  } catch (error) {
    await Db.rollback();
    console.error('事务执行失败，已自动回滚:', error);
  }
}
console.log('reqId', reqId);

const res = requestRun(reqId,  () => {
  return testDbTransaction();
});
console.log('res', await res);



// // 测试失败回滚:手动控制
// async function testRollback() {
//   console.log('\n测试失败回滚:手动控制');
//   try {
//     // 先查询记录初始状态
//     const initialData = await Db.table('ct_test1').where('id', 2).find();
//     console.log('更新前的数据:', initialData);

//     await Db.startTrans();
//     console.log('事务已开始');

//     // 执行一个查询
//     const data1 = await Db.table('ct_test1').where('id', 1).find();
//     console.log('事务中查询1:', data1);

//     // 执行一个更新
//     const updateResult = await Db.table('ct_test1').where('id', 2).update({ name: '事务更新测试' + Date.now() });
//     console.log('事务中更新结果:', updateResult);

//     // 查询更新后的结果确认更新成功
//     const updatedData = await Db.table('ct_test1').where('id', 2).find();
//     console.log('事务中更新后的数据:', updatedData);

//     // 故意抛出异常触发回滚
//     throw new Error('模拟操作失败，将触发回滚');

//     // 这里不会执行
//     await Db.commit();
//   } catch (error) {
//     console.error('事务执行失败，准备回滚:', error);
//     await Db.rollback();
//     console.log('事务已回滚');

//     // 查询回滚后的数据状态
//     const afterRollbackData = await Db.table('ct_test1').where('id', 2).find();
//     console.log('回滚后的数据:', afterRollbackData);
//   }
// }

// testRollback();

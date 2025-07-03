// 测试原生查询

import { Db } from '../src';

let time = Date.now();

// 1. 基本查询
console.log('\n1. 基本查询');
// query方法用于执行SQL查询操作，返回查询结果数据集（数组）。
const result = await Db.query('SELECT * FROM ct_test1 WHERE id = 1');
console.log('查询结果:', result);

// 2. 基本更新
console.log('\n2. 基本更新');
// execute用于更新和写入数据的sql操作，返回影响的记录数
const result2 = await Db.execute('UPDATE ct_test1 SET name = "原生SQL更新测试" WHERE id = 1');
console.log('更新影响行数:', result2);

// 3. 参数绑定 - 数组形式
console.log('\n3. 参数绑定 - 数组形式');
const result3 = await Db.query('SELECT * FROM ct_test1 WHERE id = ?', [1]);
console.log('查询结果(数组参数):', result3);

// 4. 参数绑定 - 命名形式
console.log('\n4. 参数绑定 - 命名形式');
const result4 = await Db.execute('UPDATE ct_test1 SET name = :name WHERE id = :id', { name: '命名参数更新测试', id: 1 });
console.log('更新影响行数(命名参数):', result4);

// 5. 多个参数
console.log('\n5. 多个参数');
const result5 = await Db.query('SELECT * FROM ct_test1 WHERE id IN (?, ?)', [1, 2]);
console.log('查询结果(多参数):', result5);

// 6. 在事务中使用原生SQL
console.log('\n6. 在事务中使用原生SQL');
try {
  await Db.startTrans();
  console.log('事务已开始');
  
  // 在事务中查询
  const transResult1 = await Db.query('SELECT * FROM ct_test1 WHERE id = 1');
  console.log('事务中查询结果:', transResult1);
  
  // 在事务中更新
  const transResult2 = await Db.execute('UPDATE ct_test1 SET name = "事务中原生SQL更新" WHERE id = 1');
  console.log('事务中更新影响行数:', transResult2);
  
  await Db.commit();
  console.log('事务已提交');
} catch (error) {
  console.error('事务执行失败，准备回滚:', error);
  await Db.rollback();
  console.log('事务已回滚');
}

console.log(`\n执行时间: ${Date.now() - time}ms`);

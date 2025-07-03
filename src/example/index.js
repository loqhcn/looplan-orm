// MySQL查询示例
import Db from './../../looplan-orm/Db';

// 查询数据
const users = await Db.table('user')
  .field('id,name,email')
  .where('status', 1)
  .where('age', '>', 18)
  .order('create_time', 'DESC')
  .limit(10)
  .select();

// 查询单条数据
const user = await Db.table('user').where('id', 1).find();

// 插入数据
await Db.table('user').insert({
  name: '张三',
  email: 'zhangsan@example.com',
  status: 1
});

// 更新数据
await Db.table('user').where('id', 1).update({
  name: '李四',
  email: 'lisi@example.com'
});

// 删除数据
await Db.table('user').where('id', 1).delete();

// 聚合查询
const count = await Db.table('user').where('status', 1).count();
const sumScore = await Db.table('user').where('status', 1).sum('score');

// 使用MongoDB
const mongoUsers = await Db.database('mongodb')
  .table('user')
  .where('status', 1)
  .select();
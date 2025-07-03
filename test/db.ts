import { Db } from '../src';

let logs = [];

logs.push("# 单条数据查询");
const result = await Db.table('ct_test1').where('id', 1).find();
logs.push(result);



logs.push("# 多条数据查询");
const result3 = await Db.table('ct_test1').select();
logs.push(result3);

logs.push("# 测试join");
const result4_sql = await Db.table('ct_test1')
    .field('ct_test1.*, ct_user.nickname as user_nickname')
    .join('ct_user', 'ct_test1.user_id = ct_user.id')
    .fetchSql(true)
    .select();

logs.push(result4_sql);

const result4 = await Db.table('ct_test1')
    .field('ct_test1.*, ct_user.nickname as user_nickname')
    .join('ct_user', 'ct_test1.user_id = ct_user.id')
    .select();
logs.push(result4);

// 闭包测试
logs.push("# 闭包测试");
const result5 = await Db.table('ct_test1').where(($query: any) => {
    $query.where('id', 1).where('status', 1);
}).select();
logs.push(result5);



console.log(logs);


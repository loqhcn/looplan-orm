// node test/curd.js
import { Db } from '../src';

let logs: any[] = [];

// console.log("=== 测试orWhere修复 ===");

// // 测试1: 基本orWhere
// logs.push("---- 测试1: 基本orWhere ----");
// let result1 = await Db.table('ct_user')
// .where('status', 1)
// .orWhere('status', 2)
// .fetchSql(true)
// .select();
// logs.push('基本orWhere SQL:', result1);

// // 测试2: JOIN + orWhere
// logs.push("---- 测试2: JOIN + orWhere ----");
// let result2 = await Db.table('ct_news')
// .field('ct_news.id,ct_news.title,ct_user.nickname')
// .join('ct_user','ct_news.user_id=ct_user.id','left')
// .where('ct_user.nickname',"lqh'")
// .orWhere('ct_user.nickname',"lqh")
// .fetchSql(true)
// .select();
// logs.push('JOIN + orWhere SQL:', result2);

// 测试3: 实际执行（非fetchSql）
logs.push("---- 测试3: 实际执行测试 ----");
try {
    let result3 = await Db.table('ct_news')
    .alias('c')
    .field('c.id,c.title,u.nickname')
    .join('ct_user u','c.user_id=u.id','left')
    .where('u.nickname',"test")
    .orWhere('u.nickname',"admin")
    // .fetchSql(true)
    .limit(2)
    .select();
    logs.push('实际执行结果:', result3);
} catch (error: any) {
    logs.push('执行错误:', error.message);
}

// 测试4: UPDATE with alias
logs.push("---- 测试4: UPDATE带别名 ----");
try {
    let result4 = await Db.table('ct_user')
    .alias('u')
    .where('u.id', 3)
    .data({ status: 2 })
    // .fetchSql(true)
    .update();
    logs.push('UPDATE with alias SQL:', result4);
} catch (error: any) {
    logs.push('UPDATE错误:', error.message);
}

// 测试5: DELETE with alias
logs.push("---- 测试5: DELETE带别名 ----");
try {
    let result5 = await Db.table('ct_test')
    .alias('t')
    .where('t.id', '>', 100)
    .fetchSql(true)
    .delete();
    logs.push('DELETE with alias SQL:', result5);
} catch (error: any) {
    logs.push('DELETE错误:', error.message);
}

// 测试6: COUNT with alias
logs.push("---- 测试6: COUNT带别名 ----");
try {
    let result6 = await Db.table('ct_user')
    .alias('u')
    .where('u.status', 1)
    .fetchSql(true)
    .count();
    logs.push('COUNT with alias SQL:', result6);
} catch (error: any) {
    logs.push('COUNT错误:', error.message);
}

// 测试7: selectConnect方法
logs.push("---- 测试7: selectConnect方法 ----");
try {
    let result7 = await Db.selectConnect('mysql')
    .table('ct_user')
    .alias('u') 
    .field('u.id,u.nickname')
    .where('u.status', 1)
    .fetchSql(true)
    .limit(1)
    .select();
    logs.push('selectConnect SQL:', result7);
} catch (error: any) {
    logs.push('selectConnect错误:', error.message);
}

// 输出所有日志
logs.forEach(log => {
    console.log(log);
});
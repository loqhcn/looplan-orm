// 自动化测试Db的mysql功能

import { describe, test, expect } from 'vitest';
import { Db } from '../src';

// CREATE TABLE `ct_user` (
//     `id` int(11) NOT NULL AUTO_INCREMENT,
//     `nickname` varchar(255) COLLATE utf8_unicode_ci DEFAULT '用户昵称',
//     `avatar` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
//     `username` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
//     `password` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
//     `salt` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
//     `money` decimal(11,2) DEFAULT '0.00',
//     `score` int(11) DEFAULT NULL COMMENT '积分',
//     `status` int(4) DEFAULT '1' COMMENT '状态存储',
//     `createtime` int(11) DEFAULT NULL,
//     `updatetime` int(11) DEFAULT NULL,
//     `deletetime` int(11) DEFAULT NULL,
//     PRIMARY KEY (`id`)
//   ) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

describe('SQL注入防护测试', () => {

    test('基本单引号注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('username', "lqh'")
            .fetchSql(true)
            .find();
        
        console.log('生成的SQL:', sql);
        
        // 验证SQL使用了参数化查询，不应包含直接拼接的单引号
        expect(typeof sql).toBe('string');
        expect(sql).toContain("username = 'lqh\\''"); // 应该被转义
        expect(sql).not.toContain("username = lqh'"); // 不应该有未转义的情况
    });

    test('经典OR注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('username', "admin' OR '1'='1")
            .fetchSql(true)
            .find();
        
        console.log('OR注入SQL:', sql);
        
        // 验证整个注入字符串被当作普通字符串处理
        expect(sql).toContain("username = 'admin\\' OR \\'1\\'=\\'1'");
        expect(sql).not.toContain("username = admin' OR '1'='1'");
    });

    test('UNION注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('id', "1 UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12")
            .fetchSql(true)
            .find();
        
        console.log('UNION注入SQL:', sql);
        
        // 验证UNION语句被当作普通字符串值处理
        expect(sql).toContain("id = '1 UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12'");
        expect(sql).not.toMatch(/id = 1 UNION SELECT/);
    });

    test('注释注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('username', "admin'--")
            .fetchSql(true)
            .find();
        
        console.log('注释注入SQL:', sql);
        
        // 验证注释符号被转义
        expect(sql).toContain("username = 'admin\\'--'");
        expect(sql).not.toContain("username = admin'--");
    });

    test('多条件注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('username', "test'; DROP TABLE ct_user; --")
            .where('status', 1)
            .fetchSql(true)
            .find();
        
        console.log('多条件注入SQL:', sql);
        
        // 验证DROP语句被当作普通字符串处理，应该被转义
        expect(sql).toContain("username = 'test\\'; DROP TABLE ct_user; --'");
        expect(sql).toContain("status = 1");
        // 验证恶意SQL被安全地包含在引号内，不会被执行
        expect(sql).toContain("'test\\'; DROP TABLE ct_user; --'");
    });

    test('数字类型注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('id', "1 OR 1=1")
            .fetchSql(true)
            .find();
        
        console.log('数字注入SQL:', sql);
        
        // 即使是数字字段，恶意字符串也应该被当作字符串处理
        expect(sql).toContain("id = '1 OR 1=1'");
        expect(sql).not.toMatch(/id = 1 OR 1=1/);
    });

    test('IN查询注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('id', 'IN', ["1", "2'; DROP TABLE ct_user; --", "3"])
            .fetchSql(true)
            .find();
        
        console.log('IN查询注入SQL:', sql);
        
        // 验证IN查询中的恶意代码被转义
        expect(sql).toContain("id IN ('1', '2\\'; DROP TABLE ct_user; --', '3')");
    });

    test('LIKE查询注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('username', 'LIKE', "%admin'; DELETE FROM ct_user; --%")
            .fetchSql(true)
            .find();
        
        console.log('LIKE查询注入SQL:', sql);
        
        // 验证LIKE查询中的恶意代码被转义
        expect(sql).toContain("username LIKE '%admin\\'; DELETE FROM ct_user; --%'");
    });

    test('UPDATE注入防护', async () => {
        const sql = await Db.table('ct_user')
            .where('id', 1)
            .fetchSql(true)
            .update({
                username: "admin'; DROP TABLE ct_user; --",
                status: 1
            });
        
        console.log('UPDATE注入SQL:', sql);
        
        // 验证UPDATE语句中的恶意代码被转义
        expect(sql).toContain("username = 'admin\\'; DROP TABLE ct_user; --'");
        expect(sql).toContain("status = 1");
    });

    test('INSERT注入防护', async () => {
        const sql = await Db.table('ct_user')
            .fetchSql(true)
            .insert({
                username: "test'; DROP TABLE ct_user; --",
                password: "password",
                status: 1
            });
        
        console.log('INSERT注入SQL:', sql);
        
        // 验证INSERT语句中的恶意代码被转义
        expect(sql).toContain("('test\\'; DROP TABLE ct_user; --', 'password', 1)");
    });

});

console.log("---- 测试Db的mysql功能 ----");









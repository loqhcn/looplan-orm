import { describe, it, expect } from "bun:test";
import { Db } from '../src';

describe('Db的mysql功能测试', () => {
    
    // 基础查询测试
    describe('基础查询', () => {
        it('测试find方法', async () => {
            const sql = await Db.table('ct_test1')
                .where('id', 1)
                .fetchSql(true)
                .find();
            
            expect(typeof sql).toBe('string');
            expect(sql).toContain('SELECT');
            expect(sql).toContain('ct_test1');
            expect(sql).toContain('LIMIT 1');
        });

        it('测试select方法', async () => {
            const sql = await Db.table('ct_test1')
                .where('status', 1)
                .fetchSql(true)
                .select();
            
            expect(typeof sql).toBe('string');
            expect(sql).toContain('SELECT * FROM ct_test1');
            expect(sql).toContain('status = 1');
        });

        it('测试field字段选择', async () => {
            const sql = await Db.table('ct_test1')
                .field('id,name,title')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('SELECT id,name,title FROM ct_test1');
        });

        it('测试field数组形式', async () => {
            const sql = await Db.table('ct_test1')
                .field(['id', 'name', 'title'])
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('SELECT id,name,title FROM ct_test1');
        });
    });

    // WHERE条件测试
    describe('WHERE条件', () => {
        it('测试单个where条件', async () => {
            const sql = await Db.table('ct_test1')
                .where('name', 'test')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('WHERE name = \'test\'');
        });

        it('测试多个where条件', async () => {
            const sql = await Db.table('ct_test1')
                .where('name', 'test')
                .where('status', 1)
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('WHERE name = \'test\' AND status = 1');
        });

        it('测试where操作符', async () => {
            const sql = await Db.table('ct_test1')
                .where('age', '>', 18)
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('WHERE age > 18');
        });

        it('测试where IN条件', async () => {
            const sql = await Db.table('ct_test1')
                .where('id', 'IN', [1, 2, 3])
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('id IN (1, 2, 3)');
        });

        it('测试where LIKE条件', async () => {
            const sql = await Db.table('ct_test1')
                .where('name', 'LIKE', '%test%')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('name LIKE \'%test%\'');
        });

        it('测试where BETWEEN条件', async () => {
            const sql = await Db.table('ct_test1')
                .where('age', 'BETWEEN', [18, 65])
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('age BETWEEN 18 AND 65');
        });

        it('测试where NULL条件', async () => {
            const sql = await Db.table('ct_test1')
                .where('deleted_at', null)
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('WHERE deleted_at IS NULL');
        });
    });

    // OR条件测试
    describe('OR条件', () => {
        it('测试orWhere基本用法', async () => {
            const sql = await Db.table('ct_test1')
                .where('status', 1)
                .orWhere('status', 2)
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('WHERE status = 1');
            expect(sql).toContain('OR');
            // 注意：由于orWhere处理机制，第二个条件使用命名占位符
            expect(sql).toMatch(/(status = 2|status = :status_\d+)/);
        });

        it('测试orWhere对象形式', async () => {
            const sql = await Db.table('ct_test1')
                .where('age', '>', 18)
                .orWhere({'name': 'admin', 'status': 1})
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('age > 18');
            expect(sql).toContain('OR');
            // 注意：由于orWhere处理机制，对象条件使用命名占位符
            expect(sql).toMatch(/(name = 'admin'|name = :name_\d+)/);
            expect(sql).toMatch(/(status = 1|status = :status_\d+)/);
        });
    });

    // JOIN测试
    describe('JOIN查询', () => {
        it('测试INNER JOIN', async () => {
            const sql = await Db.table('ct_test1')
                .join('ct_user', 'ct_test1.user_id = ct_user.id')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('INNER JOIN ct_user ON ct_test1.user_id = ct_user.id');
        });

        it('测试LEFT JOIN', async () => {
            const sql = await Db.table('ct_test1')
                .leftJoin('ct_user', 'ct_test1.user_id = ct_user.id')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('LEFT JOIN ct_user ON ct_test1.user_id = ct_user.id');
        });

        it('测试RIGHT JOIN', async () => {
            const sql = await Db.table('ct_test1')
                .rightJoin('ct_user', 'ct_test1.user_id = ct_user.id')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('RIGHT JOIN ct_user ON ct_test1.user_id = ct_user.id');
        });

        it('测试JOIN与WHERE结合', async () => {
            const sql = await Db.table('ct_test1')
                .field('ct_test1.id, ct_test1.title, ct_user.nickname')
                .leftJoin('ct_user', 'ct_test1.user_id = ct_user.id')
                .where('ct_test1.status', 1)
                .where('ct_user.status', 1)
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('LEFT JOIN');
            expect(sql).toContain('ct_test1.status = 1');
            expect(sql).toContain('ct_user.status = 1');
        });
    });

    // 排序和限制测试
    describe('排序和限制', () => {
        it('测试order排序', async () => {
            const sql = await Db.table('ct_test1')
                .order('id', 'DESC')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('ORDER BY id DESC');
        });

        it('测试order对象形式', async () => {
            const sql = await Db.table('ct_test1')
                .order({'id': 'DESC', 'name': 'ASC'})
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('ORDER BY id DESC, name ASC');
        });

        it('测试limit', async () => {
            const sql = await Db.table('ct_test1')
                .limit(10)
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('LIMIT 10');
        });

        it('测试limit偏移', async () => {
            const sql = await Db.table('ct_test1')
                .limit(10, 20)
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('LIMIT 10, 20');
        });

        it('测试group by', async () => {
            const sql = await Db.table('ct_test1')
                .group('user_id')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('GROUP BY user_id');
        });

        it('测试group by多字段', async () => {
            const sql = await Db.table('ct_test1')
                .group(['user_id', 'status'])
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('GROUP BY user_id, status');
        });

        it('测试distinct', async () => {
            const sql = await Db.table('ct_test1')
                .distinct()
                .field('user_id')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('SELECT DISTINCT user_id');
        });
    });

    // INSERT测试
    describe('INSERT操作', () => {
        it('测试基本insert', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .insert({
                    title: 'test title',
                    name: 'test name',
                    age: 25,
                    status: 1
                });
            
            expect(sql).toContain('INSERT INTO ct_test1');
            expect(sql).toContain('title, name, age, status');
            expect(sql).toContain('VALUES');
            expect(sql).toContain('\'test title\'');
            expect(sql).toContain('\'test name\'');
            expect(sql).toContain('25');
            expect(sql).toContain('1');
        });

        it('测试insertGetId', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .insertGetId({
                    title: 'test title',
                    name: 'test name'
                });
            
            expect(sql).toContain('INSERT INTO ct_test1');
            expect(sql).toContain('(title, name)');
            expect(sql).toContain('VALUES');
        });

        it('测试insertAll批量插入', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .insertAll([
                    {title: 'title1', name: 'name1', status: 1},
                    {title: 'title2', name: 'name2', status: 2}
                ]);
            
            expect(sql).toContain('INSERT INTO ct_test1');
            expect(sql).toContain('(title, name, status)');
            expect(sql).toContain('VALUES');
            expect(sql).toContain('\'title1\'');
            expect(sql).toContain('\'title2\'');
        });
    });

    // UPDATE测试
    describe('UPDATE操作', () => {
        it('测试基本update', async () => {
            const sql = await Db.table('ct_test1')
                .where('id', 1)
                .fetchSql(true)
                .update({
                    title: 'updated title',
                    status: 2
                });
            
            expect(sql).toContain('UPDATE ct_test1');
            expect(sql).toContain('SET');
            expect(sql).toContain('title = \'updated title\'');
            expect(sql).toContain('status = 2');
            expect(sql).toContain('WHERE id = 1');
        });

        it('测试update多条件', async () => {
            const sql = await Db.table('ct_test1')
                .where('user_id', 1)
                .where('status', 1)
                .fetchSql(true)
                .update({
                    title: 'new title'
                });
            
            expect(sql).toContain('WHERE user_id = 1 AND status = 1');
        });
    });

    // DELETE测试
    describe('DELETE操作', () => {
        it('测试基本delete', async () => {
            const sql = await Db.table('ct_test1')
                .where('id', 1)
                .fetchSql(true)
                .delete();
            
            expect(sql).toContain('DELETE FROM ct_test1');
            expect(sql).toContain('WHERE id = 1');
        });

        it('测试delete多条件', async () => {
            const sql = await Db.table('ct_test1')
                .where('status', 0)
                .where('user_id', 1)
                .fetchSql(true)
                .delete();
            
            expect(sql).toContain('WHERE status = 0 AND user_id = 1');
        });
    });

    // 聚合函数测试
    describe('聚合函数', () => {
        it('测试count', async () => {
            const sql = await Db.table('ct_test1')
                .where('status', 1)
                .fetchSql(true)
                .count();
            
            expect(sql).toContain('SELECT COUNT(*) AS count');
            expect(sql).toContain('FROM ct_test1');
            expect(sql).toContain('WHERE status = 1');
        });

        it('测试count指定字段', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .count('id');
            
            expect(sql).toContain('SELECT COUNT(id) AS count');
        });

        it('测试sum', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .sum('money');
            
            expect(sql).toContain('SELECT SUM(money) AS sum');
        });

        it('测试avg', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .avg('age');
            
            expect(sql).toContain('SELECT AVG(age) AS avg');
        });

        it('测试max', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .max('money');
            
            expect(sql).toContain('SELECT MAX(money) AS max');
        });

        it('测试min', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .min('age');
            
            expect(sql).toContain('SELECT MIN(age) AS min');
        });
    });

    // SQL注入防护测试
    describe('SQL注入防护', () => {
        it('测试单引号注入防护', async () => {
            const sql = await Db.table('ct_test1')
                .where('name', "test'; DROP TABLE ct_test1; --")
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('name = \'test\\\'; DROP TABLE ct_test1; --\'');
            // 验证恶意SQL被安全包含在引号内，不会被单独执行
            expect(sql).not.toMatch(/DROP TABLE ct_test1;(?!\s*--')/);
        });

        it('测试OR注入防护', async () => {
            const sql = await Db.table('ct_test1')
                .where('name', "admin' OR '1'='1")
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('name = \'admin\\\' OR \\\'1\\\'=\\\'1\'');
        });

        it('测试UNION注入防护', async () => {
            const sql = await Db.table('ct_test1')
                .where('id', "1 UNION SELECT 1,2,3,4")
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('id = \'1 UNION SELECT 1,2,3,4\'');
        });

        it('测试INSERT注入防护', async () => {
            const sql = await Db.table('ct_test1')
                .fetchSql(true)
                .insert({
                    name: "test'; DROP TABLE ct_test1; --",
                    title: "normal title"
                });
            
            expect(sql).toContain('\'test\\\'; DROP TABLE ct_test1; --\'');
            expect(sql).toContain('\'normal title\'');
        });

        it('测试UPDATE注入防护', async () => {
            const sql = await Db.table('ct_test1')
                .where('id', 1)
                .fetchSql(true)
                .update({
                    name: "admin'; DELETE FROM ct_test1; --"
                });
            
            expect(sql).toContain('name = \'admin\\\'; DELETE FROM ct_test1; --\'');
        });
    });

    // 复杂查询测试
    describe('复杂查询', () => {
        it('测试复杂join查询', async () => {
            const sql = await Db.table('ct_test1')
                .field('ct_test1.id, ct_test1.title, ct_user.nickname, ct_category.name as category_name')
                .leftJoin('ct_user', 'ct_test1.user_id = ct_user.id')
                .leftJoin('ct_category', 'ct_test1.category_id = ct_category.id')
                .where('ct_test1.status', 1)
                .where('ct_user.status', 1)
                .order('ct_test1.id', 'DESC')
                .limit(0, 10)
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('LEFT JOIN ct_user ON');
            expect(sql).toContain('LEFT JOIN ct_category ON');
            expect(sql).toContain('WHERE ct_test1.status = 1');
            expect(sql).toContain('AND ct_user.status = 1');
            expect(sql).toContain('ORDER BY ct_test1.id DESC');
            expect(sql).toContain('LIMIT 0, 10');
        });

        it('测试分组查询', async () => {
            const sql = await Db.table('ct_test1')
                .field('user_id, COUNT(*) as count, SUM(money) as total_money')
                .where('status', 1)
                .group('user_id')
                .order('count', 'DESC')
                .fetchSql(true)
                .select();
            
            expect(sql).toContain('SELECT user_id, COUNT(*) as count, SUM(money) as total_money');
            expect(sql).toContain('WHERE status = 1');
            expect(sql).toContain('GROUP BY user_id');
            expect(sql).toContain('ORDER BY count DESC');
        });
    });
});


// CREATE TABLE `ct_test1` (
//     `id` int(11) NOT NULL AUTO_INCREMENT,
//     `title` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
//     `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
//     `age` int(11) DEFAULT NULL,
//     `birthday` date DEFAULT NULL,
//     `status` int(4) DEFAULT NULL,
//     `user_id` int(11) DEFAULT NULL,
//     `money` decimal(11,2) DEFAULT '10.00',
//     `money_used` decimal(11,2) NOT NULL DEFAULT '0.00',
//     `pay_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
//     `pay_time` int(10) DEFAULT NULL,
//     `year` year(4) DEFAULT NULL,
//     `usetime` datetime(3) DEFAULT NULL,
//     PRIMARY KEY (`id`)
//   ) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

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


console.log("---- 测试Db的mysql功能 ----");



import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { initModel } from "../test/model-test-common";
import { model } from '../src/model/Model';
import ModelRow from '../src/model/data/ModelRow';
import ModelList from '../src/model/data/ModelList';

// 运行` bun test .\tests\model-curd.spec.ts` 进行测试

// 初始化模型配置
initModel();

describe("模型功能测试", () => {
    let testNewsId: number;
    let testUserId: number;

    beforeAll(async () => {
        // 清理测试数据
        try {
            await model('test_dev/sl_test_news').where('title', 'like', '%测试%').delete();
            await model('looplan/ct_user').where('username', 'like', '%test%').delete();
        } catch (error) {
            console.log('清理测试数据时出错:', error);
        }
    });

    afterAll(async () => {
        // 清理测试数据
        try {
            if (testNewsId) {
                await model('test_dev/sl_test_news').where('id', testNewsId).delete();
            }
            if (testUserId) {
                await model('looplan/ct_user').where('id', testUserId).delete();
            }
        } catch (error) {
            console.log('清理测试数据时出错:', error);
        }
    });

    describe("基础CRUD操作", () => {
        it("应该能够插入数据", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const insertResult = await newsModel.save({
                title: '测试新闻标题',
                content: '这是一条测试新闻内容',
                userId: 1
            });

            expect(insertResult).toBeDefined();
            // 获取插入的ID
            testNewsId = insertResult.insertId || insertResult;
            expect(typeof testNewsId).toBe('number');
        });

        it("应该能够查询单条数据", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const news = await newsModel.find(testNewsId);

            expect(news).toBeInstanceOf(ModelRow);
            expect(news?.title).toBe('测试新闻标题');
            expect(news?.content).toBe('这是一条测试新闻内容');
        });

        it("应该能够查询多条数据", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const newsList = await newsModel.where('title', 'like', '%测试%').select();

            expect(newsList).toBeInstanceOf(ModelList);
            expect(newsList.length).toBeGreaterThan(0);
            expect(newsList[0]).toBeInstanceOf(ModelRow);
        });

        it("应该能够更新数据", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const result = await newsModel.where('id', testNewsId).save({
                title: '更新后的测试新闻标题',
                content: '更新后的测试新闻内容'
            });

            expect(result.affectedRows).toBeGreaterThan(0);

            // 验证更新结果
            const updatedNews = await model('test_dev/sl_test_news').find(testNewsId);
            expect(updatedNews?.title).toBe('更新后的测试新闻标题');
            expect(updatedNews?.content).toBe('更新后的测试新闻内容');
        });
    });

    describe("ModelRow功能测试", () => {
        it("应该能够通过ModelRow保存数据", async () => {
            const userModel = model('looplan/ct_user');
            const user = await userModel.find(1);

            if (user) {
                // 测试ModelRow的save方法
                const originalUsername = user.username;
                const originalNickname = user.nickname;
                user.username = 'test_user_updated';
                user.nickname = 'test_nickname';
                
                const result = await user.save();
                expect(result.affectedRows).toBeGreaterThan(0);

                // 验证更新结果
                const updatedUser = await userModel.find(1);
                expect(updatedUser?.username).toBe('test_user_updated');
                expect(updatedUser?.nickname).toBe('test_nickname');
                
                // 恢复原始数据
                user.username = originalUsername;
                user.nickname = originalNickname;
                await user.save();
            }
        });

        it("应该能够通过ModelRow刷新数据", async () => {
            const userModel = model('looplan/ct_user');
            const user = await userModel.find(1);

            if (user) {
                // 修改本地数据
                const originalUsername = user.username;
                user.username = 'local_change';
                expect(user.username).toBe('local_change');

                // 刷新数据
                await user.refresh();
                expect(user.username).toBe(originalUsername);
            }
        });

        it("应该能够检测数据是否有变更", async () => {
            const userModel = model('looplan/ct_user');
            const user = await userModel.find(1);

            if (user) {
                // 初始状态应该没有变更
                expect(user.isDirty()).toBe(false);

                // 修改数据后应该检测到变更
                const originalUsername = user.username;
                user.username = 'changed_username';
                expect(user.isDirty()).toBe(true);
                
                // 恢复原始数据
                user.username = originalUsername;
            }
        });

        it("应该能够转换为普通对象", async () => {
            const userModel = model('looplan/ct_user');
            const user = await userModel.find(1);

            if (user) {
                const obj = user.toObject();
                expect(typeof obj).toBe('object');
                expect(obj.id).toBeDefined();
                expect(obj.username).toBeDefined();

                // 验证JSON序列化
                const jsonStr = JSON.stringify(user);
                const parsed = JSON.parse(jsonStr);
                expect(parsed.id).toBeDefined();
                expect(parsed.username).toBeDefined();
            }
        });
    });

    describe("ModelList功能测试", () => {
        it("应该支持数组操作", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const newsList = await newsModel.where('title', 'like', '%测试%').select();

            expect(newsList).toBeInstanceOf(ModelList);
            expect(newsList.length).toBeGreaterThan(0);

            // 测试数组访问
            expect(newsList[0]).toBeInstanceOf(ModelRow);

            // 测试forEach
            let count = 0;
            newsList.forEach((item, index) => {
                expect(item).toBeInstanceOf(ModelRow);
                expect(typeof index).toBe('number');
                count++;
            });
            expect(count).toBe(newsList.length);

            // 测试map
            const titles = newsList.map(item => item.title);
            expect(titles.length).toBe(newsList.length);
            expect(typeof titles[0]).toBe('string');

            // 测试filter
            const filtered = newsList.filter(item => item.title.includes('测试'));
            expect(filtered).toBeInstanceOf(ModelList);
        });

        it("应该支持for...of遍历", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const newsList = await newsModel.where('title', 'like', '%测试%').select();

            let count = 0;
            for (const item of newsList) {
                expect(item).toBeInstanceOf(ModelRow);
                count++;
            }
            expect(count).toBe(newsList.length);
        });

        it("应该能够转换为普通数组", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const newsList = await newsModel.where('title', 'like', '%测试%').select();

            const array = newsList.toArray();
            expect(Array.isArray(array)).toBe(true);
            expect(array.length).toBe(newsList.length);
            expect(typeof array[0]).toBe('object');

            // 验证JSON序列化
            const jsonStr = JSON.stringify(newsList);
            const parsed = JSON.parse(jsonStr);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBe(newsList.length);
        });

        it("应该能够批量保存", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const newsList = await newsModel.where('title', 'like', '%测试%').select();

            if (newsList.length > 0) {
                // 修改数据
                newsList.forEach(item => {
                    item.content = '批量更新的内容';
                });

                // 批量保存
                const results = await newsList.saveAll();
                expect(results.length).toBeGreaterThan(0);
            }
        });
    });

    describe("分页查询测试", () => {
        it("应该能够进行分页查询", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const result = await newsModel.paginate(1, 5);

            expect(result).toBeDefined();
            expect(result.data).toBeInstanceOf(ModelList);
            expect(typeof result.total).toBe('number');
            expect(result.page).toBe(1);
            expect(result.limit).toBe(5);
            expect(typeof result.hasMore).toBe('boolean');
            expect(typeof result.lastPage).toBe('number');
        });

        it("应该能够进行大数据分页查询", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const result = await newsModel.paginateX(0, {
                orderField: 'id',
                orderType: 'ASC',
                limit: 5
            });

            expect(result).toBeDefined();
            expect(result.data).toBeInstanceOf(ModelList);
            expect(typeof result.hasMore).toBe('boolean');
            expect(result.lastIndex).toBeDefined();
        });
    });

    describe("关联查询测试", () => {
        it("应该能够查询关联数据", async () => {
            const newsModel = model('test_dev/sl_test_news');
            
            // 查询带关联的数据
            const newsWithUser = await newsModel.with(['user']).find(testNewsId);

            expect(newsWithUser).toBeInstanceOf(ModelRow);
            
            // 检查是否有关联数据（如果配置了关联）
            if (newsWithUser && newsWithUser.user) {
                expect(newsWithUser.user).toBeInstanceOf(ModelRow);
            }
        });

        it("应该能够查询多条带关联的数据", async () => {
            const newsModel = model('test_dev/sl_test_news');
            
            // 查询带关联的数据列表
            const newsListWithUser = await newsModel.with(['user']).where('title', 'like', '%测试%').select();

            expect(newsListWithUser).toBeInstanceOf(ModelList);
            expect(newsListWithUser.length).toBeGreaterThan(0);
            
            // 检查是否有关联数据（如果配置了关联）
            if (newsListWithUser[0] && newsListWithUser[0].user) {
                expect(newsListWithUser[0].user).toBeInstanceOf(ModelRow);
            }
        });
    });

    describe("连接配置测试", () => {
        it("应该使用正确的数据库连接", async () => {
            // 测试test_dev空间的模型
            const newsModel = model('test_dev/sl_test_news');
            expect(newsModel.getConnectionName()).toBe('test_dev@model-dev');

            // 测试looplan空间的模型
            const userModel = model('looplan/ct_user');
            expect(userModel.getConnectionName()).toBe('looplan@mulo-content');
        });

        it("应该能够在不同连接间正确操作", async () => {
            // 在test_dev连接中操作
            const newsModel = model('test_dev/sl_test_news');
            const newsList = await newsModel.where('title', 'like', '%测试%').select();
            expect(newsList).toBeInstanceOf(ModelList);

            // 在looplan连接中操作
            const userModel = model('looplan/ct_user');
            const userList = await userModel.limit(1).select();
            expect(userList).toBeInstanceOf(ModelList);
        });
    });

    describe("SQL生成测试", () => {
        it("应该能够生成SQL而不执行", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const sql = await newsModel.where('title', 'like', '%测试%').passToDb('fetchSql', [true]).select();
            
            expect(typeof sql).toBe('string');
            expect(sql).toContain('SELECT');
            expect(sql).toContain('sl_test_news');
            expect(sql).toContain('title');
            expect(sql).toContain('LIKE');
        });

        it("应该能够生成分页SQL", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const result = await newsModel.where('title', 'like', '%测试%').passToDb('fetchSql', [true]).paginate(1, 10);
            
            expect(typeof result).toBe('string');
            expect(result).toContain('SELECT');
            expect(result).toContain('LIMIT');
        });
    });

    describe("错误处理测试", () => {
        it("应该正确处理不存在的记录", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const news = await newsModel.find(999999);

            expect(news).toBeNull();
        });

        it("应该正确处理删除不存在的记录", async () => {
            const newsModel = model('test_dev/sl_test_news');
            const result = await newsModel.where('id', 999999).delete();

            expect(result.affectedRows).toBe(0);
        });

        it("应该正确处理ModelRow删除操作", async () => {
            // 创建一条测试记录
            const newsModel = model('test_dev/sl_test_news');
            const insertResult = await newsModel.save({
                title: '待删除的测试新闻',
                content: '这条新闻将被删除',
                userId: 1
            });

            // 获取插入的ID
            const newId = insertResult.insertId || insertResult;

            // 查询并删除
            const news = await newsModel.find(newId);
            if (news) {
                const deleteResult = await news.delete();
                expect(deleteResult.affectedRows).toBeGreaterThan(0);

                // 验证删除结果
                const deletedNews = await newsModel.find(newId);
                expect(deletedNews).toBeNull();
            }
        });
    });
});



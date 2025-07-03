import { initModel } from "./model-test-common";
import { model } from '../src/model/Model';

initModel();

console.log('🚀 演示模型的API返回效果\n');

async function demoApiResponse() {
    try {
        // 模拟API响应：获取单个用户
        console.log('📡 模拟API响应：GET /users/1');
        const userModel = model('ct_test1');
        const user = await userModel.find(1);
        
        const singleUserResponse = {
            code: 200,
            message: '获取用户成功',
            data: {
                user: user
            }
        };
        
        console.log('单用户API响应:');
        console.log(JSON.stringify(singleUserResponse, null, 2));
        console.log('\n' + '─'.repeat(80) + '\n');
        
        // 模拟API响应：获取用户列表
        console.log('📡 模拟API响应：GET /users');
        const usersModel = model('ct_test1');
        const users = await usersModel.limit(3).select();
        
        const usersListResponse = {
            code: 200,
            message: '获取用户列表成功',
            data: {
                users: users,
                total: users.length,
                pagination: {
                    page: 1,
                    page_size: 3,
                    has_more: false
                }
            }
        };
        
        console.log('用户列表API响应:');
        console.log(JSON.stringify(usersListResponse, null, 2));
        console.log('\n' + '─'.repeat(80) + '\n');
        
        // 模拟API响应：filter查询
        console.log('📡 模拟API响应：GET /users/filter');
        const filterModel = model('ct_test1');
        const filteredUsers = await filterModel.filter([
            {
                id: ['in', [1, 2, 4]],
                status: 1
            }
        ]).select();
        
        const filterResponse = {
            code: 200,
            message: '筛选查询成功',
            data: {
                users: filteredUsers,
                total: filteredUsers.length,
                filters: {
                    id: [1, 2, 4],
                    status: 1
                }
            }
        };
        
        console.log('筛选查询API响应:');
        console.log(JSON.stringify(filterResponse, null, 2));
        console.log('\n' + '─'.repeat(80) + '\n');
        
        // 演示模型操作后的响应
        console.log('📡 模拟API响应：PUT /users/1');
        if (user) {
            user.name = 'API测试用户';
            user.age = 30;
            
            const updateResponse = {
                code: 200,
                message: '更新用户成功',
                data: {
                    user: user,
                    updated_fields: ['name', 'age'],
                    is_dirty: user.isDirty()
                }
            };
            
            console.log('更新用户API响应:');
            console.log(JSON.stringify(updateResponse, null, 2));
        }
        
        console.log('\n🎉 演示完成！');
        console.log('\n💡 关键优势:');
        console.log('  ✅ JSON序列化只包含数据字段，无内部属性');
        console.log('  ✅ ModelList返回标准数组格式');
        console.log('  ✅ ModelRow返回标准对象格式');
        console.log('  ✅ 完全适合API响应返回');
        console.log('  ✅ 保留所有ORM功能（save, delete, refresh等）');
        
    } catch (error) {
        console.error('❌ 演示失败:', error);
    }
}

demoApiResponse(); 
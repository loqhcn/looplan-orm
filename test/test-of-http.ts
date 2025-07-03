import { initModel } from "./model-test-common";
import { model } from '../src/model/Model';

// Bun类型定义
declare const Bun: {
    serve(options: {
        port: number;
        fetch: (request: Request) => Promise<Response> | Response;
    }): { port: number };
};

initModel();

// 创建HTTP服务器
const server = Bun.serve({
    port: 3000,
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // 设置CORS头
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // 处理OPTIONS请求
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers });
        }

        try {
            // 路由处理
            switch (path) {
                case '/':
                    return new Response(JSON.stringify({
                        message: '模型测试API服务器',
                        endpoints: [
                            'GET /users - 获取所有用户',
                            'GET /users/{id} - 获取单个用户',
                            'GET /users/filter - 使用filter查询用户',
                            'GET /users/paginate - 分页查询用户',
                            'POST /users - 创建用户',
                            'PUT /users/{id} - 更新用户',
                            'DELETE /users/{id} - 删除用户'
                        ]
                    }, null, 2), { headers });

                case '/users':
                    if (request.method === 'GET') {
                        return await handleGetUsers(request);
                    } else if (request.method === 'POST') {
                        return await handleCreateUser(request);
                    }
                    break;

                case '/users/filter':
                    if (request.method === 'GET') {
                        return await handleFilterUsers(request);
                    }
                    break;

                case '/users/paginate':
                    if (request.method === 'GET') {
                        return await handlePaginateUsers(request);
                    }
                    break;

                default:
                    // 处理动态路由 /users/{id}
                    const userIdMatch = path.match(/^\/users\/(\d+)$/);
                    if (userIdMatch) {
                        const userId = parseInt(userIdMatch[1]);
                        if (request.method === 'GET') {
                            return await handleGetUser(userId);
                        } else if (request.method === 'PUT') {
                            return await handleUpdateUser(userId, request);
                        } else if (request.method === 'DELETE') {
                            return await handleDeleteUser(userId);
                        }
                    }
                    break;
            }

            // 404处理
            return new Response(JSON.stringify({
                code: 404,
                message: '接口不存在',
                path: path
            }), { 
                status: 404, 
                headers 
            });

        } catch (error: any) {
            console.error('API错误:', error);
            return new Response(JSON.stringify({
                code: 500,
                message: '服务器内部错误',
                error: error.message
            }), { 
                status: 500, 
                headers 
            });
        }
    },
});

// 获取所有用户
async function handleGetUsers(request: Request) {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const userModel = model('ct_test1');
    const users = await userModel.limit(limit).select();
    
    console.log('handleGetUsers');
    return Response.json({
        code: 200,
        message: '获取用户列表成功',
        data: {
            users: users,
            total: users.length,
            limit: limit
        }
    });
}

// 获取单个用户
async function handleGetUser(userId: number) {
    const userModel = model('ct_test1');
    const user = await userModel.find(userId);
    
    if (!user) {
        return new Response(JSON.stringify({
            code: 404,
            message: '用户不存在',
            data: null
        }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response(JSON.stringify({
        code: 200,
        message: '获取用户成功',
        data: {
            user: user
        }
    }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// 使用filter查询用户
async function handleFilterUsers(request: Request) {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const ids = url.searchParams.get('ids');
    const minMoney = url.searchParams.get('min_money');
    const maxMoney = url.searchParams.get('max_money');
    
    const userModel = model('ct_test1');
    
    // 构建filter条件
    const filters = [];
    
    if (status || ids || (minMoney && maxMoney)) {
        const condition: any = {};
        
        if (status) {
            condition.status = parseInt(status);
        }
        
        if (ids) {
            const idArray = ids.split(',').map(id => parseInt(id.trim()));
            condition.id = ['in', idArray];
        }
        
        if (minMoney && maxMoney) {
            condition.money = ['between', [parseFloat(minMoney), parseFloat(maxMoney)]];
        }
        
        filters.push(condition);
    }
    
    let query = userModel;
    if (filters.length > 0) {
        query = query.filter(filters);
    }
    
    const users = await query.select();
    
    return new Response(JSON.stringify({
        code: 200,
        message: '筛选用户成功',
        data: {
            users: users,
            total: users.length,
            filters: {
                status,
                ids,
                min_money: minMoney,
                max_money: maxMoney
            }
        }
    }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// 分页查询用户
async function handlePaginateUsers(request: Request) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '5');
    const offset = (page - 1) * pageSize;
    
    const userModel = model('ct_test1');
    const users = await userModel.limit(offset, pageSize).select();
    
    return new Response(JSON.stringify({
        code: 200,
        message: '分页查询成功',
        data: {
            users: users,
            pagination: {
                page: page,
                page_size: pageSize,
                total: users.length,
                has_more: users.length === pageSize
            }
        }
    }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// 创建用户
async function handleCreateUser(request: Request) {
    const body = await request.json();
    
    const userModel = model('ct_test1');
    const user = await userModel.find(); // 创建新的空ModelRow
    
    // 设置用户数据
    if (user) {
        Object.assign(user, body);
        const result = await user.save();
        
        return new Response(JSON.stringify({
            code: 201,
            message: '创建用户成功',
            data: {
                user: user,
                insert_id: result
            }
        }, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        // 如果find返回null，直接使用Db插入
        const result = await model('ct_test1').insert(body);
        
        return new Response(JSON.stringify({
            code: 201,
            message: '创建用户成功',
            data: {
                result: result
            }
        }, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 更新用户
async function handleUpdateUser(userId: number, request: Request) {
    const body = await request.json();
    
    const userModel = model('ct_test1');
    const user = await userModel.find(userId);
    
    if (!user) {
        return new Response(JSON.stringify({
            code: 404,
            message: '用户不存在',
            data: null
        }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // 更新用户数据
    Object.assign(user, body);
    const result = await user.save();
    
    return new Response(JSON.stringify({
        code: 200,
        message: '更新用户成功',
        data: {
            user: user,
            affected_rows: result.affectedRows || 0
        }
    }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// 删除用户
async function handleDeleteUser(userId: number) {
    const userModel = model('ct_test1');
    const user = await userModel.find(userId);
    
    if (!user) {
        return new Response(JSON.stringify({
            code: 404,
            message: '用户不存在',
            data: null
        }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const result = await user.delete();
    
    return new Response(JSON.stringify({
        code: 200,
        message: '删除用户成功',
        data: {
            affected_rows: result.affectedRows || 0
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

console.log(`🚀 HTTP服务器已启动: http://localhost:${server.port}`);
console.log('📡 可用的API端点:');
console.log('  GET  / - API文档');
console.log('  GET  /users - 获取用户列表');
console.log('  GET  /users/1 - 获取指定用户');
console.log('  GET  /users/filter?status=1&ids=1,2,3 - 筛选用户');
console.log('  GET  /users/paginate?page=1&page_size=5 - 分页查询');
console.log('  POST /users - 创建用户');
console.log('  PUT  /users/1 - 更新用户');
console.log('  DELETE /users/1 - 删除用户');
console.log('');
console.log('💡 测试示例:');
console.log('  curl http://localhost:3000/users');
console.log('  curl http://localhost:3000/users/1'); 
console.log('  curl "http://localhost:3000/users/filter?status=1&ids=1,2,4"');
console.log('  curl "http://localhost:3000/users/paginate?page=1&page_size=2"');

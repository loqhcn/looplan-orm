// API测试脚本
async function testApi() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('🧪 开始测试API...\n');
    
    try {
        // 1. 测试根路径
        console.log('1️⃣ 测试根路径');
        const rootResponse = await fetch(`${baseUrl}/`);
        const rootData = await rootResponse.json();
        console.log('✅ 根路径响应:', JSON.stringify(rootData, null, 2));
        console.log('');
        
        // 2. 测试获取用户列表
        console.log('2️⃣ 测试获取用户列表');
        const usersResponse = await fetch(`${baseUrl}/users?limit=3`);
        const usersData = await usersResponse.json();
        console.log('✅ 用户列表响应:', JSON.stringify(usersData, null, 2));
        console.log('');
        
        // 3. 测试获取单个用户
        console.log('3️⃣ 测试获取单个用户');
        const userResponse = await fetch(`${baseUrl}/users/1`);
        const userData = await userResponse.json();
        console.log('✅ 单个用户响应:', JSON.stringify(userData, null, 2));
        console.log('');
        
        // 4. 测试filter查询
        console.log('4️⃣ 测试filter查询');
        const filterResponse = await fetch(`${baseUrl}/users/filter?status=1&ids=1,2,4`);
        const filterData = await filterResponse.json();
        console.log('✅ filter查询响应:', JSON.stringify(filterData, null, 2));
        console.log('');
        
        // 5. 测试分页查询
        console.log('5️⃣ 测试分页查询');
        const paginateResponse = await fetch(`${baseUrl}/users/paginate?page=1&page_size=2`);
        const paginateData = await paginateResponse.json();
        console.log('✅ 分页查询响应:', JSON.stringify(paginateData, null, 2));
        console.log('');
        
        // 6. 测试更新用户
        console.log('6️⃣ 测试更新用户');
        const updateData = {
            name: '测试更新',
            age: 25
        };
        const updateResponse = await fetch(`${baseUrl}/users/1`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        const updateResult = await updateResponse.json();
        console.log('✅ 更新用户响应:', JSON.stringify(updateResult, null, 2));
        console.log('');
        
        // 7. 验证更新结果
        console.log('7️⃣ 验证更新结果');
        const verifyResponse = await fetch(`${baseUrl}/users/1`);
        const verifyData = await verifyResponse.json();
        console.log('✅ 验证更新后的用户:', JSON.stringify(verifyData, null, 2));
        
        console.log('\n🎉 所有API测试完成！');
        
    } catch (error) {
        console.error('❌ API测试失败:', error);
    }
}

// 添加延迟确保服务器启动
setTimeout(() => {
    testApi();
}, 1000); 
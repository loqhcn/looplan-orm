import { initModel } from "./model-test-common";
import { model } from '../src/model/Model';
import { databaseConfig } from '../src/config';

// 初始化模型配置
initModel();

console.log('测试模型连接名生成');

// 查看所有连接配置
console.log('\n=== 数据库连接配置 ===');
console.log('所有连接:', Object.keys(databaseConfig.getConfig().connections || {}));

// 测试 test_dev/sl_test_news
console.log('\n=== 测试 test_dev/sl_test_news ===');
try {
    const testModel = model('test_dev/sl_test_news');

    const connectionName = testModel.getConnectionName();
    console.log('模型连接名:', connectionName);
    
    // console.log('模型创建成功');
    
    // // 尝试查询
    // console.log('\n=== 尝试查询 ===');
    const result = await testModel.find();
    // console.log('查询结果:', result);
} catch (error: any) {
    console.error('查询失败:', error.message);
}
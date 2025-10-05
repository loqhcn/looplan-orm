
import path from "path";
import { databaseConfig } from "../src";
import { modelConfig } from "../src/model/config/ModelConfig";
import { ModelTool } from "../src/model/library/ModelTool";
import { model } from '../src/model/Model';
import { setupConnectConfig } from "../src/model/library/setup";
const rootDir = path.resolve(__dirname, '../');
console.log(rootDir);

function initModel() {
    // 设置配置
    // databaseConfig.setConfig({
    //     default: 'mysql',  // 默认连接
    //     connections: {
    //         mysql: {
    //             host: 'localhost',
    //             user: 'root',
    //             password: 'root',
    //             database: 'mulo-content',
    //             prefix: 'ct_',  // 表前缀
    //         }
    //     },
    // });

    modelConfig.config('rootDir', rootDir);
    modelConfig.config('modelDir', path.join(rootDir, 'looplan-models'));
    modelConfig.config('modelDefaultSpace', 'looplan');
    modelConfig.config('modelServerMode', 'dev');
    modelConfig.config('modelServerLocalName', '');

    console.log(modelConfig.config('rootDir'));
    console.log(modelConfig.config('modelDir'));

    const setupRes =  setupConnectConfig();
    console.log(setupRes.logs);

    const modelTool = new ModelTool();
    modelConfig.config('modelTool', modelTool); //注入modelTool,用于获取模型
}
export { initModel };
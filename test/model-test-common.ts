
import path from "path";
import { databaseConfig } from "../src";
import { modelConfig } from "../src/model/config/ModelConfig";
import { ModelTool } from "../src/model/library/ModelTool";
import { model } from '../src/model/Model';
const rootDir = path.resolve(__dirname, '../');
console.log(rootDir);

function initModel() {

    // 设置配置
    databaseConfig.setConfig({
        default: 'mysql',  // 默认连接
        connections: {
            mysql: {
                host: 'localhost',
                user: 'root',
                password: 'root',
                database: 'mulo-content',
                prefix: 'ct_',  // 表前缀
            }
        },
    });

    modelConfig.config('rootDir', rootDir);
    console.log(modelConfig.config('rootDir'));
    const modelTool = new ModelTool();
    modelConfig.config('modelTool', modelTool); //注入modelTool,用于获取模型

}
export { initModel};
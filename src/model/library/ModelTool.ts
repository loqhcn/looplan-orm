import { modelConfig } from '../config/ModelConfig';
import path from 'path';
import fs from 'fs';
import { DbException } from '../../exception/DbException';

/**
 * 模型工具类
 * @todo 模型加载
 */
class ModelTool {
    modelPath: string;
    constructor() {
        this.modelPath = modelConfig.config('modelDir');
    }

    getModel(modelName: string) {
        const { space, model } = this.parseModelName(modelName);
        const modelPath = path.join(this.modelPath, space, 'models', `${model}.json`);
        console.log(`读取模型${modelName} 路径:`, modelPath);
        if (!fs.existsSync(modelPath)) {
            throw new DbException(`模型文件 ${modelName} 不存在`);
        }
        return JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
    }

    parseModelName(modelName: string) {
        // 模型名称可以是  `空间/模型` | `模型名`
        const modelParts = modelName.split('/');
        let space = modelConfig.config('modelDefaultSpace');
        let model = modelName;
        if (modelParts.length === 2) {
            space = modelParts[0];
            model = modelParts[1];
        }
        return {
            space,
            model,
        }
    }

}

export {
    ModelTool
}
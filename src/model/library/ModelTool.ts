import { modelConfig } from '../config/ModelConfig';
import { join } from 'path';
import fs from 'fs';

class ModelTool {
    modelPath: string;
    constructor() {
        this.modelPath = join(modelConfig.config('rootDir'), 'app-model', 'models');
    }

    getModel(modelName: string) {
        const modelPath = join(this.modelPath, `${modelName}.json`);
        if (!fs.existsSync(modelPath)) {
            throw new Error(`模型文件 ${modelName} 不存在`);
        }
        return JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
    }
}

export {
    ModelTool
}
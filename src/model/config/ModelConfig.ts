class ModelConfig {
    configs: {
        /**
         * 根目录
         */
        rootDir: string,
        /**
         * 模型目录
         */
        modelDir: string,
        [key: string]: any
    }

    constructor(configs: any = null) {
        this.configs = Object.assign({
            rootDir: '',
            modelDir: 'looplan-models',
        }, configs);
    }

    /**
     * 设置|获取配置
     * @param name 配置名
     * @param value 配置值
     * @returns 配置值
     */
    config(name: string, value?: any) {
        if (value === undefined) {
            return this.configs[name];
        }
        this.configs[name] = value;
        return this;
    }
}

const modelConfig = new ModelConfig();

export {
    modelConfig,
    ModelConfig
}
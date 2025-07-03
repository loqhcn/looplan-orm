class ModelConfig {
    configs: {
        rootDir: string,
        [key: string]: any
    }
    constructor(configs: any = null) {
        this.configs = Object.assign({
            rootDir: '',
        }, configs);
    }

    /**
     * 设置|获取配置
     * @param name 配置名
     * @param value 配置值
     * @returns 
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
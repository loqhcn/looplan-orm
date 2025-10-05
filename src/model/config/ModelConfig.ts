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
        /**
         * 默认空间
         */
        modelDefaultSpace: string,
        /**
         * 服务器模式
         * - dev: 本地模式
         * - prod: 线上模式
         */
        modelServerMode: string,
        /**
         * 服务器本地名称
         * @todo 用于连接线上数据库时判断是否使用内网地址
         */
        modelServerLocalName: string,

        [key: string]: any
    }

    constructor(configs: any = null) {
        this.configs = Object.assign({
            rootDir: '',
            modelDir: 'looplan-models',
            modelDefaultSpace: '',
            modelServerMode: 'dev',
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
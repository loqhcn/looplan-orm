import ModelRow from './ModelRow';

class ModelList {
    private items: ModelRow[] = [];
    private tableName: string;
    private primaryKey: string = 'id';
    [key: number]: ModelRow; // 允许数字索引访问

    constructor(tableName: string, dataList: Record<string, any>[] = [], primaryKey: string = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        
        // 将原始数据转换为ModelRow实例
        this.items = dataList.map(data => new ModelRow(tableName, data, primaryKey));
        
        // 设置数字索引
        this.items.forEach((item, index) => {
            this[index] = item;
        });
        
        // 设置length属性
        Object.defineProperty(this, 'length', {
            get: () => this.items.length,
            enumerable: false,
            configurable: false
        });

        // 使用Proxy包装，优化JSON序列化和数组行为
        return new Proxy(this, {
            get(target: ModelList, prop: string | symbol) {
                // 如果是数字索引
                if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                    const index = parseInt(prop);
                    return target.items[index];
                }
                
                // 如果是length属性
                if (prop === 'length') {
                    return target.items.length;
                }
                
                // Symbol.iterator 支持 for...of
                if (prop === Symbol.iterator) {
                    return function* () {
                        for (const item of target.items) {
                            yield item;
                        }
                    };
                }
                
                // 其他方法和属性
                return target[prop as keyof ModelList];
            },

            set(target: ModelList, prop: string | symbol, value: any) {
                // 如果是数字索引
                if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                    const index = parseInt(prop);
                    target.items[index] = value;
                    target[index] = value;
                    return true;
                }
                
                // 其他属性
                (target as any)[prop] = value;
                return true;
            },

            ownKeys(target: ModelList) {
                // 返回数字索引键
                return target.items.map((_, index) => index.toString());
            },

            getOwnPropertyDescriptor(target: ModelList, prop: string | symbol) {
                if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                    const index = parseInt(prop);
                    if (index < target.items.length) {
                        return {
                            enumerable: true,
                            configurable: true,
                            value: target.items[index]
                        };
                    }
                }
                return undefined;
            }
        });
    }

    /**
     * 获取指定索引的项
     */
    get(index: number): ModelRow | undefined {
        return this.items[index];
    }

    /**
     * 设置指定索引的项
     */
    set(index: number, value: ModelRow): void {
        this.items[index] = value;
        this[index] = value;
    }

    /**
     * 添加新项
     */
    push(item: ModelRow | Record<string, any>): number {
        const modelRow = item instanceof ModelRow ? item : new ModelRow(this.tableName, item, this.primaryKey);
        this.items.push(modelRow);
        this[this.items.length - 1] = modelRow;
        return this.items.length;
    }

    /**
     * 移除最后一项
     */
    pop(): ModelRow | undefined {
        const item = this.items.pop();
        if (item) {
            delete this[this.items.length];
        }
        return item;
    }

    /**
     * 遍历每一项
     */
    forEach(callback: (item: ModelRow, index: number, list: ModelList) => void): void {
        this.items.forEach((item, index) => {
            callback(item, index, this);
        });
    }

    /**
     * 映射每一项
     */
    map<T>(callback: (item: ModelRow, index: number, list: ModelList) => T): T[] {
        return this.items.map((item, index) => callback(item, index, this));
    }

    /**
     * 过滤项目
     */
    filter(callback: (item: ModelRow, index: number, list: ModelList) => boolean): ModelList {
        const filteredItems = this.items.filter((item, index) => callback(item, index, this));
        const dataList = filteredItems.map(item => item.toObject());
        return new ModelList(this.tableName, dataList, this.primaryKey);
    }

    /**
     * 查找项目
     */
    find(callback: (item: ModelRow, index: number, list: ModelList) => boolean): ModelRow | undefined {
        return this.items.find((item, index) => callback(item, index, this));
    }

    /**
     * 查找项目索引
     */
    findIndex(callback: (item: ModelRow, index: number, list: ModelList) => boolean): number {
        return this.items.findIndex((item, index) => callback(item, index, this));
    }

    /**
     * 检查是否包含某项
     */
    includes(searchItem: ModelRow): boolean {
        return this.items.includes(searchItem);
    }

    /**
     * 获取某项的索引
     */
    indexOf(searchItem: ModelRow): number {
        return this.items.indexOf(searchItem);
    }

    /**
     * 数组切片
     */
    slice(start?: number, end?: number): ModelList {
        const slicedItems = this.items.slice(start, end);
        const dataList = slicedItems.map(item => item.toObject());
        return new ModelList(this.tableName, dataList, this.primaryKey);
    }

    /**
     * 转换为普通数组
     */
    toArray(): Record<string, any>[] {
        return this.items.map(item => item.toObject());
    }

    /**
     * 转换为ModelRow数组
     */
    toModelRowArray(): ModelRow[] {
        return [...this.items];
    }

    /**
     * 获取第一项
     */
    first(): ModelRow | undefined {
        return this.items[0];
    }

    /**
     * 获取最后一项
     */
    last(): ModelRow | undefined {
        return this.items[this.items.length - 1];
    }

    /**
     * 检查是否为空
     */
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    /**
     * 获取长度
     */
    get length(): number {
        return this.items.length;
    }

    /**
     * 批量保存所有项
     */
    async saveAll(): Promise<any[]> {
        const results = [];
        for (const item of this.items) {
            if (item.isDirty()) {
                const result = await item.save();
                results.push(result);
            }
        }
        return results;
    }

    /**
     * 清空所有项
     */
    clear(): void {
        this.items.forEach((_, index) => {
            delete this[index];
        });
        this.items = [];
    }

    /**
     * 支持for...of遍历
     */
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index < this.items.length) {
                    return { value: this.items[index++], done: false };
                } else {
                    return { done: true };
                }
            }
        };
    }

    /**
     * 自定义JSON序列化，返回数组格式
     */
    toJSON(): Record<string, any>[] {
        return this.toArray();
    }
}

export default ModelList;

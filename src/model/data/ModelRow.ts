import Db from '../../Db';

class ModelRow {
    private tableName: string;
    private originalData: Record<string, any> = {};
    private modifiedData: Record<string, any> = {};
    private primaryKey: string = 'id';
    private connectionName: string = 'default'; // 添加连接名属性
    [key: string]: any; // 允许动态属性访问

    constructor(tableName: string, data: Record<string, any> = {}, primaryKey: string = 'id', connectionName: string = 'default') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.connectionName = connectionName;
        this.originalData = { ...data };

        // 将数据属性复制到当前实例
        Object.keys(data).forEach(key => {
            this[key] = data[key];
        });

        // 使用Proxy包装，优化JSON序列化和属性访问
        return new Proxy(this, {
            get(target: ModelRow, prop: string | symbol) {
                // 如果是内部方法或属性，正常返回
                if (typeof prop === 'string' &&
                    ['save', 'delete', 'refresh', 'toObject', 'isDirty', 'tableName', 'originalData', 'modifiedData', 'primaryKey', 'connectionName'].includes(prop)) {
                    return target[prop];
                }

                // 对于数据属性，直接返回
                return target[prop as string];
            },

            set(target: ModelRow, prop: string | symbol, value: any) {
                if (typeof prop === 'string') {
                    target[prop] = value;
                }
                return true;
            },

            ownKeys(target: ModelRow) {
                // 只返回数据属性的键，不包含内部属性和方法
                const dataKeys = Object.keys(target).filter(key =>
                    !['tableName', 'originalData', 'modifiedData', 'primaryKey', 'connectionName'].includes(key) &&
                    typeof target[key] !== 'function'
                );
                return dataKeys;
            },

            getOwnPropertyDescriptor(target: ModelRow, prop: string | symbol) {
                if (typeof prop === 'string' &&
                    !['tableName', 'originalData', 'modifiedData', 'primaryKey', 'connectionName'].includes(prop) &&
                    typeof target[prop] !== 'function') {
                    return {
                        enumerable: true,
                        configurable: true,
                        value: target[prop]
                    };
                }
                return undefined;
            }
        });
    }

    /**
     * 保存数据到数据库
     * @param data 可选的要保存的数据，如果提供则直接保存这些数据，否则保存已修改的属性
     */
    async save(data?: Record<string, any>): Promise<any> {
        let changedFields: Record<string, any> = {};
        let hasChanges = false;

        // 如果传入了数据参数，直接使用传入的数据
        if (data && typeof data === 'object') {
            changedFields = { ...data };
            hasChanges = Object.keys(data).length > 0;

            // 同时更新当前实例的属性
            Object.keys(data).forEach(key => {
                this[key] = data[key];
            });
        } else {
            // 否则收集已修改的字段
            // 检查所有属性是否有变化
            Object.keys(this.originalData).forEach(key => {
                if (this[key] !== this.originalData[key]) {
                    changedFields[key] = this[key];
                    hasChanges = true;
                }
            });

            // 检查新增的属性
            Object.keys(this).forEach(key => {
                if (!['tableName', 'originalData', 'modifiedData', 'primaryKey', 'connectionName'].includes(key) &&
                    typeof this[key] !== 'function' &&
                    !(key in this.originalData)) {
                    changedFields[key] = this[key];
                    hasChanges = true;
                }
            });
        }

        if (!hasChanges) {
            return { affectedRows: 0, message: '没有数据需要保存' };
        }

        // 如果有主键值，执行更新操作
        const primaryKeyValue = this[this.primaryKey];
        if (primaryKeyValue !== undefined && primaryKeyValue !== null) {
            const result = await Db.connect(this.connectionName).table(this.tableName)
                .where(this.primaryKey, primaryKeyValue)
                .update(changedFields);

            // 更新原始数据
            Object.assign(this.originalData, changedFields);
            return result;
        } else {
            // 没有主键值，执行插入操作
            const allData: Record<string, any> = {};
            Object.keys(this).forEach(key => {
                if (!['tableName', 'originalData', 'modifiedData', 'primaryKey', 'connectionName'].includes(key) &&
                    typeof this[key] !== 'function') {
                    allData[key] = this[key];
                }
            });

            const result = await Db.connect(this.connectionName).table(this.tableName).insertGetId(allData);

            // 设置新的主键值
            this[this.primaryKey] = result;
            this.originalData = { ...allData, [this.primaryKey]: result };

            return result;
        }
    }

    /**
     * 删除当前记录
     */
    async delete(): Promise<any> {
        const primaryKeyValue = this[this.primaryKey];
        if (primaryKeyValue === undefined || primaryKeyValue === null) {
            throw new Error('无法删除：缺少主键值');
        }

        return await Db.connect(this.connectionName).table(this.tableName)
            .where(this.primaryKey, primaryKeyValue)
            .delete();
    }

    /**
     * 刷新数据（从数据库重新加载）
     */
    async refresh(): Promise<ModelRow> {
        const primaryKeyValue = this[this.primaryKey];
        if (primaryKeyValue === undefined || primaryKeyValue === null) {
            throw new Error('无法刷新：缺少主键值');
        }

        const freshData = await Db.connect(this.connectionName).table(this.tableName)
            .where(this.primaryKey, primaryKeyValue)
            .find();

        if (freshData) {
            // 清除当前数据
            Object.keys(this).forEach(key => {
                if (!['tableName', 'originalData', 'modifiedData', 'primaryKey', 'connectionName'].includes(key) &&
                    typeof this[key] !== 'function') {
                    delete this[key];
                }
            });

            // 设置新数据
            this.originalData = { ...freshData };
            Object.keys(freshData).forEach(key => {
                this[key] = freshData[key];
            });
        }

        return this;
    }

    /**
     * 转换为普通对象
     */
    toObject(): Record<string, any> {
        const result: Record<string, any> = {};
        Object.keys(this).forEach(key => {
            if (!['tableName', 'originalData', 'modifiedData', 'primaryKey'].includes(key) &&
                typeof this[key] !== 'function') {
                result[key] = this[key];
            }
        });
        return result;
    }

    toData(): Record<string, any> {
        return this.toObject();
    }

    /**
     * 检查是否有未保存的更改
     */
    isDirty(): boolean {
        return Object.keys(this.originalData).some(key => this[key] !== this.originalData[key]) ||
            Object.keys(this).some(key =>
                !['tableName', 'originalData', 'modifiedData', 'primaryKey'].includes(key) &&
                typeof this[key] !== 'function' &&
                !(key in this.originalData)
            );
    }

    /**
     * 自定义JSON序列化，只返回数据属性
     */
    toJSON(): Record<string, any> {
        return this.toObject();
    }
}

export default ModelRow;

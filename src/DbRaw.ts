class DbRaw {
    public value: string;

    constructor(value: string) {
        this.value = value;
    }

    toString(): string {
        return this.value;
    }

    // 静态方法用于检查是否为DbRaw实例
    static isRaw(value: any): value is DbRaw {
        return value instanceof DbRaw;
    }
}

export default DbRaw;

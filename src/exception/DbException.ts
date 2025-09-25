export class DbException extends Error {
    code: number;
    data: any;
    name: string = "DbException";

    constructor(message: string, code: number = 0, data: any = {}) {
        super(message);
        this.code = code;
        this.data = data;
        // 确保原型链正确
        Object.setPrototypeOf(this, DbException.prototype);
    }

    getData(): any {
        return this.data;
    }

    getCode(): number {
        return this.code;
    }

    getMessage(): string {
        return this.message;
    }
}

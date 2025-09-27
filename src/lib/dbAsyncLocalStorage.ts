import { AsyncLocalStorage } from "node:async_hooks";

const dbAsyncLocalStorage = new AsyncLocalStorage();

/**
 * 获取当前请求ID
 * @return 当前请求ID  default: 'main'
 */
function getReqId(): string {
    const context: any = dbAsyncLocalStorage.getStore();
    return context?.reqId || 'main';
}

/**
 * 执行请求
 * @param reqId 请求ID
 * @param callback 回调函数
 */
function requestRun(reqId: string, callback: (() => Promise<any>) | (() => any)): Promise<any> | any {
    return dbAsyncLocalStorage.run({ reqId }, callback);
}

export {
    dbAsyncLocalStorage,
    getReqId,
    requestRun
};
class Model {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

    passToDb(method: string, args: any[]) {
        console.log(`Db call: ${method}(${args.filter(x=>x!==undefined).join(", ")})`);
        return `Result of ${method}`;
    }
}

interface ModelProxy {
    // 用户调用的 then（不会影响 async 返回类型）
    then(...args: any[]): any;
    [key: string]: any;
}

function model(modelName: string): ModelProxy {
    const modelInstance = new Model(modelName);

    const proxy = new Proxy(modelInstance, {
        get(target: any, prop: string | symbol, receiver: any) {
            if (prop === "then") {
                return (onFulfilled?: any, onRejected?: any) => {
                    if (typeof onFulfilled === "function" || typeof onRejected === "function") {
                        // ✅ 避免死循环：用 target 而不是 Proxy
                        return Promise.resolve(target).then(onFulfilled, onRejected);
                    }
                    // ✅ 用户调用 query.then(...)
                    return target.passToDb("then", [onFulfilled, onRejected]);
                };
            }

            if (prop in target) {
                return Reflect.get(target, prop, receiver);
            }

            return (...args: any[]) => target.passToDb(prop as string, args);
        }
    });

    return proxy as ModelProxy;
}

async function buildQuery() {
    const query = model("looplan/ct_test1");
    return query;
}

(async () => {
    const query = await buildQuery();

    console.log("await 得到的:", query);

    // 用户调用 then
    const r = query.then("customArg");
    console.log("query.then 返回:", r);

    // 真正的 Promise 判定
    const r2 = await query;
    console.log("await query:", r2);
})();

import { AsyncLocalStorage } from 'async_hooks';

/**
 * 事务上下文接口
 */
interface TransactionContext {
  transactionId: string;
  connection: any;
  startTime: number;
}

/**
 * 基于AsyncLocalStorage的事务上下文管理器
 * 
 * 使用AsyncLocalStorage可以在异步调用链中自动传递事务上下文，
 * 避免每次数据库操作都需要手动传入事务ID
 */
class TransactionContextManager {
  private static instance: TransactionContextManager;
  private asyncLocalStorage: AsyncLocalStorage<TransactionContext>;

  private constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage<TransactionContext>();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): TransactionContextManager {
    if (!TransactionContextManager.instance) {
      TransactionContextManager.instance = new TransactionContextManager();
    }
    return TransactionContextManager.instance;
  }

  /**
   * 在事务上下文中运行回调函数
   * @param transactionId 事务ID
   * @param connection 数据库连接
   * @param callback 回调函数
   */
  async runInContext<T>(
    transactionId: string,
    connection: any,
    callback: () => Promise<T>
  ): Promise<T> {
    const context: TransactionContext = {
      transactionId,
      connection,
      startTime: Date.now()
    };

    return this.asyncLocalStorage.run(context, callback);
  }

  /**
   * 获取当前事务上下文
   */
  getCurrentContext(): TransactionContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * 获取当前事务ID
   */
  getCurrentTransactionId(): string | undefined {
    const context = this.getCurrentContext();
    return context?.transactionId;
  }

  /**
   * 获取当前事务连接
   */
  getCurrentConnection(): any | undefined {
    const context = this.getCurrentContext();
    return context?.connection;
  }

  /**
   * 检查是否在事务上下文中
   */
  isInTransaction(): boolean {
    return this.getCurrentContext() !== undefined;
  }

  /**
   * 获取事务运行时长（毫秒）
   */
  getTransactionDuration(): number | undefined {
    const context = this.getCurrentContext();
    if (!context) return undefined;
    return Date.now() - context.startTime;
  }
}

// 导出单例实例
export const transactionContext = TransactionContextManager.getInstance();
export type { TransactionContext };
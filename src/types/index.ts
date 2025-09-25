/**
 * 查询参数
 * 
 */
interface DbOptions {
    /**
     * 表别名
     */
    alias: string; // 表别名
    /**
     * 数据库连接名称
     */
    connectionName: string; // 数据库连接名称
    /**
     * 表名
     */
    table: string;
    /**
     * 字段
     */
    fields: string | string[];
    /**
     * 条件
     */
    where: any[];
    /**
     * 排序
     */
    orderBy: any[];
    /**
     * 分页
     */
    limitValue: number | [number, number] | null;
    /**
     * 分组
     */
    groupBy: string[];
    data: Record<string, any>;
    dataList?: Record<string, any>[];
    distinct: boolean;
    /**
     * 返回sql语句?
     * @todo 开启后查询返回sql语句
     */
    fetchSql: boolean;
    field: string | null;
    join: Array<{
        table: string;
        condition: string;
        type: string;
    }>;
    transaction: boolean;
    params: Record<string, any>;
    paramCounter: number;
}


/**
 * 分页查询结果
 */
interface PaginateResult {
    data: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    lastPage: number;
}
/**
 * 排序类型
 * ASC 升序
 * DESC 降序
 */
type OrderType = 'ASC' | 'DESC';

/**
 * 查询网关
 */
interface QueryGateway {
    action(name: string): QueryGateway;
    dest(): Promise<any>;
    startTransaction(): Promise<any>;
    commit(connection: any): Promise<void>;
    rollback(connection: any): Promise<void>;
    rawQuery(sql: string, params?: any[] | Record<string, any>): Promise<any[]>;
    rawExecute(sql: string, params?: any[] | Record<string, any>): Promise<number>;
}

/**
 * 分页查询参数
 */
interface PaginateXOptions {
    orderField: string;
    orderType: OrderType;
    limit?: number; // 可选的每页数量限制
}

export type {
    DbOptions,
    QueryGateway,
    /**
     * 排序类型
     */
    OrderType,
    // 返回结果
    PaginateResult,
    PaginateXOptions,
}
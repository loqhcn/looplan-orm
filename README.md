# Looplan ORM 数据库操作库

Looplan ORM是一个模仿ThinkPHP风格的TypeScript数据库操作库，提供简洁而强大的数据库操作API。

## 更新记录
- 2025年6月30日: 连接池能力
- 2025年7月3日: 数据模型功能持续完善中
- 2025年7月5日: sql注入防护功能

## 安装

```bash

npm install looplan-orm
# 安装依赖
npm install mysql2
```

## 配置数据库

在使用前需要先配置数据库连接信息：

```typescript
import { databaseConfig } from 'looplan-orm';

// 设置配置
databaseConfig.setConfig({
    default: 'mysql',  // 默认连接
    connections: {
        mysql: {
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'your_database',
            prefix: 'prefix_',  // 表前缀
        },
        mysql2: {
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'your_second_database',
            prefix: 'prefix_',
        },
    },
});
```

## 基本查询操作

### 查询单条数据

```typescript
import { Db } from 'looplan-orm';

// 查询单条记录
const result = await Db.table('user').where('id', 1).find();
```

### 查询多条数据

```typescript
// 查询多条记录
const results = await Db.table('user').select();

// 带条件查询
const users = await Db.table('user').where('status', 1).select();
```

### 字段与表联接

```typescript
// 指定字段查询
const result = await Db.table('user')
    .field('user.*, profile.nickname as user_nickname')
    .join('profile', 'user.id = profile.user_id')
    .select();
```

### 闭包条件查询

```typescript
// 使用闭包组织复杂条件
const results = await Db.table('user').where(($query) => {
    $query.where('id', 1).where('status', 1);
}).select();
```

## 数据增删改操作

### 添加数据

```typescript
// 插入单条数据
const insertId = await Db.table('user').insert({
    name: 'test',
    age: 18,
    status: 1
});

// 插入并返回ID
const newId = await Db.table('user').insertGetId({
    name: 'test',
    age: 18,
    status: 1
});

// 批量插入
const result = await Db.table('user').insertAll([
    { name: 'user1', age: 18, status: 1 },
    { name: 'user2', age: 19, status: 1 }
]);
```

### 更新数据

```typescript
// 更新数据
const affectedRows = await Db.table('user').where('id', 1).update({
    name: 'new name',
    age: 20
});
```

### 删除数据

```typescript
// 删除数据
const affectedRows = await Db.table('user').where('id', 1).delete();
```

## 聚合查询

```typescript
// 求和
const sum = await Db.table('user').sum('money');

// 计数
const count = await Db.table('user').count('id');

// 最大值
const max = await Db.table('user').max('age');

// 最小值
const min = await Db.table('user').min('age');
```

## 原生SQL查询

```typescript
// 查询操作
const results = await Db.query('SELECT * FROM prefix_user WHERE id = ?', [1]);

// 执行更新操作
const affected = await Db.execute('UPDATE prefix_user SET name = ? WHERE id = ?', ['new name', 1]);

// 命名参数绑定
const results = await Db.query('SELECT * FROM prefix_user WHERE id = :id', { id: 1 });
```

## 事务操作

### 自动事务

```typescript
// 自动管理事务
const result = await Db.transaction(async () => {
    const data1 = await Db.table('user').where('id', 1).find();
    const data2 = await Db.table('order').where('user_id', data1.id).select();
    
    return { user: data1, orders: data2 };
});
```

### 手动事务

```typescript
try {
    // 开始事务
    await Db.startTrans();
    
    // 执行查询和更新
    const user = await Db.table('user').where('id', 1).find();
    await Db.table('order').where('id', 100).update({ status: 'paid' });
    
    // 提交事务
    await Db.commit();
} catch (error) {
    // 发生错误时回滚
    await Db.rollback();
}
```

## 多数据库连接

```typescript
// 使用默认连接
const data1 = await Db.table('user').where('id', 1).find();

// 指定连接
const data2 = await Db.connect('mysql2').table('user').where('id', 1).find();

// 使用name方法（自动添加表前缀）
const data3 = await Db.name('user').where('id', 1).find();
```

## SQL构建与调试

```typescript
// 获取即将执行的SQL语句
const sql = await Db.table('user')
    .where('status', 1)
    .fetchSql(true)  // 启用SQL获取模式
    .select();

console.log(sql);  // 输出SQL语句而不执行查询
```




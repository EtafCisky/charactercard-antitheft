# 数据库连接模块

## 概述

数据库连接模块提供了与 MySQL/MariaDB 数据库交互的核心功能，包括连接池管理、错误处理和重试机制。

## 功能特性

- ✅ **连接池管理**：使用 mysql2 连接池提高性能
- ✅ **自动重试**：连接失败时自动重试最多 3 次
- ✅ **错误处理**：完善的错误捕获和日志记录
- ✅ **健康检查**：提供数据库健康状态检查接口
- ✅ **事务支持**：支持数据库事务操作
- ✅ **环境配置**：通过环境变量配置数据库连接

## 环境变量配置

在 `.env` 文件中配置以下环境变量：

```bash
# 数据库主机地址（默认：localhost）
DB_HOST=localhost

# 数据库端口（默认：3306）
DB_PORT=3306

# 数据库用户名（必需）
DB_USER=your_database_user

# 数据库密码（必需）
DB_PASSWORD=your_database_password

# 数据库名称（必需）
DB_NAME=character_card_anti_theft
```

## 使用方法

### 1. 初始化连接

```javascript
const db = require('./db/connection');

// 初始化数据库连接（带重试机制）
async function init() {
  try {
    await db.initializeWithRetry();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    process.exit(1);
  }
}
```

### 2. 执行查询

```javascript
// 简单查询
const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// 插入数据
const result = await db.query(
  'INSERT INTO users (username, email) VALUES (?, ?)',
  ['john', 'john@example.com']
);

// 更新数据
await db.query(
  'UPDATE users SET email = ? WHERE id = ?',
  ['newemail@example.com', userId]
);

// 删除数据
await db.query('DELETE FROM users WHERE id = ?', [userId]);
```

### 3. 执行事务

```javascript
try {
  const result = await db.transaction(async (connection) => {
    // 在事务中执行多个操作
    await connection.execute(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      ['john', 'john@example.com']
    );
    
    const [rows] = await connection.execute(
      'SELECT LAST_INSERT_ID() AS id'
    );
    
    const userId = rows[0].id;
    
    await connection.execute(
      'INSERT INTO character_cards (user_id, card_name) VALUES (?, ?)',
      [userId, 'Test Card']
    );
    
    return userId;
  });
  
  console.log('事务成功，用户 ID:', result);
} catch (error) {
  console.error('事务失败:', error.message);
}
```

### 4. 健康检查

```javascript
const health = await db.healthCheck();

if (health.healthy) {
  console.log('数据库连接正常');
} else {
  console.error('数据库连接异常:', health.message);
}
```

### 5. 关闭连接

```javascript
// 在应用关闭时关闭连接池
await db.closePool();
```

## API 参考

### `initializeWithRetry()`

初始化数据库连接池，失败时自动重试最多 3 次。

**返回值**: `Promise<mysql.Pool>`

**示例**:
```javascript
await db.initializeWithRetry();
```

### `query(sql, params)`

执行 SQL 查询。

**参数**:
- `sql` (string): SQL 查询语句
- `params` (Array): 查询参数（可选）

**返回值**: `Promise<Array>` - 查询结果数组

**示例**:
```javascript
const users = await db.query('SELECT * FROM users WHERE id = ?', [1]);
```

### `transaction(callback)`

执行数据库事务。

**参数**:
- `callback` (Function): 事务回调函数，接收 connection 参数

**返回值**: `Promise<any>` - 回调函数的返回值

**示例**:
```javascript
const result = await db.transaction(async (connection) => {
  await connection.execute('INSERT INTO ...');
  return someValue;
});
```

### `healthCheck()`

检查数据库连接健康状态。

**返回值**: `Promise<Object>` - 健康状态对象

**示例**:
```javascript
const health = await db.healthCheck();
// { status: 'connected', message: '数据库连接正常', healthy: true }
```

### `isConnectionActive()`

检查数据库连接是否活跃。

**返回值**: `boolean`

**示例**:
```javascript
if (db.isConnectionActive()) {
  console.log('数据库已连接');
}
```

### `getPool()`

获取数据库连接池实例。

**返回值**: `mysql.Pool`

**示例**:
```javascript
const pool = db.getPool();
const connection = await pool.getConnection();
// 使用 connection...
connection.release();
```

### `closePool()`

关闭数据库连接池。

**返回值**: `Promise<void>`

**示例**:
```javascript
await db.closePool();
```

## 错误处理

模块会自动捕获和记录数据库错误。所有异步操作都应该使用 try-catch 包裹：

```javascript
try {
  const result = await db.query('SELECT * FROM users');
} catch (error) {
  console.error('查询失败:', error.message);
  // 处理错误...
}
```

## 重试机制

连接失败时，模块会自动重试最多 3 次，每次重试间隔 2 秒：

```
尝试 1/3 -> 失败 -> 等待 2 秒
尝试 2/3 -> 失败 -> 等待 2 秒
尝试 3/3 -> 失败 -> 抛出错误
```

## 性能优化

- **连接池**: 默认连接池大小为 10，可根据需要调整
- **参数化查询**: 使用 prepared statements 提高性能和安全性
- **连接复用**: 连接池自动管理连接复用

## 测试

### 单元测试

```bash
npm test -- tests/db.connection.test.js
```

### 集成测试

```bash
npm test -- tests/integration/db-connection.integration.test.js
```

### 手动测试

```bash
node scripts/test-db-connection.js
```

## 安全注意事项

1. **永远不要在代码中硬编码数据库凭证**
2. **始终使用参数化查询防止 SQL 注入**
3. **在生产环境中使用强密码**
4. **限制数据库用户权限**
5. **定期备份数据库**

## 故障排查

### 连接失败

如果连接失败，检查：

1. 数据库服务是否运行
2. 环境变量是否正确配置
3. 数据库用户权限是否正确
4. 防火墙是否允许连接
5. 数据库主机地址和端口是否正确

### 查询错误

如果查询失败，检查：

1. SQL 语法是否正确
2. 表和字段是否存在
3. 参数类型是否匹配
4. 用户是否有相应权限

## 相关文档

- [MySQL2 文档](https://github.com/sidorares/node-mysql2)
- [设计文档](../../.kiro/specs/character-card-anti-theft/design.md)
- [需求文档](../../.kiro/specs/character-card-anti-theft/requirements.md)

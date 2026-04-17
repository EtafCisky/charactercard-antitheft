# 数据库查询优化指南

## 概述

本文档提供数据库查询优化的最佳实践和具体建议，确保系统在高负载下保持良好性能。

## 索引策略

### 已创建的索引

#### users 表
- `PRIMARY KEY (id)` - 主键索引
- `UNIQUE (username)` - 用户名唯一索引
- `UNIQUE (email)` - 邮箱唯一索引
- `INDEX idx_username (username)` - 用户名查询索引
- `INDEX idx_email (email)` - 邮箱查询索引

#### character_cards 表
- `PRIMARY KEY (id)` - 主键索引
- `UNIQUE (card_id)` - Card ID 唯一索引
- `INDEX idx_card_id (card_id)` - Card ID 查询索引（**最重要**）
- `INDEX idx_user_id (user_id)` - 用户ID查询索引
- `FOREIGN KEY (user_id)` - 外键索引

### 索引使用原则

1. **高频查询必须使用索引**
   - 密码验证查询（VERY_HIGH）使用 `idx_card_id`
   - 用户登录查询（HIGH）使用 `idx_username` 或 `idx_email`
   - 用户角色卡列表（MEDIUM）使用 `idx_user_id`

2. **避免索引失效**
   ```sql
   -- ❌ 错误：在索引列上使用函数
   SELECT * FROM users WHERE LOWER(username) = 'test';
   
   -- ✅ 正确：直接使用索引列
   SELECT * FROM users WHERE username = 'test';
   ```

3. **复合索引的最左前缀原则**
   - 如果创建了 `INDEX idx_user_card (user_id, card_id)`
   - 可以使用 `WHERE user_id = ?` 或 `WHERE user_id = ? AND card_id = ?`
   - 不能单独使用 `WHERE card_id = ?`（不满足最左前缀）

## 查询优化技巧

### 1. 只查询需要的列

```sql
-- ❌ 错误：查询所有列
SELECT * FROM character_cards WHERE card_id = ?;

-- ✅ 正确：只查询需要的列
SELECT password_hash, password_version FROM character_cards WHERE card_id = ?;
```

**优势：**
- 减少网络传输
- 减少内存使用
- 可能使用覆盖索引（Using index）

### 2. 使用 LIMIT 限制返回行数

```sql
-- ❌ 错误：返回所有结果
SELECT * FROM character_cards WHERE user_id = ?;

-- ✅ 正确：限制返回数量
SELECT * FROM character_cards WHERE user_id = ? LIMIT 100;
```

### 3. 避免 SELECT COUNT(*) 在大表上

```sql
-- ❌ 慢：全表扫描计数
SELECT COUNT(*) FROM character_cards;

-- ✅ 快：使用近似值或缓存
-- 对于小表（< 10万行）可以接受
-- 对于大表，考虑使用缓存或估算
```

### 4. 使用 EXISTS 代替 IN（子查询）

```sql
-- ❌ 较慢：IN 子查询
SELECT * FROM character_cards 
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');

-- ✅ 较快：EXISTS
SELECT c.* FROM character_cards c
WHERE EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = c.user_id AND u.email LIKE '%@example.com'
);
```

### 5. 避免 OR 条件（可能导致索引失效）

```sql
-- ❌ 可能慢：OR 条件
SELECT * FROM users WHERE username = ? OR email = ?;

-- ✅ 更快：UNION（如果需要）
SELECT * FROM users WHERE username = ?
UNION
SELECT * FROM users WHERE email = ?;
```

## 高频查询优化

### 密码验证查询（最关键）

```sql
-- 查询：验证密码
SELECT password_hash, password_version 
FROM character_cards 
WHERE card_id = ?;

-- 优化要点：
-- 1. 必须使用 idx_card_id 索引
-- 2. 只查询需要的两列
-- 3. card_id 是 UNIQUE，最多返回1行
-- 4. 期望性能：P95 < 5ms
```

**EXPLAIN 分析：**
```
type: const 或 ref
key: idx_card_id
rows: 1
Extra: Using index（最优）
```

### 用户登录查询

```sql
-- 查询：用户登录
SELECT id, username, email, password_hash 
FROM users 
WHERE username = ?;

-- 优化要点：
-- 1. 使用 idx_username 索引
-- 2. username 是 UNIQUE，最多返回1行
-- 3. 期望性能：P95 < 5ms
```

### 用户角色卡列表

```sql
-- 查询：获取用户的所有角色卡
SELECT id, card_id, card_name, password_version, created_at, updated_at
FROM character_cards 
WHERE user_id = ? 
ORDER BY created_at DESC
LIMIT 100;

-- 优化要点：
-- 1. 使用 idx_user_id 索引
-- 2. 限制返回数量（LIMIT）
-- 3. 只查询需要的列
-- 4. 期望性能：P95 < 10ms
```

## 性能监控

### 使用 EXPLAIN 分析查询

```bash
# 运行查询优化脚本
npm run db:optimize

# 手动分析查询
mysql> EXPLAIN SELECT * FROM character_cards WHERE card_id = '123456';
```

### 关键指标

| 指标  | 说明       | 目标值              |
| ----- | ---------- | ------------------- |
| type  | 访问类型   | const, eq_ref, ref  |
| key   | 使用的索引 | 应该使用预期的索引  |
| rows  | 扫描行数   | 越少越好（< 100）   |
| Extra | 额外信息   | Using index（最优） |

### type 访问类型（从好到坏）

1. **const** - 常量查询（主键或唯一索引）
2. **eq_ref** - 唯一索引查询
3. **ref** - 非唯一索引查询
4. **range** - 范围查询
5. **index** - 全索引扫描
6. **ALL** - 全表扫描（**最差，必须优化**）

## 慢查询日志

### 启用慢查询日志

```sql
-- 启用慢查询日志
SET GLOBAL slow_query_log = 1;

-- 设置慢查询阈值（秒）
SET GLOBAL long_query_time = 1;

-- 查看慢查询日志位置
SHOW VARIABLES LIKE 'slow_query_log_file';
```

### 分析慢查询日志

```bash
# 使用 mysqldumpslow 分析
mysqldumpslow -s t -t 10 /var/log/mysql/slow-query.log

# 参数说明：
# -s t: 按查询时间排序
# -t 10: 显示前10条
```

## 数据库维护

### 定期更新统计信息

```sql
-- 更新表统计信息（建议每周执行）
ANALYZE TABLE users;
ANALYZE TABLE character_cards;
```

### 优化表（清理碎片）

```sql
-- 优化表（建议每月执行）
OPTIMIZE TABLE users;
OPTIMIZE TABLE character_cards;
```

### 检查索引基数

```sql
-- 查看索引统计信息
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  CARDINALITY,
  COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users', 'character_cards')
ORDER BY TABLE_NAME, INDEX_NAME;
```

**基数（CARDINALITY）说明：**
- 基数越高，索引选择性越好
- 理想情况：基数 = 表行数（唯一索引）
- 如果基数很低，考虑是否需要该索引

## 连接池优化

### 连接池配置

```env
# 连接池大小（根据负载调整）
DB_CONNECTION_LIMIT=10  # 开发环境
DB_CONNECTION_LIMIT=20  # 生产环境（低负载）
DB_CONNECTION_LIMIT=50  # 生产环境（高负载）

# 计算公式：CPU核心数 * 2 + 磁盘数
```

### 监控连接池

```javascript
// 获取连接池统计信息
const stats = getPoolStats();
console.log(stats);

// 输出示例：
// {
//   connectionLimit: 10,
//   totalConnections: 5,
//   freeConnections: 3,
//   queuedRequests: 0,
//   utilizationPercent: 50
// }
```

### 连接池告警阈值

- **使用率 > 80%** - 考虑增加连接池大小
- **队列请求 > 10** - 连接池不足，需要扩容
- **空闲连接 = 0** - 连接池已满，可能影响性能

## 查询缓存策略

### 应用层缓存（推荐）

```javascript
// 使用 Redis 缓存密码版本
const cacheKey = `card:${cardId}:version`;
const cachedVersion = await redis.get(cacheKey);

if (cachedVersion) {
  return parseInt(cachedVersion);
}

// 查询数据库
const version = await db.query(
  'SELECT password_version FROM character_cards WHERE card_id = ?',
  [cardId]
);

// 缓存5分钟
await redis.setex(cacheKey, 300, version);
```

### 注意事项

- MySQL 8.0 已移除查询缓存功能
- 推荐使用应用层缓存（Redis）
- 缓存失效策略：密码更新时清除缓存

## 性能基准

### 目标性能指标

| 查询类型   | P95 响应时间 | P99 响应时间 |
| ---------- | ------------ | ------------ |
| 密码验证   | < 5ms        | < 10ms       |
| 用户登录   | < 5ms        | < 10ms       |
| 角色卡列表 | < 10ms       | < 20ms       |
| 密码更新   | < 20ms       | < 50ms       |

### 性能测试

```bash
# 运行查询性能测试
npm run db:optimize

# 查看详细的性能统计
```

## 故障排查

### 查询慢的常见原因

1. **未使用索引**
   - 检查 EXPLAIN 的 key 字段
   - 确认索引存在且有效

2. **全表扫描**
   - EXPLAIN 的 type 为 ALL
   - 添加适当的索引

3. **索引失效**
   - 在索引列上使用函数
   - 使用 OR 条件
   - 类型不匹配

4. **连接池耗尽**
   - 检查连接池使用率
   - 增加连接池大小
   - 优化慢查询

5. **数据库负载高**
   - 检查慢查询日志
   - 优化高频查询
   - 考虑读写分离

## 最佳实践总结

✅ **DO（推荐做法）：**
1. 使用参数化查询（防止 SQL 注入）
2. 只查询需要的列
3. 使用 LIMIT 限制返回行数
4. 为高频查询创建索引
5. 定期运行 ANALYZE TABLE
6. 监控慢查询日志
7. 使用连接池
8. 缓存高频查询结果

❌ **DON'T（避免做法）：**
1. 不要使用 SELECT *
2. 不要在索引列上使用函数
3. 不要在大表上使用 COUNT(*)
4. 不要创建过多索引（影响写入性能）
5. 不要忽略慢查询日志
6. 不要在生产环境禁用索引
7. 不要使用字符串拼接构建 SQL（SQL 注入风险）

## 工具和脚本

```bash
# 验证索引
npm run db:verify-indexes

# 优化查询分析
npm run db:optimize

# 数据库连接测试
npm run db:test
```

## 参考资源

- [MySQL EXPLAIN 文档](https://dev.mysql.com/doc/refman/8.0/en/explain.html)
- [MySQL 索引优化](https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html)
- [MySQL 性能调优](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

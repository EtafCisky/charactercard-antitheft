# 日志系统文档

## 概述

日志系统使用 Winston 库实现结构化日志记录，支持多个日志级别、日志文件轮转和敏感信息过滤。

## 功能特性

### 1. 多级别日志

- **info**: 一般信息日志（认证成功、密码验证成功等）
- **warn**: 警告日志（认证失败、密码验证失败等）
- **error**: 错误日志（数据库错误、API 错误等）

### 2. 日志文件轮转

- 每个日志文件最大 10MB
- 保留最近 7 天的日志
- 自动轮转，防止磁盘空间耗尽

### 3. 敏感信息过滤

自动过滤以下敏感字段：
- `password`
- `new_password`
- `old_password`
- `password_hash`
- `token`
- `jwt`
- `secret`
- `authorization`

所有敏感字段在日志中显示为 `[REDACTED]`。

### 4. 日志文件

- `logs/combined.log`: 所有级别的日志
- `logs/error.log`: 仅错误日志
- `logs/exceptions.log`: 未捕获的异常
- `logs/rejections.log`: 未处理的 Promise 拒绝

## 使用方法

### 基础导入

```javascript
const {
  logAuthAttempt,
  logPasswordVerification,
  logPasswordUpdate,
  logDatabaseError,
  logApiError,
  logInfo,
  logWarn,
  logError,
} = require("./utils/logger");
```

### 1. 记录认证尝试

```javascript
// 成功的注册
logAuthAttempt("register", "testuser", true);

// 失败的登录
logAuthAttempt("login", "testuser", false, "密码错误");

// 登出
logAuthAttempt("logout", "testuser", true);
```

**日志输出示例：**
```
2024-01-15 10:30:00 [INFO]: 认证成功: register - testuser {"operation_type":"authentication","auth_operation":"register","username":"testuser","success":true,"timestamp":"2024-01-15T10:30:00.000Z"}
```

### 2. 记录密码验证尝试

```javascript
// 成功的验证
logPasswordVerification("123456", true, "192.168.1.1");

// 失败的验证
logPasswordVerification("123456", false, "192.168.1.1", "密码错误");

// 不带 IP 地址
logPasswordVerification("123456", true);
```

**日志输出示例：**
```
2024-01-15 10:35:00 [INFO]: 密码验证成功: Card ID 123456 {"operation_type":"password_verification","card_id":"123456","success":true,"ip_address":"192.168.1.1","timestamp":"2024-01-15T10:35:00.000Z"}
```

### 3. 记录密码更新操作

```javascript
logPasswordUpdate("123456", 1, 2, "testuser");
```

**日志输出示例：**
```
2024-01-15 10:40:00 [INFO]: 密码更新: Card ID 123456 (版本 1 -> 2) {"operation_type":"password_update","card_id":"123456","old_version":1,"new_version":2,"username":"testuser","timestamp":"2024-01-15T10:40:00.000Z"}
```

### 4. 记录数据库错误

```javascript
try {
  await db.query("SELECT * FROM users WHERE id = ?", [userId]);
} catch (error) {
  logDatabaseError("查询用户", error, { user_id: userId });
  throw error;
}
```

**日志输出示例：**
```
2024-01-15 10:45:00 [ERROR]: 数据库错误: 查询用户 {"operation_type":"database_error","operation":"查询用户","error_message":"Connection refused","error_code":"ECONNREFUSED","error_errno":1045,"user_id":123,"timestamp":"2024-01-15T10:45:00.000Z"}
```

### 5. 记录 API 错误

```javascript
app.post("/api/verify", async (req, res) => {
  try {
    // ... 处理逻辑
  } catch (error) {
    logApiError("POST", "/api/verify", 500, error, {
      card_id: req.body.card_id,
    });
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});
```

**日志输出示例：**
```
2024-01-15 10:50:00 [ERROR]: API 错误: POST /api/verify - 500 {"operation_type":"api_error","http_method":"POST","path":"/api/verify","status_code":500,"error_message":"Internal server error","stack_trace":"Error: Internal server error\n    at ...","card_id":"123456","timestamp":"2024-01-15T10:50:00.000Z"}
```

### 6. 一般日志方法

```javascript
// 信息日志
logInfo("服务器启动", { port: 3000, env: "production" });

// 警告日志
logWarn("配置缺失", { config_key: "REDIS_URL" });

// 错误日志（Error 对象）
try {
  // ... 操作
} catch (error) {
  logError("操作失败", error);
}

// 错误日志（元数据对象）
logError("文件写入失败", {
  file_path: "/path/to/file",
  reason: "permission denied",
});
```

## 环境变量配置

```bash
# 日志目录（默认：./logs）
LOG_DIR=/var/log/anti-theft-server

# 日志级别（默认：info）
# 可选值：error, warn, info, http, verbose, debug, silly
LOG_LEVEL=info
```

## 日志格式

所有日志条目包含以下信息：

1. **时间戳**: `YYYY-MM-DD HH:mm:ss` 格式
2. **日志级别**: `[INFO]`, `[WARN]`, `[ERROR]`
3. **消息**: 描述性消息
4. **元数据**: JSON 格式的额外信息

**示例：**
```
2024-01-15 10:30:00 [INFO]: 认证成功: register - testuser {"operation_type":"authentication","auth_operation":"register","username":"testuser","success":true,"timestamp":"2024-01-15T10:30:00.000Z"}
```

## 敏感信息过滤示例

### 输入（包含敏感信息）

```javascript
logInfo("用户注册", {
  username: "testuser",
  password: "secret123",
  email: "test@example.com",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
});
```

### 输出（敏感信息已过滤）

```
2024-01-15 10:30:00 [INFO]: 用户注册 {"username":"testuser","password":"[REDACTED]","email":"test@example.com","token":"[REDACTED]","timestamp":"2024-01-15T10:30:00.000Z"}
```

## 最佳实践

### 1. 始终记录关键操作

```javascript
// ✅ 好的做法
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await authenticateUser(username, password);
    logAuthAttempt("login", username, true);
    res.json({ success: true, token: generateToken(user) });
  } catch (error) {
    logAuthAttempt("login", username, false, error.message);
    res.status(401).json({ success: false, message: "认证失败" });
  }
});
```

### 2. 记录足够的上下文信息

```javascript
// ✅ 好的做法 - 包含上下文
logPasswordVerification(cardId, false, req.ip, "密码错误");

// ❌ 不好的做法 - 缺少上下文
logPasswordVerification(cardId, false);
```

### 3. 不要记录敏感信息

```javascript
// ✅ 好的做法 - 不记录密码
logInfo("密码验证请求", {
  card_id: cardId,
  ip_address: req.ip,
});

// ❌ 不好的做法 - 记录了明文密码
logInfo("密码验证请求", {
  card_id: cardId,
  password: req.body.password, // 不要这样做！
});
```

### 4. 使用适当的日志级别

```javascript
// ✅ 好的做法
logInfo("服务器启动"); // 正常操作
logWarn("配置缺失，使用默认值"); // 潜在问题
logError("数据库连接失败", error); // 严重错误

// ❌ 不好的做法
logError("服务器启动"); // 不是错误
logInfo("数据库连接失败"); // 应该是错误
```

### 5. 在错误处理中使用日志

```javascript
// ✅ 好的做法
try {
  await someOperation();
} catch (error) {
  logDatabaseError("执行操作", error, { operation_id: 123 });
  throw error; // 重新抛出错误
}

// ❌ 不好的做法
try {
  await someOperation();
} catch (error) {
  // 吞掉错误，没有记录
}
```

## 日志查看

### 查看所有日志

```bash
tail -f logs/combined.log
```

### 查看错误日志

```bash
tail -f logs/error.log
```

### 搜索特定操作

```bash
# 搜索密码验证日志
grep "password_verification" logs/combined.log

# 搜索特定 Card ID
grep "123456" logs/combined.log

# 搜索失败的认证
grep "认证失败" logs/combined.log
```

### 按时间范围查看

```bash
# 查看今天的日志
grep "2024-01-15" logs/combined.log

# 查看特定时间段
grep "2024-01-15 10:" logs/combined.log
```

## 日志轮转

日志文件会自动轮转：

- 当文件大小达到 10MB 时，创建新文件
- 旧文件会被重命名（例如：`combined.log.1`, `combined.log.2`）
- 保留最近 7 个文件
- 超过 7 个的旧文件会被自动删除

## 故障排查

### 问题：日志文件未创建

**解决方案：**
1. 检查 `LOG_DIR` 环境变量是否正确
2. 确保应用有写入权限
3. 检查磁盘空间是否充足

### 问题：日志文件过大

**解决方案：**
1. 检查日志轮转配置是否正确
2. 降低日志级别（例如从 `debug` 改为 `info`）
3. 手动清理旧日志文件

### 问题：敏感信息出现在日志中

**解决方案：**
1. 检查字段名是否在敏感字段列表中
2. 如果需要，在 `logger.js` 中添加新的敏感字段
3. 立即删除包含敏感信息的日志文件

## 性能考虑

- 日志记录是异步的，不会阻塞主线程
- 使用文件轮转避免单个文件过大
- 在生产环境中使用 `info` 级别，避免过多的 `debug` 日志
- 日志文件 I/O 操作由 Winston 优化处理

## 验证需求

该日志系统实现了以下需求：

- ✅ 需求 13.1：记录所有认证尝试
- ✅ 需求 13.2：记录所有密码验证尝试
- ✅ 需求 13.3：记录所有密码更新操作
- ✅ 需求 13.4：记录数据库连接错误
- ✅ 需求 13.5：记录 API 错误及详细信息
- ✅ 需求 13.6：日志条目包含时间戳、操作类型和相关标识符
- ✅ 需求 13.7：不记录明文密码

## 相关文件

- `src/utils/logger.js`: 日志系统实现
- `tests/unit/logger.test.js`: 单元测试
- `logs/`: 日志文件目录（运行时创建）

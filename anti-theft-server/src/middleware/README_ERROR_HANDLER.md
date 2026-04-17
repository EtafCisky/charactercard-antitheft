# 统一错误处理中间件

## 概述

统一错误处理中间件提供了一个集中式的错误处理机制，用于捕获和处理应用程序中的所有错误。

## 功能特性

### 1. 统一错误响应格式

所有错误响应都遵循一致的格式：

```json
{
  "success": false,
  "message": "错误消息"
}
```

在开发环境中，还会包含额外的调试信息：

```json
{
  "success": false,
  "message": "错误消息",
  "error": {
    "type": "Error",
    "code": "ERR_CODE",
    "statusCode": 500
  },
  "stack": "错误堆栈跟踪..."
}
```

### 2. 错误日志记录

所有错误都会被记录到控制台，包含以下信息：

- 时间戳
- 错误类型和消息
- HTTP 方法和路径
- 客户端 IP 地址
- 用户信息（如果已认证）
- 请求体（敏感信息已清理）
- 查询参数
- 错误堆栈（仅开发环境）

示例日志：

```json
{
  "timestamp": "2024-01-20T10:30:00.000Z",
  "level": "ERROR",
  "message": "数据库连接失败",
  "type": "Error",
  "method": "POST",
  "path": "/api/cards",
  "ip": "127.0.0.1",
  "statusCode": 500,
  "userId": 123,
  "username": "testuser",
  "requestBody": {
    "card_name": "测试角色",
    "password": "[REDACTED]"
  }
}
```

### 3. 敏感信息过滤

中间件会自动检测并清理日志中的敏感信息，包括：

- `password` - 密码
- `token` - 令牌
- `secret` - 密钥
- `api_key` / `apiKey` - API 密钥
- `auth` - 认证信息
- `credential` - 凭证
- `bearer` - Bearer 令牌

所有包含这些关键词的字段值都会被替换为 `[REDACTED]`。

### 4. 智能状态码判断

中间件会根据错误类型自动确定合适的 HTTP 状态码：

| 错误类型             | 状态码 | 说明           |
| -------------------- | ------ | -------------- |
| ValidationError      | 400    | 输入验证失败   |
| UnauthorizedError    | 401    | 未认证         |
| ForbiddenError       | 403    | 权限不足       |
| NotFoundError        | 404    | 资源不存在     |
| ConflictError        | 409    | 资源冲突       |
| TooManyRequestsError | 429    | 请求过于频繁   |
| 数据库错误 (ER_*)    | 500    | 服务器内部错误 |
| 其他错误             | 500    | 服务器内部错误 |

### 5. 环境感知

- **生产环境**：对于 5xx 错误，返回通用错误消息，隐藏内部实现细节
- **开发环境**：返回详细的错误信息和堆栈跟踪，便于调试

## 使用方法

### 基本集成

在 Express 应用中集成错误处理中间件：

```javascript
const express = require('express');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ... 其他中间件和路由 ...

// 404 处理 - 必须在所有路由之后
app.use(notFoundHandler);

// 全局错误处理 - 必须是最后一个中间件
app.use(errorHandler);
```

### 异步路由处理

使用 `asyncHandler` 包装异步路由处理函数，自动捕获 Promise 拒绝：

```javascript
const { asyncHandler } = require('./middleware/errorHandler');

// 不使用 asyncHandler（需要手动 try-catch）
app.get('/api/cards', async (req, res) => {
  try {
    const cards = await db.query('SELECT * FROM cards');
    res.json({ success: true, cards });
  } catch (error) {
    // 需要手动传递错误
    next(error);
  }
});

// 使用 asyncHandler（自动捕获错误）
app.get('/api/cards', asyncHandler(async (req, res) => {
  const cards = await db.query('SELECT * FROM cards');
  res.json({ success: true, cards });
}));
```

### 抛出自定义错误

在路由处理函数中抛出带有自定义状态码的错误：

```javascript
app.get('/api/cards/:id', asyncHandler(async (req, res) => {
  const card = await db.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
  
  if (!card) {
    const error = new Error('角色卡不存在');
    error.statusCode = 404;
    throw error;
  }
  
  res.json({ success: true, card });
}));
```

### 使用命名错误类型

创建自定义错误类型以获得更好的错误分类：

```javascript
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

app.post('/api/cards', asyncHandler(async (req, res) => {
  if (!req.body.card_name) {
    throw new ValidationError('角色卡名称不能为空');
  }
  
  // ... 创建角色卡 ...
}));
```

## API 参考

### errorHandler(err, req, res, next)

主错误处理中间件。

**参数：**
- `err` (Error) - 错误对象
- `req` (Object) - Express request 对象
- `res` (Object) - Express response 对象
- `next` (Function) - Express next 函数

**返回：**
- 无返回值，直接发送 JSON 响应

### notFoundHandler(req, res)

404 错误处理中间件。

**参数：**
- `req` (Object) - Express request 对象
- `res` (Object) - Express response 对象

**返回：**
- 无返回值，直接发送 JSON 响应

### asyncHandler(fn)

异步路由错误包装器。

**参数：**
- `fn` (Function) - 异步路由处理函数

**返回：**
- (Function) - 包装后的函数

**示例：**
```javascript
app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json({ success: true, data });
}));
```

### sanitizeObject(obj)

清理对象中的敏感信息。

**参数：**
- `obj` (Object) - 要清理的对象

**返回：**
- (Object) - 清理后的对象

### containsSensitiveInfo(str)

检查字符串是否包含敏感信息。

**参数：**
- `str` (string) - 要检查的字符串

**返回：**
- (boolean) - 是否包含敏感信息

### getStatusCode(error)

确定错误的 HTTP 状态码。

**参数：**
- `error` (Error) - 错误对象

**返回：**
- (number) - HTTP 状态码

### getUserMessage(error, statusCode)

获取用户友好的错误消息。

**参数：**
- `error` (Error) - 错误对象
- `statusCode` (number) - HTTP 状态码

**返回：**
- (string) - 错误消息

## 测试

### 运行单元测试

```bash
npm test -- tests/unit/errorHandler.test.js
```

### 运行集成测试

```bash
npm test -- tests/integration/errorHandler.integration.test.js
```

## 验证需求

该中间件实现了以下需求：

- **需求 9（错误处理）**：
  - 9.1: 网络连接失败时显示友好错误消息
  - 9.2: 密码错误时显示错误消息
  - 9.3: Card_ID 不存在时通知用户
  - 9.4: 服务器错误时显示错误消息
  - 9.5: 返回一致的错误响应格式
  - 9.6: 数据库连接失败时记录错误并返回通用消息
  - 9.7: JWT Token 过期时返回认证错误
  - 9.8: 认证失败时重定向到登录页面

- **需求 13（日志记录）**：
  - 13.1: 记录所有认证尝试
  - 13.2: 记录所有密码验证尝试
  - 13.3: 记录所有密码更新操作
  - 13.4: 记录数据库连接错误
  - 13.5: 记录 API 错误及详细信息
  - 13.6: 日志包含时间戳、操作类型和相关标识符
  - 13.7: 不记录明文密码

## 最佳实践

1. **始终使用 asyncHandler**：对于所有异步路由处理函数，使用 `asyncHandler` 包装以自动捕获错误。

2. **提供有意义的错误消息**：抛出错误时，提供清晰、用户友好的错误消息。

3. **使用适当的状态码**：为错误对象设置合适的 `statusCode` 或使用命名错误类型。

4. **避免暴露敏感信息**：不要在错误消息中包含密码、令牌或其他敏感数据。

5. **在生产环境隐藏内部细节**：确保 `NODE_ENV=production` 以隐藏详细的错误信息。

6. **记录足够的上下文**：在抛出错误前，确保有足够的上下文信息用于调试。

## 故障排除

### 错误未被捕获

**问题**：某些错误没有被错误处理中间件捕获。

**解决方案**：
- 确保错误处理中间件是最后一个中间件
- 对于异步路由，使用 `asyncHandler` 包装
- 检查是否有其他中间件提前发送了响应

### 敏感信息泄露

**问题**：日志中包含敏感信息。

**解决方案**：
- 检查 `containsSensitiveInfo` 函数的模式列表
- 添加新的敏感信息模式
- 确保在生产环境中设置 `NODE_ENV=production`

### 状态码不正确

**问题**：错误返回的状态码不符合预期。

**解决方案**：
- 为错误对象显式设置 `statusCode` 属性
- 使用命名错误类型（如 `ValidationError`）
- 检查 `getStatusCode` 函数的逻辑

## 相关文件

- `src/middleware/errorHandler.js` - 错误处理中间件实现
- `tests/unit/errorHandler.test.js` - 单元测试
- `tests/integration/errorHandler.integration.test.js` - 集成测试
- `src/server.js` - 服务器入口文件（集成错误处理）

## 更新日志

### v1.0.0 (2024-01-20)

- ✅ 实现统一错误处理中间件
- ✅ 实现错误日志记录
- ✅ 实现敏感信息过滤
- ✅ 实现智能状态码判断
- ✅ 实现 404 处理
- ✅ 实现异步错误处理包装器
- ✅ 完成单元测试（39 个测试用例）
- ✅ 完成集成测试（16 个测试用例）
- ✅ 集成到主服务器应用

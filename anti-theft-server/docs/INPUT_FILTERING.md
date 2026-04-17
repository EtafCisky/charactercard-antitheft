# 输入过滤实现文档

## 概述

本文档描述了任务 24.2 实现的输入过滤和安全措施，用于防止 XSS、SQL 注入、NoSQL 注入和路径遍历攻击。

## 实现的安全措施

### 24.2.1 XSS 防护

**实现方式：**
- 安装了 `xss` 库用于清理用户输入
- 创建了 `src/utils/sanitize.js` 工具模块
- 在所有接受用户输入的路由中应用 XSS 清理

**防护的字段：**
- 用户名 (username)
- 邮箱 (email)
- 角色卡名称 (card_name)
- Card ID (card_id)

**清理策略：**
- 完全移除所有 HTML 标签
- 移除 JavaScript 事件处理器 (onerror, onclick, etc.)
- 移除 script 和 style 标签及其内容
- 移除 JavaScript 协议 (javascript:)

**示例：**
```javascript
输入: '<script>alert("XSS")</script>Hello'
输出: 'Hello'

输入: '<img src=x onerror=alert(1)>Test'
输出: 'Test'
```

### 24.2.2 SQL 注入防护

**实现方式：**
- 审计了所有数据库查询
- 确认所有查询都使用参数化查询（prepared statements）
- 使用 `?` 占位符而不是字符串拼接

**已验证的查询：**
- ✅ `src/routes/auth.js` - 所有查询使用参数化
- ✅ `src/routes/cards.js` - 所有查询使用参数化
- ✅ `src/routes/verify.js` - 所有查询使用参数化
- ✅ `src/utils/cardId.js` - 所有查询使用参数化

**示例：**
```javascript
// ✅ 正确：参数化查询
const users = await query(
  "SELECT * FROM users WHERE username = ?",
  [username]
);

// ❌ 错误：字符串拼接（易受攻击）
// const users = await query(
//   `SELECT * FROM users WHERE username = '${username}'`
// );
```

### 24.2.3 NoSQL 注入防护

**实现方式：**
- 虽然系统使用 MySQL（不是 NoSQL），但实现了 NoSQL 注入模式检测
- 检测 MongoDB 操作符 ($where, $ne, $gt, $lt, $or, $and)
- 检测 JavaScript 函数定义和 eval 调用

**检测的模式：**
- `$where`, `$ne`, `$gt`, `$lt`, `$or`, `$and`
- `function()`, `=>`, `eval()`

**示例：**
```javascript
输入: '$where: function() { return true; }'
结果: 被拒绝，返回 400 错误

输入: '{ "$ne": null }'
结果: 被拒绝，返回 400 错误
```

### 24.2.4 路径遍历防护

**实现方式：**
- 实现了 `isPathSafe()` 函数检测危险路径模式
- 实现了 `sanitizePath()` 函数清理文件路径

**检测的模式：**
- `..` (向上遍历)
- 绝对路径 (`/`, `C:\`)
- 空字节注入 (`\0`)
- URL 编码绕过 (`%2e%2e`, `%2f`, `%5c`)

**当前状态：**
- ✅ 审计了代码库，未发现接受用户输入的文件操作
- ✅ 唯一的文件操作在 `src/utils/logger.js`，使用硬编码路径
- ✅ 工具函数已实现，可用于未来的文件上传功能

**示例：**
```javascript
isPathSafe('uploads/file.txt')           // true
isPathSafe('../../../etc/passwd')        // false
isPathSafe('/etc/passwd')                // false
isPathSafe('C:\\Windows\\System32')      // false
```

## 工具函数

### sanitizeXSS(input)
清理字符串中的 XSS 攻击向量。

### sanitizeObject(obj)
递归清理对象中所有字符串字段的 XSS 攻击向量。

### isPathSafe(filePath)
验证文件路径是否安全（防止路径遍历攻击）。

### sanitizePath(filePath)
清理文件路径，移除危险字符。

### hasNoSQLInjection(input)
检查字符串是否包含 NoSQL 注入模式。

### normalizeString(input)
标准化字符串输入（去除首尾空格）。

### sanitizeAndNormalize(input)
组合操作：标准化并清理字符串输入。

## 应用的路由

### auth.js
- ✅ POST /api/auth/register - 清理 username 和 email
- ✅ POST /api/auth/login - 清理 username

### cards.js
- ✅ POST /api/cards - 清理 card_name
- ✅ PUT /api/cards/:id - 清理 card_name

### verify.js
- ✅ POST /api/verify - 清理 card_id
- ✅ GET /api/cards/:card_id/version - 清理 card_id

## 测试覆盖

### 单元测试 (tests/unit/sanitize.test.js)
- ✅ 43 个测试全部通过
- ✅ XSS 防护测试 (12 个测试)
- ✅ 路径遍历防护测试 (12 个测试)
- ✅ NoSQL 注入检测测试 (6 个测试)
- ✅ 输入标准化测试 (9 个测试)
- ✅ 集成测试 (4 个测试)

### 集成测试 (tests/integration/input-filtering.test.js)
- ✅ 创建了 13 个集成测试
- ✅ 测试 XSS 防护在实际路由中的应用
- ✅ 测试 NoSQL 注入检测在实际路由中的应用
- ✅ 测试 SQL 注入防护
- ✅ 测试输入标准化
- ✅ 测试组合攻击防护

**注意：** 集成测试需要数据库连接才能运行。

## 安全最佳实践

### 1. 输入验证顺序
```javascript
// 1. 类型和格式验证
if (!username || typeof username !== "string") {
  return error("用户名不能为空");
}

// 2. 标准化和清理（XSS 防护）
const normalizedUsername = sanitizeAndNormalize(username);

// 3. NoSQL 注入检测
if (hasNoSQLInjection(normalizedUsername)) {
  return error("输入包含非法字符");
}

// 4. 使用参数化查询（SQL 注入防护）
const users = await query(
  "SELECT * FROM users WHERE username = ?",
  [normalizedUsername]
);
```

### 2. 防御深度
系统实现了多层防护：
- **输入层：** XSS 清理和 NoSQL 注入检测
- **数据库层：** 参数化查询防止 SQL 注入
- **文件系统层：** 路径验证防止路径遍历

### 3. 白名单策略
- XSS 防护使用白名单策略（不允许任何 HTML 标签）
- 比黑名单策略更安全，因为默认拒绝所有未明确允许的内容

## 依赖项

### 新增依赖
```json
{
  "dependencies": {
    "xss": "^1.0.15"
  }
}
```

## 性能影响

### XSS 清理
- 对每个字符串输入进行清理
- 性能影响：< 1ms per string (通常)
- 可接受的性能开销，换取安全性

### NoSQL 注入检测
- 使用正则表达式检测
- 性能影响：< 0.1ms per string
- 非常轻量级的检查

### SQL 注入防护
- 参数化查询是数据库驱动的标准功能
- 无额外性能开销
- 实际上可能比字符串拼接更快（查询计划缓存）

## 未来改进

### 1. 内容安全策略 (CSP)
考虑添加 CSP 头部以进一步防止 XSS：
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }
}));
```

### 2. 输入长度限制
考虑添加更严格的输入长度限制：
- 用户名：3-50 字符
- 邮箱：最多 100 字符
- 角色卡名称：1-100 字符
- 密码：1-100 字符

### 3. 速率限制增强
考虑为输入验证失败添加额外的速率限制：
- 防止攻击者通过大量恶意输入探测系统

## 验证需求

本实现满足以下需求：
- ✅ 需求 14：输入验证 - 验证所有输入数据以防止注入攻击
- ✅ 需求 24.2.1：实现 XSS 防护
- ✅ 需求 24.2.2：实现 SQL 注入防护（参数化查询）
- ✅ 需求 24.2.3：实现 NoSQL 注入防护
- ✅ 需求 24.2.4：实现路径遍历防护

## 总结

任务 24.2 已成功实现，系统现在具有全面的输入过滤和安全措施：

1. **XSS 防护：** 所有用户输入都经过清理，移除 HTML 标签和脚本
2. **SQL 注入防护：** 所有数据库查询都使用参数化查询
3. **NoSQL 注入防护：** 检测并拒绝包含 NoSQL 操作符的输入
4. **路径遍历防护：** 实现了路径验证工具（当前无文件操作需要）

系统采用了防御深度策略，在多个层面实施安全措施，确保即使一层防护失效，其他层仍能提供保护。

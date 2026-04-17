# API 文档

SillyTavern 角色卡防盗系统 API 完整文档

## 目录

- [概述](#概述)
- [认证说明](#认证说明)
- [错误代码](#错误代码)
- [速率限制](#速率限制)
- [API 端点](#api-端点)

---

## 概述

**基础 URL：** `http://your-server-address:3000`

**内容类型：** `application/json`

**字符编码：** `UTF-8`

---

## 认证说明

### JWT Token 认证

大部分 API 端点需要 JWT（JSON Web Token）认证。在请求头中包含：

```http
Authorization: Bearer <your_jwt_token>
```

### 获取 Token

1. **用户注册**：`POST /api/auth/register`
2. **用户登录**：`POST /api/auth/login`

### Token 有效期

- JWT token 有效期为 **7 天**
- Token 过期后需要重新登录

### 无需认证的端点

- `GET /` - 服务器信息
- `GET /health` - 健康检查
- `POST /api/verify` - 密码验证
- `GET /api/verify/cards/:card_id/version` - 获取密码版本号

---

## 错误代码

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

### 常见错误代码

| 错误代码 | 说明 | HTTP 状态码 |
|----------|------|-------------|
| `RATE_LIMIT_EXCEEDED` | IP 级别速率限制超出 | 429 |
| `CARD_RATE_LIMIT_EXCEEDED` | Card ID 级别速率限制超出 | 429 |
| `INVALID_TOKEN` | JWT token 无效或过期 | 401 |
| `UNAUTHORIZED` | 未提供认证信息 | 401 |
| `FORBIDDEN` | 无权访问该资源 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `VALIDATION_ERROR` | 输入验证失败 | 400 |
| `DUPLICATE_ENTRY` | 资源已存在 | 400 |

---

## 速率限制

### 密码验证端点限制

`POST /api/verify` 端点有两层速率限制：

#### 1. IP 级别限制

- 每个 IP 地址每分钟最多 **10 次**请求
- 60 秒滚动窗口

#### 2. Card ID 级别限制

- 每个 Card ID 每分钟最多 **5 次**请求
- 60 秒滚动窗口

### 速率限制响应

```json
{
  "success": false,
  "message": "请求过于频繁，请在 30 秒后重试",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 30
}
```

---

## API 端点

### 基础端点

#### GET /

获取服务器基本信息。

**认证：** 无需认证

**成功响应：** `200 OK`

```json
{
  "success": true,
  "message": "SillyTavern 角色卡防盗系统 API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth/*",
    "cards": "/api/cards/*",
    "verify": "/api/verify"
  }
}
```

---

#### GET /health

健康检查端点。

**认证：** 无需认证

**成功响应：** `200 OK`

```json
{
  "success": true,
  "message": "服务器运行正常",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "connected",
      "message": "数据库连接正常",
      "healthy": true
    }
  }
}
```

---

### 认证端点

#### POST /api/auth/register

用户注册。

**认证：** 无需认证

**请求体：**

```json
{
  "username": "author123",
  "email": "author@example.com",
  "password": "your_password"
}
```

**输入验证规则：**

- `username`: 3-50 字符，只能包含字母、数字、下划线和连字符
- `email`: 有效的邮箱格式，最长 100 字符
- `password`: 1-100 字符

**成功响应：** `201 Created`

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "author123",
    "email": "author@example.com"
  }
}
```

**错误响应示例：**

```json
{
  "success": false,
  "message": "用户名已存在"
}
```

---

#### POST /api/auth/login

用户登录。

**认证：** 无需认证

**请求体：**

```json
{
  "username": "author123",
  "password": "your_password"
}
```

**成功响应：** `200 OK`

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "author123",
    "email": "author@example.com"
  }
}
```

**错误响应：** `401 Unauthorized`

```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

---

### 角色卡管理端点

#### GET /api/cards

获取当前用户的所有角色卡列表。

**认证：** 需要 JWT token

**查询参数：**

- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10，最大 100

**请求示例：**

```http
GET /api/cards?page=1&limit=10 HTTP/1.1
Host: your-server-address:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应：** `200 OK`

```json
{
  "success": true,
  "cards": [
    {
      "id": 1,
      "card_id": "123456",
      "card_name": "我的角色卡",
      "password_version": 3,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-10T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

#### GET /api/cards/:id

获取单个角色卡的详细信息。

**认证：** 需要 JWT token

**路径参数：**

- `id`: 角色卡数据库 ID

**成功响应：** `200 OK`

```json
{
  "success": true,
  "card": {
    "id": 1,
    "card_id": "123456",
    "card_name": "我的角色卡",
    "password_version": 3,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-10T00:00:00.000Z"
  }
}
```

**错误响应：** `404 Not Found`

```json
{
  "success": false,
  "message": "角色卡不存在或无权访问"
}
```

---

#### POST /api/cards

创建新的角色卡记录。

**认证：** 需要 JWT token

**请求体：**

```json
{
  "card_name": "我的新角色卡",
  "password": "my_secure_password"
}
```

**输入验证规则：**

- `card_name`: 1-100 字符
- `password`: 1-100 字符

**成功响应：** `201 Created`

```json
{
  "success": true,
  "card_id": "123456",
  "password_version": 1,
  "message": "角色卡创建成功"
}
```

---

#### PUT /api/cards/:id

更新角色卡信息（如名称）。

**认证：** 需要 JWT token

**路径参数：**

- `id`: 角色卡数据库 ID

**请求体：**

```json
{
  "card_name": "更新后的角色卡名称"
}
```

**成功响应：** `200 OK`

```json
{
  "success": true,
  "message": "角色卡更新成功"
}
```

---

#### DELETE /api/cards/:id

删除角色卡记录。

**认证：** 需要 JWT token

**路径参数：**

- `id`: 角色卡数据库 ID

**成功响应：** `200 OK`

```json
{
  "success": true,
  "message": "角色卡删除成功"
}
```

---

#### PUT /api/cards/:id/password

更新角色卡密码。

**认证：** 需要 JWT token

**路径参数：**

- `id`: 角色卡数据库 ID

**请求体：**

```json
{
  "new_password": "my_new_password"
}
```

**成功响应：** `200 OK`

```json
{
  "success": true,
  "password_version": 4,
  "message": "密码更新成功"
}
```

---

#### POST /api/cards/:id/password/random

生成随机密码并自动更新角色卡密码。

**认证：** 需要 JWT token

**路径参数：**

- `id`: 角色卡数据库 ID

**请求体（可选）：**

```json
{
  "length": 16,
  "include_symbols": true
}
```

**参数说明：**

- `length` (可选): 密码长度，8-100，默认 16
- `include_symbols` (可选): 是否包含特殊符号，默认 true

**成功响应：** `200 OK`

```json
{
  "success": true,
  "password": "aB3$xY9#mN2@pQ7!",
  "password_version": 5,
  "message": "随机密码生成成功"
}
```

---

### 公开验证端点

#### POST /api/verify

验证角色卡密码（公开接口，无需认证）。

**认证：** 无需认证

**速率限制：**

- IP 级别：10 次/分钟
- Card ID 级别：5 次/分钟

**请求体：**

```json
{
  "card_id": "123456",
  "password": "my_password"
}
```

**输入验证规则：**

- `card_id`: 6-8 位数字字符串
- `password`: 1-100 字符

**成功响应：** `200 OK`

```json
{
  "success": true,
  "password_version": 3
}
```

**错误响应示例：**

**密码错误：** `401 Unauthorized`

```json
{
  "success": false,
  "message": "密码错误"
}
```

**角色卡不存在：** `404 Not Found`

```json
{
  "success": false,
  "message": "角色卡不存在"
}
```

**速率限制：** `429 Too Many Requests`

```json
{
  "success": false,
  "message": "请求过于频繁，请在 30 秒后重试",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 30
}
```

---

#### GET /api/verify/cards/:card_id/version

获取角色卡的密码版本号（公开接口，无需认证）。

**认证：** 无需认证

**路径参数：**

- `card_id`: 角色卡 ID (6-8 位数字)

**请求示例：**

```http
GET /api/verify/cards/123456/version HTTP/1.1
Host: your-server-address:3000
```

**成功响应：** `200 OK`

```json
{
  "password_version": 3
}
```

**错误响应：** `404 Not Found`

```json
{
  "success": false,
  "message": "角色卡不存在"
}
```

---

## 完整使用流程示例

### 1. 作者注册账号

```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "username": "author123",
  "email": "author@example.com",
  "password": "secure_password"
}
```

### 2. 创建角色卡

```http
POST /api/cards HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "card_name": "我的角色卡",
  "password": "card_password_123"
}
```

### 3. 用户验证密码

```http
POST /api/verify HTTP/1.1
Content-Type: application/json

{
  "card_id": "123456",
  "password": "card_password_123"
}
```

### 4. 作者更新密码

```http
PUT /api/cards/1/password HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "new_password": "new_card_password_456"
}
```

### 5. 插件检查版本号

```http
GET /api/verify/cards/123456/version HTTP/1.1
```

插件发现版本号变化后，会重新锁定角色卡并要求用户输入新密码。

---

## 附录

### 相关文档

- [数据库设置指南](./DATABASE_SETUP.md)
- [环境变量配置](./ENVIRONMENT_VARIABLES.md)
- [健康检查说明](./HEALTH_CHECK.md)
- [JWT 使用示例](./JWT_USAGE_EXAMPLES.md)

### 技术栈

- **框架：** Express.js
- **数据库：** MySQL
- **认证：** JWT (JSON Web Tokens)
- **密码加密：** bcrypt
- **速率限制：** express-rate-limit

---

**文档版本：** 1.0.0

**最后更新：** 2024-01-15

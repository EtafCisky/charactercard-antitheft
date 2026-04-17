# 安全实践文档

## 概述

本文档描述了 SillyTavern 角色卡防盗系统的安全实践和敏感数据保护措施。

## 敏感数据保护

### 1. 密码保护

#### 1.1 密码永不记录到日志

**实施措施：**

- ✅ 所有日志记录使用 Winston 日志系统
- ✅ 实现了 `sanitizeMetadata()` 函数自动过滤敏感字段
- ✅ 敏感字段列表包括：
  - `password`, `new_password`, `old_password`
  - `password_hash`
  - `token`, `jwt`, `authorization`
  - `secret`, `api_key`, `access_token`
  - `session`, `cookie`

**代码位置：** `src/utils/logger.js`

**验证方法：**
```bash
# 检查日志文件，确保没有明文密码
grep -r "password.*:" logs/
# 应该只看到 [REDACTED] 标记
```

#### 1.2 密码哈希存储

**实施措施：**

- ✅ 使用 bcrypt 算法加密所有密码
- ✅ Salt rounds 设置为 12
- ✅ 数据库只存储密码哈希，永不存储明文密码

**代码位置：** `src/utils/crypto.js`

**验证方法：**
```sql
-- 检查数据库中的密码字段
SELECT password_hash FROM users LIMIT 1;
SELECT password_hash FROM character_cards LIMIT 1;
-- 应该看到 bcrypt 哈希格式：$2b$12$...
```

### 2. JWT Secret 保护

#### 2.1 从环境变量读取

**实施措施：**

- ✅ JWT_SECRET 从 `process.env.JWT_SECRET` 读取
- ✅ 永不在代码中硬编码
- ✅ `.env.example` 提供了生成强随机密钥的命令

**代码位置：** `src/utils/jwt.js`

**生成强随机密钥：**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**验证方法：**
```bash
# 检查代码中是否有硬编码的 JWT_SECRET
grep -r "JWT_SECRET.*=" src/ --exclude-dir=node_modules
# 应该只看到 process.env.JWT_SECRET
```

#### 2.2 JWT Token 过期时间

**实施措施：**

- ✅ Token 有效期设置为 7 天
- ✅ 过期后需要重新登录
- ✅ 使用 `expiresIn` 选项自动管理过期

### 3. 数据库凭证保护

#### 3.1 从环境变量读取

**实施措施：**

- ✅ 所有数据库凭证从环境变量读取：
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
- ✅ 永不在代码中硬编码
- ✅ 连接配置在 `getDatabaseConfig()` 函数中集中管理

**代码位置：** `src/db/connection.js`

**验证方法：**
```bash
# 检查代码中是否有硬编码的数据库凭证
grep -r "password.*:.*['\"]" src/db/ --exclude-dir=node_modules
# 应该只看到 process.env.DB_PASSWORD
```

#### 3.2 连接池安全

**实施措施：**

- ✅ 使用连接池管理数据库连接
- ✅ 连接超时设置为 10 秒
- ✅ 连接失败时自动重试（最多 3 次）
- ✅ 使用参数化查询防止 SQL 注入

### 4. 文件系统保护

#### 4.1 .gitignore 配置

**实施措施：**

- ✅ 忽略所有环境变量文件：
  - `.env`
  - `.env.local`
  - `.env.*.local`
  - `.env.production`
  - `.env.development`
  - `.env.test`
- ✅ 忽略日志文件：`logs/`, `*.log`
- ✅ 忽略 SSL 证书：`*.pem`, `*.key`, `*.crt`, `*.cert`, `*.p12`, `*.pfx`
- ✅ 忽略密钥文件：`secrets/`, `*.secret`, `*.password`
- ✅ 忽略数据库备份：`*.sql`, `*.sql.gz`, `backups/`
- ✅ 忽略敏感配置：`credentials.json`, `service-account.json`

**代码位置：** `.gitignore`

**验证方法：**
```bash
# 检查 git 状态，确保敏感文件未被跟踪
git status
# 不应该看到 .env 或其他敏感文件
```

#### 4.2 .env.example 模板

**实施措施：**

- ✅ 提供 `.env.example` 作为配置模板
- ✅ 包含所有必需的环境变量
- ✅ 提供生成强随机密钥的命令
- ✅ 包含详细的配置说明

**使用方法：**
```bash
# 复制模板文件
cp .env.example .env

# 编辑配置
nano .env

# 生成 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 安全头部配置

### 1. Helmet 中间件

**实施措施：**

- ✅ HSTS (HTTP Strict Transport Security)
  - 强制 HTTPS 连接
  - 有效期 1 年
  - 包括所有子域名
- ✅ X-Content-Type-Options: nosniff
  - 防止 MIME 类型嗅探
- ✅ X-Frame-Options: DENY
  - 防止点击劫持攻击
- ✅ Content Security Policy (CSP)
  - 限制资源加载来源
  - 防止 XSS 攻击

**代码位置：** `src/server.js`

### 2. HTTPS 强制重定向

**实施措施：**

- ✅ 生产环境自动重定向 HTTP 到 HTTPS
- ✅ 使用 301 永久重定向
- ✅ 开发环境不强制重定向

**代码位置：** `src/middleware/httpsRedirect.js`

## 输入验证与过滤

### 1. SQL 注入防护

**实施措施：**

- ✅ 所有数据库查询使用参数化查询
- ✅ 永不使用字符串拼接构建 SQL
- ✅ 使用 `mysql2` 的 prepared statements

**示例：**
```javascript
// ✅ 正确：参数化查询
const cards = await db.query(
  'SELECT * FROM character_cards WHERE card_id = ?',
  [cardId]
);

// ❌ 错误：字符串拼接（易受 SQL 注入攻击）
// const cards = await db.query(
//   `SELECT * FROM character_cards WHERE card_id = '${cardId}'`
// );
```

### 2. XSS 防护

**实施措施：**

- ✅ 使用 `sanitizeAndNormalize()` 函数清理输入
- ✅ 检测并拒绝包含 NoSQL 注入模式的输入
- ✅ 使用 Helmet 的 XSS 过滤器

**代码位置：** `src/utils/sanitize.js`

### 3. 输入长度限制

**实施措施：**

- ✅ 密码长度：1-100 字符
- ✅ 用户名长度：3-50 字符
- ✅ 邮箱长度：最多 100 字符
- ✅ 角色卡名称：1-100 字符
- ✅ Card ID：6-8 位数字

## 速率限制

### 1. 密码验证速率限制

**实施措施：**

- ✅ IP 级别：10 次/分钟
- ✅ Card ID 级别：5 次/分钟
- ✅ 超过限制返回 HTTP 429 状态码
- ✅ 包含 retry-after 信息

**代码位置：** `src/middleware/rateLimiter.js`

### 2. 防止暴力破解

**实施措施：**

- ✅ 限制密码验证请求频率
- ✅ 记录所有验证尝试
- ✅ 失败尝试记录到日志

## 日志安全

### 1. 敏感信息过滤

**实施措施：**

- ✅ 自动过滤所有敏感字段
- ✅ 敏感信息替换为 `[REDACTED]`
- ✅ 递归过滤嵌套对象

**示例：**
```javascript
// 输入
logInfo("用户登录", {
  username: "testuser",
  password: "secret123",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
});

// 日志输出
// 2024-01-15 10:30:00 [INFO]: 用户登录 {"username":"testuser","password":"[REDACTED]","token":"[REDACTED]"}
```

### 2. 日志轮转

**实施措施：**

- ✅ 按大小轮转：10MB
- ✅ 保留时间：30 天
- ✅ 最大文件数：30 个
- ✅ 自动清理过期日志

### 3. 日志访问控制

**建议措施：**

```bash
# 设置日志文件权限（仅所有者可读写）
chmod 600 logs/*.log

# 设置日志目录权限
chmod 700 logs/
```

## 环境变量管理

### 1. 必需的环境变量

**生产环境必需：**

- `NODE_ENV=production`
- `JWT_SECRET` - 强随机字符串（64+ 字符）
- `DB_HOST` - 数据库主机地址
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称
- `CORS_ORIGINS` - 允许的 CORS 来源

### 2. 环境变量验证

**实施措施：**

- ✅ 启动时检查必需的环境变量
- ✅ 缺少必需变量时拒绝启动
- ✅ 提供清晰的错误消息

**验证脚本：** `scripts/validate-env.js`

```bash
# 运行环境变量验证
npm run validate-env
```

## 部署安全检查清单

### 生产环境部署前检查

- [ ] 所有敏感信息从环境变量读取
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] JWT_SECRET 使用强随机字符串
- [ ] 数据库密码足够强（16+ 字符，混合字符）
- [ ] HTTPS 已启用并强制执行
- [ ] SSL 证书有效且未过期
- [ ] 日志文件权限正确设置
- [ ] 速率限制已启用
- [ ] 所有依赖项已更新到最新安全版本
- [ ] 运行 `npm audit` 检查安全漏洞
- [ ] 防火墙规则已配置
- [ ] 数据库访问仅限本地或受信任 IP

### 定期安全审计

**每月检查：**

```bash
# 1. 检查依赖项安全漏洞
npm audit

# 2. 更新依赖项
npm update

# 3. 检查日志中的异常活动
grep "ERROR" logs/error.log | tail -100

# 4. 检查失败的认证尝试
grep "认证失败" logs/combined.log | tail -50

# 5. 检查密码验证失败
grep "密码验证失败" logs/combined.log | tail -50
```

## 安全事件响应

### 1. 密码泄露

**响应步骤：**

1. 立即更新 JWT_SECRET
2. 使所有现有 token 失效
3. 通知所有用户重新登录
4. 审查日志查找异常活动
5. 更新所有受影响的密码

### 2. 数据库凭证泄露

**响应步骤：**

1. 立即更改数据库密码
2. 更新 `.env` 文件
3. 重启服务器
4. 审查数据库访问日志
5. 检查是否有未授权的数据访问

### 3. 服务器入侵

**响应步骤：**

1. 立即隔离受影响的服务器
2. 保存所有日志和证据
3. 审查所有访问日志
4. 更改所有密码和密钥
5. 从备份恢复或重新部署
6. 加强安全措施

## 联系方式

如果发现安全漏洞，请通过以下方式报告：

- 邮箱：security@example.com
- 不要公开披露安全漏洞
- 我们将在 48 小时内响应

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

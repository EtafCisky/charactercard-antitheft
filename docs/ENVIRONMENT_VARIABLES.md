# 环境变量配置说明

本文档详细说明了角色卡防盗系统服务器端的所有环境变量配置。

## 目录

- [快速开始](#快速开始)
- [配置文件](#配置文件)
- [必需配置](#必需配置)
- [可选配置](#可选配置)
- [安全最佳实践](#安全最佳实践)
- [常见问题](#常见问题)

## 快速开始

### 开发环境

```bash
# 1. 复制开发环境模板
cp .env.development .env

# 2. 修改数据库配置（如果需要）
# 编辑 .env 文件中的 DB_USER 和 DB_PASSWORD

# 3. 启动服务器
npm run dev
```

### 生产环境

```bash
# 1. 复制生产环境模板
cp .env.production .env

# 2. 修改所有必需配置（见下文）
nano .env

# 3. 验证配置
npm run validate:env

# 4. 启动服务器
npm start
```

## 配置文件

系统提供三个环境配置模板：

| 文件               | 用途     | 说明                     |
| ------------------ | -------- | ------------------------ |
| `.env.example`     | 示例配置 | 包含所有可用配置项的示例 |
| `.env.development` | 开发环境 | 适合本地开发和测试       |
| `.env.production`  | 生产环境 | 适合部署到服务器         |

**重要提示：**
- 实际使用的配置文件名为 `.env`
- `.env` 文件已在 `.gitignore` 中，不会被提交到版本控制
- 不要将包含真实密钥的 `.env` 文件提交到 Git

## 必需配置

以下配置项在生产环境中**必须**正确设置：

### NODE_ENV

**说明：** 运行环境标识

**可选值：**
- `development` - 开发环境
- `production` - 生产环境
- `test` - 测试环境

**示例：**
```bash
NODE_ENV=production
```

**影响：**
- 生产环境会强制 HTTPS 重定向
- 生产环境会使用更严格的错误处理
- 开发环境会输出详细的调试信息

---

### SERVER_PORT

**说明：** 服务器监听端口

**默认值：** `3000`

**示例：**
```bash
SERVER_PORT=3000
```

**建议：**
- 使用 Nginx 反向代理时，使用 3000-9000 之间的端口
- 直接暴露服务时，使用 80 (HTTP) 或 443 (HTTPS)
- 确保端口未被其他服务占用

---

### DB_HOST

**说明：** 数据库主机地址

**示例：**
```bash
# 本地数据库
DB_HOST=localhost

# 远程数据库
DB_HOST=192.168.1.100
DB_HOST=db.example.com
```

---

### DB_PORT

**说明：** 数据库端口

**默认值：** `3306` (MySQL 默认端口)

**示例：**
```bash
DB_PORT=3306
```

---

### DB_USER

**说明：** 数据库用户名

**示例：**
```bash
DB_USER=anti_theft_user
```

**安全建议：**
- 不要使用 `root` 用户
- 创建专用数据库用户
- 只授予必要的权限

---

### DB_PASSWORD

**说明：** 数据库密码

**示例：**
```bash
DB_PASSWORD=your_secure_password_here
```

**安全要求：**
- 至少 16 字符
- 包含大小写字母、数字和特殊字符
- 不要使用常见密码或字典词汇

**生成强密码：**
```bash
# 使用 openssl 生成随机密码
openssl rand -base64 24
```

---

### DB_NAME

**说明：** 数据库名称

**默认值：** `character_card_anti_theft`

**示例：**
```bash
DB_NAME=character_card_anti_theft
```

---

### JWT_SECRET

**说明：** JWT 令牌签名密钥

**示例：**
```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**生成方法：**
```bash
# 生成 64 字节随机十六进制字符串
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**安全要求：**
- 必须是随机生成的字符串
- 至少 64 字节（128 个十六进制字符）
- 不要使用可预测的值
- **警告：** 更改此值会使所有现有 token 失效

---

### CORS_ORIGINS

**说明：** 允许跨域访问的来源列表

**格式：** 多个来源用逗号分隔，不要有空格

**示例：**
```bash
# 单个来源
CORS_ORIGINS=https://yourdomain.com

# 多个来源
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
```

**开发环境：**
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173
```

**注意事项：**
- 必须包含协议（http:// 或 https://）
- 不要在末尾添加斜杠
- 生产环境必须明确指定所有允许的域名
- 不要使用通配符 `*`（安全风险）

---

## 可选配置

以下配置项有合理的默认值，可以根据需要调整：

### JWT_EXPIRES_IN

**说明：** JWT 令牌过期时间

**默认值：** `7d` (7天)

**格式：**
- `60` - 60 秒
- `2m` - 2 分钟
- `2h` - 2 小时
- `7d` - 7 天

**示例：**
```bash
JWT_EXPIRES_IN=7d
```

---

### 速率限制配置

#### RATE_LIMIT_WINDOW_MS

**说明：** 速率限制时间窗口（毫秒）

**默认值：** `60000` (1分钟)

**示例：**
```bash
RATE_LIMIT_WINDOW_MS=60000
```

#### RATE_LIMIT_MAX_REQUESTS_PER_IP

**说明：** 每个 IP 地址在时间窗口内的最大请求数

**默认值：** `10`

**示例：**
```bash
RATE_LIMIT_MAX_REQUESTS_PER_IP=10
```

**建议：**
- 开发环境：100+
- 生产环境：10-20

#### RATE_LIMIT_MAX_REQUESTS_PER_CARD

**说明：** 每个 card_id 在时间窗口内的最大验证请求数

**默认值：** `5`

**示例：**
```bash
RATE_LIMIT_MAX_REQUESTS_PER_CARD=5
```

**用途：** 防止暴力破解密码

---

### 日志配置

#### LOG_LEVEL

**说明：** 日志级别

**可选值：** `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`

**默认值：** `info`

**示例：**
```bash
# 生产环境
LOG_LEVEL=info

# 开发环境
LOG_LEVEL=debug
```

**级别说明：**
- `error` - 仅错误
- `warn` - 警告和错误
- `info` - 一般信息、警告和错误（推荐生产环境）
- `debug` - 调试信息（推荐开发环境）

#### LOG_DIR

**说明：** 日志文件目录路径（任务 22.2.1）

**默认值：** `logs`（相对于项目根目录）

**示例：**
```bash
# 相对路径
LOG_DIR=logs

# 绝对路径
LOG_DIR=/var/log/anti-theft-server
```

**注意事项：**
- 确保目录存在或应用有创建权限
- 确保应用有写入权限
- 生产环境建议使用绝对路径

#### MAX_LOG_SIZE

**说明：** 单个日志文件最大大小（字节）（任务 22.2.2）

**默认值：** `10485760` (10MB)

**示例：**
```bash
# 10MB
MAX_LOG_SIZE=10485760

# 20MB
MAX_LOG_SIZE=20971520

# 50MB
MAX_LOG_SIZE=52428800
```

**说明：**
- 当日志文件达到此大小时，会自动创建新文件
- 旧文件会被重命名（添加序号）
- 建议值：10MB - 50MB

#### MAX_LOG_FILES

**说明：** 保留的日志文件最大数量（任务 22.2.3）

**默认值：** `30`（保留 30 天）

**示例：**
```bash
# 保留 30 天
MAX_LOG_FILES=30

# 保留 60 天
MAX_LOG_FILES=60

# 保留 7 天
MAX_LOG_FILES=7
```

**说明：**
- 超过此数量的旧日志文件会被自动删除
- 配合 MAX_LOG_SIZE 实现日志轮转
- 建议值：7-90 天

#### MAX_LOG_AGE

**说明：** 日志文件保留时间（任务 22.2.3）

**默认值：** `30d`（30 天）

**格式：**
- `7d` - 7 天
- `30d` - 30 天
- `90d` - 90 天

**示例：**
```bash
# 保留 30 天
MAX_LOG_AGE=30d

# 保留 90 天
MAX_LOG_AGE=90d
```

**说明：**
- 超过此时间的日志文件会被自动删除
- 与 MAX_LOG_FILES 配合使用
- 任一条件满足即删除旧日志

---

### BCRYPT_SALT_ROUNDS

**说明：** Bcrypt 加密强度

**默认值：** `12`

**可选值：** `10-14`

**示例：**
```bash
BCRYPT_SALT_ROUNDS=12
```

**说明：**
- 值越大越安全，但计算时间越长
- 10 - 快速，适合开发环境
- 12 - 平衡，推荐生产环境
- 14 - 非常安全，但较慢

---

### DB_CONNECTION_LIMIT

**说明：** 数据库连接池大小

**默认值：** `10`

**示例：**
```bash
DB_CONNECTION_LIMIT=10
```

**建议：**
- 小型应用：5-10
- 中型应用：10-20
- 大型应用：20-50

---

## 高级配置（可选）

### Redis 缓存

```bash
# 启用 Redis 缓存
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 密码版本缓存时间（秒）
CACHE_PASSWORD_VERSION_TTL=300
```

### HTTPS 配置

```bash
# 直接使用 Node.js 提供 HTTPS（不推荐，建议使用 Nginx）
HTTPS_ENABLED=true
HTTPS_KEY_PATH=/path/to/private-key.pem
HTTPS_CERT_PATH=/path/to/certificate.pem
```

### 监控配置

```bash
# Prometheus 指标
METRICS_ENABLED=true
METRICS_PORT=9090
```

### 备份配置

```bash
# 数据库备份
BACKUP_DIR=/var/backups/anti-theft-db
BACKUP_RETENTION_DAYS=7
```

---

## 安全最佳实践

### 1. 密钥管理

✅ **推荐做法：**
- 使用随机生成的强密钥
- 定期轮换密钥（每 3-6 个月）
- 使用密钥管理服务（如 AWS Secrets Manager）

❌ **避免：**
- 使用简单或可预测的密钥
- 在代码中硬编码密钥
- 将 `.env` 文件提交到版本控制

### 2. 数据库安全

✅ **推荐做法：**
- 创建专用数据库用户
- 使用强密码
- 限制数据库用户权限
- 启用 SSL/TLS 连接

❌ **避免：**
- 使用 root 用户
- 使用弱密码
- 授予不必要的权限

### 3. CORS 配置

✅ **推荐做法：**
- 明确指定允许的域名
- 使用 HTTPS
- 定期审查允许的来源

❌ **避免：**
- 使用通配符 `*`
- 允许不必要的域名
- 混合使用 HTTP 和 HTTPS

### 4. 环境隔离

✅ **推荐做法：**
- 开发、测试、生产环境使用不同的配置
- 生产环境使用更严格的安全设置
- 使用环境变量管理工具

---

## 常见问题

### Q: 如何生成 JWT_SECRET？

**A:** 使用以下命令生成：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Q: 更改 JWT_SECRET 会有什么影响？

**A:** 所有现有的 JWT token 将立即失效，所有用户需要重新登录。

### Q: 如何验证配置是否正确？

**A:** 运行验证脚本：

```bash
npm run validate:env
```

### Q: 开发环境可以使用简单的密钥吗？

**A:** 可以，但不要将开发环境的配置用于生产环境。

### Q: 如何在 Docker 中使用环境变量？

**A:** 使用 `docker-compose.yml` 的 `env_file` 或 `environment` 配置：

```yaml
services:
  api:
    env_file:
      - .env
    # 或
    environment:
      - NODE_ENV=production
      - DB_HOST=db
```

### Q: 如何在不同服务器间迁移配置？

**A:** 
1. 导出环境变量（不包含敏感信息）
2. 在新服务器上重新生成密钥
3. 更新数据库连接信息
4. 运行验证脚本

### Q: 速率限制太严格怎么办？

**A:** 调整以下配置：

```bash
RATE_LIMIT_MAX_REQUESTS_PER_IP=20
RATE_LIMIT_MAX_REQUESTS_PER_CARD=10
```

### Q: 如何禁用 HTTPS 重定向（开发环境）？

**A:** 设置 `NODE_ENV=development`，系统会自动禁用 HTTPS 重定向。

---

## 配置检查清单

部署前请确认以下配置：

### 生产环境检查清单

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` 已设置为随机字符串
- [ ] `DB_PASSWORD` 已设置为强密码
- [ ] `CORS_ORIGINS` 包含所有需要的域名
- [ ] 数据库用户权限已正确配置
- [ ] 日志级别设置为 `info` 或 `warn`
- [ ] 速率限制配置合理
- [ ] `.env` 文件权限设置为 600
- [ ] 已运行 `npm run validate:env` 验证配置

### 开发环境检查清单

- [ ] `NODE_ENV=development`
- [ ] 数据库连接正常
- [ ] CORS 包含本地开发端口
- [ ] 日志级别设置为 `debug`

---

## 相关文档

- [部署指南](./DEPLOYMENT.md)
- [数据库设置](./DATABASE_SETUP.md)
- [API 文档](./API.md)
- [故障排查](./TROUBLESHOOTING.md)

---

## 技术支持

如有配置问题，请：

1. 查看日志文件：`logs/error.log`
2. 运行验证脚本：`npm run validate:env`
3. 查看故障排查文档
4. 提交 Issue 到 GitHub

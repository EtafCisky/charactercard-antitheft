# 数据库脚本

本目录包含数据库相关的脚本和架构文件。

## 文件说明

### schema.sql
数据库表结构定义文件，包含：
- `users` 表：用户账号信息
- `character_cards` 表：角色卡记录和密码信息
- 索引和外键约束

### init-db.js
数据库初始化脚本，用于自动创建数据库和导入表结构。

### test-db-connection.js
数据库连接测试脚本，用于验证数据库配置是否正确。

### validate-env.js
环境变量验证脚本，用于检查所有必需的环境变量是否正确配置。

### verify-dependencies.js
依赖安全验证脚本，用于检查依赖版本锁定、安全漏洞和包完整性。

### backup.sh
数据库自动备份脚本，支持 MySQL dump、gzip 压缩和自动清理旧备份。

### setup-backup-cron.sh
Cron 定时任务配置脚本，用于设置自动备份任务。

### BACKUP_README.md
数据库备份详细说明文档。

## 使用方法

### 1. 验证环境变量配置

在启动服务器前，验证环境变量配置是否正确：

```bash
# 使用 npm script
npm run validate:env

# 或直接运行脚本
node scripts/validate-env.js
```

**功能：**
- 验证所有必需的环境变量是否已设置
- 检查环境变量的格式和值是否有效
- 检测不安全的配置（如默认密钥、弱密码等）
- 提供详细的错误信息和修复建议
- 根据运行环境（开发/生产）应用不同的验证规则

**验证项目：**
- `NODE_ENV` - 运行环境
- `SERVER_PORT` - 服务器端口
- `DB_*` - 数据库配置
- `JWT_SECRET` - JWT 密钥强度
- `CORS_ORIGINS` - CORS 配置安全性
- `RATE_LIMIT_*` - 速率限制配置
- `LOG_LEVEL` - 日志级别
- `BCRYPT_SALT_ROUNDS` - 密码加密强度

**输出示例：**
```
开始验证环境变量配置...

═══════════════════════════════════════════════════════
           环境变量验证结果
═══════════════════════════════════════════════════════

❌ 发现 2 个错误:

1. JWT_SECRET
   错误: 使用了默认或不安全的 JWT 密钥
   建议: 请使用以下命令生成随机密钥:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

2. DB_PASSWORD
   错误: 生产环境必须设置数据库密码
   建议: 请设置强密码（至少 16 字符）

⚠️  发现 1 个警告:

1. CORS_ORIGINS
   警告: 生产环境包含 HTTP 来源
   建议: 生产环境应该只使用 HTTPS

ℹ️  配置信息:

   NODE_ENV: 运行环境: production
   SERVER_PORT: 服务器端口: 3000
   CORS_ORIGINS: 允许 2 个来源

═══════════════════════════════════════════════════════
❌ 环境变量配置有错误，请修复后再启动服务器
═══════════════════════════════════════════════════════
```

**退出码：**
- `0` - 验证通过（可能有警告）
- `1` - 验证失败（有错误）

**建议使用场景：**
- 首次部署前验证配置
- 更新环境变量后验证
- CI/CD 流程中自动验证
- 故障排查时检查配置

### 2. 配置数据库自动备份（推荐）

设置每天自动备份数据库：

```bash
# 进入脚本目录
cd scripts

# 运行 cron 配置脚本
./setup-backup-cron.sh
```

这将配置一个 cron 定时任务，每天凌晨 2:00 自动执行数据库备份。

**手动执行备份：**

```bash
# 进入脚本目录
cd scripts

# 执行备份脚本
./backup.sh
```

**备份功能：**
- 完整的数据库结构和数据
- 自动 gzip 压缩
- 自动清理 7 天前的旧备份
- 详细的日志记录

**详细说明：** 查看 [BACKUP_README.md](./BACKUP_README.md)

### 3. 验证依赖安全性

检查依赖版本锁定、安全漏洞和包完整性：

```bash
# 使用 npm script
npm run verify:deps

# 或直接运行脚本
node scripts/verify-dependencies.js
```

**功能：**
- 验证 `package.json` 和 `package-lock.json` 存在且有效
- 检查所有依赖是否使用精确版本（无 ^ 或 ~ 前缀）
- 验证 Node.js 版本是否满足要求
- 检查 `package-lock.json` 是否与 `package.json` 同步
- 运行 npm audit 检查安全漏洞

**输出示例：**
```
=== Dependency Verification ===

ℹ️  Checking package.json...
✅ package.json found and valid

ℹ️  Checking package-lock.json...
✅ package-lock.json found and valid

ℹ️  Checking Node.js version...
ℹ️  Required: >=18.0.0, Current: v18.17.0
✅ Node.js version v18.17.0 meets requirements

ℹ️  Checking for exact version specifications...
⚠️  Found dependencies with non-exact versions:
  - bcrypt@^6.0.0 (dependencies)
⚠️  Consider using exact versions for better reproducibility

ℹ️  Checking if package-lock.json is in sync...
✅ package-lock.json is in sync with package.json

ℹ️  Running npm audit...
✅ No security vulnerabilities found

=== Verification Summary ===

✅ Node.js version
⚠️  Exact versions
✅ Lock file sync
✅ Security audit

❌ Some dependency checks failed. Please review the output above.
```

**退出码：**
- `0` - 所有检查通过
- `1` - 有检查失败

**建议使用场景：**
- 部署前验证依赖安全性
- CI/CD 流程中自动检查
- 定期安全审计
- 依赖更新后验证

**相关文档：** 查看 [DEPENDENCY_SECURITY.md](../docs/DEPENDENCY_SECURITY.md)

### 4. 初始化数据库

首次部署时，使用此脚本创建数据库和表结构：

```bash
# 确保已配置 .env 文件
node scripts/init-db.js
```

**功能：**
- 自动创建数据库（如果不存在）
- 导入表结构（users 和 character_cards）
- 创建索引和外键约束
- 验证表结构是否正确
- 显示详细的执行日志

**前置条件：**
- MySQL/MariaDB 服务器正在运行
- `.env` 文件已正确配置数据库连接信息
- 数据库用户具有创建数据库和表的权限

**环境变量要求：**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=character_card_anti_theft
```

**最佳实践：**
在执行数据库初始化前，先运行环境变量验证：
```bash
npm run validate:env && npm run db:init
```

### 5. 测试数据库连接

验证数据库配置是否正确：

```bash
node scripts/test-db-connection.js
```

**功能：**
- 测试数据库连接
- 验证连接池配置
- 显示连接状态

## 执行流程

`init-db.js` 脚本执行以下步骤：

1. **验证环境变量** - 检查必需的数据库配置
2. **连接 MySQL 服务器** - 建立数据库连接
3. **检查并创建数据库** - 如果数据库不存在则创建
4. **读取架构文件** - 加载 schema.sql
5. **导入表结构** - 执行 SQL 创建表和索引
6. **验证表结构** - 确认所有表和索引已创建
7. **显示数据库信息** - 输出数据库配置信息

## 输出示例

```
============================================================
数据库初始化脚本
============================================================

[步骤 1] 验证环境变量
✅ 环境变量验证通过
ℹ️  目标数据库: character_card_anti_theft

[步骤 2] 连接到 MySQL 服务器
ℹ️  正在连接到 MySQL 服务器: localhost:3306
✅ 成功连接到 MySQL 服务器

[步骤 3] 检查并创建数据库
ℹ️  正在创建数据库: character_card_anti_theft
✅ 数据库 "character_card_anti_theft" 创建成功

[步骤 4] 读取架构文件
ℹ️  正在读取架构文件: /path/to/scripts/schema.sql
✅ 架构文件读取成功

[步骤 5] 导入表结构
ℹ️  正在导入表结构到数据库: character_card_anti_theft
✅ 表结构导入成功

[步骤 6] 验证表结构
ℹ️  正在验证表结构...
ℹ️  找到 2 个表:
  - users
  - character_cards
✅ 所有必需的表都已创建
ℹ️  正在验证索引...
ℹ️  找到 8 个索引
  users:
    - PRIMARY (id)
    - username (username)
    - idx_username (username)
    - idx_email (email)
  character_cards:
    - PRIMARY (id)
    - card_id (card_id)
    - idx_card_id (card_id)
    - idx_user_id (user_id)
✅ 索引验证完成

[步骤 7] 数据库信息
ℹ️  数据库信息:
  数据库名称: character_card_anti_theft
  字符集: utf8mb4
  排序规则: utf8mb4_unicode_ci

============================================================
✅ 数据库初始化完成！
============================================================

ℹ️  下一步操作:
  1. 启动服务器: npm start
  2. 运行测试: npm test
  3. 查看 API 文档: docs/API.md
```

## 故障排查

### 错误：缺少必需的环境变量

**原因：** `.env` 文件未配置或配置不完整

**解决方法：**
1. 复制 `.env.example` 到 `.env`
2. 填写正确的数据库配置信息

### 错误：连接 MySQL 服务器失败

**可能原因：**
- MySQL 服务器未运行
- 数据库地址或端口错误
- 防火墙阻止连接

**解决方法：**
1. 检查 MySQL 服务状态：`sudo systemctl status mysql`
2. 验证数据库地址和端口
3. 检查防火墙设置

### 错误：Access denied for user

**原因：** 数据库用户名或密码错误，或权限不足

**解决方法：**
1. 验证用户名和密码
2. 确保用户具有 CREATE DATABASE 权限：
   ```sql
   GRANT ALL PRIVILEGES ON *.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 错误：架构文件不存在

**原因：** `schema.sql` 文件缺失或路径错误

**解决方法：**
1. 确认 `scripts/schema.sql` 文件存在
2. 检查文件路径是否正确

## 重新初始化数据库

如果需要重新初始化数据库（**警告：会删除所有数据**）：

```bash
# 方法 1: 手动删除数据库
mysql -u your_user -p -e "DROP DATABASE IF EXISTS character_card_anti_theft;"
node scripts/init-db.js

# 方法 2: 删除表后重新导入
mysql -u your_user -p character_card_anti_theft -e "DROP TABLE IF EXISTS character_cards, users;"
node scripts/init-db.js
```

## 生产环境注意事项

1. **备份数据** - 在生产环境执行前务必备份现有数据
2. **权限控制** - 使用最小权限原则配置数据库用户
3. **安全配置** - 确保 `.env` 文件不被提交到版本控制
4. **日志记录** - 保存初始化日志以便审计

## 相关文档

- [数据库设计文档](../../.kiro/specs/character-card-anti-theft/design.md#数据模型)
- [部署文档](../docs/DEPLOYMENT.md)
- [API 文档](../docs/API.md)

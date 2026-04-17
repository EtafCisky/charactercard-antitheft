# 数据库设置指南

本文档介绍如何设置和配置数据库以运行 SillyTavern 角色卡防盗系统服务器。

## 快速开始

如果你已经安装了 MySQL/MariaDB，可以使用自动初始化脚本快速设置：

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库配置

# 2. 运行初始化脚本
npm run db:init

# 3. 测试连接
npm run db:test

# 4. 启动服务器
npm start
```

详细步骤请继续阅读下文。

## 前置要求

- MySQL 8.0+ 或 MariaDB 10.6+
- Node.js 18.0+

## 步骤 1：安装数据库

### 在 Linux (Ubuntu/Debian) 上安装 MySQL

```bash
# 更新包列表
sudo apt update

# 安装 MySQL 服务器
sudo apt install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 运行安全配置脚本
sudo mysql_secure_installation
```

### 在 macOS 上安装 MySQL

```bash
# 使用 Homebrew 安装
brew install mysql

# 启动 MySQL 服务
brew services start mysql
```

### 在 Windows 上安装 MySQL

1. 从 [MySQL 官网](https://dev.mysql.com/downloads/installer/) 下载 MySQL 安装程序
2. 运行安装程序并按照向导完成安装
3. 记住设置的 root 密码

## 步骤 2：创建数据库和用户

登录 MySQL：

```bash
# Linux/macOS
sudo mysql -u root -p

# Windows
mysql -u root -p
```

执行以下 SQL 命令：

```sql
-- 创建数据库
CREATE DATABASE character_card_anti_theft 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 创建用户（请替换密码）
CREATE USER 'anti_theft_user'@'localhost' 
  IDENTIFIED BY 'your_secure_password_here';

-- 授予权限
GRANT ALL PRIVILEGES ON character_card_anti_theft.* 
  TO 'anti_theft_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

## 步骤 3：导入数据库结构

### 方法 1：使用自动初始化脚本（推荐）

使用提供的初始化脚本自动创建数据库和导入表结构：

```bash
# 进入项目目录
cd anti-theft-server

# 运行初始化脚本
npm run db:init
# 或者
node scripts/init-db.js
```

**优点：**
- 自动创建数据库（如果不存在）
- 自动导入表结构
- 验证表和索引是否正确创建
- 提供详细的执行日志和错误提示

**注意：** 运行此脚本前，请确保已配置 `.env` 文件（见步骤 4）。

### 方法 2：手动导入（备选）

如果需要手动控制，可以直接使用 MySQL 命令导入：

```bash
# 导入数据库结构
mysql -u anti_theft_user -p character_card_anti_theft < scripts/schema.sql
```

## 步骤 4：配置环境变量

复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入数据库配置：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=anti_theft_user
DB_PASSWORD=your_secure_password_here
DB_NAME=character_card_anti_theft
```

## 步骤 5：测试数据库连接

运行测试脚本验证连接：

```bash
npm run db:test
# 或者
node scripts/test-db-connection.js
```

如果看到以下输出，说明连接成功：

```text
============================================================
数据库连接测试
============================================================

1. 数据库配置:
   主机: localhost:3306
   用户: anti_theft_user
   数据库: character_card_anti_theft
   ...

✅ 所有测试通过！数据库连接正常工作
============================================================
```

## 步骤 6：启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 常见问题

### 问题 1：连接被拒绝

**错误信息**: `ECONNREFUSED 127.0.0.1:3306`

**解决方法**:
1. 检查 MySQL 服务是否运行：
   ```bash
   # Linux
   sudo systemctl status mysql
   
   # macOS
   brew services list
   
   # Windows
   net start MySQL
   ```

2. 检查端口是否正确（默认 3306）

### 问题 2：访问被拒绝

**错误信息**: `Access denied for user 'anti_theft_user'@'localhost'`

**解决方法**:
1. 检查用户名和密码是否正确
2. 确认用户已创建并授予权限：
   ```sql
   SELECT User, Host FROM mysql.user WHERE User = 'anti_theft_user';
   SHOW GRANTS FOR 'anti_theft_user'@'localhost';
   ```

### 问题 3：数据库不存在

**错误信息**: `Unknown database 'character_card_anti_theft'`

**解决方法**:
1. 确认数据库已创建：
   ```sql
   SHOW DATABASES LIKE 'character_card_anti_theft';
   ```
2. 如果不存在，重新执行步骤 2

### 问题 4：字符集问题

**错误信息**: 中文字符显示为乱码

**解决方法**:
1. 确认数据库使用 utf8mb4 字符集：
   ```sql
   SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
   FROM information_schema.SCHEMATA
   WHERE SCHEMA_NAME = 'character_card_anti_theft';
   ```

2. 如果不是 utf8mb4，修改字符集：
   ```sql
   ALTER DATABASE character_card_anti_theft
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;
   ```

## Docker 部署

如果使用 Docker，可以使用以下 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: anti-theft-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: character_card_anti_theft
      MYSQL_USER: anti_theft_user
      MYSQL_PASSWORD: your_secure_password
    volumes:
      - db-data:/var/lib/mysql
      - ./scripts/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

volumes:
  db-data:
```

启动：

```bash
docker-compose up -d
```

## 数据库备份

### 备份数据库

```bash
mysqldump -u anti_theft_user -p character_card_anti_theft > backup.sql
```

### 恢复数据库

```bash
mysql -u anti_theft_user -p character_card_anti_theft < backup.sql
```

## 性能优化建议

1. **启用查询缓存**（MySQL 5.7 及更早版本）
2. **调整连接池大小**：根据服务器负载调整 `connectionLimit`
3. **添加索引**：确保常用查询字段有索引
4. **定期优化表**：
   ```sql
   OPTIMIZE TABLE users, character_cards;
   ```

## 安全建议

1. **使用强密码**：数据库密码应至少 16 字符，包含大小写字母、数字和特殊字符
2. **限制远程访问**：生产环境中只允许本地连接
3. **定期备份**：设置自动备份任务
4. **最小权限原则**：只授予应用所需的最小权限
5. **更新数据库**：保持 MySQL/MariaDB 版本最新

## 相关文档

- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [MariaDB 官方文档](https://mariadb.com/kb/en/)
- [数据库连接模块 README](../src/db/README.md)

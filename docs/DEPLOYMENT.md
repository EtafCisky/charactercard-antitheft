# 部署文档

SillyTavern 角色卡防盗系统 - 完整部署指南

本文档提供系统的完整部署指南,包括 Docker 部署和 Windows 原生部署两种方式。

## 目录

- [部署方式选择](#部署方式选择)
- [Docker 一键部署](#docker-一键部署)
- [Windows 原生部署](#windows-原生部署)
- [云服务器部署](#云服务器部署)
- [故障排查](#故障排查)

---

## 部署方式选择

本系统提供**两种独立的一键部署方式**,用户可根据自己的需求和环境选择。

### 方式对比

| 特性         | Docker 一键部署                                                     | Windows 原生一键部署          |
| ------------ | ------------------------------------------------------------------- | ----------------------------- |
| **适用平台** | Windows / Linux / macOS                                             | 仅 Windows 10/11              |
| **安装命令** | `docker-install.ps1` (Windows)<br>`docker-install.sh` (Linux/macOS) | `windows-install.ps1`         |
| **前置要求** | Docker（脚本可自动安装）                                            | Node.js + MySQL（脚本会检测） |
| **环境隔离** | ✅ 完全隔离                                                          | ❌ 直接安装到系统              |
| **资源占用** | 中等（~500MB）                                                      | 较低（~200MB）                |
| **性能**     | 良好                                                                | 优秀                          |
| **启动速度** | 较慢（~10秒）                                                       | 快速（~2秒）                  |
| **维护难度** | 简单                                                                | 中等                          |
| **卸载清理** | 完全清理                                                            | 需要手动清理部分内容          |
| **推荐场景** | 生产环境、多服务器部署                                              | 开发环境、个人使用            |

### 如何选择？

**选择 Docker 部署,如果你:**

- ✅ 需要在多个平台部署（Windows/Linux/macOS）
- ✅ 希望环境完全隔离,不影响系统其他服务
- ✅ 不想手动安装 Node.js 和 MySQL
- ✅ 需要快速迁移到其他服务器
- ✅ 计划部署到生产环境
- ✅ 电脑配置较好（8GB+ 内存）

**选择 Windows 原生部署,如果你:**

- ✅ 只在 Windows 上使用
- ✅ 希望获得最佳性能
- ✅ 电脑配置较低（4GB 内存）
- ✅ 需要频繁调试和修改代码
- ✅ 已经安装了 Node.js 和 MySQL
- ✅ 仅用于个人开发或测试

---

## Docker 一键部署（推荐）

### 特点

- ✅ **跨平台**：支持 Windows、Linux、macOS
- ✅ **环境隔离**：不影响系统其他服务
- ✅ **依赖自动管理**：无需手动安装 Node.js、MySQL
- ✅ **一键启动/停止**：`docker-compose up/down`
- ✅ **易于迁移**：可快速部署到其他服务器

### 系统要求

- **操作系统**：Windows 10/11、Linux、macOS
- **内存**：至少 4GB RAM（推荐 8GB+）
- **磁盘空间**：至少 5GB 可用空间
- **Docker**：Docker Desktop（Windows/macOS）或 Docker Engine（Linux）

### Windows 部署步骤

#### 步骤 1：下载安装脚本

打开 PowerShell（以管理员身份运行）：

```powershell
# 方式 1：直接下载并运行
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-repo/docker-install.ps1" -OutFile "docker-install.ps1"
powershell -ExecutionPolicy Bypass -File docker-install.ps1

# 方式 2：如果已克隆仓库
cd character-card-anti-theft-system/docker
.\docker-install.ps1
```

#### 步骤 2：Docker 检测与安装

脚本会自动检测 Docker 是否已安装：

**如果未安装 Docker：**

```
[INFO] 正在检测 Docker...
[WARNING] Docker 未安装
[INFO] 开始下载 Docker Desktop...
[INFO] 正在下载 Docker Desktop 安装程序...
[INFO] 正在安装 Docker Desktop...
[WARNING] 请按照安装向导完成安装
```

安装完成后：

1. 启动 Docker Desktop
2. 等待 Docker 完全启动（托盘图标变为绿色）
3. 按 Enter 继续安装

**如果已安装 Docker：**

```
[SUCCESS] Docker 已安装: Docker version 24.0.6
[SUCCESS] Docker Compose 已安装: Docker Compose version v2.23.0
[SUCCESS] Docker 正在运行
```

#### 步骤 3：配置收集

脚本会交互式收集配置信息：

```
================================================
  配置收集
================================================

[1/6] 数据库配置
请输入 MySQL root 密码（用于数据库管理）: ********
请输入数据库名称 [character_card_anti_theft]: [Enter]
请输入数据库用户名 [anti_theft_user]: [Enter]
请输入数据库用户密码: ********

[2/6] JWT 配置
请输入 JWT 密钥（留空自动生成 64 位随机密钥）: [Enter]
[INFO] 已自动生成 JWT 密钥: a7f3e9d2c1b4...

[3/6] 服务器配置
请输入 API 服务器端口 [3000]: [Enter]
请输入 Web 界面端口 [80]: [Enter]

[4/6] CORS 配置
请输入允许的来源（多个用逗号分隔）[*]: http://localhost:3000,http://localhost:80

[5/6] API 基础 URL
请输入 API 基础 URL [http://localhost:3000]: [Enter]

[6/6] SSL 配置（可选）
是否启用 HTTPS？(Y/N) [N]: N
```

#### 步骤 4：自动部署

配置完成后,脚本会自动执行以下操作：

```
[INFO] 正在生成 .env 文件...
[SUCCESS] .env 文件已生成

[INFO] 正在生成 docker-compose.yml...
[SUCCESS] docker-compose.yml 已生成

[INFO] 正在拉取 Docker 镜像...
[INFO] 这可能需要几分钟时间...
Pulling db ... done
Pulling api ... done
Pulling web ... done

[INFO] 正在启动容器...
Creating network "docker_anti-theft-network" ... done
Creating volume "docker_db_data" ... done
Creating volume "docker_api_logs" ... done
Creating anti-theft-db ... done
Creating anti-theft-api ... done
Creating anti-theft-web ... done

[INFO] 等待服务启动...
[INFO] 正在初始化数据库...
[SUCCESS] 数据库初始化完成
```

#### 步骤 5：验证服务

```
[INFO] 正在验证服务...
[SUCCESS] API 服务器运行正常
[SUCCESS] 数据库连接成功
[SUCCESS] Web 界面运行正常

================================================
  安装完成！
================================================

✅ 所有服务已成功启动

访问地址:
  - API 服务器: http://localhost:3000
  - Web 管理界面: http://localhost:80
  - 健康检查: http://localhost:3000/health

管理命令:
  - 查看日志: docker-compose logs -f
  - 停止服务: docker-compose down
  - 重启服务: docker-compose restart
  - 查看状态: docker-compose ps

日志文件位置:
  - 安装日志: ./install.log
  - API 日志: docker volume inspect docker_api_logs
```

### Linux / macOS 部署步骤

#### 步骤 1：下载并运行安装脚本

```bash
# 方式 1：直接下载并运行
curl -fsSL https://raw.githubusercontent.com/your-repo/docker-install.sh | bash

# 方式 2：下载后运行
wget https://raw.githubusercontent.com/your-repo/docker-install.sh
chmod +x docker-install.sh
./docker-install.sh

# 方式 3：如果已克隆仓库
cd character-card-anti-theft-system/docker
chmod +x docker-install.sh
./docker-install.sh
```

#### 步骤 2：Docker 安装（如果需要）

**Ubuntu/Debian:**

```bash
# 脚本会自动执行以下命令
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

**CentOS/RHEL:**

```bash
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

**macOS:**

```bash
# 脚本会提示下载 Docker Desktop for Mac
# 下载地址: https://www.docker.com/products/docker-desktop
```

安装完成后,**注销并重新登录**以使 Docker 组权限生效。

#### 步骤 3-5：配置、部署、验证

与 Windows 步骤相同,脚本会交互式收集配置并自动部署。

### 包含的服务

Docker 部署会启动以下容器：

1. **anti-theft-db**：MySQL 8.0 数据库
   - 端口：3306
   - 数据卷：`db_data`（持久化存储）

2. **anti-theft-api**：Node.js API 服务器
   - 端口：3000
   - 日志卷：`api_logs`

3. **anti-theft-web**：Web 管理界面
   - 端口：80
   - 基于 Nginx 的静态文件服务

4. **anti-theft-nginx**（可选）：HTTPS 反向代理
   - 端口：443
   - 仅在启用 SSL 时创建

### 容器管理命令

#### 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 启动并查看日志
docker-compose up

# 仅启动特定服务
docker-compose up -d api
```

#### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止但保留数据卷
docker-compose stop

# 停止并删除所有数据（危险！）
docker-compose down -v
```

#### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart api
```

#### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f api

# 查看最近 100 行日志
docker-compose logs --tail=100 api

# 查看实时日志（不包含历史）
docker-compose logs -f --tail=0 api
```

#### 查看状态

```bash
# 查看容器状态
docker-compose ps

# 查看详细信息
docker-compose ps -a

# 查看资源使用情况
docker stats
```

#### 进入容器

```bash
# 进入 API 容器
docker exec -it anti-theft-api sh

# 进入数据库容器
docker exec -it anti-theft-db mysql -u root -p

# 在容器中执行命令
docker exec anti-theft-api npm run db:test
```

### 数据持久化与备份

#### 数据卷位置

```bash
# 查看数据卷
docker volume ls

# 查看数据卷详细信息
docker volume inspect docker_db_data
docker volume inspect docker_api_logs
```

#### 备份数据库

```bash
# 方式 1：使用 mysqldump
docker exec anti-theft-db mysqldump -u root -p<password> character_card_anti_theft > backup.sql

# 方式 2：备份整个数据卷
docker run --rm -v docker_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz /data

# 方式 3：使用项目自带的备份脚本
docker exec anti-theft-api npm run backup
```

#### 恢复数据库

```bash
# 方式 1：从 SQL 文件恢复
docker exec -i anti-theft-db mysql -u root -p<password> character_card_anti_theft < backup.sql

# 方式 2：从数据卷备份恢复
docker run --rm -v docker_db_data:/data -v $(pwd):/backup alpine tar xzf /backup/db_backup.tar.gz -C /
```

#### 自动备份设置

在宿主机上设置定时任务：

**Linux/macOS (cron):**

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * cd /path/to/docker && docker exec anti-theft-db mysqldump -u root -p<password> character_card_anti_theft > backup_$(date +\%Y\%m\%d).sql
```

**Windows (任务计划程序):**

```powershell
# 创建备份脚本 backup.ps1
$date = Get-Date -Format "yyyyMMdd"
docker exec anti-theft-db mysqldump -u root -p<password> character_card_anti_theft > "backup_$date.sql"

# 在任务计划程序中创建每日任务运行此脚本
```

### 更新到新版本

#### 更新步骤

```bash
# 1. 备份数据（重要！）
docker exec anti-theft-db mysqldump -u root -p<password> character_card_anti_theft > backup_before_update.sql

# 2. 停止服务
docker-compose down

# 3. 拉取最新代码
git pull origin main

# 4. 拉取最新镜像
docker-compose pull

# 5. 重新构建镜像（如果有本地修改）
docker-compose build --no-cache

# 6. 启动服务
docker-compose up -d

# 7. 验证服务
curl http://localhost:3000/health
```

#### 版本回滚

如果更新后出现问题：

```bash
# 1. 停止服务
docker-compose down

# 2. 回滚代码
git checkout <previous-version-tag>

# 3. 恢复数据库（如果需要）
docker-compose up -d db
docker exec -i anti-theft-db mysql -u root -p<password> character_card_anti_theft < backup_before_update.sql

# 4. 启动服务
docker-compose up -d
```

### 配置修改

#### 修改环境变量

```bash
# 1. 编辑 .env 文件
nano .env

# 2. 重启服务使配置生效
docker-compose restart
```

#### 修改端口

```bash
# 编辑 .env 文件
SERVER_PORT=3001  # 修改 API 端口
WEB_PORT=8080     # 修改 Web 端口

# 或直接修改 docker-compose.yml
ports:
  - "3001:3000"  # 宿主机端口:容器端口
```

#### 修改资源限制

编辑 `docker-compose.yml`：

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Windows 原生部署

### 特点

- ✅ **性能最优**：直接运行在系统上，无容器开销
- ✅ **资源占用少**：不需要 Docker，节省内存
- ✅ **便于调试**：可以直接查看日志和进程
- ✅ **启动快速**：无需等待容器启动

### 系统要求

- **操作系统**：Windows 10/11（64位）
- **内存**：至少 4GB RAM
- **磁盘空间**：至少 5GB 可用空间
- **软件依赖**：Node.js 18.x+、MySQL 8.0+

### 前置准备

#### 安装 Node.js

1. 访问 <https://nodejs.org/>
2. 下载 LTS 版本（推荐 18.x 或更高）
3. 运行安装程序，使用默认设置
4. 验证安装：

   ```powershell
   node --version
   npm --version
   ```

#### 安装 MySQL

1. 访问 <https://dev.mysql.com/downloads/installer/>
2. 下载 MySQL Installer
3. 选择 "Developer Default" 安装类型
4. 设置 root 密码（请记住此密码）
5. 完成安装并启动 MySQL 服务
6. 验证安装：

   ```powershell
   Get-Service MySQL*
   ```

### 部署步骤

#### 步骤 1：下载项目

```powershell
# 使用 Git
git clone <项目地址>
cd anti-theft-server

# 或下载 ZIP 并解压
```

#### 步骤 2：运行安装脚本

以管理员身份打开 PowerShell：

```powershell
# 进入部署目录
cd character-card-anti-theft-system\windows

# 允许脚本执行（首次需要）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 运行安装脚本
.\windows-install.ps1
```

#### 步骤 3：配置信息收集

脚本会交互式收集以下配置：

1. **MySQL Root 密码**：安装 MySQL 时设置的密码
2. **数据库名称**：默认 `character_card_anti_theft`
3. **数据库用户**：默认 `anti_theft_user`
4. **数据库密码**：自动生成或手动输入
5. **服务器端口**：默认 `3000`
6. **JWT 密钥**：自动生成
7. **CORS 来源**：允许的跨域来源

#### 步骤 4：自动部署

脚本会自动执行：

1. 生成 `.env` 配置文件
2. 安装 npm 依赖
3. 初始化数据库
4. 安装 PM2 进程管理器
5. 启动服务
6. 执行健康检查

#### 步骤 5：验证部署

```powershell
# 查看服务状态
pm2 status

# 测试 API
curl http://localhost:3000/health

# 查看日志
pm2 logs anti-theft-api
```

### 服务管理

#### 使用 PM2 管理服务

```powershell
# 查看状态
pm2 status

# 查看日志
pm2 logs anti-theft-api

# 重启服务
pm2 restart anti-theft-api

# 停止服务
pm2 stop anti-theft-api

# 启动服务
pm2 start anti-theft-api

# 删除服务
pm2 delete anti-theft-api
```

#### 配置开机自启动

```powershell
# 保存 PM2 进程列表
pm2 save

# 配置开机启动
pm2 startup

# 按照提示执行生成的命令
```

### 日志管理

#### 查看日志

```powershell
# PM2 日志
pm2 logs anti-theft-api

# 应用日志
Get-Content logs\combined.log -Tail 50

# 错误日志
Get-Content logs\error.log -Tail 50
```

#### 清理日志

```powershell
# 清理 PM2 日志
pm2 flush

# 清理应用日志
Remove-Item logs\*.log
```

### 数据库备份

#### 手动备份

```powershell
# 创建备份目录
New-Item -ItemType Directory -Force -Path backups

# 备份数据库
mysqldump -u anti_theft_user -p character_card_anti_theft > backups\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

#### 恢复备份

```powershell
mysql -u anti_theft_user -p character_card_anti_theft < backups\backup_20240115_120000.sql
```

### 更新应用

```powershell
# 停止服务
pm2 stop anti-theft-api

# 拉取最新代码
git pull origin main

# 安装新依赖
npm install --production

# 运行数据库迁移（如果有）
npm run db:migrate

# 重启服务
pm2 restart anti-theft-api
```

### 卸载

运行卸载脚本：

```powershell
cd character-card-anti-theft-system\windows
.\windows-uninstall.ps1
```

卸载脚本会：

1. 停止并删除 PM2 进程
2. 删除数据库和用户（可选）
3. 删除防火墙规则
4. 清理日志文件（可选）

---

## 故障排查

### 常见问题与解决方案

#### 问题 1：Docker 未启动

**现象**：

```
Cannot connect to the Docker daemon
```

**解决方法**：

- **Windows/macOS**：打开 Docker Desktop 应用，等待启动完成
- **Linux**：运行 `sudo systemctl start docker`

#### 问题 2：端口被占用

**现象**：

```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方法**：

**方法 1：更改端口**

```bash
# 编辑 .env 文件
SERVER_PORT=3001

# 重启服务
docker-compose restart
# 或
pm2 restart anti-theft-api
```

**方法 2：释放端口**

```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 问题 3：数据库连接失败

**现象**：

```
Error: Access denied for user 'anti_theft_user'@'localhost'
```

**解决方法**：

1. 检查数据库密码是否正确
2. 验证数据库用户权限：

   ```sql
   mysql -u root -p
   SHOW GRANTS FOR 'anti_theft_user'@'localhost';
   ```

3. 重新授权：

   ```sql
   GRANT ALL PRIVILEGES ON character_card_anti_theft.* TO 'anti_theft_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

#### 问题 4：无法访问 API

**现象**：浏览器显示 "无法访问此网站"

**解决方法**：

1. 检查服务是否运行：

   ```bash
   # Docker
   docker-compose ps
   
   # Windows 原生
   pm2 status
   ```

2. 检查防火墙：

   ```bash
   # Linux
   sudo ufw allow 3000/tcp
   
   # Windows
   New-NetFirewallRule -DisplayName "Anti-Theft API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

3. 测试本地连接：

   ```bash
   curl http://localhost:3000/health
   ```

#### 问题 5：数据库初始化失败

**现象**：

```
Error: Table 'users' doesn't exist
```

**解决方法**：

1. 手动运行初始化脚本：

   ```bash
   # Docker
   docker-compose exec api npm run db:init
   
   # Windows 原生
   npm run db:init
   ```

2. 如果仍然失败，手动导入 schema：

   ```bash
   mysql -u anti_theft_user -p character_card_anti_theft < scripts/schema.sql
   ```

#### 问题 6：JWT 验证失败

**现象**：

```
Error: invalid signature
```

**解决方法**：

1. 检查 JWT_SECRET 是否一致
2. 清除客户端 token 缓存
3. 重新生成 JWT_SECRET：

   ```bash
   # 生成新密钥
   openssl rand -hex 64
   
   # 更新 .env 文件
   JWT_SECRET=<新密钥>
   
   # 重启服务
   ```

#### 问题 7：CORS 错误

**现象**：

```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**解决方法**：

1. 更新 `.env` 文件中的 CORS_ORIGINS：

   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
   ```

2. 重启服务

#### 问题 8：内存不足

**现象**：

```
JavaScript heap out of memory
```

**解决方法**：

1. 增加 Node.js 内存限制：

   ```bash
   # Docker: 编辑 docker-compose.yml
   environment:
     - NODE_OPTIONS=--max-old-space-size=4096
   
   # PM2: 使用 node-args
   pm2 start src/server.js --name anti-theft-api --node-args="--max-old-space-size=4096"
   ```

2. 优化数据库查询
3. 启用缓存

#### 问题 9：日志文件过大

**现象**：磁盘空间不足

**解决方法**：

1. 配置日志轮转（已在代码中实现）
2. 手动清理旧日志：

   ```bash
   # Docker
   docker-compose exec api sh -c "find logs -name '*.log' -mtime +7 -delete"
   
   # Windows
   Get-ChildItem logs\*.log | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
   ```

#### 问题 10：PM2 进程崩溃

**现象**：

```
pm2 status 显示 errored 或 stopped
```

**解决方法**：

1. 查看错误日志：

   ```powershell
   pm2 logs anti-theft-api --err
   ```

2. 检查 `.env` 配置
3. 验证数据库连接
4. 重启进程：

   ```powershell
   pm2 restart anti-theft-api
   ```

### 调试技巧

#### 启用调试模式

```bash
# 设置环境变量
export DEBUG=*

# 或在 .env 中添加
LOG_LEVEL=debug

# 重启服务
```

#### 查看详细日志

```bash
# Docker
docker-compose logs -f --tail=100 api

# PM2
pm2 logs anti-theft-api --lines 100
```

#### 数据库调试

```sql
-- 查看当前连接
SHOW PROCESSLIST;

-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 查看表结构
DESCRIBE users;
DESCRIBE character_cards;

-- 检查数据
SELECT * FROM users LIMIT 10;
SELECT * FROM character_cards LIMIT 10;
```

#### 网络调试

```bash
# 测试端口连接
telnet localhost 3000

# 测试 API 端点
curl -v http://localhost:3000/health

# 查看网络连接
netstat -an | grep 3000
```

### 性能问题排查

#### CPU 使用率过高

1. 查看进程资源使用：

   ```bash
   # Docker
   docker stats
   
   # PM2
   pm2 monit
   ```

2. 分析慢查询
3. 优化数据库索引
4. 启用缓存

#### 内存泄漏

1. 监控内存使用趋势
2. 使用 Node.js 内存分析工具
3. 定期重启服务（临时方案）

#### 响应时间慢

1. 检查数据库查询性能
2. 启用查询缓存
3. 优化 API 端点
4. 使用 CDN 加速静态资源

---

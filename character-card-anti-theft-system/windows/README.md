# Windows 原生部署教程（零基础版）

## 📖 这是什么？

这是在 Windows 系统上直接安装角色卡防盗系统的教程。与 Docker 部署不同，这种方式直接在您的电脑上运行，就像安装普通软件一样。

**简单来说**：需要先安装两个软件（Node.js 和 MySQL），然后运行一个脚本就能自动配置好一切！

## ✨ 为什么选择这种方式？

- **性能更好**：直接运行在系统上，速度最快
- **占用资源少**：不需要 Docker，省内存
- **便于调试**：可以直接查看日志和进程
- **启动更快**：无需等待容器启动

## ⚠️ 注意事项

- 这种方式**只适用于 Windows 系统**
- 需要手动安装 Node.js 和 MySQL（下面会教您）
- 如果您想要最简单的方式，建议选择 Docker 部署

## ✅ 我需要什么？

### 电脑配置要求

**最低要求**（能用）：
- Windows 10 或 Windows 11
- 双核处理器
- 4GB 内存
- 10GB 硬盘空间

**推荐配置**（更流畅）：
- Windows 11
- 四核处理器
- 8GB 内存或更多
- 20GB 硬盘空间

## 📥 第一步：安装必需软件

在运行安装脚本之前，您需要先安装两个软件。别担心，我会一步步教您！

### 1. 安装 Node.js（JavaScript 运行环境）

**这是什么？** Node.js 是运行服务器程序的环境，就像 Windows 是运行软件的环境一样。

**怎么安装？**

1. **打开浏览器，访问**：<https://nodejs.org/>

2. **下载安装包**
   - 您会看到两个绿色按钮
   - 点击左边的按钮（写着 "LTS" 的那个）
   - 这会下载一个 .msi 文件

3. **运行安装程序**
   - 双击下载的文件
   - 一直点"下一步"（使用默认设置就好）
   - 等待安装完成

4. **验证安装成功**
   - 按键盘上的 `Win + R` 键
   - 输入 `powershell`，按回车
   - 在打开的窗口中输入：`node --version`
   - 如果显示类似 `v18.20.0` 的版本号，说明安装成功！

### 2. 安装 MySQL（数据库）

**这是什么？** MySQL 是用来存储数据的数据库，就像一个电子文件柜。

**怎么安装？**

1. **打开浏览器，访问**：<https://dev.mysql.com/downloads/installer/>

2. **下载安装包**
   - 点击第一个下载链接（较大的那个，约 400MB）
   - 在新页面点击 "No thanks, just start my download"

3. **运行安装程序**
   - 双击下载的文件
   - 选择 "Developer Default"（开发者默认）
   - 点击 "Next"（下一步）

4. **安装组件**
   - 安装程序会下载并安装所需组件
   - 这可能需要几分钟，请耐心等待

5. **配置 MySQL**
   - 在 "Type and Networking" 页面，保持默认设置，点击 "Next"
   - 在 "Authentication Method" 页面，选择第一个选项，点击 "Next"
   - **重要**：在 "Accounts and Roles" 页面，设置 root 密码
     - 输入一个您能记住的密码（比如：MyPassword123）
     - **请务必记住这个密码，后面会用到！**
   - 继续点击 "Next" 直到安装完成

6. **验证安装成功**
   - 按 `Win + R`，输入 `services.msc`，按回车
   - 在服务列表中找到 "MySQL80"（或类似名称）
   - 确认状态是"正在运行"

### 3. Git（可选）

如果您想方便地更新系统，可以安装 Git：
- 访问：<https://git-scm.com/download/win>
- 下载并安装（一直点"下一步"即可）



## 🚀 第二步：下载项目文件

### 方法一：使用 Git（如果您安装了 Git）

1. 按 `Win + R`，输入 `powershell`，按回车
2. 输入以下命令（复制粘贴即可）：
   ```powershell
   git clone <项目地址>
   cd <项目文件夹名>
   ```

### 方法二：直接下载（推荐新手）

1. 在项目页面找到绿色的 "Code" 按钮
2. 点击 "Download ZIP"
3. 下载完成后，解压到一个您能找到的位置（比如桌面或 D 盘）
4. 记住这个文件夹的位置！

## 🎯 第三步：运行安装脚本

这是最关键的一步，但也很简单！

### 1. 以管理员身份打开 PowerShell

**什么是"以管理员身份"？** 就是给程序更高的权限，类似于手机上的"允许"按钮。

**怎么做？**
1. 按键盘上的 `Win + X` 键（同时按）
2. 在弹出的菜单中选择：
   - "Windows PowerShell (管理员)" 或
   - "终端 (管理员)" 或
   - "Windows Terminal (管理员)"
3. 如果弹出"是否允许此应用对您的设备进行更改"，点击"是"

### 2. 进入项目文件夹

在 PowerShell 窗口中输入（根据您的实际路径修改）：

```powershell
cd "C:\您解压的路径\character-card-anti-theft-system\windows"
```

**举例**：
- 如果您解压到桌面：
  ```powershell
  cd "C:\Users\您的用户名\Desktop\anti-theft-system\character-card-anti-theft-system\windows"
  ```
- 如果您解压到 D 盘：
  ```powershell
  cd "D:\anti-theft-system\character-card-anti-theft-system\windows"
  ```

**小技巧**：您可以直接在文件资源管理器中打开这个文件夹，然后在地址栏复制路径！

### 3. 允许脚本运行（首次需要）

输入以下命令：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

如果询问是否确认，输入 `Y` 然后按回车。

### 4. 运行安装脚本

输入：

```powershell
.\windows-install.ps1
```

然后按回车，脚本就开始运行了！

## ⏳ 第四步：按照提示完成配置

脚本运行后，会问您一些问题。别紧张，大部分可以直接按回车使用默认值！

### 脚本会做什么？

1. ✅ 检查 Node.js 和 MySQL 是否已安装
2. ✅ 询问一些配置信息
3. ✅ 自动安装所需的程序包
4. ✅ 创建数据库和表
5. ✅ 启动服务
6. ✅ 检查服务是否正常运行

### 会问您什么问题？

1. **MySQL Root 密码**
   - 就是您刚才安装 MySQL 时设置的密码
   - 输入后按回车（输入时看不到字符是正常的）

2. **数据库名称**
   - 默认是 `anti_theft_db`
   - 直接按回车就好

3. **数据库用户名**
   - 默认是 `anti_theft_user`
   - 直接按回车就好

4. **数据库密码**
   - 脚本会自动生成一个安全的密码
   - 直接按回车使用自动生成的密码

5. **服务器端口**
   - 默认是 `3000`
   - 直接按回车就好

6. **是否配置防火墙**
   - 建议选择 `Y`（是）
   - 这样其他设备也能访问

7. **是否创建桌面快捷方式**
   - 随您喜好，选 `Y` 或 `N` 都可以

### 等待安装完成

- 您会看到很多文字在屏幕上滚动，这是正常的
- 第一次安装可能需要几分钟
- 请耐心等待，不要关闭窗口
- 看到 "✅ 安装成功！" 就表示完成了

## 🎉 第五步：开始使用

安装完成后，打开浏览器访问：

- **管理界面**：<http://localhost>
- **API 服务**：<http://localhost:3000>

### 首次使用指南

1. **注册账号**
   - 打开 <http://localhost>
   - 点击"注册"按钮
   - 填写用户名、邮箱和密码
   - 点击"注册"

2. **登录系统**
   - 使用刚才注册的账号登录

3. **创建第一个角色卡**
   - 登录后，点击"创建角色卡"
   - 填写角色卡信息
   - 设置一个保护密码
   - 点击"保存"

4. **验证角色卡**
   - 当有人想使用您的角色卡时
   - 他们需要输入角色卡 ID 和密码
   - 验证通过后才能使用



## 配置文件

安装完成后，会在项目根目录生成 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=anti_theft_user
DB_PASSWORD=your_database_password
DB_NAME=anti_theft_db
DB_PORT=3306

# 服务器配置
SERVER_PORT=3000
NODE_ENV=production

# JWT 配置
JWT_SECRET=your_generated_jwt_secret

# CORS 配置
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### 修改配置

如需修改配置：

1. 编辑 `.env` 文件
2. 重启服务：
   ```powershell
   pm2 restart anti-theft-api
   ```

## 服务管理

### 使用 PM2 管理服务

安装脚本会使用 PM2 作为进程管理器。常用命令：

#### 查看服务状态
```powershell
pm2 status
```

#### 查看日志
```powershell
# 实时查看所有日志
pm2 logs anti-theft-api

# 查看错误日志
pm2 logs anti-theft-api --err

# 查看最近 100 行日志
pm2 logs anti-theft-api --lines 100
```

#### 重启服务
```powershell
pm2 restart anti-theft-api
```

#### 停止服务
```powershell
pm2 stop anti-theft-api
```

#### 启动服务
```powershell
pm2 start anti-theft-api
```

#### 删除服务
```powershell
pm2 delete anti-theft-api
```

### 配置开机自启动

安装脚本会自动配置 PM2 开机自启动。如需手动配置：

```powershell
# 保存当前 PM2 进程列表
pm2 save

# 生成开机启动脚本
pm2 startup
```

按照提示执行生成的命令（需要管理员权限）。



## 验证安装

### 1. 检查服务状态

```powershell
pm2 status
```

应该看到 `anti-theft-api` 状态为 `online`。

### 2. 测试 API 端点

#### 健康检查
```powershell
curl http://localhost:3000/health
```

预期响应：
```json
{
  "status": "ok",
  "database": "connected"
}
```

#### 测试注册接口
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "testpassword123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 3. 检查数据库

```powershell
# 登录 MySQL
mysql -u anti_theft_user -p

# 查看数据库
SHOW DATABASES;
USE anti_theft_db;
SHOW TABLES;
```

应该看到 `users` 和 `character_cards` 表。

## 故障排查

### 问题 1：Node.js 未安装或版本过低

**错误信息**：
```
Node.js 未安装或版本过低
```

**解决方法**：
1. 访问 https://nodejs.org/
2. 下载并安装 LTS 版本（18.x 或更高）
3. 重新运行安装脚本

### 问题 2：MySQL 未安装或服务未运行

**错误信息**：
```
MySQL 服务未运行
```

**解决方法**：
1. 检查 MySQL 服务状态：
   ```powershell
   Get-Service MySQL*
   ```
2. 如果服务已停止，启动服务：
   ```powershell
   Start-Service MySQL80  # 服务名可能不同
   ```
3. 如果未安装，访问 https://dev.mysql.com/downloads/installer/

### 问题 3：数据库连接失败

**错误信息**：
```
数据库连接失败: Access denied for user
```

**解决方法**：
1. 检查 MySQL root 密码是否正确
2. 手动创建数据库用户：
   ```sql
   mysql -u root -p
   CREATE USER 'anti_theft_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON anti_theft_db.* TO 'anti_theft_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. 更新 `.env` 文件中的数据库密码
4. 重启服务

### 问题 4：端口被占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方法**：

**方法 1：更改端口**
1. 编辑 `.env` 文件，修改 `SERVER_PORT`
2. 重启服务

**方法 2：释放端口**
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

### 问题 5：PM2 命令不可用

**错误信息**：
```
pm2 : 无法将"pm2"项识别为 cmdlet、函数、脚本文件或可运行程序的名称
```

**解决方法**：
1. 全局安装 PM2：
   ```powershell
   npm install -g pm2
   ```
2. 重启 PowerShell
3. 验证安装：
   ```powershell
   pm2 --version
   ```

### 问题 6：权限不足

**错误信息**：
```
拒绝访问
```

**解决方法**：
1. 以**管理员身份**运行 PowerShell
2. 右键点击 PowerShell 图标 → "以管理员身份运行"
3. 重新执行安装脚本



## 卸载

### 使用卸载脚本

运行 `windows-uninstall.ps1` 脚本：

```powershell
# 以管理员身份运行
cd path\to\anti-theft-server\deploy
.\windows-uninstall.ps1
```

卸载脚本会：
1. 停止并删除 PM2 进程
2. 删除数据库和用户（可选）
3. 删除防火墙规则
4. 删除桌面快捷方式
5. 清理日志文件（可选）

### 手动卸载

如果卸载脚本不可用，可以手动卸载：

#### 1. 停止服务
```powershell
pm2 stop anti-theft-api
pm2 delete anti-theft-api
pm2 save
```

#### 2. 删除数据库（可选）
```sql
mysql -u root -p
DROP DATABASE anti_theft_db;
DROP USER 'anti_theft_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. 删除防火墙规则
```powershell
Remove-NetFirewallRule -DisplayName "Anti-Theft API Server"
```

#### 4. 删除项目文件
```powershell
cd ..
Remove-Item -Recurse -Force anti-theft-server
```

## 日常维护

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

# 清理应用日志（手动）
Remove-Item logs\*.log
```

### 数据库备份

#### 手动备份
```powershell
# 创建备份目录
New-Item -ItemType Directory -Force -Path backups

# 备份数据库
mysqldump -u anti_theft_user -p anti_theft_db > backups\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

#### 恢复备份
```powershell
mysql -u anti_theft_user -p anti_theft_db < backups\backup_20240115_120000.sql
```

#### 自动备份（使用任务计划程序）

1. 创建备份脚本 `backup.ps1`：
```powershell
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupPath = "C:\backups\anti_theft_db_$timestamp.sql"
mysqldump -u anti_theft_user -p"your_password" anti_theft_db > $backupPath

# 删除 7 天前的备份
Get-ChildItem "C:\backups\anti_theft_db_*.sql" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item
```

2. 创建计划任务：
```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "Anti-Theft DB Backup" -Action $action -Trigger $trigger
```

### 更新应用

#### 从 Git 更新
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

#### 手动更新
1. 停止服务
2. 备份当前代码和数据库
3. 替换代码文件
4. 运行 `npm install --production`
5. 更新数据库结构（如果需要）
6. 重启服务



## 性能优化

### 1. 数据库优化

#### 配置 MySQL 性能参数

编辑 MySQL 配置文件（通常在 `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`）：

```ini
[mysqld]
# 连接池大小
max_connections=200

# 缓冲池大小（设置为系统内存的 50-70%）
innodb_buffer_pool_size=2G

# 查询缓存
query_cache_size=64M
query_cache_type=1

# 日志设置
slow_query_log=1
slow_query_log_file="slow-query.log"
long_query_time=2
```

重启 MySQL 服务：
```powershell
Restart-Service MySQL80
```

#### 创建索引

确保关键字段已建立索引：
```sql
USE anti_theft_db;

-- 检查现有索引
SHOW INDEX FROM users;
SHOW INDEX FROM character_cards;

-- 如果缺少索引，手动创建
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_card_id ON character_cards(card_id);
```

### 2. Node.js 性能优化

#### 增加 PM2 实例数（集群模式）

```powershell
# 停止当前实例
pm2 delete anti-theft-api

# 以集群模式启动（使用所有 CPU 核心）
pm2 start src/server.js --name anti-theft-api -i max

# 或指定实例数
pm2 start src/server.js --name anti-theft-api -i 4
```

#### 配置内存限制

```powershell
pm2 start src/server.js --name anti-theft-api --max-memory-restart 500M
```

### 3. 系统优化

#### 增加文件描述符限制

Windows 通常不需要手动配置，但可以优化注册表：

```powershell
# 增加 TCP 连接数限制（需要管理员权限）
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" -Name "TcpNumConnections" -Value 16777214
```

## 安全加固

### 1. 防火墙配置

#### 仅允许特定 IP 访问

```powershell
# 删除现有规则
Remove-NetFirewallRule -DisplayName "Anti-Theft API Server"

# 添加限制 IP 的规则
New-NetFirewallRule -DisplayName "Anti-Theft API Server" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 3000 `
    -Action Allow `
    -RemoteAddress 192.168.1.0/24
```

### 2. 使用 HTTPS

#### 方法 1：使用 Nginx 反向代理

1. 安装 Nginx for Windows：https://nginx.org/en/download.html

2. 配置 Nginx（`nginx.conf`）：
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate C:/nginx/ssl/cert.pem;
    ssl_certificate_key C:/nginx/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. 启动 Nginx：
```powershell
cd C:\nginx
start nginx
```

#### 方法 2：使用 Node.js HTTPS

修改 `src/server.js` 添加 HTTPS 支持（需要 SSL 证书）。

### 3. 环境变量安全

#### 加密敏感配置

不要在 `.env` 文件中存储明文密码。使用 Windows 凭据管理器：

```powershell
# 存储密码
cmdkey /generic:anti-theft-db /user:anti_theft_user /pass:your_password

# 在代码中读取
# 需要使用 node-keytar 或类似库
```

### 4. 定期更新

```powershell
# 更新 npm 包
npm outdated
npm update

# 检查安全漏洞
npm audit
npm audit fix
```

### 5. 限制数据库权限

```sql
-- 撤销不必要的权限
REVOKE ALL PRIVILEGES ON *.* FROM 'anti_theft_user'@'localhost';

-- 仅授予必要权限
GRANT SELECT, INSERT, UPDATE, DELETE ON anti_theft_db.* TO 'anti_theft_user'@'localhost';
FLUSH PRIVILEGES;
```



## 监控

### 1. PM2 监控

#### 实时监控
```powershell
pm2 monit
```

显示：
- CPU 使用率
- 内存使用
- 日志输出

#### Web 监控面板

```powershell
# 安装 PM2 Plus（可选）
pm2 install pm2-server-monit

# 或使用 PM2 Web
pm2 web
```

访问 http://localhost:9615 查看监控面板。

### 2. 性能监控

#### 使用 Windows 性能监视器

1. 打开"性能监视器"（perfmon）
2. 添加计数器：
   - 处理器 → % Processor Time
   - 内存 → Available MBytes
   - 网络接口 → Bytes Total/sec

#### 使用 PM2 指标

```powershell
# 查看详细指标
pm2 describe anti-theft-api

# 查看内存使用
pm2 list
```

### 3. 日志监控

#### 实时监控错误日志

```powershell
Get-Content logs\error.log -Wait -Tail 20
```

#### 设置日志告警

创建 PowerShell 脚本 `monitor-errors.ps1`：

```powershell
$errorLog = "logs\error.log"
$lastSize = 0

while ($true) {
    $currentSize = (Get-Item $errorLog).Length
    
    if ($currentSize -gt $lastSize) {
        $newErrors = Get-Content $errorLog -Tail 10
        
        # 检查关键错误
        if ($newErrors -match "FATAL|CRITICAL") {
            # 发送邮件或通知
            Write-Host "检测到严重错误！" -ForegroundColor Red
            # Send-MailMessage -To "admin@example.com" -Subject "服务器错误" -Body $newErrors
        }
    }
    
    $lastSize = $currentSize
    Start-Sleep -Seconds 60
}
```

### 4. 数据库监控

```sql
-- 查看当前连接
SHOW PROCESSLIST;

-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 查看表大小
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'anti_theft_db'
ORDER BY (data_length + index_length) DESC;
```

## 常见问题 (FAQ)

### Q1: 如何更改服务器端口？

**A:** 编辑 `.env` 文件，修改 `SERVER_PORT` 值，然后重启服务：
```powershell
pm2 restart anti-theft-api
```

### Q2: 如何重置数据库？

**A:** 
```powershell
# 停止服务
pm2 stop anti-theft-api

# 重新初始化数据库
npm run db:init

# 启动服务
pm2 start anti-theft-api
```

### Q3: 如何查看服务是否正常运行？

**A:** 
```powershell
# 检查 PM2 状态
pm2 status

# 测试 API
curl http://localhost:3000/health
```

### Q4: 服务占用内存过高怎么办？

**A:** 
```powershell
# 重启服务释放内存
pm2 restart anti-theft-api

# 设置内存限制
pm2 delete anti-theft-api
pm2 start src/server.js --name anti-theft-api --max-memory-restart 500M
```

### Q5: 如何启用 HTTPS？

**A:** 推荐使用 Nginx 反向代理，参考"安全加固"章节的 HTTPS 配置。

### Q6: 数据库连接数过多怎么办？

**A:** 
```sql
-- 查看当前连接
SHOW PROCESSLIST;

-- 杀死空闲连接
KILL <process_id>;

-- 增加最大连接数（my.ini）
max_connections=200
```

### Q7: 如何迁移到另一台服务器？

**A:** 
1. 在新服务器上运行安装脚本
2. 在旧服务器上备份数据库
3. 在新服务器上恢复数据库
4. 复制 `.env` 文件
5. 启动服务

### Q8: PM2 开机自启动失败？

**A:** 
```powershell
# 重新配置自启动
pm2 unstartup
pm2 startup
pm2 save

# 或使用 Windows 任务计划程序
$action = New-ScheduledTaskAction -Execute "pm2" -Argument "resurrect"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "PM2 Startup" -Action $action -Trigger $trigger -RunLevel Highest
```

### Q9: 如何查看详细的错误信息？

**A:** 
```powershell
# 查看 PM2 错误日志
pm2 logs anti-theft-api --err

# 查看应用错误日志
Get-Content logs\error.log -Tail 50

# 启用调试模式
$env:DEBUG="*"
pm2 restart anti-theft-api
```

### Q10: 服务启动后立即崩溃？

**A:** 
1. 检查 `.env` 配置是否正确
2. 检查数据库连接
3. 查看错误日志：`pm2 logs anti-theft-api --err`
4. 验证 Node.js 版本：`node --version`（需要 18.x+）



## 最佳实践

### 1. 开发环境 vs 生产环境

#### 开发环境配置
```env
NODE_ENV=development
LOG_LEVEL=debug
SERVER_PORT=3000
```

#### 生产环境配置
```env
NODE_ENV=production
LOG_LEVEL=info
SERVER_PORT=3000
```

### 2. 定期维护计划

| 任务       | 频率   | 说明                 |
| ---------- | ------ | -------------------- |
| 数据库备份 | 每天   | 自动备份，保留 7 天  |
| 日志清理   | 每周   | 清理超过 30 天的日志 |
| 依赖更新   | 每月   | 检查并更新 npm 包    |
| 安全审计   | 每月   | 运行 `npm audit`     |
| 性能检查   | 每季度 | 检查慢查询和资源使用 |

### 3. 备份策略

#### 完整备份脚本

创建 `full-backup.ps1`：

```powershell
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = "C:\backups\anti-theft-$timestamp"

# 创建备份目录
New-Item -ItemType Directory -Force -Path $backupDir

# 备份数据库
Write-Host "备份数据库..." -ForegroundColor Green
mysqldump -u anti_theft_user -p"$env:DB_PASSWORD" anti_theft_db > "$backupDir\database.sql"

# 备份配置文件
Write-Host "备份配置文件..." -ForegroundColor Green
Copy-Item ".env" "$backupDir\.env"

# 备份日志（最近 7 天）
Write-Host "备份日志..." -ForegroundColor Green
Get-ChildItem "logs\*.log" | 
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) } | 
    Copy-Item -Destination $backupDir

# 压缩备份
Write-Host "压缩备份..." -ForegroundColor Green
Compress-Archive -Path $backupDir -DestinationPath "$backupDir.zip"
Remove-Item -Recurse -Force $backupDir

# 清理旧备份（保留最近 30 天）
Get-ChildItem "C:\backups\anti-theft-*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item

Write-Host "备份完成: $backupDir.zip" -ForegroundColor Green
```

### 4. 安全检查清单

- [ ] 已更改默认数据库密码
- [ ] JWT_SECRET 使用强随机字符串
- [ ] 已配置防火墙规则
- [ ] 已启用 HTTPS（生产环境）
- [ ] 已限制数据库用户权限
- [ ] 已配置日志轮转
- [ ] 已设置自动备份
- [ ] 已更新所有依赖到最新版本
- [ ] 已运行 `npm audit` 检查漏洞
- [ ] 已配置 CORS 白名单

### 5. 性能调优建议

#### 数据库连接池配置

编辑 `src/db/connection.js`：

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,      // 根据负载调整
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```

#### PM2 集群配置

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'anti-theft-api',
    script: './src/server.js',
    instances: 'max',        // 使用所有 CPU 核心
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

使用配置文件启动：
```powershell
pm2 start ecosystem.config.js
```

## 与 Docker 部署对比

| 特性           | Windows 原生部署 | Docker 部署 |
| -------------- | ---------------- | ----------- |
| **性能**       | ⭐⭐⭐⭐⭐ 最优       | ⭐⭐⭐⭐ 良好   |
| **资源占用**   | ⭐⭐⭐⭐⭐ 最少       | ⭐⭐⭐ 中等    |
| **安装复杂度** | ⭐⭐⭐ 中等         | ⭐⭐⭐⭐ 简单   |
| **维护难度**   | ⭐⭐⭐ 中等         | ⭐⭐⭐⭐⭐ 简单  |
| **调试便利性** | ⭐⭐⭐⭐⭐ 最佳       | ⭐⭐⭐ 一般    |
| **环境隔离**   | ⭐⭐ 较差          | ⭐⭐⭐⭐⭐ 最佳  |
| **跨平台**     | ❌ 仅 Windows     | ✅ 全平台    |
| **启动速度**   | ⭐⭐⭐⭐⭐ 最快       | ⭐⭐⭐ 较慢    |

### 选择建议

**选择 Windows 原生部署，如果：**
- 只在 Windows 环境运行
- 需要最佳性能
- 需要频繁调试
- 资源有限（内存 < 8GB）

**选择 Docker 部署，如果：**
- 需要跨平台部署
- 需要环境隔离
- 需要快速部署多个实例
- 团队熟悉 Docker

## 附录

### A. 完整的环境变量列表

```env
# ==================== 数据库配置 ====================
DB_HOST=localhost                    # 数据库主机地址
DB_USER=anti_theft_user             # 数据库用户名
DB_PASSWORD=your_secure_password    # 数据库密码
DB_NAME=anti_theft_db               # 数据库名称
DB_PORT=3306                        # 数据库端口

# ==================== 服务器配置 ====================
SERVER_PORT=3000                    # API 服务器端口
NODE_ENV=production                 # 运行环境 (development/production)
HOST=0.0.0.0                       # 监听地址

# ==================== JWT 配置 ====================
JWT_SECRET=your_jwt_secret_key      # JWT 密钥（至少 32 字符）
JWT_EXPIRES_IN=7d                   # Token 过期时间

# ==================== CORS 配置 ====================
CORS_ORIGINS=http://localhost:5173,http://localhost:3000  # 允许的来源

# ==================== 日志配置 ====================
LOG_LEVEL=info                      # 日志级别 (debug/info/warn/error)
LOG_FILE_PATH=./logs               # 日志文件路径
LOG_MAX_SIZE=10m                   # 单个日志文件最大大小
LOG_MAX_FILES=7d                   # 日志保留天数

# ==================== 速率限制配置 ====================
RATE_LIMIT_WINDOW_MS=60000         # 速率限制时间窗口（毫秒）
RATE_LIMIT_MAX_REQUESTS=10         # 时间窗口内最大请求数

# ==================== 其他配置 ====================
BCRYPT_SALT_ROUNDS=12              # bcrypt 加密轮数
```

### B. 常用命令速查表

```powershell
# ==================== PM2 命令 ====================
pm2 start src/server.js --name anti-theft-api    # 启动服务
pm2 stop anti-theft-api                          # 停止服务
pm2 restart anti-theft-api                       # 重启服务
pm2 delete anti-theft-api                        # 删除服务
pm2 logs anti-theft-api                          # 查看日志
pm2 monit                                        # 实时监控
pm2 status                                       # 查看状态
pm2 save                                         # 保存进程列表
pm2 resurrect                                    # 恢复进程列表

# ==================== MySQL 命令 ====================
mysql -u root -p                                 # 登录 MySQL
SHOW DATABASES;                                  # 显示数据库
USE anti_theft_db;                              # 切换数据库
SHOW TABLES;                                     # 显示表
DESCRIBE users;                                  # 查看表结构
SELECT * FROM users;                            # 查询数据

# ==================== 服务管理 ====================
Get-Service MySQL*                               # 查看 MySQL 服务
Start-Service MySQL80                            # 启动 MySQL
Stop-Service MySQL80                             # 停止 MySQL
Restart-Service MySQL80                          # 重启 MySQL

# ==================== 网络诊断 ====================
netstat -ano | findstr :3000                    # 查看端口占用
Test-NetConnection localhost -Port 3000         # 测试端口连接
curl http://localhost:3000/health               # 测试 API

# ==================== 防火墙 ====================
Get-NetFirewallRule -DisplayName "Anti-Theft*"  # 查看防火墙规则
New-NetFirewallRule -DisplayName "..." ...      # 添加规则
Remove-NetFirewallRule -DisplayName "..."       # 删除规则
```

### C. 相关资源

- **Node.js 官网**: https://nodejs.org/
- **MySQL 官网**: https://dev.mysql.com/
- **PM2 文档**: https://pm2.keymetrics.io/
- **Express 文档**: https://expressjs.com/
- **项目 GitHub**: [项目仓库地址]
- **问题反馈**: [Issues 地址]

### D. 技术支持

如遇到问题，请按以下顺序排查：

1. 查看本文档的"故障排查"章节
2. 查看 PM2 日志：`pm2 logs anti-theft-api --err`
3. 查看应用日志：`Get-Content logs\error.log -Tail 50`
4. 在 GitHub Issues 搜索类似问题
5. 提交新的 Issue（附带日志和错误信息）

---

**文档版本**: 1.0.0  
**最后更新**: 2024-01-15  
**适用版本**: Anti-Theft System v1.0.0+


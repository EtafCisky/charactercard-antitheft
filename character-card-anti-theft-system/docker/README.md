# Docker 一键部署教程（零基础版）

## 📖 这是什么？

这是一个使用 Docker 技术部署角色卡防盗系统的教程。Docker 就像一个"虚拟盒子"，把所有需要的软件都打包在一起，您只需要一条命令就能安装好整个系统。

**简单来说**：不需要懂技术，跟着步骤做就能成功！

## ✅ 我需要什么？

### 硬件要求

- 电脑配置：
  - CPU：双核或以上
  - 内存：至少 4GB（推荐 8GB）
  - 硬盘空间：至少 10GB 空闲空间

### 系统要求

- Windows 10/11（64位）
- macOS 10.15 或更高版本
- Linux（Ubuntu 20.04+、Debian 11+、CentOS 8+）

### 需要安装的软件

只需要安装 **Docker**，其他的都会自动安装！

## 📥 第一步：下载项目文件

### 方法一：使用 Git（推荐）

如果您电脑上有 Git：

**Windows**：
1. 按 `Win + R` 键，输入 `cmd`，按回车打开命令提示符
2. 输入以下命令（复制粘贴即可）：
   ```bash
   git clone <项目地址>
   cd <项目文件夹名>
   ```

**macOS/Linux**：
1. 打开"终端"应用
2. 输入以下命令：
   ```bash
   git clone <项目地址>
   cd <项目文件夹名>
   ```

### 方法二：直接下载压缩包

1. 在项目页面点击绿色的 "Code" 按钮
2. 选择 "Download ZIP"
3. 下载完成后，解压到您想要的位置
4. 记住这个文件夹的位置，待会要用

## 🐳 第二步：安装 Docker

### Windows 用户

1. **下载 Docker Desktop**
   - 访问：<https://www.docker.com/products/docker-desktop>
   - 点击 "Download for Windows"
   - 下载完成后，双击安装文件

2. **安装 Docker Desktop**
   - 按照安装向导的提示，一直点"下一步"
   - 安装完成后，重启电脑

3. **启动 Docker Desktop**
   - 在桌面或开始菜单找到 "Docker Desktop" 图标
   - 双击打开
   - 等待 Docker 启动（右下角图标变成绿色）

4. **验证安装**
   - 按 `Win + R`，输入 `powershell`，按回车
   - 输入命令：`docker --version`
   - 如果显示版本号，说明安装成功！

### macOS 用户

1. **下载 Docker Desktop**
   - 访问：<https://www.docker.com/products/docker-desktop>
   - 点击 "Download for Mac"
   - 根据您的芯片选择（Intel 或 Apple Silicon）

2. **安装 Docker Desktop**
   - 打开下载的 .dmg 文件
   - 将 Docker 图标拖到 Applications 文件夹
   - 在 Applications 中打开 Docker

3. **验证安装**
   - 打开"终端"应用
   - 输入命令：`docker --version`
   - 如果显示版本号，说明安装成功！

### Linux 用户

打开终端，运行以下命令：

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 验证安装
docker --version
```

## 🚀 第三步：运行安装命令

现在是最关键的一步，但也是最简单的！

### Windows 用户

1. **以管理员身份打开 PowerShell**
   - 按 `Win + X` 键
   - 选择 "Windows PowerShell (管理员)" 或 "终端 (管理员)"

2. **进入项目文件夹**
   ```powershell
   cd "C:\您下载的项目路径\character-card-anti-theft-system\docker"
   ```
   
   例如：
   ```powershell
   cd "C:\Users\YourName\Downloads\anti-theft-system\character-card-anti-theft-system\docker"
   ```

3. **允许脚本运行**（首次需要）
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **运行安装脚本**
   ```powershell
   .\docker-install.ps1
   ```

### macOS/Linux 用户

1. **打开终端**

2. **进入项目文件夹**
   ```bash
   cd ~/Downloads/anti-theft-system/character-card-anti-theft-system/docker
   ```
   （根据您的实际路径修改）

3. **给脚本添加执行权限**
   ```bash
   chmod +x docker-install.sh
   ```

4. **运行安装脚本**
   ```bash
   ./docker-install.sh
   ```

## ⏳ 第四步：等待安装完成

运行脚本后，您会看到：

1. **检查 Docker 是否运行**
   - 如果 Docker 没启动，脚本会提示您先启动 Docker

2. **收集配置信息**
   - 脚本会问您一些问题（比如数据库密码）
   - 大部分可以直接按回车使用默认值
   - 脚本会自动生成安全的随机密码

3. **下载和安装**
   - 第一次运行会下载一些文件（可能需要几分钟）
   - 您会看到很多文字滚动，这是正常的
   - 请耐心等待，不要关闭窗口

4. **启动服务**
   - 脚本会自动启动所有服务
   - 并检查服务是否正常运行

5. **完成提示**
   - 看到 "✅ 安装成功！" 就表示完成了
   - 脚本会告诉您访问地址

## 🎉 第五步：开始使用

安装完成后，打开浏览器访问：

- **管理界面**：<http://localhost>
- **API 服务**：<http://localhost:3000>

### 首次使用

1. 打开 <http://localhost>
2. 点击"注册"创建账号
3. 登录后就可以开始管理您的角色卡了！

### 创建第一个角色卡

1. 登录后，点击"创建角色卡"
2. 填写角色卡信息
3. 设置一个密码（用于保护这个角色卡）
4. 点击"保存"

### 验证角色卡

当有人想使用您的角色卡时：
1. 他们需要访问验证页面
2. 输入角色卡 ID 和密码
3. 验证通过后才能使用

## 🔧 常用操作

### 查看服务状态

```bash
docker compose ps
```

### 查看日志（如果出问题）

```bash
# 查看所有日志
docker compose logs

# 只看最近的日志
docker compose logs --tail=50

# 实时查看日志
docker compose logs -f
```

### 停止服务

```bash
docker compose stop
```

### 重新启动服务

```bash
docker compose start
```

### 完全重启

```bash
docker compose restart
```

## ❓ 常见问题

### 问题 1：Docker 没有启动

**现象**：运行脚本时提示 "Docker 未运行"

**解决方法**：
- Windows/macOS：打开 Docker Desktop 应用，等待启动完成
- Linux：运行 `sudo systemctl start docker`

### 问题 2：端口被占用

**现象**：提示 "端口 80 或 3000 已被占用"

**解决方法**：
1. 找出占用端口的程序并关闭
2. 或者修改 `docker-compose.yml` 文件中的端口号

Windows 查看端口占用：
```powershell
netstat -ano | findstr :80
netstat -ano | findstr :3000
```

### 问题 3：无法访问网页

**现象**：浏览器打开 <http://localhost> 显示无法访问

**解决方法**：
1. 检查服务是否启动：`docker compose ps`
2. 查看日志找错误：`docker compose logs`
3. 尝试重启服务：`docker compose restart`
4. 确认防火墙没有阻止访问

### 问题 4：安装很慢

**现象**：下载文件很慢或卡住

**解决方法**：
- 这是正常的，第一次安装需要下载较多文件
- 请耐心等待，不要中断
- 如果长时间没反应，可以按 `Ctrl+C` 停止，然后重新运行

### 问题 5：权限错误

**Windows**：
- 确保以管理员身份运行 PowerShell

**Linux**：
- 确保您的用户在 docker 组中：`sudo usermod -aG docker $USER`
- 然后重新登录

## 🗑️ 如何卸载

如果您想卸载系统：

### Windows

```powershell
cd "项目路径\character-card-anti-theft-system\docker"
.\docker-uninstall.ps1
```

### macOS/Linux

```bash
cd ~/项目路径/character-card-anti-theft-system/docker
./docker-uninstall.sh
```

**⚠️ 警告**：卸载会删除所有数据，包括您创建的角色卡！请提前备份重要数据。

## 💾 备份数据

### 备份数据库

```bash
docker compose exec db mysqldump -u root -p角色卡防盗系统 > backup.sql
```

### 恢复数据库

```bash
docker compose exec -T db mysql -u root -p角色卡防盗系统 < backup.sql
```

## 🆘 需要帮助？

如果您遇到问题：

1. **查看本文档的"常见问题"部分**
2. **查看日志**：`docker compose logs`
3. **重启试试**：`docker compose restart`
4. **完全重装**：先卸载，再重新安装
5. **寻求帮助**：在项目 Issues 中提问

提问时请提供：
- 您的操作系统和版本
- 错误信息截图
- 日志内容（`docker compose logs`）

## 📚 进阶操作

### 修改配置

配置文件位于 `.env`，您可以修改：
- 数据库密码
- 服务端口
- JWT 密钥等

修改后需要重启服务：
```bash
docker compose down
docker compose up -d
```

### 查看容器内部

```bash
# 进入 API 容器
docker compose exec api sh

# 进入数据库容器
docker compose exec db mysql -u root -p
```

### 更新到新版本

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build
```

## ✨ 小贴士

- 第一次安装会比较慢，请耐心等待
- 安装完成后，以后启动会很快
- 建议定期备份数据库
- 生产环境建议启用 HTTPS
- 记得修改默认密码

## 📝 总结

恭喜您完成安装！现在您可以：

1. ✅ 访问 <http://localhost> 使用管理界面
2. ✅ 创建和管理角色卡
3. ✅ 为角色卡设置密码保护
4. ✅ 验证角色卡的合法性

祝您使用愉快！🎉

# 快速开始指南

本指南帮助你快速设置和运行 SillyTavern 角色卡防盗系统服务器。

## 前置要求

- Node.js 18.0 或更高版本
- MySQL 8.0 或 MariaDB 10.6+
- npm 或 yarn

## 5 分钟快速设置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的数据库配置
# 必需配置：
# - DB_HOST=localhost
# - DB_USER=your_database_user
# - DB_PASSWORD=your_database_password
# - DB_NAME=character_card_anti_theft
# - JWT_SECRET=your_jwt_secret_key
```

### 3. 初始化数据库

```bash
# 自动创建数据库和表结构
npm run db:init
```

### 4. 测试数据库连接

```bash
# 验证数据库配置是否正确
npm run db:test
```

### 5. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 验证安装

访问健康检查端点：

```bash
curl http://localhost:3000/health
```

预期响应：

```json
{
  "status": "ok",
  "database": "connected"
}
```

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器（自动重启）
npm test                 # 运行测试
npm run test:watch       # 监视模式运行测试

# 数据库
npm run db:init          # 初始化数据库
npm run db:test          # 测试数据库连接

# 生产
npm start                # 启动生产服务器
```

## 下一步

- 📖 阅读 [API 文档](docs/API.md)
- 🗄️ 查看 [数据库设置指南](docs/DATABASE_SETUP.md)
- 🔧 了解 [部署配置](docs/DEPLOYMENT.md)
- 📝 查看 [开发文档](docs/DEVELOPMENT.md)

## 遇到问题？

### 数据库连接失败

1. 确认 MySQL 服务正在运行
2. 检查 `.env` 文件中的数据库配置
3. 验证数据库用户权限

详细故障排查：[DATABASE_SETUP.md](docs/DATABASE_SETUP.md#常见问题)

### 端口已被占用

修改 `.env` 文件中的 `SERVER_PORT`：

```env
SERVER_PORT=3001
```

### 环境变量未加载

确保 `.env` 文件在项目根目录，并且包含所有必需的配置项。

## 项目结构

```
anti-theft-server/
├── src/                    # 源代码
│   ├── server.js          # 服务器入口
│   ├── db/                # 数据库模块
│   ├── routes/            # API 路由
│   ├── middleware/        # 中间件
│   └── utils/             # 工具函数
├── scripts/               # 脚本
│   ├── init-db.js        # 数据库初始化
│   ├── schema.sql        # 数据库架构
│   └── test-db-connection.js
├── tests/                 # 测试文件
├── docs/                  # 文档
├── .env.example          # 环境变量模板
└── package.json          # 项目配置
```

## 开发工作流

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **编写代码和测试**
   ```bash
   npm run dev              # 启动开发服务器
   npm test                 # 运行测试
   ```

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

## 获取帮助

- 📧 联系开发团队
- 🐛 [提交 Issue](https://github.com/your-repo/issues)
- 📚 查看完整文档

---

**祝你开发愉快！** 🚀

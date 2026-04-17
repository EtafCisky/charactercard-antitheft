，# 角色卡防盗管理系统 - Web 管理界面

这是 SillyTavern 角色卡防盗插件系统的 Web 管理界面，供角色卡作者加密角色卡和管理密码。

## 技术栈

- **React 18** - UI 框架
- **Vite** - 构建工具
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **Tailwind CSS** - CSS 框架

## 项目结构

```
anti-theft-web/
├── src/
│   ├── api/          # API 客户端模块
│   ├── components/   # React 组件
│   ├── pages/        # 页面组件
│   ├── utils/        # 工具函数
│   ├── App.jsx       # 主应用组件
│   ├── main.jsx      # 应用入口
│   └── index.css     # 全局样式
├── public/           # 静态资源
├── index.html        # HTML 模板
├── package.json      # 项目配置
├── vite.config.js    # Vite 配置
└── tailwind.config.js # Tailwind 配置
```

## 安装依赖

```bash
npm install
```

## 配置

### API 服务器地址配置

复制 `.env.example` 为 `.env.local` 并根据实际情况配置：

```bash
cp .env.example .env.local
# 编辑 .env.local 设置 VITE_API_BASE_URL
```

## 开发

启动开发服务器：

```bash
npm run dev
```

访问 http://localhost:5173

## 构建

构建生产版本：

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

## 预览

预览生产构建：

```bash
npm run preview
```

## 功能特性

- 用户注册和登录
- 角色卡列表管理
- 角色卡加密功能
- 密码管理（更新、随机生成）
- 防盗脚本生成器
- 响应式设计

## 开发状态

🚧 项目正在开发中...

## 相关项目

- [anti-theft-server](../anti-theft-server) - 云服务器后端
- [character-card-anti-theft-plugin](../character-card-anti-theft-plugin) - SillyTavern 插件

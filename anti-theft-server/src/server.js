/**
 * SillyTavern 角色卡防盗系统 - 服务器入口文件
 *
 * 功能：
 * - 初始化 Express 应用
 * - 配置中间件（body-parser, cors, helmet）
 * - 配置端口监听
 * - 提供基础错误处理
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db/connection");

// 创建 Express 应用
const app = express();

// ============================================================================
// 中间件配置
// ============================================================================

// 0. Compression - 启用 gzip 压缩
const compression = require("compression");
app.use(
  compression({
    // 压缩级别：0-9，默认 6（平衡压缩率和速度）
    level: 6,
    // 压缩阈值：只压缩大于 1KB 的响应
    threshold: 1024,
    // 过滤函数：决定哪些响应需要压缩
    filter: (req, res) => {
      // 如果请求明确禁用压缩，则不压缩
      if (req.headers["x-no-compression"]) {
        return false;
      }
      // 使用默认的压缩过滤器
      return compression.filter(req, res);
    },
  }),
);

// 1. Body Parser - 解析 JSON 请求体
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 2. CORS 配置 - 允许跨域请求
const corsOptions = {
  origin: function (origin, callback) {
    // 从环境变量读取允许的来源
    let allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
      : [];

    // 开发环境：自动添加 localhost 和 127.0.0.1 的常用端口
    if (process.env.NODE_ENV !== "production") {
      const devOrigins = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173", // Vite 默认端口
        "http://127.0.0.1:5173",
      ];
      allowedOrigins = [...new Set([...allowedOrigins, ...devOrigins])];
    }

    // 允许无 origin 的请求（如 Postman、服务器端请求、同源请求）
    if (!origin) {
      callback(null, true);
      return;
    }

    // 检查来源是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("不允许的 CORS 来源"));
    }
  },
  credentials: true, // 允许发送 cookies 和认证信息
  optionsSuccessStatus: 200, // 兼容旧版浏览器
};

app.use(cors(corsOptions));

// 3. Helmet - 安全头部配置
const helmet = require("helmet");

// 配置 Helmet 安全头部
app.use(
  helmet({
    // HSTS (HTTP Strict Transport Security)
    // 强制浏览器使用 HTTPS 连接
    hsts: {
      maxAge: 31536000, // 1 年（秒）
      includeSubDomains: true, // 包括所有子域名
      preload: true, // 允许加入 HSTS 预加载列表
    },

    // X-Content-Type-Options
    // 防止浏览器进行 MIME 类型嗅探
    contentSecurityPolicy: false, // 暂时禁用 CSP，稍后单独配置
    noSniff: true, // 启用 X-Content-Type-Options: nosniff

    // X-Frame-Options
    // 防止点击劫持攻击
    frameguard: {
      action: "deny", // 完全禁止在 iframe 中加载
    },

    // 其他安全头部
    xssFilter: true, // 启用 XSS 过滤器（已废弃但保留兼容性）
    hidePoweredBy: true, // 隐藏 X-Powered-By 头部
    ieNoOpen: true, // 防止 IE 在站点上下文中执行下载
    dnsPrefetchControl: {
      allow: false, // 禁用 DNS 预取
    },
  }),
);

// Content Security Policy (CSP) 单独配置
// 定义允许加载资源的来源，防止 XSS 攻击
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // 默认只允许同源资源
      scriptSrc: ["'self'"], // 只允许同源脚本
      styleSrc: ["'self'", "'unsafe-inline'"], // 允许同源样式和内联样式
      imgSrc: ["'self'", "data:", "https:"], // 允许同源图片、data URI 和 HTTPS 图片
      connectSrc: ["'self'"], // 只允许同源 AJAX/WebSocket 连接
      fontSrc: ["'self'"], // 只允许同源字体
      objectSrc: ["'none'"], // 禁止 <object>、<embed>、<applet>
      mediaSrc: ["'self'"], // 只允许同源媒体
      frameSrc: ["'none'"], // 禁止嵌入 iframe
      upgradeInsecureRequests: [], // 自动将 HTTP 请求升级为 HTTPS
    },
  }),
);

// 4. 生产环境 HTTPS 强制重定向
const httpsRedirect = require("./middleware/httpsRedirect");
app.use(httpsRedirect);

// ============================================================================
// API 路由
// ============================================================================

// 认证路由
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// 角色卡管理路由
const cardsRoutes = require("./routes/cards");
app.use("/api/cards", cardsRoutes);

// 公开密码验证路由
const verifyRoutes = require("./routes/verify");
app.use("/api/verify", verifyRoutes);

// ============================================================================
// 基础路由
// ============================================================================

// 健康检查端点
app.get("/health", async (req, res) => {
  try {
    // 检查数据库连接状态
    const dbHealth = await db.healthCheck();

    // 检查 Redis 连接状态（如果启用）
    let redisHealth = {
      status: "not_configured",
      message: "Redis 未配置",
      healthy: true, // 未配置时不影响整体健康状态
    };

    // 如果配置了 Redis，检查其连接状态
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      try {
        // TODO: 当实现 Redis 时，在此处添加 Redis 健康检查
        // const redis = require('./utils/redis');
        // redisHealth = await redis.healthCheck();
        redisHealth = {
          status: "configured_but_not_implemented",
          message: "Redis 已配置但健康检查未实现",
          healthy: true,
        };
      } catch (error) {
        redisHealth = {
          status: "error",
          message: `Redis 连接异常: ${error.message}`,
          healthy: false,
        };
      }
    }

    // 计算整体健康状态
    const isHealthy = dbHealth.healthy && redisHealth.healthy;

    const healthStatus = {
      success: isHealthy,
      message: isHealthy ? "服务器运行正常" : "服务器存在异常",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(), // 服务器运行时间（秒）
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    };

    // 如果任何服务不健康，返回 503 状态码
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "健康检查失败",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// 根路径
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SillyTavern 角色卡防盗系统 API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth/*",
      cards: "/api/cards/*",
      verify: "/api/verify",
    },
  });
});

// ============================================================================
// 错误处理中间件
// ============================================================================

// 导入统一错误处理中间件
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// 404 处理 - 必须在所有路由之后
app.use(notFoundHandler);

// 全局错误处理 - 必须是最后一个中间件
app.use(errorHandler);

// ============================================================================
// 服务器启动
// ============================================================================

// 从环境变量读取端口，默认 3000
const PORT = process.env.SERVER_PORT || 3000;
const HOST = process.env.SERVER_HOST || "0.0.0.0";

// 异步启动函数
async function startServer() {
  try {
    // 1. 初始化数据库连接
    console.log("正在初始化数据库连接...");
    await db.initializeWithRetry();

    // 2. 启动 HTTP 服务器
    const server = app.listen(PORT, HOST, () => {
      console.log("=".repeat(60));
      console.log("🚀 SillyTavern 角色卡防盗系统服务器已启动");
      console.log("=".repeat(60));
      console.log(`📍 服务器地址: http://${HOST}:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || "development"}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString("zh-CN")}`);
      console.log("=".repeat(60));
      console.log("可用端点:");
      console.log(`  - GET  /              服务器信息`);
      console.log(`  - GET  /health        健康检查`);
      console.log(`  - POST /api/auth/register  用户注册`);
      console.log(`  - POST /api/auth/login     用户登录 (待实现)`);
      console.log(`  - GET  /api/cards/*   角色卡管理 (待实现)`);
      console.log(`  - POST /api/verify    密码验证 (待实现)`);
      console.log("=".repeat(60));
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);

      // 1. 停止接受新连接
      server.close(async () => {
        console.log("HTTP 服务器已关闭");

        // 2. 关闭数据库连接
        try {
          await db.closePool();
          console.log("数据库连接已关闭");
        } catch (error) {
          console.error("关闭数据库连接失败:", error.message);
        }

        console.log("服务器已完全关闭");
        process.exit(0);
      });

      // 设置超时，如果 30 秒内未能优雅关闭，强制退出
      setTimeout(() => {
        console.error("无法在 30 秒内优雅关闭，强制退出");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ 服务器启动失败:", error.message);
    console.error("详细错误:", error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 未捕获的异常处理
process.on("uncaughtException", (err) => {
  console.error("未捕获的异常:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的 Promise 拒绝:", reason);
  process.exit(1);
});

// 导出 app 供测试使用
module.exports = app;

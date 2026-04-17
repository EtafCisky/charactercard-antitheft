# 日志系统集成示例

本文档提供了如何在现有代码中集成日志系统的具体示例。

## 1. 认证路由集成 (src/routes/auth.js)

### 注册端点

```javascript
const { logAuthAttempt } = require("../utils/logger");

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // ... 验证逻辑

    // 创建用户
    const userId = await createUser(username, email, password);

    // 记录成功的注册
    logAuthAttempt("register", username, true);

    res.json({
      success: true,
      message: "注册成功",
    });
  } catch (error) {
    // 记录失败的注册
    logAuthAttempt("register", username, false, error.message);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
```

### 登录端点

```javascript
const { logAuthAttempt } = require("../utils/logger");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // 验证用户凭证
    const user = await authenticateUser(username, password);

    if (!user) {
      // 记录失败的登录
      logAuthAttempt("login", username, false, "用户名或密码错误");

      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
      });
    }

    // 生成 JWT token
    const token = generateToken(user);

    // 记录成功的登录
    logAuthAttempt("login", username, true);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    // 记录登录错误
    logAuthAttempt("login", username, false, error.message);

    res.status(500).json({
      success: false,
      message: "服务器错误",
    });
  }
});
```

## 2. 密码验证路由集成 (src/routes/verify.js)

```javascript
const { logPasswordVerification, logApiError } = require("../utils/logger");

router.post("/verify", async (req, res) => {
  const { card_id, password } = req.body;
  const ipAddress = req.ip;

  try {
    // 查询角色卡
    const card = await db.query(
      "SELECT password_hash, password_version FROM character_cards WHERE card_id = ?",
      [card_id]
    );

    if (card.length === 0) {
      // 记录失败的验证（角色卡不存在）
      logPasswordVerification(card_id, false, ipAddress, "角色卡不存在");

      return res.status(404).json({
        success: false,
        message: "角色卡不存在",
      });
    }

    // 验证密码
    const isValid = await verifyPassword(password, card[0].password_hash);

    if (isValid) {
      // 记录成功的验证
      logPasswordVerification(card_id, true, ipAddress);

      res.json({
        success: true,
        password_version: card[0].password_version,
      });
    } else {
      // 记录失败的验证（密码错误）
      logPasswordVerification(card_id, false, ipAddress, "密码错误");

      res.status(401).json({
        success: false,
        message: "密码错误",
      });
    }
  } catch (error) {
    // 记录 API 错误
    logApiError("POST", "/api/verify", 500, error, {
      card_id,
      ip_address: ipAddress,
    });

    res.status(500).json({
      success: false,
      message: "服务器错误",
    });
  }
});
```

## 3. 角色卡管理路由集成 (src/routes/cards.js)

### 创建角色卡

```javascript
const { logInfo, logApiError } = require("../utils/logger");

router.post("/", authenticateToken, async (req, res) => {
  const { card_name, password } = req.body;
  const userId = req.user.userId;
  const username = req.user.username;

  try {
    // 生成唯一 Card ID
    const cardId = await generateUniqueCardId();

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 创建角色卡记录
    await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, 1)",
      [cardId, userId, card_name, passwordHash]
    );

    // 记录角色卡创建
    logInfo("角色卡创建成功", {
      card_id: cardId,
      card_name,
      username,
      user_id: userId,
    });

    res.json({
      success: true,
      card_id: cardId,
      password_version: 1,
    });
  } catch (error) {
    // 记录 API 错误
    logApiError("POST", "/api/cards", 500, error, {
      username,
      user_id: userId,
    });

    res.status(500).json({
      success: false,
      message: "创建角色卡失败",
    });
  }
});
```

### 更新密码

```javascript
const { logPasswordUpdate, logApiError } = require("../utils/logger");

router.put("/:id/password", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  const userId = req.user.userId;
  const username = req.user.username;

  try {
    // 查询角色卡
    const cards = await db.query(
      "SELECT card_id, password_version FROM character_cards WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (cards.length === 0) {
      return res.status(404).json({
        success: false,
        message: "角色卡不存在",
      });
    }

    const card = cards[0];
    const oldVersion = card.password_version;
    const newVersion = oldVersion + 1;

    // 加密新密码
    const passwordHash = await hashPassword(new_password);

    // 更新密码和版本号
    await db.query(
      "UPDATE character_cards SET password_hash = ?, password_version = ? WHERE id = ?",
      [passwordHash, newVersion, id]
    );

    // 记录密码更新
    logPasswordUpdate(card.card_id, oldVersion, newVersion, username);

    res.json({
      success: true,
      password_version: newVersion,
    });
  } catch (error) {
    // 记录 API 错误
    logApiError("PUT", `/api/cards/${id}/password`, 500, error, {
      card_id: id,
      username,
      user_id: userId,
    });

    res.status(500).json({
      success: false,
      message: "更新密码失败",
    });
  }
});
```

### 删除角色卡

```javascript
const { logInfo, logApiError } = require("../utils/logger");

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const username = req.user.username;

  try {
    // 查询角色卡
    const cards = await db.query(
      "SELECT card_id, card_name FROM character_cards WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (cards.length === 0) {
      return res.status(404).json({
        success: false,
        message: "角色卡不存在",
      });
    }

    const card = cards[0];

    // 删除角色卡
    await db.query("DELETE FROM character_cards WHERE id = ?", [id]);

    // 记录角色卡删除
    logInfo("角色卡删除成功", {
      card_id: card.card_id,
      card_name: card.card_name,
      username,
      user_id: userId,
    });

    res.json({
      success: true,
      message: "角色卡删除成功",
    });
  } catch (error) {
    // 记录 API 错误
    logApiError("DELETE", `/api/cards/${id}`, 500, error, {
      card_id: id,
      username,
      user_id: userId,
    });

    res.status(500).json({
      success: false,
      message: "删除角色卡失败",
    });
  }
});
```

## 4. 错误处理中间件集成 (src/middleware/errorHandler.js)

```javascript
const { logApiError } = require("../utils/logger");

function errorHandler(err, req, res, next) {
  // 记录所有未捕获的错误
  logApiError(
    req.method,
    req.path,
    err.statusCode || 500,
    err,
    {
      user_id: req.user?.userId,
      username: req.user?.username,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    }
  );

  // 返回错误响应
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "服务器内部错误",
  });
}

module.exports = errorHandler;
```

## 5. 服务器启动集成 (src/server.js)

```javascript
const { logInfo, logError } = require("./utils/logger");

async function startServer() {
  try {
    // 初始化数据库连接
    logInfo("正在初始化数据库连接");
    await db.initializeWithRetry();

    // 启动 HTTP 服务器
    const server = app.listen(PORT, HOST, () => {
      logInfo("服务器启动成功", {
        host: HOST,
        port: PORT,
        env: process.env.NODE_ENV || "development",
        node_version: process.version,
      });
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal) => {
      logInfo(`收到 ${signal} 信号，正在优雅关闭服务器`);

      server.close(async () => {
        logInfo("HTTP 服务器已关闭");

        try {
          await db.closePool();
          logInfo("数据库连接已关闭");
        } catch (error) {
          logError("关闭数据库连接失败", error);
        }

        logInfo("服务器已完全关闭");
        process.exit(0);
      });

      // 设置超时
      setTimeout(() => {
        logError("无法在 30 秒内优雅关闭，强制退出");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logError("服务器启动失败", error);
    process.exit(1);
  }
}

// 未捕获的异常处理
process.on("uncaughtException", (err) => {
  logError("未捕获的异常", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logError("未处理的 Promise 拒绝", {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise: String(promise),
  });
  process.exit(1);
});

startServer();
```

## 6. 速率限制中间件集成 (src/middleware/rateLimiter.js)

```javascript
const { logWarn } = require("../utils/logger");

const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: (req, res) => {
    // 记录速率限制触发
    logWarn("速率限制触发", {
      operation_type: "rate_limit",
      endpoint: req.path,
      ip_address: req.ip,
      limit_type: "verify",
    });

    res.status(429).json({
      success: false,
      message: "请求过于频繁，请稍后再试",
    });
  },
});
```

## 7. 健康检查端点集成

```javascript
const { logInfo } = require("./utils/logger");

app.get("/health", async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();

    const health = {
      status: dbHealth.healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: dbHealth,
    };

    if (!dbHealth.healthy) {
      logWarn("健康检查失败", health);
      return res.status(503).json(health);
    }

    res.json(health);
  } catch (error) {
    logError("健康检查错误", error);
    res.status(503).json({
      status: "error",
      message: error.message,
    });
  }
});
```

## 集成检查清单

在集成日志系统时，请确保：

- [ ] 所有认证操作使用 `logAuthAttempt`
- [ ] 所有密码验证使用 `logPasswordVerification`
- [ ] 所有密码更新使用 `logPasswordUpdate`
- [ ] 所有数据库错误使用 `logDatabaseError`
- [ ] 所有 API 错误使用 `logApiError`
- [ ] 服务器启动/关闭使用 `logInfo`
- [ ] 速率限制触发使用 `logWarn`
- [ ] 不记录任何明文密码或敏感信息
- [ ] 包含足够的上下文信息（用户ID、IP地址等）
- [ ] 使用适当的日志级别

## 注意事项

1. **不要记录敏感信息**：密码、token、密钥等会被自动过滤，但仍需注意
2. **包含上下文**：尽可能提供操作相关的上下文信息
3. **使用正确的日志级别**：info（正常操作）、warn（潜在问题）、error（错误）
4. **记录关键操作**：所有认证、验证、更新操作都应该被记录
5. **错误处理**：在 catch 块中记录错误，然后重新抛出或返回错误响应

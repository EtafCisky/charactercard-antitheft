/**
 * 速率限制器单元测试
 *
 * 测试覆盖：
 * - IP 级别速率限制（10次/分钟）
 * - Card ID 级别速率限制（5次/分钟）
 * - 429 状态码返回
 * - retry-after 信息
 */

const request = require("supertest");
const express = require("express");
const rateLimit = require("express-rate-limit");

// ============================================================================
// 测试辅助函数
// ============================================================================

/**
 * 创建测试应用（每次创建新的限制器实例）
 */
function createTestAppWithIpLimiter() {
  const app = express();
  app.use(express.json());

  const ipLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = Math.ceil(
        req.rateLimit.resetTime / 1000 - Date.now() / 1000,
      );
      res.status(429).json({
        success: false,
        message: `请求过于频繁，请在 ${retryAfter} 秒后重试`,
        error_code: "RATE_LIMIT_EXCEEDED",
        retry_after: retryAfter,
      });
    },
  });

  app.post("/test", ipLimiter, (req, res) => {
    res.json({ success: true, message: "请求成功" });
  });

  return app;
}

function createTestAppWithCardIdLimiter() {
  const app = express();
  app.use(express.json());

  const cardIdLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const cardId = req.body?.card_id;
      if (!cardId) {
        return `no-card-id-${Date.now()}-${Math.random()}`;
      }
      return `card:${cardId}`;
    },
    skip: (req) => {
      return !req.body?.card_id;
    },
    handler: (req, res) => {
      const retryAfter = Math.ceil(
        req.rateLimit.resetTime / 1000 - Date.now() / 1000,
      );
      res.status(429).json({
        success: false,
        message: `该角色卡验证请求过于频繁，请在 ${retryAfter} 秒后重试`,
        error_code: "CARD_RATE_LIMIT_EXCEEDED",
        retry_after: retryAfter,
        card_id: req.body.card_id,
      });
    },
  });

  app.post("/test", cardIdLimiter, (req, res) => {
    res.json({ success: true, message: "请求成功" });
  });

  return app;
}

function createTestAppWithCombinedLimiters() {
  const app = express();
  app.use(express.json());

  const ipLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = Math.ceil(
        req.rateLimit.resetTime / 1000 - Date.now() / 1000,
      );
      res.status(429).json({
        success: false,
        message: `请求过于频繁，请在 ${retryAfter} 秒后重试`,
        error_code: "RATE_LIMIT_EXCEEDED",
        retry_after: retryAfter,
      });
    },
  });

  const cardIdLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const cardId = req.body?.card_id;
      if (!cardId) {
        return `no-card-id-${Date.now()}-${Math.random()}`;
      }
      return `card:${cardId}`;
    },
    skip: (req) => {
      return !req.body?.card_id;
    },
    handler: (req, res) => {
      const retryAfter = Math.ceil(
        req.rateLimit.resetTime / 1000 - Date.now() / 1000,
      );
      res.status(429).json({
        success: false,
        message: `该角色卡验证请求过于频繁，请在 ${retryAfter} 秒后重试`,
        error_code: "CARD_RATE_LIMIT_EXCEEDED",
        retry_after: retryAfter,
        card_id: req.body.card_id,
      });
    },
  });

  app.post("/test", [ipLimiter, cardIdLimiter], (req, res) => {
    res.json({ success: true, message: "请求成功" });
  });

  return app;
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// IP 级别速率限制测试
// ============================================================================

describe("IP Rate Limiter", () => {
  test("应该允许 10 次请求", async () => {
    const app = createTestAppWithIpLimiter();

    // 发送 10 次请求
    for (let i = 0; i < 10; i++) {
      const response = await request(app).post("/test").send({ test: "data" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });

  test("第 11 次请求应该返回 429 状态码", async () => {
    const app = createTestAppWithIpLimiter();

    // 发送 10 次成功请求
    for (let i = 0; i < 10; i++) {
      await request(app).post("/test").send({ test: "data" });
    }

    // 第 11 次请求应该被限制
    const response = await request(app).post("/test").send({ test: "data" });

    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);
    expect(response.body.error_code).toBe("RATE_LIMIT_EXCEEDED");
  });

  test("429 响应应该包含 retry_after 信息", async () => {
    const app = createTestAppWithIpLimiter();

    // 发送 10 次成功请求
    for (let i = 0; i < 10; i++) {
      await request(app).post("/test").send({ test: "data" });
    }

    // 第 11 次请求
    const response = await request(app).post("/test").send({ test: "data" });

    expect(response.status).toBe(429);
    expect(response.body.retry_after).toBeDefined();
    expect(typeof response.body.retry_after).toBe("number");
    expect(response.body.retry_after).toBeGreaterThan(0);
    expect(response.body.retry_after).toBeLessThanOrEqual(60);
  });

  test("应该返回 RateLimit 标准头部", async () => {
    const app = createTestAppWithIpLimiter();

    const response = await request(app).post("/test").send({ test: "data" });

    expect(response.headers["ratelimit-limit"]).toBeDefined();
    expect(response.headers["ratelimit-remaining"]).toBeDefined();
    expect(response.headers["ratelimit-reset"]).toBeDefined();
  });
});

// ============================================================================
// Card ID 级别速率限制测试
// ============================================================================

describe("Card ID Rate Limiter", () => {
  test("应该允许同一 Card ID 5 次请求", async () => {
    const app = createTestAppWithCardIdLimiter();
    const cardId = "123456";

    // 发送 5 次请求
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post("/test")
        .send({ card_id: cardId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });

  test("同一 Card ID 第 6 次请求应该返回 429", async () => {
    const app = createTestAppWithCardIdLimiter();
    const cardId = "123456";

    // 发送 5 次成功请求
    for (let i = 0; i < 5; i++) {
      await request(app).post("/test").send({ card_id: cardId });
    }

    // 第 6 次请求应该被限制
    const response = await request(app).post("/test").send({ card_id: cardId });

    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);
    expect(response.body.error_code).toBe("CARD_RATE_LIMIT_EXCEEDED");
    expect(response.body.card_id).toBe(cardId);
  });

  test("不同 Card ID 应该独立计数", async () => {
    const app = createTestAppWithCardIdLimiter();
    const cardId1 = "123456";
    const cardId2 = "789012";

    // Card ID 1: 发送 5 次请求
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post("/test")
        .send({ card_id: cardId1 });

      expect(response.status).toBe(200);
    }

    // Card ID 2: 应该仍然可以发送请求
    const response = await request(app)
      .post("/test")
      .send({ card_id: cardId2 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("没有 card_id 的请求应该跳过限制", async () => {
    const app = createTestAppWithCardIdLimiter();

    // 发送 10 次没有 card_id 的请求
    for (let i = 0; i < 10; i++) {
      const response = await request(app).post("/test").send({ other: "data" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });
});

// ============================================================================
// 组合速率限制器测试
// ============================================================================

describe("Combined Rate Limiter (verifyRateLimiter)", () => {
  test("应该同时应用 IP 和 Card ID 限制", async () => {
    const app = createTestAppWithCombinedLimiters();
    const cardId = "123456";

    // 发送 5 次请求（Card ID 限制）
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post("/test")
        .send({ card_id: cardId });

      expect(response.status).toBe(200);
    }

    // 第 6 次请求应该被 Card ID 限制器拦截
    const response = await request(app).post("/test").send({ card_id: cardId });

    expect(response.status).toBe(429);
    expect(response.body.error_code).toBe("CARD_RATE_LIMIT_EXCEEDED");
  });

  test("IP 限制应该在 Card ID 限制之前触发", async () => {
    const app = createTestAppWithCombinedLimiters();

    // 使用不同的 Card ID 发送 10 次请求
    for (let i = 0; i < 10; i++) {
      const response = await request(app)
        .post("/test")
        .send({ card_id: `12345${i}` });

      expect(response.status).toBe(200);
    }

    // 第 11 次请求应该被 IP 限制器拦截
    const response = await request(app)
      .post("/test")
      .send({ card_id: "999999" });

    expect(response.status).toBe(429);
    expect(response.body.error_code).toBe("RATE_LIMIT_EXCEEDED");
  });
});

// ============================================================================
// 边界条件测试
// ============================================================================

describe("Rate Limiter Edge Cases", () => {
  test("应该正确处理空请求体", async () => {
    const app = createTestAppWithCardIdLimiter();

    const response = await request(app).post("/test").send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("应该正确处理无效的 card_id", async () => {
    const app = createTestAppWithCardIdLimiter();

    const response = await request(app).post("/test").send({ card_id: null });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("retry_after 应该随时间递减", async () => {
    const app = createTestAppWithIpLimiter();

    // 触发速率限制
    for (let i = 0; i < 10; i++) {
      await request(app).post("/test").send({});
    }

    // 第一次被限制
    const response1 = await request(app).post("/test").send({});
    const retryAfter1 = response1.body.retry_after;

    // 等待 2 秒
    await delay(2000);

    // 第二次被限制
    const response2 = await request(app).post("/test").send({});
    const retryAfter2 = response2.body.retry_after;

    // retry_after 应该减少
    expect(retryAfter2).toBeLessThan(retryAfter1);
  }, 10000); // 增加超时时间
});

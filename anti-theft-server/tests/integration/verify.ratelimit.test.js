/**
 * 密码验证端点速率限制集成测试
 *
 * 测试覆盖：
 * - POST /api/verify 的 IP 级别速率限制
 * - POST /api/verify 的 Card ID 级别速率限制
 * - 429 状态码和 retry-after 信息
 * - 速率限制与密码验证的交互
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { hashPassword } = require("../../src/utils/crypto");

// ============================================================================
// 测试设置
// ============================================================================

describe("POST /api/verify - Rate Limiting Integration Tests", () => {
  let testCardId;
  let testPassword;

  beforeAll(async () => {
    // 等待数据库连接初始化
    await db.waitForConnection();

    // 创建测试用户
    const hashedPassword = await hashPassword("testuser123");
    const userResult = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["ratelimit_test_user", "ratelimit@test.com", hashedPassword],
    );
    const userId = userResult.insertId;

    // 创建测试角色卡
    testPassword = "testCardPassword123";
    const cardPasswordHash = await hashPassword(testPassword);
    testCardId = "888888";

    await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
      [testCardId, userId, "速率限制测试角色", cardPasswordHash, 1],
    );
  });

  afterAll(async () => {
    // 清理测试数据
    await db.query("DELETE FROM character_cards WHERE card_id = ?", [
      testCardId,
    ]);
    await db.query("DELETE FROM users WHERE username = ?", [
      "ratelimit_test_user",
    ]);

    // 关闭数据库连接
    await db.closePool();
  });

  // ============================================================================
  // IP 级别速率限制测试
  // ============================================================================

  describe("IP Level Rate Limiting", () => {
    test("应该允许 10 次验证请求", async () => {
      // 发送 10 次请求
      for (let i = 0; i < 10; i++) {
        const response = await request(app).post("/api/verify").send({
          card_id: testCardId,
          password: testPassword,
        });

        // 应该成功验证
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    }, 30000); // 增加超时时间

    test("第 11 次请求应该返回 429 状态码", async () => {
      // 发送 10 次成功请求
      for (let i = 0; i < 10; i++) {
        await request(app).post("/api/verify").send({
          card_id: testCardId,
          password: testPassword,
        });
      }

      // 第 11 次请求应该被限制
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: testPassword,
      });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe("RATE_LIMIT_EXCEEDED");
      expect(response.body.retry_after).toBeDefined();
      expect(typeof response.body.retry_after).toBe("number");
    }, 30000);
  });

  // ============================================================================
  // Card ID 级别速率限制测试
  // ============================================================================

  describe("Card ID Level Rate Limiting", () => {
    test("应该允许同一 Card ID 5 次验证请求", async () => {
      // 发送 5 次请求
      for (let i = 0; i < 5; i++) {
        const response = await request(app).post("/api/verify").send({
          card_id: testCardId,
          password: testPassword,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    }, 30000);

    test("同一 Card ID 第 6 次请求应该返回 429", async () => {
      // 发送 5 次成功请求
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/verify").send({
          card_id: testCardId,
          password: testPassword,
        });
      }

      // 第 6 次请求应该被限制
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: testPassword,
      });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe("CARD_RATE_LIMIT_EXCEEDED");
      expect(response.body.card_id).toBe(testCardId);
      expect(response.body.retry_after).toBeDefined();
    }, 30000);
  });

  // ============================================================================
  // 速率限制与密码验证交互测试
  // ============================================================================

  describe("Rate Limiting with Password Verification", () => {
    test("速率限制应该在密码验证之前触发", async () => {
      // 发送 10 次请求（触发 IP 限制）
      for (let i = 0; i < 10; i++) {
        await request(app).post("/api/verify").send({
          card_id: testCardId,
          password: testPassword,
        });
      }

      // 第 11 次请求，即使密码错误，也应该先被速率限制拦截
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: "wrongPassword",
      });

      expect(response.status).toBe(429);
      expect(response.body.error_code).toBe("RATE_LIMIT_EXCEEDED");
      // 不应该返回"密码错误"消息
      expect(response.body.message).not.toContain("密码错误");
    }, 30000);

    test("速率限制不应该影响其他 Card ID", async () => {
      const anotherCardId = "999999";

      // 为另一个 Card ID 创建记录
      const cardPasswordHash = await hashPassword("anotherPassword");
      await db.query(
        "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
        [anotherCardId, 1, "另一个角色", cardPasswordHash, 1],
      );

      // 对第一个 Card ID 发送 5 次请求
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/verify").send({
          card_id: testCardId,
          password: testPassword,
        });
      }

      // 第一个 Card ID 应该被限制
      const response1 = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: testPassword,
      });

      expect(response1.status).toBe(429);

      // 第二个 Card ID 应该仍然可以访问
      const response2 = await request(app).post("/api/verify").send({
        card_id: anotherCardId,
        password: "anotherPassword",
      });

      expect(response2.status).toBe(200);
      expect(response2.body.success).toBe(true);

      // 清理
      await db.query("DELETE FROM character_cards WHERE card_id = ?", [
        anotherCardId,
      ]);
    }, 30000);
  });

  // ============================================================================
  // retry_after 信息测试
  // ============================================================================

  describe("Retry-After Information", () => {
    test("429 响应应该包含准确的 retry_after 时间", async () => {
      // 触发速率限制
      for (let i = 0; i < 10; i++) {
        await request(app).post("/api/verify").send({
          card_id: testCardId,
          password: testPassword,
        });
      }

      // 获取 retry_after
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: testPassword,
      });

      expect(response.status).toBe(429);
      expect(response.body.retry_after).toBeDefined();

      // retry_after 应该在合理范围内（0-60 秒）
      expect(response.body.retry_after).toBeGreaterThan(0);
      expect(response.body.retry_after).toBeLessThanOrEqual(60);

      // 消息应该包含 retry_after 信息
      expect(response.body.message).toContain("秒后重试");
    }, 30000);
  });

  // ============================================================================
  // 边界条件测试
  // ============================================================================

  describe("Edge Cases", () => {
    test("应该正确处理无效的 card_id 格式", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: "invalid",
        password: "somePassword",
      });

      // 应该返回验证错误，而不是速率限制错误
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("card_id");
    });

    test("应该正确处理缺少 card_id 的请求", async () => {
      const response = await request(app).post("/api/verify").send({
        password: "somePassword",
      });

      // 应该返回验证错误
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

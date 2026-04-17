/**
 * 健康检查端点集成测试
 *
 * 测试需求：
 * - 需求 18：健康检查 - 提供健康检查端点
 * - 验证数据库连接状态检查
 * - 验证 Redis 连接状态检查（如果启用）
 * - 验证系统状态信息返回
 *
 * 注意：此测试需要运行中的 MySQL 数据库
 * 如果数据库未运行，测试将被跳过
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");

// 检查数据库是否可用
let isDatabaseAvailable = false;

describe("健康检查端点集成测试", () => {
  // ============================================================================
  // 测试前准备
  // ============================================================================

  beforeAll(async () => {
    try {
      // 尝试连接数据库
      if (!db.isConnectionActive()) {
        await db.initializeWithRetry();
      }
      isDatabaseAvailable = true;
    } catch (error) {
      console.warn("数据库不可用，跳过集成测试:", error.message);
      isDatabaseAvailable = false;
    }
  });

  afterAll(async () => {
    if (isDatabaseAvailable) {
      // 关闭数据库连接
      await db.closePool();
    }
  });

  // ============================================================================
  // GET /health 测试
  // ============================================================================

  describe("GET /health", () => {
    test("应该返回健康状态信息（数据库正常）", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "服务器运行正常",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: "1.0.0",
        services: {
          database: {
            status: "connected",
            message: "数据库连接正常",
            healthy: true,
          },
          redis: {
            status: expect.any(String),
            message: expect.any(String),
            healthy: expect.any(Boolean),
          },
        },
      });
    });

    test("应该包含正确的时间戳格式", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);

      // 验证 ISO 8601 时间戳格式
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe("Invalid Date");
    });

    test("应该返回正确的环境信息", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(["development", "production", "test"]).toContain(
        response.body.environment,
      );
    });

    test("应该返回服务器运行时间", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof response.body.uptime).toBe("number");
    });

    test("应该检查数据库连接状态", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBeDefined();
      expect(response.body.services.database.status).toBe("connected");
      expect(response.body.services.database.healthy).toBe(true);
    });

    test("应该检查 Redis 连接状态（未配置时）", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.services.redis).toBeDefined();
      expect(response.body.services.redis.status).toBeDefined();
      expect(response.body.services.redis.healthy).toBeDefined();
    });

    test("应该不需要认证即可访问", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      // 不提供 Authorization header
      const response = await request(app).get("/health");

      // 应该成功返回，不返回 401
      expect(response.status).not.toBe(401);
      expect([200, 503]).toContain(response.status);
    });

    test("应该返回版本信息", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      const response = await request(app).get("/health");

      expect([200, 503]).toContain(response.status);
      expect(response.body.version).toBe("1.0.0");
    });
  });

  // ============================================================================
  // 性能测试
  // ============================================================================

  describe("健康检查性能", () => {
    test("应该在 500ms 内响应", async () => {
      if (!isDatabaseAvailable) {
        console.log("跳过测试：数据库不可用");
        return;
      }

      const startTime = Date.now();
      const response = await request(app).get("/health");
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect([200, 503]).toContain(response.status);
      expect(responseTime).toBeLessThan(500);
    });
  });
});

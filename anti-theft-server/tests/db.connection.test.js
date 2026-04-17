/**
 * 数据库连接模块单元测试
 *
 * 测试覆盖：
 * - 配置读取和验证
 * - 连接池创建
 * - 连接重试机制
 * - 健康检查
 * - 查询执行
 */

const db = require("../src/db/connection");

describe("数据库连接模块", () => {
  describe("配置验证", () => {
    test("应该从环境变量读取数据库配置", () => {
      // 确保环境变量已设置
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "test_db";

      const config = db.getDatabaseConfig();

      expect(config).toHaveProperty("host");
      expect(config).toHaveProperty("user", "test_user");
      expect(config).toHaveProperty("password", "test_password");
      expect(config).toHaveProperty("database", "test_db");
      expect(config).toHaveProperty("charset", "utf8mb4");
    });

    test("应该在缺少必需配置时抛出错误", () => {
      // 清除必需的环境变量
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;

      expect(() => {
        db.getDatabaseConfig();
      }).toThrow(/缺少必需的数据库配置环境变量/);
    });

    test("应该使用默认值填充可选配置", () => {
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "test_db";
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;

      const config = db.getDatabaseConfig();

      expect(config.host).toBe("localhost");
      expect(config.port).toBe(3306);
    });
  });

  describe("连接状态", () => {
    test("初始状态应该是未连接", () => {
      expect(db.isConnectionActive()).toBe(false);
    });
  });

  describe("健康检查", () => {
    test("未初始化时健康检查应该返回 disconnected", async () => {
      const health = await db.healthCheck();

      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("healthy");
      expect(health.healthy).toBe(false);
    });
  });

  // 注意：以下测试需要实际的数据库连接，在 CI/CD 环境中可能需要跳过
  describe.skip("连接池操作（需要数据库）", () => {
    beforeAll(async () => {
      // 设置测试环境变量
      process.env.DB_HOST = "localhost";
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "test_db";
    });

    afterAll(async () => {
      await db.closePool();
    });

    test("应该成功初始化连接池", async () => {
      await db.initializeWithRetry();
      expect(db.isConnectionActive()).toBe(true);
    });

    test("健康检查应该返回 connected", async () => {
      const health = await db.healthCheck();

      expect(health.status).toBe("connected");
      expect(health.healthy).toBe(true);
    });

    test("应该能够执行简单查询", async () => {
      const result = await db.query("SELECT 1 + 1 AS result");
      expect(result).toHaveLength(1);
      expect(result[0].result).toBe(2);
    });
  });
});

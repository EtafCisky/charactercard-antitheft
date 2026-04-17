/**
 * 数据库连接集成测试
 *
 * 此测试需要实际的数据库环境
 * 在 CI/CD 中可以使用 Docker 容器提供测试数据库
 */

const db = require("../../src/db/connection");

describe("数据库连接集成测试", () => {
  // 在所有测试之前初始化数据库连接
  beforeAll(async () => {
    // 确保环境变量已设置
    if (
      !process.env.DB_USER ||
      !process.env.DB_PASSWORD ||
      !process.env.DB_NAME
    ) {
      console.warn("跳过集成测试：缺少数据库配置环境变量");
      return;
    }

    try {
      await db.initializeWithRetry();
    } catch (error) {
      console.error("数据库连接失败，跳过集成测试:", error.message);
    }
  }, 30000); // 30秒超时，因为可能需要重试

  // 在所有测试之后关闭数据库连接
  afterAll(async () => {
    if (db.isConnectionActive()) {
      await db.closePool();
    }
  });

  test("应该成功连接到数据库", () => {
    expect(db.isConnectionActive()).toBe(true);
  });

  test("健康检查应该返回健康状态", async () => {
    const health = await db.healthCheck();

    expect(health).toHaveProperty("status", "connected");
    expect(health).toHaveProperty("healthy", true);
    expect(health).toHaveProperty("message");
  });

  test("应该能够执行简单的 SELECT 查询", async () => {
    const result = await db.query("SELECT 1 + 1 AS result");

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("result", 2);
  });

  test("应该能够执行带参数的查询", async () => {
    const result = await db.query("SELECT ? AS value", ["test"]);

    expect(result[0]).toHaveProperty("value", "test");
  });

  test("应该能够获取数据库版本信息", async () => {
    const result = await db.query("SELECT VERSION() AS version");

    expect(result[0]).toHaveProperty("version");
    expect(typeof result[0].version).toBe("string");
    console.log("数据库版本:", result[0].version);
  });

  test("应该能够执行事务", async () => {
    const result = await db.transaction(async (connection) => {
      // 在事务中执行查询
      const [rows] = await connection.execute("SELECT 1 AS test");
      return rows[0].test;
    });

    expect(result).toBe(1);
  });

  test("事务失败时应该回滚", async () => {
    await expect(async () => {
      await db.transaction(async (connection) => {
        // 执行一个会失败的查询
        await connection.execute("SELECT * FROM non_existent_table");
      });
    }).rejects.toThrow();
  });

  test("查询错误应该被正确捕获", async () => {
    await expect(async () => {
      await db.query("SELECT * FROM non_existent_table");
    }).rejects.toThrow();
  });
});

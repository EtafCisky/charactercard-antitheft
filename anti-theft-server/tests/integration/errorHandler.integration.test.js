/**
 * 错误处理中间件集成测试
 *
 * 测试覆盖：
 * - 404 错误处理
 * - 全局错误捕获
 * - 异步错误处理
 * - 错误响应格式
 * - 不同错误类型的处理
 */

const request = require("supertest");
const express = require("express");
const {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} = require("../../src/middleware/errorHandler");

// 创建测试应用
function createTestApp() {
  const app = express();

  app.use(express.json());

  // 测试路由：同步错误
  app.get("/test/sync-error", (req, res) => {
    throw new Error("同步错误");
  });

  // 测试路由：异步错误（使用 asyncHandler）
  app.get(
    "/test/async-error",
    asyncHandler(async (req, res) => {
      throw new Error("异步错误");
    }),
  );

  // 测试路由：Promise 拒绝
  app.get(
    "/test/promise-rejection",
    asyncHandler(async (req, res) => {
      return Promise.reject(new Error("Promise 拒绝"));
    }),
  );

  // 测试路由：自定义状态码
  app.get("/test/custom-status", (req, res) => {
    const error = new Error("自定义错误");
    error.statusCode = 418;
    throw error;
  });

  // 测试路由：验证错误
  app.post("/test/validation-error", (req, res) => {
    const error = new Error("验证失败");
    error.name = "ValidationError";
    throw error;
  });

  // 测试路由：认证错误
  app.get("/test/auth-error", (req, res) => {
    const error = new Error("认证失败");
    error.name = "UnauthorizedError";
    throw error;
  });

  // 测试路由：数据库错误
  app.get("/test/db-error", (req, res) => {
    const error = new Error("数据库连接失败");
    error.code = "ECONNREFUSED";
    throw error;
  });

  // 测试路由：成功响应
  app.get("/test/success", (req, res) => {
    res.json({ success: true, message: "成功" });
  });

  // 404 处理
  app.use(notFoundHandler);

  // 全局错误处理
  app.use(errorHandler);

  return app;
}

describe("Error Handler Integration Tests", () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("404 错误处理", () => {
    test("应该返回 404 状态码和错误消息", async () => {
      const response = await request(app).get("/nonexistent-route").expect(404);

      expect(response.body).toEqual({
        success: false,
        message: "请求的资源不存在",
        path: "/nonexistent-route",
      });
    });

    test("应该处理 POST 请求的 404", async () => {
      const response = await request(app)
        .post("/nonexistent-route")
        .send({ data: "test" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("请求的资源不存在");
    });
  });

  describe("同步错误处理", () => {
    test("应该捕获同步抛出的错误", async () => {
      const response = await request(app).get("/test/sync-error").expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });
  });

  describe("异步错误处理", () => {
    test("应该捕获异步函数中的错误", async () => {
      const response = await request(app).get("/test/async-error").expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    test("应该捕获 Promise 拒绝", async () => {
      const response = await request(app)
        .get("/test/promise-rejection")
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });
  });

  describe("自定义状态码", () => {
    test("应该使用错误对象的自定义状态码", async () => {
      const response = await request(app)
        .get("/test/custom-status")
        .expect(418);

      expect(response.body.success).toBe(false);
    });
  });

  describe("不同错误类型", () => {
    test("应该为验证错误返回 400", async () => {
      const response = await request(app)
        .post("/test/validation-error")
        .send({ data: "test" })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    test("应该为认证错误返回 401", async () => {
      const response = await request(app).get("/test/auth-error").expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    test("应该为数据库错误返回 500", async () => {
      const response = await request(app).get("/test/db-error").expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });
  });

  describe("错误响应格式", () => {
    test("应该返回统一的错误响应格式", async () => {
      const response = await request(app).get("/test/sync-error").expect(500);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
      expect(typeof response.body.message).toBe("string");
    });

    test("应该在开发环境包含调试信息", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const response = await request(app).get("/test/sync-error").expect(500);

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("stack");

      process.env.NODE_ENV = originalEnv;
    });

    test("应该在生产环境隐藏调试信息", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const response = await request(app).get("/test/sync-error").expect(500);

      expect(response.body).not.toHaveProperty("error");
      expect(response.body).not.toHaveProperty("stack");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("成功响应", () => {
    test("应该正常处理成功的请求", async () => {
      const response = await request(app).get("/test/success").expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "成功",
      });
    });
  });

  describe("Content-Type", () => {
    test("应该返回 JSON 格式的错误响应", async () => {
      const response = await request(app).get("/test/sync-error").expect(500);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    test("应该返回 JSON 格式的 404 响应", async () => {
      const response = await request(app).get("/nonexistent").expect(404);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });
  });

  describe("错误日志", () => {
    test("应该记录错误到控制台", async () => {
      await request(app).get("/test/sync-error").expect(500);

      expect(console.error).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "API Error:",
        expect.any(String),
      );
    });
  });
});

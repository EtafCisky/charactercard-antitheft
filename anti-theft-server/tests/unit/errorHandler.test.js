/**
 * 错误处理中间件单元测试
 *
 * 测试覆盖：
 * - 统一错误响应格式
 * - 错误日志记录
 * - 敏感信息过滤
 * - 不同错误类型的状态码
 * - 404 处理
 * - 异步错误处理
 */

const {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  sanitizeObject,
  containsSensitiveInfo,
  getStatusCode,
  getUserMessage,
} = require("../../src/middleware/errorHandler");

describe("Error Handler Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    // Mock request object
    req = {
      method: "POST",
      path: "/api/test",
      ip: "127.0.0.1",
      body: {},
      query: {},
      headers: {},
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    next = jest.fn();

    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("errorHandler", () => {
    test("应该返回统一的错误响应格式", () => {
      const error = new Error("测试错误");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    test("应该记录错误日志", () => {
      const error = new Error("测试错误");

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith(
        "API Error:",
        expect.stringContaining("测试错误"),
      );
    });

    test("应该在生产环境返回通用错误消息", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("详细的内部错误");
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "服务器内部错误",
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    test("应该在开发环境返回详细错误消息", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("详细的错误消息");

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "详细的错误消息",
          error: expect.any(Object),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    test("应该处理数据库连接错误", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Connection refused");
      error.code = "ECONNREFUSED";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "服务器内部错误，请稍后重试",
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    test("应该包含用户信息在日志中（如果存在）", () => {
      req.user = {
        userId: 123,
        username: "testuser",
      };

      const error = new Error("测试错误");

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith(
        "API Error:",
        expect.stringContaining("testuser"),
      );
    });
  });

  describe("getStatusCode", () => {
    test("应该返回错误对象的 statusCode", () => {
      const error = new Error("测试");
      error.statusCode = 404;

      expect(getStatusCode(error)).toBe(404);
    });

    test("应该返回错误对象的 status", () => {
      const error = new Error("测试");
      error.status = 403;

      expect(getStatusCode(error)).toBe(403);
    });

    test("应该为 ValidationError 返回 400", () => {
      const error = new Error("验证失败");
      error.name = "ValidationError";

      expect(getStatusCode(error)).toBe(400);
    });

    test("应该为认证错误返回 401", () => {
      const error = new Error("认证失败");
      error.name = "UnauthorizedError";

      expect(getStatusCode(error)).toBe(401);
    });

    test("应该为权限错误返回 403", () => {
      const error = new Error("权限不足");
      error.name = "ForbiddenError";

      expect(getStatusCode(error)).toBe(403);
    });

    test("应该为未找到错误返回 404", () => {
      const error = new Error("资源不存在");
      error.name = "NotFoundError";

      expect(getStatusCode(error)).toBe(404);
    });

    test("应该为冲突错误返回 409", () => {
      const error = new Error("资源已存在");
      error.name = "ConflictError";

      expect(getStatusCode(error)).toBe(409);
    });

    test("应该为速率限制错误返回 429", () => {
      const error = new Error("请求过于频繁");
      error.name = "TooManyRequestsError";

      expect(getStatusCode(error)).toBe(429);
    });

    test("应该为数据库错误返回 500", () => {
      const error = new Error("数据库错误");
      error.code = "ER_DUP_ENTRY";

      expect(getStatusCode(error)).toBe(500);
    });

    test("应该为未知错误返回 500", () => {
      const error = new Error("未知错误");

      expect(getStatusCode(error)).toBe(500);
    });
  });

  describe("sanitizeObject", () => {
    test("应该清理包含敏感信息的字段", () => {
      const obj = {
        username: "testuser",
        password: "secret123",
        email: "test@example.com",
        token: "abc123",
      };

      const sanitized = sanitizeObject(obj);

      expect(sanitized.username).toBe("testuser");
      expect(sanitized.email).toBe("test@example.com");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
    });

    test("应该递归清理嵌套对象", () => {
      const obj = {
        user: {
          username: "testuser",
          password: "secret123",
        },
        data: {
          apiKey: "key123",
        },
      };

      const sanitized = sanitizeObject(obj);

      expect(sanitized.user.username).toBe("testuser");
      expect(sanitized.user.password).toBe("[REDACTED]");
      expect(sanitized.data.apiKey).toBe("[REDACTED]");
    });

    test("应该处理 null 和 undefined", () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });

    test("应该处理非对象类型", () => {
      expect(sanitizeObject("string")).toBe("string");
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(true)).toBe(true);
    });
  });

  describe("containsSensitiveInfo", () => {
    test("应该检测包含 password 的字符串", () => {
      expect(containsSensitiveInfo("password")).toBe(true);
      expect(containsSensitiveInfo("user_password")).toBe(true);
      expect(containsSensitiveInfo("PASSWORD")).toBe(true);
    });

    test("应该检测包含 token 的字符串", () => {
      expect(containsSensitiveInfo("token")).toBe(true);
      expect(containsSensitiveInfo("auth_token")).toBe(true);
      expect(containsSensitiveInfo("TOKEN")).toBe(true);
    });

    test("应该检测包含 secret 的字符串", () => {
      expect(containsSensitiveInfo("secret")).toBe(true);
      expect(containsSensitiveInfo("jwt_secret")).toBe(true);
    });

    test("应该检测包含 api_key 的字符串", () => {
      expect(containsSensitiveInfo("api_key")).toBe(true);
      expect(containsSensitiveInfo("apiKey")).toBe(true);
    });

    test("应该对不包含敏感信息的字符串返回 false", () => {
      expect(containsSensitiveInfo("username")).toBe(false);
      expect(containsSensitiveInfo("email")).toBe(false);
      expect(containsSensitiveInfo("card_id")).toBe(false);
    });

    test("应该处理 null 和 undefined", () => {
      expect(containsSensitiveInfo(null)).toBe(false);
      expect(containsSensitiveInfo(undefined)).toBe(false);
    });
  });

  describe("getUserMessage", () => {
    test("应该在生产环境返回通用消息（5xx 错误）", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("详细的内部错误");
      const message = getUserMessage(error, 500);

      expect(message).toBe("服务器内部错误");

      process.env.NODE_ENV = originalEnv;
    });

    test("应该在生产环境返回详细消息（4xx 错误）", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("验证失败");
      const message = getUserMessage(error, 400);

      expect(message).toBe("验证失败");

      process.env.NODE_ENV = originalEnv;
    });

    test("应该在开发环境返回详细消息", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("详细的错误消息");
      const message = getUserMessage(error, 500);

      expect(message).toBe("详细的错误消息");

      process.env.NODE_ENV = originalEnv;
    });

    test("应该为数据库连接错误返回友好消息", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Connection refused");
      error.code = "ECONNREFUSED";
      const message = getUserMessage(error, 500);

      expect(message).toBe("服务器内部错误，请稍后重试");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("notFoundHandler", () => {
    test("应该返回 404 状态码和错误消息", () => {
      req.path = "/api/nonexistent";

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "请求的资源不存在",
        path: "/api/nonexistent",
      });
    });
  });

  describe("asyncHandler", () => {
    test("应该捕获异步函数中的错误", async () => {
      const asyncFn = async (req, res) => {
        throw new Error("异步错误");
      };

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe("异步错误");
    });

    test("应该正常处理成功的异步函数", async () => {
      const asyncFn = async (req, res) => {
        res.json({ success: true });
      };

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test("应该捕获 Promise 拒绝", async () => {
      const asyncFn = (req, res) => {
        return Promise.reject(new Error("Promise 拒绝"));
      };

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe("Promise 拒绝");
    });
  });

  describe("Integration with request body", () => {
    test("应该在日志中清理请求体中的敏感信息", () => {
      req.body = {
        username: "testuser",
        password: "secret123",
        card_name: "测试角色",
      };

      const error = new Error("测试错误");

      errorHandler(error, req, res, next);

      const logCall = console.error.mock.calls[0][1];
      const logData = JSON.parse(logCall);

      expect(logData.requestBody.username).toBe("testuser");
      expect(logData.requestBody.card_name).toBe("测试角色");
      expect(logData.requestBody.password).toBe("[REDACTED]");
    });

    test("应该记录查询参数", () => {
      req.query = {
        page: "1",
        limit: "20",
      };

      const error = new Error("测试错误");

      errorHandler(error, req, res, next);

      const logCall = console.error.mock.calls[0][1];
      const logData = JSON.parse(logCall);

      expect(logData.queryParams).toEqual({
        page: "1",
        limit: "20",
      });
    });
  });

  describe("Error types", () => {
    test("应该正确处理 CORS 错误", () => {
      const error = new Error("不允许的 CORS 来源");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    test("应该正确处理认证错误", () => {
      const error = new Error("认证令牌无效");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("应该正确处理验证错误", () => {
      const error = new Error("输入验证失败");
      error.name = "ValidationError";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

/**
 * 日志系统单元测试
 *
 * 测试覆盖：
 * - 敏感信息过滤
 * - 不同日志级别的记录
 * - 认证日志记录
 * - 密码验证日志记录
 * - 密码更新日志记录
 * - 数据库错误日志记录
 * - API 错误日志记录
 */

const {
  sanitizeMetadata,
  logAuthAttempt,
  logPasswordVerification,
  logPasswordUpdate,
  logDatabaseError,
  logApiError,
  logInfo,
  logWarn,
  logError,
  logger,
} = require("../../src/utils/logger");

// Mock Winston logger
jest.mock("winston", () => {
  const mFormat = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
  };

  const mTransports = {
    Console: jest.fn(),
    File: jest.fn(),
  };

  const mLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return {
    format: mFormat,
    transports: mTransports,
    createLogger: jest.fn(() => mLogger),
  };
});

describe("Logger - 敏感信息过滤", () => {
  test("应该过滤明文密码", () => {
    const input = {
      username: "testuser",
      password: "secret123",
      email: "test@example.com",
    };

    const result = sanitizeMetadata(input);

    expect(result.username).toBe("testuser");
    expect(result.password).toBe("[REDACTED]");
    expect(result.email).toBe("test@example.com");
  });

  test("应该过滤 new_password 字段", () => {
    const input = {
      card_id: "123456",
      new_password: "newSecret456",
    };

    const result = sanitizeMetadata(input);

    expect(result.card_id).toBe("123456");
    expect(result.new_password).toBe("[REDACTED]");
  });

  test("应该过滤 password_hash 字段", () => {
    const input = {
      user_id: 1,
      password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz",
    };

    const result = sanitizeMetadata(input);

    expect(result.user_id).toBe(1);
    expect(result.password_hash).toBe("[REDACTED]");
  });

  test("应该过滤 token 和 jwt 字段", () => {
    const input = {
      username: "testuser",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    };

    const result = sanitizeMetadata(input);

    expect(result.username).toBe("testuser");
    expect(result.token).toBe("[REDACTED]");
    expect(result.jwt).toBe("[REDACTED]");
  });

  test("应该过滤 authorization 字段", () => {
    const input = {
      method: "POST",
      authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    };

    const result = sanitizeMetadata(input);

    expect(result.method).toBe("POST");
    expect(result.authorization).toBe("[REDACTED]");
  });

  test("应该递归过滤嵌套对象中的敏感信息", () => {
    const input = {
      user: {
        username: "testuser",
        password: "secret123",
        profile: {
          email: "test@example.com",
          token: "abc123",
        },
      },
    };

    const result = sanitizeMetadata(input);

    expect(result.user.username).toBe("testuser");
    expect(result.user.password).toBe("[REDACTED]");
    expect(result.user.profile.email).toBe("test@example.com");
    expect(result.user.profile.token).toBe("[REDACTED]");
  });

  test("应该处理数组中的敏感信息", () => {
    const input = {
      users: [
        { username: "user1", password: "pass1" },
        { username: "user2", password: "pass2" },
      ],
    };

    const result = sanitizeMetadata(input);

    expect(result.users[0].username).toBe("user1");
    expect(result.users[0].password).toBe("[REDACTED]");
    expect(result.users[1].username).toBe("user2");
    expect(result.users[1].password).toBe("[REDACTED]");
  });

  test("应该处理 null 和 undefined 值", () => {
    const input = {
      username: "testuser",
      password: null,
      token: undefined,
    };

    const result = sanitizeMetadata(input);

    expect(result.username).toBe("testuser");
    expect(result.password).toBe("[REDACTED]");
    expect(result.token).toBe("[REDACTED]");
  });

  test("应该保留非敏感字段不变", () => {
    const input = {
      card_id: "123456",
      username: "testuser",
      operation: "verify",
      timestamp: "2024-01-15T10:30:00Z",
      success: true,
    };

    const result = sanitizeMetadata(input);

    expect(result).toEqual(input);
  });
});

describe("Logger - 认证日志", () => {
  beforeEach(() => {
    logger.info.mockClear();
    logger.warn.mockClear();
  });

  test("应该记录成功的注册尝试", () => {
    logAuthAttempt("register", "testuser", true);

    expect(logger.info).toHaveBeenCalledWith(
      "认证成功: register - testuser",
      expect.objectContaining({
        operation_type: "authentication",
        auth_operation: "register",
        username: "testuser",
        success: true,
      }),
    );
  });

  test("应该记录失败的登录尝试", () => {
    logAuthAttempt("login", "testuser", false, "密码错误");

    expect(logger.warn).toHaveBeenCalledWith(
      "认证失败: login - testuser",
      expect.objectContaining({
        operation_type: "authentication",
        auth_operation: "login",
        username: "testuser",
        success: false,
        reason: "密码错误",
      }),
    );
  });

  test("应该记录登出操作", () => {
    logAuthAttempt("logout", "testuser", true);

    expect(logger.info).toHaveBeenCalledWith(
      "认证成功: logout - testuser",
      expect.objectContaining({
        auth_operation: "logout",
        username: "testuser",
        success: true,
      }),
    );
  });
});

describe("Logger - 密码验证日志", () => {
  beforeEach(() => {
    logger.info.mockClear();
    logger.warn.mockClear();
  });

  test("应该记录成功的密码验证", () => {
    logPasswordVerification("123456", true, "192.168.1.1");

    expect(logger.info).toHaveBeenCalledWith(
      "密码验证成功: Card ID 123456",
      expect.objectContaining({
        operation_type: "password_verification",
        card_id: "123456",
        success: true,
        ip_address: "192.168.1.1",
      }),
    );
  });

  test("应该记录失败的密码验证", () => {
    logPasswordVerification("123456", false, "192.168.1.1", "密码错误");

    expect(logger.warn).toHaveBeenCalledWith(
      "密码验证失败: Card ID 123456",
      expect.objectContaining({
        operation_type: "password_verification",
        card_id: "123456",
        success: false,
        ip_address: "192.168.1.1",
        reason: "密码错误",
      }),
    );
  });

  test("应该记录不带 IP 地址的验证", () => {
    logPasswordVerification("123456", true);

    expect(logger.info).toHaveBeenCalledWith(
      "密码验证成功: Card ID 123456",
      expect.objectContaining({
        card_id: "123456",
        success: true,
      }),
    );

    const callArgs = logger.info.mock.calls[0][1];
    expect(callArgs.ip_address).toBeUndefined();
  });
});

describe("Logger - 密码更新日志", () => {
  beforeEach(() => {
    logger.info.mockClear();
  });

  test("应该记录密码更新操作", () => {
    logPasswordUpdate("123456", 1, 2, "testuser");

    expect(logger.info).toHaveBeenCalledWith(
      "密码更新: Card ID 123456 (版本 1 -> 2)",
      expect.objectContaining({
        operation_type: "password_update",
        card_id: "123456",
        old_version: 1,
        new_version: 2,
        username: "testuser",
      }),
    );
  });

  test("应该记录多次密码更新", () => {
    logPasswordUpdate("123456", 5, 6, "testuser");

    expect(logger.info).toHaveBeenCalledWith(
      "密码更新: Card ID 123456 (版本 5 -> 6)",
      expect.objectContaining({
        old_version: 5,
        new_version: 6,
      }),
    );
  });
});

describe("Logger - 数据库错误日志", () => {
  beforeEach(() => {
    logger.error.mockClear();
  });

  test("应该记录数据库连接错误", () => {
    const error = new Error("Connection refused");
    error.code = "ECONNREFUSED";
    error.errno = 1045;

    logDatabaseError("连接数据库", error);

    expect(logger.error).toHaveBeenCalledWith(
      "数据库错误: 连接数据库",
      expect.objectContaining({
        operation_type: "database_error",
        operation: "连接数据库",
        error_message: "Connection refused",
        error_code: "ECONNREFUSED",
        error_errno: 1045,
      }),
    );
  });

  test("应该记录 SQL 查询错误", () => {
    const error = new Error("Syntax error");
    error.code = "ER_PARSE_ERROR";
    error.sql = "SELECT * FROM invalid_table";

    logDatabaseError("执行查询", error, { query_type: "SELECT" });

    expect(logger.error).toHaveBeenCalledWith(
      "数据库错误: 执行查询",
      expect.objectContaining({
        operation: "执行查询",
        error_message: "Syntax error",
        error_sql: "SELECT * FROM invalid_table",
        query_type: "SELECT",
      }),
    );
  });
});

describe("Logger - API 错误日志", () => {
  beforeEach(() => {
    logger.error.mockClear();
  });

  test("应该记录 API 错误（Error 对象）", () => {
    const error = new Error("Internal server error");
    error.stack = "Error: Internal server error\n    at ...";

    logApiError("POST", "/api/verify", 500, error);

    expect(logger.error).toHaveBeenCalledWith(
      "API 错误: POST /api/verify - 500",
      expect.objectContaining({
        operation_type: "api_error",
        http_method: "POST",
        path: "/api/verify",
        status_code: 500,
        error_message: "Internal server error",
        stack_trace: expect.stringContaining("Error: Internal server error"),
      }),
    );
  });

  test("应该记录 API 错误（字符串消息）", () => {
    logApiError("GET", "/api/cards", 404, "Card not found");

    expect(logger.error).toHaveBeenCalledWith(
      "API 错误: GET /api/cards - 404",
      expect.objectContaining({
        http_method: "GET",
        path: "/api/cards",
        status_code: 404,
        error_message: "Card not found",
      }),
    );
  });

  test("应该记录带额外上下文的 API 错误", () => {
    const error = new Error("Validation failed");

    logApiError("POST", "/api/auth/register", 400, error, {
      validation_errors: ["username is required"],
    });

    expect(logger.error).toHaveBeenCalledWith(
      "API 错误: POST /api/auth/register - 400",
      expect.objectContaining({
        status_code: 400,
        error_message: "Validation failed",
        validation_errors: ["username is required"],
      }),
    );
  });
});

describe("Logger - 一般日志方法", () => {
  beforeEach(() => {
    logger.info.mockClear();
    logger.warn.mockClear();
    logger.error.mockClear();
  });

  test("logInfo 应该记录信息日志", () => {
    logInfo("服务器启动", { port: 3000 });

    expect(logger.info).toHaveBeenCalledWith(
      "服务器启动",
      expect.objectContaining({
        port: 3000,
        timestamp: expect.any(String),
      }),
    );
  });

  test("logWarn 应该记录警告日志", () => {
    logWarn("配置缺失", { config_key: "REDIS_URL" });

    expect(logger.warn).toHaveBeenCalledWith(
      "配置缺失",
      expect.objectContaining({
        config_key: "REDIS_URL",
        timestamp: expect.any(String),
      }),
    );
  });

  test("logError 应该记录错误日志（Error 对象）", () => {
    const error = new Error("Unexpected error");
    error.stack = "Error: Unexpected error\n    at ...";

    logError("发生未预期的错误", error);

    expect(logger.error).toHaveBeenCalledWith(
      "发生未预期的错误",
      expect.objectContaining({
        error_message: "Unexpected error",
        stack_trace: expect.stringContaining("Error: Unexpected error"),
        timestamp: expect.any(String),
      }),
    );
  });

  test("logError 应该记录错误日志（元数据对象）", () => {
    logError("操作失败", {
      operation: "file_write",
      reason: "permission denied",
    });

    expect(logger.error).toHaveBeenCalledWith(
      "操作失败",
      expect.objectContaining({
        operation: "file_write",
        reason: "permission denied",
        timestamp: expect.any(String),
      }),
    );
  });
});

describe("Logger - 时间戳", () => {
  beforeEach(() => {
    logger.info.mockClear();
  });

  test("所有日志方法应该包含 ISO 格式的时间戳", () => {
    logInfo("测试消息");

    const callArgs = logger.info.mock.calls[0][1];
    expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

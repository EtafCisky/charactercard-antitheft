/**
 * 认证中间件单元测试
 */

const { authenticateToken } = require("../../src/middleware/auth");
const { generateToken } = require("../../src/utils/jwt");

describe("Authentication Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    // 模拟 Express request, response, next
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("authenticateToken", () => {
    test("应该在缺少 Authorization header 时返回 401", () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "未提供认证令牌",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("应该在 Authorization header 格式错误时返回 401", () => {
      req.headers["authorization"] = "InvalidFormat token123";

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "认证令牌格式错误",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("应该在 token 无效时返回 403", () => {
      req.headers["authorization"] = "Bearer invalid_token";

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "认证令牌无效或已过期",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("应该在 token 有效时将用户信息附加到 req.user 并调用 next", () => {
      const userId = 123;
      const username = "testuser";
      const token = generateToken(userId, username);

      req.headers["authorization"] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(userId);
      expect(req.user.username).toBe(username);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("应该处理不带 Bearer 前缀的 token", () => {
      req.headers["authorization"] = "invalid_token_without_bearer";

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "认证令牌格式错误",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("应该处理空的 Bearer token", () => {
      req.headers["authorization"] = "Bearer ";

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "认证令牌格式错误",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

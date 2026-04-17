/**
 * 认证中间件集成测试
 * 测试中间件在实际 Express 应用中的行为
 */

const request = require("supertest");
const express = require("express");
const { authenticateToken } = require("../../src/middleware/auth");
const { generateToken } = require("../../src/utils/jwt");

describe("Authentication Middleware Integration", () => {
  let app;

  beforeEach(() => {
    // 创建测试用的 Express 应用
    app = express();
    app.use(express.json());

    // 创建受保护的测试路由
    app.get("/protected", authenticateToken, (req, res) => {
      res.json({
        success: true,
        message: "访问成功",
        user: req.user,
      });
    });
  });

  test("应该拒绝没有 token 的请求", async () => {
    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "未提供认证令牌",
    });
  });

  test("应该拒绝格式错误的 token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "InvalidFormat token123");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "认证令牌格式错误",
    });
  });

  test("应该拒绝无效的 token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid_token_string");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "认证令牌无效或已过期",
    });
  });

  test("应该允许有效 token 的请求并返回用户信息", async () => {
    const userId = 456;
    const username = "integrationuser";
    const token = generateToken(userId, username);

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("访问成功");
    expect(response.body.user).toEqual({
      userId,
      username,
    });
  });

  test("应该在多个请求中正确验证不同的 token", async () => {
    const user1 = { userId: 1, username: "user1" };
    const user2 = { userId: 2, username: "user2" };
    const token1 = generateToken(user1.userId, user1.username);
    const token2 = generateToken(user2.userId, user2.username);

    // 第一个请求
    const response1 = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token1}`);

    expect(response1.status).toBe(200);
    expect(response1.body.user).toEqual(user1);

    // 第二个请求
    const response2 = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token2}`);

    expect(response2.status).toBe(200);
    expect(response2.body.user).toEqual(user2);
  });

  test("应该处理 Authorization header 大小写不敏感", async () => {
    const userId = 789;
    const username = "casetest";
    const token = generateToken(userId, username);

    const response = await request(app)
      .get("/protected")
      .set("authorization", `Bearer ${token}`); // 小写 authorization

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      userId,
      username,
    });
  });
});

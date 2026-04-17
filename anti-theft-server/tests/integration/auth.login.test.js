/**
 * 用户登录接口集成测试
 *
 * 测试需求：
 * - 需求 6：作者认证系统 - 用户登录功能
 * - 需求 14：输入验证
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { verifyTokenSync } = require("../../src/utils/jwt");
const { hashPassword } = require("../../src/utils/crypto");

describe("POST /api/auth/login - 用户登录", () => {
  // 测试用户数据
  const testUser = {
    username: "logintest",
    email: "logintest@example.com",
    password: "testPassword123",
  };

  let testUserId;

  // 在所有测试前初始化数据库连接并创建测试用户
  beforeAll(async () => {
    // 如果数据库未连接，则初始化连接
    if (!db.isConnectionActive()) {
      await db.initializeWithRetry();
    }

    // 创建测试用户
    const passwordHash = await hashPassword(testUser.password);
    const result = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [testUser.username, testUser.email, passwordHash],
    );
    testUserId = result.insertId;
  });

  // 在所有测试后清理测试数据并关闭数据库连接
  afterAll(async () => {
    try {
      // 删除测试用户
      await db.query("DELETE FROM users WHERE username LIKE ?", ["logintest%"]);
      await db.query("DELETE FROM users WHERE email LIKE ?", [
        "logintest%@example.com",
      ]);
    } catch (error) {
      console.error("清理测试数据失败:", error);
    }
    await db.closePool();
  });

  // ==========================================================================
  // 成功场景测试
  // ==========================================================================

  describe("成功场景", () => {
    test("应该成功登录并返回 token 和用户信息", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      // 验证响应结构
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();

      // 验证用户信息
      expect(response.body.user.id).toBe(testUserId);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.email).toBe(testUser.email);

      // 验证 token 有效性
      const decoded = verifyTokenSync(response.body.token);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.username).toBe(testUser.username);
    });

    test("应该正确处理用户名的空格（trim）", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: `  ${testUser.username}  `,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe(testUser.username);
    });

    test("生成的 token 应该有 7 天有效期", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      const decoded = verifyTokenSync(response.body.token);

      // 计算过期时间（秒）
      const expiresIn = decoded.exp - decoded.iat;
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;

      expect(expiresIn).toBe(sevenDaysInSeconds);
    });

    test("token 应该包含正确的用户信息", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      const decoded = verifyTokenSync(response.body.token);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.username).toBe(testUser.username);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });

  // ==========================================================================
  // 输入验证测试
  // ==========================================================================

  describe("输入验证", () => {
    test("应该拒绝空用户名", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "",
          password: testUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("用户名");
    });

    test("应该拒绝缺失用户名", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          password: testUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("用户名");
    });

    test("应该拒绝空密码", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: "",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("密码");
    });

    test("应该拒绝缺失密码", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("密码");
    });

    test("应该拒绝非字符串类型的用户名", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: 12345,
          password: testUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("用户名");
    });

    test("应该拒绝非字符串类型的密码", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: 12345,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("密码");
    });
  });

  // ==========================================================================
  // 认证失败测试
  // ==========================================================================

  describe("认证失败", () => {
    test("应该拒绝不存在的用户名", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "nonexistentuser",
          password: "anypassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("用户名或密码错误");
    });

    test("应该拒绝错误的密码", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: "wrongPassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("用户名或密码错误");
    });

    test("应该拒绝密码大小写错误", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password.toUpperCase(),
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("用户名或密码错误");
    });

    test("应该拒绝密码多余空格", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: `${testUser.password} `,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("用户名或密码错误");
    });
  });

  // ==========================================================================
  // 安全性测试
  // ==========================================================================

  describe("安全性", () => {
    test("错误消息不应该泄露用户是否存在", async () => {
      // 不存在的用户
      const response1 = await request(app)
        .post("/api/auth/login")
        .send({
          username: "nonexistent",
          password: "password",
        })
        .expect(401);

      // 存在的用户但密码错误
      const response2 = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: "wrongpassword",
        })
        .expect(401);

      // 两种情况应该返回相同的错误消息
      expect(response1.body.message).toBe(response2.body.message);
      expect(response1.body.message).toBe("用户名或密码错误");
    });

    test("响应不应该包含密码哈希", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      // 验证响应中不包含 password_hash
      expect(response.body.user.password_hash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();

      // 验证响应只包含安全的字段
      const userKeys = Object.keys(response.body.user);
      expect(userKeys).toEqual(["id", "username", "email"]);
    });
  });

  // ==========================================================================
  // 多次登录测试
  // ==========================================================================

  describe("多次登录", () => {
    test("应该允许同一用户多次登录", async () => {
      // 第一次登录
      const response1 = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(response1.body.success).toBe(true);
      const token1 = response1.body.token;

      // 第二次登录
      const response2 = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(response2.body.success).toBe(true);
      const token2 = response2.body.token;

      // 两次登录应该生成不同的 token
      expect(token1).not.toBe(token2);

      // 两个 token 都应该有效
      const decoded1 = verifyTokenSync(token1);
      const decoded2 = verifyTokenSync(token2);

      expect(decoded1.userId).toBe(testUserId);
      expect(decoded2.userId).toBe(testUserId);
    });
  });

  // ==========================================================================
  // 边界情况测试
  // ==========================================================================

  describe("边界情况", () => {
    test("应该处理包含特殊字符的密码", async () => {
      // 创建一个包含特殊字符密码的测试用户
      const specialUser = {
        username: "logintest_special",
        email: "logintest_special@example.com",
        password: "P@ssw0rd!#$%^&*()",
      };

      const passwordHash = await hashPassword(specialUser.password);
      await db.query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [specialUser.username, specialUser.email, passwordHash],
      );

      // 登录测试
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: specialUser.username,
          password: specialUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe(specialUser.username);
    });

    test("应该处理最短密码（1个字符）", async () => {
      // 创建一个最短密码的测试用户
      const shortPassUser = {
        username: "logintest_short",
        email: "logintest_short@example.com",
        password: "a",
      };

      const passwordHash = await hashPassword(shortPassUser.password);
      await db.query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [shortPassUser.username, shortPassUser.email, passwordHash],
      );

      // 登录测试
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: shortPassUser.username,
          password: shortPassUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test("应该处理最长密码（100个字符）", async () => {
      // 创建一个最长密码的测试用户
      const longPassUser = {
        username: "logintest_long",
        email: "logintest_long@example.com",
        password: "a".repeat(100),
      };

      const passwordHash = await hashPassword(longPassUser.password);
      await db.query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [longPassUser.username, longPassUser.email, passwordHash],
      );

      // 登录测试
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: longPassUser.username,
          password: longPassUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

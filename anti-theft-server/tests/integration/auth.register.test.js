/**
 * 用户注册接口集成测试
 *
 * 测试需求：
 * - 需求 6：作者认证系统 - 用户注册功能
 * - 需求 14：输入验证
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { verifyTokenSync } = require("../../src/utils/jwt");

describe("POST /api/auth/register - 用户注册", () => {
  // 在所有测试前初始化数据库连接
  beforeAll(async () => {
    // 如果数据库未连接，则初始化连接
    if (!db.isConnectionActive()) {
      await db.initializeWithRetry();
    }
  });

  // 在每个测试后清理测试数据
  afterEach(async () => {
    try {
      // 删除测试用户
      await db.query("DELETE FROM users WHERE username LIKE ?", ["testuser%"]);
      await db.query("DELETE FROM users WHERE email LIKE ?", [
        "test%@example.com",
      ]);
    } catch (error) {
      console.error("清理测试数据失败:", error);
    }
  });

  // 在所有测试后关闭数据库连接
  afterAll(async () => {
    await db.closePool();
  });

  // ==========================================================================
  // 成功场景测试
  // ==========================================================================

  describe("成功场景", () => {
    test("应该成功注册新用户并返回 token 和用户信息", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser1",
          email: "test1@example.com",
          password: "securePassword123",
        })
        .expect(201);

      // 验证响应结构
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();

      // 验证用户信息
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.username).toBe("testuser1");
      expect(response.body.user.email).toBe("test1@example.com");

      // 验证 token 有效性
      const decoded = verifyTokenSync(response.body.token);
      expect(decoded.userId).toBe(response.body.user.id);
      expect(decoded.username).toBe("testuser1");
    });

    test("应该正确处理用户名和邮箱的空格（trim）", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "  testuser2  ",
          email: "  TEST2@EXAMPLE.COM  ",
          password: "password123",
        })
        .expect(201);

      expect(response.body.user.username).toBe("testuser2");
      expect(response.body.user.email).toBe("test2@example.com"); // 应该转为小写
    });

    test("应该支持最小长度的用户名（3个字符）", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "abc",
          email: "test3@example.com",
          password: "pass",
        })
        .expect(201);

      expect(response.body.user.username).toBe("abc");
    });

    test("应该支持最大长度的用户名（50个字符）", async () => {
      const longUsername = "a".repeat(50);
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: longUsername,
          email: "test4@example.com",
          password: "password",
        })
        .expect(201);

      expect(response.body.user.username).toBe(longUsername);
    });

    test("应该支持最小长度的密码（1个字符）", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser5",
          email: "test5@example.com",
          password: "a",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test("应该支持包含特殊字符的密码", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser6",
          email: "test6@example.com",
          password: "P@ssw0rd!#$%^&*()",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // 输入验证测试
  // ==========================================================================

  describe("输入验证", () => {
    test("应该拒绝空用户名", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "",
          email: "test@example.com",
          password: "password",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("用户名");
    });

    test("应该拒绝缺失用户名", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("用户名");
    });

    test("应该拒绝过短的用户名（少于3个字符）", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "ab",
          email: "test@example.com",
          password: "password",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("3-50");
    });

    test("应该拒绝过长的用户名（超过50个字符）", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "a".repeat(51),
          email: "test@example.com",
          password: "password",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("3-50");
    });

    test("应该拒绝包含非法字符的用户名", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "test user!",
          email: "test@example.com",
          password: "password",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("字母、数字、下划线和连字符");
    });

    test("应该拒绝空邮箱", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: "",
          password: "password",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("邮箱");
    });

    test("应该拒绝缺失邮箱", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          password: "password",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("邮箱");
    });

    test("应该拒绝格式错误的邮箱", async () => {
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
        "double@@domain.com",
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            username: "testuser",
            email: email,
            password: "password",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("邮箱格式");
      }
    });

    test("应该拒绝过长的邮箱（超过100个字符）", async () => {
      const longEmail = "a".repeat(90) + "@example.com";
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: longEmail,
          password: "password",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("100");
    });

    test("应该拒绝空密码", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("密码");
    });

    test("应该拒绝缺失密码", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("密码");
    });

    test("应该拒绝过长的密码（超过100个字符）", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "a".repeat(101),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("1-100");
    });
  });

  // ==========================================================================
  // 唯一性约束测试
  // ==========================================================================

  describe("唯一性约束", () => {
    test("应该拒绝重复的用户名", async () => {
      // 第一次注册
      await request(app)
        .post("/api/auth/register")
        .send({
          username: "duplicateuser",
          email: "first@example.com",
          password: "password1",
        })
        .expect(201);

      // 第二次注册相同用户名
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "duplicateuser",
          email: "second@example.com",
          password: "password2",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("用户名已存在");
    });

    test("应该拒绝重复的邮箱", async () => {
      // 第一次注册
      await request(app)
        .post("/api/auth/register")
        .send({
          username: "user1",
          email: "duplicate@example.com",
          password: "password1",
        })
        .expect(201);

      // 第二次注册相同邮箱
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "user2",
          email: "duplicate@example.com",
          password: "password2",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("邮箱已被注册");
    });

    test("应该拒绝重复的邮箱（不区分大小写）", async () => {
      // 第一次注册
      await request(app)
        .post("/api/auth/register")
        .send({
          username: "user3",
          email: "CaseSensitive@Example.COM",
          password: "password1",
        })
        .expect(201);

      // 第二次注册相同邮箱（不同大小写）
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "user4",
          email: "casesensitive@example.com",
          password: "password2",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("邮箱已被注册");
    });
  });

  // ==========================================================================
  // 密码加密测试
  // ==========================================================================

  describe("密码加密", () => {
    test("应该使用 bcrypt 加密密码（不存储明文）", async () => {
      const password = "mySecretPassword123";

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "secureuser",
          email: "secure@example.com",
          password: password,
        })
        .expect(201);

      // 从数据库查询密码哈希
      const users = await db.query(
        "SELECT password_hash FROM users WHERE id = ?",
        [response.body.user.id],
      );

      expect(users.length).toBe(1);
      const passwordHash = users[0].password_hash;

      // 验证密码哈希不等于明文密码
      expect(passwordHash).not.toBe(password);

      // 验证密码哈希是 bcrypt 格式（以 $2b$ 开头，长度为 60）
      expect(passwordHash).toMatch(/^\$2b\$/);
      expect(passwordHash.length).toBe(60);
    });
  });

  // ==========================================================================
  // JWT Token 测试
  // ==========================================================================

  describe("JWT Token", () => {
    test("生成的 token 应该有 7 天有效期", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "tokenuser",
          email: "token@example.com",
          password: "password",
        })
        .expect(201);

      const decoded = verifyTokenSync(response.body.token);

      // 计算过期时间（秒）
      const expiresIn = decoded.exp - decoded.iat;
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;

      expect(expiresIn).toBe(sevenDaysInSeconds);
    });

    test("token 应该包含正确的用户信息", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "payloaduser",
          email: "payload@example.com",
          password: "password",
        })
        .expect(201);

      const decoded = verifyTokenSync(response.body.token);

      expect(decoded.userId).toBe(response.body.user.id);
      expect(decoded.username).toBe("payloaduser");
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });
});

/**
 * 随机密码生成接口集成测试
 *
 * 测试范围：
 * - POST /api/cards/:id/password/random
 * - 认证和授权验证
 * - 随机密码生成和更新
 * - 密码版本号递增
 * - 错误处理
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { hashPassword } = require("../../src/utils/crypto");
const jwt = require("jsonwebtoken");

describe("POST /api/cards/:id/password/random - 随机密码生成接口", () => {
  let testUserId;
  let testToken;
  let testCardId;
  let testCardDbId;
  let otherUserId;
  let otherToken;

  beforeAll(async () => {
    // 创建测试用户1
    const hashedPassword = await hashPassword("testPassword123");
    const userResult = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["randomPasswordTestUser", "randompassword@test.com", hashedPassword],
    );
    testUserId = userResult.insertId;

    // 生成 JWT token
    testToken = jwt.sign(
      { userId: testUserId, username: "randomPasswordTestUser" },
      process.env.JWT_SECRET || "test-secret-key",
      { expiresIn: "7d" },
    );

    // 创建测试角色卡
    const cardResult = await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
      ["999001", testUserId, "测试角色卡", hashedPassword, 1],
    );
    testCardDbId = cardResult.insertId;
    testCardId = "999001";

    // 创建测试用户2（用于测试权限）
    const otherUserResult = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [
        "otherRandomPasswordUser",
        "otherrandompassword@test.com",
        hashedPassword,
      ],
    );
    otherUserId = otherUserResult.insertId;

    otherToken = jwt.sign(
      { userId: otherUserId, username: "otherRandomPasswordUser" },
      process.env.JWT_SECRET || "test-secret-key",
      { expiresIn: "7d" },
    );
  });

  afterAll(async () => {
    // 清理测试数据
    await db.query("DELETE FROM character_cards WHERE user_id IN (?, ?)", [
      testUserId,
      otherUserId,
    ]);
    await db.query("DELETE FROM users WHERE id IN (?, ?)", [
      testUserId,
      otherUserId,
    ]);
  });

  describe("认证和授权", () => {
    test("未提供 token 应该返回 401", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("无效的 token 应该返回 403", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", "Bearer invalid-token")
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("尝试更新其他用户的角色卡应该返回 404", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("角色卡不存在或无权访问");
    });
  });

  describe("随机密码生成", () => {
    test("应该成功生成默认16字符的随机密码", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.password).toBeDefined();
      expect(response.body.password).toHaveLength(16);
      expect(response.body.password_version).toBe(2); // 从1递增到2
      expect(response.body.message).toBe("随机密码生成成功");
    });

    test("生成的密码应该包含大写字母、小写字母、数字和符号", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(200);
      const password = response.body.password;

      expect(password).toMatch(/[A-Z]/); // 大写字母
      expect(password).toMatch(/[a-z]/); // 小写字母
      expect(password).toMatch(/[0-9]/); // 数字
      expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/); // 符号
    });

    test("应该支持自定义密码长度", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ length: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.password).toHaveLength(20);
    });

    test("应该支持不包含符号的密码", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ include_symbols: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const password = response.body.password;

      // 应该只包含字母和数字
      expect(password).toMatch(/^[A-Za-z0-9]+$/);
      expect(password).not.toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
    });

    test("连续生成的密码应该不同", async () => {
      const response1 = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      const response2 = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.password).not.toBe(response2.body.password);
    });
  });

  describe("密码版本号递增", () => {
    test("每次生成随机密码应该递增版本号", async () => {
      // 获取当前版本号
      const [card] = await db.query(
        "SELECT password_version FROM character_cards WHERE id = ?",
        [testCardDbId],
      );
      const currentVersion = card.password_version;

      // 生成随机密码
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.password_version).toBe(currentVersion + 1);

      // 验证数据库中的版本号已更新
      const [updatedCard] = await db.query(
        "SELECT password_version FROM character_cards WHERE id = ?",
        [testCardDbId],
      );
      expect(updatedCard.password_version).toBe(currentVersion + 1);
    });
  });

  describe("密码更新验证", () => {
    test("生成的随机密码应该能够通过验证", async () => {
      // 生成随机密码
      const generateResponse = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      expect(generateResponse.status).toBe(200);
      const newPassword = generateResponse.body.password;

      // 使用新密码进行验证
      const verifyResponse = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: newPassword,
      });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
    });

    test("旧密码应该无法通过验证", async () => {
      const oldPassword = "oldPassword123";

      // 先设置一个已知密码
      await request(app)
        .put(`/api/cards/${testCardDbId}/password`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ new_password: oldPassword });

      // 生成新的随机密码
      await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      // 尝试使用旧密码验证
      const verifyResponse = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: oldPassword,
      });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(false);
    });
  });

  describe("错误处理", () => {
    test("无效的角色卡 ID 应该返回 400", async () => {
      const response = await request(app)
        .post("/api/cards/invalid/password/random")
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("无效的角色卡 ID");
    });

    test("不存在的角色卡 ID 应该返回 404", async () => {
      const response = await request(app)
        .post("/api/cards/999999/password/random")
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("角色卡不存在或无权访问");
    });

    test("密码长度小于8应该返回 400", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ length: 7 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("密码长度必须在 8-100 之间");
    });

    test("密码长度大于100应该返回 400", async () => {
      const response = await request(app)
        .post(`/api/cards/${testCardDbId}/password/random`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ length: 101 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("密码长度必须在 8-100 之间");
    });
  });
});

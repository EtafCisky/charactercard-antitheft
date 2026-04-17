/**
 * 更新角色卡密码接口集成测试
 *
 * 测试场景：
 * - 成功更新密码
 * - 密码版本号递增
 * - 输入验证（new_password）
 * - 用户权限验证
 * - 密码加密
 * - 认证要求
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { generateToken } = require("../../src/utils/jwt");
const { hashPassword, verifyPassword } = require("../../src/utils/crypto");

describe("PUT /api/cards/:id/password - 更新角色卡密码接口", () => {
  let testUserId;
  let testToken;
  let otherUserId;
  let otherToken;
  let testCardId;
  let testCardDbId;
  let otherCardDbId;

  // 测试前准备：创建测试用户和角色卡
  beforeAll(async () => {
    // 创建第一个测试用户
    const hashedPassword1 = await hashPassword("testpass123");
    const result1 = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["testuser_pwupdate", "pwupdate@example.com", hashedPassword1],
    );
    testUserId = result1.insertId;
    testToken = generateToken(testUserId, "testuser_pwupdate");

    // 创建第二个测试用户
    const hashedPassword2 = await hashPassword("testpass456");
    const result2 = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["otheruser_pwupdate", "other_pwupdate@example.com", hashedPassword2],
    );
    otherUserId = result2.insertId;
    otherToken = generateToken(otherUserId, "otheruser_pwupdate");

    // 创建测试角色卡（属于第一个用户）
    const cardPasswordHash = await hashPassword("initialPassword123");
    const cardResult = await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
      ["123456", testUserId, "测试角色", cardPasswordHash, 1],
    );
    testCardDbId = cardResult.insertId;
    testCardId = "123456";

    // 创建另一个角色卡（属于第二个用户）
    const otherCardResult = await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
      ["789012", otherUserId, "其他角色", cardPasswordHash, 1],
    );
    otherCardDbId = otherCardResult.insertId;
  });

  // 测试后清理
  afterAll(async () => {
    await db.query("DELETE FROM character_cards WHERE id IN (?, ?)", [
      testCardDbId,
      otherCardDbId,
    ]);
    await db.query("DELETE FROM users WHERE id IN (?, ?)", [
      testUserId,
      otherUserId,
    ]);
  });

  // ============================================================================
  // 测试：成功更新密码
  // ============================================================================

  test("应该成功更新角色卡密码", async () => {
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "newPassword456",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.password_version).toBe(2);
    expect(response.body.message).toBe("密码更新成功");

    // 验证数据库中的密码已更新
    const cards = await db.query(
      "SELECT password_hash, password_version FROM character_cards WHERE id = ?",
      [testCardDbId],
    );

    expect(cards[0].password_version).toBe(2);

    // 验证新密码可以通过验证
    const isNewPasswordValid = await verifyPassword(
      "newPassword456",
      cards[0].password_hash,
    );
    expect(isNewPasswordValid).toBe(true);

    // 验证旧密码无法通过验证
    const isOldPasswordValid = await verifyPassword(
      "initialPassword123",
      cards[0].password_hash,
    );
    expect(isOldPasswordValid).toBe(false);
  });

  // ============================================================================
  // 测试：密码版本号递增
  // ============================================================================

  test("应该在每次更新时递增密码版本号", async () => {
    // 第一次更新
    const response1 = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "password1",
      })
      .expect(200);

    expect(response1.body.password_version).toBe(3);

    // 第二次更新
    const response2 = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "password2",
      })
      .expect(200);

    expect(response2.body.password_version).toBe(4);

    // 第三次更新
    const response3 = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "password3",
      })
      .expect(200);

    expect(response3.body.password_version).toBe(5);

    // 验证数据库中的版本号
    const cards = await db.query(
      "SELECT password_version FROM character_cards WHERE id = ?",
      [testCardDbId],
    );
    expect(cards[0].password_version).toBe(5);
  });

  // ============================================================================
  // 测试：输入验证 - new_password
  // ============================================================================

  test("应该拒绝空的 new_password", async () => {
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("密码");
  });

  test("应该拒绝缺失的 new_password", async () => {
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("密码");
  });

  test("应该拒绝非字符串的 new_password", async () => {
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: 12345,
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("密码");
  });

  test("应该拒绝超过100字符的 new_password", async () => {
    const longPassword = "a".repeat(101);
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: longPassword,
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("1-100 个字符");
  });

  test("应该接受1字符的 new_password", async () => {
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "a",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test("应该接受100字符的 new_password", async () => {
    const maxPassword = "a".repeat(100);
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: maxPassword,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  // ============================================================================
  // 测试：用户权限验证
  // ============================================================================

  test("应该拒绝更新其他用户的角色卡密码", async () => {
    const response = await request(app)
      .put(`/api/cards/${otherCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "hackerPassword",
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("不存在或无权访问");

    // 验证数据库中的密码未被修改
    const cards = await db.query(
      "SELECT password_hash, password_version FROM character_cards WHERE id = ?",
      [otherCardDbId],
    );

    // 密码版本号应该仍然是 1
    expect(cards[0].password_version).toBe(1);

    // 原始密码应该仍然有效
    const isOriginalPasswordValid = await verifyPassword(
      "initialPassword123",
      cards[0].password_hash,
    );
    expect(isOriginalPasswordValid).toBe(true);
  });

  test("应该拒绝更新不存在的角色卡", async () => {
    const nonExistentId = 999999;
    const response = await request(app)
      .put(`/api/cards/${nonExistentId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "newPassword",
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("不存在或无权访问");
  });

  test("应该拒绝无效的角色卡 ID", async () => {
    const response = await request(app)
      .put(`/api/cards/invalid/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "newPassword",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效的角色卡 ID");
  });

  test("应该拒绝负数的角色卡 ID", async () => {
    const response = await request(app)
      .put(`/api/cards/-1/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "newPassword",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效的角色卡 ID");
  });

  test("应该拒绝零作为角色卡 ID", async () => {
    const response = await request(app)
      .put(`/api/cards/0/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: "newPassword",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效的角色卡 ID");
  });

  // ============================================================================
  // 测试：密码加密
  // ============================================================================

  test("应该使用 bcrypt 加密新密码", async () => {
    const newPassword = "secureNewPassword789";
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: newPassword,
      })
      .expect(200);

    expect(response.body.success).toBe(true);

    // 从数据库获取密码哈希
    const cards = await db.query(
      "SELECT password_hash FROM character_cards WHERE id = ?",
      [testCardDbId],
    );

    const passwordHash = cards[0].password_hash;

    // 验证密码哈希格式（bcrypt 格式）
    expect(passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);

    // 验证密码哈希不等于明文密码
    expect(passwordHash).not.toBe(newPassword);

    // 验证可以使用 bcrypt 验证密码
    const isValid = await verifyPassword(newPassword, passwordHash);
    expect(isValid).toBe(true);

    // 验证错误密码无法通过验证
    const isInvalid = await verifyPassword("wrongPassword", passwordHash);
    expect(isInvalid).toBe(false);
  });

  test("每次更新应该生成不同的密码哈希", async () => {
    const samePassword = "samePassword123";

    // 第一次更新
    await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: samePassword,
      })
      .expect(200);

    const cards1 = await db.query(
      "SELECT password_hash FROM character_cards WHERE id = ?",
      [testCardDbId],
    );
    const hash1 = cards1[0].password_hash;

    // 第二次更新（使用相同密码）
    await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        new_password: samePassword,
      })
      .expect(200);

    const cards2 = await db.query(
      "SELECT password_hash FROM character_cards WHERE id = ?",
      [testCardDbId],
    );
    const hash2 = cards2[0].password_hash;

    // 验证两次生成的哈希不同（bcrypt 使用随机盐）
    expect(hash1).not.toBe(hash2);

    // 但两个哈希都应该能验证相同的密码
    const isValid1 = await verifyPassword(samePassword, hash1);
    const isValid2 = await verifyPassword(samePassword, hash2);
    expect(isValid1).toBe(true);
    expect(isValid2).toBe(true);
  });

  // ============================================================================
  // 测试：认证要求
  // ============================================================================

  test("应该拒绝未认证的请求", async () => {
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .send({
        new_password: "newPassword",
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("认证令牌");
  });

  test("应该拒绝无效的 token", async () => {
    const response = await request(app)
      .put(`/api/cards/${testCardDbId}/password`)
      .set("Authorization", "Bearer invalid_token")
      .send({
        new_password: "newPassword",
      })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效或已过期");
  });

  // ============================================================================
  // 测试：特殊字符处理
  // ============================================================================

  test("应该支持包含特殊字符的密码", async () => {
    const specialPasswords = [
      "pass@word!",
      "pass#word$",
      "pass%word^",
      "pass&word*",
      "pass word",
      "密码123!@#",
      "пароль123",
      "パスワード123",
    ];

    for (const password of specialPasswords) {
      const response = await request(app)
        .put(`/api/cards/${testCardDbId}/password`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          new_password: password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // 验证密码加密正确
      const cards = await db.query(
        "SELECT password_hash FROM character_cards WHERE id = ?",
        [testCardDbId],
      );
      const isValid = await verifyPassword(password, cards[0].password_hash);
      expect(isValid).toBe(true);
    }
  });

  // ============================================================================
  // 测试：并发更新
  // ============================================================================

  test("应该正确处理连续的密码更新", async () => {
    // 获取当前版本号
    const initialCards = await db.query(
      "SELECT password_version FROM character_cards WHERE id = ?",
      [testCardDbId],
    );
    const initialVersion = initialCards[0].password_version;

    // 连续更新 3 次
    const updates = [];
    for (let i = 1; i <= 3; i++) {
      updates.push(
        request(app)
          .put(`/api/cards/${testCardDbId}/password`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({
            new_password: `password${i}`,
          }),
      );
    }

    const responses = await Promise.all(updates);

    // 验证所有请求都成功
    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // 验证最终版本号
    const finalCards = await db.query(
      "SELECT password_version FROM character_cards WHERE id = ?",
      [testCardDbId],
    );
    const finalVersion = finalCards[0].password_version;

    // 最终版本号应该是初始版本号 + 3
    expect(finalVersion).toBe(initialVersion + 3);
  });
});

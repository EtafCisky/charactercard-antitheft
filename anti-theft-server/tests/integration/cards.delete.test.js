/**
 * 集成测试：删除角色卡接口
 *
 * 测试范围：
 * - DELETE /api/cards/:id
 *
 * 测试场景：
 * 1. 成功删除自己的角色卡
 * 2. 无效的角色卡 ID
 * 3. 删除不存在的角色卡
 * 4. 删除其他用户的角色卡（权限验证）
 * 5. 未认证用户尝试删除
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { hashPassword } = require("../../src/utils/crypto");
const { generateToken } = require("../../src/utils/jwt");

describe("DELETE /api/cards/:id - 删除角色卡", () => {
  let testUser1;
  let testUser2;
  let token1;
  let token2;
  let testCard1;
  let testCard2;

  // ============================================================================
  // 测试前准备
  // ============================================================================

  beforeAll(async () => {
    // 创建测试用户 1
    const passwordHash1 = await hashPassword("password123");
    const insertUser1Query = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;
    const result1 = await db.query(insertUser1Query, [
      "deletetest1",
      "deletetest1@example.com",
      passwordHash1,
    ]);
    testUser1 = {
      id: result1.insertId,
      username: "deletetest1",
    };
    token1 = generateToken(testUser1.id, testUser1.username);

    // 创建测试用户 2
    const passwordHash2 = await hashPassword("password456");
    const insertUser2Query = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;
    const result2 = await db.query(insertUser2Query, [
      "deletetest2",
      "deletetest2@example.com",
      passwordHash2,
    ]);
    testUser2 = {
      id: result2.insertId,
      username: "deletetest2",
    };
    token2 = generateToken(testUser2.id, testUser2.username);

    // 创建测试角色卡 1（属于用户 1）
    const cardPasswordHash1 = await hashPassword("cardpass123");
    const insertCard1Query = `
      INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version)
      VALUES (?, ?, ?, ?, ?)
    `;
    const cardResult1 = await db.query(insertCard1Query, [
      "111111",
      testUser1.id,
      "测试角色卡1",
      cardPasswordHash1,
      1,
    ]);
    testCard1 = {
      id: cardResult1.insertId,
      card_id: "111111",
      card_name: "测试角色卡1",
      user_id: testUser1.id,
    };

    // 创建测试角色卡 2（属于用户 2）
    const cardPasswordHash2 = await hashPassword("cardpass456");
    const insertCard2Query = `
      INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version)
      VALUES (?, ?, ?, ?, ?)
    `;
    const cardResult2 = await db.query(insertCard2Query, [
      "222222",
      testUser2.id,
      "测试角色卡2",
      cardPasswordHash2,
      1,
    ]);
    testCard2 = {
      id: cardResult2.insertId,
      card_id: "222222",
      card_name: "测试角色卡2",
      user_id: testUser2.id,
    };
  });

  // ============================================================================
  // 测试后清理
  // ============================================================================

  afterAll(async () => {
    // 清理测试数据
    await db.query("DELETE FROM character_cards WHERE user_id IN (?, ?)", [
      testUser1.id,
      testUser2.id,
    ]);
    await db.query("DELETE FROM users WHERE id IN (?, ?)", [
      testUser1.id,
      testUser2.id,
    ]);
  });

  // ============================================================================
  // 测试用例
  // ============================================================================

  describe("成功场景", () => {
    test("应该成功删除自己的角色卡", async () => {
      // 创建一个临时角色卡用于删除
      const tempCardPasswordHash = await hashPassword("temppass");
      const insertTempCardQuery = `
        INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version)
        VALUES (?, ?, ?, ?, ?)
      `;
      const tempCardResult = await db.query(insertTempCardQuery, [
        "999999",
        testUser1.id,
        "临时角色卡",
        tempCardPasswordHash,
        1,
      ]);
      const tempCardId = tempCardResult.insertId;

      // 发送删除请求
      const response = await request(app)
        .delete(`/api/cards/${tempCardId}`)
        .set("Authorization", `Bearer ${token1}`);

      // 验证响应
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "角色卡删除成功",
      });

      // 验证数据库中记录已删除
      const checkQuery = `
        SELECT * FROM character_cards WHERE id = ?
      `;
      const [deletedCard] = await db.query(checkQuery, [tempCardId]);
      expect(deletedCard).toBeUndefined();
    });
  });

  describe("输入验证", () => {
    test("应该拒绝无效的角色卡 ID（非数字）", async () => {
      const response = await request(app)
        .delete("/api/cards/invalid")
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "无效的角色卡 ID",
      });
    });

    test("应该拒绝无效的角色卡 ID（负数）", async () => {
      const response = await request(app)
        .delete("/api/cards/-1")
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "无效的角色卡 ID",
      });
    });

    test("应该拒绝无效的角色卡 ID（零）", async () => {
      const response = await request(app)
        .delete("/api/cards/0")
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "无效的角色卡 ID",
      });
    });
  });

  describe("权限验证", () => {
    test("应该拒绝删除不存在的角色卡", async () => {
      const nonExistentId = 999999;

      const response = await request(app)
        .delete(`/api/cards/${nonExistentId}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "角色卡不存在或无权访问",
      });
    });

    test("应该拒绝删除其他用户的角色卡", async () => {
      // 用户 1 尝试删除用户 2 的角色卡
      const response = await request(app)
        .delete(`/api/cards/${testCard2.id}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "角色卡不存在或无权访问",
      });

      // 验证角色卡仍然存在
      const checkQuery = `
        SELECT * FROM character_cards WHERE id = ?
      `;
      const [card] = await db.query(checkQuery, [testCard2.id]);
      expect(card).toBeDefined();
      expect(card.card_id).toBe("222222");
    });

    test("应该拒绝未认证的删除请求", async () => {
      const response = await request(app).delete(`/api/cards/${testCard1.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: "未提供认证令牌",
      });

      // 验证角色卡仍然存在
      const checkQuery = `
        SELECT * FROM character_cards WHERE id = ?
      `;
      const [card] = await db.query(checkQuery, [testCard1.id]);
      expect(card).toBeDefined();
    });

    test("应该拒绝使用无效 token 的删除请求", async () => {
      const response = await request(app)
        .delete(`/api/cards/${testCard1.id}`)
        .set("Authorization", "Bearer invalid_token");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: "令牌无效或已过期",
      });
    });
  });

  describe("边界情况", () => {
    test("应该正确处理删除已删除的角色卡", async () => {
      // 创建一个临时角色卡
      const tempCardPasswordHash = await hashPassword("temppass2");
      const insertTempCardQuery = `
        INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version)
        VALUES (?, ?, ?, ?, ?)
      `;
      const tempCardResult = await db.query(insertTempCardQuery, [
        "888888",
        testUser1.id,
        "临时角色卡2",
        tempCardPasswordHash,
        1,
      ]);
      const tempCardId = tempCardResult.insertId;

      // 第一次删除
      const response1 = await request(app)
        .delete(`/api/cards/${tempCardId}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(response1.status).toBe(200);
      expect(response1.body.success).toBe(true);

      // 第二次删除同一个 ID
      const response2 = await request(app)
        .delete(`/api/cards/${tempCardId}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(response2.status).toBe(404);
      expect(response2.body).toEqual({
        success: false,
        message: "角色卡不存在或无权访问",
      });
    });
  });
});

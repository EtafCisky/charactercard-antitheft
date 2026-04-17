/**
 * 角色卡详情接口集成测试
 *
 * 测试场景：
 * - 获取单个角色卡详情（需要认证）
 * - 只能访问自己的角色卡
 * - 未认证访问被拒绝
 * - 无效ID处理
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { generateToken } = require("../../src/utils/jwt");
const { hashPassword } = require("../../src/utils/crypto");

describe("GET /api/cards/:id - 角色卡详情接口", () => {
  let testUserId1;
  let testUserId2;
  let testToken1;
  let testToken2;
  let testCardId1;
  let testCardId2;

  // 测试前准备：创建测试用户和角色卡
  beforeAll(async () => {
    // 创建测试用户1
    const hashedPassword1 = await hashPassword("testpass123");
    const result1 = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["testuser_detail1", "testdetail1@example.com", hashedPassword1],
    );
    testUserId1 = result1.insertId;
    testToken1 = generateToken(testUserId1, "testuser_detail1");

    // 创建测试用户2
    const hashedPassword2 = await hashPassword("testpass456");
    const result2 = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["testuser_detail2", "testdetail2@example.com", hashedPassword2],
    );
    testUserId2 = result2.insertId;
    testToken2 = generateToken(testUserId2, "testuser_detail2");

    // 为用户1创建角色卡
    const cardPassword = await hashPassword("cardpass123");
    const cardResult1 = await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
      ["300001", testUserId1, "测试角色1", cardPassword, 1],
    );
    testCardId1 = cardResult1.insertId;

    // 为用户2创建角色卡
    const cardResult2 = await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
      ["300002", testUserId2, "测试角色2", cardPassword, 1],
    );
    testCardId2 = cardResult2.insertId;
  });

  // 测试后清理
  afterAll(async () => {
    // 删除测试数据
    await db.query("DELETE FROM character_cards WHERE user_id IN (?, ?)", [
      testUserId1,
      testUserId2,
    ]);
    await db.query("DELETE FROM users WHERE id IN (?, ?)", [
      testUserId1,
      testUserId2,
    ]);
  });

  // ============================================================================
  // 测试：成功获取角色卡详情
  // ============================================================================

  test("应该成功获取角色卡详情", async () => {
    const response = await request(app)
      .get(`/api/cards/${testCardId1}`)
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.card).toBeDefined();
    expect(response.body.card.id).toBe(testCardId1);
    expect(response.body.card.card_id).toBe("300001");
    expect(response.body.card.card_name).toBe("测试角色1");
    expect(response.body.card.password_version).toBe(1);
    expect(response.body.card.created_at).toBeDefined();
    expect(response.body.card.updated_at).toBeDefined();
  });

  // ============================================================================
  // 测试：返回字段验证
  // ============================================================================

  test("应该返回正确的角色卡字段", async () => {
    const response = await request(app)
      .get(`/api/cards/${testCardId1}`)
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    const card = response.body.card;

    // 验证必需字段
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("card_id");
    expect(card).toHaveProperty("card_name");
    expect(card).toHaveProperty("password_version");
    expect(card).toHaveProperty("created_at");
    expect(card).toHaveProperty("updated_at");

    // 验证不应该返回敏感字段
    expect(card).not.toHaveProperty("password_hash");
    expect(card).not.toHaveProperty("user_id");
  });

  // ============================================================================
  // 测试：数据隔离
  // ============================================================================

  test("应该拒绝访问其他用户的角色卡", async () => {
    const response = await request(app)
      .get(`/api/cards/${testCardId2}`)
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("不存在或无权访问");
  });

  test("用户2应该能访问自己的角色卡", async () => {
    const response = await request(app)
      .get(`/api/cards/${testCardId2}`)
      .set("Authorization", `Bearer ${testToken2}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.card.id).toBe(testCardId2);
    expect(response.body.card.card_id).toBe("300002");
  });

  // ============================================================================
  // 测试：无效ID处理
  // ============================================================================

  test("应该拒绝无效的角色卡ID（非数字）", async () => {
    const response = await request(app)
      .get("/api/cards/invalid")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效的角色卡 ID");
  });

  test("应该拒绝无效的角色卡ID（负数）", async () => {
    const response = await request(app)
      .get("/api/cards/-1")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效的角色卡 ID");
  });

  test("应该拒绝无效的角色卡ID（零）", async () => {
    const response = await request(app)
      .get("/api/cards/0")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效的角色卡 ID");
  });

  test("应该处理不存在的角色卡ID", async () => {
    const response = await request(app)
      .get("/api/cards/999999")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("不存在或无权访问");
  });

  // ============================================================================
  // 测试：认证要求
  // ============================================================================

  test("应该拒绝未认证的请求", async () => {
    const response = await request(app)
      .get(`/api/cards/${testCardId1}`)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("认证令牌");
  });

  test("应该拒绝无效的 token", async () => {
    const response = await request(app)
      .get(`/api/cards/${testCardId1}`)
      .set("Authorization", "Bearer invalid_token")
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效或已过期");
  });

  test("应该拒绝格式错误的 Authorization header", async () => {
    const response = await request(app)
      .get(`/api/cards/${testCardId1}`)
      .set("Authorization", "InvalidFormat")
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});

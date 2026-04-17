/**
 * 角色卡列表接口集成测试
 *
 * 测试场景：
 * - 获取角色卡列表（需要认证）
 * - 分页功能
 * - 只返回当前用户的角色卡
 * - 未认证访问被拒绝
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { generateToken } = require("../../src/utils/jwt");
const { hashPassword } = require("../../src/utils/crypto");

describe("GET /api/cards - 角色卡列表接口", () => {
  let testUserId1;
  let testUserId2;
  let testToken1;
  let testToken2;
  let testCardIds = [];

  // 测试前准备：创建测试用户和角色卡
  beforeAll(async () => {
    // 创建测试用户1
    const hashedPassword1 = await hashPassword("testpass123");
    const result1 = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["testuser_cards1", "testcards1@example.com", hashedPassword1],
    );
    testUserId1 = result1.insertId;
    testToken1 = generateToken(testUserId1, "testuser_cards1");

    // 创建测试用户2
    const hashedPassword2 = await hashPassword("testpass456");
    const result2 = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["testuser_cards2", "testcards2@example.com", hashedPassword2],
    );
    testUserId2 = result2.insertId;
    testToken2 = generateToken(testUserId2, "testuser_cards2");

    // 为用户1创建多个角色卡
    const cardPassword = await hashPassword("cardpass123");
    for (let i = 1; i <= 15; i++) {
      const cardId = `10000${i}`;
      await db.query(
        "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
        [cardId, testUserId1, `测试角色${i}`, cardPassword, 1],
      );
      testCardIds.push(cardId);
    }

    // 为用户2创建角色卡
    await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
      ["200001", testUserId2, "用户2的角色", cardPassword, 1],
    );
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
  // 测试：成功获取角色卡列表
  // ============================================================================

  test("应该成功获取当前用户的角色卡列表", async () => {
    const response = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cards).toBeDefined();
    expect(Array.isArray(response.body.cards)).toBe(true);
    expect(response.body.cards.length).toBe(10); // 默认每页10条
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.total).toBe(15);
    expect(response.body.pagination.totalPages).toBe(2);
  });

  // ============================================================================
  // 测试：分页功能
  // ============================================================================

  test("应该支持分页查询（第1页）", async () => {
    const response = await request(app)
      .get("/api/cards?page=1&limit=5")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cards.length).toBe(5);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(5);
    expect(response.body.pagination.total).toBe(15);
    expect(response.body.pagination.totalPages).toBe(3);
  });

  test("应该支持分页查询（第2页）", async () => {
    const response = await request(app)
      .get("/api/cards?page=2&limit=5")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cards.length).toBe(5);
    expect(response.body.pagination.page).toBe(2);
  });

  test("应该支持分页查询（最后一页）", async () => {
    const response = await request(app)
      .get("/api/cards?page=3&limit=5")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cards.length).toBe(5); // 15 % 5 = 0，最后一页也是5条
    expect(response.body.pagination.page).toBe(3);
  });

  test("应该处理超出范围的页码", async () => {
    const response = await request(app)
      .get("/api/cards?page=999&limit=10")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cards.length).toBe(0); // 超出范围，返回空数组
  });

  test("应该限制最大每页数量为100", async () => {
    const response = await request(app)
      .get("/api/cards?page=1&limit=200")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.pagination.limit).toBe(100); // 限制为最大100
  });

  test("应该处理无效的分页参数", async () => {
    const response = await request(app)
      .get("/api/cards?page=-1&limit=abc")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.pagination.page).toBe(1); // 默认第1页
    expect(response.body.pagination.limit).toBe(10); // 默认10条
  });

  // ============================================================================
  // 测试：数据隔离
  // ============================================================================

  test("应该只返回当前用户的角色卡", async () => {
    const response = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.pagination.total).toBe(15); // 用户1有15个角色卡

    // 验证所有返回的角色卡都属于用户1
    response.body.cards.forEach((card) => {
      expect(testCardIds).toContain(card.card_id);
    });
  });

  test("不同用户应该看到不同的角色卡列表", async () => {
    const response = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${testToken2}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.pagination.total).toBe(1); // 用户2只有1个角色卡
    expect(response.body.cards[0].card_id).toBe("200001");
  });

  // ============================================================================
  // 测试：返回字段验证
  // ============================================================================

  test("应该返回正确的角色卡字段", async () => {
    const response = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    const card = response.body.cards[0];

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
  // 测试：认证要求
  // ============================================================================

  test("应该拒绝未认证的请求", async () => {
    const response = await request(app).get("/api/cards").expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("认证令牌");
  });

  test("应该拒绝无效的 token", async () => {
    const response = await request(app)
      .get("/api/cards")
      .set("Authorization", "Bearer invalid_token")
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效或已过期");
  });

  test("应该拒绝格式错误的 Authorization header", async () => {
    const response = await request(app)
      .get("/api/cards")
      .set("Authorization", "InvalidFormat")
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  // ============================================================================
  // 测试：空列表情况
  // ============================================================================

  test("应该正确处理没有角色卡的用户", async () => {
    // 创建一个新用户，没有角色卡
    const hashedPassword = await hashPassword("testpass789");
    const result = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["testuser_empty", "testempty@example.com", hashedPassword],
    );
    const emptyUserId = result.insertId;
    const emptyToken = generateToken(emptyUserId, "testuser_empty");

    const response = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${emptyToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cards).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);

    // 清理
    await db.query("DELETE FROM users WHERE id = ?", [emptyUserId]);
  });

  // ============================================================================
  // 测试：排序
  // ============================================================================

  test("应该按创建时间倒序排列（最新的在前）", async () => {
    const response = await request(app)
      .get("/api/cards?limit=15")
      .set("Authorization", `Bearer ${testToken1}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    const cards = response.body.cards;

    // 验证排序（最新的在前）
    for (let i = 0; i < cards.length - 1; i++) {
      const currentDate = new Date(cards[i].created_at);
      const nextDate = new Date(cards[i + 1].created_at);
      expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
    }
  });
});

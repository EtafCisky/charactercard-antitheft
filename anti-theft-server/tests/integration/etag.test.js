/**
 * ETag 缓存集成测试
 *
 * 测试场景：
 * - ETag 生成和返回
 * - 条件请求（If-None-Match）
 * - 304 Not Modified 响应
 * - 缓存验证
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");

describe("ETag 缓存测试", () => {
  let authToken;
  let userId;
  let cardId;

  // 测试前：创建测试用户和角色卡
  beforeAll(async () => {
    // 清理测试数据
    await db.query(
      "DELETE FROM character_cards WHERE card_name LIKE 'ETag测试%'",
    );
    await db.query("DELETE FROM users WHERE username LIKE 'etag_test_%'");

    // 创建测试用户
    const registerRes = await request(app).post("/api/auth/register").send({
      username: "etag_test_user",
      email: "etag_test@example.com",
      password: "testPassword123",
    });

    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // 创建测试角色卡
    const createCardRes = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "ETag测试角色卡",
        password: "testPassword",
      });

    cardId = createCardRes.body.card_id;
  });

  // 测试后：清理测试数据
  afterAll(async () => {
    await db.query(
      "DELETE FROM character_cards WHERE card_name LIKE 'ETag测试%'",
    );
    await db.query("DELETE FROM users WHERE username LIKE 'etag_test_%'");
  });

  // ============================================================================
  // 测试 1：GET 请求应该返回 ETag 头
  // ============================================================================

  test("GET /api/cards 应该返回 ETag 头", async () => {
    const res = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers.etag).toBeDefined();
    expect(res.headers["cache-control"]).toBe("no-cache");
  });

  // ============================================================================
  // 测试 2：使用 If-None-Match 头应该返回 304
  // ============================================================================

  test("使用匹配的 If-None-Match 应该返回 304 Not Modified", async () => {
    // 第一次请求，获取 ETag
    const firstRes = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${authToken}`);

    expect(firstRes.status).toBe(200);
    const etag = firstRes.headers.etag;
    expect(etag).toBeDefined();

    // 第二次请求，使用 If-None-Match
    const secondRes = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${authToken}`)
      .set("If-None-Match", etag);

    expect(secondRes.status).toBe(304);
    expect(secondRes.body).toEqual({});
  });

  // ============================================================================
  // 测试 3：内容变化后 ETag 应该不同
  // ============================================================================

  test("内容变化后应该返回新的 ETag", async () => {
    // 第一次请求
    const firstRes = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${authToken}`);

    const firstEtag = firstRes.headers.etag;

    // 创建新的角色卡（改变内容）
    await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "ETag测试角色卡2",
        password: "testPassword2",
      });

    // 第二次请求
    const secondRes = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${authToken}`);

    const secondEtag = secondRes.headers.etag;

    // ETag 应该不同
    expect(secondEtag).toBeDefined();
    expect(secondEtag).not.toBe(firstEtag);
  });

  // ============================================================================
  // 测试 4：单个角色卡详情也应该支持 ETag
  // ============================================================================

  test("GET /api/cards/:id 应该支持 ETag", async () => {
    // 获取角色卡列表
    const listRes = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${authToken}`);

    const card = listRes.body.cards[0];

    // 第一次请求角色卡详情
    const firstRes = await request(app)
      .get(`/api/cards/${card.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(firstRes.status).toBe(200);
    const etag = firstRes.headers.etag;
    expect(etag).toBeDefined();

    // 第二次请求，使用 If-None-Match
    const secondRes = await request(app)
      .get(`/api/cards/${card.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .set("If-None-Match", etag);

    expect(secondRes.status).toBe(304);
  });

  // ============================================================================
  // 测试 5：密码版本查询应该支持 ETag
  // ============================================================================

  test("GET /api/verify/cards/:card_id/version 应该支持 ETag", async () => {
    // 第一次请求
    const firstRes = await request(app).get(
      `/api/verify/cards/${cardId}/version`,
    );

    expect(firstRes.status).toBe(200);
    const etag = firstRes.headers.etag;
    expect(etag).toBeDefined();

    // 第二次请求，使用 If-None-Match
    const secondRes = await request(app)
      .get(`/api/verify/cards/${cardId}/version`)
      .set("If-None-Match", etag);

    expect(secondRes.status).toBe(304);
  });

  // ============================================================================
  // 测试 6：密码更新后 ETag 应该变化
  // ============================================================================

  test("密码更新后版本查询的 ETag 应该变化", async () => {
    // 获取角色卡列表
    const listRes = await request(app)
      .get("/api/cards")
      .set("Authorization", `Bearer ${authToken}`);

    const card = listRes.body.cards[0];

    // 第一次查询版本
    const firstRes = await request(app).get(
      `/api/verify/cards/${card.card_id}/version`,
    );

    const firstEtag = firstRes.headers.etag;

    // 更新密码
    await request(app)
      .put(`/api/cards/${card.id}/password`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        new_password: "newPassword123",
      });

    // 第二次查询版本
    const secondRes = await request(app).get(
      `/api/verify/cards/${card.card_id}/version`,
    );

    const secondEtag = secondRes.headers.etag;

    // ETag 应该不同
    expect(secondEtag).toBeDefined();
    expect(secondEtag).not.toBe(firstEtag);
  });

  // ============================================================================
  // 测试 7：POST 请求不应该使用 ETag
  // ============================================================================

  test("POST 请求不应该返回 ETag", async () => {
    const res = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "ETag测试角色卡3",
        password: "testPassword3",
      });

    expect(res.status).toBe(201);
    expect(res.headers.etag).toBeUndefined();
  });
});

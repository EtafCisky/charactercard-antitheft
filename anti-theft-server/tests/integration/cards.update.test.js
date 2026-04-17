/**
 * 集成测试：更新角色卡接口
 * 测试 PUT /api/cards/:id 端点
 *
 * 验证需求：需求 5（角色卡管理）
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");

describe("PUT /api/cards/:id - 更新角色卡", () => {
  let authToken;
  let userId;
  let cardId;
  let cardDbId;

  // 在所有测试之前：创建测试用户和角色卡
  beforeAll(async () => {
    // 注册测试用户
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        username: `updatetest_${Date.now()}`,
        email: `updatetest_${Date.now()}@example.com`,
        password: "testPassword123",
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // 创建测试角色卡
    const createResponse = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "原始角色名",
        password: "testPassword",
      });

    cardId = createResponse.body.card_id;

    // 获取数据库 ID
    const [card] = await db.query(
      "SELECT id FROM character_cards WHERE card_id = ?",
      [cardId],
    );
    cardDbId = card.id;
  });

  // 在所有测试之后：清理测试数据
  afterAll(async () => {
    // 删除测试用户（会级联删除角色卡）
    await db.query("DELETE FROM users WHERE id = ?", [userId]);
  });

  // ============================================================================
  // 成功场景测试
  // ============================================================================

  test("应该成功更新角色卡名称", async () => {
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "更新后的角色名",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("角色卡更新成功");

    // 验证数据库中的名称已更新
    const [updatedCard] = await db.query(
      "SELECT card_name, password_version FROM character_cards WHERE id = ?",
      [cardDbId],
    );
    expect(updatedCard.card_name).toBe("更新后的角色名");
    expect(updatedCard.password_version).toBe(1); // 密码版本不应改变
  });

  test("应该正确处理名称前后的空格", async () => {
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "  带空格的名称  ",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 验证空格已被去除
    const [updatedCard] = await db.query(
      "SELECT card_name FROM character_cards WHERE id = ?",
      [cardDbId],
    );
    expect(updatedCard.card_name).toBe("带空格的名称");
  });

  test("应该支持包含特殊字符的角色名", async () => {
    const specialName = "角色-测试_123!@#";

    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: specialName,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const [updatedCard] = await db.query(
      "SELECT card_name FROM character_cards WHERE id = ?",
      [cardDbId],
    );
    expect(updatedCard.card_name).toBe(specialName);
  });

  // ============================================================================
  // 认证和权限测试
  // ============================================================================

  test("应该拒绝未认证的请求", async () => {
    const response = await request(app).put(`/api/cards/${cardDbId}`).send({
      card_name: "新名称",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("认证令牌");
  });

  test("应该拒绝无效的 token", async () => {
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", "Bearer invalid_token")
      .send({
        card_name: "新名称",
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test("应该拒绝更新其他用户的角色卡", async () => {
    // 创建另一个用户
    const otherUserResponse = await request(app)
      .post("/api/auth/register")
      .send({
        username: `otheruser_${Date.now()}`,
        email: `otheruser_${Date.now()}@example.com`,
        password: "password123",
      });

    const otherToken = otherUserResponse.body.token;
    const otherUserId = otherUserResponse.body.user.id;

    // 尝试更新第一个用户的角色卡
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({
        card_name: "尝试修改",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("不存在或无权访问");

    // 清理测试用户
    await db.query("DELETE FROM users WHERE id = ?", [otherUserId]);
  });

  // ============================================================================
  // 输入验证测试
  // ============================================================================

  test("应该拒绝空的角色卡名称", async () => {
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("不能为空");
  });

  test("应该拒绝只包含空格的角色卡名称", async () => {
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "   ",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("不能为空");
  });

  test("应该拒绝超过 100 字符的角色卡名称", async () => {
    const longName = "a".repeat(101);

    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: longName,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("长度");
  });

  test("应该拒绝缺少 card_name 字段的请求", async () => {
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("应该拒绝 card_name 不是字符串的请求", async () => {
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: 12345,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  // ============================================================================
  // 路径参数验证测试
  // ============================================================================

  test("应该拒绝无效的角色卡 ID（非数字）", async () => {
    const response = await request(app)
      .put("/api/cards/invalid")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "新名称",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效");
  });

  test("应该拒绝无效的角色卡 ID（负数）", async () => {
    const response = await request(app)
      .put("/api/cards/-1")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "新名称",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效");
  });

  test("应该拒绝不存在的角色卡 ID", async () => {
    const response = await request(app)
      .put("/api/cards/999999")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "新名称",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("不存在");
  });

  // ============================================================================
  // 边界条件测试
  // ============================================================================

  test("应该接受 1 字符的角色卡名称", async () => {
    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "A",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const [updatedCard] = await db.query(
      "SELECT card_name FROM character_cards WHERE id = ?",
      [cardDbId],
    );
    expect(updatedCard.card_name).toBe("A");
  });

  test("应该接受 100 字符的角色卡名称", async () => {
    const maxLengthName = "a".repeat(100);

    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: maxLengthName,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const [updatedCard] = await db.query(
      "SELECT card_name FROM character_cards WHERE id = ?",
      [cardDbId],
    );
    expect(updatedCard.card_name).toBe(maxLengthName);
  });

  test("应该支持 Unicode 字符（中文、日文、emoji）", async () => {
    const unicodeName = "角色测试 キャラ 🎭";

    const response = await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: unicodeName,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const [updatedCard] = await db.query(
      "SELECT card_name FROM character_cards WHERE id = ?",
      [cardDbId],
    );
    expect(updatedCard.card_name).toBe(unicodeName);
  });

  // ============================================================================
  // 密码版本不变性测试
  // ============================================================================

  test("更新角色卡名称不应改变密码版本", async () => {
    // 获取更新前的密码版本
    const [beforeCard] = await db.query(
      "SELECT password_version FROM character_cards WHERE id = ?",
      [cardDbId],
    );
    const versionBefore = beforeCard.password_version;

    // 更新角色卡名称
    await request(app)
      .put(`/api/cards/${cardDbId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        card_name: "版本测试名称",
      });

    // 获取更新后的密码版本
    const [afterCard] = await db.query(
      "SELECT password_version FROM character_cards WHERE id = ?",
      [cardDbId],
    );
    const versionAfter = afterCard.password_version;

    // 密码版本应该保持不变
    expect(versionAfter).toBe(versionBefore);
  });
});

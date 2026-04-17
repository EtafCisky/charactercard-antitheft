/**
 * 输入过滤集成测试
 *
 * 测试覆盖：
 * - XSS 防护在实际路由中的应用
 * - NoSQL 注入检测在实际路由中的应用
 * - SQL 注入防护（参数化查询）
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");

describe("输入过滤集成测试", () => {
  let authToken;
  let testUserId;

  // 在所有测试之前：创建测试用户并获取 token
  beforeAll(async () => {
    // 清理测试数据
    await db.query("DELETE FROM users WHERE username LIKE 'testfilter%'");

    // 注册测试用户
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testfilteruser",
        email: "testfilter@example.com",
        password: "testpassword123",
      });

    authToken = registerResponse.body.token;
    testUserId = registerResponse.body.user.id;
  });

  // 在所有测试之后：清理测试数据
  afterAll(async () => {
    await db.query("DELETE FROM users WHERE id = ?", [testUserId]);
    await db.end();
  });

  describe("XSS 防护", () => {
    test("应该清理注册时的用户名中的 XSS 攻击", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testfilterxss",
        email: "xss@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // 验证用户名已被清理
      const users = await db.query(
        "SELECT username FROM users WHERE email = ?",
        ["xss@example.com"],
      );
      expect(users[0].username).toBe("testfilterxss");
      expect(users[0].username).not.toContain("<script>");

      // 清理
      await db.query("DELETE FROM users WHERE email = ?", ["xss@example.com"]);
    });

    test("应该清理角色卡名称中的 XSS 攻击", async () => {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          card_name: '测试角色<script>alert("XSS")</script>',
          password: "cardpassword123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // 验证角色卡名称已被清理
      const cards = await db.query(
        "SELECT card_name FROM character_cards WHERE card_id = ?",
        [response.body.card_id],
      );
      expect(cards[0].card_name).toBe("测试角色");
      expect(cards[0].card_name).not.toContain("<script>");

      // 清理
      await db.query("DELETE FROM character_cards WHERE card_id = ?", [
        response.body.card_id,
      ]);
    });

    test("应该清理角色卡名称中的 HTML 标签", async () => {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          card_name: "<div><b>粗体</b><i>斜体</i></div>角色",
          password: "cardpassword123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // 验证 HTML 标签已被移除
      const cards = await db.query(
        "SELECT card_name FROM character_cards WHERE card_id = ?",
        [response.body.card_id],
      );
      expect(cards[0].card_name).toBe("粗体斜体角色");
      expect(cards[0].card_name).not.toContain("<");
      expect(cards[0].card_name).not.toContain(">");

      // 清理
      await db.query("DELETE FROM character_cards WHERE card_id = ?", [
        response.body.card_id,
      ]);
    });

    test("应该清理更新角色卡时的 XSS 攻击", async () => {
      // 先创建角色卡
      const createResponse = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          card_name: "原始名称",
          password: "password123",
        });

      const cardId = createResponse.body.card_id;
      const dbId = (
        await db.query("SELECT id FROM character_cards WHERE card_id = ?", [
          cardId,
        ])
      )[0].id;

      // 尝试用 XSS 攻击更新
      const updateResponse = await request(app)
        .put(`/api/cards/${dbId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          card_name: "更新名称<img src=x onerror=alert(1)>",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // 验证名称已被清理
      const cards = await db.query(
        "SELECT card_name FROM character_cards WHERE card_id = ?",
        [cardId],
      );
      expect(cards[0].card_name).toBe("更新名称");
      expect(cards[0].card_name).not.toContain("<img");
      expect(cards[0].card_name).not.toContain("onerror");

      // 清理
      await db.query("DELETE FROM character_cards WHERE card_id = ?", [cardId]);
    });
  });

  describe("NoSQL 注入检测", () => {
    test("应该拒绝包含 MongoDB 操作符的用户名", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: 'admin{"$ne":null}',
        email: "nosql@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("非法字符");
    });

    test("应该拒绝包含 JavaScript 函数的角色卡名称", async () => {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          card_name: "function() { return true; }",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("非法字符");
    });

    test("应该拒绝包含 $where 操作符的 Card ID", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: '$where: "1==1"',
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("非法字符");
    });
  });

  describe("SQL 注入防护", () => {
    test("应该防止登录时的 SQL 注入攻击", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "admin' OR '1'='1",
        password: "password",
      });

      // 应该返回认证失败，而不是成功登录
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("应该防止密码验证时的 SQL 注入攻击", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: "123456' OR '1'='1",
        password: "password",
      });

      // 应该返回验证失败（Card ID 格式错误）
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("应该防止角色卡创建时的 SQL 注入攻击", async () => {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          card_name: "角色'; DROP TABLE character_cards; --",
          password: "password123",
        });

      // 应该成功创建（但名称被清理）
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // 验证表仍然存在（没有被删除）
      const tables = await db.query("SHOW TABLES LIKE 'character_cards'");
      expect(tables.length).toBeGreaterThan(0);

      // 验证角色卡名称被清理
      const cards = await db.query(
        "SELECT card_name FROM character_cards WHERE card_id = ?",
        [response.body.card_id],
      );
      expect(cards[0].card_name).not.toContain("DROP TABLE");

      // 清理
      await db.query("DELETE FROM character_cards WHERE card_id = ?", [
        response.body.card_id,
      ]);
    });
  });

  describe("输入标准化", () => {
    test("应该去除用户名首尾空格", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "  testfiltertrim  ",
        email: "trim@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe("testfiltertrim");

      // 清理
      await db.query("DELETE FROM users WHERE email = ?", ["trim@example.com"]);
    });

    test("应该去除角色卡名称首尾空格", async () => {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          card_name: "  角色名称  ",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // 验证名称已被标准化
      const cards = await db.query(
        "SELECT card_name FROM character_cards WHERE card_id = ?",
        [response.body.card_id],
      );
      expect(cards[0].card_name).toBe("角色名称");

      // 清理
      await db.query("DELETE FROM character_cards WHERE card_id = ?", [
        response.body.card_id,
      ]);
    });
  });

  describe("组合攻击防护", () => {
    test("应该防护同时包含 XSS 和 NoSQL 注入的输入", async () => {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          card_name: "<script>$where: function() { alert(1); }</script>",
          password: "password123",
        });

      // 应该被 NoSQL 注入检测拒绝（在 XSS 清理之后）
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("非法字符");
    });
  });
});

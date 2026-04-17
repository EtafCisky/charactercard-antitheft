/**
 * 创建角色卡接口集成测试
 *
 * 测试场景：
 * - 成功创建角色卡
 * - 输入验证（card_name, password）
 * - 生成唯一 Card ID
 * - 密码加密
 * - 初始密码版本号为 1
 * - 认证要求
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { generateToken } = require("../../src/utils/jwt");
const { hashPassword, verifyPassword } = require("../../src/utils/crypto");
const { validateCardIdFormat } = require("../../src/utils/cardId");

describe("POST /api/cards - 创建角色卡接口", () => {
  let testUserId;
  let testToken;
  let createdCardIds = [];

  // 测试前准备：创建测试用户
  beforeAll(async () => {
    const hashedPassword = await hashPassword("testpass123");
    const result = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["testuser_create", "testcreate@example.com", hashedPassword],
    );
    testUserId = result.insertId;
    testToken = generateToken(testUserId, "testuser_create");
  });

  // 测试后清理
  afterAll(async () => {
    // 删除测试创建的角色卡
    if (createdCardIds.length > 0) {
      await db.query(
        `DELETE FROM character_cards WHERE card_id IN (${createdCardIds.map(() => "?").join(",")})`,
        createdCardIds,
      );
    }
    // 删除测试用户
    await db.query("DELETE FROM users WHERE id = ?", [testUserId]);
  });

  // ============================================================================
  // 测试：成功创建角色卡
  // ============================================================================

  test("应该成功创建角色卡", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "测试角色A",
        password: "testPassword123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.card_id).toBeDefined();
    expect(response.body.password_version).toBe(1);
    expect(response.body.message).toBe("角色卡创建成功");

    // 验证 Card ID 格式
    expect(validateCardIdFormat(response.body.card_id)).toBe(true);

    // 保存 Card ID 用于清理
    createdCardIds.push(response.body.card_id);

    // 验证数据库中的记录
    const cards = await db.query(
      "SELECT * FROM character_cards WHERE card_id = ?",
      [response.body.card_id],
    );

    expect(cards.length).toBe(1);
    expect(cards[0].card_name).toBe("测试角色A");
    expect(cards[0].user_id).toBe(testUserId);
    expect(cards[0].password_version).toBe(1);

    // 验证密码已加密
    const isPasswordValid = await verifyPassword(
      "testPassword123",
      cards[0].password_hash,
    );
    expect(isPasswordValid).toBe(true);
  });

  test("应该为每个角色卡生成唯一的 Card ID", async () => {
    const cardIds = new Set();

    // 创建多个角色卡
    for (let i = 1; i <= 5; i++) {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          card_name: `测试角色${i}`,
          password: `password${i}`,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.card_id).toBeDefined();

      // 验证 Card ID 唯一性
      expect(cardIds.has(response.body.card_id)).toBe(false);
      cardIds.add(response.body.card_id);

      // 保存用于清理
      createdCardIds.push(response.body.card_id);
    }

    expect(cardIds.size).toBe(5);
  });

  // ============================================================================
  // 测试：输入验证 - card_name
  // ============================================================================

  test("应该拒绝空的 card_name", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "",
        password: "testPassword123",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("角色卡名称");
  });

  test("应该拒绝缺失的 card_name", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        password: "testPassword123",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("角色卡名称");
  });

  test("应该拒绝非字符串的 card_name", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: 12345,
        password: "testPassword123",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("角色卡名称");
  });

  test("应该拒绝超过100字符的 card_name", async () => {
    const longName = "a".repeat(101);
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: longName,
        password: "testPassword123",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("1-100 个字符");
  });

  test("应该接受1字符的 card_name", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "A",
        password: "testPassword123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    createdCardIds.push(response.body.card_id);
  });

  test("应该接受100字符的 card_name", async () => {
    const maxName = "a".repeat(100);
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: maxName,
        password: "testPassword123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    createdCardIds.push(response.body.card_id);
  });

  test("应该自动去除 card_name 前后空格", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "  测试角色  ",
        password: "testPassword123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    createdCardIds.push(response.body.card_id);

    // 验证数据库中的名称已去除空格
    const cards = await db.query(
      "SELECT card_name FROM character_cards WHERE card_id = ?",
      [response.body.card_id],
    );
    expect(cards[0].card_name).toBe("测试角色");
  });

  // ============================================================================
  // 测试：输入验证 - password
  // ============================================================================

  test("应该拒绝空的 password", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "测试角色",
        password: "",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("密码");
  });

  test("应该拒绝缺失的 password", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "测试角色",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("密码");
  });

  test("应该拒绝非字符串的 password", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "测试角色",
        password: 12345,
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("密码");
  });

  test("应该拒绝超过100字符的 password", async () => {
    const longPassword = "a".repeat(101);
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "测试角色",
        password: longPassword,
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("1-100 个字符");
  });

  test("应该接受1字符的 password", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "测试角色",
        password: "a",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    createdCardIds.push(response.body.card_id);
  });

  test("应该接受100字符的 password", async () => {
    const maxPassword = "a".repeat(100);
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "测试角色",
        password: maxPassword,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    createdCardIds.push(response.body.card_id);
  });

  // ============================================================================
  // 测试：密码加密
  // ============================================================================

  test("应该使用 bcrypt 加密密码", async () => {
    const plainPassword = "mySecretPassword123";
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "加密测试角色",
        password: plainPassword,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    createdCardIds.push(response.body.card_id);

    // 从数据库获取密码哈希
    const cards = await db.query(
      "SELECT password_hash FROM character_cards WHERE card_id = ?",
      [response.body.card_id],
    );

    const passwordHash = cards[0].password_hash;

    // 验证密码哈希格式（bcrypt 格式）
    expect(passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);

    // 验证密码哈希不等于明文密码
    expect(passwordHash).not.toBe(plainPassword);

    // 验证可以使用 bcrypt 验证密码
    const isValid = await verifyPassword(plainPassword, passwordHash);
    expect(isValid).toBe(true);

    // 验证错误密码无法通过验证
    const isInvalid = await verifyPassword("wrongPassword", passwordHash);
    expect(isInvalid).toBe(false);
  });

  // ============================================================================
  // 测试：初始密码版本号
  // ============================================================================

  test("应该将初始 password_version 设置为 1", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "版本测试角色",
        password: "testPassword123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.password_version).toBe(1);
    createdCardIds.push(response.body.card_id);

    // 验证数据库中的版本号
    const cards = await db.query(
      "SELECT password_version FROM character_cards WHERE card_id = ?",
      [response.body.card_id],
    );
    expect(cards[0].password_version).toBe(1);
  });

  // ============================================================================
  // 测试：认证要求
  // ============================================================================

  test("应该拒绝未认证的请求", async () => {
    const response = await request(app)
      .post("/api/cards")
      .send({
        card_name: "测试角色",
        password: "testPassword123",
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("认证令牌");
  });

  test("应该拒绝无效的 token", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", "Bearer invalid_token")
      .send({
        card_name: "测试角色",
        password: "testPassword123",
      })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("无效或已过期");
  });

  // ============================================================================
  // 测试：用户隔离
  // ============================================================================

  test("应该将角色卡关联到正确的用户", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "用户隔离测试",
        password: "testPassword123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    createdCardIds.push(response.body.card_id);

    // 验证数据库中的 user_id
    const cards = await db.query(
      "SELECT user_id FROM character_cards WHERE card_id = ?",
      [response.body.card_id],
    );
    expect(cards[0].user_id).toBe(testUserId);
  });

  // ============================================================================
  // 测试：Card ID 格式
  // ============================================================================

  test("生成的 Card ID 应该符合格式要求", async () => {
    const response = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        card_name: "Card ID 格式测试",
        password: "testPassword123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    const cardId = response.body.card_id;
    createdCardIds.push(cardId);

    // 验证 Card ID 格式
    expect(typeof cardId).toBe("string");
    expect(cardId.length).toBeGreaterThanOrEqual(6);
    expect(cardId.length).toBeLessThanOrEqual(8);
    expect(/^\d+$/.test(cardId)).toBe(true); // 只包含数字
    expect(cardId[0]).not.toBe("0"); // 不以 0 开头
  });

  // ============================================================================
  // 测试：特殊字符处理
  // ============================================================================

  test("应该支持包含特殊字符的 card_name", async () => {
    const specialNames = [
      "角色-测试",
      "角色_测试",
      "角色 测试",
      "角色@测试",
      "角色#测试",
      "角色!测试",
    ];

    for (const name of specialNames) {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          card_name: name,
          password: "testPassword123",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      createdCardIds.push(response.body.card_id);
    }
  });

  test("应该支持包含特殊字符的 password", async () => {
    const specialPasswords = [
      "pass@word",
      "pass#word",
      "pass$word",
      "pass!word",
      "pass word",
      "密码123",
    ];

    for (const password of specialPasswords) {
      const response = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          card_name: "特殊密码测试",
          password: password,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      createdCardIds.push(response.body.card_id);

      // 验证密码加密正确
      const cards = await db.query(
        "SELECT password_hash FROM character_cards WHERE card_id = ?",
        [response.body.card_id],
      );
      const isValid = await verifyPassword(password, cards[0].password_hash);
      expect(isValid).toBe(true);
    }
  });
});

/**
 * Integration tests for password verification API
 *
 * Tests:
 * - POST /api/verify - Password verification
 * - GET /api/cards/:card_id/version - Password version retrieval
 */

const request = require("supertest");
const app = require("../../src/server");
const db = require("../../src/db/connection");
const { hashPassword } = require("../../src/utils/crypto");
const { generateUniqueCardId } = require("../../src/utils/cardId");

describe("Password Verification API", () => {
  let testUserId;
  let testCardId;
  let testPassword = "testPassword123";
  let testPasswordHash;

  // Setup: Create test user and card before all tests
  beforeAll(async () => {
    // Initialize database connection
    await db.initializeWithRetry();

    // Create test user
    const userResult = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      ["verify_test_user", "verify@test.com", await hashPassword("password")],
    );
    testUserId = userResult.insertId;

    // Create test card
    testCardId = await generateUniqueCardId();
    testPasswordHash = await hashPassword(testPassword);

    await db.query(
      "INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) VALUES (?, ?, ?, ?, ?)",
      [testCardId, testUserId, "Test Card", testPasswordHash, 1],
    );
  });

  // Cleanup: Remove test data after all tests
  afterAll(async () => {
    // Delete test card
    await db.query("DELETE FROM character_cards WHERE card_id = ?", [
      testCardId,
    ]);

    // Delete test user
    await db.query("DELETE FROM users WHERE id = ?", [testUserId]);

    // Close database connection
    await db.closePool();
  });

  // ============================================================================
  // POST /api/verify - Password Verification Tests
  // ============================================================================

  describe("POST /api/verify", () => {
    test("should verify correct password and return password_version", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        password_version: 1,
      });
    });

    test("should reject incorrect password", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: "wrongPassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: "密码错误",
      });
    });

    test("should reject non-existent card_id", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: "999999",
        password: testPassword,
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "角色卡不存在",
      });
    });

    test("should reject invalid card_id format (too short)", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: "12345",
        password: testPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "card_id 必须是 6-8 位数字",
      });
    });

    test("should reject invalid card_id format (too long)", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: "123456789",
        password: testPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "card_id 必须是 6-8 位数字",
      });
    });

    test("should reject invalid card_id format (non-numeric)", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: "abc123",
        password: testPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "card_id 必须是 6-8 位数字",
      });
    });

    test("should reject empty card_id", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: "",
        password: testPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject empty password", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject missing card_id", async () => {
      const response = await request(app).post("/api/verify").send({
        password: testPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject missing password", async () => {
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject password that is too long", async () => {
      const longPassword = "a".repeat(101);
      const response = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: longPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "密码长度必须在 1-100 个字符之间",
      });
    });
  });

  // ============================================================================
  // GET /api/cards/:card_id/version - Password Version Tests
  // ============================================================================

  describe("GET /api/cards/:card_id/version", () => {
    test("should return password_version for existing card", async () => {
      const response = await request(app).get(
        `/api/verify/cards/${testCardId}/version`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        password_version: 1,
      });
    });

    test("should return 404 for non-existent card_id", async () => {
      const response = await request(app).get(
        "/api/verify/cards/999999/version",
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "角色卡不存在",
      });
    });

    test("should reject invalid card_id format", async () => {
      const response = await request(app).get(
        "/api/verify/cards/abc123/version",
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "card_id 必须是 6-8 位数字",
      });
    });

    test("should update password_version after password change", async () => {
      // Update password and increment version
      const newPasswordHash = await hashPassword("newPassword456");
      await db.query(
        "UPDATE character_cards SET password_hash = ?, password_version = password_version + 1 WHERE card_id = ?",
        [newPasswordHash, testCardId],
      );

      // Verify version is now 2
      const response = await request(app).get(
        `/api/verify/cards/${testCardId}/version`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        password_version: 2,
      });

      // Verify old password no longer works
      const verifyOldResponse = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: testPassword,
      });

      expect(verifyOldResponse.status).toBe(401);

      // Verify new password works
      const verifyNewResponse = await request(app).post("/api/verify").send({
        card_id: testCardId,
        password: "newPassword456",
      });

      expect(verifyNewResponse.status).toBe(200);
      expect(verifyNewResponse.body.password_version).toBe(2);

      // Reset password for other tests
      await db.query(
        "UPDATE character_cards SET password_hash = ?, password_version = 1 WHERE card_id = ?",
        [testPasswordHash, testCardId],
      );
    });
  });
});

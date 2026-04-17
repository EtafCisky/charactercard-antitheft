/**
 * JWT 模块单元测试
 */

const {
  generateToken,
  verifyToken,
  verifyTokenSync,
} = require("../../src/utils/jwt");

// 设置测试环境变量
process.env.JWT_SECRET = "test-secret-key-for-jwt-testing";

describe("JWT 认证模块", () => {
  const testUserId = 123;
  const testUsername = "testuser";

  describe("generateToken()", () => {
    test("应该生成有效的 JWT token", () => {
      const token = generateToken(testUserId, testUsername);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT 格式：header.payload.signature
    });

    test("生成的 token 应该包含正确的 payload", () => {
      const token = generateToken(testUserId, testUsername);
      const decoded = verifyTokenSync(token);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.username).toBe(testUsername);
      expect(decoded.iat).toBeDefined();
    });
  });

  describe("verifyToken()", () => {
    test("应该成功验证有效的 token", async () => {
      const token = generateToken(testUserId, testUsername);
      const decoded = await verifyToken(token);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.username).toBe(testUsername);
    });

    test("应该拒绝无效的 token", async () => {
      const invalidToken = "invalid.token.here";

      await expect(verifyToken(invalidToken)).rejects.toThrow();
    });

    test("应该拒绝使用错误密钥签名的 token", async () => {
      // 使用不同的密钥生成 token
      const jwt = require("jsonwebtoken");
      const wrongToken = jwt.sign(
        { userId: testUserId, username: testUsername },
        "wrong-secret-key",
        { expiresIn: "7d" },
      );

      await expect(verifyToken(wrongToken)).rejects.toThrow();
    });
  });

  describe("verifyTokenSync()", () => {
    test("应该同步验证有效的 token", () => {
      const token = generateToken(testUserId, testUsername);
      const decoded = verifyTokenSync(token);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.username).toBe(testUsername);
    });

    test("应该抛出错误当 token 无效时", () => {
      const invalidToken = "invalid.token.here";

      expect(() => verifyTokenSync(invalidToken)).toThrow();
    });
  });

  describe("Token 过期时间", () => {
    test("token 应该配置为 7 天过期", () => {
      const token = generateToken(testUserId, testUsername);
      const decoded = verifyTokenSync(token);

      // 计算过期时间（秒）
      const expiresIn = decoded.exp - decoded.iat;
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;

      expect(expiresIn).toBe(sevenDaysInSeconds);
    });
  });
});

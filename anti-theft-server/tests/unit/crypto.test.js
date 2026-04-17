/**
 * 密码加密模块单元测试
 *
 * 测试需求：
 * - 需求 6：密码管理 - bcrypt 加密，salt rounds 为 12
 * - 需求 19：密码强度 - 支持 1-100 字符密码
 */

const {
  hashPassword,
  verifyPassword,
  SALT_ROUNDS,
} = require("../../src/utils/crypto");

describe("密码加密模块", () => {
  // ==========================================================================
  // hashPassword() 测试
  // ==========================================================================

  describe("hashPassword()", () => {
    test("应该成功加密有效密码", async () => {
      const password = "mySecurePassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBe(60); // bcrypt 哈希固定长度为 60
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt 哈希格式
    });

    test("应该为相同密码生成不同的哈希（salt 随机性）", async () => {
      const password = "testPassword";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // 不同的 salt 导致不同的哈希
    });

    test("应该使用配置的 salt rounds（12）", async () => {
      expect(SALT_ROUNDS).toBe(12);

      const password = "testPassword";
      const hash = await hashPassword(password);

      // bcrypt 哈希格式：$2b$12$... (12 是 salt rounds)
      expect(hash).toMatch(/^\$2[aby]\$12\$/);
    });

    test("应该接受最小长度密码（1个字符）", async () => {
      const password = "a";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });

    test("应该接受最大长度密码（100个字符）", async () => {
      const password = "a".repeat(100);
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });

    test("应该接受包含特殊字符的密码", async () => {
      const password = "P@ssw0rd!#$%^&*()";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });

    test("应该接受包含 Unicode 字符的密码", async () => {
      const password = "密码123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });

    test("应该接受包含空格的密码", async () => {
      const password = "pass word with spaces";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });

    test("应该拒绝空密码", async () => {
      await expect(hashPassword("")).rejects.toThrow(
        "Password must be a non-empty string",
      );
    });

    test("应该拒绝 null", async () => {
      await expect(hashPassword(null)).rejects.toThrow(
        "Password must be a non-empty string",
      );
    });

    test("应该拒绝 undefined", async () => {
      await expect(hashPassword(undefined)).rejects.toThrow(
        "Password must be a non-empty string",
      );
    });

    test("应该拒绝非字符串类型", async () => {
      await expect(hashPassword(123)).rejects.toThrow(
        "Password must be a non-empty string",
      );
      await expect(hashPassword({})).rejects.toThrow(
        "Password must be a non-empty string",
      );
      await expect(hashPassword([])).rejects.toThrow(
        "Password must be a non-empty string",
      );
    });

    test("应该拒绝超过 100 字符的密码", async () => {
      const password = "a".repeat(101);
      await expect(hashPassword(password)).rejects.toThrow(
        "Password length must be between 1 and 100 characters",
      );
    });
  });

  // ==========================================================================
  // verifyPassword() 测试
  // ==========================================================================

  describe("verifyPassword()", () => {
    test("应该成功验证正确的密码", async () => {
      const password = "mySecurePassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("应该拒绝错误的密码", async () => {
      const password = "correctPassword";
      const wrongPassword = "wrongPassword";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test("应该区分大小写", async () => {
      const password = "Password123";
      const hash = await hashPassword(password);

      const isValid1 = await verifyPassword("password123", hash);
      const isValid2 = await verifyPassword("PASSWORD123", hash);

      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });

    test("应该验证包含特殊字符的密码", async () => {
      const password = "P@ssw0rd!#$%";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("应该验证包含 Unicode 字符的密码", async () => {
      const password = "密码123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("应该验证包含空格的密码", async () => {
      const password = "pass word with spaces";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("应该验证最小长度密码（1个字符）", async () => {
      const password = "a";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("应该验证最大长度密码（100个字符）", async () => {
      const password = "a".repeat(100);
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("应该拒绝空密码", async () => {
      const hash = await hashPassword("validPassword");
      await expect(verifyPassword("", hash)).rejects.toThrow(
        "Password must be a non-empty string",
      );
    });

    test("应该拒绝 null 密码", async () => {
      const hash = await hashPassword("validPassword");
      await expect(verifyPassword(null, hash)).rejects.toThrow(
        "Password must be a non-empty string",
      );
    });

    test("应该拒绝 undefined 密码", async () => {
      const hash = await hashPassword("validPassword");
      await expect(verifyPassword(undefined, hash)).rejects.toThrow(
        "Password must be a non-empty string",
      );
    });

    test("应该拒绝非字符串密码", async () => {
      const hash = await hashPassword("validPassword");
      await expect(verifyPassword(123, hash)).rejects.toThrow(
        "Password must be a non-empty string",
      );
    });

    test("应该拒绝空哈希", async () => {
      await expect(verifyPassword("password", "")).rejects.toThrow(
        "Hash must be a non-empty string",
      );
    });

    test("应该拒绝 null 哈希", async () => {
      await expect(verifyPassword("password", null)).rejects.toThrow(
        "Hash must be a non-empty string",
      );
    });

    test("应该拒绝 undefined 哈希", async () => {
      await expect(verifyPassword("password", undefined)).rejects.toThrow(
        "Hash must be a non-empty string",
      );
    });

    test("应该拒绝非字符串哈希", async () => {
      await expect(verifyPassword("password", 123)).rejects.toThrow(
        "Hash must be a non-empty string",
      );
    });

    test("应该拒绝无效的哈希格式", async () => {
      // bcrypt 对于无效哈希会返回 false 而不是抛出错误
      const isValid = await verifyPassword("password", "invalid-hash");
      expect(isValid).toBe(false);
    });
  });

  // ==========================================================================
  // 安全性测试
  // ==========================================================================

  describe("安全性测试", () => {
    test("相同密码应该生成不同的哈希（防止彩虹表攻击）", async () => {
      const password = "commonPassword";
      const hashes = new Set();

      // 生成 10 个相同密码的哈希
      for (let i = 0; i < 10; i++) {
        const hash = await hashPassword(password);
        hashes.add(hash);
      }

      // 所有哈希应该都不同
      expect(hashes.size).toBe(10);
    });

    test("哈希应该不可逆（无法从哈希推导出原密码）", async () => {
      const password = "secretPassword";
      const hash = await hashPassword(password);

      // 哈希不应该包含原密码的任何部分
      expect(hash).not.toContain(password);
      expect(hash.toLowerCase()).not.toContain(password.toLowerCase());
    });

    test("微小的密码差异应该产生完全不同的哈希", async () => {
      const password1 = "password";
      const password2 = "Password"; // 仅大小写不同
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      // 哈希应该完全不同
      expect(hash1).not.toBe(hash2);

      // 且不能互相验证
      expect(await verifyPassword(password1, hash2)).toBe(false);
      expect(await verifyPassword(password2, hash1)).toBe(false);
    });
  });

  // ==========================================================================
  // 性能测试
  // ==========================================================================

  describe("性能测试", () => {
    test("密码加密应该在合理时间内完成（< 500ms）", async () => {
      const password = "testPassword";
      const startTime = Date.now();

      await hashPassword(password);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    test("密码验证应该在合理时间内完成（< 500ms）", async () => {
      const password = "testPassword";
      const hash = await hashPassword(password);

      const startTime = Date.now();
      await verifyPassword(password, hash);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });
  });
});

/**
 * Card ID 生成模块单元测试
 *
 * 测试覆盖：
 * - generateCardId() 基本功能
 * - Card ID 格式验证
 * - 不以 0 开头的验证
 * - validateCardIdFormat() 函数
 */

const {
  generateCardId,
  validateCardIdFormat,
  MIN_LENGTH,
  MAX_LENGTH,
} = require("../../src/utils/cardId");

describe("Card ID 生成模块", () => {
  describe("generateCardId()", () => {
    test("应该生成 6-8 位数字字符串", () => {
      const cardId = generateCardId();

      expect(typeof cardId).toBe("string");
      expect(cardId.length).toBeGreaterThanOrEqual(MIN_LENGTH);
      expect(cardId.length).toBeLessThanOrEqual(MAX_LENGTH);
      expect(/^\d+$/.test(cardId)).toBe(true);
    });

    test("生成的 Card ID 不应以 0 开头", () => {
      // 测试多次以确保随机性
      for (let i = 0; i < 100; i++) {
        const cardId = generateCardId();
        expect(cardId[0]).not.toBe("0");
      }
    });

    test("应该生成不同的 Card ID", () => {
      const ids = new Set();

      // 生成 100 个 ID，应该大部分不同
      for (let i = 0; i < 100; i++) {
        ids.add(generateCardId());
      }

      // 至少应该有 90 个不同的 ID（考虑到随机碰撞）
      expect(ids.size).toBeGreaterThan(90);
    });
  });

  describe("validateCardIdFormat()", () => {
    test("应该接受有效的 Card ID", () => {
      expect(validateCardIdFormat("123456")).toBe(true);
      expect(validateCardIdFormat("1234567")).toBe(true);
      expect(validateCardIdFormat("12345678")).toBe(true);
      expect(validateCardIdFormat("999999")).toBe(true);
    });

    test("应该拒绝以 0 开头的 Card ID", () => {
      expect(validateCardIdFormat("0123456")).toBe(false);
      expect(validateCardIdFormat("01234567")).toBe(false);
    });

    test("应该拒绝长度不正确的 Card ID", () => {
      expect(validateCardIdFormat("12345")).toBe(false); // 太短
      expect(validateCardIdFormat("123456789")).toBe(false); // 太长
      expect(validateCardIdFormat("1")).toBe(false); // 太短
    });

    test("应该拒绝包含非数字字符的 Card ID", () => {
      expect(validateCardIdFormat("12a456")).toBe(false);
      expect(validateCardIdFormat("123-456")).toBe(false);
      expect(validateCardIdFormat("123 456")).toBe(false);
      expect(validateCardIdFormat("123.456")).toBe(false);
    });

    test("应该拒绝非字符串类型", () => {
      expect(validateCardIdFormat(123456)).toBe(false);
      expect(validateCardIdFormat(null)).toBe(false);
      expect(validateCardIdFormat(undefined)).toBe(false);
      expect(validateCardIdFormat({})).toBe(false);
      expect(validateCardIdFormat([])).toBe(false);
    });
  });
});

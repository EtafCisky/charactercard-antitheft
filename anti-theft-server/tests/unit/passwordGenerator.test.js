/**
 * 密码生成器单元测试
 *
 * 测试范围：
 * - 默认参数生成密码
 * - 自定义长度生成密码
 * - 包含/不包含符号
 * - 密码强度验证
 * - 边界条件测试
 */

const { generateRandomPassword } = require("../../src/utils/passwordGenerator");

describe("密码生成器单元测试", () => {
  describe("generateRandomPassword - 基本功能", () => {
    test("应该生成默认16字符的密码", () => {
      const password = generateRandomPassword();
      expect(password).toHaveLength(16);
    });

    test("应该生成指定长度的密码", () => {
      const password = generateRandomPassword({ length: 20 });
      expect(password).toHaveLength(20);
    });

    test("应该生成最小长度8字符的密码", () => {
      const password = generateRandomPassword({ length: 8 });
      expect(password).toHaveLength(8);
    });

    test("应该生成最大长度100字符的密码", () => {
      const password = generateRandomPassword({ length: 100 });
      expect(password).toHaveLength(100);
    });
  });

  describe("generateRandomPassword - 字符集验证", () => {
    test("应该包含大写字母", () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[A-Z]/);
    });

    test("应该包含小写字母", () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[a-z]/);
    });

    test("应该包含数字", () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[0-9]/);
    });

    test("默认应该包含符号", () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
    });

    test("当 includeSymbols 为 false 时不应包含符号", () => {
      const password = generateRandomPassword({ includeSymbols: false });
      expect(password).not.toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
    });

    test("当 includeSymbols 为 false 时应该只包含字母和数字", () => {
      const password = generateRandomPassword({ includeSymbols: false });
      expect(password).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe("generateRandomPassword - 随机性测试", () => {
    test("连续生成的密码应该不同", () => {
      const password1 = generateRandomPassword();
      const password2 = generateRandomPassword();
      const password3 = generateRandomPassword();

      expect(password1).not.toBe(password2);
      expect(password2).not.toBe(password3);
      expect(password1).not.toBe(password3);
    });

    test("生成100个密码应该都不相同", () => {
      const passwords = new Set();
      for (let i = 0; i < 100; i++) {
        passwords.add(generateRandomPassword());
      }
      expect(passwords.size).toBe(100);
    });
  });

  describe("generateRandomPassword - 错误处理", () => {
    test("长度小于8应该抛出错误", () => {
      expect(() => {
        generateRandomPassword({ length: 7 });
      }).toThrow("密码长度必须在 8-100 之间");
    });

    test("长度大于100应该抛出错误", () => {
      expect(() => {
        generateRandomPassword({ length: 101 });
      }).toThrow("密码长度必须在 8-100 之间");
    });

    test("长度为非数字应该抛出错误", () => {
      expect(() => {
        generateRandomPassword({ length: "abc" });
      }).toThrow("密码长度必须在 8-100 之间");
    });

    test("长度为负数应该抛出错误", () => {
      expect(() => {
        generateRandomPassword({ length: -5 });
      }).toThrow("密码长度必须在 8-100 之间");
    });
  });

  describe("generateRandomPassword - 密码强度", () => {
    test("16字符密码应该包含至少1个大写字母", () => {
      for (let i = 0; i < 10; i++) {
        const password = generateRandomPassword({ length: 16 });
        const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
        expect(uppercaseCount).toBeGreaterThanOrEqual(1);
      }
    });

    test("16字符密码应该包含至少1个小写字母", () => {
      for (let i = 0; i < 10; i++) {
        const password = generateRandomPassword({ length: 16 });
        const lowercaseCount = (password.match(/[a-z]/g) || []).length;
        expect(lowercaseCount).toBeGreaterThanOrEqual(1);
      }
    });

    test("16字符密码应该包含至少1个数字", () => {
      for (let i = 0; i < 10; i++) {
        const password = generateRandomPassword({ length: 16 });
        const numberCount = (password.match(/[0-9]/g) || []).length;
        expect(numberCount).toBeGreaterThanOrEqual(1);
      }
    });

    test("16字符密码（包含符号）应该包含至少1个符号", () => {
      for (let i = 0; i < 10; i++) {
        const password = generateRandomPassword({
          length: 16,
          includeSymbols: true,
        });
        const symbolCount = (
          password.match(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/g) || []
        ).length;
        expect(symbolCount).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("generateRandomPassword - 边界条件", () => {
    test("8字符密码应该包含所有必需的字符类型", () => {
      const password = generateRandomPassword({ length: 8 });
      expect(password).toMatch(/[A-Z]/); // 至少1个大写
      expect(password).toMatch(/[a-z]/); // 至少1个小写
      expect(password).toMatch(/[0-9]/); // 至少1个数字
      expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/); // 至少1个符号
    });

    test("8字符密码（不包含符号）应该包含字母和数字", () => {
      const password = generateRandomPassword({
        length: 8,
        includeSymbols: false,
      });
      expect(password).toMatch(/[A-Z]/); // 至少1个大写
      expect(password).toMatch(/[a-z]/); // 至少1个小写
      expect(password).toMatch(/[0-9]/); // 至少1个数字
      expect(password).not.toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/); // 不包含符号
    });
  });
});

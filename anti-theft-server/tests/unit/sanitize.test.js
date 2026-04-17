/**
 * 输入过滤工具单元测试
 *
 * 测试覆盖：
 * - XSS 防护
 * - 路径遍历防护
 * - NoSQL 注入检测
 * - 输入标准化
 */

const {
  sanitizeXSS,
  sanitizeObject,
  isPathSafe,
  sanitizePath,
  hasNoSQLInjection,
  normalizeString,
  sanitizeAndNormalize,
} = require("../../src/utils/sanitize");

describe("XSS 防护", () => {
  describe("sanitizeXSS", () => {
    test("应该移除 script 标签", () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeXSS(input);
      expect(result).toBe("Hello");
      expect(result).not.toContain("<script>");
    });

    test("应该移除所有 HTML 标签", () => {
      const input = "<div><p>Hello</p><span>World</span></div>";
      const result = sanitizeXSS(input);
      expect(result).toBe("HelloWorld");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    test("应该移除事件处理器", () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeXSS(input);
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("alert");
    });

    test("应该保留纯文本", () => {
      const input = "Normal text without HTML";
      const result = sanitizeXSS(input);
      expect(result).toBe(input);
    });

    test("应该处理空字符串", () => {
      const result = sanitizeXSS("");
      expect(result).toBe("");
    });

    test("应该处理非字符串输入", () => {
      expect(sanitizeXSS(null)).toBe(null);
      expect(sanitizeXSS(undefined)).toBe(undefined);
      expect(sanitizeXSS(123)).toBe(123);
    });

    test("应该移除 style 标签", () => {
      const input = "<style>body { background: red; }</style>Content";
      const result = sanitizeXSS(input);
      expect(result).toBe("Content");
      expect(result).not.toContain("<style>");
    });

    test("应该处理 JavaScript 协议", () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeXSS(input);
      expect(result).not.toContain("javascript:");
    });
  });

  describe("sanitizeObject", () => {
    test("应该清理对象中的所有字符串字段", () => {
      const input = {
        name: "<script>alert(1)</script>Test",
        description: "<b>Bold</b> text",
        age: 25,
      };
      const result = sanitizeObject(input);
      expect(result.name).toBe("Test");
      expect(result.description).toBe("Bold text");
      expect(result.age).toBe(25);
    });

    test("应该递归清理嵌套对象", () => {
      const input = {
        user: {
          name: "<script>XSS</script>John",
          profile: {
            bio: "<img src=x onerror=alert(1)>",
          },
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).toBe("John");
      expect(result.user.profile.bio).not.toContain("<img");
    });

    test("应该处理空对象", () => {
      const result = sanitizeObject({});
      expect(result).toEqual({});
    });

    test("应该处理非对象输入", () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
      expect(sanitizeObject("string")).toBe("string");
    });
  });
});

describe("路径遍历防护", () => {
  describe("isPathSafe", () => {
    test("应该接受安全的相对路径", () => {
      expect(isPathSafe("uploads/file.txt")).toBe(true);
      expect(isPathSafe("images/photo.jpg")).toBe(true);
      expect(isPathSafe("data/config.json")).toBe(true);
    });

    test("应该拒绝包含 .. 的路径", () => {
      expect(isPathSafe("../../../etc/passwd")).toBe(false);
      expect(isPathSafe("uploads/../../../etc/passwd")).toBe(false);
      expect(isPathSafe("..\\..\\windows\\system32")).toBe(false);
    });

    test("应该拒绝绝对路径", () => {
      expect(isPathSafe("/etc/passwd")).toBe(false);
      expect(isPathSafe("/var/log/messages")).toBe(false);
      expect(isPathSafe("\\Windows\\System32")).toBe(false);
    });

    test("应该拒绝 Windows 绝对路径", () => {
      expect(isPathSafe("C:\\Windows\\System32")).toBe(false);
      expect(isPathSafe("D:\\Data\\secrets.txt")).toBe(false);
      expect(isPathSafe("c:\\windows\\system32")).toBe(false);
    });

    test("应该拒绝空字节注入", () => {
      expect(isPathSafe("file.txt\0.jpg")).toBe(false);
    });

    test("应该拒绝 URL 编码的路径遍历", () => {
      expect(isPathSafe("uploads%2f%2e%2e%2fetc%2fpasswd")).toBe(false);
      expect(isPathSafe("%2e%2e%2f%2e%2e%2fpasswd")).toBe(false);
    });

    test("应该处理非字符串输入", () => {
      expect(isPathSafe(null)).toBe(false);
      expect(isPathSafe(undefined)).toBe(false);
      expect(isPathSafe(123)).toBe(false);
    });
  });

  describe("sanitizePath", () => {
    test("应该移除路径遍历字符", () => {
      const input = "../../../etc/passwd";
      const result = sanitizePath(input);
      expect(result).not.toContain("..");
      expect(result).not.toContain("/");
      expect(result).toBe("etcpasswd");
    });

    test("应该移除所有斜杠", () => {
      const input = "path/to/file.txt";
      const result = sanitizePath(input);
      expect(result).not.toContain("/");
      expect(result).toBe("pathtofile.txt");
    });

    test("应该移除反斜杠", () => {
      const input = "path\\to\\file.txt";
      const result = sanitizePath(input);
      expect(result).not.toContain("\\");
      expect(result).toBe("pathtofile.txt");
    });

    test("应该移除冒号", () => {
      const input = "C:\\Windows\\System32";
      const result = sanitizePath(input);
      expect(result).not.toContain(":");
      expect(result).toBe("CWindowsSystem32");
    });

    test("应该处理空字符串", () => {
      expect(sanitizePath("")).toBe("");
    });

    test("应该处理非字符串输入", () => {
      expect(sanitizePath(null)).toBe("");
      expect(sanitizePath(undefined)).toBe("");
    });
  });
});

describe("NoSQL 注入检测", () => {
  describe("hasNoSQLInjection", () => {
    test("应该接受正常文本", () => {
      expect(hasNoSQLInjection("normal text")).toBe(false);
      expect(hasNoSQLInjection("user@example.com")).toBe(false);
      expect(hasNoSQLInjection("John Doe")).toBe(false);
    });

    test("应该检测 MongoDB 操作符", () => {
      expect(hasNoSQLInjection("$where: function() { return true; }")).toBe(
        true,
      );
      expect(hasNoSQLInjection('{ "$ne": null }')).toBe(true);
      expect(hasNoSQLInjection('{ "$gt": 0 }')).toBe(true);
      expect(hasNoSQLInjection('{ "$lt": 100 }')).toBe(true);
      expect(hasNoSQLInjection('{ "$or": [] }')).toBe(true);
      expect(hasNoSQLInjection('{ "$and": [] }')).toBe(true);
    });

    test("应该检测 JavaScript 函数", () => {
      expect(hasNoSQLInjection("function() { return true; }")).toBe(true);
      expect(hasNoSQLInjection("() => { alert(1); }")).toBe(true);
    });

    test("应该检测 eval 调用", () => {
      expect(hasNoSQLInjection("eval('malicious code')")).toBe(true);
      expect(hasNoSQLInjection("EVAL(code)")).toBe(true);
    });

    test("应该处理非字符串输入", () => {
      expect(hasNoSQLInjection(null)).toBe(false);
      expect(hasNoSQLInjection(undefined)).toBe(false);
      expect(hasNoSQLInjection(123)).toBe(false);
    });

    test("应该区分大小写（不区分）", () => {
      expect(hasNoSQLInjection("$WHERE")).toBe(true);
      expect(hasNoSQLInjection("$Ne")).toBe(true);
      expect(hasNoSQLInjection("FUNCTION()")).toBe(true);
    });
  });
});

describe("输入标准化", () => {
  describe("normalizeString", () => {
    test("应该去除首尾空格", () => {
      expect(normalizeString("  hello  ")).toBe("hello");
      expect(normalizeString("\t\ntext\n\t")).toBe("text");
    });

    test("应该保留中间的空格", () => {
      expect(normalizeString("hello world")).toBe("hello world");
    });

    test("应该处理空字符串", () => {
      expect(normalizeString("")).toBe("");
      expect(normalizeString("   ")).toBe("");
    });

    test("应该处理非字符串输入", () => {
      expect(normalizeString(null)).toBe(null);
      expect(normalizeString(undefined)).toBe(undefined);
      expect(normalizeString(123)).toBe(123);
    });
  });

  describe("sanitizeAndNormalize", () => {
    test("应该同时标准化和清理输入", () => {
      const input = "  <script>alert(1)</script>Hello  ";
      const result = sanitizeAndNormalize(input);
      expect(result).toBe("Hello");
      expect(result).not.toContain("<script>");
    });

    test("应该先标准化再清理", () => {
      const input = "  <b>Bold</b> text  ";
      const result = sanitizeAndNormalize(input);
      expect(result).toBe("Bold text");
    });

    test("应该处理空字符串", () => {
      expect(sanitizeAndNormalize("")).toBe("");
      expect(sanitizeAndNormalize("   ")).toBe("");
    });

    test("应该处理非字符串输入", () => {
      expect(sanitizeAndNormalize(null)).toBe(null);
      expect(sanitizeAndNormalize(undefined)).toBe(undefined);
    });
  });
});

describe("集成测试", () => {
  test("应该处理复杂的恶意输入", () => {
    const input =
      '  <script>eval("$where: function() { return true; }")</script>  ';
    const result = sanitizeAndNormalize(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("eval");
    expect(result).not.toContain("$where");
  });

  test("应该保护用户名输入", () => {
    const maliciousUsername = "<img src=x onerror=alert(1)>admin";
    const result = sanitizeAndNormalize(maliciousUsername);
    expect(result).toBe("admin");
    expect(result).not.toContain("<");
    expect(result).not.toContain("onerror");
  });

  test("应该保护邮箱输入", () => {
    const maliciousEmail = "test@example.com<script>alert(1)</script>";
    const result = sanitizeAndNormalize(maliciousEmail);
    expect(result).toBe("test@example.com");
    expect(result).not.toContain("<script>");
  });

  test("应该保护角色卡名称输入", () => {
    const maliciousCardName = '角色A<iframe src="evil.com"></iframe>';
    const result = sanitizeAndNormalize(maliciousCardName);
    expect(result).toBe("角色A");
    expect(result).not.toContain("<iframe>");
  });
});

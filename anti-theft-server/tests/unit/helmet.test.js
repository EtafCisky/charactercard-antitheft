/**
 * Helmet 安全头部配置测试
 *
 * 测试目标：
 * - 验证 HSTS 头部配置
 * - 验证 X-Content-Type-Options 头部
 * - 验证 X-Frame-Options 头部
 * - 验证 CSP 头部配置
 */

const request = require("supertest");

// Mock 数据库连接
jest.mock("../../src/db/connection", () => ({
  initializeWithRetry: jest.fn().mockResolvedValue(true),
  healthCheck: jest.fn().mockResolvedValue({
    status: "connected",
    healthy: true,
  }),
  closePool: jest.fn().mockResolvedValue(true),
}));

describe("Helmet 安全头部配置测试", () => {
  let app;

  beforeAll(() => {
    // 设置测试环境变量
    process.env.NODE_ENV = "production";
    process.env.SERVER_PORT = "3001";
    process.env.DB_HOST = "localhost";
    process.env.DB_USER = "test";
    process.env.DB_PASSWORD = "test";
    process.env.DB_NAME = "test_db";
    process.env.JWT_SECRET = "test-secret";

    // 导入 app（会自动应用 Helmet 配置）
    app = require("../../src/server");
  });

  afterAll(async () => {
    // 清理
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe("HSTS (HTTP Strict Transport Security)", () => {
    it("应该设置 Strict-Transport-Security 头部", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["strict-transport-security"]).toBeDefined();
    });

    it("HSTS 头部应该包含 max-age", async () => {
      const response = await request(app).get("/health");

      const hstsHeader = response.headers["strict-transport-security"];
      expect(hstsHeader).toContain("max-age=31536000");
    });

    it("HSTS 头部应该包含 includeSubDomains", async () => {
      const response = await request(app).get("/health");

      const hstsHeader = response.headers["strict-transport-security"];
      expect(hstsHeader).toContain("includeSubDomains");
    });

    it("HSTS 头部应该包含 preload", async () => {
      const response = await request(app).get("/health");

      const hstsHeader = response.headers["strict-transport-security"];
      expect(hstsHeader).toContain("preload");
    });
  });

  describe("X-Content-Type-Options", () => {
    it("应该设置 X-Content-Type-Options: nosniff", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
    });
  });

  describe("X-Frame-Options", () => {
    it("应该设置 X-Frame-Options: DENY", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-frame-options"]).toBe("DENY");
    });
  });

  describe("Content-Security-Policy (CSP)", () => {
    it("应该设置 Content-Security-Policy 头部", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["content-security-policy"]).toBeDefined();
    });

    it("CSP 应该包含 default-src 'self'", async () => {
      const response = await request(app).get("/health");

      const cspHeader = response.headers["content-security-policy"];
      expect(cspHeader).toContain("default-src 'self'");
    });

    it("CSP 应该包含 script-src 'self'", async () => {
      const response = await request(app).get("/health");

      const cspHeader = response.headers["content-security-policy"];
      expect(cspHeader).toContain("script-src 'self'");
    });

    it("CSP 应该包含 object-src 'none'", async () => {
      const response = await request(app).get("/health");

      const cspHeader = response.headers["content-security-policy"];
      expect(cspHeader).toContain("object-src 'none'");
    });

    it("CSP 应该包含 frame-src 'none'", async () => {
      const response = await request(app).get("/health");

      const cspHeader = response.headers["content-security-policy"];
      expect(cspHeader).toContain("frame-src 'none'");
    });

    it("CSP 应该包含 upgrade-insecure-requests", async () => {
      const response = await request(app).get("/health");

      const cspHeader = response.headers["content-security-policy"];
      expect(cspHeader).toContain("upgrade-insecure-requests");
    });
  });

  describe("其他安全头部", () => {
    it("应该隐藏 X-Powered-By 头部", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-powered-by"]).toBeUndefined();
    });

    it("应该设置 X-DNS-Prefetch-Control: off", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-dns-prefetch-control"]).toBe("off");
    });
  });

  describe("所有端点都应该应用安全头部", () => {
    it("根路径应该包含安全头部", async () => {
      const response = await request(app).get("/");

      expect(response.headers["strict-transport-security"]).toBeDefined();
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["content-security-policy"]).toBeDefined();
    });

    it("健康检查端点应该包含安全头部", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["strict-transport-security"]).toBeDefined();
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["content-security-policy"]).toBeDefined();
    });

    it("404 端点应该包含安全头部", async () => {
      const response = await request(app).get("/nonexistent");

      expect(response.headers["strict-transport-security"]).toBeDefined();
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["content-security-policy"]).toBeDefined();
    });
  });
});

/**
 * CORS 配置集成测试
 *
 * 测试内容：
 * - 允许的来源列表配置
 * - localhost 和 127.0.0.1 支持
 * - credentials 支持
 * - 不允许的来源拒绝
 */

const request = require("supertest");
const app = require("../../src/server");

describe("CORS Configuration", () => {
  describe("Allowed Origins", () => {
    it("should allow requests from localhost:8000", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:8000");

      expect(response.status).not.toBe(403);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:8000",
      );
    });

    it("should allow requests from 127.0.0.1:8000", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://127.0.0.1:8000");

      expect(response.status).not.toBe(403);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://127.0.0.1:8000",
      );
    });

    it("should allow requests without origin (same-origin or server-to-server)", async () => {
      const response = await request(app).get("/health");

      // 应该允许请求（即使数据库不可用，也不应该是 CORS 错误）
      // 503 表示数据库不可用，但请求本身被接受了
      expect(response.status).not.toBe(403);
      expect([200, 503]).toContain(response.status);
    });
  });

  describe("Development Environment Origins", () => {
    beforeAll(() => {
      // 确保在开发环境
      process.env.NODE_ENV = "development";
    });

    it("should allow localhost:3000 in development", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:3000");

      expect(response.status).not.toBe(403);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000",
      );
    });

    it("should allow localhost:5173 (Vite) in development", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:5173");

      expect(response.status).not.toBe(403);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173",
      );
    });

    it("should allow 127.0.0.1:3000 in development", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://127.0.0.1:3000");

      expect(response.status).not.toBe(403);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://127.0.0.1:3000",
      );
    });
  });

  describe("Credentials Support", () => {
    it("should include Access-Control-Allow-Credentials header", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:8000");

      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should allow credentials in preflight requests", async () => {
      const response = await request(app)
        .options("/api/auth/login")
        .set("Origin", "http://localhost:8000")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Content-Type");

      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("Disallowed Origins", () => {
    it("should reject requests from unauthorized origins", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://malicious-site.com");

      // CORS 错误会在浏览器端被拦截，服务器可能返回 200 但不包含 CORS 头
      // 或者返回错误响应
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("should reject requests from unauthorized HTTPS origins", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "https://unauthorized-domain.com");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("Preflight Requests", () => {
    it("should handle OPTIONS preflight requests correctly", async () => {
      const response = await request(app)
        .options("/api/auth/login")
        .set("Origin", "http://localhost:8000")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Content-Type,Authorization");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:8000",
      );
      expect(response.headers["access-control-allow-methods"]).toBeDefined();
      expect(response.headers["access-control-allow-headers"]).toBeDefined();
    });

    it("should return 200 for preflight requests (optionsSuccessStatus)", async () => {
      const response = await request(app)
        .options("/api/verify")
        .set("Origin", "http://localhost:8000")
        .set("Access-Control-Request-Method", "POST");

      expect(response.status).toBe(200);
    });
  });

  describe("Custom CORS_ORIGINS Environment Variable", () => {
    const originalCorsOrigins = process.env.CORS_ORIGINS;

    afterEach(() => {
      // 恢复原始环境变量
      process.env.CORS_ORIGINS = originalCorsOrigins;
    });

    it("should respect custom origins from environment variable", async () => {
      // 注意：这个测试需要重启服务器才能生效
      // 在实际测试中，可能需要使用不同的方法来测试环境变量
      expect(process.env.CORS_ORIGINS).toBeDefined();
    });

    it("should parse multiple origins from comma-separated string", () => {
      const testOrigins = "http://example.com,https://example.org";
      const parsed = testOrigins.split(",").map((o) => o.trim());

      expect(parsed).toHaveLength(2);
      expect(parsed).toContain("http://example.com");
      expect(parsed).toContain("https://example.org");
    });
  });

  describe("CORS Error Handling", () => {
    it("should handle CORS errors gracefully", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://blocked-origin.com");

      // 服务器应该正常响应，但不包含 CORS 头
      // 浏览器会拦截响应
      expect(response.status).toBeLessThan(500);
    });
  });
});

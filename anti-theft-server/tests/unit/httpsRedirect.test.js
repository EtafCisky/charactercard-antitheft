/**
 * Unit Tests for HTTPS Redirect Middleware
 */

const httpsRedirect = require("../../src/middleware/httpsRedirect");

describe("HTTPS Redirect Middleware", () => {
  let req, res, next;
  let originalEnv;

  beforeEach(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;

    // Mock request object
    req = {
      secure: false,
      headers: {
        host: "example.com",
        "x-forwarded-proto": "http",
      },
      url: "/api/test",
    };

    // Mock response object
    res = {
      redirect: jest.fn(),
    };

    // Mock next function
    next = jest.fn();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe("Production Environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    test("should redirect HTTP to HTTPS when req.secure is false", () => {
      req.secure = false;
      req.headers["x-forwarded-proto"] = "http";

      httpsRedirect(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(
        301,
        "https://example.com/api/test",
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should not redirect when req.secure is true", () => {
      req.secure = true;

      httpsRedirect(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test("should not redirect when x-forwarded-proto is https", () => {
      req.secure = false;
      req.headers["x-forwarded-proto"] = "https";

      httpsRedirect(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test("should handle requests with query parameters", () => {
      req.secure = false;
      req.headers["x-forwarded-proto"] = "http";
      req.url = "/api/test?param=value";

      httpsRedirect(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(
        301,
        "https://example.com/api/test?param=value",
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle requests with custom ports", () => {
      req.secure = false;
      req.headers.host = "example.com:8080";
      req.headers["x-forwarded-proto"] = "http";

      httpsRedirect(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(
        301,
        "https://example.com:8080/api/test",
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle root path requests", () => {
      req.secure = false;
      req.headers["x-forwarded-proto"] = "http";
      req.url = "/";

      httpsRedirect(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(301, "https://example.com/");
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Development Environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    test("should not redirect HTTP requests in development", () => {
      req.secure = false;
      req.headers["x-forwarded-proto"] = "http";

      httpsRedirect(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test("should allow HTTP requests to pass through", () => {
      req.secure = false;

      httpsRedirect(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Test Environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "test";
    });

    test("should not redirect HTTP requests in test environment", () => {
      req.secure = false;
      req.headers["x-forwarded-proto"] = "http";

      httpsRedirect(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("No NODE_ENV Set", () => {
    beforeEach(() => {
      delete process.env.NODE_ENV;
    });

    test("should not redirect when NODE_ENV is not set", () => {
      req.secure = false;
      req.headers["x-forwarded-proto"] = "http";

      httpsRedirect(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    test("should handle missing x-forwarded-proto header", () => {
      req.secure = false;
      delete req.headers["x-forwarded-proto"];

      httpsRedirect(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(
        301,
        "https://example.com/api/test",
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle case-sensitive x-forwarded-proto values", () => {
      req.secure = false;
      req.headers["x-forwarded-proto"] = "HTTPS";

      httpsRedirect(req, res, next);

      // Should redirect because 'HTTPS' !== 'https' (case-sensitive)
      expect(res.redirect).toHaveBeenCalledWith(
        301,
        "https://example.com/api/test",
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should prioritize req.secure over x-forwarded-proto", () => {
      req.secure = true;
      req.headers["x-forwarded-proto"] = "http";

      httpsRedirect(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});

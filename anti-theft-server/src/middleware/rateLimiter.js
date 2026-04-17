/**
 * 速率限制中间件
 *
 * 功能：
 * - IP 级别速率限制（10次/分钟）
 * - Card ID 级别速率限制（5次/分钟）
 * - 返回 429 状态码和重试信息
 *
 * 验证需求：
 * - 需求 8.1：限制每个 IP 地址每分钟 10 次密码验证请求
 * - 需求 8.2：限制每个 Card_ID 每分钟 5 次密码验证请求
 * - 需求 8.3：超过限制时返回 HTTP 429 状态码
 * - 需求 8.4：响应中包含 retry-after 信息
 */

const rateLimit = require("express-rate-limit");

// ============================================================================
// IP 级别速率限制器
// ============================================================================

/**
 * IP 级别速率限制：每个 IP 地址每分钟最多 10 次请求
 *
 * 验证需求 8.1：限制每个 IP 地址每分钟 10 次密码验证请求
 * 验证需求 8.3：超过限制时返回 HTTP 429 状态码
 * 验证需求 8.4：响应中包含 retry-after 信息
 */
const ipRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟时间窗口
  max: 10, // 每个 IP 最多 10 次请求
  message: {
    success: false,
    message: "请求过于频繁，请稍后再试",
    error_code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // 返回 RateLimit-* 头部
  legacyHeaders: false, // 禁用 X-RateLimit-* 头部
  // 使用默认的 IP 键生成器（自动支持 IPv4 和 IPv6）
  // 自定义处理器：添加 retry-after 信息
  handler: (req, res) => {
    const retryAfter = Math.ceil(
      req.rateLimit.resetTime / 1000 - Date.now() / 1000,
    );

    res.status(429).json({
      success: false,
      message: `请求过于频繁，请在 ${retryAfter} 秒后重试`,
      error_code: "RATE_LIMIT_EXCEEDED",
      retry_after: retryAfter,
    });
  },
});

// ============================================================================
// Card ID 级别速率限制器
// ============================================================================

/**
 * Card ID 级别速率限制：每个 Card_ID 每分钟最多 5 次请求
 *
 * 验证需求 8.2：限制每个 Card_ID 每分钟 5 次密码验证请求
 * 验证需求 8.3：超过限制时返回 HTTP 429 状态码
 * 验证需求 8.4：响应中包含 retry-after 信息
 */
const cardIdRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟时间窗口
  max: 5, // 每个 Card_ID 最多 5 次请求
  message: {
    success: false,
    message: "该角色卡验证请求过于频繁",
    error_code: "CARD_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: false, // 不返回标准头部（避免与 IP 限制器冲突）
  legacyHeaders: false,
  // 自定义键生成器：使用 card_id
  keyGenerator: (req) => {
    // 从请求体中提取 card_id
    const cardId = req.body?.card_id;

    // 如果没有 card_id，返回一个唯一的键以跳过限制
    if (!cardId) {
      return `no-card-id-${Date.now()}-${Math.random()}`;
    }

    return `card:${cardId}`;
  },
  // 跳过条件：如果请求体中没有 card_id，跳过此限制器
  skip: (req) => {
    return !req.body?.card_id;
  },
  // 自定义处理器：添加 retry-after 信息
  handler: (req, res) => {
    const retryAfter = Math.ceil(
      req.rateLimit.resetTime / 1000 - Date.now() / 1000,
    );

    res.status(429).json({
      success: false,
      message: `该角色卡验证请求过于频繁，请在 ${retryAfter} 秒后重试`,
      error_code: "CARD_RATE_LIMIT_EXCEEDED",
      retry_after: retryAfter,
      card_id: req.body.card_id,
    });
  },
});

// ============================================================================
// 组合速率限制器
// ============================================================================

/**
 * 组合速率限制器：同时应用 IP 和 Card ID 限制
 *
 * 使用方式：
 * ```javascript
 * const { verifyRateLimiter } = require('./middleware/rateLimiter');
 * app.post('/api/verify', verifyRateLimiter, verifyHandler);
 * ```
 *
 * 工作原理：
 * 1. 首先检查 IP 级别限制（10次/分钟）
 * 2. 然后检查 Card ID 级别限制（5次/分钟）
 * 3. 任一限制器触发都会返回 429 状态码
 */
const verifyRateLimiter = [ipRateLimiter, cardIdRateLimiter];

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  ipRateLimiter,
  cardIdRateLimiter,
  verifyRateLimiter,
};

/**
 * 公开密码验证路由
 *
 * 功能：
 * - POST /api/verify - 验证角色卡密码（公开接口，无需认证）
 * - GET /api/cards/:card_id/version - 获取密码版本号（公开接口，无需认证）
 *
 * 验证需求：
 * - 需求 4：密码验证系统 - 验证用户输入的密码
 * - 需求 5：密码版本控制 - 检查密码版本是否匹配
 * - 需求 8：速率限制 - 防止暴力破解攻击
 * - 需求 14：输入验证 - 验证所有输入数据
 */

const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { verifyPassword } = require("../utils/crypto");
const { verifyRateLimiter } = require("../middleware/rateLimiter");
const { etagMiddleware } = require("../middleware/etag");
const {
  sanitizeAndNormalize,
  hasNoSQLInjection,
} = require("../utils/sanitize");
const { logPasswordVerification } = require("../utils/logger");

// ============================================================================
// 输入验证辅助函数
// ============================================================================

/**
 * 验证 Card ID 格式
 * @param {string} cardId - 角色卡 ID
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateCardId(cardId) {
  if (!cardId || typeof cardId !== "string") {
    return { valid: false, message: "card_id 不能为空" };
  }

  const trimmed = cardId.trim();

  // Card ID 必须是 6-8 位数字字符串
  if (!/^\d{6,8}$/.test(trimmed)) {
    return { valid: false, message: "card_id 必须是 6-8 位数字" };
  }

  return { valid: true };
}

/**
 * 验证密码格式
 * @param {string} password - 密码
 * @returns {Object} { valid: boolean, message?: string }
 */
function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "密码不能为空" };
  }

  if (password.length < 1 || password.length > 100) {
    return { valid: false, message: "密码长度必须在 1-100 个字符之间" };
  }

  return { valid: true };
}

// ============================================================================
// POST /api/verify - 验证角色卡密码
// ============================================================================

/**
 * 验证角色卡密码（公开接口）
 *
 * 需要认证：否
 *
 * 速率限制：
 * - IP 级别：10 次/分钟
 * - Card ID 级别：5 次/分钟
 *
 * 请求体：
 * {
 *   card_id: string (6-8 位数字),
 *   password: string (1-100 字符)
 * }
 *
 * 响应（成功）：
 * {
 *   success: true,
 *   password_version: 3
 * }
 *
 * 响应（失败）：
 * {
 *   success: false,
 *   message: "密码错误"
 * }
 *
 * 响应（速率限制）：
 * {
 *   success: false,
 *   message: "请求过于频繁，请在 X 秒后重试",
 *   error_code: "RATE_LIMIT_EXCEEDED",
 *   retry_after: 30
 * }
 *
 * 验证需求：
 * - 需求 4.2：验证请求包含 card_id 和 password
 * - 需求 4.3：查询数据库获取角色卡记录
 * - 需求 4.4：使用 bcrypt 验证密码
 * - 需求 4.5：密码正确时返回 success 和 password_version
 * - 需求 4.6：密码错误时返回失败响应
 * - 需求 4.7：card_id 不存在时返回失败响应
 * - 需求 8.1：限制每个 IP 地址每分钟 10 次请求
 * - 需求 8.2：限制每个 Card_ID 每分钟 5 次请求
 * - 需求 8.3：超过限制时返回 HTTP 429 状态码
 * - 需求 8.4：响应中包含 retry-after 信息
 */
router.post("/", verifyRateLimiter, async (req, res) => {
  try {
    const { card_id, password } = req.body;

    // ========================================================================
    // 步骤 1：输入验证
    // ========================================================================

    // 验证 card_id
    const cardIdValidation = validateCardId(card_id);
    if (!cardIdValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cardIdValidation.message,
      });
    }

    // 验证 password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // 标准化和清理输入（XSS 防护）
    const normalizedCardId = sanitizeAndNormalize(card_id);

    // NoSQL 注入检测
    if (hasNoSQLInjection(normalizedCardId)) {
      return res.status(400).json({
        success: false,
        message: "Card ID 包含非法字符",
      });
    }

    // ========================================================================
    // 步骤 2：查询数据库获取角色卡记录
    // ========================================================================

    const query = `
      SELECT 
        id,
        card_id,
        card_name,
        password_hash,
        password_version
      FROM character_cards
      WHERE card_id = ?
    `;

    const cards = await db.query(query, [normalizedCardId]);

    // 角色卡不存在
    if (cards.length === 0) {
      logPasswordVerification(
        normalizedCardId,
        false,
        req.ip,
        "Card ID 不存在",
      );
      return res.status(404).json({
        success: false,
        message: "角色卡不存在",
      });
    }

    const card = cards[0];

    // ========================================================================
    // 步骤 3：使用 bcrypt 验证密码
    // ========================================================================

    const isPasswordValid = await verifyPassword(password, card.password_hash);

    if (!isPasswordValid) {
      logPasswordVerification(normalizedCardId, false, req.ip, "密码错误");
      return res.status(401).json({
        success: false,
        message: "密码错误",
      });
    }

    // ========================================================================
    // 步骤 4：返回验证结果和密码版本号
    // ========================================================================

    logPasswordVerification(normalizedCardId, true, req.ip);

    res.status(200).json({
      success: true,
      password_version: card.password_version,
    });
  } catch (error) {
    console.error("密码验证失败:", error);

    // 返回通用错误信息（不暴露内部错误细节）
    res.status(500).json({
      success: false,
      message: "验证失败，请稍后重试",
    });
  }
});

// ============================================================================
// GET /api/cards/:card_id/version - 获取密码版本号
// ============================================================================

/**
 * 获取角色卡的密码版本号（公开接口）
 *
 * 需要认证：否
 *
 * 路径参数：
 * - card_id: 角色卡 ID (6-8 位数字)
 *
 * 响应（成功）：
 * {
 *   password_version: 3
 * }
 *
 * 响应（失败）：
 * {
 *   success: false,
 *   message: "角色卡不存在"
 * }
 *
 * 验证需求：
 * - 需求 5.2：查询数据库获取密码版本号
 * - 需求 5.3：返回版本号（不暴露敏感信息）
 */
router.get("/cards/:card_id/version", etagMiddleware, async (req, res) => {
  try {
    const { card_id } = req.params;

    // ========================================================================
    // 步骤 1：输入验证
    // ========================================================================

    const cardIdValidation = validateCardId(card_id);
    if (!cardIdValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cardIdValidation.message,
      });
    }

    // 标准化和清理输入（XSS 防护）
    const normalizedCardId = sanitizeAndNormalize(card_id);

    // NoSQL 注入检测
    if (hasNoSQLInjection(normalizedCardId)) {
      return res.status(400).json({
        success: false,
        message: "Card ID 包含非法字符",
      });
    }

    // ========================================================================
    // 步骤 2：查询数据库获取密码版本号
    // ========================================================================

    const query = `
      SELECT password_version
      FROM character_cards
      WHERE card_id = ?
    `;

    const cards = await db.query(query, [normalizedCardId]);

    // 角色卡不存在
    if (cards.length === 0) {
      const { logInfo } = require("../utils/logger");
      logInfo(`获取版本号失败: Card ID ${normalizedCardId} 不存在`);
      return res.status(404).json({
        success: false,
        message: "角色卡不存在",
      });
    }

    const card = cards[0];

    // ========================================================================
    // 步骤 3：返回版本号
    // ========================================================================

    const { logInfo } = require("../utils/logger");
    logInfo(`获取版本号成功: Card ID ${normalizedCardId}`, {
      card_id: normalizedCardId,
      password_version: card.password_version,
    });

    res.status(200).json({
      password_version: card.password_version,
    });
  } catch (error) {
    console.error("获取密码版本号失败:", error);

    // 返回通用错误信息
    res.status(500).json({
      success: false,
      message: "获取版本号失败，请稍后重试",
    });
  }
});

// ============================================================================
// 导出路由
// ============================================================================

module.exports = router;

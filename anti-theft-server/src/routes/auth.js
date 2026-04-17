/**
 * 认证路由模块
 *
 * 功能：
 * - 用户注册
 * - 用户登录
 * - 用户登出
 *
 * 验证需求：
 * - 需求 6：作者认证系统
 * - 需求 14：输入验证
 */

const express = require("express");
const { hashPassword } = require("../utils/crypto");
const { generateToken } = require("../utils/jwt");
const { query } = require("../db/connection");
const {
  sanitizeAndNormalize,
  hasNoSQLInjection,
} = require("../utils/sanitize");
const { logAuthAttempt, logError } = require("../utils/logger");

const router = express.Router();

// ============================================================================
// 输入验证辅助函数
// ============================================================================

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateUsername(username) {
  if (!username || typeof username !== "string") {
    return { valid: false, message: "用户名不能为空" };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3 || trimmed.length > 50) {
    return { valid: false, message: "用户名长度必须在 3-50 个字符之间" };
  }

  // 只允许字母、数字、下划线和连字符
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      message: "用户名只能包含字母、数字、下划线和连字符",
    };
  }

  return { valid: true };
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "邮箱不能为空" };
  }

  const trimmed = email.trim();

  if (trimmed.length > 100) {
    return { valid: false, message: "邮箱长度不能超过 100 个字符" };
  }

  // 基本的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: "邮箱格式不正确" };
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
// POST /api/auth/register - 用户注册
// ============================================================================

/**
 * 用户注册端点
 *
 * 验证需求：
 * - 需求 6.2：验证 username, email, password
 * - 需求 6.3：创建用户记录并使用 bcrypt 加密密码
 * - 需求 6.4：注册成功返回 JWT token
 * - 需求 14：输入验证
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ========================================================================
    // 步骤 1：输入验证和清理
    // ========================================================================

    // 验证用户名
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: usernameValidation.message,
      });
    }

    // 验证邮箱
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // 验证密码
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // 标准化和清理输入（XSS 防护）
    const normalizedUsername = sanitizeAndNormalize(username);
    const normalizedEmail = sanitizeAndNormalize(email).toLowerCase();

    // NoSQL 注入检测
    if (
      hasNoSQLInjection(normalizedUsername) ||
      hasNoSQLInjection(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "输入包含非法字符",
      });
    }

    // ========================================================================
    // 步骤 2：检查用户名唯一性
    // ========================================================================

    const existingUsername = await query(
      "SELECT id FROM users WHERE username = ?",
      [normalizedUsername],
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: "用户名已存在",
      });
    }

    // ========================================================================
    // 步骤 3：检查邮箱唯一性
    // ========================================================================

    const existingEmail = await query("SELECT id FROM users WHERE email = ?", [
      normalizedEmail,
    ]);

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: "邮箱已被注册",
      });
    }

    // ========================================================================
    // 步骤 4：加密密码
    // ========================================================================

    const passwordHash = await hashPassword(password);

    // ========================================================================
    // 步骤 5：保存到数据库
    // ========================================================================

    const result = await query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [normalizedUsername, normalizedEmail, passwordHash],
    );

    const userId = result.insertId;

    // ========================================================================
    // 步骤 6：生成 JWT token
    // ========================================================================

    const token = generateToken(userId, normalizedUsername);

    // ========================================================================
    // 步骤 7：返回成功响应
    // ========================================================================

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        username: normalizedUsername,
        email: normalizedEmail,
      },
    });

    logAuthAttempt("register", normalizedUsername, true);
  } catch (error) {
    logError("用户注册失败", error);

    // 数据库错误
    if (error.code === "ER_DUP_ENTRY") {
      logAuthAttempt(
        "register",
        normalizedUsername || "unknown",
        false,
        "用户名或邮箱已存在",
      );
      return res.status(400).json({
        success: false,
        message: "用户名或邮箱已存在",
      });
    }

    // 其他错误
    res.status(500).json({
      success: false,
      message: "注册失败，请稍后重试",
    });
  }
});

// ============================================================================
// POST /api/auth/login - 用户登录
// ============================================================================

/**
 * 用户登录端点
 *
 * 验证需求：
 * - 需求 6.5：Web 界面提供登录功能
 * - 需求 6.6：验证用户名和密码
 * - 需求 6.7：登录成功返回 JWT token
 * - 需求 6.8：JWT token 有效期 7 天
 * - 需求 14：输入验证
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // ========================================================================
    // 步骤 1：输入验证和清理
    // ========================================================================

    // 验证用户名
    if (!username || typeof username !== "string") {
      return res.status(400).json({
        success: false,
        message: "用户名不能为空",
      });
    }

    // 验证密码
    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "密码不能为空",
      });
    }

    // 标准化和清理输入（XSS 防护）
    const normalizedUsername = sanitizeAndNormalize(username);

    // NoSQL 注入检测
    if (hasNoSQLInjection(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: "输入包含非法字符",
      });
    }

    // ========================================================================
    // 步骤 2：查询用户
    // ========================================================================

    const users = await query(
      "SELECT id, username, email, password_hash FROM users WHERE username = ?",
      [normalizedUsername],
    );

    // 用户不存在
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
      });
    }

    const user = users[0];

    // ========================================================================
    // 步骤 3：验证密码
    // ========================================================================

    const { verifyPassword } = require("../utils/crypto");
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
      });
    }

    // ========================================================================
    // 步骤 4：生成 JWT token（7天有效期）
    // ========================================================================

    const token = generateToken(user.id, user.username);

    // ========================================================================
    // 步骤 5：返回成功响应
    // ========================================================================

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

    logAuthAttempt("login", user.username, true);
  } catch (error) {
    logError("用户登录失败", error);

    // 返回通用错误信息
    res.status(500).json({
      success: false,
      message: "登录失败，请稍后重试",
    });
  }
});

// ============================================================================
// 导出路由
// ============================================================================

module.exports = router;

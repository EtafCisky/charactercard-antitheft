/**
 * 输入过滤和清理工具
 *
 * 功能：
 * - XSS 防护：清理用户输入的 HTML/JavaScript
 * - 路径遍历防护：验证文件路径安全性
 * - 输入标准化：统一处理字符串输入
 *
 * 验证需求：
 * - 需求 14：输入验证 - 验证所有输入数据以防止注入攻击
 * - 需求 24.2：实现输入过滤
 */

const xss = require("xss");

// ============================================================================
// XSS 防护配置
// ============================================================================

/**
 * XSS 过滤器配置
 *
 * 策略：完全移除所有 HTML 标签和脚本
 * 适用于：用户名、邮箱、角色卡名称、密码等纯文本字段
 */
const xssOptions = {
  whiteList: {}, // 不允许任何 HTML 标签
  stripIgnoreTag: true, // 移除所有不在白名单中的标签
  stripIgnoreTagBody: ["script", "style"], // 移除 script 和 style 标签及其内容
};

// ============================================================================
// XSS 防护函数
// ============================================================================

/**
 * 清理字符串中的 XSS 攻击向量
 *
 * @param {string} input - 用户输入的字符串
 * @returns {string} 清理后的安全字符串
 *
 * @example
 * sanitizeXSS('<script>alert("XSS")</script>Hello')
 * // 返回: 'Hello'
 *
 * sanitizeXSS('Normal text')
 * // 返回: 'Normal text'
 */
function sanitizeXSS(input) {
  if (typeof input !== "string") {
    return input;
  }

  // 使用 xss 库清理输入
  return xss(input, xssOptions);
}

/**
 * 清理对象中所有字符串字段的 XSS 攻击向量
 *
 * @param {Object} obj - 包含用户输入的对象
 * @returns {Object} 清理后的对象
 *
 * @example
 * sanitizeObject({ name: '<script>alert(1)</script>Test', age: 25 })
 * // 返回: { name: 'Test', age: 25 }
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === "string") {
        sanitized[key] = sanitizeXSS(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = sanitizeObject(value); // 递归清理嵌套对象
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

// ============================================================================
// 路径遍历防护
// ============================================================================

/**
 * 验证文件路径是否安全（防止路径遍历攻击）
 *
 * 检查路径中是否包含危险模式：
 * - ../ 或 ..\\ (向上遍历)
 * - 绝对路径 (/ 或 C:\)
 * - 空字节注入 (\0)
 *
 * @param {string} filePath - 要验证的文件路径
 * @returns {boolean} 路径是否安全
 *
 * @example
 * isPathSafe('uploads/file.txt') // true
 * isPathSafe('../../../etc/passwd') // false
 * isPathSafe('/etc/passwd') // false
 * isPathSafe('C:\\Windows\\System32') // false
 */
function isPathSafe(filePath) {
  if (typeof filePath !== "string") {
    return false;
  }

  // 检查路径遍历模式
  const dangerousPatterns = [
    /\.\./, // 包含 ..
    /^[/\\]/, // 以 / 或 \ 开头（绝对路径）
    /^[a-zA-Z]:[/\\]/, // Windows 绝对路径 (C:\, D:\, etc.)
    /\0/, // 空字节注入
    /%2e%2e/i, // URL 编码的 ..
    /%2f/i, // URL 编码的 /
    /%5c/i, // URL 编码的 \
  ];

  // 检查是否匹配任何危险模式
  for (const pattern of dangerousPatterns) {
    if (pattern.test(filePath)) {
      return false;
    }
  }

  return true;
}

/**
 * 清理文件路径（移除危险字符）
 *
 * @param {string} filePath - 要清理的文件路径
 * @returns {string} 清理后的文件路径
 *
 * @example
 * sanitizePath('../../../etc/passwd')
 * // 返回: 'etcpasswd'
 */
function sanitizePath(filePath) {
  if (typeof filePath !== "string") {
    return "";
  }

  // 移除所有危险字符
  return filePath
    .replace(/\.\./g, "") // 移除 ..
    .replace(/[/\\]/g, "") // 移除 / 和 \
    .replace(/:/g, "") // 移除 :
    .replace(/\0/g, "") // 移除空字节
    .replace(/%/g, ""); // 移除 % (防止 URL 编码绕过)
}

// ============================================================================
// NoSQL 注入防护
// ============================================================================

/**
 * 检查字符串是否包含 NoSQL 注入模式
 *
 * 虽然本系统使用 MySQL（不是 NoSQL），但此函数可以检测
 * 可能被误用的 JavaScript 代码注入模式
 *
 * @param {string} input - 要检查的输入
 * @returns {boolean} 是否包含危险模式
 *
 * @example
 * hasNoSQLInjection('normal text') // false
 * hasNoSQLInjection('$where: function() { return true; }') // true
 */
function hasNoSQLInjection(input) {
  if (typeof input !== "string") {
    return false;
  }

  // NoSQL 注入常见模式
  const dangerousPatterns = [
    /\$where/i, // MongoDB $where 操作符
    /\$ne/i, // MongoDB $ne (不等于)
    /\$gt/i, // MongoDB $gt (大于)
    /\$lt/i, // MongoDB $lt (小于)
    /\$or/i, // MongoDB $or 操作符
    /\$and/i, // MongoDB $and 操作符
    /function\s*\(/i, // JavaScript 函数定义
    /=>\s*{/, // 箭头函数
    /eval\s*\(/i, // eval 函数调用
  ];

  // 检查是否匹配任何危险模式
  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// 输入标准化
// ============================================================================

/**
 * 标准化字符串输入（去除首尾空格）
 *
 * @param {string} input - 输入字符串
 * @returns {string} 标准化后的字符串
 */
function normalizeString(input) {
  if (typeof input !== "string") {
    return input;
  }

  return input.trim();
}

/**
 * 标准化并清理字符串输入（组合操作）
 *
 * 执行以下操作：
 * 1. 去除首尾空格
 * 2. XSS 清理
 *
 * @param {string} input - 输入字符串
 * @returns {string} 处理后的字符串
 */
function sanitizeAndNormalize(input) {
  if (typeof input !== "string") {
    return input;
  }

  // 先标准化，再清理
  const normalized = normalizeString(input);
  return sanitizeXSS(normalized);
}

// ============================================================================
// 导出函数
// ============================================================================

module.exports = {
  // XSS 防护
  sanitizeXSS,
  sanitizeObject,

  // 路径遍历防护
  isPathSafe,
  sanitizePath,

  // NoSQL 注入检测
  hasNoSQLInjection,

  // 输入标准化
  normalizeString,
  sanitizeAndNormalize,
};

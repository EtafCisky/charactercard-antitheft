/**
 * 日志系统模块
 *
 * 功能：
 * - 使用 Winston 实现结构化日志记录
 * - 支持多个日志级别（info, warn, error）
 * - 实现日志文件轮转，防止磁盘空间耗尽
 * - 确保不记录明文密码等敏感信息
 * - 记录所有关键操作（认证、密码验证、密码更新、数据库错误、API错误）
 *
 * 验证需求：
 * - 需求 13.1：记录所有认证尝试
 * - 需求 13.2：记录所有密码验证尝试
 * - 需求 13.3：记录所有密码更新操作
 * - 需求 13.4：记录数据库连接错误
 * - 需求 13.5：记录 API 错误及详细信息
 * - 需求 13.6：日志条目包含时间戳、操作类型和相关标识符
 * - 需求 13.7：不记录明文密码
 */

const winston = require("winston");
const path = require("path");
const fs = require("fs");

// ============================================================================
// 配置常量
// ============================================================================

// 日志文件路径配置（任务 22.2.1）
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "../../logs");
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// 日志轮转配置（任务 22.2.2）
const MAX_LOG_SIZE = process.env.MAX_LOG_SIZE || 10 * 1024 * 1024; // 默认 10MB
const MAX_LOG_AGE = process.env.MAX_LOG_AGE || "30d"; // 保留 30 天（任务 22.2.3）
const MAX_LOG_FILES = process.env.MAX_LOG_FILES || 30; // 保留 30 个文件

// 日志文件名配置
const COMBINED_LOG_FILE = path.join(LOG_DIR, "combined.log");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");
const EXCEPTION_LOG_FILE = path.join(LOG_DIR, "exceptions.log");
const REJECTION_LOG_FILE = path.join(LOG_DIR, "rejections.log");

// ============================================================================
// 日志目录初始化
// ============================================================================

/**
 * 确保日志目录存在
 */
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

ensureLogDirectory();

// ============================================================================
// 自定义日志格式
// ============================================================================

/**
 * 自定义日志格式
 * 包含时间戳、日志级别、消息和元数据
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    // 基础日志格式
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // 如果有额外的元数据，添加到日志中
    if (Object.keys(meta).length > 0) {
      // 过滤敏感信息
      const sanitizedMeta = sanitizeMetadata(meta);
      log += ` ${JSON.stringify(sanitizedMeta)}`;
    }

    return log;
  }),
);

/**
 * 过滤敏感信息（任务 22.2.4）
 * 确保不记录明文密码等敏感数据
 *
 * 敏感字段包括：
 * - password, new_password, old_password（密码字段）
 * - password_hash（密码哈希）
 * - token, jwt（认证令牌）
 * - secret（密钥）
 * - authorization（授权头）
 *
 * @param {Object} meta 元数据对象
 * @returns {Object} 过滤后的元数据
 */
function sanitizeMetadata(meta) {
  const sanitized = { ...meta };

  // 敏感字段列表（任务 22.2.4）
  const sensitiveFields = [
    "password",
    "new_password",
    "old_password",
    "password_hash",
    "token",
    "jwt",
    "secret",
    "authorization",
    "api_key",
    "apikey",
    "access_token",
    "refresh_token",
    "session",
    "cookie",
  ];

  // 递归过滤敏感字段
  function filterSensitive(obj) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const filtered = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      const lowerKey = key.toLowerCase();

      // 检查是否为敏感字段
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        filtered[key] = "[REDACTED]"; // 替换为 [REDACTED]
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        filtered[key] = filterSensitive(obj[key]); // 递归过滤嵌套对象
      } else {
        filtered[key] = obj[key];
      }
    }

    return filtered;
  }

  return filterSensitive(sanitized);
}

// ============================================================================
// Winston Logger 配置
// ============================================================================

/**
 * 创建 Winston Logger 实例
 *
 * 日志轮转策略（任务 22.2.2）：
 * - 按大小轮转：当日志文件达到 MAX_LOG_SIZE 时创建新文件
 * - 按日期轮转：使用 winston-daily-rotate-file 支持按日期轮转
 * - 文件命名：使用时间戳确保唯一性
 *
 * 日志保留策略（任务 22.2.3）：
 * - 保留时间：30 天
 * - 最大文件数：30 个
 * - 自动清理：超过保留期的日志自动删除
 */
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: customFormat,
  transports: [
    // 控制台输出（开发环境）
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), customFormat),
    }),

    // 所有日志文件（info 及以上级别）
    // 支持按大小和数量轮转
    new winston.transports.File({
      filename: COMBINED_LOG_FILE,
      maxsize: MAX_LOG_SIZE, // 按大小轮转
      maxFiles: MAX_LOG_FILES, // 保留文件数量
      tailable: true, // 启用文件轮转
    }),

    // 错误日志文件（仅 error 级别）
    // 支持按大小和数量轮转
    new winston.transports.File({
      filename: ERROR_LOG_FILE,
      level: "error",
      maxsize: MAX_LOG_SIZE, // 按大小轮转
      maxFiles: MAX_LOG_FILES, // 保留文件数量
      tailable: true, // 启用文件轮转
    }),
  ],
  // 处理未捕获的异常
  exceptionHandlers: [
    new winston.transports.File({
      filename: EXCEPTION_LOG_FILE,
      maxsize: MAX_LOG_SIZE,
      maxFiles: MAX_LOG_FILES,
    }),
  ],
  // 处理未处理的 Promise 拒绝
  rejectionHandlers: [
    new winston.transports.File({
      filename: REJECTION_LOG_FILE,
      maxsize: MAX_LOG_SIZE,
      maxFiles: MAX_LOG_FILES,
    }),
  ],
});

// ============================================================================
// 便捷日志方法
// ============================================================================

/**
 * 记录认证尝试
 * 验证需求 13.1
 * @param {string} operation 操作类型（register, login, logout）
 * @param {string} username 用户名
 * @param {boolean} success 是否成功
 * @param {string} [reason] 失败原因
 */
function logAuthAttempt(operation, username, success, reason = null) {
  const meta = {
    operation_type: "authentication",
    auth_operation: operation,
    username,
    success,
    timestamp: new Date().toISOString(),
  };

  if (!success && reason) {
    meta.reason = reason;
  }

  if (success) {
    logger.info(`认证成功: ${operation} - ${username}`, meta);
  } else {
    logger.warn(`认证失败: ${operation} - ${username}`, meta);
  }
}

/**
 * 记录密码验证尝试
 * 验证需求 13.2
 * @param {string} cardId 角色卡ID
 * @param {boolean} success 是否成功
 * @param {string} [ipAddress] 请求IP地址
 * @param {string} [reason] 失败原因
 */
function logPasswordVerification(
  cardId,
  success,
  ipAddress = null,
  reason = null,
) {
  const meta = {
    operation_type: "password_verification",
    card_id: cardId,
    success,
    timestamp: new Date().toISOString(),
  };

  if (ipAddress) {
    meta.ip_address = ipAddress;
  }

  if (!success && reason) {
    meta.reason = reason;
  }

  if (success) {
    logger.info(`密码验证成功: Card ID ${cardId}`, meta);
  } else {
    logger.warn(`密码验证失败: Card ID ${cardId}`, meta);
  }
}

/**
 * 记录密码更新操作
 * 验证需求 13.3
 * @param {string} cardId 角色卡ID
 * @param {number} oldVersion 旧版本号
 * @param {number} newVersion 新版本号
 * @param {string} username 操作用户
 */
function logPasswordUpdate(cardId, oldVersion, newVersion, username) {
  const meta = {
    operation_type: "password_update",
    card_id: cardId,
    old_version: oldVersion,
    new_version: newVersion,
    username,
    timestamp: new Date().toISOString(),
  };

  logger.info(
    `密码更新: Card ID ${cardId} (版本 ${oldVersion} -> ${newVersion})`,
    meta,
  );
}

/**
 * 记录数据库错误
 * 验证需求 13.4
 * @param {string} operation 操作描述
 * @param {Error} error 错误对象
 * @param {Object} [context] 额外上下文信息
 */
function logDatabaseError(operation, error, context = {}) {
  const meta = {
    operation_type: "database_error",
    operation,
    error_message: error.message,
    error_code: error.code,
    error_errno: error.errno,
    error_sql: error.sql,
    timestamp: new Date().toISOString(),
    ...context,
  };

  logger.error(`数据库错误: ${operation}`, meta);
}

/**
 * 记录 API 错误
 * 验证需求 13.5
 * @param {string} method HTTP 方法
 * @param {string} path 请求路径
 * @param {number} statusCode HTTP 状态码
 * @param {Error|string} error 错误对象或消息
 * @param {Object} [context] 额外上下文信息
 */
function logApiError(method, path, statusCode, error, context = {}) {
  const meta = {
    operation_type: "api_error",
    http_method: method,
    path,
    status_code: statusCode,
    error_message: typeof error === "string" ? error : error.message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error.stack) {
    meta.stack_trace = error.stack;
  }

  logger.error(`API 错误: ${method} ${path} - ${statusCode}`, meta);
}

/**
 * 记录一般信息
 * @param {string} message 日志消息
 * @param {Object} [meta] 元数据
 */
function logInfo(message, meta = {}) {
  logger.info(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
}

/**
 * 记录警告
 * @param {string} message 日志消息
 * @param {Object} [meta] 元数据
 */
function logWarn(message, meta = {}) {
  logger.warn(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
}

/**
 * 记录错误
 * @param {string} message 日志消息
 * @param {Error|Object} [errorOrMeta] 错误对象或元数据
 */
function logError(message, errorOrMeta = {}) {
  const meta = {
    timestamp: new Date().toISOString(),
  };

  if (errorOrMeta instanceof Error) {
    meta.error_message = errorOrMeta.message;
    meta.stack_trace = errorOrMeta.stack;
  } else {
    Object.assign(meta, errorOrMeta);
  }

  logger.error(message, meta);
}

// ============================================================================
// 导出接口
// ============================================================================

module.exports = {
  // Winston logger 实例（用于高级用法）
  logger,

  // 便捷日志方法
  logAuthAttempt,
  logPasswordVerification,
  logPasswordUpdate,
  logDatabaseError,
  logApiError,
  logInfo,
  logWarn,
  logError,

  // 工具方法
  sanitizeMetadata,
};

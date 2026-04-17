/**
 * 统一错误处理中间件
 *
 * 功能：
 * - 捕获所有未处理的错误
 * - 返回统一的错误响应格式
 * - 记录错误日志（不包含敏感信息）
 * - 根据错误类型返回适当的 HTTP 状态码
 *
 * 验证需求：需求 9（错误处理）、需求 13（日志记录）
 */

/**
 * 检查字符串是否包含敏感信息
 * @param {string} str - 要检查的字符串
 * @returns {boolean} - 是否包含敏感信息
 */
function containsSensitiveInfo(str) {
  if (!str || typeof str !== "string") {
    return false;
  }

  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /api[_-]?key/i,
    /auth/i,
    /credential/i,
    /bearer/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(str));
}

/**
 * 清理对象中的敏感信息
 * @param {Object} obj - 要清理的对象
 * @returns {Object} - 清理后的对象
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    // 如果键名包含敏感词，替换值
    if (containsSensitiveInfo(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      // 递归清理嵌套对象
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * 记录错误日志
 * @param {Error} error - 错误对象
 * @param {Object} req - Express request 对象
 */
function logError(error, req) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;

  // 构建日志对象
  const logEntry = {
    timestamp,
    level: "ERROR",
    message: error.message,
    type: error.name || "Error",
    method,
    path,
    ip,
    statusCode: error.statusCode || error.status || 500,
  };

  // 添加用户信息（如果存在且不敏感）
  if (req.user && req.user.userId) {
    logEntry.userId = req.user.userId;
    logEntry.username = req.user.username;
  }

  // 添加错误堆栈（仅在开发环境）
  if (process.env.NODE_ENV !== "production" && error.stack) {
    logEntry.stack = error.stack;
  }

  // 添加请求体（清理敏感信息）
  if (req.body && Object.keys(req.body).length > 0) {
    logEntry.requestBody = sanitizeObject(req.body);
  }

  // 添加查询参数
  if (req.query && Object.keys(req.query).length > 0) {
    logEntry.queryParams = req.query;
  }

  // 输出日志
  console.error("API Error:", JSON.stringify(logEntry, null, 2));
}

/**
 * 确定错误的 HTTP 状态码
 * @param {Error} error - 错误对象
 * @returns {number} - HTTP 状态码
 */
function getStatusCode(error) {
  // 如果错误对象已经有状态码
  if (error.statusCode) {
    return error.statusCode;
  }

  if (error.status) {
    return error.status;
  }

  // 根据错误类型确定状态码
  if (error.name === "ValidationError") {
    return 400;
  }

  if (error.name === "UnauthorizedError" || error.message.includes("认证")) {
    return 401;
  }

  if (error.name === "ForbiddenError" || error.message.includes("权限")) {
    return 403;
  }

  if (error.name === "NotFoundError" || error.message.includes("不存在")) {
    return 404;
  }

  if (error.name === "ConflictError" || error.message.includes("已存在")) {
    return 409;
  }

  if (error.name === "TooManyRequestsError" || error.message.includes("频繁")) {
    return 429;
  }

  // 数据库错误
  if (error.code && error.code.startsWith("ER_")) {
    return 500;
  }

  // 默认服务器错误
  return 500;
}

/**
 * 获取用户友好的错误消息
 * @param {Error} error - 错误对象
 * @param {number} statusCode - HTTP 状态码
 * @returns {string} - 错误消息
 */
function getUserMessage(error, statusCode) {
  // 在生产环境中，对于 5xx 错误返回通用消息
  if (process.env.NODE_ENV === "production" && statusCode >= 500) {
    // 数据库连接错误
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "PROTOCOL_CONNECTION_LOST"
    ) {
      return "服务器内部错误，请稍后重试";
    }

    // 其他服务器错误
    return "服务器内部错误";
  }

  // 开发环境或客户端错误，返回详细消息
  return error.message || "未知错误";
}

/**
 * 统一错误处理中间件
 *
 * 这个中间件应该是最后一个中间件，用于捕获所有未处理的错误
 *
 * @param {Error} err - 错误对象
 * @param {Object} req - Express request 对象
 * @param {Object} res - Express response 对象
 * @param {Function} next - Express next 函数
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logError(err, req);

  // 确定 HTTP 状态码
  const statusCode = getStatusCode(err);

  // 获取用户友好的错误消息
  const message = getUserMessage(err, statusCode);

  // 构建错误响应
  const errorResponse = {
    success: false,
    message,
  };

  // 在开发环境中添加额外的调试信息
  if (process.env.NODE_ENV !== "production") {
    errorResponse.error = {
      type: err.name,
      code: err.code,
      statusCode,
    };

    // 添加堆栈跟踪（仅开发环境）
    if (err.stack) {
      errorResponse.stack = err.stack;
    }
  }

  // 发送错误响应
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 错误处理中间件
 * 处理未找到的路由
 *
 * @param {Object} req - Express request 对象
 * @param {Object} res - Express response 对象
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "请求的资源不存在",
    path: req.path,
  });
}

/**
 * 异步路由错误包装器
 * 用于包装异步路由处理函数，自动捕获 Promise 拒绝
 *
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} - 包装后的函数
 *
 * @example
 * app.get('/api/cards', asyncHandler(async (req, res) => {
 *   const cards = await db.query('SELECT * FROM cards');
 *   res.json({ success: true, cards });
 * }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  // 导出辅助函数供测试使用
  sanitizeObject,
  containsSensitiveInfo,
  getStatusCode,
  getUserMessage,
};

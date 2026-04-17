/**
 * 认证中间件
 * 验证 JWT token 并保护需要认证的 API 端点
 */

const { verifyTokenSync } = require("../utils/jwt");

/**
 * 认证中间件 - 验证 JWT token
 * 从 Authorization header 中提取并验证 token
 * 成功后将用户信息附加到 req.user
 *
 * @param {Object} req - Express request 对象
 * @param {Object} res - Express response 对象
 * @param {Function} next - Express next 函数
 */
function authenticateToken(req, res, next) {
  // 获取 Authorization header
  const authHeader = req.headers["authorization"];

  // 检查 header 是否存在
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "未提供认证令牌",
    });
  }

  // 提取 token (格式: "Bearer <token>")
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  // 检查 token 是否存在
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "认证令牌格式错误",
    });
  }

  try {
    // 验证 token
    const decoded = verifyTokenSync(token);

    // 将用户信息附加到 request 对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    // 继续处理请求
    next();
  } catch (error) {
    // Token 无效或过期
    return res.status(403).json({
      success: false,
      message: "认证令牌无效或已过期",
    });
  }
}

module.exports = {
  authenticateToken,
};

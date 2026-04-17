/**
 * JWT 认证模块
 * 提供 JWT token 的生成和验证功能
 */

const jwt = require("jsonwebtoken");

/**
 * 生成 JWT token
 * @param {number} userId - 用户ID
 * @param {string} username - 用户名
 * @returns {string} JWT token
 */
function generateToken(userId, username) {
  const payload = {
    userId,
    username,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token 有效期 7 天
  });
}

/**
 * 验证 JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 解析后的 token payload
 * @throws {Error} 当 token 无效或过期时抛出错误
 */
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

/**
 * 验证 JWT token (同步版本)
 * @param {string} token - JWT token
 * @returns {Object} 解析后的 token payload
 * @throws {Error} 当 token 无效或过期时抛出错误
 */
function verifyTokenSync(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken,
  verifyTokenSync,
};

/**
 * 密码生成工具模块
 *
 * 功能：
 * - 生成安全的随机密码
 * - 支持自定义长度和字符集
 * - 默认生成16字符混合大小写、数字、符号的密码
 *
 * 验证需求：
 * - 需求 6：密码管理 - 提供随机密码生成功能
 */

/**
 * 生成随机密码
 * @param {Object} options - 密码生成选项
 * @param {number} options.length - 密码长度（默认16）
 * @param {boolean} options.includeSymbols - 是否包含符号（默认true）
 * @returns {string} 生成的随机密码
 */
function generateRandomPassword(options = {}) {
  const { length = 16, includeSymbols = true } = options;

  // 验证长度参数
  if (typeof length !== "number" || length < 8 || length > 100) {
    throw new Error("密码长度必须在 8-100 之间");
  }

  // 定义字符集
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // 构建字符池
  let charPool = uppercase + lowercase + numbers;
  if (includeSymbols) {
    charPool += symbols;
  }

  // 确保密码至少包含每种类型的字符
  let password = "";

  // 添加至少一个大写字母
  password += uppercase[Math.floor(Math.random() * uppercase.length)];

  // 添加至少一个小写字母
  password += lowercase[Math.floor(Math.random() * lowercase.length)];

  // 添加至少一个数字
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // 如果包含符号，添加至少一个符号
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }

  // 填充剩余长度
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += charPool[Math.floor(Math.random() * charPool.length)];
  }

  // 打乱密码字符顺序（Fisher-Yates shuffle）
  const passwordArray = password.split("");
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join("");
}

module.exports = {
  generateRandomPassword,
};

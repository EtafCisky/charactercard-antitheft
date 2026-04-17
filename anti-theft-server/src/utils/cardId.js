/**
 * Card ID 生成模块
 *
 * 功能：
 * - 生成 6-8 位随机数字 Card ID
 * - 确保 Card ID 不以 0 开头
 * - 确保 Card ID 在数据库中唯一
 * - 支持重试机制（最多 10 次尝试）
 *
 * 验证需求：
 * - 需求 5：角色卡管理 - Card ID 为 6-8 位数字字符串，不以 0 开头
 * - 需求 5：角色卡管理 - 生成 Card ID 时确保数据库唯一性
 */

const db = require("../db/connection");

// ============================================================================
// 配置常量
// ============================================================================

const MIN_LENGTH = 6;
const MAX_LENGTH = 8;
const MAX_ATTEMPTS = 10;

// ============================================================================
// Card ID 生成函数
// ============================================================================

/**
 * 生成随机 Card ID（6-8 位数字）
 *
 * 算法：
 * 1. 随机选择长度（6、7 或 8）
 * 2. 生成对应长度的随机数字字符串
 * 3. 确保第一位不为 0
 *
 * @returns {string} 6-8 位数字字符串，不以 0 开头
 *
 * 示例：
 * - "123456" (6位)
 * - "9876543" (7位)
 * - "12345678" (8位)
 */
function generateCardId() {
  // 随机选择长度：6、7 或 8
  const length =
    Math.floor(Math.random() * (MAX_LENGTH - MIN_LENGTH + 1)) + MIN_LENGTH;

  let cardId = "";

  // 生成随机数字字符串
  for (let i = 0; i < length; i++) {
    cardId += Math.floor(Math.random() * 10).toString();
  }

  // 确保不以 0 开头
  if (cardId[0] === "0") {
    // 将第一位替换为 1-9 的随机数字
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    cardId = firstDigit.toString() + cardId.slice(1);
  }

  return cardId;
}

/**
 * 检查 Card ID 是否已存在于数据库
 *
 * @param {string} cardId - 要检查的 Card ID
 * @returns {Promise<boolean>} true 表示已存在，false 表示不存在
 */
async function cardIdExists(cardId) {
  try {
    const result = await db.query(
      "SELECT 1 FROM character_cards WHERE card_id = ? LIMIT 1",
      [cardId],
    );

    return result.length > 0;
  } catch (error) {
    console.error("检查 Card ID 是否存在时出错:", error.message);
    throw error;
  }
}

/**
 * 生成唯一的 Card ID
 *
 * 算法：
 * 1. 调用 generateCardId() 生成候选 ID
 * 2. 查询数据库检查是否已存在
 * 3. 如果不存在，返回该 ID
 * 4. 如果存在，重试（最多 10 次）
 * 5. 如果 10 次都失败，抛出错误
 *
 * @returns {Promise<string>} 唯一的 Card ID
 * @throws {Error} 如果无法生成唯一 ID（10 次尝试后）
 *
 * 示例使用：
 * ```javascript
 * const cardId = await generateUniqueCardId();
 * console.log(cardId); // "1234567"
 * ```
 */
async function generateUniqueCardId() {
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;

    // 生成候选 Card ID
    const cardId = generateCardId();

    // 检查是否已存在
    const exists = await cardIdExists(cardId);

    if (!exists) {
      // 找到唯一 ID，返回
      console.log(
        `✅ 生成唯一 Card ID: ${cardId} (尝试 ${attempts}/${MAX_ATTEMPTS})`,
      );
      return cardId;
    }

    // ID 已存在，记录日志并继续尝试
    console.log(
      `⚠️  Card ID ${cardId} 已存在，重新生成... (尝试 ${attempts}/${MAX_ATTEMPTS})`,
    );
  }

  // 所有尝试都失败
  const errorMsg = `无法生成唯一的 Card ID（已尝试 ${MAX_ATTEMPTS} 次）`;
  console.error(`❌ ${errorMsg}`);
  throw new Error(errorMsg);
}

/**
 * 验证 Card ID 格式
 *
 * 验证规则：
 * - 必须是字符串
 * - 长度为 6-8 位
 * - 只包含数字
 * - 不以 0 开头
 *
 * @param {string} cardId - 要验证的 Card ID
 * @returns {boolean} true 表示格式有效，false 表示无效
 *
 * 示例：
 * ```javascript
 * validateCardIdFormat("123456");   // true
 * validateCardIdFormat("0123456");  // false (以 0 开头)
 * validateCardIdFormat("12345");    // false (太短)
 * validateCardIdFormat("123456789"); // false (太长)
 * validateCardIdFormat("12a456");   // false (包含非数字)
 * ```
 */
function validateCardIdFormat(cardId) {
  // 检查是否为字符串
  if (typeof cardId !== "string") {
    return false;
  }

  // 检查长度
  if (cardId.length < MIN_LENGTH || cardId.length > MAX_LENGTH) {
    return false;
  }

  // 检查是否只包含数字
  if (!/^\d+$/.test(cardId)) {
    return false;
  }

  // 检查是否以 0 开头
  if (cardId[0] === "0") {
    return false;
  }

  return true;
}

// ============================================================================
// 导出接口
// ============================================================================

module.exports = {
  // 主要功能
  generateCardId,
  generateUniqueCardId,

  // 辅助功能
  cardIdExists,
  validateCardIdFormat,

  // 常量（用于测试）
  MIN_LENGTH,
  MAX_LENGTH,
  MAX_ATTEMPTS,
};

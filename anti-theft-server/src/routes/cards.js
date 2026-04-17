/**
 * 角色卡管理路由
 *
 * 功能：
 * - GET /api/cards - 获取当前用户的所有角色卡列表
 * - POST /api/cards - 创建新的角色卡记录
 * - PUT /api/cards/:id - 更新角色卡信息
 * - DELETE /api/cards/:id - 删除角色卡记录
 * - PUT /api/cards/:id/password - 更新角色卡密码
 * - POST /api/cards/:id/password/random - 生成随机密码
 *
 * 验证需求：
 * - 需求 5：角色卡管理 - 创建、查看、更新、删除角色卡记录
 * - 需求 6：密码管理 - 设置和更新角色卡密码
 */

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { etagMiddleware } = require("../middleware/etag");
const db = require("../db/connection");
const { generateUniqueCardId } = require("../utils/cardId");
const { hashPassword } = require("../utils/crypto");
const { generateRandomPassword } = require("../utils/passwordGenerator");
const {
  sanitizeAndNormalize,
  hasNoSQLInjection,
} = require("../utils/sanitize");
const { logInfo, logPasswordUpdate, logError } = require("../utils/logger");

// ============================================================================
// 输入验证辅助函数
// ============================================================================

/**
 * 验证角色卡名称格式
 * @param {string} cardName - 角色卡名称
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateCardName(cardName) {
  if (!cardName || typeof cardName !== "string") {
    return { valid: false, message: "角色卡名称不能为空" };
  }

  const trimmed = cardName.trim();

  if (trimmed.length < 1 || trimmed.length > 100) {
    return { valid: false, message: "角色卡名称长度必须在 1-100 个字符之间" };
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
// 5.1 获取角色卡列表
// ============================================================================

/**
 * GET /api/cards
 * 获取当前用户的所有角色卡列表
 *
 * 需要认证：是
 *
 * 查询参数（可选）：
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 10，最大 100）
 * - fields: 返回的字段列表，逗号分隔（例如：id,card_id,card_name）
 *
 * 响应：
 * {
 *   success: true,
 *   cards: [...],
 *   pagination: {
 *     page: 1,
 *     limit: 10,
 *     total: 25,
 *     totalPages: 3
 *   }
 * }
 */
router.get("/", authenticateToken, etagMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 解析分页参数
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    // ========================================================================
    // 字段选择功能
    // ========================================================================

    // 定义允许的字段列表
    const allowedFields = [
      "id",
      "card_id",
      "card_name",
      "password_version",
      "created_at",
      "updated_at",
    ];

    // 解析 fields 参数
    let selectedFields = allowedFields; // 默认返回所有字段

    if (req.query.fields) {
      const requestedFields = req.query.fields
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      // 过滤出有效的字段
      selectedFields = requestedFields.filter((field) =>
        allowedFields.includes(field),
      );

      // 如果没有有效字段，使用默认字段
      if (selectedFields.length === 0) {
        selectedFields = allowedFields;
      }
    }

    // 构建 SELECT 子句
    const selectClause = selectedFields.join(", ");

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM character_cards
      WHERE user_id = ?
    `;
    const [countResult] = await db.query(countQuery, [userId]);
    const total = countResult.total;

    // 查询角色卡列表（带分页和字段选择）
    const cardsQuery = `
      SELECT ${selectClause}
      FROM character_cards
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const cards = await db.query(cardsQuery, [userId, limit, offset]);

    // 计算总页数
    const totalPages = Math.ceil(total / limit);

    // 返回响应
    res.json({
      success: true,
      cards: cards,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error("获取角色卡列表失败:", error);
    res.status(500).json({
      success: false,
      message: "获取角色卡列表失败",
    });
  }
});

// ============================================================================
// 5.1.1 获取单个角色卡详情
// ============================================================================

/**
 * GET /api/cards/:id
 * 获取单个角色卡的详细信息
 *
 * 需要认证：是
 *
 * 路径参数：
 * - id: 角色卡数据库 ID
 *
 * 响应：
 * {
 *   success: true,
 *   card: {
 *     id: 1,
 *     card_id: "123456",
 *     card_name: "角色卡名称",
 *     password_version: 1,
 *     created_at: "2024-01-01T00:00:00.000Z",
 *     updated_at: "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
router.get("/:id", authenticateToken, etagMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cardId = parseInt(req.params.id);

    // ========================================================================
    // 步骤 1：验证路径参数
    // ========================================================================

    if (isNaN(cardId) || cardId <= 0) {
      return res.status(400).json({
        success: false,
        message: "无效的角色卡 ID",
      });
    }

    // ========================================================================
    // 步骤 2：查询角色卡详情
    // ========================================================================

    const cardQuery = `
      SELECT 
        id,
        card_id,
        card_name,
        password_version,
        created_at,
        updated_at
      FROM character_cards
      WHERE id = ? AND user_id = ?
    `;

    const [card] = await db.query(cardQuery, [cardId, userId]);

    // ========================================================================
    // 步骤 3：验证角色卡存在且属于当前用户
    // ========================================================================

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "角色卡不存在或无权访问",
      });
    }

    // ========================================================================
    // 步骤 4：返回角色卡详情
    // ========================================================================

    res.json({
      success: true,
      card: card,
    });
  } catch (error) {
    console.error("获取角色卡详情失败:", error);
    res.status(500).json({
      success: false,
      message: "获取角色卡详情失败",
    });
  }
});

// ============================================================================
// 5.2 创建角色卡
// ============================================================================

/**
 * POST /api/cards
 * 创建新的角色卡记录
 *
 * 需要认证：是
 *
 * 请求体：
 * {
 *   card_name: string (1-100 字符),
 *   password: string (1-100 字符)
 * }
 *
 * 响应：
 * {
 *   success: true,
 *   card_id: "123456",
 *   password_version: 1,
 *   message: "角色卡创建成功"
 * }
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { card_name, password } = req.body;

    // ========================================================================
    // 步骤 1：输入验证
    // ========================================================================

    // 验证角色卡名称
    const cardNameValidation = validateCardName(card_name);
    if (!cardNameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cardNameValidation.message,
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
    const normalizedCardName = sanitizeAndNormalize(card_name);

    // NoSQL 注入检测
    if (hasNoSQLInjection(normalizedCardName)) {
      return res.status(400).json({
        success: false,
        message: "角色卡名称包含非法字符",
      });
    }

    // ========================================================================
    // 步骤 2：生成唯一 Card ID
    // ========================================================================

    const cardId = await generateUniqueCardId();

    // ========================================================================
    // 步骤 3：加密密码
    // ========================================================================

    const passwordHash = await hashPassword(password);

    // ========================================================================
    // 步骤 4：保存到数据库
    // ========================================================================

    const insertQuery = `
      INSERT INTO character_cards 
      (card_id, user_id, card_name, password_hash, password_version)
      VALUES (?, ?, ?, ?, 1)
    `;

    const result = await db.query(insertQuery, [
      cardId,
      userId,
      normalizedCardName,
      passwordHash,
    ]);

    // ========================================================================
    // 步骤 5：返回成功响应
    // ========================================================================

    res.status(201).json({
      success: true,
      card_id: cardId,
      password_version: 1,
      message: "角色卡创建成功",
    });

    logInfo(`角色卡创建成功: ${normalizedCardName}`, {
      card_id: cardId,
      card_name: normalizedCardName,
      user_id: userId,
    });
  } catch (error) {
    logError("创建角色卡失败", error);

    // 数据库错误
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(500).json({
        success: false,
        message: "Card ID 冲突，请重试",
      });
    }

    // 其他错误
    res.status(500).json({
      success: false,
      message: "创建角色卡失败，请稍后重试",
    });
  }
});

// ============================================================================
// 5.3 更新角色卡
// ============================================================================

/**
 * PUT /api/cards/:id
 * 更新角色卡信息（如名称）
 *
 * 需要认证：是
 *
 * 路径参数：
 * - id: 角色卡数据库 ID
 *
 * 请求体：
 * {
 *   card_name: string (1-100 字符)
 * }
 *
 * 响应：
 * {
 *   success: true,
 *   message: "角色卡更新成功"
 * }
 */
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cardId = parseInt(req.params.id);
    const { card_name } = req.body;

    // ========================================================================
    // 步骤 1：验证路径参数
    // ========================================================================

    if (isNaN(cardId) || cardId <= 0) {
      return res.status(400).json({
        success: false,
        message: "无效的角色卡 ID",
      });
    }

    // ========================================================================
    // 步骤 2：输入验证
    // ========================================================================

    // 验证角色卡名称
    const cardNameValidation = validateCardName(card_name);
    if (!cardNameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cardNameValidation.message,
      });
    }

    // 标准化和清理输入（XSS 防护）
    const normalizedCardName = sanitizeAndNormalize(card_name);

    // NoSQL 注入检测
    if (hasNoSQLInjection(normalizedCardName)) {
      return res.status(400).json({
        success: false,
        message: "角色卡名称包含非法字符",
      });
    }

    // ========================================================================
    // 步骤 3：验证用户权限（只能更新自己的角色卡）
    // ========================================================================

    const checkOwnershipQuery = `
      SELECT id, card_name
      FROM character_cards
      WHERE id = ? AND user_id = ?
    `;

    const [existingCard] = await db.query(checkOwnershipQuery, [
      cardId,
      userId,
    ]);

    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: "角色卡不存在或无权访问",
      });
    }

    // ========================================================================
    // 步骤 4：更新角色卡名称（不改变 password_version）
    // ========================================================================

    const updateQuery = `
      UPDATE character_cards
      SET card_name = ?
      WHERE id = ? AND user_id = ?
    `;

    await db.query(updateQuery, [normalizedCardName, cardId, userId]);

    // ========================================================================
    // 步骤 5：返回成功响应
    // ========================================================================

    res.json({
      success: true,
      message: "角色卡更新成功",
    });

    logInfo(
      `角色卡更新成功: ${existingCard.card_name} -> ${normalizedCardName}`,
      {
        card_id: cardId,
        old_name: existingCard.card_name,
        new_name: normalizedCardName,
        user_id: userId,
      },
    );
  } catch (error) {
    logError("更新角色卡失败", error);

    // 其他错误
    res.status(500).json({
      success: false,
      message: "更新角色卡失败，请稍后重试",
    });
  }
});

// ============================================================================
// 8.2 删除角色卡
// ============================================================================

/**
 * DELETE /api/cards/:id
 * 删除角色卡记录
 *
 * 需要认证：是
 *
 * 路径参数：
 * - id: 角色卡数据库 ID
 *
 * 响应：
 * {
 *   success: true,
 *   message: "角色卡删除成功"
 * }
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cardId = parseInt(req.params.id);

    // ========================================================================
    // 步骤 1：验证路径参数
    // ========================================================================

    if (isNaN(cardId) || cardId <= 0) {
      return res.status(400).json({
        success: false,
        message: "无效的角色卡 ID",
      });
    }

    // ========================================================================
    // 步骤 2：验证用户权限（只能删除自己的角色卡）
    // ========================================================================

    const checkOwnershipQuery = `
      SELECT id, card_id, card_name
      FROM character_cards
      WHERE id = ? AND user_id = ?
    `;

    const [existingCard] = await db.query(checkOwnershipQuery, [
      cardId,
      userId,
    ]);

    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: "角色卡不存在或无权访问",
      });
    }

    // ========================================================================
    // 步骤 3：删除数据库记录
    // ========================================================================

    const deleteQuery = `
      DELETE FROM character_cards
      WHERE id = ? AND user_id = ?
    `;

    const result = await db.query(deleteQuery, [cardId, userId]);

    // ========================================================================
    // 步骤 4：返回删除结果
    // ========================================================================

    res.json({
      success: true,
      message: "角色卡删除成功",
    });

    logInfo(`角色卡删除成功: ${existingCard.card_name}`, {
      card_id: existingCard.card_id,
      card_name: existingCard.card_name,
      db_id: cardId,
      user_id: userId,
    });
  } catch (error) {
    console.error("删除角色卡失败:", error);

    // 其他错误
    res.status(500).json({
      success: false,
      message: "删除角色卡失败，请稍后重试",
    });
  }
});

// ============================================================================
// 8.3 更新角色卡密码
// ============================================================================

/**
 * PUT /api/cards/:id/password
 * 更新角色卡密码
 *
 * 需要认证：是
 *
 * 路径参数：
 * - id: 角色卡数据库 ID
 *
 * 请求体：
 * {
 *   new_password: string (1-100 字符)
 * }
 *
 * 响应：
 * {
 *   success: true,
 *   password_version: 4,
 *   message: "密码更新成功"
 * }
 */
router.put("/:id/password", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cardId = parseInt(req.params.id);
    const { new_password } = req.body;

    // ========================================================================
    // 步骤 1：验证路径参数
    // ========================================================================

    if (isNaN(cardId) || cardId <= 0) {
      return res.status(400).json({
        success: false,
        message: "无效的角色卡 ID",
      });
    }

    // ========================================================================
    // 步骤 2：输入验证
    // ========================================================================

    // 验证新密码
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // ========================================================================
    // 步骤 3：验证用户权限（只能更新自己的角色卡）
    // ========================================================================

    const checkOwnershipQuery = `
      SELECT id, card_id, card_name, password_version
      FROM character_cards
      WHERE id = ? AND user_id = ?
    `;

    const [existingCard] = await db.query(checkOwnershipQuery, [
      cardId,
      userId,
    ]);

    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: "角色卡不存在或无权访问",
      });
    }

    // ========================================================================
    // 步骤 4：加密新密码
    // ========================================================================

    const newPasswordHash = await hashPassword(new_password);

    // ========================================================================
    // 步骤 5：递增密码版本号
    // ========================================================================

    const newPasswordVersion = existingCard.password_version + 1;

    // ========================================================================
    // 步骤 6：更新数据库记录
    // ========================================================================

    const updateQuery = `
      UPDATE character_cards
      SET password_hash = ?, password_version = ?
      WHERE id = ? AND user_id = ?
    `;

    await db.query(updateQuery, [
      newPasswordHash,
      newPasswordVersion,
      cardId,
      userId,
    ]);

    // ========================================================================
    // 步骤 7：清除缓存（如果启用）
    // ========================================================================

    // TODO: 如果实现了 Redis 缓存，在此处清除缓存
    // 例如：await redis.del(`card:${existingCard.card_id}:password_version`);

    // ========================================================================
    // 步骤 8：返回新的密码版本号
    // ========================================================================

    res.json({
      success: true,
      password_version: newPasswordVersion,
      message: "密码更新成功",
    });

    logPasswordUpdate(
      existingCard.card_id,
      existingCard.password_version,
      newPasswordVersion,
      req.user.username,
    );
  } catch (error) {
    logError("更新密码失败", error);

    // 其他错误
    res.status(500).json({
      success: false,
      message: "更新密码失败，请稍后重试",
    });
  }
});

// ============================================================================
// 8.4 生成随机密码
// ============================================================================

/**
 * POST /api/cards/:id/password/random
 * 生成随机密码并自动更新角色卡密码
 *
 * 需要认证：是
 *
 * 路径参数：
 * - id: 角色卡数据库 ID
 *
 * 请求体（可选）：
 * {
 *   length: number (8-100，默认16),
 *   include_symbols: boolean (默认true)
 * }
 *
 * 响应：
 * {
 *   success: true,
 *   password: "aB3$xY9#mN2@pQ7!",
 *   password_version: 5,
 *   message: "随机密码生成成功"
 * }
 */
router.post("/:id/password/random", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cardId = parseInt(req.params.id);
    const { length, include_symbols } = req.body;

    // ========================================================================
    // 步骤 1：验证路径参数
    // ========================================================================

    if (isNaN(cardId) || cardId <= 0) {
      return res.status(400).json({
        success: false,
        message: "无效的角色卡 ID",
      });
    }

    // ========================================================================
    // 步骤 2：验证用户权限（只能更新自己的角色卡）
    // ========================================================================

    const checkOwnershipQuery = `
      SELECT id, card_id, card_name, password_version
      FROM character_cards
      WHERE id = ? AND user_id = ?
    `;

    const [existingCard] = await db.query(checkOwnershipQuery, [
      cardId,
      userId,
    ]);

    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: "角色卡不存在或无权访问",
      });
    }

    // ========================================================================
    // 步骤 3：生成随机密码
    // ========================================================================

    let randomPassword;
    try {
      randomPassword = generateRandomPassword({
        length: length || 16,
        includeSymbols: include_symbols !== false, // 默认为 true
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // ========================================================================
    // 步骤 4：加密新密码
    // ========================================================================

    const newPasswordHash = await hashPassword(randomPassword);

    // ========================================================================
    // 步骤 5：递增密码版本号
    // ========================================================================

    const newPasswordVersion = existingCard.password_version + 1;

    // ========================================================================
    // 步骤 6：更新数据库记录
    // ========================================================================

    const updateQuery = `
      UPDATE character_cards
      SET password_hash = ?, password_version = ?
      WHERE id = ? AND user_id = ?
    `;

    await db.query(updateQuery, [
      newPasswordHash,
      newPasswordVersion,
      cardId,
      userId,
    ]);

    // ========================================================================
    // 步骤 7：返回生成的密码和新版本号
    // ========================================================================

    res.json({
      success: true,
      password: randomPassword,
      password_version: newPasswordVersion,
      message: "随机密码生成成功",
    });

    logPasswordUpdate(
      existingCard.card_id,
      existingCard.password_version,
      newPasswordVersion,
      req.user.username,
    );
  } catch (error) {
    logError("生成随机密码失败", error);

    // 其他错误
    res.status(500).json({
      success: false,
      message: "生成随机密码失败，请稍后重试",
    });
  }
});

// ============================================================================
// 导出路由
// ============================================================================

module.exports = router;

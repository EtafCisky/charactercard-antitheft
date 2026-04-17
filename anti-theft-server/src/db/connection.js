/**
 * 数据库连接模块
 *
 * 功能：
 * - 创建 MySQL 连接池
 * - 从环境变量读取数据库配置
 * - 实现连接错误处理
 * - 实现连接重试机制（最多3次）
 * - 支持开发和生产环境
 *
 * 验证需求：
 * - 需求 10：数据持久化 - 使用 MySQL/MariaDB 数据库
 * - 需求 21：错误恢复 - 数据库连接失败时重试最多3次
 * - 需求 22：性能要求 - 使用连接池提高性能
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const { logDatabaseError, logInfo, logError } = require("../utils/logger");

// ============================================================================
// 配置常量
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2秒重试延迟

// ============================================================================
// 数据库配置
// ============================================================================

/**
 * 从环境变量读取数据库配置
 * @returns {Object} 数据库配置对象
 */
function getDatabaseConfig() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    charset: "utf8mb4",

    // ========================================
    // 连接池配置（性能优化）
    // ========================================

    // 等待可用连接（而不是立即失败）
    waitForConnections: true,

    // 连接池大小：根据并发需求调整
    // 生产环境建议: CPU核心数 * 2 + 磁盘数
    // 开发环境: 10 个连接足够
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,

    // 队列限制：0 表示无限制
    // 生产环境可以设置为 connectionLimit * 2
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,

    // 最大空闲时间（毫秒）：超过此时间的空闲连接将被释放
    // 默认 10 分钟
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 600000,

    // 连接超时配置（毫秒）
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,

    // 获取连接超时（毫秒）
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 10000,

    // 查询超时（毫秒）
    timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,

    // ========================================
    // 性能优化配置
    // ========================================

    // 启用查询缓存（MySQL 8.0+ 已废弃，但保留配置）
    // 注意：MySQL 8.0 移除了查询缓存，改用 InnoDB 缓冲池

    // 启用压缩（适用于网络延迟高的场景）
    compress: process.env.DB_COMPRESS === "true",

    // 启用多语句查询（安全考虑，默认禁用）
    multipleStatements: false,

    // 日期字符串处理：返回 Date 对象而不是字符串
    dateStrings: false,

    // 大数字处理：返回字符串而不是数字（避免精度丢失）
    supportBigNumbers: true,
    bigNumberStrings: true,

    // ========================================
    // 连接管理配置
    // ========================================

    // 启用连接保活检查
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10秒

    // 最大重试次数
    maxReconnectAttempts: 3,
  };

  // 验证必需的配置项
  const requiredFields = ["user", "database"];
  const missingFields = requiredFields.filter((field) => !config[field]);

  if (missingFields.length > 0) {
    const envVarNames = missingFields.map((f) => {
      // 特殊处理 database -> DB_NAME
      if (f === "database") return "DB_NAME";
      return `DB_${f.toUpperCase()}`;
    });
    throw new Error(`缺少必需的数据库配置环境变量: ${envVarNames.join(", ")}`);
  }

  return config;
}

// ============================================================================
// 连接池管理
// ============================================================================

let pool = null;
let isConnected = false;

/**
 * 创建数据库连接池
 * @returns {Promise<mysql.Pool>} 数据库连接池
 */
async function createPool() {
  try {
    const config = getDatabaseConfig();

    logInfo("正在创建数据库连接池", {
      host: config.host,
      port: config.port,
      database: config.database,
      connectionLimit: config.connectionLimit,
    });

    pool = mysql.createPool(config);

    // 测试连接
    await testConnection();

    isConnected = true;
    logInfo("数据库连接池创建成功");

    return pool;
  } catch (error) {
    logDatabaseError("创建数据库连接池", error);
    throw error;
  }
}

/**
 * 测试数据库连接
 * @returns {Promise<void>}
 */
async function testConnection() {
  if (!pool) {
    throw new Error("连接池未初始化");
  }

  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logInfo("数据库连接测试成功");
  } catch (error) {
    logDatabaseError("数据库连接测试", error);
    throw error;
  }
}

/**
 * 带重试机制的连接初始化
 * 实现需求 21：连接失败时重试最多3次
 * @returns {Promise<mysql.Pool>} 数据库连接池
 */
async function initializeWithRetry() {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logInfo(`尝试连接数据库 (${attempt}/${MAX_RETRIES})`);

      const pool = await createPool();

      logInfo(`数据库连接成功 (尝试 ${attempt}/${MAX_RETRIES})`);
      return pool;
    } catch (error) {
      lastError = error;
      logDatabaseError(`连接失败 (尝试 ${attempt}/${MAX_RETRIES})`, error);

      // 如果还有重试机会，等待后重试
      if (attempt < MAX_RETRIES) {
        logInfo(`等待 ${RETRY_DELAY_MS / 1000} 秒后重试`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  // 所有重试都失败
  logError(`数据库连接失败：已尝试 ${MAX_RETRIES} 次，全部失败`, lastError);
  throw new Error(
    `数据库连接失败（已重试 ${MAX_RETRIES} 次）: ${lastError.message}`,
  );
}

/**
 * 延迟函数
 * @param {number} ms 延迟毫秒数
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// 连接池访问接口
// ============================================================================

/**
 * 获取数据库连接池
 * @returns {mysql.Pool} 数据库连接池
 * @throws {Error} 如果连接池未初始化
 */
function getPool() {
  if (!pool) {
    throw new Error("数据库连接池未初始化，请先调用 initializeWithRetry()");
  }
  return pool;
}

/**
 * 检查数据库连接状态
 * @returns {boolean} 是否已连接
 */
function isConnectionActive() {
  return isConnected && pool !== null;
}

/**
 * 执行查询（便捷方法）
 * @param {string} sql SQL 查询语句
 * @param {Array} params 查询参数
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logDatabaseError("数据库查询错误", error, {
      sql,
      params,
    });
    throw error;
  }
}

/**
 * 执行事务
 * @param {Function} callback 事务回调函数，接收 connection 参数
 * @returns {Promise<any>} 事务结果
 */
async function transaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logDatabaseError("事务执行失败，已回滚", error);
    throw error;
  } finally {
    connection.release();
  }
}

// ============================================================================
// 连接池关闭
// ============================================================================

/**
 * 关闭数据库连接池
 * @returns {Promise<void>}
 */
async function closePool() {
  if (pool) {
    try {
      logInfo("正在关闭数据库连接池");
      await pool.end();
      pool = null;
      isConnected = false;
      logInfo("数据库连接池已关闭");
    } catch (error) {
      logDatabaseError("关闭数据库连接池", error);
      throw error;
    }
  }
}

// ============================================================================
// 健康检查
// ============================================================================

/**
 * 数据库健康检查
 * 用于 /health 端点
 * @returns {Promise<Object>} 健康状态对象
 */
async function healthCheck() {
  try {
    if (!pool) {
      return {
        status: "disconnected",
        message: "数据库连接池未初始化",
        healthy: false,
      };
    }

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    return {
      status: "connected",
      message: "数据库连接正常",
      healthy: true,
      poolStats: getPoolStats(),
    };
  } catch (error) {
    return {
      status: "error",
      message: `数据库连接异常: ${error.message}`,
      healthy: false,
    };
  }
}

/**
 * 获取连接池统计信息
 * @returns {Object} 连接池统计数据
 */
function getPoolStats() {
  if (!pool) {
    return null;
  }

  try {
    // mysql2 连接池统计信息
    const poolConfig = pool.pool.config;
    const poolState = pool.pool;

    return {
      // 配置信息
      connectionLimit: poolConfig.connectionLimit,
      queueLimit: poolConfig.queueLimit,

      // 当前状态
      totalConnections: poolState._allConnections
        ? poolState._allConnections.length
        : 0,
      freeConnections: poolState._freeConnections
        ? poolState._freeConnections.length
        : 0,
      queuedRequests: poolState._connectionQueue
        ? poolState._connectionQueue.length
        : 0,

      // 计算使用率
      utilizationPercent:
        poolConfig.connectionLimit > 0
          ? Math.round(
              ((poolState._allConnections?.length || 0) /
                poolConfig.connectionLimit) *
                100,
            )
          : 0,
    };
  } catch (error) {
    logError("获取连接池统计信息失败", error);
    return null;
  }
}

/**
 * 监控连接池状态（定期日志）
 * @param {number} intervalMs 监控间隔（毫秒）
 * @returns {NodeJS.Timeout} 定时器ID
 */
function startPoolMonitoring(intervalMs = 60000) {
  return setInterval(() => {
    const stats = getPoolStats();
    if (stats) {
      logInfo("连接池状态", stats);

      // 警告：连接池使用率过高
      if (stats.utilizationPercent > 80) {
        logError("⚠️  连接池使用率过高", {
          utilizationPercent: stats.utilizationPercent,
          suggestion: "考虑增加 DB_CONNECTION_LIMIT",
        });
      }

      // 警告：队列中有大量等待请求
      if (stats.queuedRequests > 10) {
        logError("⚠️  连接池队列积压", {
          queuedRequests: stats.queuedRequests,
          suggestion: "考虑增加连接池大小或优化查询",
        });
      }
    }
  }, intervalMs);
}

// ============================================================================
// 导出接口
// ============================================================================

module.exports = {
  // 初始化和关闭
  initializeWithRetry,
  closePool,

  // 连接池访问
  getPool,
  isConnectionActive,

  // 查询接口
  query,
  transaction,

  // 健康检查和监控
  healthCheck,
  getPoolStats,
  startPoolMonitoring,

  // 配置（用于测试）
  getDatabaseConfig,
};

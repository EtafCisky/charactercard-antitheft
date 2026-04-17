/**
 * 数据库初始化脚本
 *
 * 功能：
 * - 自动创建数据库（如果不存在）
 * - 自动导入表结构（从 schema.sql）
 * - 验证数据库连接
 * - 提供详细的执行日志
 *
 * 使用方法：
 * node scripts/init-db.js
 *
 * 环境变量要求：
 * - DB_HOST: 数据库主机地址
 * - DB_PORT: 数据库端口（默认 3306）
 * - DB_USER: 数据库用户名
 * - DB_PASSWORD: 数据库密码
 * - DB_NAME: 要创建的数据库名称
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

// ============================================================================
// 配置常量
// ============================================================================

const SCHEMA_FILE_PATH = path.join(__dirname, "schema.sql");

// ============================================================================
// 颜色输出工具
// ============================================================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logStep(step, message) {
  log(
    `\n${colors.bright}[步骤 ${step}] ${message}${colors.reset}`,
    colors.blue,
  );
}

// ============================================================================
// 配置验证
// ============================================================================

/**
 * 验证必需的环境变量
 * @throws {Error} 如果缺少必需的环境变量
 */
function validateEnvironment() {
  const requiredVars = ["DB_HOST", "DB_USER", "DB_NAME"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missingVars.join(", ")}`);
  }

  // DB_PASSWORD 可以为空（本地开发环境）
  if (process.env.DB_PASSWORD === undefined) {
    logWarning("DB_PASSWORD 未设置，将使用空密码");
  }
}

/**
 * 获取数据库配置
 * @returns {Object} 数据库配置对象
 */
function getDatabaseConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    charset: "utf8mb4",
    multipleStatements: true, // 允许执行多条 SQL 语句
  };
}

// ============================================================================
// 数据库操作
// ============================================================================

/**
 * 创建数据库连接（不指定数据库）
 * @returns {Promise<mysql.Connection>} 数据库连接
 */
async function createConnection() {
  const config = getDatabaseConfig();

  logInfo(`正在连接到 MySQL 服务器: ${config.host}:${config.port}`);

  try {
    const connection = await mysql.createConnection(config);
    logSuccess("成功连接到 MySQL 服务器");
    return connection;
  } catch (error) {
    logError(`连接 MySQL 服务器失败: ${error.message}`);
    throw error;
  }
}

/**
 * 检查数据库是否存在
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} dbName 数据库名称
 * @returns {Promise<boolean>} 数据库是否存在
 */
async function databaseExists(connection, dbName) {
  try {
    const [rows] = await connection.query(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
      [dbName],
    );
    return rows.length > 0;
  } catch (error) {
    logError(`检查数据库是否存在时出错: ${error.message}`);
    throw error;
  }
}

/**
 * 创建数据库
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} dbName 数据库名称
 * @returns {Promise<void>}
 */
async function createDatabase(connection, dbName) {
  try {
    logInfo(`正在创建数据库: ${dbName}`);

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
       CHARACTER SET utf8mb4 
       COLLATE utf8mb4_unicode_ci`,
    );

    logSuccess(`数据库 "${dbName}" 创建成功`);
  } catch (error) {
    logError(`创建数据库失败: ${error.message}`);
    throw error;
  }
}

/**
 * 读取 SQL 架构文件
 * @returns {Promise<string>} SQL 文件内容
 */
async function readSchemaFile() {
  try {
    logInfo(`正在读取架构文件: ${SCHEMA_FILE_PATH}`);

    const schemaContent = await fs.readFile(SCHEMA_FILE_PATH, "utf8");

    logSuccess("架构文件读取成功");
    return schemaContent;
  } catch (error) {
    if (error.code === "ENOENT") {
      logError(`架构文件不存在: ${SCHEMA_FILE_PATH}`);
    } else {
      logError(`读取架构文件失败: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 导入表结构
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} dbName 数据库名称
 * @param {string} schemaSQL SQL 架构内容
 * @returns {Promise<void>}
 */
async function importSchema(connection, dbName, schemaSQL) {
  try {
    logInfo(`正在导入表结构到数据库: ${dbName}`);

    // 选择数据库
    await connection.query(`USE \`${dbName}\``);

    // 执行架构 SQL
    await connection.query(schemaSQL);

    logSuccess("表结构导入成功");
  } catch (error) {
    logError(`导入表结构失败: ${error.message}`);
    throw error;
  }
}

/**
 * 验证表是否创建成功
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} dbName 数据库名称
 * @returns {Promise<void>}
 */
async function verifyTables(connection, dbName) {
  try {
    logInfo("正在验证表结构...");

    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
      [dbName],
    );

    const tableNames = tables.map((row) => row.TABLE_NAME);
    const expectedTables = ["users", "character_cards"];

    logInfo(`找到 ${tableNames.length} 个表:`);
    tableNames.forEach((name) => {
      log(`  - ${name}`, colors.cyan);
    });

    // 检查必需的表是否存在
    const missingTables = expectedTables.filter(
      (table) => !tableNames.includes(table),
    );

    if (missingTables.length > 0) {
      logWarning(`缺少以下表: ${missingTables.join(", ")}`);
    } else {
      logSuccess("所有必需的表都已创建");
    }

    // 验证索引
    await verifyIndexes(connection, dbName);
  } catch (error) {
    logError(`验证表结构失败: ${error.message}`);
    throw error;
  }
}

/**
 * 验证索引是否创建成功
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} dbName 数据库名称
 * @returns {Promise<void>}
 */
async function verifyIndexes(connection, dbName) {
  try {
    logInfo("正在验证索引...");

    const [indexes] = await connection.query(
      `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME 
       FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = ? 
       ORDER BY TABLE_NAME, INDEX_NAME`,
      [dbName],
    );

    const indexCount = indexes.length;
    logInfo(`找到 ${indexCount} 个索引`);

    // 按表分组显示索引
    const indexesByTable = {};
    indexes.forEach((idx) => {
      if (!indexesByTable[idx.TABLE_NAME]) {
        indexesByTable[idx.TABLE_NAME] = [];
      }
      indexesByTable[idx.TABLE_NAME].push(
        `${idx.INDEX_NAME} (${idx.COLUMN_NAME})`,
      );
    });

    Object.entries(indexesByTable).forEach(([table, idxList]) => {
      log(`  ${table}:`, colors.cyan);
      idxList.forEach((idx) => {
        log(`    - ${idx}`, colors.cyan);
      });
    });

    logSuccess("索引验证完成");
  } catch (error) {
    logWarning(`验证索引时出错: ${error.message}`);
  }
}

/**
 * 显示数据库信息
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} dbName 数据库名称
 * @returns {Promise<void>}
 */
async function displayDatabaseInfo(connection, dbName) {
  try {
    logInfo("数据库信息:");

    // 获取数据库字符集
    const [dbInfo] = await connection.query(
      `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
       FROM INFORMATION_SCHEMA.SCHEMATA 
       WHERE SCHEMA_NAME = ?`,
      [dbName],
    );

    if (dbInfo.length > 0) {
      log(`  数据库名称: ${dbName}`, colors.cyan);
      log(`  字符集: ${dbInfo[0].DEFAULT_CHARACTER_SET_NAME}`, colors.cyan);
      log(`  排序规则: ${dbInfo[0].DEFAULT_COLLATION_NAME}`, colors.cyan);
    }
  } catch (error) {
    logWarning(`获取数据库信息时出错: ${error.message}`);
  }
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 主初始化函数
 * @returns {Promise<void>}
 */
async function main() {
  let connection = null;

  try {
    log("\n" + "=".repeat(60), colors.bright);
    log("数据库初始化脚本", colors.bright);
    log("=".repeat(60) + "\n", colors.bright);

    // 步骤 1: 验证环境变量
    logStep(1, "验证环境变量");
    validateEnvironment();
    logSuccess("环境变量验证通过");

    const dbName = process.env.DB_NAME;
    logInfo(`目标数据库: ${dbName}`);

    // 步骤 2: 连接到 MySQL 服务器
    logStep(2, "连接到 MySQL 服务器");
    connection = await createConnection();

    // 步骤 3: 检查并创建数据库
    logStep(3, "检查并创建数据库");
    const exists = await databaseExists(connection, dbName);

    if (exists) {
      logWarning(`数据库 "${dbName}" 已存在`);
      logInfo("将继续导入表结构（如果表不存在则创建）");
    } else {
      await createDatabase(connection, dbName);
    }

    // 步骤 4: 读取架构文件
    logStep(4, "读取架构文件");
    const schemaSQL = await readSchemaFile();

    // 步骤 5: 导入表结构
    logStep(5, "导入表结构");
    await importSchema(connection, dbName, schemaSQL);

    // 步骤 6: 验证表结构
    logStep(6, "验证表结构");
    await verifyTables(connection, dbName);

    // 步骤 7: 显示数据库信息
    logStep(7, "数据库信息");
    await displayDatabaseInfo(connection, dbName);

    // 完成
    log("\n" + "=".repeat(60), colors.bright);
    logSuccess("数据库初始化完成！");
    log("=".repeat(60) + "\n", colors.bright);

    logInfo("下一步操作:");
    log("  1. 启动服务器: npm start", colors.cyan);
    log("  2. 运行测试: npm test", colors.cyan);
    log("  3. 查看 API 文档: docs/API.md\n", colors.cyan);
  } catch (error) {
    log("\n" + "=".repeat(60), colors.bright);
    logError("数据库初始化失败！");
    log("=".repeat(60) + "\n", colors.bright);

    logError(`错误信息: ${error.message}`);

    if (error.code) {
      logError(`错误代码: ${error.code}`);
    }

    logInfo("\n故障排查建议:");
    log("  1. 检查 .env 文件中的数据库配置是否正确", colors.yellow);
    log("  2. 确认 MySQL 服务器正在运行", colors.yellow);
    log("  3. 验证数据库用户权限是否足够", colors.yellow);
    log("  4. 检查防火墙设置是否允许数据库连接\n", colors.yellow);

    process.exit(1);
  } finally {
    // 关闭连接
    if (connection) {
      try {
        await connection.end();
        logInfo("数据库连接已关闭");
      } catch (error) {
        logWarning(`关闭连接时出错: ${error.message}`);
      }
    }
  }
}

// ============================================================================
// 执行脚本
// ============================================================================

// 捕获未处理的 Promise 拒绝
process.on("unhandledRejection", (error) => {
  logError("未处理的 Promise 拒绝:");
  console.error(error);
  process.exit(1);
});

// 执行主函数
main();

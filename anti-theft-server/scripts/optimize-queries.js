/**
 * 数据库查询优化脚本
 *
 * 功能：
 * - 分析慢查询日志
 * - 使用 EXPLAIN 分析查询执行计划
 * - 提供查询优化建议
 * - 检测缺失的索引
 *
 * 使用方法：
 * node scripts/optimize-queries.js
 */

require("dotenv").config();
const {
  getPool,
  initializeWithRetry,
  closePool,
} = require("../src/db/connection");

// ============================================================================
// 常见查询模式
// ============================================================================

const COMMON_QUERIES = {
  // 用户认证查询
  loginByUsername: {
    name: "用户登录（按用户名）",
    sql: "SELECT id, username, email, password_hash FROM users WHERE username = ?",
    params: ["testuser"],
    expectedIndex: "idx_username",
    frequency: "HIGH",
  },

  loginByEmail: {
    name: "用户登录（按邮箱）",
    sql: "SELECT id, username, email, password_hash FROM users WHERE email = ?",
    params: ["test@example.com"],
    expectedIndex: "idx_email",
    frequency: "MEDIUM",
  },

  // 密码验证查询（最高频）
  verifyPassword: {
    name: "密码验证",
    sql: "SELECT password_hash, password_version FROM character_cards WHERE card_id = ?",
    params: ["123456"],
    expectedIndex: "idx_card_id",
    frequency: "VERY_HIGH",
  },

  // 获取密码版本
  getPasswordVersion: {
    name: "获取密码版本",
    sql: "SELECT password_version FROM character_cards WHERE card_id = ?",
    params: ["123456"],
    expectedIndex: "idx_card_id",
    frequency: "HIGH",
  },

  // 用户角色卡列表
  listUserCards: {
    name: "用户角色卡列表",
    sql: "SELECT id, card_id, card_name, password_version, created_at, updated_at FROM character_cards WHERE user_id = ? ORDER BY created_at DESC",
    params: [1],
    expectedIndex: "idx_user_id",
    frequency: "MEDIUM",
  },

  // 角色卡详情
  getCardDetail: {
    name: "角色卡详情",
    sql: "SELECT * FROM character_cards WHERE id = ? AND user_id = ?",
    params: [1, 1],
    expectedIndex: "PRIMARY",
    frequency: "MEDIUM",
  },

  // 更新密码
  updatePassword: {
    name: "更新密码",
    sql: "UPDATE character_cards SET password_hash = ?, password_version = password_version + 1 WHERE id = ? AND user_id = ?",
    params: ["$2b$12$...", 1, 1],
    expectedIndex: "PRIMARY",
    frequency: "LOW",
  },

  // 删除角色卡
  deleteCard: {
    name: "删除角色卡",
    sql: "DELETE FROM character_cards WHERE id = ? AND user_id = ?",
    params: [1, 1],
    expectedIndex: "PRIMARY",
    frequency: "LOW",
  },

  // 检查 card_id 唯一性
  checkCardIdExists: {
    name: "检查 Card ID 是否存在",
    sql: "SELECT 1 FROM character_cards WHERE card_id = ? LIMIT 1",
    params: ["123456"],
    expectedIndex: "idx_card_id",
    frequency: "MEDIUM",
  },

  // 检查用户名唯一性
  checkUsernameExists: {
    name: "检查用户名是否存在",
    sql: "SELECT 1 FROM users WHERE username = ? LIMIT 1",
    params: ["testuser"],
    expectedIndex: "idx_username",
    frequency: "MEDIUM",
  },
};

// ============================================================================
// EXPLAIN 分析函数
// ============================================================================

/**
 * 执行 EXPLAIN 分析查询
 * @param {string} sql SQL 查询语句
 * @param {Array} params 查询参数
 * @returns {Promise<Object>} EXPLAIN 结果
 */
async function explainQuery(sql, params = []) {
  const pool = getPool();

  try {
    // 执行 EXPLAIN
    const [rows] = await pool.execute(`EXPLAIN ${sql}`, params);
    return rows[0]; // 返回第一行结果
  } catch (error) {
    console.error("EXPLAIN 执行失败:", error.message);
    return null;
  }
}

/**
 * 分析 EXPLAIN 结果
 * @param {Object} explainResult EXPLAIN 结果
 * @param {string} expectedIndex 期望使用的索引
 * @returns {Object} 分析结果
 */
function analyzeExplain(explainResult, expectedIndex) {
  if (!explainResult) {
    return {
      status: "ERROR",
      message: "EXPLAIN 执行失败",
    };
  }

  const analysis = {
    status: "OK",
    warnings: [],
    suggestions: [],
  };

  // 检查查询类型
  const selectType = explainResult.select_type;
  if (selectType !== "SIMPLE") {
    analysis.warnings.push(`查询类型: ${selectType}（非简单查询）`);
  }

  // 检查访问类型
  const type = explainResult.type;
  const goodTypes = ["const", "eq_ref", "ref", "range"];
  const badTypes = ["ALL", "index"];

  if (badTypes.includes(type)) {
    analysis.status = "WARNING";
    analysis.warnings.push(`访问类型: ${type}（全表扫描或全索引扫描）`);
    analysis.suggestions.push("考虑添加索引以避免全表扫描");
  } else if (goodTypes.includes(type)) {
    analysis.status = "OK";
  }

  // 检查是否使用了索引
  const key = explainResult.key;
  if (!key) {
    analysis.status = "WARNING";
    analysis.warnings.push("未使用任何索引");
    analysis.suggestions.push("添加适当的索引以提高查询性能");
  } else if (expectedIndex && key !== expectedIndex) {
    analysis.status = "INFO";
    analysis.warnings.push(`使用索引: ${key}（期望: ${expectedIndex}）`);
  }

  // 检查扫描行数
  const rows = explainResult.rows;
  if (rows > 1000) {
    analysis.status = "WARNING";
    analysis.warnings.push(`扫描行数: ${rows}（较多）`);
    analysis.suggestions.push("优化查询条件或添加索引以减少扫描行数");
  }

  // 检查 Extra 信息
  const extra = explainResult.Extra || "";
  if (extra.includes("Using filesort")) {
    analysis.warnings.push("使用文件排序（性能较差）");
    analysis.suggestions.push("考虑在排序列上添加索引");
  }
  if (extra.includes("Using temporary")) {
    analysis.warnings.push("使用临时表");
    analysis.suggestions.push("优化查询以避免使用临时表");
  }
  if (extra.includes("Using index")) {
    // 这是好事：覆盖索引
    analysis.warnings.push("✅ 使用覆盖索引（性能最优）");
  }

  return analysis;
}

// ============================================================================
// 查询性能测试
// ============================================================================

/**
 * 测试查询性能
 * @param {string} sql SQL 查询语句
 * @param {Array} params 查询参数
 * @param {number} iterations 测试次数
 * @returns {Promise<Object>} 性能统计
 */
async function benchmarkQuery(sql, params = [], iterations = 100) {
  const pool = getPool();
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();

    try {
      await pool.execute(sql, params);
    } catch (error) {
      // 忽略错误（可能是数据不存在）
    }

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000; // 转换为毫秒
    times.push(durationMs);
  }

  // 计算统计数据
  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);

  return {
    iterations,
    avgMs: sum / iterations,
    minMs: times[0],
    maxMs: times[times.length - 1],
    p50Ms: times[Math.floor(iterations * 0.5)],
    p95Ms: times[Math.floor(iterations * 0.95)],
    p99Ms: times[Math.floor(iterations * 0.99)],
  };
}

// ============================================================================
// 主分析函数
// ============================================================================

/**
 * 分析单个查询
 * @param {string} queryKey 查询键名
 * @param {Object} queryInfo 查询信息
 */
async function analyzeQuery(queryKey, queryInfo) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`查询: ${queryInfo.name}`);
  console.log(`频率: ${queryInfo.frequency}`);
  console.log(`${"=".repeat(70)}`);
  console.log(`SQL: ${queryInfo.sql}`);
  console.log(`参数: ${JSON.stringify(queryInfo.params)}`);

  // 1. EXPLAIN 分析
  console.log("\n📊 EXPLAIN 分析:");
  const explainResult = await explainQuery(queryInfo.sql, queryInfo.params);

  if (explainResult) {
    console.log(`  类型: ${explainResult.type}`);
    console.log(`  索引: ${explainResult.key || "无"}`);
    console.log(`  扫描行数: ${explainResult.rows}`);
    console.log(`  Extra: ${explainResult.Extra || "无"}`);

    // 分析结果
    const analysis = analyzeExplain(explainResult, queryInfo.expectedIndex);

    if (analysis.warnings.length > 0) {
      console.log("\n⚠️  警告:");
      analysis.warnings.forEach((w) => console.log(`  - ${w}`));
    }

    if (analysis.suggestions.length > 0) {
      console.log("\n💡 建议:");
      analysis.suggestions.forEach((s) => console.log(`  - ${s}`));
    }

    if (analysis.status === "OK" && analysis.warnings.length === 0) {
      console.log("\n✅ 查询优化良好");
    }
  }

  // 2. 性能测试（仅对高频查询）
  if (["VERY_HIGH", "HIGH"].includes(queryInfo.frequency)) {
    console.log("\n⏱️  性能测试 (100次):");
    const perf = await benchmarkQuery(queryInfo.sql, queryInfo.params, 100);

    console.log(`  平均: ${perf.avgMs.toFixed(2)} ms`);
    console.log(`  最小: ${perf.minMs.toFixed(2)} ms`);
    console.log(`  最大: ${perf.maxMs.toFixed(2)} ms`);
    console.log(`  P50: ${perf.p50Ms.toFixed(2)} ms`);
    console.log(`  P95: ${perf.p95Ms.toFixed(2)} ms`);
    console.log(`  P99: ${perf.p99Ms.toFixed(2)} ms`);

    // 性能评估
    if (perf.p95Ms > 10) {
      console.log("\n⚠️  P95 响应时间超过 10ms，建议优化");
    } else if (perf.p95Ms > 5) {
      console.log("\n⚠️  P95 响应时间超过 5ms，可以进一步优化");
    } else {
      console.log("\n✅ 性能良好");
    }
  }
}

/**
 * 分析所有查询
 */
async function analyzeAllQueries() {
  console.log("\n数据库查询优化分析");
  console.log("=".repeat(70));

  const queryKeys = Object.keys(COMMON_QUERIES);

  for (const key of queryKeys) {
    await analyzeQuery(key, COMMON_QUERIES[key]);
  }

  // 总结
  console.log(`\n\n${"=".repeat(70)}`);
  console.log("优化总结");
  console.log("=".repeat(70));
  console.log("\n关键优化点:");
  console.log("  1. 确保所有高频查询都使用了索引");
  console.log("  2. 密码验证查询（VERY_HIGH）必须使用 idx_card_id 索引");
  console.log("  3. 用户登录查询必须使用 idx_username 或 idx_email 索引");
  console.log("  4. 避免 SELECT * 查询，只选择需要的列");
  console.log("  5. 使用 LIMIT 限制返回行数");
  console.log("  6. 定期运行 ANALYZE TABLE 更新统计信息");

  console.log("\n推荐的维护命令:");
  console.log("  ANALYZE TABLE users;");
  console.log("  ANALYZE TABLE character_cards;");
  console.log("  OPTIMIZE TABLE users;");
  console.log("  OPTIMIZE TABLE character_cards;");
}

// ============================================================================
// 慢查询日志分析
// ============================================================================

/**
 * 检查慢查询日志配置
 */
async function checkSlowQueryLog() {
  console.log("\n\n慢查询日志配置");
  console.log("=".repeat(70));

  const pool = getPool();

  try {
    // 检查慢查询日志是否启用
    const [slowLogStatus] = await pool.execute(
      "SHOW VARIABLES LIKE 'slow_query_log'",
    );
    const [slowLogFile] = await pool.execute(
      "SHOW VARIABLES LIKE 'slow_query_log_file'",
    );
    const [longQueryTime] = await pool.execute(
      "SHOW VARIABLES LIKE 'long_query_time'",
    );

    console.log(`慢查询日志: ${slowLogStatus[0]?.Value || "N/A"}`);
    console.log(`日志文件: ${slowLogFile[0]?.Value || "N/A"}`);
    console.log(`慢查询阈值: ${longQueryTime[0]?.Value || "N/A"} 秒`);

    if (slowLogStatus[0]?.Value === "OFF") {
      console.log("\n⚠️  慢查询日志未启用");
      console.log("建议启用慢查询日志以监控性能问题:");
      console.log("  SET GLOBAL slow_query_log = 1;");
      console.log("  SET GLOBAL long_query_time = 1;  -- 记录超过1秒的查询");
    } else {
      console.log("\n✅ 慢查询日志已启用");
    }
  } catch (error) {
    console.log("⚠️  无法检查慢查询日志配置:", error.message);
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  try {
    // 初始化数据库连接
    await initializeWithRetry();

    // 分析所有查询
    await analyzeAllQueries();

    // 检查慢查询日志
    await checkSlowQueryLog();

    console.log("\n\n✅ 查询优化分析完成");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ 分析过程出错:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  explainQuery,
  analyzeExplain,
  benchmarkQuery,
  analyzeQuery,
};

/**
 * 数据库索引验证脚本
 *
 * 功能：
 * - 验证所有必要的索引是否已创建
 * - 检查索引的类型和列
 * - 提供索引优化建议
 *
 * 使用方法：
 * node scripts/verify-indexes.js
 */

require("dotenv").config();
const {
  getPool,
  initializeWithRetry,
  closePool,
} = require("../src/db/connection");

// ============================================================================
// 期望的索引配置
// ============================================================================

const EXPECTED_INDEXES = {
  users: [
    {
      name: "PRIMARY",
      columns: ["id"],
      type: "PRIMARY KEY",
      unique: true,
      required: true,
    },
    {
      name: "username",
      columns: ["username"],
      type: "UNIQUE",
      unique: true,
      required: true,
    },
    {
      name: "email",
      columns: ["email"],
      type: "UNIQUE",
      unique: true,
      required: true,
    },
    {
      name: "idx_username",
      columns: ["username"],
      type: "INDEX",
      unique: false,
      required: true,
    },
    {
      name: "idx_email",
      columns: ["email"],
      type: "INDEX",
      unique: false,
      required: true,
    },
  ],
  character_cards: [
    {
      name: "PRIMARY",
      columns: ["id"],
      type: "PRIMARY KEY",
      unique: true,
      required: true,
    },
    {
      name: "card_id",
      columns: ["card_id"],
      type: "UNIQUE",
      unique: true,
      required: true,
    },
    {
      name: "idx_card_id",
      columns: ["card_id"],
      type: "INDEX",
      unique: false,
      required: true,
    },
    {
      name: "idx_user_id",
      columns: ["user_id"],
      type: "INDEX",
      unique: false,
      required: true,
    },
    {
      name: "user_id",
      columns: ["user_id"],
      type: "FOREIGN KEY",
      unique: false,
      required: true,
    },
  ],
};

// ============================================================================
// 索引查询函数
// ============================================================================

/**
 * 获取表的所有索引
 * @param {string} tableName 表名
 * @returns {Promise<Array>} 索引列表
 */
async function getTableIndexes(tableName) {
  const pool = getPool();
  const [rows] = await pool.execute("SHOW INDEX FROM ??", [tableName]);
  return rows;
}

/**
 * 格式化索引信息
 * @param {Array} rawIndexes 原始索引数据
 * @returns {Object} 格式化后的索引映射
 */
function formatIndexes(rawIndexes) {
  const indexMap = {};

  rawIndexes.forEach((row) => {
    const indexName = row.Key_name;

    if (!indexMap[indexName]) {
      indexMap[indexName] = {
        name: indexName,
        columns: [],
        unique: row.Non_unique === 0,
        type:
          row.Key_name === "PRIMARY"
            ? "PRIMARY KEY"
            : row.Non_unique === 0
              ? "UNIQUE"
              : "INDEX",
      };
    }

    indexMap[indexName].columns.push(row.Column_name);
  });

  return indexMap;
}

// ============================================================================
// 索引验证函数
// ============================================================================

/**
 * 验证单个表的索引
 * @param {string} tableName 表名
 * @returns {Promise<Object>} 验证结果
 */
async function verifyTableIndexes(tableName) {
  console.log(`\n检查表: ${tableName}`);
  console.log("=".repeat(60));

  const rawIndexes = await getTableIndexes(tableName);
  const actualIndexes = formatIndexes(rawIndexes);
  const expectedIndexes = EXPECTED_INDEXES[tableName] || [];

  const results = {
    tableName,
    passed: true,
    missing: [],
    extra: [],
    details: [],
  };

  // 检查必需的索引是否存在
  expectedIndexes.forEach((expected) => {
    if (!expected.required) return;

    const actual = actualIndexes[expected.name];

    if (!actual) {
      results.passed = false;
      results.missing.push(expected);
      console.log(`❌ 缺少索引: ${expected.name} (${expected.type})`);
    } else {
      // 验证索引列
      const expectedCols = expected.columns.sort().join(",");
      const actualCols = actual.columns.sort().join(",");

      if (expectedCols === actualCols) {
        console.log(`✅ 索引正常: ${expected.name} on (${actualCols})`);
        results.details.push({
          name: expected.name,
          status: "OK",
          columns: actual.columns,
        });
      } else {
        results.passed = false;
        console.log(`⚠️  索引列不匹配: ${expected.name}`);
        console.log(`   期望: (${expectedCols})`);
        console.log(`   实际: (${actualCols})`);
        results.details.push({
          name: expected.name,
          status: "MISMATCH",
          expected: expected.columns,
          actual: actual.columns,
        });
      }
    }
  });

  return results;
}

/**
 * 验证所有表的索引
 * @returns {Promise<Object>} 总体验证结果
 */
async function verifyAllIndexes() {
  console.log("\n数据库索引验证");
  console.log("=".repeat(60));

  const tables = Object.keys(EXPECTED_INDEXES);
  const results = {
    passed: true,
    tables: {},
  };

  for (const tableName of tables) {
    const tableResult = await verifyTableIndexes(tableName);
    results.tables[tableName] = tableResult;

    if (!tableResult.passed) {
      results.passed = false;
    }
  }

  return results;
}

// ============================================================================
// 索引性能分析
// ============================================================================

/**
 * 分析索引使用情况
 * @returns {Promise<void>}
 */
async function analyzeIndexUsage() {
  console.log("\n\n索引使用情况分析");
  console.log("=".repeat(60));

  const pool = getPool();

  try {
    // 查询索引统计信息（MySQL 5.6+）
    const [stats] = await pool.execute(`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        CARDINALITY,
        SEQ_IN_INDEX,
        COLUMN_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('users', 'character_cards')
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `);

    console.log("\n索引基数统计（CARDINALITY）：");
    console.log("基数越高，索引选择性越好\n");

    let currentTable = "";
    let currentIndex = "";

    stats.forEach((stat) => {
      if (stat.TABLE_NAME !== currentTable) {
        currentTable = stat.TABLE_NAME;
        console.log(`\n表: ${currentTable}`);
      }

      if (stat.INDEX_NAME !== currentIndex) {
        currentIndex = stat.INDEX_NAME;
        console.log(`  索引: ${currentIndex}`);
      }

      console.log(
        `    列: ${stat.COLUMN_NAME}, 基数: ${stat.CARDINALITY || "N/A"}`,
      );
    });
  } catch (error) {
    console.log("⚠️  无法获取索引统计信息:", error.message);
  }
}

// ============================================================================
// 优化建议
// ============================================================================

/**
 * 提供索引优化建议
 * @param {Object} results 验证结果
 */
function provideOptimizationSuggestions(results) {
  console.log("\n\n索引优化建议");
  console.log("=".repeat(60));

  let hasSuggestions = false;

  // 检查缺失的索引
  Object.values(results.tables).forEach((tableResult) => {
    if (tableResult.missing.length > 0) {
      hasSuggestions = true;
      console.log(`\n表 ${tableResult.tableName} 缺少以下索引：`);
      tableResult.missing.forEach((idx) => {
        console.log(`  - ${idx.name} on (${idx.columns.join(", ")})`);
        console.log(
          `    建议: ALTER TABLE ${tableResult.tableName} ADD INDEX ${idx.name} (${idx.columns.join(", ")});`,
        );
      });
    }
  });

  // 通用优化建议
  console.log("\n通用优化建议：");
  console.log("  1. 定期运行 ANALYZE TABLE 更新索引统计信息");
  console.log("  2. 监控慢查询日志，识别需要优化的查询");
  console.log("  3. 对于高频查询的列，确保有适当的索引");
  console.log(
    "  4. 避免在小表上创建过多索引（users 和 character_cards 都是小表）",
  );
  console.log("  5. 定期检查索引碎片，必要时重建索引");

  if (!hasSuggestions) {
    console.log("\n✅ 所有必要的索引都已正确创建！");
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  try {
    // 初始化数据库连接
    await initializeWithRetry();

    // 验证索引
    const results = await verifyAllIndexes();

    // 分析索引使用情况
    await analyzeIndexUsage();

    // 提供优化建议
    provideOptimizationSuggestions(results);

    // 输出总结
    console.log("\n\n验证总结");
    console.log("=".repeat(60));
    if (results.passed) {
      console.log("✅ 所有索引验证通过！");
      process.exit(0);
    } else {
      console.log("❌ 索引验证失败，请检查上述问题");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ 验证过程出错:", error.message);
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
  verifyTableIndexes,
  verifyAllIndexes,
  analyzeIndexUsage,
};

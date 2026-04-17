/**
 * 数据库连接测试脚本
 *
 * 用途：手动测试数据库连接是否正常工作
 * 使用方法：node scripts/test-db-connection.js
 */

require("dotenv").config();
const db = require("../src/db/connection");

async function testDatabaseConnection() {
  console.log("=".repeat(60));
  console.log("数据库连接测试");
  console.log("=".repeat(60));

  try {
    // 1. 显示配置信息
    console.log("\n1. 数据库配置:");
    const config = db.getDatabaseConfig();
    console.log(`   主机: ${config.host}:${config.port}`);
    console.log(`   用户: ${config.user}`);
    console.log(`   数据库: ${config.database}`);
    console.log(`   字符集: ${config.charset}`);
    console.log(`   连接池大小: ${config.connectionLimit}`);

    // 2. 初始化连接（带重试）
    console.log("\n2. 初始化数据库连接（最多重试3次）...");
    await db.initializeWithRetry();

    // 3. 检查连接状态
    console.log("\n3. 检查连接状态:");
    console.log(
      `   连接状态: ${db.isConnectionActive() ? "✅ 已连接" : "❌ 未连接"}`,
    );

    // 4. 执行健康检查
    console.log("\n4. 执行健康检查:");
    const health = await db.healthCheck();
    console.log(`   状态: ${health.status}`);
    console.log(`   健康: ${health.healthy ? "✅ 是" : "❌ 否"}`);
    console.log(`   消息: ${health.message}`);

    // 5. 执行测试查询
    console.log("\n5. 执行测试查询:");

    // 5.1 简单查询
    console.log("   5.1 简单查询 (SELECT 1 + 1):");
    const result1 = await db.query("SELECT 1 + 1 AS result");
    console.log(`       结果: ${result1[0].result}`);

    // 5.2 带参数的查询
    console.log("   5.2 参数化查询 (SELECT ? AS value):");
    const result2 = await db.query("SELECT ? AS value", ["测试值"]);
    console.log(`       结果: ${result2[0].value}`);

    // 5.3 获取数据库版本
    console.log("   5.3 数据库版本:");
    const result3 = await db.query("SELECT VERSION() AS version");
    console.log(`       版本: ${result3[0].version}`);

    // 5.4 获取当前时间
    console.log("   5.4 数据库当前时间:");
    const result4 = await db.query("SELECT NOW() AS current_time");
    console.log(`       时间: ${result4[0].current_time}`);

    // 6. 测试事务
    console.log("\n6. 测试事务:");
    const transactionResult = await db.transaction(async (connection) => {
      const [rows] = await connection.execute(
        'SELECT "事务测试成功" AS message',
      );
      return rows[0].message;
    });
    console.log(`   事务结果: ${transactionResult}`);

    // 7. 测试完成
    console.log("\n" + "=".repeat(60));
    console.log("✅ 所有测试通过！数据库连接正常工作");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ 测试失败:", error.message);
    console.error("=".repeat(60));
    console.error("\n详细错误信息:");
    console.error(error);
    process.exit(1);
  } finally {
    // 关闭连接
    console.log("\n正在关闭数据库连接...");
    await db.closePool();
    console.log("✅ 数据库连接已关闭\n");
  }
}

// 运行测试
testDatabaseConnection();

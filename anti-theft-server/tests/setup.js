/**
 * Jest 测试环境设置
 *
 * 在所有测试运行前设置必要的环境变量
 */

// 设置测试环境变量
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-secret-key-for-integration-testing-do-not-use-in-production";

// 数据库配置 - 从实际环境变量读取或使用默认测试值
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "3306";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "";
process.env.DB_NAME = process.env.DB_NAME || "character_card_anti_theft_test";

// CORS 配置
process.env.CORS_ORIGINS = "http://localhost:8000,http://127.0.0.1:8000";

// 设置测试超时时间（30秒）
jest.setTimeout(30000);

// 禁用控制台输出以保持测试输出清晰（可选）
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// };

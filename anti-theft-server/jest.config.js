/**
 * Jest 配置文件
 */

module.exports = {
  // 测试环境
  testEnvironment: "node",

  // 测试文件匹配模式
  testMatch: ["**/tests/**/*.test.js", "**/?(*.)+(spec|test).js"],

  // 覆盖率收集配置
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js", // 排除服务器入口文件
    "!**/node_modules/**",
    "!**/tests/**",
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // 设置文件
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // 测试超时时间（毫秒）
  testTimeout: 30000,

  // 详细输出
  verbose: true,

  // 强制退出（防止测试挂起）
  forceExit: true,

  // 检测打开的句柄
  detectOpenHandles: true,
};

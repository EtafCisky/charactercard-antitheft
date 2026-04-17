#!/usr/bin/env node

/**
 * 环境变量验证脚本
 *
 * 用途：
 * - 验证所有必需的环境变量是否已设置
 * - 检查环境变量的格式和值是否有效
 * - 提供详细的错误信息和修复建议
 *
 * 使用方法：
 * node scripts/validate-env.js
 * 或
 * npm run validate:env
 */

require("dotenv").config();
const crypto = require("crypto");

// ANSI 颜色代码
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

// 验证结果
const results = {
  errors: [],
  warnings: [],
  info: [],
};

/**
 * 打印带颜色的消息
 */
function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 添加错误
 */
function addError(field, message, suggestion) {
  results.errors.push({ field, message, suggestion });
}

/**
 * 添加警告
 */
function addWarning(field, message, suggestion) {
  results.warnings.push({ field, message, suggestion });
}

/**
 * 添加信息
 */
function addInfo(field, message) {
  results.info.push({ field, message });
}

/**
 * 验证必需字段
 */
function validateRequired(field, value, description) {
  if (!value || value.trim() === "") {
    addError(field, `${description}未设置`, `请在 .env 文件中设置 ${field}`);
    return false;
  }
  return true;
}

/**
 * 验证 NODE_ENV
 */
function validateNodeEnv() {
  const value = process.env.NODE_ENV;

  if (!validateRequired("NODE_ENV", value, "运行环境")) {
    return;
  }

  const validValues = ["development", "production", "test"];
  if (!validValues.includes(value)) {
    addError(
      "NODE_ENV",
      `无效的值: ${value}`,
      `必须是以下值之一: ${validValues.join(", ")}`,
    );
  } else {
    addInfo("NODE_ENV", `运行环境: ${value}`);
  }
}

/**
 * 验证端口号
 */
function validatePort() {
  const value = process.env.SERVER_PORT;

  if (!validateRequired("SERVER_PORT", value, "服务器端口")) {
    return;
  }

  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    addError(
      "SERVER_PORT",
      `无效的端口号: ${value}`,
      "端口号必须是 1-65535 之间的整数",
    );
  } else if (port < 1024 && process.platform !== "win32") {
    addWarning(
      "SERVER_PORT",
      `使用特权端口: ${port}`,
      "端口号小于 1024 需要 root 权限，建议使用 3000-9000",
    );
  } else {
    addInfo("SERVER_PORT", `服务器端口: ${port}`);
  }
}

/**
 * 验证数据库配置
 */
function validateDatabase() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;

  validateRequired("DB_HOST", host, "数据库主机");
  validateRequired("DB_PORT", port, "数据库端口");
  validateRequired("DB_USER", user, "数据库用户名");
  validateRequired("DB_NAME", name, "数据库名称");

  // 验证端口
  if (port) {
    const dbPort = parseInt(port, 10);
    if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
      addError(
        "DB_PORT",
        `无效的端口号: ${port}`,
        "端口号必须是 1-65535 之间的整数",
      );
    }
  }

  // 检查密码（生产环境）
  if (process.env.NODE_ENV === "production") {
    if (!password || password.trim() === "") {
      addError(
        "DB_PASSWORD",
        "生产环境必须设置数据库密码",
        "请设置强密码（至少 16 字符）",
      );
    } else if (password.length < 16) {
      addWarning(
        "DB_PASSWORD",
        "数据库密码过短",
        "建议使用至少 16 字符的强密码",
      );
    }
  }

  // 检查是否使用 root 用户
  if (user === "root") {
    addWarning(
      "DB_USER",
      "使用 root 用户连接数据库",
      "建议创建专用数据库用户以提高安全性",
    );
  }
}

/**
 * 验证 JWT 配置
 */
function validateJWT() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!validateRequired("JWT_SECRET", secret, "JWT 密钥")) {
    return;
  }

  // 检查密钥强度
  if (process.env.NODE_ENV === "production") {
    // 检查是否是默认值
    const defaultSecrets = [
      "your_jwt_secret_key_here_please_change_this_to_a_random_string",
      "dev_jwt_secret_key_for_testing_only",
      "change_this",
      "secret",
      "jwt_secret",
    ];

    if (
      defaultSecrets.some((def) =>
        secret.toLowerCase().includes(def.toLowerCase()),
      )
    ) {
      addError(
        "JWT_SECRET",
        "使用了默认或不安全的 JWT 密钥",
        "请使用以下命令生成随机密钥:\nnode -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
      );
    } else if (secret.length < 32) {
      addWarning(
        "JWT_SECRET",
        "JWT 密钥过短",
        "建议使用至少 64 字节（128 个十六进制字符）的随机字符串",
      );
    } else if (!/^[a-f0-9]+$/i.test(secret)) {
      addWarning(
        "JWT_SECRET",
        "JWT 密钥不是十六进制格式",
        "建议使用 crypto.randomBytes() 生成的十六进制字符串",
      );
    }
  }

  // 验证过期时间格式
  if (expiresIn) {
    const validPattern = /^\d+[smhd]$/;
    if (!validPattern.test(expiresIn)) {
      addError(
        "JWT_EXPIRES_IN",
        `无效的过期时间格式: ${expiresIn}`,
        "格式示例: 60s, 2m, 2h, 7d",
      );
    }
  }
}

/**
 * 验证 CORS 配置
 */
function validateCORS() {
  const origins = process.env.CORS_ORIGINS;

  if (!validateRequired("CORS_ORIGINS", origins, "CORS 允许的来源")) {
    return;
  }

  const originList = origins.split(",").map((o) => o.trim());

  // 检查是否使用通配符
  if (originList.includes("*")) {
    addError(
      "CORS_ORIGINS",
      "使用了通配符 * 允许所有来源",
      "这是严重的安全风险，请明确指定允许的域名",
    );
  }

  // 验证每个来源的格式
  originList.forEach((origin) => {
    if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
      addWarning(
        "CORS_ORIGINS",
        `来源缺少协议: ${origin}`,
        "请添加 http:// 或 https:// 前缀",
      );
    }

    if (origin.endsWith("/")) {
      addWarning(
        "CORS_ORIGINS",
        `来源末尾有斜杠: ${origin}`,
        "请移除末尾的斜杠",
      );
    }
  });

  // 生产环境检查
  if (process.env.NODE_ENV === "production") {
    const hasLocalhost = originList.some(
      (o) => o.includes("localhost") || o.includes("127.0.0.1"),
    );

    if (hasLocalhost) {
      addWarning(
        "CORS_ORIGINS",
        "生产环境包含 localhost 来源",
        "生产环境不应该允许 localhost 访问",
      );
    }

    const hasHttp = originList.some((o) => o.startsWith("http://"));
    if (hasHttp) {
      addWarning(
        "CORS_ORIGINS",
        "生产环境包含 HTTP 来源",
        "生产环境应该只使用 HTTPS",
      );
    }
  }

  addInfo("CORS_ORIGINS", `允许 ${originList.length} 个来源`);
}

/**
 * 验证速率限制配置
 */
function validateRateLimit() {
  const windowMs = process.env.RATE_LIMIT_WINDOW_MS;
  const maxPerIp = process.env.RATE_LIMIT_MAX_REQUESTS_PER_IP;
  const maxPerCard = process.env.RATE_LIMIT_MAX_REQUESTS_PER_CARD;

  // 验证时间窗口
  if (windowMs) {
    const ms = parseInt(windowMs, 10);
    if (isNaN(ms) || ms < 1000) {
      addError(
        "RATE_LIMIT_WINDOW_MS",
        `无效的时间窗口: ${windowMs}`,
        "必须是至少 1000 毫秒的整数",
      );
    }
  }

  // 验证 IP 限制
  if (maxPerIp) {
    const max = parseInt(maxPerIp, 10);
    if (isNaN(max) || max < 1) {
      addError(
        "RATE_LIMIT_MAX_REQUESTS_PER_IP",
        `无效的限制值: ${maxPerIp}`,
        "必须是正整数",
      );
    } else if (process.env.NODE_ENV === "production" && max > 100) {
      addWarning(
        "RATE_LIMIT_MAX_REQUESTS_PER_IP",
        `速率限制过于宽松: ${max}`,
        "生产环境建议设置为 10-20",
      );
    }
  }

  // 验证 Card 限制
  if (maxPerCard) {
    const max = parseInt(maxPerCard, 10);
    if (isNaN(max) || max < 1) {
      addError(
        "RATE_LIMIT_MAX_REQUESTS_PER_CARD",
        `无效的限制值: ${maxPerCard}`,
        "必须是正整数",
      );
    } else if (process.env.NODE_ENV === "production" && max > 20) {
      addWarning(
        "RATE_LIMIT_MAX_REQUESTS_PER_CARD",
        `速率限制过于宽松: ${max}`,
        "生产环境建议设置为 5-10 以防止暴力破解",
      );
    }
  }
}

/**
 * 验证日志配置
 */
function validateLogging() {
  const level = process.env.LOG_LEVEL;

  if (level) {
    const validLevels = [
      "error",
      "warn",
      "info",
      "http",
      "verbose",
      "debug",
      "silly",
    ];
    if (!validLevels.includes(level)) {
      addError(
        "LOG_LEVEL",
        `无效的日志级别: ${level}`,
        `必须是以下值之一: ${validLevels.join(", ")}`,
      );
    } else if (
      process.env.NODE_ENV === "production" &&
      ["debug", "silly"].includes(level)
    ) {
      addWarning(
        "LOG_LEVEL",
        `生产环境使用了详细日志级别: ${level}`,
        "生产环境建议使用 info 或 warn",
      );
    }
  }
}

/**
 * 验证 Bcrypt 配置
 */
function validateBcrypt() {
  const rounds = process.env.BCRYPT_SALT_ROUNDS;

  if (rounds) {
    const r = parseInt(rounds, 10);
    if (isNaN(r) || r < 4 || r > 31) {
      addError(
        "BCRYPT_SALT_ROUNDS",
        `无效的 salt rounds: ${rounds}`,
        "必须是 4-31 之间的整数，推荐 10-12",
      );
    } else if (r < 10) {
      addWarning(
        "BCRYPT_SALT_ROUNDS",
        `Salt rounds 过低: ${r}`,
        "推荐使用 10-12 以提高安全性",
      );
    } else if (r > 14) {
      addWarning(
        "BCRYPT_SALT_ROUNDS",
        `Salt rounds 过高: ${r}`,
        "可能导致性能问题，推荐使用 10-12",
      );
    }
  }
}

/**
 * 打印验证结果
 */
function printResults() {
  console.log("\n");
  log("═══════════════════════════════════════════════════════", "cyan");
  log("           环境变量验证结果", "cyan");
  log("═══════════════════════════════════════════════════════", "cyan");
  console.log("\n");

  // 打印错误
  if (results.errors.length > 0) {
    log(`❌ 发现 ${results.errors.length} 个错误:\n`, "red");
    results.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.field}`, "bold");
      log(`   错误: ${error.message}`, "red");
      log(`   建议: ${error.suggestion}`, "yellow");
      console.log("");
    });
  }

  // 打印警告
  if (results.warnings.length > 0) {
    log(`⚠️  发现 ${results.warnings.length} 个警告:\n`, "yellow");
    results.warnings.forEach((warning, index) => {
      log(`${index + 1}. ${warning.field}`, "bold");
      log(`   警告: ${warning.message}`, "yellow");
      log(`   建议: ${warning.suggestion}`, "cyan");
      console.log("");
    });
  }

  // 打印信息
  if (results.info.length > 0) {
    log(`ℹ️  配置信息:\n`, "blue");
    results.info.forEach((info) => {
      log(`   ${info.field}: ${info.message}`, "blue");
    });
    console.log("");
  }

  // 总结
  log("═══════════════════════════════════════════════════════", "cyan");
  if (results.errors.length === 0 && results.warnings.length === 0) {
    log("✅ 所有环境变量配置正确！", "green");
  } else if (results.errors.length === 0) {
    log("✅ 环境变量配置有效，但有一些建议需要注意", "green");
  } else {
    log("❌ 环境变量配置有错误，请修复后再启动服务器", "red");
  }
  log("═══════════════════════════════════════════════════════", "cyan");
  console.log("\n");
}

/**
 * 主函数
 */
function main() {
  log("\n开始验证环境变量配置...\n", "cyan");

  // 检查 .env 文件是否存在
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    log("❌ 错误: .env 文件不存在", "red");
    log("建议: 复制 .env.example 或 .env.production 为 .env", "yellow");
    process.exit(1);
  }

  // 执行所有验证
  validateNodeEnv();
  validatePort();
  validateDatabase();
  validateJWT();
  validateCORS();
  validateRateLimit();
  validateLogging();
  validateBcrypt();

  // 打印结果
  printResults();

  // 返回退出码
  if (results.errors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// 运行主函数
main();

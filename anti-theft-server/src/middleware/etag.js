/**
 * ETag 缓存中间件
 *
 * 功能：
 * - 为 GET 请求生成 ETag
 * - 支持条件请求（If-None-Match）
 * - 减少带宽使用和提高响应速度
 *
 * 使用方式：
 * router.get('/api/cards', authenticateToken, etagMiddleware, handler);
 */

const etag = require("etag");
const crypto = require("crypto");

/**
 * ETag 中间件
 *
 * 工作原理：
 * 1. 拦截响应的 json() 方法
 * 2. 根据响应内容生成 ETag
 * 3. 检查客户端的 If-None-Match 头
 * 4. 如果 ETag 匹配，返回 304 Not Modified
 * 5. 否则返回完整响应和新的 ETag
 */
function etagMiddleware(req, res, next) {
  // 只处理 GET 和 HEAD 请求
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  // 保存原始的 json 方法
  const originalJson = res.json.bind(res);

  // 重写 json 方法
  res.json = function (data) {
    // 生成响应内容的字符串表示
    const content = JSON.stringify(data);

    // 生成 ETag（使用 etag 库，基于内容的 MD5 哈希）
    const generatedEtag = etag(content);

    // 设置 ETag 头
    res.setHeader("ETag", generatedEtag);

    // 设置 Cache-Control 头（允许缓存但需要验证）
    res.setHeader("Cache-Control", "no-cache");

    // 检查客户端的 If-None-Match 头
    const clientEtag = req.headers["if-none-match"];

    if (clientEtag && clientEtag === generatedEtag) {
      // ETag 匹配，返回 304 Not Modified
      res.status(304).end();
    } else {
      // ETag 不匹配或客户端没有提供，返回完整响应
      originalJson(data);
    }
  };

  next();
}

/**
 * 强 ETag 生成器（基于内容的 SHA256 哈希）
 *
 * 用于需要更强验证的场景
 *
 * @param {string} content - 响应内容
 * @returns {string} ETag 值
 */
function generateStrongEtag(content) {
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  return `"${hash.substring(0, 32)}"`;
}

/**
 * 弱 ETag 生成器（基于内容长度和修改时间）
 *
 * 用于性能优先的场景
 *
 * @param {string} content - 响应内容
 * @param {Date} mtime - 修改时间
 * @returns {string} ETag 值
 */
function generateWeakEtag(content, mtime) {
  const size = Buffer.byteLength(content);
  const timestamp = mtime ? mtime.getTime() : Date.now();
  return `W/"${size.toString(16)}-${timestamp.toString(16)}"`;
}

/**
 * 条件请求中间件（支持 If-Modified-Since）
 *
 * 配合 Last-Modified 头使用
 */
function conditionalRequestMiddleware(req, res, next) {
  // 只处理 GET 和 HEAD 请求
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  // 保存原始的 json 方法
  const originalJson = res.json.bind(res);

  // 重写 json 方法
  res.json = function (data) {
    // 如果数据包含 updated_at 字段，设置 Last-Modified 头
    if (data.updated_at) {
      const lastModified = new Date(data.updated_at).toUTCString();
      res.setHeader("Last-Modified", lastModified);

      // 检查 If-Modified-Since 头
      const ifModifiedSince = req.headers["if-modified-since"];
      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        const resourceDate = new Date(data.updated_at);

        if (resourceDate <= clientDate) {
          // 资源未修改，返回 304
          return res.status(304).end();
        }
      }
    }

    // 资源已修改或客户端没有提供 If-Modified-Since，返回完整响应
    originalJson(data);
  };

  next();
}

module.exports = {
  etagMiddleware,
  conditionalRequestMiddleware,
  generateStrongEtag,
  generateWeakEtag,
};

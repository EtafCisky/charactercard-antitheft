# 安全头部配置文档

本文档说明了 SillyTavern 角色卡防盗系统服务器的安全头部配置。

## 概述

服务器使用 [Helmet](https://helmetjs.github.io/) 中间件来设置各种 HTTP 安全头部，以保护应用免受常见的 Web 漏洞攻击。

## 已配置的安全头部

### 1. HSTS (HTTP Strict Transport Security)

**作用**: 强制浏览器使用 HTTPS 连接，防止中间人攻击。

**配置**:
```javascript
hsts: {
  maxAge: 31536000,        // 1 年（秒）
  includeSubDomains: true, // 包括所有子域名
  preload: true            // 允许加入 HSTS 预加载列表
}
```

**响应头部**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**说明**:
- `maxAge`: 浏览器记住该设置的时间（1年）
- `includeSubDomains`: 该规则也适用于所有子域名
- `preload`: 允许网站加入浏览器的 HSTS 预加载列表

**安全效果**:
- 防止 SSL 剥离攻击
- 确保所有通信都通过 HTTPS 进行
- 即使用户输入 http://，浏览器也会自动转换为 https://

---

### 2. X-Content-Type-Options

**作用**: 防止浏览器进行 MIME 类型嗅探，减少 XSS 攻击风险。

**配置**:
```javascript
noSniff: true
```

**响应头部**:
```
X-Content-Type-Options: nosniff
```

**说明**:
- 强制浏览器遵守服务器声明的 Content-Type
- 防止浏览器将非可执行的 MIME 类型解释为可执行内容

**安全效果**:
- 防止攻击者上传恶意文件并诱使浏览器执行
- 例如：上传的 .txt 文件不会被浏览器当作 JavaScript 执行

---

### 3. X-Frame-Options

**作用**: 防止点击劫持（Clickjacking）攻击。

**配置**:
```javascript
frameguard: {
  action: 'deny'  // 完全禁止在 iframe 中加载
}
```

**响应头部**:
```
X-Frame-Options: DENY
```

**说明**:
- `DENY`: 完全禁止页面在任何 iframe 中显示
- 其他选项: `SAMEORIGIN`（仅允许同源 iframe）

**安全效果**:
- 防止攻击者将网站嵌入到恶意页面的 iframe 中
- 防止用户在不知情的情况下点击隐藏的按钮或链接

---

### 4. Content Security Policy (CSP)

**作用**: 定义允许加载资源的来源，防止 XSS 攻击和数据注入攻击。

**配置**:
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],                    // 默认只允许同源资源
    scriptSrc: ["'self'"],                     // 只允许同源脚本
    styleSrc: ["'self'", "'unsafe-inline'"],   // 允许同源样式和内联样式
    imgSrc: ["'self'", "data:", "https:"],     // 允许同源图片、data URI 和 HTTPS 图片
    connectSrc: ["'self'"],                    // 只允许同源 AJAX/WebSocket 连接
    fontSrc: ["'self'"],                       // 只允许同源字体
    objectSrc: ["'none'"],                     // 禁止 <object>、<embed>、<applet>
    mediaSrc: ["'self'"],                      // 只允许同源媒体
    frameSrc: ["'none'"],                      // 禁止嵌入 iframe
    upgradeInsecureRequests: []                // 自动将 HTTP 请求升级为 HTTPS
  }
}
```

**响应头部**:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none'; upgrade-insecure-requests
```

**各指令说明**:

| 指令                        | 说明                          | 配置值                                            |
| --------------------------- | ----------------------------- | ------------------------------------------------- |
| `default-src`               | 默认策略，作为其他指令的后备  | `'self'` - 仅同源                                 |
| `script-src`                | 控制 JavaScript 来源          | `'self'` - 仅同源脚本                             |
| `style-src`                 | 控制 CSS 样式来源             | `'self'` `'unsafe-inline'` - 同源和内联样式       |
| `img-src`                   | 控制图片来源                  | `'self'` `data:` `https:` - 同源、data URI、HTTPS |
| `connect-src`               | 控制 AJAX/WebSocket 连接      | `'self'` - 仅同源连接                             |
| `font-src`                  | 控制字体来源                  | `'self'` - 仅同源字体                             |
| `object-src`                | 控制 `<object>`、`<embed>` 等 | `'none'` - 完全禁止                               |
| `media-src`                 | 控制音视频来源                | `'self'` - 仅同源媒体                             |
| `frame-src`                 | 控制 iframe 来源              | `'none'` - 禁止嵌入 iframe                        |
| `upgrade-insecure-requests` | 自动升级 HTTP 为 HTTPS        | 启用                                              |

**安全效果**:
- 防止 XSS 攻击（跨站脚本攻击）
- 防止数据注入攻击
- 防止未授权的资源加载
- 自动升级不安全的 HTTP 请求为 HTTPS

---

### 5. 其他安全头部

#### X-Powered-By

**作用**: 隐藏服务器技术栈信息。

**配置**:
```javascript
hidePoweredBy: true
```

**效果**: 移除 `X-Powered-By: Express` 头部，防止攻击者获取服务器技术信息。

---

#### X-DNS-Prefetch-Control

**作用**: 控制浏览器的 DNS 预取功能。

**配置**:
```javascript
dnsPrefetchControl: {
  allow: false
}
```

**响应头部**:
```
X-DNS-Prefetch-Control: off
```

**效果**: 禁用 DNS 预取，防止隐私泄露。

---

## 验证安全头部

### 使用 curl 验证

```bash
curl -I https://your-server.com/health
```

### 使用在线工具

- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

### 使用浏览器开发者工具

1. 打开浏览器开发者工具（F12）
2. 访问服务器 URL
3. 查看 Network 标签
4. 检查响应头部

---

## 测试

运行安全头部测试：

```bash
npm test tests/unit/helmet.test.js
```

测试覆盖：
- ✅ HSTS 配置验证
- ✅ X-Content-Type-Options 验证
- ✅ X-Frame-Options 验证
- ✅ CSP 配置验证
- ✅ 其他安全头部验证
- ✅ 所有端点应用验证

---

## 自定义配置

如果需要修改 CSP 策略（例如允许外部 CDN），编辑 `src/server.js`：

```javascript
// 示例：允许从 CDN 加载脚本
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.example.com"],
      // ... 其他配置
    },
  })
);
```

**注意**: 修改 CSP 策略时要谨慎，过于宽松的策略会降低安全性。

---

## 生产环境建议

1. **启用 HTTPS**: HSTS 只在 HTTPS 环境下有效
2. **定期审查**: 定期检查安全头部配置是否符合最新的安全标准
3. **监控日志**: 监控 CSP 违规报告（可配置 `report-uri`）
4. **测试兼容性**: 确保 CSP 策略不会破坏应用功能

---

## 参考资源

- [Helmet 官方文档](https://helmetjs.github.io/)
- [OWASP 安全头部项目](https://owasp.org/www-project-secure-headers/)
- [MDN Web 安全](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy 参考](https://content-security-policy.com/)

---

## 更新日志

- **2026-04-17**: 初始配置，实现所有核心安全头部

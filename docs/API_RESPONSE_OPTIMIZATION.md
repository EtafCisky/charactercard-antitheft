# API 响应优化文档

本文档描述了服务器实现的 API 响应优化功能，包括 gzip 压缩、分页查询、字段选择和 ETag 缓存。

## 1. Gzip 压缩

### 功能说明

服务器自动对所有响应启用 gzip 压缩，减少网络传输数据量，提高响应速度。

### 配置参数

- **压缩级别**: 6（平衡压缩率和速度）
- **压缩阈值**: 1KB（只压缩大于 1KB 的响应）
- **自动检测**: 根据客户端的 `Accept-Encoding` 头自动启用

### 使用方式

客户端无需特殊配置，浏览器和现代 HTTP 客户端会自动处理 gzip 压缩。

### 禁用压缩

如果需要禁用特定请求的压缩，可以添加请求头：

```
X-No-Compression: true
```

### 示例

```bash
# 自动启用 gzip 压缩
curl -H "Accept-Encoding: gzip" https://api.example.com/api/cards

# 禁用压缩
curl -H "X-No-Compression: true" https://api.example.com/api/cards
```

---

## 2. 分页查询

### 功能说明

角色卡列表接口支持分页查询，避免一次性返回大量数据。

### 支持的端点

- `GET /api/cards` - 获取角色卡列表

### 查询参数

| 参数    | 类型   | 默认值 | 说明                 |
| ------- | ------ | ------ | -------------------- |
| `page`  | number | 1      | 页码（从 1 开始）    |
| `limit` | number | 10     | 每页数量（最大 100） |

### 响应格式

```json
{
  "success": true,
  "cards": [
    {
      "id": 1,
      "card_id": "123456",
      "card_name": "角色卡名称",
      "password_version": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 示例

```bash
# 获取第一页（默认每页 10 条）
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/cards

# 获取第二页，每页 20 条
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/cards?page=2&limit=20"

# 获取所有数据（每页 100 条）
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/cards?limit=100"
```

---

## 3. 字段选择

### 功能说明

客户端可以指定只返回需要的字段，减少响应数据量。

### 支持的端点

- `GET /api/cards` - 获取角色卡列表

### 查询参数

| 参数     | 类型   | 说明               |
| -------- | ------ | ------------------ |
| `fields` | string | 逗号分隔的字段列表 |

### 可用字段

- `id` - 数据库 ID
- `card_id` - 角色卡 ID
- `card_name` - 角色卡名称
- `password_version` - 密码版本号
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 示例

```bash
# 只返回 card_id 和 card_name
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/cards?fields=card_id,card_name"

# 只返回 id 和 password_version
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/cards?fields=id,password_version"

# 结合分页使用
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/cards?page=1&limit=20&fields=card_id,card_name"
```

### 响应示例

```json
{
  "success": true,
  "cards": [
    {
      "card_id": "123456",
      "card_name": "角色卡名称"
    },
    {
      "card_id": "789012",
      "card_name": "另一个角色卡"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 注意事项

- 如果指定的字段不在允许列表中，将被忽略
- 如果没有有效字段，将返回所有字段（默认行为）
- 字段名称区分大小写

---

## 4. ETag 缓存

### 功能说明

服务器为 GET 请求生成 ETag，支持条件请求，减少不必要的数据传输。

### 支持的端点

- `GET /api/cards` - 获取角色卡列表
- `GET /api/cards/:id` - 获取单个角色卡详情
- `GET /api/verify/cards/:card_id/version` - 获取密码版本号

### 工作原理

1. **首次请求**: 服务器返回完整响应和 ETag 头
2. **后续请求**: 客户端发送 `If-None-Match` 头（包含 ETag 值）
3. **内容未变**: 服务器返回 `304 Not Modified`（无响应体）
4. **内容已变**: 服务器返回 `200 OK` 和新的 ETag

### 响应头

| 头部            | 说明                                |
| --------------- | ----------------------------------- |
| `ETag`          | 响应内容的唯一标识符                |
| `Cache-Control` | 缓存策略（`no-cache` 表示需要验证） |

### 示例

```bash
# 首次请求
curl -i -H "Authorization: Bearer <token>" \
  https://api.example.com/api/cards

# 响应头包含：
# ETag: "abc123def456"
# Cache-Control: no-cache

# 后续请求（使用 If-None-Match）
curl -i -H "Authorization: Bearer <token>" \
  -H "If-None-Match: \"abc123def456\"" \
  https://api.example.com/api/cards

# 如果内容未变，返回：
# HTTP/1.1 304 Not Modified
# ETag: "abc123def456"
# (无响应体)

# 如果内容已变，返回：
# HTTP/1.1 200 OK
# ETag: "xyz789ghi012"
# (完整响应体)
```

### JavaScript 示例

```javascript
// 使用 fetch API 和 ETag
let etag = null;

async function fetchCards() {
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // 如果有 ETag，添加 If-None-Match 头
  if (etag) {
    headers['If-None-Match'] = etag;
  }
  
  const response = await fetch('https://api.example.com/api/cards', {
    headers: headers
  });
  
  if (response.status === 304) {
    // 内容未变，使用缓存数据
    console.log('使用缓存数据');
    return cachedData;
  }
  
  if (response.status === 200) {
    // 保存新的 ETag
    etag = response.headers.get('ETag');
    
    // 解析并缓存数据
    const data = await response.json();
    cachedData = data;
    return data;
  }
}
```

### 注意事项

- ETag 基于响应内容的 MD5 哈希生成
- 内容变化时 ETag 会自动更新
- 只对 GET 和 HEAD 请求生效
- POST、PUT、DELETE 请求不使用 ETag

---

## 性能优化建议

### 1. 组合使用多种优化

```bash
# 同时使用分页、字段选择和 ETag
curl -i -H "Authorization: Bearer <token>" \
  -H "If-None-Match: \"abc123\"" \
  "https://api.example.com/api/cards?page=1&limit=20&fields=card_id,card_name"
```

### 2. 客户端缓存策略

```javascript
// 实现简单的客户端缓存
class ApiClient {
  constructor() {
    this.cache = new Map();
  }
  
  async get(url, options = {}) {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    
    const headers = { ...options.headers };
    if (cached && cached.etag) {
      headers['If-None-Match'] = cached.etag;
    }
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 304) {
      return cached.data;
    }
    
    if (response.status === 200) {
      const data = await response.json();
      const etag = response.headers.get('ETag');
      
      this.cache.set(cacheKey, { data, etag });
      return data;
    }
    
    throw new Error(`HTTP ${response.status}`);
  }
}
```

### 3. 监控优化效果

```bash
# 测试压缩效果
curl -w "Size: %{size_download} bytes\n" \
  -H "Accept-Encoding: gzip" \
  https://api.example.com/api/cards

# 测试 ETag 缓存
curl -w "Status: %{http_code}\n" \
  -H "If-None-Match: \"abc123\"" \
  https://api.example.com/api/cards
```

---

## 故障排查

### 问题 1: 压缩未生效

**症状**: 响应未被压缩

**解决方案**:
1. 检查客户端是否发送 `Accept-Encoding: gzip` 头
2. 检查响应大小是否小于 1KB（低于压缩阈值）
3. 检查是否设置了 `X-No-Compression` 头

### 问题 2: ETag 总是返回 200

**症状**: 即使内容未变，也返回 200 而不是 304

**解决方案**:
1. 检查客户端是否发送 `If-None-Match` 头
2. 检查 ETag 值是否正确（包括引号）
3. 检查是否为 GET 请求（POST/PUT/DELETE 不支持 ETag）

### 问题 3: 字段选择无效

**症状**: 返回了所有字段而不是指定字段

**解决方案**:
1. 检查字段名称是否正确（区分大小写）
2. 检查字段是否在允许列表中
3. 检查 URL 编码是否正确

---

## 性能指标

### 压缩效果

- JSON 响应通常可压缩 70-80%
- 1KB 以下的响应不压缩（避免额外开销）
- 压缩级别 6 提供最佳的压缩率/速度平衡

### ETag 缓存效果

- 304 响应大小: ~200 字节（仅头部）
- 200 响应大小: 取决于数据量
- 节省带宽: 对于未变化的数据可节省 95%+ 带宽

### 分页效果

- 默认每页 10 条，适合移动端
- 最大每页 100 条，适合桌面端
- 减少数据库查询时间和网络传输时间

### 字段选择效果

- 只返回需要的字段可减少 30-70% 响应大小
- 减少 JSON 解析时间
- 降低客户端内存占用

---

## 相关文档

- [API 文档](./API.md)
- [性能优化](./QUERY_OPTIMIZATION.md)
- [数据库优化](./DATABASE_OPTIMIZATION_TASK_25.1.md)

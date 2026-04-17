# 健康检查端点文档

## 概述

健康检查端点用于监控服务器和依赖服务的运行状态。此端点不需要认证，可以被监控系统、负载均衡器或运维工具调用。

## 端点信息

- **URL**: `/health`
- **方法**: `GET`
- **认证**: 不需要
- **速率限制**: 无

## 响应格式

### 成功响应（200 OK）

当所有服务都正常运行时，返回 200 状态码：

```json
{
  "success": true,
  "message": "服务器运行正常",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "connected",
      "message": "数据库连接正常",
      "healthy": true
    },
    "redis": {
      "status": "not_configured",
      "message": "Redis 未配置",
      "healthy": true
    }
  }
}
```

### 服务异常响应（503 Service Unavailable）

当任何关键服务不可用时，返回 503 状态码：

```json
{
  "success": false,
  "message": "服务器存在异常",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "error",
      "message": "数据库连接异常: Connection refused",
      "healthy": false
    },
    "redis": {
      "status": "not_configured",
      "message": "Redis 未配置",
      "healthy": true
    }
  }
}
```

### 健康检查失败响应（503 Service Unavailable）

当健康检查本身失败时：

```json
{
  "success": false,
  "message": "健康检查失败",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "error": "Unexpected error occurred"
}
```

## 响应字段说明

### 顶层字段

| 字段          | 类型    | 说明                                    |
| ------------- | ------- | --------------------------------------- |
| `success`     | boolean | 整体健康状态，true 表示所有服务正常     |
| `message`     | string  | 状态描述信息                            |
| `timestamp`   | string  | ISO 8601 格式的时间戳                   |
| `uptime`      | number  | 服务器运行时间（秒）                    |
| `environment` | string  | 运行环境（development/production/test） |
| `version`     | string  | API 版本号                              |
| `services`    | object  | 各个服务的健康状态                      |
| `error`       | string  | 错误信息（仅在健康检查失败时出现）      |

### 服务状态字段

每个服务（database、redis）包含以下字段：

| 字段      | 类型    | 说明         |
| --------- | ------- | ------------ |
| `status`  | string  | 服务状态标识 |
| `message` | string  | 状态描述信息 |
| `healthy` | boolean | 是否健康     |

### 数据库状态值

| 状态           | 说明                 | healthy |
| -------------- | -------------------- | ------- |
| `connected`    | 数据库连接正常       | true    |
| `disconnected` | 数据库连接池未初始化 | false   |
| `error`        | 数据库连接异常       | false   |

### Redis 状态值

| 状态                             | 说明                         | healthy |
| -------------------------------- | ---------------------------- | ------- |
| `not_configured`                 | Redis 未配置                 | true    |
| `configured_but_not_implemented` | Redis 已配置但健康检查未实现 | true    |
| `connected`                      | Redis 连接正常               | true    |
| `error`                          | Redis 连接异常               | false   |

## 使用示例

### cURL

```bash
curl http://localhost:3000/health
```

### JavaScript (fetch)

```javascript
fetch('http://localhost:3000/health')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('服务器运行正常');
    } else {
      console.error('服务器存在异常:', data.message);
    }
  });
```

### Node.js (axios)

```javascript
const axios = require('axios');

async function checkHealth() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('健康状态:', response.data);
    return response.data.success;
  } catch (error) {
    if (error.response && error.response.status === 503) {
      console.error('服务不可用:', error.response.data);
    } else {
      console.error('健康检查失败:', error.message);
    }
    return false;
  }
}
```

## 监控集成

### Prometheus

可以使用 Prometheus 的 `blackbox_exporter` 监控健康检查端点：

```yaml
scrape_configs:
  - job_name: 'anti-theft-api-health'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - http://localhost:3000/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: localhost:9115
```

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

### Docker Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Nginx 健康检查

```nginx
upstream api_backend {
    server localhost:3000 max_fails=3 fail_timeout=30s;
    
    # 健康检查配置（需要 nginx_upstream_check_module）
    check interval=3000 rise=2 fall=3 timeout=1000 type=http;
    check_http_send "GET /health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx;
}
```

## 性能要求

根据需求 22（性能要求），健康检查端点应满足：

- **响应时间**: P95 < 200ms
- **并发支持**: 至少 100 请求/秒
- **错误率**: < 0.1%

## 故障排查

### 数据库连接失败

如果健康检查返回数据库连接失败：

1. 检查数据库服务是否运行：
   ```bash
   systemctl status mysql
   ```

2. 检查数据库连接配置：
   ```bash
   echo $DB_HOST
   echo $DB_USER
   echo $DB_NAME
   ```

3. 测试数据库连接：
   ```bash
   mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"
   ```

4. 检查服务器日志：
   ```bash
   tail -f logs/error.log
   ```

### Redis 连接失败

如果配置了 Redis 但连接失败：

1. 检查 Redis 服务是否运行：
   ```bash
   systemctl status redis
   ```

2. 测试 Redis 连接：
   ```bash
   redis-cli ping
   ```

3. 检查 Redis 配置：
   ```bash
   echo $REDIS_URL
   echo $REDIS_HOST
   ```

## 安全注意事项

1. **不暴露敏感信息**: 健康检查端点不应返回数据库密码、API 密钥等敏感信息
2. **公开访问**: 此端点设计为公开访问，不需要认证
3. **DDoS 防护**: 虽然没有速率限制，但建议在负载均衡器或防火墙层面实施保护
4. **版本信息**: 返回的版本信息可能被攻击者利用，生产环境可考虑移除

## 相关文档

- [API 文档](./API.md)
- [部署文档](./DEPLOYMENT.md)
- [监控与维护](./MONITORING.md)

# API Client 使用说明

## 概述

`client.js` 提供了一个配置好的 axios 实例，用于与后端 API 通信。

## 功能特性

### 1. 自动配置

- **baseURL**: 默认指向 `http://154.9.228.252:3000`（可通过环境变量 `VITE_API_BASE_URL` 配置）
- **timeout**: 10 秒请求超时
- **headers**: 自动设置 `Content-Type: application/json`

### 2. 请求拦截器

自动从 `localStorage` 读取 JWT token（键名：`auth_token`）并添加到请求头：

```
Authorization: Bearer <token>
```

### 3. 响应拦截器

自动处理 401 未授权错误：
- 清除本地存储的 token
- 重定向到 `/login` 页面
- 保存当前路径用于登录后返回

## 使用示例

### 基本用法

```javascript
import apiClient from './api/client';

// GET 请求
const response = await apiClient.get('/api/cards');
console.log(response.data);

// POST 请求
const response = await apiClient.post('/api/auth/login', {
  username: 'user123',
  password: 'password'
});
console.log(response.data);

// PUT 请求
const response = await apiClient.put('/api/cards/1', {
  card_name: '新名称'
});

// DELETE 请求
const response = await apiClient.delete('/api/cards/1');
```

### 设置认证 Token

```javascript
import { setAuthToken } from './api/client';

// 登录成功后保存 token
const loginResponse = await apiClient.post('/api/auth/login', credentials);
setAuthToken(loginResponse.data.token);
```

### 清除认证信息

```javascript
import { clearAuth } from './api/client';

// 登出时清除 token
clearAuth();
```

### 更新服务器地址（自托管）

```javascript
import { updateBaseUrl } from './api/client';

// 切换到自托管服务器
updateBaseUrl('https://my-server.example.com');
```

### 错误处理

```javascript
import apiClient from './api/client';

try {
  const response = await apiClient.post('/api/verify', {
    card_id: '123456',
    password: 'myPassword'
  });
  
  if (response.data.success) {
    console.log('验证成功');
  }
} catch (error) {
  if (error.response) {
    // 服务器返回错误响应
    console.error('错误:', error.response.data.message);
    console.error('状态码:', error.response.status);
  } else if (error.request) {
    // 请求已发送但没有收到响应
    console.error('网络错误，请检查连接');
  } else {
    // 其他错误
    console.error('错误:', error.message);
  }
}
```

## API 端点示例

### 认证 API

```javascript
// 注册
await apiClient.post('/api/auth/register', {
  username: 'author123',
  email: 'author@example.com',
  password: 'securePassword'
});

// 登录
await apiClient.post('/api/auth/login', {
  username: 'author123',
  password: 'securePassword'
});
```

### 角色卡管理 API（需要认证）

```javascript
// 获取角色卡列表
await apiClient.get('/api/cards');

// 创建角色卡
await apiClient.post('/api/cards', {
  card_name: '角色A',
  password: 'cardPassword'
});

// 更新角色卡
await apiClient.put('/api/cards/1', {
  card_name: '新名称'
});

// 删除角色卡
await apiClient.delete('/api/cards/1');

// 更新密码
await apiClient.put('/api/cards/1/password', {
  new_password: 'newPassword'
});

// 生成随机密码
await apiClient.post('/api/cards/1/password/random');
```

### 公开验证 API（无需认证）

```javascript
// 验证密码
await apiClient.post('/api/verify', {
  card_id: '123456',
  password: 'userPassword'
});

// 获取密码版本
await apiClient.get('/api/cards/123456/version');
```

## 环境变量配置

在项目根目录创建 `.env` 文件：

```env
# 开发环境
VITE_API_BASE_URL=http://localhost:3000

# 生产环境
# VITE_API_BASE_URL=https://api.example.com
```

## 注意事项

1. **Token 存储**: Token 存储在 `localStorage` 中，键名为 `auth_token`
2. **自动重定向**: 401 错误会自动重定向到 `/login`，并保存当前路径
3. **超时设置**: 默认 10 秒超时，可根据需要调整
4. **CORS**: 确保后端服务器配置了正确的 CORS 策略

## 与 React 组件集成

```javascript
import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

function CardList() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await apiClient.get('/api/cards');
        setCards(response.data.cards);
      } catch (err) {
        setError(err.response?.data?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {cards.map(card => (
        <div key={card.id}>{card.card_name}</div>
      ))}
    </div>
  );
}
```

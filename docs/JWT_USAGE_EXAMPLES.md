# JWT 认证模块使用示例

本文档提供 JWT 认证模块在实际 API 路由中的使用示例。

## 1. 用户注册接口示例

```javascript
// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { hashPassword } = require('../utils/crypto');
const { generateToken } = require('../utils/jwt');
const db = require('../db/connection');

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 输入验证
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码不能为空'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }
    
    // 加密密码
    const passwordHash = await hashPassword(password);
    
    // 创建用户
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    
    const userId = result.insertId;
    
    // 生成 JWT token
    const token = generateToken(userId, username);
    
    // 返回成功响应
    res.status(201).json({
      success: true,
      token: token,
      user: {
        id: userId,
        username: username,
        email: email
      }
    });
    
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
```

## 2. 用户登录接口示例

```javascript
// src/routes/auth.js (续)
const { verifyPassword } = require('../utils/crypto');

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 输入验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    // 查询用户
    const user = await db.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = ?',
      [username]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 生成 JWT token
    const token = generateToken(user.id, user.username);
    
    // 返回成功响应
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});
```

## 3. 认证中间件示例

```javascript
// src/middleware/auth.js
const { verifyToken } = require('../utils/jwt');

/**
 * 认证中间件
 * 验证请求中的 JWT token
 */
async function authenticateToken(req, res, next) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }
    
    // 验证 token
    const decoded = await verifyToken(token);
    
    // 将用户信息附加到 request 对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
    
    // 继续处理请求
    next();
    
  } catch (error) {
    // Token 无效或过期
    return res.status(403).json({
      success: false,
      message: '令牌无效或已过期'
    });
  }
}

module.exports = { authenticateToken };
```

## 4. 受保护路由示例

```javascript
// src/routes/cards.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db/connection');

/**
 * GET /api/cards
 * 获取当前用户的所有角色卡
 * 需要认证
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // req.user 由认证中间件设置
    const userId = req.user.userId;
    
    // 查询用户的角色卡
    const cards = await db.query(
      'SELECT id, card_id, card_name, password_version, created_at, updated_at ' +
      'FROM character_cards WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      success: true,
      cards: cards
    });
    
  } catch (error) {
    console.error('获取角色卡列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * POST /api/cards
 * 创建新的角色卡记录
 * 需要认证
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { card_name, password } = req.body;
    
    // 输入验证
    if (!card_name || !password) {
      return res.status(400).json({
        success: false,
        message: '角色卡名称和密码不能为空'
      });
    }
    
    // 生成唯一 card_id
    const { generateUniqueCardId } = require('../utils/cardId');
    const cardId = await generateUniqueCardId();
    
    // 加密密码
    const { hashPassword } = require('../utils/crypto');
    const passwordHash = await hashPassword(password);
    
    // 创建角色卡记录
    const result = await db.query(
      'INSERT INTO character_cards (card_id, user_id, card_name, password_hash, password_version) ' +
      'VALUES (?, ?, ?, ?, 1)',
      [cardId, userId, card_name, passwordHash]
    );
    
    res.status(201).json({
      success: true,
      card_id: cardId,
      password_version: 1,
      message: '角色卡创建成功'
    });
    
  } catch (error) {
    console.error('创建角色卡失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
```

## 5. 在 Express 应用中使用

```javascript
// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 路由
const authRoutes = require('./routes/auth');
const cardRoutes = require('./routes/cards');

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);

// 启动服务器
const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

## 6. 客户端使用示例

### 注册

```javascript
// 客户端代码
async function register(username, email, password) {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // 保存 token
    localStorage.setItem('token', data.token);
    console.log('注册成功:', data.user);
  } else {
    console.error('注册失败:', data.message);
  }
}
```

### 登录

```javascript
async function login(username, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // 保存 token
    localStorage.setItem('token', data.token);
    console.log('登录成功:', data.user);
  } else {
    console.error('登录失败:', data.message);
  }
}
```

### 访问受保护的 API

```javascript
async function getCards() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/cards', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('角色卡列表:', data.cards);
  } else {
    console.error('获取失败:', data.message);
    
    // Token 过期或无效，重新登录
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      // 跳转到登录页
    }
  }
}
```

## 7. 错误处理最佳实践

```javascript
// src/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error('错误:', err);
  
  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      message: '令牌无效'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(403).json({
      success: false,
      message: '令牌已过期'
    });
  }
  
  // 默认错误
  res.status(500).json({
    success: false,
    message: '服务器错误'
  });
}

module.exports = { errorHandler };
```

## 8. 环境变量配置

```bash
# .env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
NODE_ENV=development
SERVER_PORT=3000
```

## 总结

JWT 认证模块提供了完整的用户认证功能：

1. **Token 生成**: 用户注册/登录后生成 token
2. **Token 验证**: 通过中间件验证受保护路由的访问
3. **用户识别**: 从 token 中提取用户信息
4. **安全性**: 7 天过期时间，HMAC SHA256 签名

下一步可以实现：
- Token 刷新机制
- Token 撤销（黑名单）
- 多设备登录管理
- 登录日志记录

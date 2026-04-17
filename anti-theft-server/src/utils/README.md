# Utils 模块文档

本目录包含服务器端的工具函数模块。

## 模块列表

### 1. cardId.js - Card ID 生成模块

**功能：** 生成唯一的角色卡 ID

**主要函数：**

#### `generateCardId()`

生成 6-8 位随机数字 Card ID。

```javascript
const { generateCardId } = require('./utils/cardId');

const cardId = generateCardId();
console.log(cardId); // 例如: "1234567"
```

**特性：**
- 随机长度：6、7 或 8 位
- 只包含数字 0-9
- 不以 0 开头

#### `generateUniqueCardId()`

生成在数据库中唯一的 Card ID。

```javascript
const { generateUniqueCardId } = require('./utils/cardId');

// 异步函数，需要 await
const uniqueCardId = await generateUniqueCardId();
console.log(uniqueCardId); // 例如: "9876543"
```

**特性：**
- 自动检查数据库唯一性
- 最多重试 10 次
- 如果无法生成唯一 ID，抛出错误

**使用场景：** 创建新角色卡记录时

#### `validateCardIdFormat(cardId)`

验证 Card ID 格式是否有效。

```javascript
const { validateCardIdFormat } = require('./utils/cardId');

validateCardIdFormat('123456');   // true
validateCardIdFormat('0123456');  // false (以 0 开头)
validateCardIdFormat('12345');    // false (太短)
validateCardIdFormat('12a456');   // false (包含非数字)
```

**验证规则：**
- 必须是字符串
- 长度为 6-8 位
- 只包含数字
- 不以 0 开头

#### `cardIdExists(cardId)`

检查 Card ID 是否已存在于数据库。

```javascript
const { cardIdExists } = require('./utils/cardId');

const exists = await cardIdExists('123456');
if (exists) {
  console.log('Card ID 已存在');
} else {
  console.log('Card ID 可用');
}
```

---

### 2. crypto.js - 密码加密模块

**功能：** 使用 bcrypt 加密和验证密码

**主要函数：**

#### `hashPassword(password)`

加密密码。

```javascript
const { hashPassword } = require('./utils/crypto');

const hash = await hashPassword('myPassword123');
console.log(hash); // $2b$12$...
```

**特性：**
- 使用 bcrypt 算法
- Salt rounds: 12
- 返回密码哈希字符串

#### `verifyPassword(password, hash)`

验证密码是否匹配。

```javascript
const { verifyPassword } = require('./utils/crypto');

const isValid = await verifyPassword('myPassword123', hash);
if (isValid) {
  console.log('密码正确');
} else {
  console.log('密码错误');
}
```

---

### 3. jwt.js - JWT 认证模块

**功能：** 生成和验证 JWT token

**主要函数：**

#### `generateToken(userId, username)`

生成 JWT token。

```javascript
const { generateToken } = require('./utils/jwt');

const token = generateToken(1, 'author123');
console.log(token); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**特性：**
- 有效期：7 天
- 包含 userId 和 username
- 使用环境变量中的 JWT_SECRET

#### `verifyToken(token)`

验证 JWT token。

```javascript
const { verifyToken } = require('./utils/jwt');

try {
  const decoded = verifyToken(token);
  console.log(decoded.userId);   // 1
  console.log(decoded.username); // "author123"
} catch (error) {
  console.error('Token 无效或已过期');
}
```

---

## 测试

所有工具模块都有对应的单元测试，位于 `tests/unit/` 目录。

运行测试：

```bash
# 运行所有测试
npm test

# 运行特定模块的测试
npm test -- cardId.test.js
npm test -- crypto.test.js
npm test -- jwt.test.js
```

---

## 错误处理

所有异步函数都会抛出错误，调用时需要使用 try-catch：

```javascript
try {
  const cardId = await generateUniqueCardId();
  console.log('生成成功:', cardId);
} catch (error) {
  console.error('生成失败:', error.message);
}
```

---

## 依赖关系

- **cardId.js** 依赖 `db/connection.js`（数据库查询）
- **crypto.js** 依赖 `bcrypt` npm 包
- **jwt.js** 依赖 `jsonwebtoken` npm 包

---

## 最佳实践

1. **Card ID 生成**
   - 创建角色卡时使用 `generateUniqueCardId()`
   - 验证用户输入时使用 `validateCardIdFormat()`

2. **密码处理**
   - 注册/更新密码时使用 `hashPassword()`
   - 登录/验证时使用 `verifyPassword()`
   - 永远不要存储明文密码

3. **JWT Token**
   - 登录成功后生成 token
   - 所有需要认证的 API 都验证 token
   - Token 过期后要求用户重新登录

# Middleware Documentation

This directory contains Express middleware modules used throughout the application.

## Available Middleware

### 1. httpsRedirect.js

**Purpose**: Enforces HTTPS connections in production environment by redirecting HTTP requests to HTTPS.

**Usage**:
```javascript
const httpsRedirect = require('./middleware/httpsRedirect');
app.use(httpsRedirect);
```

**Behavior**:
- **Production Environment** (`NODE_ENV=production`):
  - Redirects all HTTP requests to HTTPS with 301 (permanent redirect)
  - Checks both `req.secure` and `x-forwarded-proto` header (for proxy/load balancer scenarios)
  - Preserves the original URL path and query parameters
  
- **Development/Test Environment**:
  - Allows HTTP requests to pass through without redirection
  - Useful for local development without SSL certificates

**Configuration**:
- Set `NODE_ENV=production` to enable HTTPS enforcement
- No additional configuration required

**Example Redirect**:
```
HTTP Request:  http://example.com/api/cards?page=1
HTTPS Redirect: https://example.com/api/cards?page=1
```

**Security Considerations**:
- Should be applied early in the middleware chain
- Works with reverse proxies (Nginx, Apache) via `x-forwarded-proto` header
- Uses 301 (permanent) redirect for better SEO and caching

**Testing**:
```bash
npm test -- tests/unit/httpsRedirect.test.js
```

---

### 2. auth.js

**Purpose**: JWT authentication middleware for protected routes.

**Usage**:
```javascript
const authenticateToken = require('./middleware/auth');
app.get('/api/cards', authenticateToken, cardsController);
```

**Behavior**:
- Validates JWT token from Authorization header
- Attaches user information to `req.user`
- Returns 401 for missing token, 403 for invalid/expired token

---

### 3. rateLimiter.js

**Purpose**: Rate limiting middleware to prevent abuse and brute-force attacks.

**Usage**:
```javascript
const { verifyLimiter, cardVerifyLimiter } = require('./middleware/rateLimiter');
app.post('/api/verify', verifyLimiter, cardVerifyLimiter, verifyHandler);
```

**Behavior**:
- IP-based rate limiting: 10 requests/minute
- Card ID-based rate limiting: 5 requests/minute
- Returns 429 (Too Many Requests) when limit exceeded

---

## Middleware Order

The recommended middleware order in `server.js`:

```javascript
// 1. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CORS
app.use(cors(corsOptions));

// 3. Security headers (helmet)
app.use(helmet());

// 4. HTTPS redirect (production only)
app.use(httpsRedirect);

// 5. Application routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', authenticateToken, cardsRoutes);
app.use('/api/verify', verifyLimiter, verifyRoutes);

// 6. Error handlers
app.use(errorHandler);
```

## Adding New Middleware

When creating new middleware:

1. Create a new file in this directory
2. Export a function with signature: `(req, res, next) => void`
3. Add comprehensive unit tests in `tests/unit/`
4. Document the middleware in this README
5. Import and use in `server.js`

## Testing Middleware

All middleware should have unit tests with:
- Happy path scenarios
- Error cases
- Edge cases
- Environment-specific behavior

Run all middleware tests:
```bash
npm test -- tests/unit/
```

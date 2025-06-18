# JWT Authentication & Role-Based Authorization Middleware

Express middleware for JWT validation with role-based access control that validates tokens, extracts user roles, and enforces admin/editor privileges.

## Features

- ✅ **JWT Token Validation** - Validates JWT tokens from Authorization headers
- ✅ **Role-Based Access Control** - Enforces admin and editor privileges
- ✅ **Flexible Role Extraction** - Supports multiple JWT payload formats
- ✅ **TypeScript Support** - Full TypeScript definitions included
- ✅ **Comprehensive Error Handling** - Detailed error messages and logging
- ✅ **Multiple Auth Patterns** - Various middleware combinations available

## Installation

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken  # For TypeScript
```

## Environment Setup

```bash
# Required environment variable
JWT_SECRET=your-super-secret-jwt-key
```

## Quick Start

### JavaScript

```javascript
const express = require('express');
const { authenticateAndAuthorize } = require('./middleware/auth');

const app = express();

// Protected route requiring admin or editor privileges
app.get('/api/admin', authenticateAndAuthorize, (req, res) => {
  res.json({ 
    message: 'Admin/Editor access granted',
    user: req.user.email,
    role: req.userRole
  });
});
```

### TypeScript

```typescript
import express from 'express';
import { authenticateAndAuthorize, AuthenticatedRequest } from './middleware/auth';

const app = express();

app.get('/api/admin', authenticateAndAuthorize, (req: AuthenticatedRequest, res) => {
  res.json({ 
    message: 'Admin/Editor access granted',
    user: req.user?.email,
    role: req.userRole
  });
});
```

## Middleware Options

### Individual Middleware

```javascript
const {
  authenticateJWT,        // JWT validation only
  requireAdminOrEditor,   // Requires admin OR editor role
  requireAdmin,          // Requires admin role only
} = require('./middleware/auth');

// Step-by-step application
app.get('/api/users', 
  authenticateJWT,           // 1. Validate JWT
  requireAdminOrEditor,      // 2. Check roles
  (req, res) => {
    // Your route handler
  }
);
```

### Combined Middleware

```javascript
const {
  authenticateAndAuthorize,      // JWT + admin/editor check
  authenticateAndRequireAdmin,   // JWT + admin-only check
} = require('./middleware/auth');

// One-step authentication and authorization
app.get('/api/admin-only', authenticateAndRequireAdmin, (req, res) => {
  // Only admins can access this
});
```

## Supported JWT Payload Formats

The middleware automatically extracts roles from various JWT payload structures:

```javascript
// Standard roles array
{
  "sub": "user123",
  "email": "user@example.com",
  "roles": ["admin", "editor"]
}

// Single role string
{
  "sub": "user123",
  "role": "admin"
}

// Spring Security style authorities
{
  "sub": "user123",
  "authorities": ["admin", "editor"]
}

// Custom permissions array
{
  "sub": "user123",
  "permissions": ["admin"]
}

// Firebase custom claims
{
  "sub": "user123",
  "custom_claims": {
    "roles": ["admin"]
  }
}

// Auth0 namespaced claims
{
  "sub": "user123",
  "https://myapp.com/roles": ["admin", "editor"]
}
```

## Request Object Extensions

After successful authentication, the middleware adds:

```javascript
// req.user - JWT payload
{
  sub: "user123",
  email: "user@example.com",
  roles: ["admin", "editor"],
  iat: 1234567890,
  exp: 1234567890
}

// req.userRole - Role information (after authorization)
{
  isAdmin: true,
  isEditor: true,
  roles: ["admin", "editor"]
}
```

## Usage Examples

### 1. Public Route
```javascript
app.get('/api/public', (req, res) => {
  res.json({ message: 'Public access' });
});
```

### 2. Authentication Required
```javascript
app.get('/api/profile', authenticateJWT, (req, res) => {
  res.json({ 
    message: 'Your profile',
    user: req.user.email 
  });
});
```

### 3. Admin or Editor Required
```javascript
app.post('/api/posts', authenticateAndAuthorize, (req, res) => {
  res.json({ 
    message: 'Post created',
    createdBy: req.user.email,
    permissions: req.userRole
  });
});
```

### 4. Admin Only
```javascript
app.delete('/api/users/:id', authenticateAndRequireAdmin, (req, res) => {
  res.json({ 
    message: 'User deleted',
    deletedBy: req.user.email
  });
});
```

### 5. Custom Role Logic
```javascript
app.put('/api/users/:id', authenticateJWT, (req, res) => {
  const userRoles = req.user.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isOwner = req.user.sub === req.params.id;
  
  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      error: 'You can only edit your own profile'
    });
  }
  
  // Update user logic
});
```

## Error Responses

### Authentication Errors (401)
```json
{
  "error": "Access denied",
  "message": "No authorization header provided"
}

{
  "error": "Token expired", 
  "message": "Your session has expired. Please log in again."
}

{
  "error": "Invalid token",
  "message": "The provided token is invalid."
}
```

### Authorization Errors (403)
```json
{
  "error": "Insufficient privileges",
  "message": "This resource requires admin or editor privileges.",
  "requiredRoles": ["admin", "editor"],
  "userRoles": ["user"]
}

{
  "error": "Admin privileges required",
  "message": "This resource requires admin privileges.",
  "requiredRoles": ["admin"],
  "userRoles": ["editor"]
}
```

## Testing

Run the test suite:

```bash
npm test
```

Generate test tokens for development:

```javascript
const jwt = require('jsonwebtoken');

const adminToken = jwt.sign(
  { 
    sub: 'admin123',
    email: 'admin@example.com',
    roles: ['admin']
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Use in requests:
// Authorization: Bearer ${adminToken}
```

## Security Best Practices

1. **Use Strong JWT Secrets** - Use a cryptographically secure random string
2. **Set Appropriate Expiration** - Don't make tokens last too long
3. **Validate on Every Request** - Always validate tokens server-side
4. **Log Security Events** - Monitor authentication failures
5. **Use HTTPS** - Always transmit tokens over secure connections

## License

MIT License - see LICENSE file for details.

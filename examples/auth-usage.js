const express = require('express');
const {
  authenticateJWT,
  requireAdminOrEditor,
  requireAdmin,
  authenticateAndAuthorize,
  authenticateAndRequireAdmin
} = require('../middleware/auth');

const app = express();

// Middleware setup
app.use(express.json());

/**
 * USAGE EXAMPLES
 */

// 1. Public route - no authentication required
app.get('/api/public', (req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// 2. Protected route - authentication required only
app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({ 
    message: 'This is a protected endpoint',
    user: req.user.email || req.user.sub
  });
});

// 3. Admin/Editor route - requires admin OR editor role
app.get('/api/admin-or-editor', authenticateAndAuthorize, (req, res) => {
  res.json({ 
    message: 'This endpoint requires admin or editor privileges',
    user: req.user.email || req.user.sub,
    role: req.userRole
  });
});

// 4. Admin-only route - requires admin role specifically
app.get('/api/admin-only', authenticateAndRequireAdmin, (req, res) => {
  res.json({ 
    message: 'This endpoint requires admin privileges only',
    user: req.user.email || req.user.sub,
    role: req.userRole
  });
});

// 5. Step-by-step middleware application
app.post('/api/users', 
  authenticateJWT,           // First: validate JWT
  requireAdminOrEditor,      // Second: check roles
  (req, res) => {
    res.json({ 
      message: 'User created successfully',
      createdBy: req.user.email || req.user.sub,
      permissions: req.userRole
    });
  }
);

// 6. Custom role checking within route handler
app.put('/api/users/:id', authenticateJWT, (req, res) => {
  const userRoles = req.user.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isEditor = userRoles.includes('editor');
  const isOwner = req.user.sub === req.params.id;
  
  // Custom logic: admins can edit anyone, editors and users can edit themselves
  if (!isAdmin && !isEditor && !isOwner) {
    return res.status(403).json({
      error: 'Insufficient privileges',
      message: 'You can only edit your own profile unless you have admin/editor privileges'
    });
  }
  
  res.json({ 
    message: 'User updated successfully',
    updatedBy: req.user.email || req.user.sub
  });
});

// 7. Conditional middleware based on operation
app.delete('/api/users/:id', authenticateJWT, (req, res, next) => {
  // Only admins can delete users
  requireAdmin(req, res, next);
}, (req, res) => {
  res.json({ 
    message: 'User deleted successfully',
    deletedBy: req.user.email || req.user.sub
  });
});

/**
 * ERROR HANDLING EXAMPLES
 */

// Global error handler for authentication/authorization errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

/**
 * TESTING ENDPOINTS
 */

// Generate test JWT (for development only)
app.post('/api/test/generate-token', (req, res) => {
  const jwt = require('jsonwebtoken');
  const { email, roles = ['user'] } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const payload = {
    sub: `user_${Date.now()}`,
    email: email,
    roles: roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
  
  res.json({
    token: token,
    payload: payload,
    usage: `Authorization: Bearer ${token}`
  });
});

// Test endpoint to verify token and roles
app.get('/api/test/verify-token', authenticateJWT, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Test the endpoints:`);
  console.log(`   GET  /api/public - Public access`);
  console.log(`   GET  /api/protected - Requires authentication`);
  console.log(`   GET  /api/admin-or-editor - Requires admin or editor role`);
  console.log(`   GET  /api/admin-only - Requires admin role only`);
  console.log(`   POST /api/test/generate-token - Generate test JWT`);
});

module.exports = app;

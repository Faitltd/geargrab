const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  authenticateJWT,
  requireAdminOrEditor,
  requireAdmin,
  authenticateAndAuthorize
} = require('../middleware/auth');

// Test setup
const app = express();
app.use(express.json());

const JWT_SECRET = 'test-secret-key';
process.env.JWT_SECRET = JWT_SECRET;

// Test routes
app.get('/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'Protected route', user: req.user.email });
});

app.get('/admin-or-editor', authenticateAndAuthorize, (req, res) => {
  res.json({ message: 'Admin or editor route', role: req.userRole });
});

app.get('/admin-only', authenticateJWT, requireAdmin, (req, res) => {
  res.json({ message: 'Admin only route', role: req.userRole });
});

// Helper function to generate test tokens
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

describe('JWT Authentication Middleware', () => {
  
  describe('authenticateJWT', () => {
    test('should accept valid JWT token', async () => {
      const token = generateToken({ 
        sub: 'user123', 
        email: 'test@example.com',
        roles: ['user']
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Protected route');
      expect(response.body.user).toBe('test@example.com');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toBe('No authorization header provided');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { sub: 'user123', email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token expired');
    });

    test('should accept token without Bearer prefix', async () => {
      const token = generateToken({ 
        sub: 'user123', 
        email: 'test@example.com' 
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', token);

      expect(response.status).toBe(200);
    });
  });

  describe('requireAdminOrEditor', () => {
    test('should allow admin access', async () => {
      const token = generateToken({ 
        sub: 'admin123', 
        email: 'admin@example.com',
        roles: ['admin']
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.role.isAdmin).toBe(true);
      expect(response.body.role.isEditor).toBe(false);
    });

    test('should allow editor access', async () => {
      const token = generateToken({ 
        sub: 'editor123', 
        email: 'editor@example.com',
        roles: ['editor']
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.role.isAdmin).toBe(false);
      expect(response.body.role.isEditor).toBe(true);
    });

    test('should allow user with both admin and editor roles', async () => {
      const token = generateToken({ 
        sub: 'superuser123', 
        email: 'super@example.com',
        roles: ['admin', 'editor']
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.role.isAdmin).toBe(true);
      expect(response.body.role.isEditor).toBe(true);
    });

    test('should reject regular user', async () => {
      const token = generateToken({ 
        sub: 'user123', 
        email: 'user@example.com',
        roles: ['user']
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient privileges');
      expect(response.body.requiredRoles).toEqual(['admin', 'editor']);
      expect(response.body.userRoles).toEqual(['user']);
    });

    test('should reject user with no roles', async () => {
      const token = generateToken({ 
        sub: 'user123', 
        email: 'user@example.com'
        // No roles property
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient privileges');
    });
  });

  describe('requireAdmin', () => {
    test('should allow admin access', async () => {
      const token = generateToken({ 
        sub: 'admin123', 
        email: 'admin@example.com',
        roles: ['admin']
      });

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.role.isAdmin).toBe(true);
    });

    test('should reject editor access', async () => {
      const token = generateToken({ 
        sub: 'editor123', 
        email: 'editor@example.com',
        roles: ['editor']
      });

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin privileges required');
      expect(response.body.requiredRoles).toEqual(['admin']);
    });

    test('should reject regular user', async () => {
      const token = generateToken({ 
        sub: 'user123', 
        email: 'user@example.com',
        roles: ['user']
      });

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin privileges required');
    });
  });

  describe('Role extraction from different JWT formats', () => {
    test('should extract roles from roles array', async () => {
      const token = generateToken({ 
        sub: 'user123',
        roles: ['admin', 'editor']
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    test('should extract role from single role string', async () => {
      const token = generateToken({ 
        sub: 'user123',
        role: 'admin'
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    test('should extract roles from authorities array', async () => {
      const token = generateToken({ 
        sub: 'user123',
        authorities: ['admin']
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    test('should extract roles from custom_claims', async () => {
      const token = generateToken({ 
        sub: 'user123',
        custom_claims: {
          roles: ['editor']
        }
      });

      const response = await request(app)
        .get('/admin-or-editor')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });
});

module.exports = { app, generateToken };

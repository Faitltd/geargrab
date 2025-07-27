/**
 * Authentication Middleware
 * JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { verifyFirebaseToken, isFirebaseAdminAvailable } = require('../config/firebase-admin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    displayName: user.display_name
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'geargrab-api',
    audience: 'geargrab-app'
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'geargrab-api',
      audience: 'geargrab-app'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Middleware to authenticate requests (supports both JWT and Firebase tokens)
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    let user;

    // Try Firebase token first if Firebase Admin is available
    if (isFirebaseAdminAvailable()) {
      try {
        const decodedFirebaseToken = await verifyFirebaseToken(token);

        // Find or create user based on Firebase UID
        const result = await query(
          'SELECT id, email, display_name, account_status, firebase_uid FROM users WHERE firebase_uid = $1',
          [decodedFirebaseToken.uid]
        );

        if (result.rows.length > 0) {
          user = result.rows[0];
        } else {
          // Create user from Firebase token
          const newUserResult = await query(`
            INSERT INTO users (
              firebase_uid, email, display_name, is_email_verified, account_status
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, display_name, account_status, firebase_uid
          `, [
            decodedFirebaseToken.uid,
            decodedFirebaseToken.email,
            decodedFirebaseToken.name || decodedFirebaseToken.email?.split('@')[0],
            decodedFirebaseToken.email_verified || false,
            'active'
          ]);

          user = newUserResult.rows[0];
        }
      } catch (firebaseError) {
        // If Firebase token verification fails, try JWT
        console.log('Firebase token verification failed, trying JWT:', firebaseError.message);
      }
    }

    // If no user found via Firebase, try JWT
    if (!user) {
      const decoded = verifyToken(token);

      // Get user from database to ensure they still exist and are active
      const result = await query(
        'SELECT id, email, display_name, account_status FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'User not found'
        });
      }

      user = result.rows[0];
    }

    // Check if user account is active
    if (user.account_status !== 'active') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable'
    });
  }
}

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = verifyToken(token);
      const result = await query(
        'SELECT id, email, display_name, account_status FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (result.rows.length > 0 && result.rows[0].account_status === 'active') {
        req.user = result.rows[0];
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}

/**
 * Middleware to check if user is admin
 */
async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Admin access required'
      });
    }
    
    // Check if user has admin role
    const result = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authorization service unavailable'
    });
  }
}

/**
 * Middleware to check if user owns the resource
 */
function requireOwnership(resourceIdParam = 'id', ownerField = 'owner_id') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }
      
      const resourceId = req.params[resourceIdParam];
      
      // This would need to be customized based on the resource type
      // For now, we'll add the ownership check to the route handlers
      req.resourceId = resourceId;
      req.ownerField = ownerField;
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  };
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireOwnership
};

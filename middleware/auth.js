const jwt = require('jsonwebtoken');

/**
 * JWT Authentication and Role-Based Authorization Middleware
 * 
 * This middleware validates JWTs, extracts user roles, and enforces
 * role-based access control for admin and editor privileges.
 */

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and attaches user data to request object
 */
const authenticateJWT = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No authorization header provided'
      });
    }

    // Check for Bearer token format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to request object
    req.user = decoded;
    
    console.log(`✅ JWT validated for user: ${decoded.email || decoded.sub}`);
    next();
    
  } catch (error) {
    console.error('❌ JWT validation failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid.'
      });
    }
    
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to authenticate request.'
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Requires 'admin' or 'editor' roles for access
 */
const requireAdminOrEditor = (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource.'
      });
    }

    // Extract roles from user object
    const userRoles = extractUserRoles(req.user);
    
    // Check for required privileges
    const hasAdminRole = userRoles.includes('admin');
    const hasEditorRole = userRoles.includes('editor');
    
    if (!hasAdminRole && !hasEditorRole) {
      console.warn(`❌ Access denied for user ${req.user.email || req.user.sub}: insufficient privileges`);
      
      return res.status(403).json({
        error: 'Insufficient privileges',
        message: 'This resource requires admin or editor privileges.',
        requiredRoles: ['admin', 'editor'],
        userRoles: userRoles
      });
    }

    // Log successful authorization
    const roleType = hasAdminRole ? 'admin' : 'editor';
    console.log(`✅ Access granted for ${roleType}: ${req.user.email || req.user.sub}`);
    
    // Attach role info to request for downstream use
    req.userRole = {
      isAdmin: hasAdminRole,
      isEditor: hasEditorRole,
      roles: userRoles
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Role authorization failed:', error.message);
    
    return res.status(500).json({
      error: 'Authorization error',
      message: 'Unable to verify user privileges.'
    });
  }
};

/**
 * Extract user roles from JWT payload
 * Supports multiple JWT payload formats
 */
const extractUserRoles = (user) => {
  // Handle different JWT payload structures
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles;
  }
  
  if (user.role && typeof user.role === 'string') {
    return [user.role];
  }
  
  if (user.authorities && Array.isArray(user.authorities)) {
    return user.authorities;
  }
  
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions;
  }
  
  // Firebase custom claims
  if (user.custom_claims && user.custom_claims.roles) {
    return Array.isArray(user.custom_claims.roles) 
      ? user.custom_claims.roles 
      : [user.custom_claims.roles];
  }
  
  // Auth0 style roles
  if (user['https://myapp.com/roles']) {
    return user['https://myapp.com/roles'];
  }
  
  console.warn(`⚠️ No roles found for user: ${user.email || user.sub}`);
  return [];
};

/**
 * Admin-Only Authorization Middleware
 * Requires 'admin' role specifically
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource.'
      });
    }

    const userRoles = extractUserRoles(req.user);
    const hasAdminRole = userRoles.includes('admin');
    
    if (!hasAdminRole) {
      console.warn(`❌ Admin access denied for user ${req.user.email || req.user.sub}`);
      
      return res.status(403).json({
        error: 'Admin privileges required',
        message: 'This resource requires admin privileges.',
        requiredRoles: ['admin'],
        userRoles: userRoles
      });
    }

    console.log(`✅ Admin access granted: ${req.user.email || req.user.sub}`);
    
    req.userRole = {
      isAdmin: true,
      isEditor: userRoles.includes('editor'),
      roles: userRoles
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Admin authorization failed:', error.message);
    
    return res.status(500).json({
      error: 'Authorization error',
      message: 'Unable to verify admin privileges.'
    });
  }
};

/**
 * Combined Authentication and Authorization Middleware
 * Validates JWT and requires admin/editor roles in one step
 */
const authenticateAndAuthorize = [authenticateJWT, requireAdminOrEditor];

/**
 * Combined Authentication and Admin Authorization
 * Validates JWT and requires admin role in one step
 */
const authenticateAndRequireAdmin = [authenticateJWT, requireAdmin];

module.exports = {
  authenticateJWT,
  requireAdminOrEditor,
  requireAdmin,
  authenticateAndAuthorize,
  authenticateAndRequireAdmin,
  extractUserRoles
};

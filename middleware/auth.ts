import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * TypeScript JWT Authentication and Role-Based Authorization Middleware
 */

// Type definitions
interface JWTPayload {
  sub: string;
  email?: string;
  roles?: string[];
  role?: string;
  authorities?: string[];
  permissions?: string[];
  custom_claims?: {
    roles?: string[] | string;
  };
  [key: string]: any; // For custom claims like Auth0 namespaced claims
}

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  userRole?: {
    isAdmin: boolean;
    isEditor: boolean;
    roles: string[];
  };
}

interface AuthError {
  error: string;
  message: string;
  requiredRoles?: string[];
  userRoles?: string[];
}

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and attaches user data to request object
 */
export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No authorization header provided'
      } as AuthError);
      return;
    }

    // Check for Bearer token format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      } as AuthError);
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Attach user data to request object
    req.user = decoded;
    
    console.log(`✅ JWT validated for user: ${decoded.email || decoded.sub}`);
    next();
    
  } catch (error: any) {
    console.error('❌ JWT validation failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      } as AuthError);
      return;
    }
    
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid.'
      } as AuthError);
      return;
    }
    
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to authenticate request.'
    } as AuthError);
  }
};

/**
 * Extract user roles from JWT payload
 * Supports multiple JWT payload formats
 */
export const extractUserRoles = (user: JWTPayload): string[] => {
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
  if (user.custom_claims?.roles) {
    return Array.isArray(user.custom_claims.roles) 
      ? user.custom_claims.roles 
      : [user.custom_claims.roles];
  }
  
  // Auth0 style roles (namespaced claims)
  if (user['https://myapp.com/roles']) {
    return user['https://myapp.com/roles'];
  }
  
  console.warn(`⚠️ No roles found for user: ${user.email || user.sub}`);
  return [];
};

/**
 * Role-Based Authorization Middleware
 * Requires 'admin' or 'editor' roles for access
 */
export const requireAdminOrEditor = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource.'
      } as AuthError);
      return;
    }

    // Extract roles from user object
    const userRoles = extractUserRoles(req.user);
    
    // Check for required privileges
    const hasAdminRole = userRoles.includes('admin');
    const hasEditorRole = userRoles.includes('editor');
    
    if (!hasAdminRole && !hasEditorRole) {
      console.warn(`❌ Access denied for user ${req.user.email || req.user.sub}: insufficient privileges`);
      
      res.status(403).json({
        error: 'Insufficient privileges',
        message: 'This resource requires admin or editor privileges.',
        requiredRoles: ['admin', 'editor'],
        userRoles: userRoles
      } as AuthError);
      return;
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
    
  } catch (error: any) {
    console.error('❌ Role authorization failed:', error.message);
    
    res.status(500).json({
      error: 'Authorization error',
      message: 'Unable to verify user privileges.'
    } as AuthError);
  }
};

/**
 * Admin-Only Authorization Middleware
 * Requires 'admin' role specifically
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource.'
      } as AuthError);
      return;
    }

    const userRoles = extractUserRoles(req.user);
    const hasAdminRole = userRoles.includes('admin');
    
    if (!hasAdminRole) {
      console.warn(`❌ Admin access denied for user ${req.user.email || req.user.sub}`);
      
      res.status(403).json({
        error: 'Admin privileges required',
        message: 'This resource requires admin privileges.',
        requiredRoles: ['admin'],
        userRoles: userRoles
      } as AuthError);
      return;
    }

    console.log(`✅ Admin access granted: ${req.user.email || req.user.sub}`);
    
    req.userRole = {
      isAdmin: true,
      isEditor: userRoles.includes('editor'),
      roles: userRoles
    };
    
    next();
    
  } catch (error: any) {
    console.error('❌ Admin authorization failed:', error.message);
    
    res.status(500).json({
      error: 'Authorization error',
      message: 'Unable to verify admin privileges.'
    } as AuthError);
  }
};

/**
 * Combined Authentication and Authorization Middleware
 * Validates JWT and requires admin/editor roles in one step
 */
export const authenticateAndAuthorize = [authenticateJWT, requireAdminOrEditor];

/**
 * Combined Authentication and Admin Authorization
 * Validates JWT and requires admin role in one step
 */
export const authenticateAndRequireAdmin = [authenticateJWT, requireAdmin];

// Export types for use in other files
export type { AuthenticatedRequest, JWTPayload, AuthError };

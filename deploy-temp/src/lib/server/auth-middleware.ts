import jwt from 'jsonwebtoken';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * SvelteKit JWT Authentication and Role-Based Authorization Middleware
 * 
 * This middleware validates JWTs, extracts user roles, and enforces
 * role-based access control for admin and editor privileges.
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

interface AuthError {
  error: string;
  message: string;
  requiredRoles?: string[];
  userRoles?: string[];
}

interface AuthResult {
  success: boolean;
  user?: JWTPayload;
  userRole?: {
    isAdmin: boolean;
    isEditor: boolean;
    roles: string[];
  };
  error?: AuthError;
  status?: number;
}

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
 * Validate JWT token from request
 */
export const validateJWT = (event: RequestEvent): AuthResult => {
  try {
    // Extract token from Authorization header
    const authHeader = event.request.headers.get('authorization');
    
    if (!authHeader) {
      return {
        success: false,
        status: 401,
        error: {
          error: 'Access denied',
          message: 'No authorization header provided'
        }
      };
    }

    // Check for Bearer token format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return {
        success: false,
        status: 401,
        error: {
          error: 'Access denied',
          message: 'No token provided'
        }
      };
    }

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET environment variable is not set');
      return {
        success: false,
        status: 500,
        error: {
          error: 'Server configuration error',
          message: 'Authentication service is not properly configured'
        }
      };
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    console.log(`✅ JWT validated for user: ${decoded.email || decoded.sub}`);
    
    return {
      success: true,
      user: decoded
    };
    
  } catch (error: any) {
    console.error('❌ JWT validation failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        status: 401,
        error: {
          error: 'Token expired',
          message: 'Your session has expired. Please log in again.'
        }
      };
    }
    
    if (error.name === 'JsonWebTokenError') {
      return {
        success: false,
        status: 401,
        error: {
          error: 'Invalid token',
          message: 'The provided token is invalid.'
        }
      };
    }
    
    return {
      success: false,
      status: 401,
      error: {
        error: 'Authentication failed',
        message: 'Unable to authenticate request.'
      }
    };
  }
};

/**
 * Check if user has admin or editor privileges
 */
export const requireAdminOrEditor = (user: JWTPayload): AuthResult => {
  try {
    // Extract roles from user object
    const userRoles = extractUserRoles(user);
    
    // Check for required privileges
    const hasAdminRole = userRoles.includes('admin');
    const hasEditorRole = userRoles.includes('editor');
    
    if (!hasAdminRole && !hasEditorRole) {
      console.warn(`❌ Access denied for user ${user.email || user.sub}: insufficient privileges`);
      
      return {
        success: false,
        status: 403,
        error: {
          error: 'Insufficient privileges',
          message: 'This resource requires admin or editor privileges.',
          requiredRoles: ['admin', 'editor'],
          userRoles: userRoles
        }
      };
    }

    // Log successful authorization
    const roleType = hasAdminRole ? 'admin' : 'editor';
    console.log(`✅ Access granted for ${roleType}: ${user.email || user.sub}`);
    
    return {
      success: true,
      user,
      userRole: {
        isAdmin: hasAdminRole,
        isEditor: hasEditorRole,
        roles: userRoles
      }
    };
    
  } catch (error: any) {
    console.error('❌ Role authorization failed:', error.message);
    
    return {
      success: false,
      status: 500,
      error: {
        error: 'Authorization error',
        message: 'Unable to verify user privileges.'
      }
    };
  }
};

/**
 * Check if user has admin privileges only
 */
export const requireAdmin = (user: JWTPayload): AuthResult => {
  try {
    const userRoles = extractUserRoles(user);
    const hasAdminRole = userRoles.includes('admin');
    
    if (!hasAdminRole) {
      console.warn(`❌ Admin access denied for user ${user.email || user.sub}`);
      
      return {
        success: false,
        status: 403,
        error: {
          error: 'Admin privileges required',
          message: 'This resource requires admin privileges.',
          requiredRoles: ['admin'],
          userRoles: userRoles
        }
      };
    }

    console.log(`✅ Admin access granted: ${user.email || user.sub}`);
    
    return {
      success: true,
      user,
      userRole: {
        isAdmin: true,
        isEditor: userRoles.includes('editor'),
        roles: userRoles
      }
    };
    
  } catch (error: any) {
    console.error('❌ Admin authorization failed:', error.message);
    
    return {
      success: false,
      status: 500,
      error: {
        error: 'Authorization error',
        message: 'Unable to verify admin privileges.'
      }
    };
  }
};

/**
 * Combined authentication and authorization for admin/editor
 */
export const authenticateAndAuthorize = (event: RequestEvent): AuthResult => {
  // First validate JWT
  const authResult = validateJWT(event);
  if (!authResult.success || !authResult.user) {
    return authResult;
  }
  
  // Then check roles
  return requireAdminOrEditor(authResult.user);
};

/**
 * Combined authentication and admin-only authorization
 */
export const authenticateAndRequireAdmin = (event: RequestEvent): AuthResult => {
  // First validate JWT
  const authResult = validateJWT(event);
  if (!authResult.success || !authResult.user) {
    return authResult;
  }
  
  // Then check admin role
  return requireAdmin(authResult.user);
};

/**
 * Helper function to create error responses
 */
export const createAuthErrorResponse = (result: AuthResult): Response => {
  return new Response(JSON.stringify(result.error), {
    status: result.status || 500,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// Export types for use in other files
export type { JWTPayload, AuthError, AuthResult };

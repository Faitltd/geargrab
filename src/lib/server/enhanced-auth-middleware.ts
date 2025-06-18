import jwt from 'jsonwebtoken';
import type { RequestEvent } from '@sveltejs/kit';
import { AuthMiddlewareV2 } from '$lib/auth/middleware-v2';

// Ensure environment variables are loaded
const JWT_SECRET = process.env.JWT_SECRET || 'geargrab_super_secure_jwt_secret_key_2024_production_ready_auth_system';

/**
 * Enhanced Authentication Middleware for GearGrab
 * Extends existing AuthMiddlewareV2 with role-based authorization
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
  [key: string]: any;
}

interface RoleAuthResult {
  success: boolean;
  userId?: string;
  user?: JWTPayload;
  userRole?: {
    isAdmin: boolean;
    isEditor: boolean;
    roles: string[];
  };
  error?: {
    error: string;
    message: string;
    requiredRoles?: string[];
    userRoles?: string[];
  };
  status?: number;
}

/**
 * Extract user roles from JWT payload or Firebase custom claims
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
  
  // Check for admin/editor in Firebase custom claims (GearGrab specific)
  if (user.admin === true) {
    return ['admin'];
  }
  
  if (user.editor === true) {
    return user.admin === true ? ['admin', 'editor'] : ['editor'];
  }
  
  console.warn(`⚠️ No roles found for user: ${user.email || user.sub}`);
  return ['user']; // Default role
};

/**
 * Pure JWT authentication with role extraction
 */
export const authenticateWithRoles = async (event: RequestEvent): Promise<RoleAuthResult> => {
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

    // Verify JWT token using the loaded secret
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Extract roles from user object
    const userRoles = extractUserRoles(decoded);

    console.log(`✅ JWT validated for user: ${decoded.email || decoded.sub} (roles: ${userRoles.join(', ')})`);

    return {
      success: true,
      userId: decoded.sub,
      user: decoded,
      userRole: {
        isAdmin: userRoles.includes('admin'),
        isEditor: userRoles.includes('editor'),
        roles: userRoles
      }
    };

  } catch (error: any) {
    console.error('❌ JWT authentication failed:', error.message);

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
 * Require admin or editor privileges
 */
export const requireAdminOrEditor = async (event: RequestEvent): Promise<RoleAuthResult> => {
  const authResult = await authenticateWithRoles(event);
  
  if (!authResult.success) {
    return authResult;
  }
  
  const { userRole } = authResult;
  
  if (!userRole?.isAdmin && !userRole?.isEditor) {
    console.warn(`❌ Access denied for user: insufficient privileges`);
    
    return {
      success: false,
      status: 403,
      error: {
        error: 'Insufficient privileges',
        message: 'This resource requires admin or editor privileges.',
        requiredRoles: ['admin', 'editor'],
        userRoles: userRole?.roles || []
      }
    };
  }
  
  const roleType = userRole.isAdmin ? 'admin' : 'editor';
  console.log(`✅ Access granted for ${roleType}`);
  
  return authResult;
};

/**
 * Require admin privileges only
 */
export const requireAdmin = async (event: RequestEvent): Promise<RoleAuthResult> => {
  const authResult = await authenticateWithRoles(event);
  
  if (!authResult.success) {
    return authResult;
  }
  
  const { userRole } = authResult;
  
  if (!userRole?.isAdmin) {
    console.warn(`❌ Admin access denied: insufficient privileges`);
    
    return {
      success: false,
      status: 403,
      error: {
        error: 'Admin privileges required',
        message: 'This resource requires admin privileges.',
        requiredRoles: ['admin'],
        userRoles: userRole?.roles || []
      }
    };
  }
  
  console.log(`✅ Admin access granted`);
  
  return authResult;
};

/**
 * Helper function to create error responses
 */
export const createRoleErrorResponse = (result: RoleAuthResult): Response => {
  return new Response(JSON.stringify(result.error), {
    status: result.status || 500,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Middleware wrapper for existing GearGrab endpoints
 * Maintains compatibility with current AuthMiddlewareV2 while adding role support
 */
export class EnhancedAuthMiddleware {
  /**
   * Standard authentication (existing behavior)
   */
  static async requireAuth(event: RequestEvent) {
    return AuthMiddlewareV2.requireAuth(event);
  }
  
  /**
   * Authentication with role extraction
   */
  static async requireAuthWithRoles(event: RequestEvent): Promise<RoleAuthResult> {
    return authenticateWithRoles(event);
  }
  
  /**
   * Require admin or editor privileges
   */
  static async requireAdminOrEditor(event: RequestEvent): Promise<RoleAuthResult> {
    return requireAdminOrEditor(event);
  }
  
  /**
   * Require admin privileges only
   */
  static async requireAdmin(event: RequestEvent): Promise<RoleAuthResult> {
    return requireAdmin(event);
  }
  
  /**
   * Create error response from auth result
   */
  static createErrorResponse(result: RoleAuthResult): Response {
    return createRoleErrorResponse(result);
  }
}

// Export types
export type { JWTPayload, RoleAuthResult };

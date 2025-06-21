import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EnhancedAuthMiddleware } from '$lib/server/enhanced-auth-middleware';

/**
 * Test endpoint to verify JWT authentication is working
 * This endpoint doesn't depend on Firebase or any external services
 */

// Test admin-only access
export const GET: RequestHandler = async (event) => {
  // 🔒 REQUIRE ADMIN AUTHENTICATION
  const authResult = await EnhancedAuthMiddleware.requireAdmin(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, user, userRole } = authResult;
  
  return json({
    success: true,
    message: '🎉 JWT Admin Authentication Working!',
    timestamp: new Date().toISOString(),
    authenticatedUser: {
      userId,
      email: user?.email,
      roles: userRole?.roles,
      isAdmin: userRole?.isAdmin,
      isEditor: userRole?.isEditor
    },
    testResults: {
      jwtValidation: '✅ PASSED',
      roleExtraction: '✅ PASSED',
      adminAuthorization: '✅ PASSED'
    }
  });
};

// Test admin or editor access
export const POST: RequestHandler = async (event) => {
  // 🔒 REQUIRE ADMIN OR EDITOR AUTHENTICATION
  const authResult = await EnhancedAuthMiddleware.requireAdminOrEditor(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, user, userRole } = authResult;
  
  return json({
    success: true,
    message: '🎉 JWT Admin/Editor Authentication Working!',
    timestamp: new Date().toISOString(),
    authenticatedUser: {
      userId,
      email: user?.email,
      roles: userRole?.roles,
      isAdmin: userRole?.isAdmin,
      isEditor: userRole?.isEditor
    },
    testResults: {
      jwtValidation: '✅ PASSED',
      roleExtraction: '✅ PASSED',
      adminOrEditorAuthorization: '✅ PASSED'
    }
  });
};

// Test basic authentication (any authenticated user)
export const PUT: RequestHandler = async (event) => {
  // 🔒 REQUIRE BASIC AUTHENTICATION
  const authResult = await EnhancedAuthMiddleware.requireAuthWithRoles(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, user, userRole } = authResult;
  
  return json({
    success: true,
    message: '🎉 JWT Basic Authentication Working!',
    timestamp: new Date().toISOString(),
    authenticatedUser: {
      userId,
      email: user?.email,
      roles: userRole?.roles,
      isAdmin: userRole?.isAdmin,
      isEditor: userRole?.isEditor
    },
    testResults: {
      jwtValidation: '✅ PASSED',
      roleExtraction: '✅ PASSED',
      basicAuthentication: '✅ PASSED'
    }
  });
};

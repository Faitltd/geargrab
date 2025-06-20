import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EnhancedAuthMiddleware } from '$lib/server/enhanced-auth-middleware';

/**
 * Comprehensive Authentication Demo Endpoint
 * 
 * This endpoint demonstrates all different authentication patterns:
 * - GET: Public access (no auth required)
 * - POST: Basic authentication (any authenticated user)
 * - PUT: Admin or Editor access
 * - PATCH: Admin only access
 * - DELETE: Custom role logic
 */

// Public endpoint - no authentication required
export const GET: RequestHandler = async (event) => {
  return json({
    success: true,
    message: '🌍 Public endpoint - no authentication required',
    timestamp: new Date().toISOString(),
    accessLevel: 'public',
    availableEndpoints: {
      'GET /api/auth-demo': 'Public access',
      'POST /api/auth-demo': 'Authenticated users only',
      'PUT /api/auth-demo': 'Admin or Editor only',
      'PATCH /api/auth-demo': 'Admin only',
      'DELETE /api/auth-demo': 'Custom role logic'
    },
    testTokens: {
      note: 'Use tokens from test-tokens.json file',
      adminToken: 'Has admin role - can access all endpoints',
      editorToken: 'Has editor role - can access PUT but not PATCH',
      regularUserToken: 'Has user role - can access POST only',
      noRolesToken: 'No roles - can access POST only'
    }
  });
};

// Authenticated users only - any valid JWT token
export const POST: RequestHandler = async (event) => {
  // 🔒 REQUIRE BASIC AUTHENTICATION
  const authResult = await EnhancedAuthMiddleware.requireAuthWithRoles(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, user, userRole } = authResult;

  return json({
    success: true,
    message: '🔐 Authenticated user endpoint',
    timestamp: new Date().toISOString(),
    accessLevel: 'authenticated',
    authenticatedUser: {
      userId,
      email: user?.email,
      roles: userRole?.roles,
      isAdmin: userRole?.isAdmin,
      isEditor: userRole?.isEditor
    },
    note: 'Any authenticated user can access this endpoint'
  });
};

// Admin or Editor access
export const PUT: RequestHandler = async (event) => {
  // 🔒 REQUIRE ADMIN OR EDITOR AUTHENTICATION
  const authResult = await EnhancedAuthMiddleware.requireAdminOrEditor(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, user, userRole } = authResult;

  return json({
    success: true,
    message: '👥 Admin or Editor endpoint',
    timestamp: new Date().toISOString(),
    accessLevel: 'admin_or_editor',
    authenticatedUser: {
      userId,
      email: user?.email,
      roles: userRole?.roles,
      isAdmin: userRole?.isAdmin,
      isEditor: userRole?.isEditor
    },
    note: 'Only users with admin or editor roles can access this endpoint'
  });
};

// Admin only access
export const PATCH: RequestHandler = async (event) => {
  // 🔒 REQUIRE ADMIN AUTHENTICATION
  const authResult = await EnhancedAuthMiddleware.requireAdmin(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, user, userRole } = authResult;

  return json({
    success: true,
    message: '👑 Admin only endpoint',
    timestamp: new Date().toISOString(),
    accessLevel: 'admin_only',
    authenticatedUser: {
      userId,
      email: user?.email,
      roles: userRole?.roles,
      isAdmin: userRole?.isAdmin,
      isEditor: userRole?.isEditor
    },
    note: 'Only users with admin role can access this endpoint'
  });
};

// Custom role logic - demonstrates flexible authorization
export const DELETE: RequestHandler = async (event) => {
  // 🔒 REQUIRE BASIC AUTHENTICATION FIRST
  const authResult = await EnhancedAuthMiddleware.requireAuthWithRoles(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, user, userRole } = authResult;

  // Custom authorization logic
  const userRoles = userRole?.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isModerator = userRoles.includes('moderator');
  const isOwner = user?.sub === event.url.searchParams.get('userId');
  const hasSpecialPermission = userRoles.includes('delete_permission');

  // Complex authorization: admins, moderators, resource owners, or users with special permission
  if (!isAdmin && !isModerator && !isOwner && !hasSpecialPermission) {
    return json({
      error: 'Insufficient privileges',
      message: 'You need admin, moderator, ownership, or special delete permission',
      requiredConditions: [
        'admin role',
        'moderator role', 
        'resource ownership',
        'delete_permission role'
      ],
      userRoles: userRoles,
      isOwner: isOwner
    }, { status: 403 });
  }

  // Determine authorization reason
  let authorizationReason = 'unknown';
  if (isAdmin) authorizationReason = 'admin';
  else if (isModerator) authorizationReason = 'moderator';
  else if (isOwner) authorizationReason = 'owner';
  else if (hasSpecialPermission) authorizationReason = 'special_permission';

  return json({
    success: true,
    message: '🎯 Custom authorization endpoint',
    timestamp: new Date().toISOString(),
    accessLevel: 'custom_logic',
    authenticatedUser: {
      userId,
      email: user?.email,
      roles: userRole?.roles,
      isAdmin: userRole?.isAdmin,
      isEditor: userRole?.isEditor
    },
    authorization: {
      reason: authorizationReason,
      isAdmin,
      isModerator,
      isOwner,
      hasSpecialPermission
    },
    note: 'This endpoint uses custom authorization logic with multiple conditions'
  });
};

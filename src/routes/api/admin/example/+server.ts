import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  authenticateAndAuthorize, 
  authenticateAndRequireAdmin,
  validateJWT,
  createAuthErrorResponse,
  type AuthResult 
} from '$lib/server/auth-middleware';

/**
 * EXAMPLE USAGE: SvelteKit API Routes with JWT Authentication
 * 
 * This file demonstrates how to use the JWT middleware in SvelteKit API routes
 */

// Example 1: Admin or Editor access required
export const GET: RequestHandler = async (event) => {
  // Authenticate and authorize user (requires admin OR editor role)
  const authResult: AuthResult = authenticateAndAuthorize(event);
  
  if (!authResult.success) {
    return createAuthErrorResponse(authResult);
  }

  // User is authenticated and has admin/editor privileges
  const { user, userRole } = authResult;

  return json({
    message: 'Admin/Editor access granted',
    user: {
      email: user?.email,
      sub: user?.sub
    },
    permissions: userRole,
    timestamp: new Date().toISOString()
  });
};

// Example 2: Admin-only access required
export const POST: RequestHandler = async (event) => {
  // Authenticate and require admin role specifically
  const authResult: AuthResult = authenticateAndRequireAdmin(event);
  
  if (!authResult.success) {
    return createAuthErrorResponse(authResult);
  }

  const { user, userRole } = authResult;

  try {
    const requestBody = await event.request.json();
    
    // Your admin-only business logic here
    console.log(`✅ Admin action performed by: ${user?.email}`);

    return json({
      message: 'Admin action completed successfully',
      performedBy: user?.email,
      data: requestBody,
      adminPrivileges: userRole?.isAdmin
    }, { status: 201 });

  } catch (error) {
    console.error('Error in admin action:', error);
    return json(
      { error: 'Failed to perform admin action' },
      { status: 500 }
    );
  }
};

// Example 3: Authentication only (no role requirements)
export const PUT: RequestHandler = async (event) => {
  // Just validate JWT, no role requirements
  const authResult: AuthResult = validateJWT(event);
  
  if (!authResult.success) {
    return createAuthErrorResponse(authResult);
  }

  const { user } = authResult;

  return json({
    message: 'Authenticated user access',
    user: {
      email: user?.email,
      sub: user?.sub
    },
    note: 'This endpoint only requires authentication, not specific roles'
  });
};

// Example 4: Custom role checking
export const DELETE: RequestHandler = async (event) => {
  // First authenticate
  const authResult: AuthResult = validateJWT(event);
  
  if (!authResult.success) {
    return createAuthErrorResponse(authResult);
  }

  const { user } = authResult;
  
  // Custom role logic
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isModerator = userRoles.includes('moderator');
  const isOwner = user?.sub === event.url.searchParams.get('userId');
  
  // Custom authorization: admins, moderators, or resource owners can delete
  if (!isAdmin && !isModerator && !isOwner) {
    return json({
      error: 'Insufficient privileges',
      message: 'You can only delete your own resources unless you have admin/moderator privileges',
      requiredRoles: ['admin', 'moderator'],
      userRoles: userRoles
    }, { status: 403 });
  }

  return json({
    message: 'Delete action authorized',
    authorizedAs: isAdmin ? 'admin' : isModerator ? 'moderator' : 'owner',
    user: user?.email
  });
};

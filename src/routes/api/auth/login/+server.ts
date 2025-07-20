// User Login API Endpoint
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyIdToken, getAdminFirestore } from '$lib/server/firebase-admin';
import { logger } from '$lib/server/logging';
import { captureException } from '$lib/monitoring/sentry';

interface LoginRequest {
  idToken: string;
  rememberMe?: boolean;
}

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const clientIP = getClientAddress();
  const startTime = Date.now();

  try {
    const body: LoginRequest = await request.json();
    const { idToken, rememberMe = false } = body;

    // Validation
    if (!idToken) {
      logger.warn('Login attempt without ID token', { clientIP });
      
      throw error(400, {
        message: 'Authentication token is required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    
    logger.info('ID token verified successfully', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      clientIP
    });

    // Get user profile from Firestore
    const firestore = getAdminFirestore();
    const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      logger.error('User profile not found in Firestore', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        clientIP
      });
      
      throw error(404, {
        message: 'User profile not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const userProfile = userDoc.data();

    // Update last login time
    await firestore.collection('users').doc(decodedToken.uid).update({
      lastLoginAt: new Date(),
      lastLoginIP: clientIP,
      updatedAt: new Date()
    });

    // Set session cookie
    const sessionDuration = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 24 * 60 * 60 * 1000; // 24 hours

    cookies.set('session', idToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionDuration / 1000 // Convert to seconds
    });

    logger.info('User logged in successfully', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      rememberMe,
      duration: Date.now() - startTime,
      clientIP
    });

    // Return user data
    return json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || userProfile?.name,
        emailVerified: decodedToken.email_verified,
        picture: decodedToken.picture || userProfile?.profile?.avatar,
        role: userProfile?.role || 'user',
        profile: userProfile?.profile || {},
        preferences: userProfile?.preferences || {},
        stats: userProfile?.stats || {}
      },
      message: 'Login successful'
    });

  } catch (err: any) {
    const duration = Date.now() - startTime;
    
    // Handle token verification errors
    if (err.code === 'auth/id-token-expired') {
      logger.warn('Login attempt with expired token', {
        error: err.message,
        duration,
        clientIP
      });
      
      throw error(401, {
        message: 'Authentication token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (err.code === 'auth/id-token-revoked') {
      logger.warn('Login attempt with revoked token', {
        error: err.message,
        duration,
        clientIP
      });
      
      throw error(401, {
        message: 'Authentication token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    if (err.code === 'auth/invalid-id-token') {
      logger.warn('Login attempt with invalid token', {
        error: err.message,
        duration,
        clientIP
      });
      
      throw error(401, {
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
    }

    // Log unexpected errors
    logger.error('User login failed', {
      error: err.message,
      code: err.code,
      duration,
      clientIP
    }, err);

    // Capture in Sentry
    captureException(err, {
      tags: {
        component: 'auth_login',
        clientIP
      },
      extra: {
        duration,
        errorCode: err.code
      }
    });

    // Re-throw SvelteKit errors
    if (err.status) {
      throw err;
    }

    // Generic error for unexpected issues
    throw error(500, {
      message: 'Login failed. Please try again later.',
      code: 'LOGIN_FAILED'
    });
  }
};

// Logout endpoint
export const DELETE: RequestHandler = async ({ cookies, locals, getClientAddress }) => {
  const clientIP = getClientAddress();
  
  try {
    // Clear session cookie
    cookies.delete('session', { path: '/' });
    
    // Log logout
    if (locals.user) {
      logger.info('User logged out', {
        uid: locals.user.uid,
        email: locals.user.email,
        clientIP
      });
    }

    return json({
      success: true,
      message: 'Logout successful'
    });

  } catch (err: any) {
    logger.error('Logout failed', {
      error: err.message,
      clientIP
    }, err);

    // Capture in Sentry
    captureException(err, {
      tags: {
        component: 'auth_logout',
        clientIP
      }
    });

    throw error(500, {
      message: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, isFirebaseAdminAvailable } from '$lib/firebase/server';

export const GET: RequestHandler = async ({ request, locals }) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    server: {
      firebaseAdminAvailable: isFirebaseAdminAvailable(),
      environmentVariables: {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        NODE_ENV: process.env.NODE_ENV
      },
      locals: {
        userId: locals.userId,
        user: !!locals.user
      }
    },
    request: {
      headers: {
        authorization: !!request.headers.get('Authorization'),
        authorizationValue: request.headers.get('Authorization')?.substring(0, 20) + '...',
        userAgent: request.headers.get('User-Agent'),
        origin: request.headers.get('Origin'),
        referer: request.headers.get('Referer')
      }
    }
  };

  return json(debugInfo);
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { token } = body;

    const debugInfo = {
      timestamp: new Date().toISOString(),
      tokenProvided: !!token,
      tokenLength: token?.length || 0,
      firebaseAdminAvailable: isFirebaseAdminAvailable(),
      validation: null as any
    };

    if (token && isFirebaseAdminAvailable()) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        debugInfo.validation = {
          success: true,
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
          issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
          expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
          issuer: decodedToken.iss,
          audience: decodedToken.aud
        };
      } catch (error: any) {
        debugInfo.validation = {
          success: false,
          error: error.message,
          code: error.code
        };
      }
    } else if (!token) {
      debugInfo.validation = {
        success: false,
        error: 'No token provided'
      };
    } else {
      debugInfo.validation = {
        success: false,
        error: 'Firebase Admin not available'
      };
    }

    return json(debugInfo);
  } catch (error: any) {
    return json({
      timestamp: new Date().toISOString(),
      error: 'Failed to process debug request',
      details: error.message
    }, { status: 500 });
  }
};

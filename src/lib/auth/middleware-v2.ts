import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { adminAuth, isFirebaseAdminAvailable } from '$lib/firebase/server';

/**
 * Enhanced Authentication Middleware V2
 * Simplified, reliable, and comprehensive authentication handling
 */

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  isAdmin?: boolean;
  error?: string;
  debugInfo?: any;
}

export class AuthMiddlewareV2 {
  /**
   * Extract Firebase ID token from request headers
   */
  static extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      console.log('🔍 No Authorization header found');
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('🔍 Authorization header does not start with Bearer');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('🔍 Token extracted, length:', token.length);
    return token;
  }

  /**
   * Validate Firebase ID token using Firebase Admin SDK
   */
  static async validateToken(token: string): Promise<AuthResult> {
    if (!isFirebaseAdminAvailable()) {
      console.error('❌ Firebase Admin SDK not available');
      return {
        success: false,
        error: 'Firebase Admin SDK not initialized',
        debugInfo: {
          firebaseAdminAvailable: false,
          environmentCheck: {
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
          }
        }
      };
    }

    try {
      console.log('🔍 Validating token with Firebase Admin...');
      const decodedToken = await adminAuth.verifyIdToken(token, true);
      
      console.log('✅ Token validation successful:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      });

      return {
        success: true,
        userId: decodedToken.uid,
        email: decodedToken.email || '',
        isAdmin: decodedToken.admin === true,
        debugInfo: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
          issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
          expiresAt: new Date(decodedToken.exp * 1000).toISOString()
        }
      };
    } catch (error: any) {
      console.error('❌ Token validation failed:', {
        error: error.message,
        code: error.code,
        tokenLength: token.length
      });

      return {
        success: false,
        error: `Token validation failed: ${error.message}`,
        debugInfo: {
          errorCode: error.code,
          errorMessage: error.message,
          tokenLength: token.length
        }
      };
    }
  }

  /**
   * Authenticate user from request
   */
  static async authenticateRequest(event: RequestEvent): Promise<AuthResult> {
    const startTime = Date.now();
    
    try {
      // Extract token from request
      const token = this.extractToken(event.request);
      
      if (!token) {
        const result: AuthResult = {
          success: false,
          error: 'No authentication token provided',
          debugInfo: {
            hasAuthHeader: !!event.request.headers.get('Authorization'),
            authHeaderValue: event.request.headers.get('Authorization')?.substring(0, 20) + '...',
            userAgent: event.request.headers.get('User-Agent'),
            origin: event.request.headers.get('Origin')
          }
        };
        
        console.log('❌ Authentication failed - no token:', result.debugInfo);
        return result;
      }

      // Validate token
      const authResult = await this.validateToken(token);
      
      const duration = Date.now() - startTime;
      console.log(`🔍 Authentication completed in ${duration}ms:`, {
        success: authResult.success,
        userId: authResult.userId,
        error: authResult.error
      });

      return authResult;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Authentication error after ${duration}ms:`, error);
      
      return {
        success: false,
        error: `Authentication system error: ${error.message}`,
        debugInfo: {
          systemError: error.message,
          duration
        }
      };
    }
  }

  /**
   * Require authentication for a request
   */
  static async requireAuth(event: RequestEvent): Promise<AuthResult | Response> {
    const authResult = await this.authenticateRequest(event);
    
    if (!authResult.success) {
      console.log('🚫 Authentication required but failed:', authResult.error);
      
      return json({
        error: 'Authentication required. Please log in and try again.',
        code: 'AUTH_REQUIRED',
        debugInfo: process.env.NODE_ENV === 'development' ? authResult.debugInfo : undefined
      }, { status: 401 });
    }

    return authResult;
  }

  /**
   * Set authentication data in locals
   */
  static setAuthLocals(event: RequestEvent, authResult: AuthResult): void {
    if (authResult.success && authResult.userId) {
      event.locals.userId = authResult.userId;
      event.locals.user = {
        uid: authResult.userId,
        email: authResult.email || '',
        emailVerified: true,
        isAdmin: authResult.isAdmin || false
      };
      
      console.log('✅ Authentication locals set:', {
        userId: authResult.userId,
        email: authResult.email
      });
    } else {
      event.locals.userId = null;
      event.locals.user = null;
      
      console.log('🔍 Authentication locals cleared');
    }
  }
}

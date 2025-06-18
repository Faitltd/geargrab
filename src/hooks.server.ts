import type { Handle } from '@sveltejs/kit';
import { adminAuth, isFirebaseAdminAvailable } from '$lib/firebase/server';
import { SecurityMiddleware } from '$lib/security/middleware';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  // Initialize locals
  event.locals.user = null;
  event.locals.userId = null;

  // Extract session cookie
  const sessionCookie = event.cookies.get('__session');

  // Check if Firebase Admin is available
  if (isFirebaseAdminAvailable()) {
    if (sessionCookie) {
      try {
        // Verify the session cookie
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

        // Set user information in locals
        event.locals.userId = decodedClaims.uid;
        event.locals.user = {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          emailVerified: decodedClaims.email_verified,
          displayName: decodedClaims.name,
          photoURL: decodedClaims.picture
        };

      } catch (error) {
        // Invalid session cookie - clear it
        if (!dev) {
          console.warn('Invalid session cookie:', error.message);
        }
        event.cookies.delete('__session', { path: '/' });
      }
    }

    // Try alternative authentication method if session cookie failed
    if (!event.locals.user) {
      const auth = await SecurityMiddleware.authenticateUser(event);
      if (auth) {
        event.locals.userId = auth.userId;
        event.locals.user = {
          uid: auth.userId,
          email: '', // TODO: Get from user document
          emailVerified: false, // TODO: Get from user document
          isAdmin: auth.isAdmin
        };
      }
    }
  } else {
    console.log('⚠️ Firebase Admin not available, skipping authentication');
  }

  // Add security headers
  const response = await resolve(event);

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // CSP header for production
  if (!dev) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://api.stripe.com https://*.googleapis.com; frame-src https://js.stripe.com;"
    );
  }

  const duration = Date.now() - start;
  const logData = {
    path: event.url.pathname,
    method: event.request.method,
    status: response.status,
    duration,
    userId: event.locals.userId || 'anonymous'
  };

  if (response.status >= 400) {
    console.error('Request error', logData);
  } else if (!dev) {
    console.log('Request processed', logData);
  }

  // Apply security headers to all responses (not just API endpoints)
  // Skip COOP header for auth-related routes to prevent popup communication issues
  const isAuthRoute = event.url.pathname.includes('/auth') ||
                      event.url.pathname.includes('/login') ||
                      event.url.pathname.includes('/signup') ||
                      event.url.pathname.includes('/test-auth') ||
                      event.url.pathname.includes('/book') || // Booking pages may trigger auth
                      event.url.pathname.includes('/dashboard') || // Dashboard may trigger auth
                      event.url.pathname === '/' || // Homepage has auth components
                      event.url.searchParams.has('redirectTo'); // Any page with auth redirect

  console.log(`🔒 Security headers for ${event.url.pathname}: skipCOOP=${isAuthRoute}`);
  const secureResponse = SecurityMiddleware.setSecurityHeaders(response, isAuthRoute);

  return secureResponse;
};

export function handleError({ error, event }: { error: any, event: any }) {
  const errorReport = {
    message: error?.message || 'Unknown error',
    stack: dev ? error?.stack : undefined,
    path: event.url.pathname,
    method: event.request.method,
    userId: event.locals.userId || 'anonymous',
    userAgent: event.request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
    code: error.code || 'UNKNOWN_ERROR'
  };

  // Log error with appropriate level
  if (error.statusCode && error.statusCode < 500) {
    console.warn('Client error:', JSON.stringify(errorReport));
  } else {
    console.error('Server error:', JSON.stringify(errorReport));
  }

  // Return sanitized error for client
  return {
    message: dev ? error?.message || 'An unexpected error occurred' : 'An unexpected error occurred',
    code: error?.code || 'UNKNOWN_ERROR'
  };
}

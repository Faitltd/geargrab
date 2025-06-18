import type { Handle } from '@sveltejs/kit';
import { adminAuth } from '$lib/firebase/server';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();

  // Initialize locals
  event.locals.user = null;
  event.locals.userId = null;

  // Extract session cookie
  const sessionCookie = event.cookies.get('__session');

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

  return response;
};

export function handleError({ error, event }) {
  const errorReport = {
    message: error.message,
    stack: dev ? error.stack : undefined,
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
    message: dev ? error.message : 'An unexpected error occurred',
    code: error.code || 'UNKNOWN_ERROR'
  };
}

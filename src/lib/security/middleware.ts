import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { adminAuth } from '$firebase/server';
import rateLimit from '$lib/security/rateLimit';
import { validateInput } from '$lib/security/validation';
import { auditLog } from '$lib/security/audit';

// Security middleware for API routes
export class SecurityMiddleware {
  // Rate limiting configuration
  private static rateLimits = {
    auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    upload: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
    payment: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 payment attempts per hour
    admin: { windowMs: 15 * 60 * 1000, max: 200 } // 200 admin requests per 15 minutes
  };

  // Authenticate user from session or token
  static async authenticateUser(event: RequestEvent): Promise<{ userId: string; isAdmin: boolean } | null> {
    try {
      // Try session cookie first
      const sessionCookie = event.cookies.get('__session');
      if (sessionCookie) {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        const isAdmin = decodedClaims.admin === true;
        return { userId: decodedClaims.uid, isAdmin };
      }

      // Try Authorization header
      const authHeader = event.request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const isAdmin = decodedToken.admin === true;
        return { userId: decodedToken.uid, isAdmin };
      }

      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  // Require authentication
  static async requireAuth(event: RequestEvent): Promise<{ userId: string; isAdmin: boolean } | Response> {
    const auth = await this.authenticateUser(event);
    if (!auth) {
      await auditLog.logSecurityEvent({
        type: 'unauthorized_access_attempt',
        ip: event.getClientAddress(),
        userAgent: event.request.headers.get('User-Agent') || 'unknown',
        path: event.url.pathname,
        timestamp: new Date()
      });
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    return auth;
  }

  // Require admin privileges
  static async requireAdmin(event: RequestEvent): Promise<{ userId: string; isAdmin: boolean } | Response> {
    const auth = await this.requireAuth(event);
    if (auth instanceof Response) return auth;

    if (!auth.isAdmin) {
      await auditLog.logSecurityEvent({
        type: 'admin_access_denied',
        userId: auth.userId,
        ip: event.getClientAddress(),
        userAgent: event.request.headers.get('User-Agent') || 'unknown',
        path: event.url.pathname,
        timestamp: new Date()
      });
      return json({ error: 'Admin privileges required' }, { status: 403 });
    }

    return auth;
  }

  // Apply rate limiting
  static async applyRateLimit(
    event: RequestEvent, 
    type: keyof typeof SecurityMiddleware.rateLimits
  ): Promise<Response | null> {
    const config = this.rateLimits[type];
    const clientId = event.getClientAddress();
    
    const isAllowed = await rateLimit.checkLimit(clientId, type, config);
    if (!isAllowed) {
      await auditLog.logSecurityEvent({
        type: 'rate_limit_exceeded',
        ip: clientId,
        limitType: type,
        path: event.url.pathname,
        timestamp: new Date()
      });
      return json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    return null;
  }

  // Validate request input
  static async validateRequest(
    event: RequestEvent,
    schema: any
  ): Promise<any | Response> {
    try {
      const body = await event.request.json();
      const validation = validateInput(body, schema);
      
      if (!validation.isValid) {
        await auditLog.logSecurityEvent({
          type: 'invalid_input',
          ip: event.getClientAddress(),
          path: event.url.pathname,
          errors: validation.errors,
          timestamp: new Date()
        });
        return json({ error: 'Invalid input', details: validation.errors }, { status: 400 });
      }

      return body;
    } catch (error) {
      return json({ error: 'Invalid JSON' }, { status: 400 });
    }
  }

  // CSRF protection
  static async validateCSRF(event: RequestEvent): Promise<Response | null> {
    if (event.request.method === 'GET') return null;

    const origin = event.request.headers.get('Origin');
    const referer = event.request.headers.get('Referer');
    const host = event.request.headers.get('Host');

    // Check if request is from same origin
    if (origin && !origin.includes(host || '')) {
      await auditLog.logSecurityEvent({
        type: 'csrf_attempt',
        ip: event.getClientAddress(),
        origin,
        host,
        path: event.url.pathname,
        timestamp: new Date()
      });
      return json({ error: 'CSRF protection triggered' }, { status: 403 });
    }

    return null;
  }

  // Content Security Policy headers
  static setSecurityHeaders(response: Response): Response {
    const headers = new Headers(response.headers);
    
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com",
      "frame-src https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
    
    headers.set('Content-Security-Policy', csp);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // Comprehensive security check
  static async secureEndpoint(
    event: RequestEvent,
    options: {
      requireAuth?: boolean;
      requireAdmin?: boolean;
      rateLimit?: keyof typeof SecurityMiddleware.rateLimits;
      validateCSRF?: boolean;
      inputSchema?: any;
    } = {}
  ): Promise<{ auth?: { userId: string; isAdmin: boolean }; body?: any } | Response> {
    try {
      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimitResponse = await this.applyRateLimit(event, options.rateLimit);
        if (rateLimitResponse) return rateLimitResponse;
      }

      // CSRF protection
      if (options.validateCSRF) {
        const csrfResponse = await this.validateCSRF(event);
        if (csrfResponse) return csrfResponse;
      }

      // Authentication
      let auth: { userId: string; isAdmin: boolean } | undefined;
      if (options.requireAdmin) {
        const adminAuth = await this.requireAdmin(event);
        if (adminAuth instanceof Response) return adminAuth;
        auth = adminAuth;
      } else if (options.requireAuth) {
        const userAuth = await this.requireAuth(event);
        if (userAuth instanceof Response) return userAuth;
        auth = userAuth;
      }

      // Input validation
      let body: any;
      if (options.inputSchema && event.request.method !== 'GET') {
        const validatedBody = await this.validateRequest(event, options.inputSchema);
        if (validatedBody instanceof Response) return validatedBody;
        body = validatedBody;
      }

      return { auth, body };
    } catch (error) {
      console.error('Security middleware error:', error);
      return json({ error: 'Security check failed' }, { status: 500 });
    }
  }
}

// Input validation schemas
export const ValidationSchemas = {
  // User registration
  userRegistration: {
    email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    password: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value),
    displayName: (value: string) => value.length >= 2 && value.length <= 50,
    firstName: (value: string) => value.length >= 1 && value.length <= 30,
    lastName: (value: string) => value.length >= 1 && value.length <= 30
  },

  // Booking creation
  bookingCreation: {
    listingId: (value: string) => typeof value === 'string' && value.length > 0,
    startDate: (value: string) => !isNaN(Date.parse(value)) && new Date(value) > new Date(),
    endDate: (value: string) => !isNaN(Date.parse(value)),
    totalPrice: (value: number) => typeof value === 'number' && value > 0,
    deliveryMethod: (value: string) => ['pickup', 'delivery'].includes(value)
  },

  // Payment processing
  paymentIntent: {
    amount: (value: number) => typeof value === 'number' && value >= 50, // Minimum $0.50
    currency: (value: string) => value === 'usd',
    bookingId: (value: string) => typeof value === 'string' && value.length > 0
  },

  // Background check
  backgroundCheck: {
    checkType: (value: string) => ['basic', 'standard', 'comprehensive'].includes(value),
    personalInfo: (value: any) => typeof value === 'object' && value !== null,
    consentGiven: (value: boolean) => value === true
  },

  // Message sending
  messageSending: {
    conversationId: (value: string) => typeof value === 'string' && value.length > 0,
    content: (value: string) => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000,
    type: (value: string) => ['text', 'image', 'file'].includes(value)
  },

  // Admin operations
  adminUserManagement: {
    userId: (value: string) => typeof value === 'string' && value.length > 0,
    action: (value: string) => ['grant_admin', 'revoke_admin', 'suspend', 'activate'].includes(value)
  }
};

// Helper function for API routes
export function createSecureHandler(
  handler: (event: RequestEvent, context: { auth?: { userId: string; isAdmin: boolean }; body?: any }) => Promise<Response>,
  options: Parameters<typeof SecurityMiddleware.secureEndpoint>[1] = {}
) {
  return async (event: RequestEvent) => {
    const securityResult = await SecurityMiddleware.secureEndpoint(event, options);
    
    if (securityResult instanceof Response) {
      return SecurityMiddleware.setSecurityHeaders(securityResult);
    }

    try {
      const response = await handler(event, securityResult);
      return SecurityMiddleware.setSecurityHeaders(response);
    } catch (error) {
      console.error('Handler error:', error);
      const errorResponse = json({ error: 'Internal server error' }, { status: 500 });
      return SecurityMiddleware.setSecurityHeaders(errorResponse);
    }
  };
}

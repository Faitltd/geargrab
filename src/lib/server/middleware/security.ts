// Security Middleware
// Enforces HTTPS, security headers, and other security measures

import { config } from '$lib/config/production';
import type { Handle } from '@sveltejs/kit';

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client IP address
 */
function getClientIP(request: Request, trustProxy: boolean = false): string {
  if (trustProxy) {
    // Check various proxy headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    const clientIP = request.headers.get('x-client-ip');
    if (clientIP) {
      return clientIP;
    }
  }

  // Fallback to connection info (not available in all environments)
  return 'unknown';
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetTime: number } {
  if (!config.security.rateLimiting.enabled) {
    return { allowed: true, remaining: Infinity, resetTime: 0 };
  }

  const now = Date.now();
  const windowMs = config.security.rateLimiting.windowMs;
  const maxRequests = config.security.rateLimiting.maxRequests;

  // Clean up expired entries
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }

  // Get or create rate limit data for this IP
  let rateLimitData = rateLimitStore.get(clientIP);
  
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + windowMs
    };
    rateLimitStore.set(clientIP, rateLimitData);
  }

  // Check if limit exceeded
  if (rateLimitData.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: rateLimitData.resetTime
    };
  }

  // Increment counter
  rateLimitData.count++;
  
  return {
    allowed: true,
    remaining: maxRequests - rateLimitData.count,
    resetTime: rateLimitData.resetTime
  };
}

/**
 * HTTPS enforcement
 */
function enforceHTTPS(request: Request): Response | null {
  if (!config.security.enforceHttps) {
    return null;
  }

  const url = new URL(request.url);
  
  // Check if request is already HTTPS
  if (url.protocol === 'https:') {
    return null;
  }

  // Check for proxy headers indicating HTTPS
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto === 'https') {
    return null;
  }

  // Redirect to HTTPS
  url.protocol = 'https:';
  return new Response(null, {
    status: 301,
    headers: {
      'Location': url.toString(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }
  });
}

/**
 * Add comprehensive security headers
 */
function addSecurityHeaders(response: Response, request: Request): void {
  const headers = response.headers;
  const url = new URL(request.url);

  // Strict Transport Security (HSTS)
  if (config.security.enforceHttps) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  const csp = buildContentSecurityPolicy(url.pathname);
  headers.set('Content-Security-Policy', csp);

  // X-Content-Type-Options
  headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  headers.set('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
    'clipboard-read=()',
    'clipboard-write=(self)'
  ].join(', '));

  // Cross-Origin Policies
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Remove server information
  headers.delete('Server');
  headers.delete('X-Powered-By');

  // Add custom security headers
  headers.set('X-Security-Headers', 'enabled');
  headers.set('X-Content-Security-Policy', csp); // Legacy support
}

/**
 * Build Content Security Policy based on route
 */
function buildContentSecurityPolicy(pathname: string): string {
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for SvelteKit
      "'unsafe-eval'", // Required for development
      'https://js.stripe.com',
      'https://www.gstatic.com',
      'https://www.google.com',
      'https://www.recaptcha.net',
      'https://apis.google.com', // Required for Google Auth
      'https://accounts.google.com' // Required for Google Auth
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for component styles
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      '*',
      'data:',
      'blob:',
      'https:',
      'http:'
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://*.googleapis.com',
      'https://*.firebaseio.com',
      'wss://*.firebaseio.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com'
    ],
    'frame-src': [
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      'https://www.google.com', // reCAPTCHA and Google Auth
      'https://www.recaptcha.net',
      'https://accounts.google.com' // Google Auth
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };

  // Adjust CSP for specific routes
  if (pathname.startsWith('/admin')) {
    // Admin routes might need additional permissions
    baseCSP['script-src'].push("'unsafe-eval'");
  }

  if (pathname.startsWith('/api/')) {
    // API routes don't need most CSP directives
    return "default-src 'none'; frame-ancestors 'none';";
  }

  // Build CSP string
  const cspParts = Object.entries(baseCSP).map(([directive, sources]) => {
    if (sources.length === 0) {
      return directive;
    }
    return `${directive} ${sources.join(' ')}`;
  });

  return cspParts.join('; ');
}

/**
 * CORS handling
 */
function handleCORS(request: Request): Response | null {
  const origin = request.headers.get('origin');
  
  if (!origin) {
    return null; // Not a CORS request
  }

  // Check if origin is allowed
  const isAllowed = config.security.corsOrigins.includes(origin) || 
                   config.security.corsOrigins.includes('*');

  if (!isAllowed) {
    return new Response('CORS policy violation', { status: 403 });
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  return null;
}

/**
 * Security middleware
 */
export const securityMiddleware: Handle = async ({ event, resolve }) => {
  const { request } = event;
  const clientIP = getClientIP(request, config.security.trustProxy);

  // HTTPS enforcement
  const httpsRedirect = enforceHTTPS(request);
  if (httpsRedirect) {
    return httpsRedirect;
  }

  // CORS handling
  const corsResponse = handleCORS(request);
  if (corsResponse) {
    return corsResponse;
  }

  // Rate limiting
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.security.rateLimiting.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  }

  // Process request
  const response = await resolve(event);

  // Clone response to modify headers
  const secureResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });

  // Add security headers
  addSecurityHeaders(secureResponse, request);

  // Add rate limit headers
  if (config.security.rateLimiting.enabled) {
    secureResponse.headers.set('X-RateLimit-Limit', config.security.rateLimiting.maxRequests.toString());
    secureResponse.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    secureResponse.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
  }

  // Add CORS headers for allowed origins
  const origin = request.headers.get('origin');
  if (origin && config.security.corsOrigins.includes(origin)) {
    secureResponse.headers.set('Access-Control-Allow-Origin', origin);
    secureResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return secureResponse;
};

export default securityMiddleware;

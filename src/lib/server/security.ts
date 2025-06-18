import { json, type RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  api: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  upload: { requests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
  payment: { requests: 3, windowMs: 60 * 1000 } // 3 payment attempts per minute
};

/**
 * Rate limiting middleware
 */
export function rateLimit(type: keyof typeof RATE_LIMITS = 'api') {
  return (event: RequestEvent) => {
    if (dev) return null; // Skip rate limiting in development
    
    const config = RATE_LIMITS[type];
    const clientIP = getClientIP(event);
    const key = `${type}:${clientIP}`;
    const now = Date.now();
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return null;
    }
    
    if (current.count >= config.requests) {
      return json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
          }
        }
      );
    }
    
    current.count++;
    return null;
  };
}

/**
 * Authentication middleware
 */
export function requireAuth(event: RequestEvent) {
  if (!event.locals.userId) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  return null;
}

/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize string input
 */
export function validateString(
  input: unknown,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): { isValid: boolean; value?: string; error?: string } {
  if (input === null || input === undefined) {
    if (options.required) {
      return { isValid: false, error: 'Field is required' };
    }
    return { isValid: true, value: '' };
  }
  
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Must be a string' };
  }
  
  const trimmed = input.trim();
  
  if (options.required && trimmed.length === 0) {
    return { isValid: false, error: 'Field is required' };
  }
  
  if (options.minLength && trimmed.length < options.minLength) {
    return { isValid: false, error: `Must be at least ${options.minLength} characters` };
  }
  
  if (options.maxLength && trimmed.length > options.maxLength) {
    return { isValid: false, error: `Must be no more than ${options.maxLength} characters` };
  }
  
  if (options.pattern && !options.pattern.test(trimmed)) {
    return { isValid: false, error: 'Invalid format' };
  }
  
  return { isValid: true, value: sanitizeHtml(trimmed) };
}

/**
 * Validate number input
 */
export function validateNumber(
  input: unknown,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): { isValid: boolean; value?: number; error?: string } {
  if (input === null || input === undefined) {
    if (options.required) {
      return { isValid: false, error: 'Field is required' };
    }
    return { isValid: true, value: 0 };
  }
  
  const num = Number(input);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a valid number' };
  }
  
  if (options.integer && !Number.isInteger(num)) {
    return { isValid: false, error: 'Must be an integer' };
  }
  
  if (options.min !== undefined && num < options.min) {
    return { isValid: false, error: `Must be at least ${options.min}` };
  }
  
  if (options.max !== undefined && num > options.max) {
    return { isValid: false, error: `Must be no more than ${options.max}` };
  }
  
  return { isValid: true, value: num };
}

/**
 * Get client IP address
 */
function getClientIP(event: RequestEvent): string {
  const forwarded = event.request.headers.get('x-forwarded-for');
  const realIP = event.request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return event.getClientAddress();
}

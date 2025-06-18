// Rate limiting utilities for API protection
// Prevents abuse and ensures fair usage of resources

import type { RateLimitInfo } from '$lib/types/prisma';
import { sanitizeRateLimitKey } from './sanitizer';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given key
 * @param key - Unique identifier for the rate limit (e.g., 'comment:userId', 'api:ip')
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @throws Error if rate limit is exceeded
 */
export async function checkRateLimit(
  key: string, 
  limit: number, 
  windowSeconds: number
): Promise<RateLimitInfo> {
  const sanitizedKey = sanitizeRateLimitKey(key);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const resetTime = new Date(now + windowMs);

  // Get current rate limit data
  const current = rateLimitStore.get(sanitizedKey);

  // If no data exists or window has expired, create new entry
  if (!current || now > current.resetTime) {
    const newEntry = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(sanitizedKey, newEntry);
    
    return {
      limit,
      remaining: limit - 1,
      resetTime
    };
  }

  // Increment counter
  current.count++;
  rateLimitStore.set(sanitizedKey, current);

  const remaining = Math.max(0, limit - current.count);
  const rateLimitInfo: RateLimitInfo = {
    limit,
    remaining,
    resetTime: new Date(current.resetTime)
  };

  // Check if limit exceeded
  if (current.count > limit) {
    const error = new Error('Rate limit exceeded');
    (error as any).rateLimitInfo = rateLimitInfo;
    throw error;
  }

  return rateLimitInfo;
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(key: string, limit: number): RateLimitInfo | null {
  const sanitizedKey = sanitizeRateLimitKey(key);
  const current = rateLimitStore.get(sanitizedKey);
  const now = Date.now();

  if (!current || now > current.resetTime) {
    return {
      limit,
      remaining: limit,
      resetTime: new Date(now + 60000) // Default 1 minute window
    };
  }

  return {
    limit,
    remaining: Math.max(0, limit - current.count),
    resetTime: new Date(current.resetTime)
  };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  const sanitizedKey = sanitizeRateLimitKey(key);
  rateLimitStore.delete(sanitizedKey);
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limiting middleware for different actions
 */
export const RateLimits = {
  // Comment creation: 10 comments per minute
  COMMENT_CREATE: { limit: 10, windowSeconds: 60 },
  
  // Article creation: 5 articles per hour
  ARTICLE_CREATE: { limit: 5, windowSeconds: 3600 },
  
  // Login attempts: 5 attempts per 15 minutes
  LOGIN_ATTEMPT: { limit: 5, windowSeconds: 900 },
  
  // Password reset: 3 attempts per hour
  PASSWORD_RESET: { limit: 3, windowSeconds: 3600 },
  
  // API requests: 100 requests per minute
  API_REQUEST: { limit: 100, windowSeconds: 60 },
  
  // Search queries: 30 searches per minute
  SEARCH_QUERY: { limit: 30, windowSeconds: 60 },
  
  // File uploads: 10 uploads per hour
  FILE_UPLOAD: { limit: 10, windowSeconds: 3600 },
  
  // Like/unlike actions: 50 per minute
  LIKE_ACTION: { limit: 50, windowSeconds: 60 },
  
  // Report submissions: 5 reports per hour
  REPORT_SUBMIT: { limit: 5, windowSeconds: 3600 }
};

/**
 * Apply rate limiting with predefined limits
 */
export async function applyRateLimit(
  action: keyof typeof RateLimits,
  identifier: string
): Promise<RateLimitInfo> {
  const config = RateLimits[action];
  const key = `${action.toLowerCase()}:${identifier}`;
  
  return await checkRateLimit(key, config.limit, config.windowSeconds);
}

/**
 * Rate limiting decorator for service methods
 */
export function rateLimit(action: keyof typeof RateLimits) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Assume first argument contains user context with userId
      const context = args.find(arg => arg && arg.userId);
      const identifier = context?.userId || 'anonymous';

      try {
        await applyRateLimit(action, identifier);
        return await method.apply(this, args);
      } catch (error) {
        if (error instanceof Error && (error as any).rateLimitInfo) {
          // Re-throw with rate limit info
          throw error;
        }
        throw error;
      }
    };
  };
}

/**
 * IP-based rate limiting for anonymous users
 */
export async function checkIpRateLimit(
  ip: string,
  action: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitInfo> {
  // Sanitize IP address
  const sanitizedIp = ip.replace(/[^0-9a-f:.]/gi, '');
  const key = `ip:${action}:${sanitizedIp}`;
  
  return await checkRateLimit(key, limit, windowSeconds);
}

/**
 * Sliding window rate limiter (more accurate but memory intensive)
 */
class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();

  async check(key: string, limit: number, windowSeconds: number): Promise<RateLimitInfo> {
    const sanitizedKey = sanitizeRateLimitKey(key);
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Get or create window
    let timestamps = this.windows.get(sanitizedKey) || [];
    
    // Remove expired timestamps
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    // Check if limit would be exceeded
    if (timestamps.length >= limit) {
      const oldestTimestamp = Math.min(...timestamps);
      const resetTime = new Date(oldestTimestamp + windowMs);
      
      const error = new Error('Rate limit exceeded');
      (error as any).rateLimitInfo = {
        limit,
        remaining: 0,
        resetTime
      };
      throw error;
    }

    // Add current timestamp
    timestamps.push(now);
    this.windows.set(sanitizedKey, timestamps);

    return {
      limit,
      remaining: limit - timestamps.length,
      resetTime: new Date(now + windowMs)
    };
  }

  cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hour

    for (const [key, timestamps] of this.windows.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > oneHourAgo);
      
      if (validTimestamps.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, validTimestamps);
      }
    }
  }
}

// Export singleton instance for sliding window rate limiting
export const slidingWindowLimiter = new SlidingWindowRateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredRateLimits();
    slidingWindowLimiter.cleanup();
  }, 300000); // 5 minutes
}

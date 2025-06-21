/**
 * Rate Limiting Middleware
 * Implements rate limiting for API endpoints
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  standardHeaders?: boolean; // Return rate limit info in headers
  legacyHeaders?: boolean; // Return rate limit info in legacy headers
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

interface RateLimitInfo {
  totalHits: number;
  totalResets: number;
  resetTime: Date;
}

// In-memory store for rate limiting (use Redis in production)
class MemoryStore {
  private hits: Map<string, { count: number; resetTime: Date }> = new Map();

  increment(key: string, windowMs: number): RateLimitInfo {
    const now = new Date();
    const resetTime = new Date(now.getTime() + windowMs);
    
    const current = this.hits.get(key);
    
    if (!current || current.resetTime <= now) {
      // First request or window expired
      this.hits.set(key, { count: 1, resetTime });
      return {
        totalHits: 1,
        totalResets: 1,
        resetTime
      };
    }
    
    // Increment existing count
    current.count++;
    this.hits.set(key, current);
    
    return {
      totalHits: current.count,
      totalResets: 1,
      resetTime: current.resetTime
    };
  }

  resetKey(key: string): void {
    this.hits.delete(key);
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = new Date();
    for (const [key, value] of this.hits.entries()) {
      if (value.resetTime <= now) {
        this.hits.delete(key);
      }
    }
  }
}

const store = new MemoryStore();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  store.cleanup();
}, 10 * 60 * 1000);

/**
 * Default key generator - uses IP address
 */
const defaultKeyGenerator = (req: Request): string => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};

/**
 * Rate limiting middleware factory
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const info = store.increment(key, windowMs);
    
    // Set rate limit headers
    if (standardHeaders) {
      res.set({
        'RateLimit-Limit': max.toString(),
        'RateLimit-Remaining': Math.max(0, max - info.totalHits).toString(),
        'RateLimit-Reset': new Date(info.resetTime).toISOString(),
      });
    }
    
    if (legacyHeaders) {
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - info.totalHits).toString(),
        'X-RateLimit-Reset': Math.ceil(info.resetTime.getTime() / 1000).toString(),
      });
    }
    
    // Check if limit exceeded
    if (info.totalHits > max) {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((info.resetTime.getTime() - Date.now()) / 1000)
      });
      return;
    }
    
    // Handle response to potentially skip counting
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalSend = res.send;
      res.send = function(body) {
        const shouldSkip = 
          (skipSuccessfulRequests && res.statusCode < 400) ||
          (skipFailedRequests && res.statusCode >= 400);
        
        if (shouldSkip) {
          // Decrement the count
          const current = store['hits'].get(key);
          if (current && current.count > 0) {
            current.count--;
            store['hits'].set(key, current);
          }
        }
        
        return originalSend.call(this, body);
      };
    }
    
    next();
  };
};

/**
 * Predefined rate limiters for common use cases
 */

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for write operations
export const writeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 write operations per minute
  message: 'Too many write operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient rate limiter for read operations
export const readRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 read operations per minute
  message: 'Too many read operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * User-based rate limiting (requires authentication)
 */
export const userRateLimit = (options: Omit<RateLimitOptions, 'keyGenerator'>) => {
  return rateLimit({
    ...options,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip || 'unknown';
    }
  });
};

/**
 * Skip rate limiting for certain conditions
 */
export const skipRateLimit = (condition: (req: Request) => boolean) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      next();
      return;
    }
    
    // Apply default rate limiting if condition not met
    apiRateLimit(req, res, next);
  };
};

// Skip rate limiting for admin users
export const skipForAdmin = skipRateLimit((req: Request) => {
  return req.user?.roles.includes('admin') || false;
});

// Skip rate limiting for API keys
export const skipForApiKey = skipRateLimit((req: Request) => {
  return !!req.headers['x-api-key'];
});

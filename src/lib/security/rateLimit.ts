// In-memory rate limiting (for production, use Redis or similar)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async checkLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<boolean> {
    const now = Date.now();
    const key = identifier;
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  async getRemainingRequests(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<{ remaining: number; resetTime: number }> {
    const entry = this.store.get(identifier);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return { remaining: maxRequests - 1, resetTime: now + windowMs };
    }

    return {
      remaining: Math.max(0, maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// Advanced rate limiting with different strategies
export class RateLimit {
  // Check if request is within rate limit
  async checkLimit(
    identifier: string,
    type: string,
    config: RateLimitConfig
  ): Promise<boolean> {
    const key = `${type}:${identifier}`;
    return rateLimitStore.checkLimit(key, config.windowMs, config.max);
  }

  // Get remaining requests for identifier
  async getRemainingRequests(
    identifier: string,
    type: string,
    config: RateLimitConfig
  ): Promise<{ remaining: number; resetTime: number }> {
    const key = `${type}:${identifier}`;
    return rateLimitStore.getRemainingRequests(key, config.windowMs, config.max);
  }

  // Progressive rate limiting (stricter limits for repeated violations)
  async checkProgressiveLimit(
    identifier: string,
    type: string,
    baseConfig: RateLimitConfig,
    violationMultiplier: number = 0.5
  ): Promise<boolean> {
    const violationKey = `violations:${type}:${identifier}`;
    const violationEntry = rateLimitStore.store.get(violationKey);
    
    let adjustedMax = baseConfig.max;
    if (violationEntry && violationEntry.count > 0) {
      adjustedMax = Math.max(1, Math.floor(baseConfig.max * violationMultiplier));
    }

    const isAllowed = await this.checkLimit(identifier, type, {
      ...baseConfig,
      max: adjustedMax
    });

    // Track violations
    if (!isAllowed) {
      const now = Date.now();
      const violationResetTime = now + (24 * 60 * 60 * 1000); // 24 hours
      
      if (!violationEntry || now > violationEntry.resetTime) {
        rateLimitStore.store.set(violationKey, {
          count: 1,
          resetTime: violationResetTime
        });
      } else {
        violationEntry.count++;
      }
    }

    return isAllowed;
  }

  // IP-based rate limiting with geolocation consideration
  async checkIPLimit(
    ip: string,
    type: string,
    config: RateLimitConfig,
    userAgent?: string
  ): Promise<boolean> {
    // More strict limits for suspicious user agents
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];

    const isSuspicious = userAgent && suspiciousPatterns.some(pattern => 
      pattern.test(userAgent)
    );

    const adjustedConfig = isSuspicious ? {
      ...config,
      max: Math.floor(config.max * 0.1) // 10% of normal limit
    } : config;

    return this.checkLimit(ip, `ip:${type}`, adjustedConfig);
  }

  // User-based rate limiting
  async checkUserLimit(
    userId: string,
    type: string,
    config: RateLimitConfig
  ): Promise<boolean> {
    return this.checkLimit(userId, `user:${type}`, config);
  }

  // Combined IP and user rate limiting
  async checkCombinedLimit(
    ip: string,
    userId: string | null,
    type: string,
    config: RateLimitConfig
  ): Promise<boolean> {
    // Check IP limit first
    const ipAllowed = await this.checkIPLimit(ip, type, config);
    if (!ipAllowed) return false;

    // If user is authenticated, also check user limit
    if (userId) {
      const userAllowed = await this.checkUserLimit(userId, type, {
        ...config,
        max: config.max * 2 // Authenticated users get higher limits
      });
      return userAllowed;
    }

    return true;
  }

  // Burst protection (allow short bursts but enforce longer-term limits)
  async checkBurstLimit(
    identifier: string,
    type: string,
    shortConfig: RateLimitConfig, // e.g., 10 requests per minute
    longConfig: RateLimitConfig   // e.g., 100 requests per hour
  ): Promise<boolean> {
    const shortTermAllowed = await this.checkLimit(
      identifier, 
      `${type}:short`, 
      shortConfig
    );
    
    const longTermAllowed = await this.checkLimit(
      identifier, 
      `${type}:long`, 
      longConfig
    );

    return shortTermAllowed && longTermAllowed;
  }

  // Adaptive rate limiting based on system load
  async checkAdaptiveLimit(
    identifier: string,
    type: string,
    baseConfig: RateLimitConfig,
    systemLoadFactor: number = 1.0 // 1.0 = normal, 0.5 = high load
  ): Promise<boolean> {
    const adjustedConfig = {
      ...baseConfig,
      max: Math.floor(baseConfig.max * systemLoadFactor)
    };

    return this.checkLimit(identifier, type, adjustedConfig);
  }

  // Clear rate limit for identifier (admin function)
  async clearLimit(identifier: string, type: string): Promise<void> {
    const key = `${type}:${identifier}`;
    rateLimitStore.store.delete(key);
  }

  // Get rate limit status
  async getLimitStatus(
    identifier: string,
    type: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    total: number;
  }> {
    const allowed = await this.checkLimit(identifier, type, config);
    const { remaining, resetTime } = await this.getRemainingRequests(
      identifier, 
      type, 
      config
    );

    return {
      allowed,
      remaining,
      resetTime,
      total: config.max
    };
  }
}

// Export singleton instance
export const rateLimit = new RateLimit();

// Rate limit middleware for specific endpoints
export function createRateLimitMiddleware(
  type: string,
  config: RateLimitConfig,
  options: {
    keyGenerator?: (request: Request, ip: string) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  } = {}
) {
  return async (request: Request, ip: string): Promise<{
    allowed: boolean;
    headers: Record<string, string>;
  }> => {
    const identifier = options.keyGenerator ? 
      options.keyGenerator(request, ip) : ip;

    const status = await rateLimit.getLimitStatus(identifier, type, config);

    const headers = {
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(status.resetTime / 1000).toString()
    };

    if (!status.allowed) {
      headers['Retry-After'] = Math.ceil((status.resetTime - Date.now()) / 1000).toString();
    }

    return {
      allowed: status.allowed,
      headers
    };
  };
}

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // Authentication endpoints
  auth: {
    login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    register: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 registrations per hour
    passwordReset: { windowMs: 60 * 60 * 1000, max: 3 } // 3 resets per hour
  },

  // API endpoints
  api: {
    general: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    search: { windowMs: 60 * 1000, max: 30 }, // 30 searches per minute
    upload: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
    payment: { windowMs: 60 * 60 * 1000, max: 20 } // 20 payment attempts per hour
  },

  // Admin endpoints
  admin: {
    general: { windowMs: 15 * 60 * 1000, max: 200 }, // 200 requests per 15 minutes
    userManagement: { windowMs: 60 * 60 * 1000, max: 50 }, // 50 user operations per hour
    systemOperations: { windowMs: 60 * 60 * 1000, max: 100 } // 100 system ops per hour
  }
};

// Cleanup function for graceful shutdown
export function cleanup(): void {
  rateLimitStore.destroy();
}

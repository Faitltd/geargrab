// Production configuration and environment setup
// Handles all production-specific optimizations and settings

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// Production environment validation
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = dev || env.NODE_ENV === 'development';
export const isStaging = env.NODE_ENV === 'staging';

// Environment configuration
export const config = {
  // Application settings
  app: {
    name: 'GearGrab',
    version: env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV || 'development',
    port: parseInt(env.PORT || '3000', 10),
    host: env.HOST || '0.0.0.0',
    url: publicEnv.PUBLIC_APP_URL || 'http://localhost:3000'
  },

  // Security settings
  security: {
    enforceHttps: isProduction,
    trustProxy: isProduction,
    sessionSecret: env.SESSION_SECRET || 'dev-session-secret',
    corsOrigins: isProduction 
      ? [publicEnv.PUBLIC_APP_URL] 
      : ['http://localhost:3000', 'http://localhost:5173'],
    rateLimiting: {
      enabled: isProduction,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: isProduction ? 100 : 1000
    }
  },

  // Performance settings
  performance: {
    compression: {
      enabled: true,
      level: isProduction ? 6 : 1,
      threshold: 1024,
      filter: (req: any) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Fallback to standard filter function
        return true;
      }
    },
    caching: {
      staticAssets: {
        maxAge: isProduction ? 31536000 : 0, // 1 year in production, 0 in dev
        immutable: isProduction,
        etag: true
      },
      api: {
        maxAge: isProduction ? 300 : 0, // 5 minutes in production
        staleWhileRevalidate: isProduction ? 3600 : 0 // 1 hour
      }
    }
  },

  // Firebase configuration
  firebase: {
    projectId: publicEnv.PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    storageBucket: publicEnv.PUBLIC_FIREBASE_STORAGE_BUCKET,
    databaseURL: `https://${publicEnv.PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
  },

  // Stripe configuration (mock for demo)
  stripe: {
    secretKey: 'sk_demo_mock_key',
    publishableKey: publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_demo_mock_key',
    webhookSecret: 'whsec_demo_mock_secret',
    apiVersion: '2023-10-16' as const
  },

  // Logging configuration
  logging: {
    level: isProduction ? 'info' : 'debug',
    structured: isProduction,
    console: !isProduction,
    cloudLogging: isProduction,
    projectId: publicEnv.PUBLIC_FIREBASE_PROJECT_ID
  },

  // Error monitoring
  monitoring: {
    sentry: {
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV || 'development',
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      profilesSampleRate: isProduction ? 0.1 : 1.0,
      enabled: isProduction && !!env.SENTRY_DSN
    }
  },

  // Database configuration
  database: {
    connectionPooling: isProduction,
    maxConnections: isProduction ? 10 : 5,
    idleTimeout: 30000,
    connectionTimeout: 10000
  },

  // Email configuration (if needed)
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587', 10),
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    },
    from: env.EMAIL_FROM || 'noreply@geargrab.com'
  }
};

// Validate required environment variables
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required for all environments
  const requiredVars = [
    'PUBLIC_FIREBASE_PROJECT_ID',
    'PUBLIC_FIREBASE_API_KEY',
    'PUBLIC_FIREBASE_AUTH_DOMAIN'
  ];

  // Additional required vars for production (removed for demo deployment)
  if (isProduction) {
    // For demo deployment, we use mock implementations
    // In real production, these would be required:
    // 'FIREBASE_CLIENT_EMAIL',
    // 'FIREBASE_PRIVATE_KEY',
    // 'STRIPE_SECRET_KEY',
    // 'SESSION_SECRET'
  }

  for (const varName of requiredVars) {
    const value = varName.startsWith('PUBLIC_') 
      ? publicEnv[varName] 
      : env[varName];
    
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate Firebase private key format
  if (isProduction && env.FIREBASE_PRIVATE_KEY) {
    if (!env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      errors.push('FIREBASE_PRIVATE_KEY appears to be invalid format');
    }
  }

  // Validate session secret length
  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Initialize production optimizations
export function initializeProduction() {
  if (!isProduction) return;

  // Set process title
  process.title = 'geargrab-server';

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // In production, we might want to restart the process
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, we might want to restart the process
    process.exit(1);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Graceful shutdown...`);
    // Perform cleanup here
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Export environment check utilities
export const env_utils = {
  isProduction,
  isDevelopment,
  isStaging,
  validateEnvironment,
  initializeProduction
};

export default config;

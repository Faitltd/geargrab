// Sentry Error Monitoring Setup
// Comprehensive error tracking and performance monitoring

import * as Sentry from '@sentry/sveltekit';
import { config } from '$lib/config/production';

// Sentry configuration
const sentryConfig: Sentry.NodeOptions = {
  dsn: config.monitoring.sentry.dsn,
  environment: config.monitoring.sentry.environment,
  
  // Performance monitoring
  tracesSampleRate: config.monitoring.sentry.tracesSampleRate,
  profilesSampleRate: config.monitoring.sentry.profilesSampleRate,
  
  // Release tracking
  release: `geargrab@${config.app.version}`,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out development errors
    if (config.app.environment === 'development') {
      return null;
    }

    // Filter out known non-critical errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Skip network errors that are user-related
      if (error.message.includes('NetworkError') || 
          error.message.includes('Failed to fetch')) {
        return null;
      }

      // Skip authentication errors (these are expected)
      if (error.message.includes('auth/') || 
          error.message.includes('Authentication')) {
        return null;
      }

      // Skip validation errors (these are user errors)
      if (error.message.includes('validation') || 
          error.message.includes('Invalid input')) {
        return null;
      }
    }

    return event;
  },

  // Performance filtering
  beforeSendTransaction(event) {
    // Skip health check transactions
    if (event.transaction?.includes('/health')) {
      return null;
    }

    // Skip static asset requests
    if (event.transaction?.includes('/_app/') || 
        event.transaction?.includes('/favicon.ico')) {
      return null;
    }

    return event;
  },

  // Integration configuration
  integrations: [
    // HTTP integration for request tracking
    new Sentry.Integrations.Http({ tracing: true }),
    
    // Console integration for console.error tracking
    new Sentry.Integrations.Console(),
    
    // Local variables integration for better debugging
    new Sentry.Integrations.LocalVariables({
      captureAllExceptions: false
    }),
    
    // Context lines integration
    new Sentry.Integrations.ContextLines()
  ],

  // Additional options
  attachStacktrace: true,
  sendDefaultPii: false, // Don't send personally identifiable information
  maxBreadcrumbs: 50,
  
  // Transport options
  transport: Sentry.makeNodeTransport,
  
  // Debug mode (only in development)
  debug: config.app.environment === 'development'
};

/**
 * Initialize Sentry
 */
export function initializeSentry(): void {
  if (!config.monitoring.sentry.enabled) {
    console.log('Sentry monitoring disabled');
    return;
  }

  try {
    Sentry.init(sentryConfig);
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: {
    user?: { id: string; email?: string; username?: string };
    tags?: { [key: string]: string };
    extra?: { [key: string]: any };
    level?: Sentry.SeverityLevel;
  }
): string {
  if (!config.monitoring.sentry.enabled) {
    console.error('Error (Sentry disabled):', error);
    return '';
  }

  return Sentry.withScope((scope) => {
    // Set user context
    if (context?.user) {
      scope.setUser(context.user);
    }

    // Set tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Set extra context
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    // Set level
    if (context?.level) {
      scope.setLevel(context.level);
    }

    return Sentry.captureException(error);
  });
}

/**
 * Capture message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    user?: { id: string; email?: string; username?: string };
    tags?: { [key: string]: string };
    extra?: { [key: string]: any };
  }
): string {
  if (!config.monitoring.sentry.enabled) {
    console.log(`Message (Sentry disabled): ${message}`);
    return '';
  }

  return Sentry.withScope((scope) => {
    // Set user context
    if (context?.user) {
      scope.setUser(context.user);
    }

    // Set tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Set extra context
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);

    return Sentry.captureMessage(message, level);
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data?: { [key: string]: any }
): void {
  if (!config.monitoring.sentry.enabled) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000
  });
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}): void {
  if (!config.monitoring.sentry.enabled) {
    return;
  }

  Sentry.setUser(user);
}

/**
 * Set tag
 */
export function setTag(key: string, value: string): void {
  if (!config.monitoring.sentry.enabled) {
    return;
  }

  Sentry.setTag(key, value);
}

/**
 * Set extra context
 */
export function setExtra(key: string, value: any): void {
  if (!config.monitoring.sentry.enabled) {
    return;
  }

  Sentry.setExtra(key, value);
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string = 'http.server'
): Sentry.Transaction {
  if (!config.monitoring.sentry.enabled) {
    // Return a mock transaction
    return {
      finish: () => {},
      setTag: () => {},
      setData: () => {},
      setStatus: () => {},
      startChild: () => startTransaction('child', 'child')
    } as any;
  }

  return Sentry.startTransaction({
    name,
    op,
    tags: {
      environment: config.app.environment,
      version: config.app.version
    }
  });
}

/**
 * Flush Sentry events (useful for serverless)
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  if (!config.monitoring.sentry.enabled) {
    return true;
  }

  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    console.error('Failed to flush Sentry events:', error);
    return false;
  }
}

/**
 * Performance monitoring middleware
 */
export function withSentryPerformance<T extends (...args: any[]) => any>(
  fn: T,
  transactionName: string,
  op: string = 'function'
): T {
  if (!config.monitoring.sentry.enabled) {
    return fn;
  }

  return ((...args: Parameters<T>) => {
    const transaction = startTransaction(transactionName, op);
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then((value) => {
            transaction.setStatus('ok');
            transaction.finish();
            return value;
          })
          .catch((error) => {
            transaction.setStatus('internal_error');
            captureException(error);
            transaction.finish();
            throw error;
          });
      }
      
      // Handle sync functions
      transaction.setStatus('ok');
      transaction.finish();
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      captureException(error as Error);
      transaction.finish();
      throw error;
    }
  }) as T;
}

/**
 * Error boundary for Svelte components
 */
export function createErrorBoundary() {
  return {
    onError: (error: Error, errorInfo: any) => {
      captureException(error, {
        extra: errorInfo,
        tags: {
          errorBoundary: 'svelte'
        }
      });
    }
  };
}

/**
 * Configure Sentry for specific environments
 */
export function configureSentryForEnvironment(): void {
  if (config.app.environment === 'production') {
    // Production-specific configuration
    setTag('deployment', 'production');
    setExtra('buildTime', new Date().toISOString());
  } else if (config.app.environment === 'staging') {
    // Staging-specific configuration
    setTag('deployment', 'staging');
  }

  // Set global tags
  setTag('version', config.app.version);
  setTag('environment', config.app.environment);
}

// Initialize Sentry if enabled
if (config.monitoring.sentry.enabled) {
  initializeSentry();
  configureSentryForEnvironment();
}

export default Sentry;

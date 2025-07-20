// Structured Logging System
// Cloud Logging compatible structured logging with proper formatting

import { config } from '$lib/config/production';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Log level priorities for filtering
const LOG_LEVEL_PRIORITY = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4
};

// Current log level priority
const currentLogLevelPriority = LOG_LEVEL_PRIORITY[config.logging.level as LogLevel] || 1;

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  version: string;
  environment: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  component?: string;
  operation?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
  labels?: Record<string, string>;
}

// Request context for correlation
interface RequestContext {
  requestId: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
}

// Global request context storage
const requestContexts = new Map<string, RequestContext>();

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Set request context for correlation
 */
export function setRequestContext(context: Partial<RequestContext>): string {
  const requestId = context.requestId || generateRequestId();
  requestContexts.set(requestId, {
    requestId,
    ...context
  });
  return requestId;
}

/**
 * Get current request context
 */
export function getRequestContext(requestId?: string): RequestContext | undefined {
  if (requestId) {
    return requestContexts.get(requestId);
  }
  
  // Try to get from async context (if available)
  // This would require AsyncLocalStorage in a real implementation
  return undefined;
}

/**
 * Clear request context
 */
export function clearRequestContext(requestId: string): void {
  requestContexts.delete(requestId);
}

/**
 * Format log entry for Cloud Logging
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  metadata?: Record<string, any>,
  error?: Error,
  context?: RequestContext
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: config.app.name.toLowerCase(),
    version: config.app.version,
    environment: config.app.environment
  };

  // Add request context if available
  if (context) {
    entry.requestId = context.requestId;
    entry.traceId = context.traceId;
    entry.spanId = context.spanId;
    entry.userId = context.userId;
  }

  // Add error information
  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    };
  }

  // Add metadata
  if (metadata) {
    entry.metadata = metadata;
  }

  return entry;
}

/**
 * Output log entry
 */
function outputLog(entry: LogEntry): void {
  if (config.logging.structured) {
    // Structured JSON output for Cloud Logging
    console.log(JSON.stringify(entry));
  } else {
    // Human-readable format for development
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.requestId ? `[${entry.requestId}] ` : '';
    const component = entry.component ? `${entry.component}: ` : '';
    
    let output = `${timestamp} ${level} ${context}${component}${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += ` ${JSON.stringify(entry.metadata)}`;
    }
    
    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n${entry.error.stack}`;
      }
    }
    
    console.log(output);
  }
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= currentLogLevelPriority;
}

/**
 * Logger class
 */
class Logger {
  private component?: string;
  private defaultMetadata: Record<string, any> = {};

  constructor(component?: string, defaultMetadata?: Record<string, any>) {
    this.component = component;
    this.defaultMetadata = defaultMetadata || {};
  }

  /**
   * Create child logger with component context
   */
  child(component: string, metadata?: Record<string, any>): Logger {
    const childComponent = this.component ? `${this.component}.${component}` : component;
    const childMetadata = { ...this.defaultMetadata, ...metadata };
    return new Logger(childComponent, childMetadata);
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!shouldLog(LogLevel.DEBUG)) return;

    const context = getRequestContext(requestId);
    const entry = formatLogEntry(
      LogLevel.DEBUG,
      message,
      { ...this.defaultMetadata, ...metadata },
      undefined,
      context
    );
    
    if (this.component) {
      entry.component = this.component;
    }

    outputLog(entry);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!shouldLog(LogLevel.INFO)) return;

    const context = getRequestContext(requestId);
    const entry = formatLogEntry(
      LogLevel.INFO,
      message,
      { ...this.defaultMetadata, ...metadata },
      undefined,
      context
    );
    
    if (this.component) {
      entry.component = this.component;
    }

    outputLog(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!shouldLog(LogLevel.WARN)) return;

    const context = getRequestContext(requestId);
    const entry = formatLogEntry(
      LogLevel.WARN,
      message,
      { ...this.defaultMetadata, ...metadata },
      undefined,
      context
    );
    
    if (this.component) {
      entry.component = this.component;
    }

    outputLog(entry);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, any>, error?: Error, requestId?: string): void {
    if (!shouldLog(LogLevel.ERROR)) return;

    const context = getRequestContext(requestId);
    const entry = formatLogEntry(
      LogLevel.ERROR,
      message,
      { ...this.defaultMetadata, ...metadata },
      error,
      context
    );
    
    if (this.component) {
      entry.component = this.component;
    }

    outputLog(entry);
  }

  /**
   * Log fatal message
   */
  fatal(message: string, metadata?: Record<string, any>, error?: Error, requestId?: string): void {
    const context = getRequestContext(requestId);
    const entry = formatLogEntry(
      LogLevel.FATAL,
      message,
      { ...this.defaultMetadata, ...metadata },
      error,
      context
    );
    
    if (this.component) {
      entry.component = this.component;
    }

    outputLog(entry);
  }

  /**
   * Log HTTP request
   */
  httpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, any>,
    requestId?: string
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                 statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    if (!shouldLog(level)) return;

    const context = getRequestContext(requestId);
    const entry = formatLogEntry(
      level,
      `${method} ${url} ${statusCode}`,
      {
        ...this.defaultMetadata,
        ...metadata,
        httpRequest: {
          method,
          url,
          statusCode,
          duration
        }
      },
      undefined,
      context
    );

    entry.operation = 'http.request';
    entry.duration = duration;
    
    if (this.component) {
      entry.component = this.component;
    }

    outputLog(entry);
  }

  /**
   * Log database operation
   */
  dbOperation(
    operation: string,
    collection: string,
    duration: number,
    metadata?: Record<string, any>,
    error?: Error,
    requestId?: string
  ): void {
    const level = error ? LogLevel.ERROR : LogLevel.DEBUG;

    if (!shouldLog(level)) return;

    const context = getRequestContext(requestId);
    const entry = formatLogEntry(
      level,
      `DB ${operation} on ${collection}`,
      {
        ...this.defaultMetadata,
        ...metadata,
        database: {
          operation,
          collection,
          duration
        }
      },
      error,
      context
    );

    entry.operation = 'db.operation';
    entry.duration = duration;
    
    if (this.component) {
      entry.component = this.component;
    }

    outputLog(entry);
  }

  /**
   * Log performance metric
   */
  performance(
    metric: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, any>,
    requestId?: string
  ): void {
    if (!shouldLog(LogLevel.INFO)) return;

    const context = getRequestContext(requestId);
    const entry = formatLogEntry(
      LogLevel.INFO,
      `Performance: ${metric} = ${value}${unit}`,
      {
        ...this.defaultMetadata,
        ...metadata,
        performance: {
          metric,
          value,
          unit
        }
      },
      undefined,
      context
    );

    entry.operation = 'performance.metric';
    
    if (this.component) {
      entry.component = this.component;
    }

    outputLog(entry);
  }
}

// Default logger instance
export const logger = new Logger();

// Create component-specific loggers
export const createLogger = (component: string, metadata?: Record<string, any>): Logger => {
  return new Logger(component, metadata);
};

// Convenience functions
export const log = {
  debug: (message: string, metadata?: Record<string, any>, requestId?: string) => 
    logger.debug(message, metadata, requestId),
  
  info: (message: string, metadata?: Record<string, any>, requestId?: string) => 
    logger.info(message, metadata, requestId),
  
  warn: (message: string, metadata?: Record<string, any>, requestId?: string) => 
    logger.warn(message, metadata, requestId),
  
  error: (message: string, metadata?: Record<string, any>, error?: Error, requestId?: string) => 
    logger.error(message, metadata, error, requestId),
  
  fatal: (message: string, metadata?: Record<string, any>, error?: Error, requestId?: string) => 
    logger.fatal(message, metadata, error, requestId)
};

export default logger;

import { ERROR_MESSAGES } from '$lib/constants';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

// Custom error class for application errors
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly userMessage: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string,
    statusCode?: number,
    userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage || this.getUserFriendlyMessage(type, code);
  }

  private getUserFriendlyMessage(type: ErrorType, code?: string): string {
    // Firebase Auth error codes
    if (code) {
      switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Invalid email or password.';
        case 'auth/email-already-in-use':
          return 'An account with this email already exists.';
        case 'auth/weak-password':
          return ERROR_MESSAGES.PASSWORD_WEAK;
        case 'auth/invalid-email':
          return ERROR_MESSAGES.EMAIL_INVALID;
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
          return ERROR_MESSAGES.NETWORK;
        case 'permission-denied':
          return ERROR_MESSAGES.PERMISSION_DENIED;
        case 'not-found':
          return ERROR_MESSAGES.NOT_FOUND;
        case 'unavailable':
          return 'Service temporarily unavailable. Please try again.';
        default:
          break;
      }
    }

    // Generic error messages by type
    switch (type) {
      case ErrorType.VALIDATION:
        return ERROR_MESSAGES.VALIDATION_FAILED;
      case ErrorType.AUTHENTICATION:
        return ERROR_MESSAGES.AUTH_REQUIRED;
      case ErrorType.AUTHORIZATION:
        return ERROR_MESSAGES.PERMISSION_DENIED;
      case ErrorType.NETWORK:
        return ERROR_MESSAGES.NETWORK;
      case ErrorType.NOT_FOUND:
        return ERROR_MESSAGES.NOT_FOUND;
      default:
        return ERROR_MESSAGES.GENERIC;
    }
  }
}

// Error handler function for consistent error processing
export function handleError(error: unknown): AppError {
  console.error('Error occurred:', error);

  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Handle Firebase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message: string };
    
    if (firebaseError.code.startsWith('auth/')) {
      return new AppError(
        firebaseError.message,
        ErrorType.AUTHENTICATION,
        firebaseError.code
      );
    }
    
    if (firebaseError.code === 'permission-denied') {
      return new AppError(
        firebaseError.message,
        ErrorType.AUTHORIZATION,
        firebaseError.code
      );
    }
    
    if (firebaseError.code === 'not-found') {
      return new AppError(
        firebaseError.message,
        ErrorType.NOT_FOUND,
        firebaseError.code
      );
    }
    
    if (firebaseError.code === 'unavailable') {
      return new AppError(
        firebaseError.message,
        ErrorType.NETWORK,
        firebaseError.code
      );
    }
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      'Network request failed',
      ErrorType.NETWORK,
      'network-error'
    );
  }

  // Handle validation errors
  if (error instanceof Error && error.message.includes('validation')) {
    return new AppError(
      error.message,
      ErrorType.VALIDATION,
      'validation-error'
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorType.UNKNOWN,
      'unknown-error'
    );
  }

  // Fallback for unknown error types
  return new AppError(
    'An unknown error occurred',
    ErrorType.UNKNOWN,
    'unknown-error'
  );
}

// Async error wrapper for better error handling in async functions
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = handleError(error);
    
    if (context) {
      console.error(`Error in ${context}:`, appError);
    }
    
    throw appError;
  }
}

// Error logging utility
export function logError(error: AppError | Error, context?: string): void {
  const errorInfo = {
    message: error.message,
    type: error instanceof AppError ? error.type : 'unknown',
    code: error instanceof AppError ? error.code : undefined,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  };

  console.error('Application Error:', errorInfo);

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or similar
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
}

// Validation error helpers
export function createValidationError(field: string, message: string): AppError {
  return new AppError(
    `Validation failed for ${field}: ${message}`,
    ErrorType.VALIDATION,
    'validation-error',
    400,
    message
  );
}

// Network error helpers
export function createNetworkError(message?: string): AppError {
  return new AppError(
    message || 'Network request failed',
    ErrorType.NETWORK,
    'network-error',
    0,
    ERROR_MESSAGES.NETWORK
  );
}

// Authentication error helpers
export function createAuthError(message?: string): AppError {
  return new AppError(
    message || 'Authentication required',
    ErrorType.AUTHENTICATION,
    'auth-required',
    401,
    ERROR_MESSAGES.AUTH_REQUIRED
  );
}

// Authorization error helpers
export function createAuthorizationError(message?: string): AppError {
  return new AppError(
    message || 'Permission denied',
    ErrorType.AUTHORIZATION,
    'permission-denied',
    403,
    ERROR_MESSAGES.PERMISSION_DENIED
  );
}

// Not found error helpers
export function createNotFoundError(resource?: string): AppError {
  const message = resource ? `${resource} not found` : 'Resource not found';
  return new AppError(
    message,
    ErrorType.NOT_FOUND,
    'not-found',
    404,
    ERROR_MESSAGES.NOT_FOUND
  );
}

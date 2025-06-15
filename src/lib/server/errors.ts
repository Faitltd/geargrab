import { json, type RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

/**
 * Handle API errors and return appropriate responses
 */
export function handleApiError(error: unknown, event?: RequestEvent) {
  if (error instanceof AppError) {
    return json(
      {
        error: error.message,
        code: error.code,
        ...(dev && error.details ? { details: error.details } : {})
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return json(
      {
        error: dev ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }

  return json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler(
  handler: (event: RequestEvent) => Promise<Response>
) {
  return async (event: RequestEvent): Promise<Response> => {
    try {
      return await handler(event);
    } catch (error) {
      return handleApiError(error, event);
    }
  };
}

/**
 * Firebase error mapper
 */
export function mapFirebaseError(error: any): AppError {
  const code = error.code || error.errorInfo?.code;
  
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new AuthenticationError('Invalid credentials');
    
    case 'auth/too-many-requests':
      return new AppError('Too many failed attempts. Please try again later.', 429, 'RATE_LIMIT_ERROR');
    
    case 'permission-denied':
      return new AuthorizationError('Permission denied');
    
    case 'not-found':
      return new NotFoundError('Document not found');
    
    default:
      return new AppError(
        dev ? error.message : 'An error occurred',
        500,
        'FIREBASE_ERROR'
      );
  }
}

/**
 * Stripe error mapper
 */
export function mapStripeError(error: any): AppError {
  switch (error.type) {
    case 'StripeCardError':
      return new ValidationError(error.message);
    
    case 'StripeRateLimitError':
      return new AppError('Too many requests to payment processor', 429, 'RATE_LIMIT_ERROR');
    
    case 'StripeInvalidRequestError':
      return new ValidationError('Invalid payment request');
    
    default:
      return new AppError(
        'Payment processing failed',
        500,
        'PAYMENT_ERROR'
      );
  }
}

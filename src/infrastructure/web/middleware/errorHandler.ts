/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationException } from './validation';

// Custom error types
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Main error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id,
  });

  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  let details: any;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    details = error.details;
  } else if (error instanceof ValidationException) {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
    details = error.errors;
  } else if (error.name === 'ValidationError') {
    // Joi validation error
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = error.message;
  } else if (error.name === 'CastError') {
    // Database cast error (e.g., invalid ObjectId)
    statusCode = 400;
    message = 'Invalid data format';
    code = 'CAST_ERROR';
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    // MongoDB errors
    if ((error as any).code === 11000) {
      // Duplicate key error
      statusCode = 409;
      message = 'Duplicate entry';
      code = 'DUPLICATE_ERROR';
      details = extractDuplicateField(error.message);
    } else {
      statusCode = 500;
      message = 'Database error';
      code = 'DATABASE_ERROR';
    }
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'MulterError') {
    // File upload errors
    statusCode = 400;
    message = 'File upload error';
    code = 'UPLOAD_ERROR';
    details = error.message;
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Utility functions
 */

// Extract duplicate field from MongoDB error message
function extractDuplicateField(message: string): string | undefined {
  const match = message.match(/index: (.+?)_/);
  return match ? match[1] : undefined;
}

// Create standardized error responses
export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ErrorResponse => {
  return {
    success: false,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path: '',
    method: '',
  };
};

// Validation error helper
export const createValidationError = (field: string, message: string, value?: any): ValidationException => {
  return new ValidationException([{ field, message, value }]);
};

/**
 * Error logging utility
 */
export const logError = (error: Error, context?: any): void => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    context,
  };

  // In production, you might want to send this to a logging service
  console.error('Application Error:', JSON.stringify(errorLog, null, 2));
};

/**
 * Health check error
 */
export class HealthCheckError extends AppError {
  constructor(service: string, details?: any) {
    super(`Health check failed for ${service}`, 503, 'HEALTH_CHECK_FAILED', details);
  }
}

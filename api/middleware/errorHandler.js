/**
 * Error Handling Middleware
 * Centralized error handling for the API
 */

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
class ValidationError extends APIError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Not found error class
 */
class NotFoundError extends APIError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Unauthorized error class
 */
class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden error class
 */
class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Conflict error class
 */
class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Database error handler
 */
function handleDatabaseError(error) {
  console.error('Database error:', error);
  
  // PostgreSQL specific error codes
  switch (error.code) {
    case '23505': // unique_violation
      return new ConflictError('Resource already exists');
    case '23503': // foreign_key_violation
      return new ValidationError('Referenced resource does not exist');
    case '23502': // not_null_violation
      return new ValidationError('Required field is missing');
    case '23514': // check_violation
      return new ValidationError('Data validation failed');
    case '42P01': // undefined_table
      return new APIError('Database configuration error', 500, 'DB_CONFIG_ERROR');
    default:
      return new APIError('Database operation failed', 500, 'DB_ERROR');
  }
}

/**
 * Main error handling middleware
 */
function errorHandler(error, req, res, next) {
  let err = error;
  
  // Handle different types of errors
  if (error.name === 'ValidationError') {
    err = new ValidationError(error.message, error.errors);
  } else if (error.code && error.code.startsWith('23')) {
    // PostgreSQL constraint violations
    err = handleDatabaseError(error);
  } else if (error.name === 'JsonWebTokenError') {
    err = new UnauthorizedError('Invalid authentication token');
  } else if (error.name === 'TokenExpiredError') {
    err = new UnauthorizedError('Authentication token expired');
  } else if (error.name === 'CastError') {
    err = new ValidationError('Invalid ID format');
  } else if (!error.isOperational) {
    // Unexpected errors
    console.error('Unexpected error:', error);
    err = new APIError('Internal server error', 500, 'INTERNAL_ERROR');
  }
  
  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }
  
  // Prepare error response
  const errorResponse = {
    error: err.message,
    code: err.code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };
  
  // Add validation errors if present
  if (err.errors && err.errors.length > 0) {
    errorResponse.validation_errors = err.errors;
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  // Send error response
  res.status(err.statusCode || 500).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

module.exports = {
  APIError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  handleDatabaseError
};

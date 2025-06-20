// Base error class for product-related errors
export abstract class ProductError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string, public readonly details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

// Product not found error
export class ProductNotFoundError extends ProductError {
  readonly code = 'PRODUCT_NOT_FOUND';
  readonly statusCode = 404;

  constructor(productId: string) {
    super(`Product with ID '${productId}' not found`);
    this.details = { productId };
  }
}

// Product validation error
export class ProductValidationError extends ProductError {
  readonly code = 'PRODUCT_VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string, validationErrors: Record<string, string[]>) {
    super(message);
    this.details = { validationErrors };
  }
}

// Product already exists error
export class ProductAlreadyExistsError extends ProductError {
  readonly code = 'PRODUCT_ALREADY_EXISTS';
  readonly statusCode = 409;

  constructor(field: string, value: string) {
    super(`Product with ${field} '${value}' already exists`);
    this.details = { field, value };
  }
}

// Product unauthorized error
export class ProductUnauthorizedError extends ProductError {
  readonly code = 'PRODUCT_UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(action: string) {
    super(`Unauthorized to ${action} product`);
    this.details = { action };
  }
}

// Product forbidden error
export class ProductForbiddenError extends ProductError {
  readonly code = 'PRODUCT_FORBIDDEN';
  readonly statusCode = 403;

  constructor(action: string, reason?: string) {
    super(`Forbidden to ${action} product${reason ? `: ${reason}` : ''}`);
    this.details = { action, reason };
  }
}

// Product inventory error
export class ProductInventoryError extends ProductError {
  readonly code = 'PRODUCT_INVENTORY_ERROR';
  readonly statusCode = 400;

  constructor(message: string, availableQuantity: number, requestedQuantity: number) {
    super(message);
    this.details = { availableQuantity, requestedQuantity };
  }
}

// Product database error
export class ProductDatabaseError extends ProductError {
  readonly code = 'PRODUCT_DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(operation: string, originalError?: Error) {
    super(`Database error during ${operation}`);
    this.details = { 
      operation, 
      originalError: originalError?.message,
      stack: originalError?.stack 
    };
  }
}

// Product service unavailable error
export class ProductServiceUnavailableError extends ProductError {
  readonly code = 'PRODUCT_SERVICE_UNAVAILABLE';
  readonly statusCode = 503;

  constructor(service: string) {
    super(`Product service '${service}' is currently unavailable`);
    this.details = { service };
  }
}

// Product rate limit error
export class ProductRateLimitError extends ProductError {
  readonly code = 'PRODUCT_RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(limit: number, windowMs: number) {
    super(`Rate limit exceeded: ${limit} requests per ${windowMs}ms`);
    this.details = { limit, windowMs };
  }
}

// Product business rule violation error
export class ProductBusinessRuleError extends ProductError {
  readonly code = 'PRODUCT_BUSINESS_RULE_VIOLATION';
  readonly statusCode = 422;

  constructor(rule: string, details?: Record<string, any>) {
    super(`Business rule violation: ${rule}`);
    this.details = { rule, ...details };
  }
}

// Utility function to check if error is a ProductError
export function isProductError(error: unknown): error is ProductError {
  return error instanceof ProductError;
}

// Utility function to handle and format errors
export function handleProductError(error: unknown): ProductError {
  if (isProductError(error)) {
    return error;
  }

  // Convert generic errors to ProductError
  if (error instanceof Error) {
    return new ProductDatabaseError('unknown operation', error);
  }

  // Handle unknown error types
  return new ProductDatabaseError('unknown operation', new Error(String(error)));
}

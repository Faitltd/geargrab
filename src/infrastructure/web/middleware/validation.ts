/**
 * Validation Middleware
 * Request validation for product endpoints
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation schemas
const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().min(1).max(2000).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().min(1).max(100).required(),
  sku: Joi.string().min(1).max(50).required(),
  stock: Joi.number().integer().min(0).required(),
  isActive: Joi.boolean().optional().default(true),
  tags: Joi.array().items(Joi.string().max(50)).optional().default([]),
  images: Joi.array().items(Joi.string().uri()).optional().default([]),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().min(1).max(2000).optional(),
  price: Joi.number().min(0).optional(),
  category: Joi.string().min(1).max(100).optional(),
  stock: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
}).min(1); // At least one field must be provided

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sortBy: Joi.string().valid('name', 'price', 'stock', 'createdAt', 'updatedAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('asc'),
  category: Joi.string().max(100).optional(),
  isActive: Joi.boolean().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.boolean().optional(),
  tags: Joi.string().optional(), // Comma-separated string
  search: Joi.string().max(255).optional(),
});

// Validation middleware functions
export const validateCreateProduct = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = createProductSchema.validate(req.body);
  
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    });
    return;
  }
  
  req.body = value;
  next();
};

export const validateUpdateProduct = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = updateProductSchema.validate(req.body);
  
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    });
    return;
  }
  
  req.body = value;
  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = paginationSchema.validate(req.query);
  
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    });
    return;
  }
  
  // Update query parameters with validated values
  Object.assign(req.query, value);
  next();
};

// Custom validation helpers
export const validateId = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;
  
  if (!id || id.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Valid product ID is required'
    });
    return;
  }
  
  next();
};

export const validateSku = (req: Request, res: Response, next: NextFunction): void => {
  const { sku } = req.params;
  
  if (!sku || sku.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Valid product SKU is required'
    });
    return;
  }
  
  next();
};

export const validateStockUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    quantity: Joi.number().integer().min(1).required(),
    operation: Joi.string().valid('increase', 'decrease').required(),
  });
  
  const { error, value } = schema.validate(req.body);
  
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    });
    return;
  }
  
  req.body = value;
  next();
};

export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    isActive: Joi.boolean().required(),
  });
  
  const { error, value } = schema.validate(req.body);
  
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    });
    return;
  }
  
  req.body = value;
  next();
};

// Error handling for validation
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ValidationException extends Error {
  constructor(
    public errors: ValidationError[],
    message: string = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationException';
  }
}

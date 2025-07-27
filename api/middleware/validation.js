/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

/**
 * Common validation schemas
 */
const schemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),
  
  // Email validation
  email: Joi.string().email().required(),
  
  // Password validation
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  
  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0)
  },
  
  // Date range
  dateRange: {
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).required()
  }
};

/**
 * User validation schemas
 */
const userSchemas = {
  register: Joi.object({
    email: schemas.email,
    password: schemas.password,
    display_name: Joi.string().min(2).max(100).required(),
    first_name: Joi.string().min(1).max(50).required(),
    last_name: Joi.string().min(1).max(50).required(),
    phone_number: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    date_of_birth: Joi.date().max('now').optional()
  }),
  
  login: Joi.object({
    email: schemas.email,
    password: Joi.string().required()
  }),
  
  update: Joi.object({
    display_name: Joi.string().min(2).max(100).optional(),
    first_name: Joi.string().min(1).max(50).optional(),
    last_name: Joi.string().min(1).max(50).optional(),
    phone_number: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    street_address: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(50).optional(),
    zip_code: Joi.string().max(20).optional(),
    country: Joi.string().max(50).optional()
  })
};

/**
 * Gear item validation schemas
 */
const gearItemSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(20).max(2000).required(),
    category: Joi.string().valid('camping', 'hiking', 'skiing', 'water-sports', 'climbing', 'biking').required(),
    subcategory: Joi.string().max(100).optional(),
    brand: Joi.string().max(100).optional(),
    model: Joi.string().max(100).optional(),
    condition: Joi.string().valid('Like New', 'Good', 'Fair', 'Poor').required(),
    age_in_years: Joi.number().integer().min(0).max(50).default(0),
    features: Joi.array().items(Joi.string().max(100)).max(10).default([]),
    specifications: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
    images: Joi.array().items(Joi.string().uri()).max(10).default([]),
    daily_price: Joi.number().positive().precision(2).required(),
    weekly_price: Joi.number().positive().precision(2).optional(),
    monthly_price: Joi.number().positive().precision(2).optional(),
    security_deposit: Joi.number().min(0).precision(2).default(0),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(50).required(),
    zip_code: Joi.string().max(20).required(),
    pickup_available: Joi.boolean().default(true),
    dropoff_available: Joi.boolean().default(false),
    shipping_available: Joi.boolean().default(false),
    pickup_location: Joi.string().max(255).optional(),
    dropoff_distance_miles: Joi.number().integer().min(0).max(100).default(0),
    shipping_fee: Joi.number().min(0).precision(2).default(0),
    unavailable_dates: Joi.array().items(Joi.date().iso()).default([]),
    includes_insurance: Joi.boolean().default(false),
    insurance_details: Joi.string().max(500).optional()
  }),
  
  update: Joi.object({
    title: Joi.string().min(5).max(255).optional(),
    description: Joi.string().min(20).max(2000).optional(),
    condition: Joi.string().valid('Like New', 'Good', 'Fair', 'Poor').optional(),
    daily_price: Joi.number().positive().precision(2).optional(),
    weekly_price: Joi.number().positive().precision(2).optional(),
    monthly_price: Joi.number().positive().precision(2).optional(),
    security_deposit: Joi.number().min(0).precision(2).optional(),
    pickup_available: Joi.boolean().optional(),
    dropoff_available: Joi.boolean().optional(),
    shipping_available: Joi.boolean().optional(),
    pickup_location: Joi.string().max(255).optional(),
    dropoff_distance_miles: Joi.number().integer().min(0).max(100).optional(),
    shipping_fee: Joi.number().min(0).precision(2).optional(),
    unavailable_dates: Joi.array().items(Joi.date().iso()).optional(),
    includes_insurance: Joi.boolean().optional(),
    insurance_details: Joi.string().max(500).optional(),
    status: Joi.string().valid('active', 'inactive', 'maintenance').optional()
  }),
  
  search: Joi.object({
    query: Joi.string().max(100).optional(),
    category: Joi.string().valid('camping', 'hiking', 'skiing', 'water-sports', 'climbing', 'biking').optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(50).optional(),
    min_price: Joi.number().min(0).optional(),
    max_price: Joi.number().min(0).optional(),
    available_from: Joi.date().iso().optional(),
    available_to: Joi.date().iso().min(Joi.ref('available_from')).optional(),
    ...schemas.pagination
  })
};

/**
 * Rental validation schemas
 */
const rentalSchemas = {
  create: Joi.object({
    gear_item_id: schemas.uuid,
    start_date: Joi.date().iso().min('now').required(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
    delivery_method: Joi.string().valid('pickup', 'dropoff', 'shipping').default('pickup'),
    delivery_address: Joi.string().max(500).optional()
  }),
  
  update: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed').optional(),
    checkout_photos: Joi.array().items(Joi.string().uri()).max(10).optional(),
    checkout_notes: Joi.string().max(1000).optional(),
    return_photos: Joi.array().items(Joi.string().uri()).max(10).optional(),
    return_notes: Joi.string().max(1000).optional(),
    damage_photos: Joi.array().items(Joi.string().uri()).max(10).optional(),
    damage_notes: Joi.string().max(1000).optional(),
    cancellation_reason: Joi.string().max(500).optional()
  })
};

/**
 * Message validation schemas
 */
const messageSchemas = {
  create: Joi.object({
    rental_id: schemas.uuid.optional(),
    receiver_id: schemas.uuid.required(),
    content: Joi.string().min(1).max(2000).required(),
    message_type: Joi.string().valid('text', 'image', 'system').default('text')
  })
};

/**
 * Review validation schemas
 */
const reviewSchemas = {
  create: Joi.object({
    rental_id: schemas.uuid,
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(255).optional(),
    comment: Joi.string().max(1000).optional(),
    review_type: Joi.string().valid('renter_to_owner', 'owner_to_renter', 'gear_review').required()
  })
};

/**
 * Validation middleware factory
 */
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      throw new ValidationError('Validation failed', errors);
    }
    
    // Replace the original data with validated/sanitized data
    req[source] = value;
    next();
  };
}

/**
 * Validate UUID parameter
 */
function validateUUID(paramName = 'id') {
  return validateRequest(
    Joi.object({ [paramName]: schemas.uuid }),
    'params'
  );
}

module.exports = {
  schemas,
  userSchemas,
  gearItemSchemas,
  rentalSchemas,
  messageSchemas,
  reviewSchemas,
  validateRequest,
  validateUUID
};

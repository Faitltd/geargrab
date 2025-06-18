import { z } from 'zod';

/**
 * Common Validation Schemas and Utilities
 * 
 * Reusable validation schemas for common form fields
 * and utility functions for validation handling.
 */

// Common regex patterns
export const PATTERNS = {
  // Email patterns
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone patterns (US format)
  phoneUS: /^(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/,
  phoneInternational: /^\+?[1-9]\d{1,14}$/,
  
  // Username patterns
  username: /^[a-zA-Z0-9_-]{3,30}$/,
  usernameStrict: /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/,
  
  // Password patterns
  passwordStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
  
  // Name patterns
  name: /^[a-zA-Z\s'-]{1,50}$/,
  nameStrict: /^[a-zA-Z][a-zA-Z\s'-]{0,49}$/,
  
  // URL patterns
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // ZIP code patterns
  zipUS: /^\d{5}(-\d{4})?$/,
  postalCode: /^[A-Za-z0-9\s-]{3,10}$/,
  
  // Credit card patterns
  creditCard: /^\d{13,19}$/,
  
  // Social security number (US)
  ssn: /^\d{3}-?\d{2}-?\d{4}$/
};

// Common validation schemas
export const commonSchemas = {
  // Email validation
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .toLowerCase(),

  // Strong email validation
  emailStrict: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .toLowerCase()
    .refine(
      (email) => !email.includes('+'),
      'Email addresses with + symbols are not allowed'
    )
    .refine(
      (email) => !email.includes('..'),
      'Email cannot contain consecutive dots'
    ),

  // Password validation
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),

  // Strong password validation
  passwordStrong: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /(?=.*[a-z])/,
      'Password must contain at least one lowercase letter'
    )
    .regex(
      /(?=.*[A-Z])/,
      'Password must contain at least one uppercase letter'
    )
    .regex(
      /(?=.*\d)/,
      'Password must contain at least one number'
    )
    .regex(
      /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      'Password must contain at least one special character'
    ),

  // Name validation
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(PATTERNS.name, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(PATTERNS.name, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Username validation
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(PATTERNS.username, 'Username can only contain letters, numbers, underscores, and hyphens'),

  // Phone number validation
  phoneNumber: z
    .string()
    .regex(PATTERNS.phoneUS, 'Please enter a valid phone number'),

  // Age validation
  age: z
    .number()
    .int('Age must be a whole number')
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Please enter a valid age'),

  // URL validation
  url: z
    .string()
    .url('Please enter a valid URL')
    .max(2048, 'URL is too long'),

  // Optional URL validation
  urlOptional: z
    .string()
    .url('Please enter a valid URL')
    .max(2048, 'URL is too long')
    .optional()
    .or(z.literal('')),

  // ZIP code validation
  zipCode: z
    .string()
    .regex(PATTERNS.zipUS, 'Please enter a valid ZIP code (12345 or 12345-6789)'),

  // Credit card validation
  creditCard: z
    .string()
    .regex(PATTERNS.creditCard, 'Please enter a valid credit card number')
    .refine(luhnCheck, 'Invalid credit card number'),

  // Date validation
  dateString: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date'),

  // Future date validation
  futureDateString: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return date > new Date();
    }, 'Date must be in the future'),

  // Past date validation
  pastDateString: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return date <= new Date();
    }, 'Date cannot be in the future')
};

// Utility functions
export const validationUtils = {
  /**
   * Luhn algorithm for credit card validation
   */
  luhnCheck: (cardNumber: string): boolean => {
    return luhnCheck(cardNumber);
  },

  /**
   * Format validation errors for display
   */
  formatErrors: (error: z.ZodError): Record<string, string[]> => {
    const fieldErrors: Record<string, string[]> = {};
    
    error.issues.forEach(issue => {
      const fieldPath = issue.path.join('.');
      const fieldName = fieldPath || 'general';
      
      if (!fieldErrors[fieldName]) {
        fieldErrors[fieldName] = [];
      }
      
      fieldErrors[fieldName].push(issue.message);
    });
    
    return fieldErrors;
  },

  /**
   * Get first error message for a field
   */
  getFirstError: (error: z.ZodError, fieldName: string): string | null => {
    const issue = error.issues.find(issue => 
      issue.path.join('.') === fieldName
    );
    return issue?.message || null;
  },

  /**
   * Check if field has errors
   */
  hasFieldError: (error: z.ZodError, fieldName: string): boolean => {
    return error.issues.some(issue => 
      issue.path.join('.') === fieldName
    );
  },

  /**
   * Validate single field
   */
  validateField: <T>(schema: z.ZodSchema<T>, value: unknown): {
    success: boolean;
    data?: T;
    error?: string;
  } => {
    const result = schema.safeParse(value);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { 
        success: false, 
        error: result.error.issues[0]?.message || 'Validation failed'
      };
    }
  },

  /**
   * Create conditional schema based on condition
   */
  conditional: <T>(
    condition: boolean,
    trueSchema: z.ZodSchema<T>,
    falseSchema: z.ZodSchema<T>
  ): z.ZodSchema<T> => {
    return condition ? trueSchema : falseSchema;
  },

  /**
   * Create optional schema that allows empty strings
   */
  optionalString: (schema: z.ZodString) => {
    return schema.optional().or(z.literal(''));
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (str: string): string => {
    return str.trim().replace(/\s+/g, ' ');
  },

  /**
   * Normalize phone number
   */
  normalizePhone: (phone: string): string => {
    return phone.replace(/\D/g, '');
  },

  /**
   * Format phone number for display
   */
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }
};

// Luhn algorithm implementation
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Export types
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type FieldErrors = Record<string, string[]>;

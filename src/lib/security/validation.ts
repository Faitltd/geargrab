// import DOMPurify from 'isomorphic-dompurify'; // Temporarily disabled for deployment

// Enhanced validation with security focus
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'date' | 'phone' | 'ssn';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
  allowedValues?: any[];
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: Record<string, any>;
}

// Security-focused validation patterns
const SECURITY_PATTERNS = {
  // SQL injection detection
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|('|('')|;|--|\/\*|\*\/)/i,
  
  // XSS detection
  xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  
  // Path traversal detection
  pathTraversal: /\.\.[\/\\]/,
  
  // Command injection detection
  commandInjection: /[;&|`$(){}[\]]/,
  
  // Email validation (RFC 5322 compliant) - kept for contact forms and other uses
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Phone number (US format)
  phone: /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  
  // SSN format
  ssn: /^\d{3}-?\d{2}-?\d{4}$/,
  
  // URL validation
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Safe filename (no path traversal or special chars)
  safeFilename: /^[a-zA-Z0-9._-]+$/,
  
  // MongoDB ObjectId
  objectId: /^[0-9a-fA-F]{24}$/,
  
  // UUID
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Sanitization functions
const SANITIZERS = {
  // Remove HTML tags and encode special characters
  html: (value: string): string => {
    // return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }); // Temporarily disabled for deployment
    return value.replace(/<[^>]*>/g, ''); // Simple HTML tag removal
  },
  
  // Remove SQL injection patterns
  sql: (value: string): string => {
    return value.replace(SECURITY_PATTERNS.sqlInjection, '');
  },
  
  // Remove path traversal patterns
  path: (value: string): string => {
    return value.replace(SECURITY_PATTERNS.pathTraversal, '');
  },
  
  // Remove command injection patterns
  command: (value: string): string => {
    return value.replace(SECURITY_PATTERNS.commandInjection, '');
  },
  
  // Normalize whitespace
  whitespace: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },
  
  // Remove non-alphanumeric characters (except specified)
  alphanumeric: (value: string, allowed: string = ''): string => {
    const pattern = new RegExp(`[^a-zA-Z0-9${allowed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g');
    return value.replace(pattern, '');
  }
};

// Enhanced validation class
export class SecurityValidator {
  // Validate single value against rule
  static validateValue(value: any, rule: ValidationRule): { isValid: boolean; error?: string; sanitizedValue?: any } {
    let sanitizedValue = value;

    // Required check
    if (rule.required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: 'This field is required' };
    }

    // Skip further validation if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, sanitizedValue: value };
    }

    // Type validation and conversion
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, error: 'Must be a string' };
        }
        break;
        
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          return { isValid: false, error: 'Must be a valid number' };
        }
        sanitizedValue = num;
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: 'Must be a boolean' };
        }
        break;
        
      case 'email':
        if (typeof value !== 'string' || !SECURITY_PATTERNS.email.test(value)) {
          return { isValid: false, error: 'Must be a valid email address' };
        }
        break;
        
      case 'url':
        if (typeof value !== 'string' || !SECURITY_PATTERNS.url.test(value)) {
          return { isValid: false, error: 'Must be a valid URL' };
        }
        break;
        
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Must be a valid date' };
        }
        sanitizedValue = date;
        break;
        
      case 'phone':
        if (typeof value !== 'string' || !SECURITY_PATTERNS.phone.test(value)) {
          return { isValid: false, error: 'Must be a valid phone number' };
        }
        break;
        
      case 'ssn':
        if (typeof value !== 'string' || !SECURITY_PATTERNS.ssn.test(value)) {
          return { isValid: false, error: 'Must be a valid SSN' };
        }
        break;
    }

    // Security checks for strings
    if (typeof sanitizedValue === 'string') {
      // Check for malicious patterns
      if (SECURITY_PATTERNS.sqlInjection.test(sanitizedValue)) {
        return { isValid: false, error: 'Contains potentially malicious content' };
      }
      
      if (SECURITY_PATTERNS.xss.test(sanitizedValue)) {
        return { isValid: false, error: 'Contains potentially malicious content' };
      }
      
      if (SECURITY_PATTERNS.pathTraversal.test(sanitizedValue)) {
        return { isValid: false, error: 'Contains invalid path characters' };
      }

      // Sanitize if requested
      if (rule.sanitize) {
        sanitizedValue = SANITIZERS.html(sanitizedValue);
        sanitizedValue = SANITIZERS.whitespace(sanitizedValue);
      }
    }

    // Length validation
    if (rule.minLength !== undefined && sanitizedValue.length < rule.minLength) {
      return { isValid: false, error: `Must be at least ${rule.minLength} characters long` };
    }
    
    if (rule.maxLength !== undefined && sanitizedValue.length > rule.maxLength) {
      return { isValid: false, error: `Must be no more than ${rule.maxLength} characters long` };
    }

    // Numeric range validation
    if (rule.min !== undefined && sanitizedValue < rule.min) {
      return { isValid: false, error: `Must be at least ${rule.min}` };
    }
    
    if (rule.max !== undefined && sanitizedValue > rule.max) {
      return { isValid: false, error: `Must be no more than ${rule.max}` };
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
      return { isValid: false, error: 'Invalid format' };
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(sanitizedValue)) {
      return { isValid: false, error: 'Invalid value' };
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(sanitizedValue);
      if (customResult !== true) {
        return { 
          isValid: false, 
          error: typeof customResult === 'string' ? customResult : 'Custom validation failed' 
        };
      }
    }

    return { isValid: true, sanitizedValue };
  }

  // Validate object against schema
  static validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, any> = {};
    let isValid = true;

    // Validate each field in schema
    for (const [field, rule] of Object.entries(schema)) {
      const result = this.validateValue(data[field], rule);
      
      if (!result.isValid) {
        errors[field] = result.error!;
        isValid = false;
      } else {
        sanitizedData[field] = result.sanitizedValue;
      }
    }

    // Check for unexpected fields (potential attack)
    const allowedFields = Object.keys(schema);
    const providedFields = Object.keys(data);
    const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (unexpectedFields.length > 0) {
      errors._unexpected = `Unexpected fields: ${unexpectedFields.join(', ')}`;
      isValid = false;
    }

    return { isValid, errors, sanitizedData };
  }

  // Quick validation for common patterns
  static isValidEmail(email: string): boolean {
    return SECURITY_PATTERNS.email.test(email);
  }

  static isStrongPassword(password: string): boolean {
    return SECURITY_PATTERNS.strongPassword.test(password);
  }

  static isSafeFilename(filename: string): boolean {
    return SECURITY_PATTERNS.safeFilename.test(filename);
  }

  static isValidObjectId(id: string): boolean {
    return SECURITY_PATTERNS.objectId.test(id);
  }

  static isValidUUID(uuid: string): boolean {
    return SECURITY_PATTERNS.uuid.test(uuid);
  }

  // Sanitize user input
  static sanitize(value: string, type: 'html' | 'sql' | 'path' | 'command' | 'whitespace' | 'alphanumeric' = 'html'): string {
    return SANITIZERS[type](value);
  }

  // Deep sanitize object
  static sanitizeObject(obj: any, options: { sanitizeStrings?: boolean; removeNulls?: boolean } = {}): any {
    if (obj === null || obj === undefined) {
      return options.removeNulls ? undefined : obj;
    }

    if (typeof obj === 'string') {
      return options.sanitizeStrings ? SANITIZERS.html(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options)).filter(item => item !== undefined);
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedValue = this.sanitizeObject(value, options);
        if (sanitizedValue !== undefined) {
          sanitized[key] = sanitizedValue;
        }
      }
      return sanitized;
    }

    return obj;
  }
}

// Export convenience function
export function validateInput(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
  return SecurityValidator.validate(data, schema);
}

// Common validation schemas
export const CommonSchemas = {
  // Social-only authentication (no email/password validation needed)

  register: {
    email: { required: true, type: 'email' as const, sanitize: true },
    password: { required: true, type: 'string' as const, custom: (value: string) => SecurityValidator.isStrongPassword(value) || 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' },
    displayName: { required: true, type: 'string' as const, minLength: 2, maxLength: 50, sanitize: true },
    firstName: { required: true, type: 'string' as const, minLength: 1, maxLength: 30, sanitize: true },
    lastName: { required: true, type: 'string' as const, minLength: 1, maxLength: 30, sanitize: true }
  },

  // Booking creation
  booking: {
    listingId: { required: true, type: 'string' as const, custom: (value: string) => SecurityValidator.isValidObjectId(value) },
    startDate: { required: true, type: 'date' as const },
    endDate: { required: true, type: 'date' as const },
    totalPrice: { required: true, type: 'number' as const, min: 0.5 },
    deliveryMethod: { required: true, type: 'string' as const, allowedValues: ['pickup', 'delivery'] }
  },

  // Message sending
  message: {
    conversationId: { required: true, type: 'string' as const, custom: (value: string) => SecurityValidator.isValidObjectId(value) },
    content: { required: true, type: 'string' as const, minLength: 1, maxLength: 1000, sanitize: true },
    type: { required: true, type: 'string' as const, allowedValues: ['text', 'image', 'file'] }
  },

  // Payment processing
  payment: {
    amount: { required: true, type: 'number' as const, min: 0.5 },
    currency: { required: true, type: 'string' as const, allowedValues: ['usd'] },
    bookingId: { required: true, type: 'string' as const, custom: (value: string) => SecurityValidator.isValidObjectId(value) }
  }
};

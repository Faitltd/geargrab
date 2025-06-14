/**
 * Runtime prop validation utilities for Svelte components
 * Provides type checking and validation for component props
 */

export interface PropValidator<T = any> {
  /** Validation function */
  validate: (value: T) => boolean;
  /** Error message when validation fails */
  message: string;
  /** Whether the prop is required */
  required?: boolean;
  /** Default value if not provided */
  defaultValue?: T;
}

export interface PropValidationSchema {
  [propName: string]: PropValidator;
}

export interface ValidationResult {
  /** Whether all props are valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: string[];
  /** Validated and sanitized props */
  validatedProps: Record<string, any>;
}

/**
 * Common prop validators
 */
export const validators = {
  /** Validates that value is a non-empty string */
  requiredString: (message = 'This field is required'): PropValidator<string> => ({
    validate: (value: string) => typeof value === 'string' && value.trim().length > 0,
    message,
    required: true
  }),

  /** Validates that value is a string */
  string: (message = 'Must be a string'): PropValidator<string> => ({
    validate: (value: string) => typeof value === 'string',
    message
  }),

  /** Validates that value is a number */
  number: (message = 'Must be a number'): PropValidator<number> => ({
    validate: (value: number) => typeof value === 'number' && !isNaN(value),
    message
  }),

  /** Validates that value is a positive number */
  positiveNumber: (message = 'Must be a positive number'): PropValidator<number> => ({
    validate: (value: number) => typeof value === 'number' && !isNaN(value) && value > 0,
    message
  }),

  /** Validates that value is a boolean */
  boolean: (message = 'Must be a boolean'): PropValidator<boolean> => ({
    validate: (value: boolean) => typeof value === 'boolean',
    message
  }),

  /** Validates that value is an array */
  array: (message = 'Must be an array'): PropValidator<any[]> => ({
    validate: (value: any[]) => Array.isArray(value),
    message
  }),

  /** Validates that value is a non-empty array */
  nonEmptyArray: (message = 'Must be a non-empty array'): PropValidator<any[]> => ({
    validate: (value: any[]) => Array.isArray(value) && value.length > 0,
    message
  }),

  /** Validates that value is one of the allowed values */
  oneOf: <T>(allowedValues: T[], message?: string): PropValidator<T> => ({
    validate: (value: T) => allowedValues.includes(value),
    message: message || `Must be one of: ${allowedValues.join(', ')}`
  }),

  /** Validates that value matches a regex pattern */
  pattern: (regex: RegExp, message = 'Invalid format'): PropValidator<string> => ({
    validate: (value: string) => typeof value === 'string' && regex.test(value),
    message
  }),

  /** Validates that value is a valid email */
  email: (message = 'Must be a valid email address'): PropValidator<string> => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value);
    },
    message
  }),

  /** Validates that value is a valid URL */
  url: (message = 'Must be a valid URL'): PropValidator<string> => ({
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  /** Validates string length */
  stringLength: (min: number, max: number, message?: string): PropValidator<string> => ({
    validate: (value: string) => {
      if (typeof value !== 'string') return false;
      return value.length >= min && value.length <= max;
    },
    message: message || `Must be between ${min} and ${max} characters`
  }),

  /** Validates number range */
  numberRange: (min: number, max: number, message?: string): PropValidator<number> => ({
    validate: (value: number) => {
      if (typeof value !== 'number' || isNaN(value)) return false;
      return value >= min && value <= max;
    },
    message: message || `Must be between ${min} and ${max}`
  }),

  /** Validates that value is a function */
  function: (message = 'Must be a function'): PropValidator<Function> => ({
    validate: (value: Function) => typeof value === 'function',
    message
  }),

  /** Validates that value is an object */
  object: (message = 'Must be an object'): PropValidator<object> => ({
    validate: (value: object) => typeof value === 'object' && value !== null && !Array.isArray(value),
    message
  })
};

/**
 * Validates component props against a schema
 */
export function validateProps(
  props: Record<string, any>,
  schema: PropValidationSchema
): ValidationResult {
  const errors: string[] = [];
  const validatedProps: Record<string, any> = { ...props };

  for (const [propName, validator] of Object.entries(schema)) {
    const value = props[propName];
    const hasValue = value !== undefined && value !== null;

    // Check if required prop is missing
    if (validator.required && !hasValue) {
      errors.push(`${propName}: ${validator.message}`);
      continue;
    }

    // Skip validation if prop is not provided and not required
    if (!hasValue && !validator.required) {
      // Use default value if provided
      if (validator.defaultValue !== undefined) {
        validatedProps[propName] = validator.defaultValue;
      }
      continue;
    }

    // Validate the prop value
    if (hasValue && !validator.validate(value)) {
      errors.push(`${propName}: ${validator.message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedProps
  };
}

/**
 * Creates a prop validation function for a component
 */
export function createPropValidator(schema: PropValidationSchema) {
  return (props: Record<string, any>) => validateProps(props, schema);
}

/**
 * Development-only prop validation (removed in production)
 */
export function validatePropsInDev(
  props: Record<string, any>,
  schema: PropValidationSchema,
  componentName: string
): void {
  if (import.meta.env.DEV) {
    const result = validateProps(props, schema);
    
    if (!result.isValid) {
      console.group(`🚨 Prop validation failed for ${componentName}`);
      result.errors.forEach(error => console.error(`❌ ${error}`));
      console.groupEnd();
      
      // Optionally throw in development
      if (import.meta.env.VITE_STRICT_PROP_VALIDATION === 'true') {
        throw new Error(`Prop validation failed for ${componentName}: ${result.errors.join(', ')}`);
      }
    }
  }
}

/**
 * Common validation schemas for component types
 */
export const commonSchemas = {
  /** Schema for search input components */
  searchInput: {
    value: validators.string(),
    placeholder: validators.string(),
    disabled: validators.boolean(),
    className: validators.string()
  },

  /** Schema for button components */
  button: {
    type: validators.oneOf(['button', 'submit', 'reset']),
    variant: validators.oneOf(['primary', 'secondary', 'danger', 'ghost']),
    size: validators.oneOf(['sm', 'md', 'lg']),
    disabled: validators.boolean(),
    loading: validators.boolean(),
    fullWidth: validators.boolean(),
    className: validators.string()
  },

  /** Schema for modal components */
  modal: {
    show: validators.boolean('Show prop is required'),
    title: validators.string(),
    maxWidth: validators.string(),
    maxHeight: validators.string(),
    showCloseButton: validators.boolean(),
    closeOnBackdrop: validators.boolean(),
    closeOnEscape: validators.boolean()
  }
};

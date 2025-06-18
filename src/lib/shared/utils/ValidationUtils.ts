import type { 
  CreateProductInput, 
  UpdateProductInput, 
  ProductCategory, 
  ProductStatus,
  ProductPrice,
  ProductInventory 
} from '../types/Product';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// Validation rules
export class ValidationUtils {
  // Validate required string field
  static validateRequired(value: unknown, fieldName: string): string[] {
    const errors: string[] = [];
    
    if (value === undefined || value === null) {
      errors.push(`${fieldName} is required`);
    } else if (typeof value === 'string' && value.trim().length === 0) {
      errors.push(`${fieldName} cannot be empty`);
    }
    
    return errors;
  }

  // Validate string length
  static validateStringLength(
    value: string, 
    fieldName: string, 
    minLength?: number, 
    maxLength?: number
  ): string[] {
    const errors: string[] = [];
    
    if (minLength !== undefined && value.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      errors.push(`${fieldName} must be no more than ${maxLength} characters long`);
    }
    
    return errors;
  }

  // Validate email format
  static validateEmail(email: string): string[] {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
    
    return errors;
  }

  // Validate URL format
  static validateUrl(url: string, fieldName: string): string[] {
    const errors: string[] = [];
    
    try {
      new URL(url);
    } catch {
      errors.push(`${fieldName} must be a valid URL`);
    }
    
    return errors;
  }

  // Validate positive number
  static validatePositiveNumber(value: number, fieldName: string): string[] {
    const errors: string[] = [];
    
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`${fieldName} must be a valid number`);
    } else if (value <= 0) {
      errors.push(`${fieldName} must be greater than 0`);
    }
    
    return errors;
  }

  // Validate non-negative number
  static validateNonNegativeNumber(value: number, fieldName: string): string[] {
    const errors: string[] = [];
    
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`${fieldName} must be a valid number`);
    } else if (value < 0) {
      errors.push(`${fieldName} must be 0 or greater`);
    }
    
    return errors;
  }

  // Validate array
  static validateArray(
    value: unknown[], 
    fieldName: string, 
    minLength?: number, 
    maxLength?: number
  ): string[] {
    const errors: string[] = [];
    
    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be an array`);
      return errors;
    }
    
    if (minLength !== undefined && value.length < minLength) {
      errors.push(`${fieldName} must have at least ${minLength} items`);
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      errors.push(`${fieldName} must have no more than ${maxLength} items`);
    }
    
    return errors;
  }

  // Validate enum value
  static validateEnum<T>(
    value: unknown, 
    enumObject: Record<string, T>, 
    fieldName: string
  ): string[] {
    const errors: string[] = [];
    const validValues = Object.values(enumObject);
    
    if (!validValues.includes(value as T)) {
      errors.push(`${fieldName} must be one of: ${validValues.join(', ')}`);
    }
    
    return errors;
  }

  // Validate product price
  static validateProductPrice(price: ProductPrice): string[] {
    const errors: string[] = [];
    
    errors.push(...this.validatePositiveNumber(price.dailyRate, 'dailyRate'));
    errors.push(...this.validateNonNegativeNumber(price.securityDeposit, 'securityDeposit'));
    
    if (price.weeklyRate !== undefined) {
      errors.push(...this.validatePositiveNumber(price.weeklyRate, 'weeklyRate'));
    }
    
    if (price.monthlyRate !== undefined) {
      errors.push(...this.validatePositiveNumber(price.monthlyRate, 'monthlyRate'));
    }
    
    errors.push(...this.validateRequired(price.currency, 'currency'));
    
    if (price.currency && price.currency.length !== 3) {
      errors.push('currency must be a 3-letter ISO code (e.g., USD, EUR)');
    }
    
    return errors;
  }

  // Validate product inventory
  static validateProductInventory(inventory: ProductInventory): string[] {
    const errors: string[] = [];
    
    errors.push(...this.validateNonNegativeNumber(inventory.quantity, 'quantity'));
    errors.push(...this.validateNonNegativeNumber(inventory.reserved, 'reserved'));
    errors.push(...this.validateNonNegativeNumber(inventory.available, 'available'));
    
    if (inventory.reserved > inventory.quantity) {
      errors.push('reserved quantity cannot exceed total quantity');
    }
    
    if (inventory.available > inventory.quantity) {
      errors.push('available quantity cannot exceed total quantity');
    }
    
    if (inventory.lowStockThreshold !== undefined) {
      errors.push(...this.validateNonNegativeNumber(inventory.lowStockThreshold, 'lowStockThreshold'));
    }
    
    return errors;
  }

  // Validate slug format
  static validateSlug(slug: string): string[] {
    const errors: string[] = [];
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    
    if (!slugRegex.test(slug)) {
      errors.push('slug must contain only lowercase letters, numbers, and hyphens');
    }
    
    return errors;
  }

  // Validate create product input
  static validateCreateProductInput(input: CreateProductInput): ValidationResult {
    const errors: Record<string, string[]> = {};
    
    // Validate required fields
    errors.name = this.validateRequired(input.name, 'name');
    if (input.name) {
      errors.name.push(...this.validateStringLength(input.name, 'name', 1, 200));
    }
    
    errors.description = this.validateRequired(input.description, 'description');
    if (input.description) {
      errors.description.push(...this.validateStringLength(input.description, 'description', 10, 2000));
    }
    
    errors.category = this.validateRequired(input.category, 'category');
    
    // Validate price
    if (input.price) {
      errors.price = this.validateProductPrice(input.price);
    } else {
      errors.price = ['price is required'];
    }
    
    // Validate inventory
    if (input.inventory) {
      errors.inventory = this.validateProductInventory(input.inventory);
    } else {
      errors.inventory = ['inventory is required'];
    }
    
    // Validate images array
    errors.images = this.validateArray(input.images, 'images', 1, 10);
    if (input.images && Array.isArray(input.images)) {
      input.images.forEach((image, index) => {
        if (typeof image === 'string') {
          errors.images.push(...this.validateUrl(image, `images[${index}]`));
        }
      });
    }
    
    // Validate tags array
    errors.tags = this.validateArray(input.tags, 'tags', 0, 20);
    
    // Remove empty error arrays
    Object.keys(errors).forEach(key => {
      if (errors[key].length === 0) {
        delete errors[key];
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Validate update product input
  static validateUpdateProductInput(input: UpdateProductInput): ValidationResult {
    const errors: Record<string, string[]> = {};
    
    // Only validate provided fields
    if (input.name !== undefined) {
      errors.name = this.validateRequired(input.name, 'name');
      if (input.name) {
        errors.name.push(...this.validateStringLength(input.name, 'name', 1, 200));
      }
    }
    
    if (input.description !== undefined) {
      errors.description = this.validateRequired(input.description, 'description');
      if (input.description) {
        errors.description.push(...this.validateStringLength(input.description, 'description', 10, 2000));
      }
    }
    
    if (input.price !== undefined) {
      // For partial price updates, we need to validate what's provided
      const priceErrors: string[] = [];
      if (input.price.dailyRate !== undefined) {
        priceErrors.push(...this.validatePositiveNumber(input.price.dailyRate, 'dailyRate'));
      }
      if (input.price.securityDeposit !== undefined) {
        priceErrors.push(...this.validateNonNegativeNumber(input.price.securityDeposit, 'securityDeposit'));
      }
      errors.price = priceErrors;
    }
    
    if (input.images !== undefined) {
      errors.images = this.validateArray(input.images, 'images', 1, 10);
      if (input.images && Array.isArray(input.images)) {
        input.images.forEach((image, index) => {
          if (typeof image === 'string') {
            errors.images.push(...this.validateUrl(image, `images[${index}]`));
          }
        });
      }
    }
    
    if (input.tags !== undefined) {
      errors.tags = this.validateArray(input.tags, 'tags', 0, 20);
    }
    
    // Remove empty error arrays
    Object.keys(errors).forEach(key => {
      if (errors[key].length === 0) {
        delete errors[key];
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

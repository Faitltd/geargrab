import type { ProductService } from '../../domain/services/ProductService';
import type { CreateProductInput, Product } from '../../shared/types/Product';
import { 
  ProductValidationError, 
  ProductUnauthorizedError,
  handleProductError 
} from '../../shared/errors/ProductErrors';

/**
 * Create Product Use Case
 * Handles the business logic for creating a new product
 */
export class CreateProductUseCase {
  constructor(private readonly productService: ProductService) {}

  /**
   * Execute the create product use case
   * @param input - Product creation data
   * @param userId - ID of the user creating the product
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving to the created product
   */
  async execute(
    input: CreateProductInput,
    userId: string,
    userRole?: string
  ): Promise<Product> {
    try {
      // Authorization check
      if (!userId) {
        throw new ProductUnauthorizedError('create');
      }

      // Additional role-based authorization if needed
      if (userRole && !this.canCreateProduct(userRole)) {
        throw new ProductUnauthorizedError('create');
      }

      // Validate input data
      this.validateInput(input);

      // Create the product using the domain service
      const product = await this.productService.createProduct(input, userId);

      return product;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Validate the input data
   */
  private validateInput(input: CreateProductInput): void {
    const errors: Record<string, string[]> = {};

    // Basic validation (additional to domain validation)
    if (!input.name || input.name.trim().length === 0) {
      errors.name = ['Product name is required'];
    }

    if (!input.description || input.description.trim().length < 10) {
      errors.description = ['Product description must be at least 10 characters'];
    }

    if (!input.category) {
      errors.category = ['Product category is required'];
    }

    if (!input.price) {
      errors.price = ['Product price is required'];
    } else {
      if (input.price.dailyRate <= 0) {
        errors.price = errors.price || [];
        errors.price.push('Daily rate must be greater than 0');
      }

      if (input.price.securityDeposit < 0) {
        errors.price = errors.price || [];
        errors.price.push('Security deposit cannot be negative');
      }

      if (!input.price.currency || input.price.currency.length !== 3) {
        errors.price = errors.price || [];
        errors.price.push('Currency must be a 3-letter ISO code');
      }
    }

    if (!input.inventory) {
      errors.inventory = ['Product inventory is required'];
    } else {
      if (input.inventory.quantity < 0) {
        errors.inventory = errors.inventory || [];
        errors.inventory.push('Quantity cannot be negative');
      }

      if (input.inventory.reserved < 0) {
        errors.inventory = errors.inventory || [];
        errors.inventory.push('Reserved quantity cannot be negative');
      }

      if (input.inventory.reserved > input.inventory.quantity) {
        errors.inventory = errors.inventory || [];
        errors.inventory.push('Reserved quantity cannot exceed total quantity');
      }
    }

    if (!input.images || input.images.length === 0) {
      errors.images = ['At least one product image is required'];
    } else {
      // Validate image URLs
      input.images.forEach((image, index) => {
        try {
          new URL(image);
        } catch {
          errors.images = errors.images || [];
          errors.images.push(`Image ${index + 1} is not a valid URL`);
        }
      });

      if (input.images.length > 10) {
        errors.images = errors.images || [];
        errors.images.push('Maximum 10 images allowed');
      }
    }

    if (!input.tags || input.tags.length === 0) {
      errors.tags = ['At least one tag is required'];
    } else if (input.tags.length > 20) {
      errors.tags = ['Maximum 20 tags allowed'];
    }

    // Validate SEO data
    if (input.seo) {
      if (input.seo.metaTitle && input.seo.metaTitle.length > 60) {
        errors.seo = errors.seo || [];
        errors.seo.push('Meta title should be 60 characters or less');
      }

      if (input.seo.metaDescription && input.seo.metaDescription.length > 160) {
        errors.seo = errors.seo || [];
        errors.seo.push('Meta description should be 160 characters or less');
      }

      if (input.seo.keywords && input.seo.keywords.length > 10) {
        errors.seo = errors.seo || [];
        errors.seo.push('Maximum 10 SEO keywords allowed');
      }
    }

    // Validate specifications
    if (input.specifications) {
      const specCount = Object.keys(input.specifications).length;
      if (specCount > 50) {
        errors.specifications = ['Maximum 50 specifications allowed'];
      }

      // Validate specification values
      Object.entries(input.specifications).forEach(([key, value]) => {
        if (!key.trim() || !value.trim()) {
          errors.specifications = errors.specifications || [];
          errors.specifications.push('Specification keys and values cannot be empty');
        }

        if (key.length > 100 || value.length > 500) {
          errors.specifications = errors.specifications || [];
          errors.specifications.push('Specification keys max 100 chars, values max 500 chars');
        }
      });
    }

    // Validate price discounts if provided
    if (input.price?.discounts && input.price.discounts.length > 0) {
      input.price.discounts.forEach((discount, index) => {
        if (discount.type === 'percentage' && (discount.value <= 0 || discount.value > 100)) {
          errors.price = errors.price || [];
          errors.price.push(`Discount ${index + 1}: Percentage must be between 1-100`);
        }

        if (discount.type === 'fixed' && discount.value <= 0) {
          errors.price = errors.price || [];
          errors.price.push(`Discount ${index + 1}: Fixed amount must be greater than 0`);
        }

        if (discount.minDays && discount.maxDays && discount.minDays > discount.maxDays) {
          errors.price = errors.price || [];
          errors.price.push(`Discount ${index + 1}: Min days cannot exceed max days`);
        }

        if (!discount.description || discount.description.trim().length === 0) {
          errors.price = errors.price || [];
          errors.price.push(`Discount ${index + 1}: Description is required`);
        }
      });
    }

    // If there are validation errors, throw them
    if (Object.keys(errors).length > 0) {
      throw new ProductValidationError('Invalid product data', errors);
    }
  }

  /**
   * Check if user role can create products
   */
  private canCreateProduct(userRole: string): boolean {
    // Define roles that can create products
    const allowedRoles = ['admin', 'owner', 'seller', 'user'];
    return allowedRoles.includes(userRole.toLowerCase());
  }

  /**
   * Validate business rules specific to product creation
   */
  private validateBusinessRules(input: CreateProductInput): void {
    // Business rule: Weekly rate should not exceed 7x daily rate
    if (input.price.weeklyRate && input.price.weeklyRate > input.price.dailyRate * 7) {
      throw new ProductValidationError(
        'Business rule violation',
        { price: ['Weekly rate should not exceed 7 times the daily rate'] }
      );
    }

    // Business rule: Monthly rate should not exceed 30x daily rate
    if (input.price.monthlyRate && input.price.monthlyRate > input.price.dailyRate * 30) {
      throw new ProductValidationError(
        'Business rule violation',
        { price: ['Monthly rate should not exceed 30 times the daily rate'] }
      );
    }

    // Business rule: Security deposit should be reasonable (not more than 10x daily rate)
    if (input.price.securityDeposit > input.price.dailyRate * 10) {
      throw new ProductValidationError(
        'Business rule violation',
        { price: ['Security deposit seems too high (max 10x daily rate recommended)'] }
      );
    }

    // Business rule: If backorder is allowed, inventory tracking should be enabled
    if (input.inventory.allowBackorder && !input.inventory.trackInventory) {
      throw new ProductValidationError(
        'Business rule violation',
        { inventory: ['Inventory tracking must be enabled to allow backorders'] }
      );
    }

    // Business rule: Low stock threshold should be reasonable
    if (input.inventory.lowStockThreshold && 
        input.inventory.lowStockThreshold >= input.inventory.quantity) {
      throw new ProductValidationError(
        'Business rule violation',
        { inventory: ['Low stock threshold should be less than total quantity'] }
      );
    }
  }
}

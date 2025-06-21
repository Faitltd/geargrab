import type { ProductService } from '../../domain/services/ProductService';
import type { UpdateProductInput, Product } from '../../shared/types/Product';
import { 
  ProductValidationError, 
  ProductUnauthorizedError,
  ProductNotFoundError,
  handleProductError 
} from '../../shared/errors/ProductErrors';

/**
 * Update Product Use Case
 * Handles the business logic for updating an existing product
 */
export class UpdateProductUseCase {
  constructor(private readonly productService: ProductService) {}

  /**
   * Execute the update product use case
   * @param id - Product ID to update
   * @param input - Product update data
   * @param userId - ID of the user updating the product
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving to the updated product
   */
  async execute(
    id: string,
    input: UpdateProductInput,
    userId: string,
    userRole?: string
  ): Promise<Product> {
    try {
      // Authorization check
      if (!userId) {
        throw new ProductUnauthorizedError('update');
      }

      // Validate input data
      this.validateInput(input);

      // Validate business rules
      this.validateBusinessRules(input);

      // Check if product exists and user has permission
      const isAdmin = userRole === 'admin';

      // Update the product using the domain service
      const product = await this.productService.updateProduct(id, input, userId, isAdmin);

      return product;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Execute partial update (for specific fields only)
   * @param id - Product ID to update
   * @param field - Specific field to update
   * @param value - New value for the field
   * @param userId - ID of the user updating the product
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving to the updated product
   */
  async executePartialUpdate(
    id: string,
    field: keyof UpdateProductInput,
    value: any,
    userId: string,
    userRole?: string
  ): Promise<Product> {
    try {
      // Create partial update input
      const input: UpdateProductInput = {
        [field]: value
      };

      return await this.execute(id, input, userId, userRole);
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Update product status
   * @param id - Product ID to update
   * @param status - New status
   * @param userId - ID of the user updating the product
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving to the updated product
   */
  async executeStatusUpdate(
    id: string,
    status: 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'discontinued',
    userId: string,
    userRole?: string
  ): Promise<Product> {
    try {
      // Validate status transition
      await this.validateStatusTransition(id, status, userId, userRole);

      const input: UpdateProductInput = { status };
      return await this.execute(id, input, userId, userRole);
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Update product inventory
   * @param id - Product ID to update
   * @param inventoryUpdate - Inventory update data
   * @param userId - ID of the user updating the product
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving to the updated product
   */
  async executeInventoryUpdate(
    id: string,
    inventoryUpdate: {
      quantity?: number;
      reserved?: number;
      trackInventory?: boolean;
      allowBackorder?: boolean;
      lowStockThreshold?: number;
    },
    userId: string,
    userRole?: string
  ): Promise<Product> {
    try {
      // Validate inventory update
      this.validateInventoryUpdate(inventoryUpdate);

      const input: UpdateProductInput = {
        inventory: inventoryUpdate
      };

      return await this.execute(id, input, userId, userRole);
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Update product pricing
   * @param id - Product ID to update
   * @param priceUpdate - Price update data
   * @param userId - ID of the user updating the product
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving to the updated product
   */
  async executePriceUpdate(
    id: string,
    priceUpdate: {
      dailyRate?: number;
      weeklyRate?: number;
      monthlyRate?: number;
      securityDeposit?: number;
      currency?: string;
      discounts?: any[];
    },
    userId: string,
    userRole?: string
  ): Promise<Product> {
    try {
      // Validate price update
      this.validatePriceUpdate(priceUpdate);

      const input: UpdateProductInput = {
        price: priceUpdate
      };

      return await this.execute(id, input, userId, userRole);
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Validate the input data
   */
  private validateInput(input: UpdateProductInput): void {
    const errors: Record<string, string[]> = {};

    // Validate name if provided
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || input.name.trim().length === 0) {
        errors.name = ['Product name cannot be empty'];
      } else if (input.name.length > 200) {
        errors.name = ['Product name cannot exceed 200 characters'];
      }
    }

    // Validate description if provided
    if (input.description !== undefined) {
      if (typeof input.description !== 'string' || input.description.trim().length < 10) {
        errors.description = ['Product description must be at least 10 characters'];
      } else if (input.description.length > 2000) {
        errors.description = ['Product description cannot exceed 2000 characters'];
      }
    }

    // Validate price if provided
    if (input.price !== undefined) {
      if (input.price.dailyRate !== undefined) {
        if (typeof input.price.dailyRate !== 'number' || input.price.dailyRate <= 0) {
          errors.price = errors.price || [];
          errors.price.push('Daily rate must be greater than 0');
        }
      }

      if (input.price.securityDeposit !== undefined) {
        if (typeof input.price.securityDeposit !== 'number' || input.price.securityDeposit < 0) {
          errors.price = errors.price || [];
          errors.price.push('Security deposit cannot be negative');
        }
      }

      if (input.price.currency !== undefined) {
        if (typeof input.price.currency !== 'string' || input.price.currency.length !== 3) {
          errors.price = errors.price || [];
          errors.price.push('Currency must be a 3-letter ISO code');
        }
      }
    }

    // Validate inventory if provided
    if (input.inventory !== undefined) {
      if (input.inventory.quantity !== undefined) {
        if (typeof input.inventory.quantity !== 'number' || input.inventory.quantity < 0) {
          errors.inventory = errors.inventory || [];
          errors.inventory.push('Quantity cannot be negative');
        }
      }

      if (input.inventory.reserved !== undefined) {
        if (typeof input.inventory.reserved !== 'number' || input.inventory.reserved < 0) {
          errors.inventory = errors.inventory || [];
          errors.inventory.push('Reserved quantity cannot be negative');
        }
      }
    }

    // Validate images if provided
    if (input.images !== undefined) {
      if (!Array.isArray(input.images)) {
        errors.images = ['Images must be an array'];
      } else {
        if (input.images.length === 0) {
          errors.images = ['At least one product image is required'];
        } else if (input.images.length > 10) {
          errors.images = ['Maximum 10 images allowed'];
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
        }
      }
    }

    // Validate tags if provided
    if (input.tags !== undefined) {
      if (!Array.isArray(input.tags)) {
        errors.tags = ['Tags must be an array'];
      } else if (input.tags.length > 20) {
        errors.tags = ['Maximum 20 tags allowed'];
      }
    }

    // Validate status if provided
    if (input.status !== undefined) {
      const validStatuses = ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'];
      if (!validStatuses.includes(input.status)) {
        errors.status = [`Status must be one of: ${validStatuses.join(', ')}`];
      }
    }

    // If there are validation errors, throw them
    if (Object.keys(errors).length > 0) {
      throw new ProductValidationError('Invalid update data', errors);
    }
  }

  /**
   * Validate business rules for updates
   */
  private validateBusinessRules(input: UpdateProductInput): void {
    // Business rule: Weekly rate should not exceed 7x daily rate
    if (input.price?.weeklyRate && input.price?.dailyRate) {
      if (input.price.weeklyRate > input.price.dailyRate * 7) {
        throw new ProductValidationError(
          'Business rule violation',
          { price: ['Weekly rate should not exceed 7 times the daily rate'] }
        );
      }
    }

    // Business rule: Monthly rate should not exceed 30x daily rate
    if (input.price?.monthlyRate && input.price?.dailyRate) {
      if (input.price.monthlyRate > input.price.dailyRate * 30) {
        throw new ProductValidationError(
          'Business rule violation',
          { price: ['Monthly rate should not exceed 30 times the daily rate'] }
        );
      }
    }

    // Business rule: If backorder is allowed, inventory tracking should be enabled
    if (input.inventory?.allowBackorder && input.inventory?.trackInventory === false) {
      throw new ProductValidationError(
        'Business rule violation',
        { inventory: ['Inventory tracking must be enabled to allow backorders'] }
      );
    }
  }

  /**
   * Validate status transition
   */
  private async validateStatusTransition(
    id: string,
    newStatus: string,
    userId: string,
    userRole?: string
  ): Promise<void> {
    // Get current product to check current status
    const currentProduct = await this.productService.getProduct(id);
    
    if (!currentProduct) {
      throw new ProductNotFoundError(id);
    }

    const currentStatus = currentProduct.status;

    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      'draft': ['active', 'inactive'],
      'active': ['inactive', 'out_of_stock', 'discontinued'],
      'inactive': ['active', 'draft'],
      'out_of_stock': ['active', 'inactive', 'discontinued'],
      'discontinued': ['inactive'] // Only admin can reactivate discontinued products
    };

    // Check if transition is valid
    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new ProductValidationError(
        'Invalid status transition',
        { status: [`Cannot change status from '${currentStatus}' to '${newStatus}'`] }
      );
    }

    // Special rules for certain transitions
    if (newStatus === 'active') {
      // Ensure product has required fields for activation
      if (!currentProduct.images || currentProduct.images.length === 0) {
        throw new ProductValidationError(
          'Cannot activate product',
          { status: ['Product must have at least one image to be activated'] }
        );
      }

      if (currentProduct.price.dailyRate <= 0) {
        throw new ProductValidationError(
          'Cannot activate product',
          { status: ['Product must have a valid daily rate to be activated'] }
        );
      }
    }
  }

  /**
   * Validate inventory update
   */
  private validateInventoryUpdate(inventoryUpdate: any): void {
    const errors: string[] = [];

    if (inventoryUpdate.quantity !== undefined && inventoryUpdate.quantity < 0) {
      errors.push('Quantity cannot be negative');
    }

    if (inventoryUpdate.reserved !== undefined && inventoryUpdate.reserved < 0) {
      errors.push('Reserved quantity cannot be negative');
    }

    if (inventoryUpdate.lowStockThreshold !== undefined && inventoryUpdate.lowStockThreshold < 0) {
      errors.push('Low stock threshold cannot be negative');
    }

    if (errors.length > 0) {
      throw new ProductValidationError('Invalid inventory update', { inventory: errors });
    }
  }

  /**
   * Validate price update
   */
  private validatePriceUpdate(priceUpdate: any): void {
    const errors: string[] = [];

    if (priceUpdate.dailyRate !== undefined && priceUpdate.dailyRate <= 0) {
      errors.push('Daily rate must be greater than 0');
    }

    if (priceUpdate.weeklyRate !== undefined && priceUpdate.weeklyRate <= 0) {
      errors.push('Weekly rate must be greater than 0');
    }

    if (priceUpdate.monthlyRate !== undefined && priceUpdate.monthlyRate <= 0) {
      errors.push('Monthly rate must be greater than 0');
    }

    if (priceUpdate.securityDeposit !== undefined && priceUpdate.securityDeposit < 0) {
      errors.push('Security deposit cannot be negative');
    }

    if (priceUpdate.currency !== undefined && 
        (typeof priceUpdate.currency !== 'string' || priceUpdate.currency.length !== 3)) {
      errors.push('Currency must be a 3-letter ISO code');
    }

    if (errors.length > 0) {
      throw new ProductValidationError('Invalid price update', { price: errors });
    }
  }
}

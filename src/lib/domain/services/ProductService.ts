import type { ProductRepository } from '../repositories/ProductRepository';
import type { 
  Product, 
  CreateProductInput, 
  UpdateProductInput,
  ProductFilters,
  ProductSortOptions,
  ProductListResult,
  ProductAvailability
} from '../../shared/types/Product';
import { Product as ProductEntity } from '../entities/Product';
import { 
  ProductNotFoundError, 
  ProductAlreadyExistsError,
  ProductBusinessRuleError,
  ProductForbiddenError
} from '../../shared/errors/ProductErrors';

/**
 * Product Domain Service
 * Contains complex business logic that doesn't belong to a single entity
 * Orchestrates operations between multiple entities and repositories
 */
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  /**
   * Create a new product with business rule validation
   */
  async createProduct(input: CreateProductInput, userId: string): Promise<Product> {
    // Check if SKU already exists (if provided)
    if (input.sku) {
      const skuExists = await this.productRepository.skuExists(input.sku);
      if (skuExists) {
        throw new ProductAlreadyExistsError('sku', input.sku);
      }
    }

    // Create product using entity factory method
    const productData = ProductEntity.create(input, userId);
    
    // Check if generated slug already exists
    const slugExists = await this.productRepository.slugExists(productData.seo.slug);
    if (slugExists) {
      // Generate a unique slug by appending a number
      let counter = 1;
      let uniqueSlug = `${productData.seo.slug}-${counter}`;
      
      while (await this.productRepository.slugExists(uniqueSlug)) {
        counter++;
        uniqueSlug = `${productData.seo.slug}-${counter}`;
      }
      
      productData.seo.slug = uniqueSlug;
    }

    // Create the product
    return await this.productRepository.create(input, userId);
  }

  /**
   * Update an existing product with authorization and validation
   */
  async updateProduct(
    id: string, 
    input: UpdateProductInput, 
    userId: string,
    isAdmin: boolean = false
  ): Promise<Product> {
    // Get existing product
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new ProductNotFoundError(id);
    }

    // Check authorization (only owner or admin can update)
    if (!isAdmin && existingProduct.createdBy !== userId) {
      throw new ProductForbiddenError('update', 'not the owner');
    }

    // Check SKU uniqueness if being updated
    if (input.sku && input.sku !== existingProduct.sku) {
      const skuExists = await this.productRepository.skuExists(input.sku, id);
      if (skuExists) {
        throw new ProductAlreadyExistsError('sku', input.sku);
      }
    }

    // Validate business rules for inventory updates
    if (input.inventory) {
      await this.validateInventoryUpdate(existingProduct, input.inventory);
    }

    // Update the product
    return await this.productRepository.update(id, input, userId);
  }

  /**
   * Delete a product with authorization
   */
  async deleteProduct(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    // Get existing product
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new ProductNotFoundError(id);
    }

    // Check authorization
    if (!isAdmin && existingProduct.createdBy !== userId) {
      throw new ProductForbiddenError('delete', 'not the owner');
    }

    // Check if product has active bookings (business rule)
    const hasActiveBookings = await this.hasActiveBookings(id);
    if (hasActiveBookings) {
      throw new ProductBusinessRuleError(
        'Cannot delete product with active bookings',
        { productId: id }
      );
    }

    // Soft delete the product
    await this.productRepository.delete(id, userId);
  }

  /**
   * Get product with enhanced data
   */
  async getProduct(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  /**
   * Get product by slug for SEO-friendly URLs
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    return await this.productRepository.findBySlug(slug);
  }

  /**
   * Search products with advanced filtering
   */
  async searchProducts(
    query?: string,
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ProductListResult> {
    if (query && query.trim()) {
      return await this.productRepository.search(query.trim(), filters, page, pageSize);
    }
    
    return await this.productRepository.findMany(filters, sort, page, pageSize);
  }

  /**
   * Get products by category with recommendations
   */
  async getProductsByCategory(
    category: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ProductListResult> {
    return await this.productRepository.findByCategory(category, page, pageSize);
  }

  /**
   * Get user's products with statistics
   */
  async getUserProducts(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ products: ProductListResult; statistics: any }> {
    const [products, statistics] = await Promise.all([
      this.productRepository.findByOwner(userId, page, pageSize),
      this.productRepository.getStatistics(userId)
    ]);

    return { products, statistics };
  }

  /**
   * Check product availability for booking
   */
  async checkAvailability(
    productId: string,
    startDate: Date,
    endDate: Date,
    quantity: number = 1
  ): Promise<ProductAvailability> {
    // Validate dates
    if (startDate >= endDate) {
      throw new ProductBusinessRuleError('Start date must be before end date');
    }

    if (startDate < new Date()) {
      throw new ProductBusinessRuleError('Start date cannot be in the past');
    }

    return await this.productRepository.checkAvailability(productId, startDate, endDate, quantity);
  }

  /**
   * Reserve product inventory for booking
   */
  async reserveProduct(
    productId: string,
    quantity: number,
    reservationId: string,
    userId: string
  ): Promise<void> {
    // Get product to validate
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    // Create entity to validate business rules
    const productEntity = new ProductEntity(product);
    
    // Check availability
    if (!productEntity.isAvailable(quantity)) {
      throw new ProductBusinessRuleError(
        'Product not available in requested quantity',
        { productId, requested: quantity, available: product.inventory.available }
      );
    }

    // Reserve inventory
    await this.productRepository.reserveInventory(productId, quantity, reservationId);
  }

  /**
   * Release reserved product inventory
   */
  async releaseReservation(
    productId: string,
    quantity: number,
    reservationId: string
  ): Promise<void> {
    await this.productRepository.releaseInventory(productId, quantity, reservationId);
  }

  /**
   * Update product inventory levels
   */
  async updateInventory(
    productId: string,
    quantityChange: number,
    userId: string,
    isAdmin: boolean = false
  ): Promise<Product> {
    // Get existing product
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new ProductNotFoundError(productId);
    }

    // Check authorization
    if (!isAdmin && existingProduct.createdBy !== userId) {
      throw new ProductForbiddenError('update inventory', 'not the owner');
    }

    // Validate inventory change
    const newQuantity = existingProduct.inventory.quantity + quantityChange;
    if (newQuantity < 0) {
      throw new ProductBusinessRuleError(
        'Inventory cannot be negative',
        { currentQuantity: existingProduct.inventory.quantity, change: quantityChange }
      );
    }

    if (newQuantity < existingProduct.inventory.reserved) {
      throw new ProductBusinessRuleError(
        'Cannot reduce inventory below reserved quantity',
        { 
          newQuantity, 
          reserved: existingProduct.inventory.reserved,
          change: quantityChange 
        }
      );
    }

    return await this.productRepository.updateInventory(productId, quantityChange, userId);
  }

  /**
   * Get featured products for homepage
   */
  async getFeaturedProducts(limit: number = 12): Promise<Product[]> {
    return await this.productRepository.findFeatured(limit);
  }

  /**
   * Get recently added products
   */
  async getRecentProducts(limit: number = 12): Promise<Product[]> {
    return await this.productRepository.findRecent(limit);
  }

  /**
   * Get products with low stock for owner dashboard
   */
  async getLowStockProducts(userId?: string): Promise<Product[]> {
    return await this.productRepository.findLowStock(userId);
  }

  /**
   * Bulk update products (admin function)
   */
  async bulkUpdateProducts(
    updates: Array<{ id: string; data: UpdateProductInput }>,
    userId: string,
    isAdmin: boolean = false
  ): Promise<Product[]> {
    if (!isAdmin) {
      throw new ProductForbiddenError('bulk update', 'admin access required');
    }

    // Validate all products exist and user has permission
    for (const update of updates) {
      const product = await this.productRepository.findById(update.id);
      if (!product) {
        throw new ProductNotFoundError(update.id);
      }
    }

    return await this.productRepository.bulkUpdate(updates, userId);
  }

  /**
   * Private helper methods
   */

  private async validateInventoryUpdate(
    existingProduct: Product,
    inventoryUpdate: Partial<any>
  ): Promise<void> {
    // If reducing quantity, ensure it doesn't go below reserved
    if (inventoryUpdate.quantity !== undefined) {
      if (inventoryUpdate.quantity < existingProduct.inventory.reserved) {
        throw new ProductBusinessRuleError(
          'Cannot reduce quantity below reserved amount',
          { 
            newQuantity: inventoryUpdate.quantity,
            reserved: existingProduct.inventory.reserved 
          }
        );
      }
    }
  }

  private async hasActiveBookings(productId: string): Promise<boolean> {
    // This would typically check with a booking service or repository
    // For now, we'll assume no active bookings
    // In a real implementation, this would query the bookings collection
    return false;
  }
}

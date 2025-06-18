import type { 
  Product, 
  ProductFilters, 
  ProductSortOptions, 
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
  ProductAvailability
} from '../../shared/types/Product';

/**
 * Product Repository Interface
 * Defines the contract for product data access operations
 * This follows the Repository pattern from Domain-Driven Design
 */
export interface ProductRepository {
  /**
   * Find a product by its unique identifier
   * @param id - The product ID
   * @returns Promise resolving to the product or null if not found
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find a product by its SKU
   * @param sku - The product SKU
   * @returns Promise resolving to the product or null if not found
   */
  findBySku(sku: string): Promise<Product | null>;

  /**
   * Find a product by its SEO slug
   * @param slug - The product slug
   * @returns Promise resolving to the product or null if not found
   */
  findBySlug(slug: string): Promise<Product | null>;

  /**
   * Find multiple products with filtering, sorting, and pagination
   * @param filters - Filter criteria
   * @param sort - Sort options
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @returns Promise resolving to paginated product results
   */
  findMany(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page?: number,
    pageSize?: number
  ): Promise<ProductListResult>;

  /**
   * Search products by text query
   * @param query - Search query string
   * @param filters - Additional filter criteria
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @returns Promise resolving to paginated search results
   */
  search(
    query: string,
    filters?: ProductFilters,
    page?: number,
    pageSize?: number
  ): Promise<ProductListResult>;

  /**
   * Create a new product
   * @param productData - Product creation data
   * @param userId - ID of the user creating the product
   * @returns Promise resolving to the created product
   */
  create(productData: CreateProductInput, userId: string): Promise<Product>;

  /**
   * Update an existing product
   * @param id - Product ID to update
   * @param updateData - Partial product data to update
   * @param userId - ID of the user updating the product
   * @returns Promise resolving to the updated product
   */
  update(id: string, updateData: UpdateProductInput, userId: string): Promise<Product>;

  /**
   * Delete a product (soft delete by setting status to inactive)
   * @param id - Product ID to delete
   * @param userId - ID of the user deleting the product
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string, userId: string): Promise<void>;

  /**
   * Hard delete a product (permanently remove from database)
   * @param id - Product ID to permanently delete
   * @param userId - ID of the user performing the deletion
   * @returns Promise resolving when deletion is complete
   */
  hardDelete(id: string, userId: string): Promise<void>;

  /**
   * Check if a product exists
   * @param id - Product ID to check
   * @returns Promise resolving to true if product exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if a SKU is already in use
   * @param sku - SKU to check
   * @param excludeId - Product ID to exclude from check (for updates)
   * @returns Promise resolving to true if SKU exists
   */
  skuExists(sku: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if a slug is already in use
   * @param slug - Slug to check
   * @param excludeId - Product ID to exclude from check (for updates)
   * @returns Promise resolving to true if slug exists
   */
  slugExists(slug: string, excludeId?: string): Promise<boolean>;

  /**
   * Get products by category
   * @param category - Product category
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @returns Promise resolving to paginated category results
   */
  findByCategory(
    category: string,
    page?: number,
    pageSize?: number
  ): Promise<ProductListResult>;

  /**
   * Get products by owner/creator
   * @param userId - User ID of the product owner
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @returns Promise resolving to paginated user products
   */
  findByOwner(
    userId: string,
    page?: number,
    pageSize?: number
  ): Promise<ProductListResult>;

  /**
   * Get featured/promoted products
   * @param limit - Maximum number of products to return
   * @returns Promise resolving to featured products
   */
  findFeatured(limit?: number): Promise<Product[]>;

  /**
   * Get recently added products
   * @param limit - Maximum number of products to return
   * @returns Promise resolving to recent products
   */
  findRecent(limit?: number): Promise<Product[]>;

  /**
   * Get products with low stock
   * @param userId - Optional user ID to filter by owner
   * @returns Promise resolving to low stock products
   */
  findLowStock(userId?: string): Promise<Product[]>;

  /**
   * Check product availability for a date range
   * @param productId - Product ID to check
   * @param startDate - Start date of the booking
   * @param endDate - End date of the booking
   * @param quantity - Quantity needed (default: 1)
   * @returns Promise resolving to availability information
   */
  checkAvailability(
    productId: string,
    startDate: Date,
    endDate: Date,
    quantity?: number
  ): Promise<ProductAvailability>;

  /**
   * Reserve product inventory
   * @param productId - Product ID to reserve
   * @param quantity - Quantity to reserve
   * @param reservationId - Unique reservation identifier
   * @returns Promise resolving when reservation is complete
   */
  reserveInventory(
    productId: string,
    quantity: number,
    reservationId: string
  ): Promise<void>;

  /**
   * Release reserved inventory
   * @param productId - Product ID to release
   * @param quantity - Quantity to release
   * @param reservationId - Reservation identifier
   * @returns Promise resolving when release is complete
   */
  releaseInventory(
    productId: string,
    quantity: number,
    reservationId: string
  ): Promise<void>;

  /**
   * Update product inventory levels
   * @param productId - Product ID to update
   * @param quantityChange - Change in quantity (positive or negative)
   * @param userId - ID of the user making the change
   * @returns Promise resolving to updated product
   */
  updateInventory(
    productId: string,
    quantityChange: number,
    userId: string
  ): Promise<Product>;

  /**
   * Bulk update products
   * @param updates - Array of product updates with IDs
   * @param userId - ID of the user performing updates
   * @returns Promise resolving to updated products
   */
  bulkUpdate(
    updates: Array<{ id: string; data: UpdateProductInput }>,
    userId: string
  ): Promise<Product[]>;

  /**
   * Get product statistics
   * @param userId - Optional user ID to filter by owner
   * @returns Promise resolving to product statistics
   */
  getStatistics(userId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    draft: number;
    lowStock: number;
    outOfStock: number;
  }>;
}

import type { ProductService } from '../../domain/services/ProductService';
import type { 
  Product, 
  ProductFilters, 
  ProductSortOptions, 
  ProductListResult,
  ProductCategory 
} from '../../shared/types/Product';
import { handleProductError } from '../../shared/errors/ProductErrors';

/**
 * List Products Use Case
 * Handles the business logic for retrieving multiple products with filtering and pagination
 */
export class ListProductsUseCase {
  constructor(private readonly productService: ProductService) {}

  /**
   * Execute the list products use case
   * @param filters - Filter criteria
   * @param sort - Sort options
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @param userId - ID of the requesting user (optional)
   * @param userRole - Role of the requesting user (optional)
   * @returns Promise resolving to paginated product results
   */
  async execute(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page: number = 1,
    pageSize: number = 20,
    userId?: string,
    userRole?: string
  ): Promise<ProductListResult> {
    try {
      // Validate pagination parameters
      this.validatePagination(page, pageSize);

      // Apply default filters and security constraints
      const secureFilters = this.applySecurityFilters(filters, userId, userRole);

      // Validate and sanitize filters
      const validatedFilters = this.validateFilters(secureFilters);

      // Validate and apply default sorting
      const validatedSort = this.validateSort(sort);

      // Execute the search
      const result = await this.productService.searchProducts(
        undefined, // No text query for basic listing
        validatedFilters,
        validatedSort,
        page,
        pageSize
      );

      return result;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Execute search with text query
   * @param query - Search query string
   * @param filters - Additional filter criteria
   * @param sort - Sort options
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @param userId - ID of the requesting user (optional)
   * @param userRole - Role of the requesting user (optional)
   * @returns Promise resolving to paginated search results
   */
  async executeSearch(
    query: string,
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page: number = 1,
    pageSize: number = 20,
    userId?: string,
    userRole?: string
  ): Promise<ProductListResult> {
    try {
      // Validate search query
      this.validateSearchQuery(query);

      // Validate pagination parameters
      this.validatePagination(page, pageSize);

      // Apply security filters
      const secureFilters = this.applySecurityFilters(filters, userId, userRole);

      // Validate filters
      const validatedFilters = this.validateFilters(secureFilters);

      // Validate sort options
      const validatedSort = this.validateSort(sort);

      // Execute the search
      const result = await this.productService.searchProducts(
        query.trim(),
        validatedFilters,
        validatedSort,
        page,
        pageSize
      );

      return result;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Get products by category
   * @param category - Product category
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @param userId - ID of the requesting user (optional)
   * @param userRole - Role of the requesting user (optional)
   * @returns Promise resolving to paginated category results
   */
  async executeByCategory(
    category: ProductCategory,
    page: number = 1,
    pageSize: number = 20,
    userId?: string,
    userRole?: string
  ): Promise<ProductListResult> {
    try {
      // Validate pagination parameters
      this.validatePagination(page, pageSize);

      // Validate category
      this.validateCategory(category);

      // Get products by category
      const result = await this.productService.getProductsByCategory(
        category,
        page,
        pageSize
      );

      return result;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Get user's products
   * @param ownerId - ID of the product owner
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @param requestingUserId - ID of the requesting user
   * @param userRole - Role of the requesting user
   * @returns Promise resolving to user's products with statistics
   */
  async executeByOwner(
    ownerId: string,
    page: number = 1,
    pageSize: number = 20,
    requestingUserId?: string,
    userRole?: string
  ): Promise<{ products: ProductListResult; statistics: any }> {
    try {
      // Validate pagination parameters
      this.validatePagination(page, pageSize);

      // Check authorization for viewing user's products
      this.checkOwnerViewPermission(ownerId, requestingUserId, userRole);

      // Get user's products with statistics
      const result = await this.productService.getUserProducts(
        ownerId,
        page,
        pageSize
      );

      return result;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Get featured products
   * @param limit - Maximum number of products to return
   * @returns Promise resolving to featured products
   */
  async executeFeatured(limit: number = 12): Promise<Product[]> {
    try {
      // Validate limit
      if (limit < 1 || limit > 50) {
        throw new Error('Limit must be between 1 and 50');
      }

      const products = await this.productService.getFeaturedProducts(limit);
      return products;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Get recently added products
   * @param limit - Maximum number of products to return
   * @returns Promise resolving to recent products
   */
  async executeRecent(limit: number = 12): Promise<Product[]> {
    try {
      // Validate limit
      if (limit < 1 || limit > 50) {
        throw new Error('Limit must be between 1 and 50');
      }

      const products = await this.productService.getRecentProducts(limit);
      return products;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Get products with low stock
   * @param userId - ID of the requesting user
   * @param userRole - Role of the requesting user
   * @returns Promise resolving to low stock products
   */
  async executeLowStock(
    userId?: string,
    userRole?: string
  ): Promise<Product[]> {
    try {
      // Only authenticated users can view low stock products
      if (!userId) {
        throw new Error('Authentication required to view low stock products');
      }

      // Admin can see all low stock products, users can only see their own
      const filterUserId = userRole === 'admin' ? undefined : userId;

      const products = await this.productService.getLowStockProducts(filterUserId);
      return products;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Apply security filters based on user permissions
   */
  private applySecurityFilters(
    filters?: ProductFilters,
    userId?: string,
    userRole?: string
  ): ProductFilters {
    const secureFilters: ProductFilters = { ...filters };

    // Non-authenticated users can only see active products
    if (!userId) {
      secureFilters.status = 'active';
    } else {
      // Authenticated users can see active products by default
      // Admin can see all statuses if explicitly requested
      if (!secureFilters.status && userRole !== 'admin') {
        secureFilters.status = 'active';
      }
    }

    return secureFilters;
  }

  /**
   * Validate and sanitize filters
   */
  private validateFilters(filters?: ProductFilters): ProductFilters {
    if (!filters) {
      return {};
    }

    const validatedFilters: ProductFilters = {};

    // Validate category
    if (filters.category) {
      this.validateCategory(filters.category);
      validatedFilters.category = filters.category;
    }

    // Validate subcategory
    if (filters.subcategory) {
      if (typeof filters.subcategory !== 'string' || filters.subcategory.trim().length === 0) {
        throw new Error('Subcategory must be a non-empty string');
      }
      validatedFilters.subcategory = filters.subcategory.trim();
    }

    // Validate brand
    if (filters.brand) {
      if (typeof filters.brand !== 'string' || filters.brand.trim().length === 0) {
        throw new Error('Brand must be a non-empty string');
      }
      validatedFilters.brand = filters.brand.trim();
    }

    // Validate status
    if (filters.status) {
      const validStatuses = ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'];
      if (!validStatuses.includes(filters.status)) {
        throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      }
      validatedFilters.status = filters.status;
    }

    // Validate price range
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        if (typeof filters.priceRange.min !== 'number' || filters.priceRange.min < 0) {
          throw new Error('Minimum price must be a non-negative number');
        }
        validatedFilters.priceRange = validatedFilters.priceRange || {};
        validatedFilters.priceRange.min = filters.priceRange.min;
      }

      if (filters.priceRange.max !== undefined) {
        if (typeof filters.priceRange.max !== 'number' || filters.priceRange.max < 0) {
          throw new Error('Maximum price must be a non-negative number');
        }
        validatedFilters.priceRange = validatedFilters.priceRange || {};
        validatedFilters.priceRange.max = filters.priceRange.max;
      }

      // Validate price range logic
      if (validatedFilters.priceRange?.min !== undefined && 
          validatedFilters.priceRange?.max !== undefined &&
          validatedFilters.priceRange.min > validatedFilters.priceRange.max) {
        throw new Error('Minimum price cannot be greater than maximum price');
      }
    }

    // Validate tags
    if (filters.tags) {
      if (!Array.isArray(filters.tags)) {
        throw new Error('Tags must be an array');
      }

      if (filters.tags.length > 10) {
        throw new Error('Maximum 10 tags allowed in filter');
      }

      const validTags = filters.tags
        .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => tag.trim().toLowerCase());

      if (validTags.length > 0) {
        validatedFilters.tags = validTags;
      }
    }

    return validatedFilters;
  }

  /**
   * Validate and apply default sorting
   */
  private validateSort(sort?: ProductSortOptions): ProductSortOptions {
    if (!sort) {
      return { field: 'createdAt', direction: 'desc' };
    }

    const validFields = ['name', 'price', 'createdAt', 'updatedAt'];
    const validDirections = ['asc', 'desc'];

    if (!validFields.includes(sort.field)) {
      throw new Error(`Sort field must be one of: ${validFields.join(', ')}`);
    }

    if (!validDirections.includes(sort.direction)) {
      throw new Error(`Sort direction must be one of: ${validDirections.join(', ')}`);
    }

    return sort;
  }

  /**
   * Validate pagination parameters
   */
  private validatePagination(page: number, pageSize: number): void {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page must be a positive integer');
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new Error('Page size must be an integer between 1 and 100');
    }
  }

  /**
   * Validate search query
   */
  private validateSearchQuery(query: string): void {
    if (typeof query !== 'string') {
      throw new Error('Search query must be a string');
    }

    if (query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (query.length > 200) {
      throw new Error('Search query cannot exceed 200 characters');
    }
  }

  /**
   * Validate product category
   */
  private validateCategory(category: ProductCategory): void {
    const validCategories = [
      'outdoor_gear', 'sports_equipment', 'electronics', 'tools', 
      'vehicles', 'photography', 'music', 'fitness', 'camping', 
      'water_sports', 'winter_sports', 'other'
    ];

    if (!validCategories.includes(category)) {
      throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
    }
  }

  /**
   * Check permission to view owner's products
   */
  private checkOwnerViewPermission(
    ownerId: string,
    requestingUserId?: string,
    userRole?: string
  ): void {
    // Admin can view anyone's products
    if (userRole === 'admin') {
      return;
    }

    // Users can only view their own products
    if (!requestingUserId || requestingUserId !== ownerId) {
      throw new Error('Unauthorized to view these products');
    }
  }
}

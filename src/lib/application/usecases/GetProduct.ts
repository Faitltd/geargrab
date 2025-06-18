import type { ProductService } from '../../domain/services/ProductService';
import type { Product } from '../../shared/types/Product';
import { 
  ProductNotFoundError,
  ProductForbiddenError,
  handleProductError 
} from '../../shared/errors/ProductErrors';

/**
 * Get Product Use Case
 * Handles the business logic for retrieving a single product
 */
export class GetProductUseCase {
  constructor(private readonly productService: ProductService) {}

  /**
   * Get product by ID
   * @param id - Product ID
   * @param userId - ID of the requesting user (optional)
   * @param userRole - Role of the requesting user (optional)
   * @returns Promise resolving to the product
   */
  async executeById(
    id: string,
    userId?: string,
    userRole?: string
  ): Promise<Product> {
    try {
      const product = await this.productService.getProduct(id);
      
      if (!product) {
        throw new ProductNotFoundError(id);
      }

      // Check if user can view this product
      this.checkViewPermission(product, userId, userRole);

      return product;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Get product by slug (SEO-friendly URL)
   * @param slug - Product slug
   * @param userId - ID of the requesting user (optional)
   * @param userRole - Role of the requesting user (optional)
   * @returns Promise resolving to the product
   */
  async executeBySlug(
    slug: string,
    userId?: string,
    userRole?: string
  ): Promise<Product> {
    try {
      const product = await this.productService.getProductBySlug(slug);
      
      if (!product) {
        throw new ProductNotFoundError(`slug:${slug}`);
      }

      // Check if user can view this product
      this.checkViewPermission(product, userId, userRole);

      return product;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Get product with enhanced data (for detailed view)
   * @param id - Product ID
   * @param userId - ID of the requesting user (optional)
   * @param userRole - Role of the requesting user (optional)
   * @returns Promise resolving to the product with additional data
   */
  async executeWithEnhancedData(
    id: string,
    userId?: string,
    userRole?: string
  ): Promise<{
    product: Product;
    isOwner: boolean;
    canEdit: boolean;
    canDelete: boolean;
    relatedProducts?: Product[];
  }> {
    try {
      const product = await this.productService.getProduct(id);
      
      if (!product) {
        throw new ProductNotFoundError(id);
      }

      // Check if user can view this product
      this.checkViewPermission(product, userId, userRole);

      // Determine user permissions
      const isOwner = userId === product.createdBy;
      const isAdmin = userRole === 'admin';
      const canEdit = isOwner || isAdmin;
      const canDelete = isOwner || isAdmin;

      // Get related products (same category, different product)
      let relatedProducts: Product[] = [];
      try {
        const relatedResult = await this.productService.getProductsByCategory(
          product.category,
          1,
          6
        );
        relatedProducts = relatedResult.products.filter(p => p.id !== product.id);
      } catch {
        // If related products fail to load, continue without them
        relatedProducts = [];
      }

      return {
        product,
        isOwner,
        canEdit,
        canDelete,
        relatedProducts
      };
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Get multiple products by IDs
   * @param ids - Array of product IDs
   * @param userId - ID of the requesting user (optional)
   * @param userRole - Role of the requesting user (optional)
   * @returns Promise resolving to array of products
   */
  async executeMultiple(
    ids: string[],
    userId?: string,
    userRole?: string
  ): Promise<Product[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      if (ids.length > 50) {
        throw new Error('Maximum 50 products can be requested at once');
      }

      const products: Product[] = [];
      
      // Fetch products in parallel
      const productPromises = ids.map(id => this.productService.getProduct(id));
      const results = await Promise.allSettled(productPromises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          try {
            // Check if user can view this product
            this.checkViewPermission(result.value, userId, userRole);
            products.push(result.value);
          } catch {
            // Skip products the user can't view
          }
        }
      });

      return products;
    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Check if user has permission to view the product
   */
  private checkViewPermission(
    product: Product,
    userId?: string,
    userRole?: string
  ): void {
    // Public products (active status) can be viewed by anyone
    if (product.status === 'active') {
      return;
    }

    // Draft and inactive products can only be viewed by owner or admin
    if (product.status === 'draft' || product.status === 'inactive') {
      if (!userId) {
        throw new ProductForbiddenError('view', 'authentication required');
      }

      const isOwner = userId === product.createdBy;
      const isAdmin = userRole === 'admin';

      if (!isOwner && !isAdmin) {
        throw new ProductForbiddenError('view', 'not the owner');
      }
    }

    // Rejected products can only be viewed by owner or admin
    if (product.status === 'rejected') {
      if (!userId) {
        throw new ProductForbiddenError('view', 'authentication required');
      }

      const isOwner = userId === product.createdBy;
      const isAdmin = userRole === 'admin';

      if (!isOwner && !isAdmin) {
        throw new ProductForbiddenError('view', 'product is rejected');
      }
    }

    // Out of stock products can be viewed but with limited functionality
    if (product.status === 'out_of_stock') {
      // Allow viewing but the UI should indicate it's out of stock
      return;
    }

    // Discontinued products can be viewed for reference
    if (product.status === 'discontinued') {
      // Allow viewing but the UI should indicate it's discontinued
      return;
    }
  }

  /**
   * Validate product ID format
   */
  private validateProductId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error('Product ID must be a non-empty string');
    }

    if (id.trim().length === 0) {
      throw new Error('Product ID cannot be empty');
    }

    // Basic format validation (adjust based on your ID format)
    if (id.length < 3 || id.length > 50) {
      throw new Error('Product ID must be between 3 and 50 characters');
    }
  }

  /**
   * Validate product slug format
   */
  private validateProductSlug(slug: string): void {
    if (!slug || typeof slug !== 'string') {
      throw new Error('Product slug must be a non-empty string');
    }

    if (slug.trim().length === 0) {
      throw new Error('Product slug cannot be empty');
    }

    // Slug format validation
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      throw new Error('Product slug must contain only lowercase letters, numbers, and hyphens');
    }

    if (slug.length < 3 || slug.length > 100) {
      throw new Error('Product slug must be between 3 and 100 characters');
    }
  }
}

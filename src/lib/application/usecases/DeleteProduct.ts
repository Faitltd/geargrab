import type { ProductService } from '../../domain/services/ProductService';
import { 
  ProductUnauthorizedError,
  ProductNotFoundError,
  ProductBusinessRuleError,
  handleProductError 
} from '../../shared/errors/ProductErrors';

/**
 * Delete Product Use Case
 * Handles the business logic for deleting products (soft and hard delete)
 */
export class DeleteProductUseCase {
  constructor(private readonly productService: ProductService) {}

  /**
   * Execute soft delete (set status to inactive)
   * @param id - Product ID to delete
   * @param userId - ID of the user deleting the product
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving when deletion is complete
   */
  async execute(
    id: string,
    userId: string,
    userRole?: string
  ): Promise<void> {
    try {
      // Authorization check
      if (!userId) {
        throw new ProductUnauthorizedError('delete');
      }

      // Validate input
      this.validateInput(id, userId);

      // Check if product exists and get current state
      const product = await this.productService.getProduct(id);
      if (!product) {
        throw new ProductNotFoundError(id);
      }

      // Validate business rules for deletion
      await this.validateDeletionRules(product);

      // Check user permissions
      const isAdmin = userRole === 'admin';
      const isOwner = product.createdBy === userId;

      if (!isOwner && !isAdmin) {
        throw new ProductUnauthorizedError('delete');
      }

      // Perform soft delete using domain service
      await this.productService.deleteProduct(id, userId, isAdmin);

    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Execute hard delete (permanently remove from database)
   * @param id - Product ID to permanently delete
   * @param userId - ID of the user deleting the product
   * @param userRole - Role of the user (for authorization)
   * @param confirmationToken - Security token to confirm hard delete
   * @returns Promise resolving when deletion is complete
   */
  async executeHardDelete(
    id: string,
    userId: string,
    userRole?: string,
    confirmationToken?: string
  ): Promise<void> {
    try {
      // Authorization check - only admins can hard delete
      if (!userId || userRole !== 'admin') {
        throw new ProductUnauthorizedError('permanently delete');
      }

      // Validate confirmation token for hard delete
      if (!confirmationToken || !this.validateConfirmationToken(confirmationToken, id)) {
        throw new ProductBusinessRuleError(
          'Hard delete requires valid confirmation token',
          { productId: id }
        );
      }

      // Validate input
      this.validateInput(id, userId);

      // Check if product exists
      const product = await this.productService.getProduct(id);
      if (!product) {
        throw new ProductNotFoundError(id);
      }

      // Additional validation for hard delete
      await this.validateHardDeletionRules(product);

      // Perform hard delete
      // Note: This would need to be implemented in the ProductService
      // For now, we'll throw an error indicating it's not implemented
      throw new ProductBusinessRuleError(
        'Hard delete not implemented in this version',
        { productId: id }
      );

    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Execute bulk delete (multiple products)
   * @param ids - Array of product IDs to delete
   * @param userId - ID of the user deleting the products
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving to results of each deletion
   */
  async executeBulkDelete(
    ids: string[],
    userId: string,
    userRole?: string
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    try {
      // Authorization check
      if (!userId) {
        throw new ProductUnauthorizedError('bulk delete');
      }

      // Validate bulk operation limits
      if (ids.length === 0) {
        throw new ProductBusinessRuleError('No product IDs provided for bulk delete');
      }

      if (ids.length > 50) {
        throw new ProductBusinessRuleError(
          'Bulk delete limited to 50 products at once',
          { requestedCount: ids.length, maxAllowed: 50 }
        );
      }

      // Only admins can perform bulk delete
      if (userRole !== 'admin') {
        throw new ProductUnauthorizedError('bulk delete');
      }

      const results = {
        successful: [] as string[],
        failed: [] as Array<{ id: string; error: string }>
      };

      // Process each deletion
      for (const id of ids) {
        try {
          await this.execute(id, userId, userRole);
          results.successful.push(id);
        } catch (error) {
          results.failed.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;

    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Restore a soft-deleted product
   * @param id - Product ID to restore
   * @param userId - ID of the user restoring the product
   * @param userRole - Role of the user (for authorization)
   * @returns Promise resolving when restoration is complete
   */
  async executeRestore(
    id: string,
    userId: string,
    userRole?: string
  ): Promise<void> {
    try {
      // Authorization check
      if (!userId) {
        throw new ProductUnauthorizedError('restore');
      }

      // Validate input
      this.validateInput(id, userId);

      // Check if product exists
      const product = await this.productService.getProduct(id);
      if (!product) {
        throw new ProductNotFoundError(id);
      }

      // Check if product is actually deleted (inactive)
      if (product.status !== 'inactive') {
        throw new ProductBusinessRuleError(
          'Product is not in deleted state',
          { currentStatus: product.status, productId: id }
        );
      }

      // Check user permissions
      const isAdmin = userRole === 'admin';
      const isOwner = product.createdBy === userId;

      if (!isOwner && !isAdmin) {
        throw new ProductUnauthorizedError('restore');
      }

      // Restore product by setting status to draft
      // This would typically use the UpdateProductUseCase
      // For now, we'll indicate this needs to be implemented
      throw new ProductBusinessRuleError(
        'Product restoration not fully implemented',
        { productId: id }
      );

    } catch (error) {
      throw handleProductError(error);
    }
  }

  /**
   * Validate input parameters
   */
  private validateInput(id: string, userId: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new ProductBusinessRuleError('Product ID is required and must be a non-empty string');
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new ProductBusinessRuleError('User ID is required and must be a non-empty string');
    }
  }

  /**
   * Validate business rules for deletion
   */
  private async validateDeletionRules(product: any): Promise<void> {
    // Check if product has active bookings
    // This would typically check with a booking service
    const hasActiveBookings = await this.checkActiveBookings(product.id);
    
    if (hasActiveBookings) {
      throw new ProductBusinessRuleError(
        'Cannot delete product with active bookings',
        { productId: product.id }
      );
    }

    // Check if product has pending transactions
    const hasPendingTransactions = await this.checkPendingTransactions(product.id);
    
    if (hasPendingTransactions) {
      throw new ProductBusinessRuleError(
        'Cannot delete product with pending transactions',
        { productId: product.id }
      );
    }

    // Check if product is currently reserved
    if (product.inventory && product.inventory.reserved > 0) {
      throw new ProductBusinessRuleError(
        'Cannot delete product with reserved inventory',
        { 
          productId: product.id,
          reservedQuantity: product.inventory.reserved 
        }
      );
    }
  }

  /**
   * Validate business rules for hard deletion
   */
  private async validateHardDeletionRules(product: any): Promise<void> {
    // Hard delete has stricter rules
    await this.validateDeletionRules(product);

    // Check if product has any historical bookings
    const hasHistoricalBookings = await this.checkHistoricalBookings(product.id);
    
    if (hasHistoricalBookings) {
      throw new ProductBusinessRuleError(
        'Cannot permanently delete product with booking history',
        { productId: product.id }
      );
    }

    // Check if product has any reviews or ratings
    const hasReviews = await this.checkProductReviews(product.id);
    
    if (hasReviews) {
      throw new ProductBusinessRuleError(
        'Cannot permanently delete product with reviews',
        { productId: product.id }
      );
    }
  }

  /**
   * Validate confirmation token for hard delete
   */
  private validateConfirmationToken(token: string, productId: string): boolean {
    // This would implement proper token validation
    // For now, we'll use a simple format check
    const expectedToken = `CONFIRM_DELETE_${productId}`;
    return token === expectedToken;
  }

  /**
   * Check if product has active bookings
   */
  private async checkActiveBookings(productId: string): Promise<boolean> {
    // This would typically query the bookings service/repository
    // For now, we'll return false (no active bookings)
    return false;
  }

  /**
   * Check if product has pending transactions
   */
  private async checkPendingTransactions(productId: string): Promise<boolean> {
    // This would typically query the payments/transactions service
    // For now, we'll return false (no pending transactions)
    return false;
  }

  /**
   * Check if product has historical bookings
   */
  private async checkHistoricalBookings(productId: string): Promise<boolean> {
    // This would typically query the bookings service for any bookings
    // For now, we'll return false (no historical bookings)
    return false;
  }

  /**
   * Check if product has reviews
   */
  private async checkProductReviews(productId: string): Promise<boolean> {
    // This would typically query the reviews service
    // For now, we'll return false (no reviews)
    return false;
  }
}

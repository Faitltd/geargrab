/**
 * Product Repository Interface
 * Defines the contract for product data access
 */

import { Product } from '../entities/Product';

export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Repository interface for Product persistence
 */
export interface ProductRepository {
  /**
   * Save a product (create or update)
   */
  save(product: Product): Promise<Product>;

  /**
   * Find product by ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find product by SKU
   */
  findBySku(sku: string): Promise<Product | null>;

  /**
   * Find all products with optional filters and pagination
   */
  findAll(
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;

  /**
   * Find products by category
   */
  findByCategory(category: string): Promise<Product[]>;

  /**
   * Search products by name or description
   */
  search(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;

  /**
   * Delete product by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if SKU exists
   */
  existsBySku(sku: string): Promise<boolean>;

  /**
   * Get all unique categories
   */
  getCategories(): Promise<string[]>;

  /**
   * Get products with low stock
   */
  findLowStock(threshold: number): Promise<Product[]>;

  /**
   * Bulk update products
   */
  bulkUpdate(updates: Array<{ id: string; updates: Partial<Product> }>): Promise<Product[]>;
}

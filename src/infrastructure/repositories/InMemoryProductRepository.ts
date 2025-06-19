/**
 * In-Memory Product Repository Implementation
 * For testing and development purposes
 */

import { Product } from '../../domain/entities/Product';
import { ProductRepository, ProductFilters, PaginationOptions, PaginatedResult } from '../../domain/repositories/ProductRepository';

export class InMemoryProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();

  async save(product: Product): Promise<Product> {
    this.products.set(product.id, product);
    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    for (const product of this.products.values()) {
      if (product.sku === sku) {
        return product;
      }
    }
    return null;
  }

  async findAll(
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>> {
    let products = Array.from(this.products.values());

    // Apply filters
    if (filters) {
      products = this.applyFilters(products, filters);
    }

    // Apply sorting
    if (pagination?.sortBy) {
      products = this.applySorting(products, pagination.sortBy, pagination.sortOrder || 'asc');
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
      data: paginatedProducts,
      total: products.length,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit),
      hasNextPage: endIndex < products.length,
      hasPreviousPage: page > 1,
    };
  }

  async findByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.category === category
    );
  }

  async search(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    const searchTerm = query.toLowerCase();
    let products = Array.from(this.products.values()).filter(
      product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
      data: paginatedProducts,
      total: products.length,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit),
      hasNextPage: endIndex < products.length,
      hasPreviousPage: page > 1,
    };
  }

  async delete(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async existsBySku(sku: string): Promise<boolean> {
    for (const product of this.products.values()) {
      if (product.sku === sku) {
        return true;
      }
    }
    return false;
  }

  async getCategories(): Promise<string[]> {
    const categories = new Set<string>();
    for (const product of this.products.values()) {
      categories.add(product.category);
    }
    return Array.from(categories);
  }

  async findLowStock(threshold: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.stock <= threshold && product.isActive
    );
  }

  async bulkUpdate(updates: Array<{ id: string; updates: Partial<Product> }>): Promise<Product[]> {
    const updatedProducts: Product[] = [];
    
    for (const update of updates) {
      const product = this.products.get(update.id);
      if (product) {
        product.update(update.updates);
        this.products.set(product.id, product);
        updatedProducts.push(product);
      }
    }
    
    return updatedProducts;
  }

  private applyFilters(products: Product[], filters: ProductFilters): Product[] {
    return products.filter(product => {
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      if (filters.isActive !== undefined && product.isActive !== filters.isActive) {
        return false;
      }
      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }
      if (filters.inStock !== undefined && product.isInStock() !== filters.inStock) {
        return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => product.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm);
        if (!matchesSearch) {
          return false;
        }
      }
      return true;
    });
  }

  private applySorting(products: Product[], sortBy: string, sortOrder: 'asc' | 'desc'): Product[] {
    return products.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Utility method for testing
  clear(): void {
    this.products.clear();
  }

  // Utility method for testing
  size(): number {
    return this.products.size;
  }
}

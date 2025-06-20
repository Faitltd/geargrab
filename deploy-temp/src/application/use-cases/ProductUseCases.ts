/**
 * Product Use Cases
 * Application layer containing business logic and orchestration
 */

import { Product } from '../../domain/entities/Product';
import { ProductRepository, ProductFilters, PaginationOptions, PaginatedResult } from '../../domain/repositories/ProductRepository';

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  isActive?: boolean;
  tags?: string[];
  images?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  isActive?: boolean;
  tags?: string[];
  images?: string[];
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  isActive: boolean;
  tags: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product use cases implementation
 */
export class ProductUseCases {
  constructor(private productRepository: ProductRepository) {}

  /**
   * Create a new product
   */
  async createProduct(request: CreateProductRequest): Promise<ProductResponse> {
    // Check if SKU already exists
    const existingProduct = await this.productRepository.findBySku(request.sku);
    if (existingProduct) {
      throw new Error(`Product with SKU ${request.sku} already exists`);
    }

    // Create product entity
    const product = Product.create({
      name: request.name,
      description: request.description,
      price: request.price,
      category: request.category,
      sku: request.sku,
      stock: request.stock,
      isActive: request.isActive ?? true,
      tags: request.tags ?? [],
      images: request.images ?? [],
    });

    // Save product
    const savedProduct = await this.productRepository.save(product);
    return this.toResponse(savedProduct);
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductResponse | null> {
    const product = await this.productRepository.findById(id);
    return product ? this.toResponse(product) : null;
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<ProductResponse | null> {
    const product = await this.productRepository.findBySku(sku);
    return product ? this.toResponse(product) : null;
  }

  /**
   * Get all products with filters and pagination
   */
  async getProducts(
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ProductResponse>> {
    const result = await this.productRepository.findAll(filters, pagination);
    return {
      ...result,
      data: result.data.map(product => this.toResponse(product)),
    };
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ProductResponse>> {
    const result = await this.productRepository.search(query, pagination);
    return {
      ...result,
      data: result.data.map(product => this.toResponse(product)),
    };
  }

  /**
   * Update product
   */
  async updateProduct(id: string, request: UpdateProductRequest): Promise<ProductResponse> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    // Update product entity
    product.update(request);

    // Save updated product
    const updatedProduct = await this.productRepository.save(product);
    return this.toResponse(updatedProduct);
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<boolean> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    return await this.productRepository.delete(id);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<ProductResponse[]> {
    const products = await this.productRepository.findByCategory(category);
    return products.map(product => this.toResponse(product));
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    return await this.productRepository.getCategories();
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number, operation: 'increase' | 'decrease'): Promise<ProductResponse> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    if (operation === 'increase') {
      product.increaseStock(quantity);
    } else {
      product.reduceStock(quantity);
    }

    const updatedProduct = await this.productRepository.save(product);
    return this.toResponse(updatedProduct);
  }

  /**
   * Activate/Deactivate product
   */
  async toggleProductStatus(id: string, isActive: boolean): Promise<ProductResponse> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    if (isActive) {
      product.activate();
    } else {
      product.deactivate();
    }

    const updatedProduct = await this.productRepository.save(product);
    return this.toResponse(updatedProduct);
  }

  /**
   * Get products with low stock
   */
  async getLowStockProducts(threshold: number = 10): Promise<ProductResponse[]> {
    const products = await this.productRepository.findLowStock(threshold);
    return products.map(product => this.toResponse(product));
  }

  /**
   * Convert Product entity to response DTO
   */
  private toResponse(product: Product): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      sku: product.sku,
      stock: product.stock,
      isActive: product.isActive,
      tags: product.tags,
      images: product.images,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}

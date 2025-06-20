/**
 * Product Controller
 * HTTP layer handling product-related requests
 */

import { Request, Response, NextFunction } from 'express';
import { ProductUseCases, CreateProductRequest, UpdateProductRequest } from '../../../application/use-cases/ProductUseCases';
import { ProductFilters, PaginationOptions } from '../../../domain/repositories/ProductRepository';

export class ProductController {
  constructor(private productUseCases: ProductUseCases) {}

  /**
   * Create a new product
   * POST /api/products
   */
  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productData: CreateProductRequest = req.body;
      const product = await this.productUseCases.createProduct(productData);
      
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await this.productUseCases.getProductById(id);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product by SKU
   * GET /api/products/sku/:sku
   */
  getProductBySku = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sku } = req.params;
      const product = await this.productUseCases.getProductBySku(sku);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all products with filters and pagination
   * GET /api/products
   */
  getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: ProductFilters = {
        category: req.query.category as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStock: req.query.inStock ? req.query.inStock === 'true' : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search as string,
      };

      const pagination: PaginationOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = await this.productUseCases.getProducts(filters, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search products
   * GET /api/products/search
   */
  searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const pagination: PaginationOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const result = await this.productUseCases.searchProducts(query, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update product
   * PUT /api/products/:id
   */
  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateProductRequest = req.body;
      
      const product = await this.productUseCases.updateProduct(id, updateData);
      
      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.productUseCases.deleteProduct(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get products by category
   * GET /api/products/category/:category
   */
  getProductsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category } = req.params;
      const products = await this.productUseCases.getProductsByCategory(category);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all categories
   * GET /api/products/categories
   */
  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.productUseCases.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update product stock
   * PATCH /api/products/:id/stock
   */
  updateStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;
      
      if (!quantity || !operation || !['increase', 'decrease'].includes(operation)) {
        res.status(400).json({
          success: false,
          message: 'Valid quantity and operation (increase/decrease) are required'
        });
        return;
      }

      const product = await this.productUseCases.updateStock(id, quantity, operation);
      
      res.json({
        success: true,
        data: product,
        message: `Stock ${operation}d successfully`
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle product status
   * PATCH /api/products/:id/status
   */
  toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
        return;
      }

      const product = await this.productUseCases.toggleProductStatus(id, isActive);
      
      res.json({
        success: true,
        data: product,
        message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get low stock products
   * GET /api/products/low-stock
   */
  getLowStockProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
      const products = await this.productUseCases.getLowStockProducts(threshold);
      
      res.json({
        success: true,
        data: products,
        message: `Found ${products.length} products with low stock`
      });
    } catch (error) {
      next(error);
    }
  };
}

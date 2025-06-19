/**
 * Product Routes
 * Express router configuration for product endpoints
 */

import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { validateCreateProduct, validateUpdateProduct, validatePagination } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

export function createProductRoutes(productController: ProductController): Router {
  const router = Router();

  // Apply rate limiting to all product routes
  router.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  }));

  /**
   * Public routes (no authentication required)
   */
  
  // GET /api/products - Get all products with filters and pagination
  router.get('/', validatePagination, productController.getProducts);

  // GET /api/products/search - Search products
  router.get('/search', validatePagination, productController.searchProducts);

  // GET /api/products/categories - Get all categories
  router.get('/categories', productController.getCategories);

  // GET /api/products/category/:category - Get products by category
  router.get('/category/:category', productController.getProductsByCategory);

  // GET /api/products/sku/:sku - Get product by SKU
  router.get('/sku/:sku', productController.getProductBySku);

  // GET /api/products/:id - Get product by ID
  router.get('/:id', productController.getProductById);

  /**
   * Protected routes (authentication required)
   */

  // POST /api/products - Create new product (admin only)
  router.post('/', 
    authenticate, 
    authorize(['admin', 'manager']), 
    validateCreateProduct, 
    productController.createProduct
  );

  // PUT /api/products/:id - Update product (admin/manager only)
  router.put('/:id', 
    authenticate, 
    authorize(['admin', 'manager']), 
    validateUpdateProduct, 
    productController.updateProduct
  );

  // DELETE /api/products/:id - Delete product (admin only)
  router.delete('/:id', 
    authenticate, 
    authorize(['admin']), 
    productController.deleteProduct
  );

  // PATCH /api/products/:id/stock - Update product stock (admin/manager only)
  router.patch('/:id/stock', 
    authenticate, 
    authorize(['admin', 'manager']), 
    productController.updateStock
  );

  // PATCH /api/products/:id/status - Toggle product status (admin/manager only)
  router.patch('/:id/status', 
    authenticate, 
    authorize(['admin', 'manager']), 
    productController.toggleStatus
  );

  // GET /api/products/low-stock - Get low stock products (admin/manager only)
  router.get('/management/low-stock', 
    authenticate, 
    authorize(['admin', 'manager']), 
    productController.getLowStockProducts
  );

  return router;
}

/**
 * Product API Documentation
 * 
 * Public Endpoints:
 * - GET /api/products - Get all products with optional filters
 *   Query params: category, isActive, minPrice, maxPrice, inStock, tags, search, page, limit, sortBy, sortOrder
 * 
 * - GET /api/products/search?q=query - Search products
 *   Query params: q (required), page, limit
 * 
 * - GET /api/products/categories - Get all product categories
 * 
 * - GET /api/products/category/:category - Get products by category
 * 
 * - GET /api/products/sku/:sku - Get product by SKU
 * 
 * - GET /api/products/:id - Get product by ID
 * 
 * Protected Endpoints (require authentication):
 * - POST /api/products - Create new product (admin/manager only)
 *   Body: { name, description, price, category, sku, stock, isActive?, tags?, images? }
 * 
 * - PUT /api/products/:id - Update product (admin/manager only)
 *   Body: { name?, description?, price?, category?, stock?, isActive?, tags?, images? }
 * 
 * - DELETE /api/products/:id - Delete product (admin only)
 * 
 * - PATCH /api/products/:id/stock - Update product stock (admin/manager only)
 *   Body: { quantity: number, operation: 'increase' | 'decrease' }
 * 
 * - PATCH /api/products/:id/status - Toggle product status (admin/manager only)
 *   Body: { isActive: boolean }
 * 
 * - GET /api/products/management/low-stock?threshold=10 - Get low stock products (admin/manager only)
 *   Query params: threshold (optional, default: 10)
 */

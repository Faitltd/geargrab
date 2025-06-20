/**
 * Express Application Setup
 * Main application configuration with clean architecture
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { ProductController } from './controllers/ProductController';
import { ProductUseCases } from '../../application/use-cases/ProductUseCases';
import { InMemoryProductRepository } from '../repositories/InMemoryProductRepository';
import { createProductRoutes } from './routes/productRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimit } from './middleware/rateLimit';

/**
 * Application factory function
 * Creates and configures Express application with dependency injection
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  }));

  // Compression middleware
  app.use(compression());

  // Request parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Rate limiting
  app.use('/api', apiRateLimit);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API info endpoint
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'Product Catalog API',
      version: '1.0.0',
      endpoints: {
        products: '/api/products',
        health: '/health',
        docs: '/api/docs'
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Dependency injection setup
  const productRepository = new InMemoryProductRepository();
  const productUseCases = new ProductUseCases(productRepository);
  const productController = new ProductController(productUseCases);

  // Routes
  app.use('/api/products', createProductRoutes(productController));

  // API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json({
      success: true,
      message: 'Product Catalog API Documentation',
      version: '1.0.0',
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      endpoints: [
        {
          method: 'GET',
          path: '/products',
          description: 'Get all products with optional filters and pagination',
          parameters: {
            query: {
              category: 'string (optional)',
              isActive: 'boolean (optional)',
              minPrice: 'number (optional)',
              maxPrice: 'number (optional)',
              inStock: 'boolean (optional)',
              tags: 'string (comma-separated, optional)',
              search: 'string (optional)',
              page: 'number (optional, default: 1)',
              limit: 'number (optional, default: 10, max: 100)',
              sortBy: 'string (optional: name, price, stock, createdAt, updatedAt)',
              sortOrder: 'string (optional: asc, desc, default: asc)'
            }
          }
        },
        {
          method: 'GET',
          path: '/products/:id',
          description: 'Get product by ID',
          parameters: {
            path: {
              id: 'string (required)'
            }
          }
        },
        {
          method: 'GET',
          path: '/products/sku/:sku',
          description: 'Get product by SKU',
          parameters: {
            path: {
              sku: 'string (required)'
            }
          }
        },
        {
          method: 'GET',
          path: '/products/search',
          description: 'Search products',
          parameters: {
            query: {
              q: 'string (required)',
              page: 'number (optional)',
              limit: 'number (optional)'
            }
          }
        },
        {
          method: 'GET',
          path: '/products/categories',
          description: 'Get all product categories'
        },
        {
          method: 'GET',
          path: '/products/category/:category',
          description: 'Get products by category',
          parameters: {
            path: {
              category: 'string (required)'
            }
          }
        },
        {
          method: 'POST',
          path: '/products',
          description: 'Create new product (requires authentication)',
          authentication: 'Bearer token (admin/manager roles)',
          body: {
            name: 'string (required)',
            description: 'string (required)',
            price: 'number (required)',
            category: 'string (required)',
            sku: 'string (required)',
            stock: 'number (required)',
            isActive: 'boolean (optional, default: true)',
            tags: 'array of strings (optional)',
            images: 'array of URLs (optional)'
          }
        },
        {
          method: 'PUT',
          path: '/products/:id',
          description: 'Update product (requires authentication)',
          authentication: 'Bearer token (admin/manager roles)',
          parameters: {
            path: {
              id: 'string (required)'
            }
          },
          body: {
            name: 'string (optional)',
            description: 'string (optional)',
            price: 'number (optional)',
            category: 'string (optional)',
            stock: 'number (optional)',
            isActive: 'boolean (optional)',
            tags: 'array of strings (optional)',
            images: 'array of URLs (optional)'
          }
        },
        {
          method: 'DELETE',
          path: '/products/:id',
          description: 'Delete product (requires authentication)',
          authentication: 'Bearer token (admin role)',
          parameters: {
            path: {
              id: 'string (required)'
            }
          }
        },
        {
          method: 'PATCH',
          path: '/products/:id/stock',
          description: 'Update product stock (requires authentication)',
          authentication: 'Bearer token (admin/manager roles)',
          parameters: {
            path: {
              id: 'string (required)'
            }
          },
          body: {
            quantity: 'number (required)',
            operation: 'string (required: increase or decrease)'
          }
        },
        {
          method: 'PATCH',
          path: '/products/:id/status',
          description: 'Toggle product status (requires authentication)',
          authentication: 'Bearer token (admin/manager roles)',
          parameters: {
            path: {
              id: 'string (required)'
            }
          },
          body: {
            isActive: 'boolean (required)'
          }
        },
        {
          method: 'GET',
          path: '/products/management/low-stock',
          description: 'Get low stock products (requires authentication)',
          authentication: 'Bearer token (admin/manager roles)',
          parameters: {
            query: {
              threshold: 'number (optional, default: 10)'
            }
          }
        }
      ],
      authentication: {
        type: 'Bearer Token (JWT)',
        header: 'Authorization: Bearer <token>',
        alternative: 'API Key',
        apiKeyHeader: 'X-API-Key: <key>'
      },
      responses: {
        success: {
          structure: {
            success: true,
            data: 'object or array',
            message: 'string (optional)',
            pagination: 'object (for paginated responses)'
          }
        },
        error: {
          structure: {
            success: false,
            message: 'string',
            code: 'string (optional)',
            details: 'any (optional)',
            timestamp: 'ISO string',
            path: 'string',
            method: 'string'
          }
        }
      }
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
export function startServer(port: number = 3000): void {
  const app = createApp();
  
  app.listen(port, () => {
    console.log(`🚀 Product Catalog API server running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    console.log(`🏥 Health Check: http://localhost:${port}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

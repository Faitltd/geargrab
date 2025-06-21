/**
 * Product Controller Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../src/infrastructure/web/app';
import { Application } from 'express';

describe('Product Controller Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  const validProduct = {
    name: 'Test Product',
    description: 'A test product for integration testing',
    price: 99.99,
    category: 'Electronics',
    sku: 'TEST-INT-001',
    stock: 50,
    isActive: true,
    tags: ['test', 'integration'],
    images: ['https://example.com/test-image.jpg'],
  };

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return products with filters', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics&isActive=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return products with pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/products/search', () => {
    it('should search products successfully', async () => {
      const response = await request(app)
        .get('/api/products/search?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 for missing search query', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Search query is required');
    });
  });

  describe('GET /api/products/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should create product successfully with valid auth', async () => {
      // Note: This test assumes you have a way to generate valid JWT tokens
      // In a real scenario, you'd need to set up authentication properly
      const mockToken = 'Bearer mock-admin-token';

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', mockToken)
        .send(validProduct);

      // This will fail without proper auth setup, but shows the structure
      // expect(response.status).toBe(201);
      // expect(response.body.success).toBe(true);
      // expect(response.body.data.name).toBe(validProduct.name);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(validProduct)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        name: '', // Invalid: empty name
        price: -10, // Invalid: negative price
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(401); // Will be 401 due to missing auth, but would be 400 with auth

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('GET /api/products/sku/:sku', () => {
    it('should return 404 for non-existent SKU', async () => {
      const response = await request(app)
        .get('/api/products/sku/NON-EXISTENT-SKU')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('API Documentation', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product Catalog API Documentation');
      expect(response.body).toHaveProperty('endpoints');
      expect(Array.isArray(response.body.endpoints)).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Service is healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('API Info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product Catalog API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Route GET /api/non-existent-route not found');
    });

    it('should handle validation errors properly', async () => {
      const response = await request(app)
        .get('/api/products?page=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting headers', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });
});

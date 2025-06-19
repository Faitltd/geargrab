/**
 * Product Entity Unit Tests
 */

import { Product } from '../../src/domain/entities/Product';

describe('Product Entity', () => {
  const validProductProps = {
    name: 'Test Product',
    description: 'A test product description',
    price: 99.99,
    category: 'Electronics',
    sku: 'TEST-001',
    stock: 10,
    isActive: true,
    tags: ['test', 'electronics'],
    images: ['https://example.com/image1.jpg'],
  };

  describe('Product Creation', () => {
    it('should create a product with valid properties', () => {
      const product = Product.create(validProductProps);

      expect(product.name).toBe(validProductProps.name);
      expect(product.description).toBe(validProductProps.description);
      expect(product.price).toBe(validProductProps.price);
      expect(product.category).toBe(validProductProps.category);
      expect(product.sku).toBe(validProductProps.sku);
      expect(product.stock).toBe(validProductProps.stock);
      expect(product.isActive).toBe(validProductProps.isActive);
      expect(product.tags).toEqual(validProductProps.tags);
      expect(product.images).toEqual(validProductProps.images);
      expect(product.id).toBeDefined();
      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        Product.create({ ...validProductProps, name: '' });
      }).toThrow('Product name is required');
    });

    it('should throw error for negative price', () => {
      expect(() => {
        Product.create({ ...validProductProps, price: -10 });
      }).toThrow('Product price cannot be negative');
    });

    it('should throw error for negative stock', () => {
      expect(() => {
        Product.create({ ...validProductProps, stock: -5 });
      }).toThrow('Product stock cannot be negative');
    });

    it('should throw error for empty SKU', () => {
      expect(() => {
        Product.create({ ...validProductProps, sku: '' });
      }).toThrow('Product SKU is required');
    });
  });

  describe('Product Methods', () => {
    let product: Product;

    beforeEach(() => {
      product = Product.create(validProductProps);
    });

    it('should check if product is in stock', () => {
      expect(product.isInStock()).toBe(true);

      product.update({ stock: 0 });
      expect(product.isInStock()).toBe(false);

      product.update({ stock: 5, isActive: false });
      expect(product.isInStock()).toBe(false);
    });

    it('should reduce stock correctly', () => {
      const initialStock = product.stock;
      product.reduceStock(3);
      expect(product.stock).toBe(initialStock - 3);
    });

    it('should throw error when reducing stock below zero', () => {
      expect(() => {
        product.reduceStock(15); // More than available stock
      }).toThrow('Insufficient stock');
    });

    it('should throw error when reducing stock with invalid quantity', () => {
      expect(() => {
        product.reduceStock(0);
      }).toThrow('Quantity must be positive');

      expect(() => {
        product.reduceStock(-5);
      }).toThrow('Quantity must be positive');
    });

    it('should increase stock correctly', () => {
      const initialStock = product.stock;
      product.increaseStock(5);
      expect(product.stock).toBe(initialStock + 5);
    });

    it('should throw error when increasing stock with invalid quantity', () => {
      expect(() => {
        product.increaseStock(0);
      }).toThrow('Quantity must be positive');

      expect(() => {
        product.increaseStock(-3);
      }).toThrow('Quantity must be positive');
    });

    it('should activate product', () => {
      product.deactivate();
      expect(product.isActive).toBe(false);

      product.activate();
      expect(product.isActive).toBe(true);
    });

    it('should deactivate product', () => {
      expect(product.isActive).toBe(true);

      product.deactivate();
      expect(product.isActive).toBe(false);
    });

    it('should update product properties', () => {
      const updates = {
        name: 'Updated Product',
        price: 149.99,
        description: 'Updated description',
      };

      const originalUpdatedAt = product.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        product.update(updates);

        expect(product.name).toBe(updates.name);
        expect(product.price).toBe(updates.price);
        expect(product.description).toBe(updates.description);
        expect(product.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('should convert to object', () => {
      const productObj = product.toObject();

      expect(productObj).toEqual({
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
      });
    });
  });

  describe('Product Reconstitution', () => {
    it('should reconstitute product from persistence', () => {
      const productProps = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Electronics',
        sku: 'TEST-001',
        stock: 10,
        isActive: true,
        tags: ['test'],
        images: ['image.jpg'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      const product = Product.fromPersistence(productProps);

      expect(product.id).toBe(productProps.id);
      expect(product.name).toBe(productProps.name);
      expect(product.createdAt).toEqual(productProps.createdAt);
      expect(product.updatedAt).toEqual(productProps.updatedAt);
    });
  });
});

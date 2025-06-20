import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  type DocumentSnapshot,
  type QueryConstraint,
  type Timestamp,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '../../firebase/client';
import { adminFirestore } from '../../firebase/server';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { 
  Product, 
  ProductFilters, 
  ProductSortOptions, 
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
  ProductAvailability,
  ProductCategory,
  ProductStatus
} from '../../shared/types/Product';
import { ProductMapper } from '../database/ProductMapper';
import { 
  ProductNotFoundError, 
  ProductDatabaseError,
  ProductAlreadyExistsError 
} from '../../shared/errors/ProductErrors';

/**
 * Firestore implementation of ProductRepository
 * Handles all database operations for products using Firebase Firestore
 */
export class FirestoreProductRepository implements ProductRepository {
  private readonly collectionName = 'products';
  private readonly db = typeof window !== 'undefined' ? firestore : adminFirestore;

  /**
   * Find a product by its unique identifier
   */
  async findById(id: string): Promise<Product | null> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return ProductMapper.toDomain({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
      throw new ProductDatabaseError('findById', error as Error);
    }
  }

  /**
   * Find a product by its SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('sku', '==', sku),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return ProductMapper.toDomain({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new ProductDatabaseError('findBySku', error as Error);
    }
  }

  /**
   * Find a product by its SEO slug
   */
  async findBySlug(slug: string): Promise<Product | null> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('seo.slug', '==', slug),
        where('status', '==', 'active'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return ProductMapper.toDomain({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new ProductDatabaseError('findBySlug', error as Error);
    }
  }

  /**
   * Find multiple products with filtering, sorting, and pagination
   */
  async findMany(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ProductListResult> {
    try {
      // Build query constraints
      const constraints: QueryConstraint[] = [];
      
      // Apply filters
      if (filters) {
        if (filters.category) {
          constraints.push(where('category', '==', filters.category));
        }
        
        if (filters.subcategory) {
          constraints.push(where('subcategory', '==', filters.subcategory));
        }
        
        if (filters.brand) {
          constraints.push(where('brand', '==', filters.brand));
        }
        
        if (filters.status) {
          constraints.push(where('status', '==', filters.status));
        } else {
          // Default to active products only
          constraints.push(where('status', '==', 'active'));
        }
        
        if (filters.priceRange) {
          if (filters.priceRange.min !== undefined) {
            constraints.push(where('price.dailyRate', '>=', filters.priceRange.min));
          }
          if (filters.priceRange.max !== undefined) {
            constraints.push(where('price.dailyRate', '<=', filters.priceRange.max));
          }
        }
        
        if (filters.tags && filters.tags.length > 0) {
          constraints.push(where('tags', 'array-contains-any', filters.tags));
        }
      } else {
        // Default to active products only
        constraints.push(where('status', '==', 'active'));
      }
      
      // Apply sorting
      const sortField = sort?.field || 'createdAt';
      const sortDirection = sort?.direction || 'desc';
      constraints.push(orderBy(sortField, sortDirection));
      
      // Apply pagination
      constraints.push(limit(pageSize + 1)); // Get one extra to check if there's a next page
      
      const q = query(collection(this.db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const products: Product[] = [];
      const docs = querySnapshot.docs.slice(0, pageSize); // Remove the extra doc
      
      docs.forEach((doc) => {
        products.push(ProductMapper.toDomain({ id: doc.id, ...doc.data() }));
      });
      
      // Calculate pagination info
      const hasNext = querySnapshot.docs.length > pageSize;
      const hasPrevious = page > 1;
      
      // For total count, we'd need a separate query or maintain counters
      // This is a simplified implementation
      const total = products.length; // This is not accurate, just for demo
      
      return {
        products,
        total,
        page,
        pageSize,
        hasNext,
        hasPrevious
      };
    } catch (error) {
      throw new ProductDatabaseError('findMany', error as Error);
    }
  }

  /**
   * Search products by text query
   */
  async search(
    query: string,
    filters?: ProductFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ProductListResult> {
    try {
      // For full-text search, we'd typically use a search service like Algolia
      // This is a simplified implementation using array-contains-any on searchTerms
      const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      
      const constraints: QueryConstraint[] = [
        where('searchTerms', 'array-contains-any', searchTerms.slice(0, 10)), // Firestore limit
        where('status', '==', 'active')
      ];
      
      // Apply additional filters
      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(pageSize + 1));
      
      const q = query(collection(this.db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const products: Product[] = [];
      const docs = querySnapshot.docs.slice(0, pageSize);
      
      docs.forEach((doc) => {
        products.push(ProductMapper.toDomain({ id: doc.id, ...doc.data() }));
      });
      
      return {
        products,
        total: products.length,
        page,
        pageSize,
        hasNext: querySnapshot.docs.length > pageSize,
        hasPrevious: page > 1
      };
    } catch (error) {
      throw new ProductDatabaseError('search', error as Error);
    }
  }

  /**
   * Create a new product
   */
  async create(productData: CreateProductInput, userId: string): Promise<Product> {
    try {
      const now = serverTimestamp() as Timestamp;
      const slug = this.generateSlug(productData.name);
      
      const firestoreData = ProductMapper.createInputToFirestore(
        productData,
        userId,
        slug,
        now,
        now
      );
      
      const docRef = await addDoc(collection(this.db, this.collectionName), firestoreData);
      
      // Return the created product
      const createdDoc = await getDoc(docRef);
      if (!createdDoc.exists()) {
        throw new ProductDatabaseError('create', new Error('Failed to retrieve created product'));
      }
      
      return ProductMapper.toDomain({ id: createdDoc.id, ...createdDoc.data() });
    } catch (error) {
      throw new ProductDatabaseError('create', error as Error);
    }
  }

  /**
   * Update an existing product
   */
  async update(id: string, updateData: UpdateProductInput, userId: string): Promise<Product> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const now = serverTimestamp() as Timestamp;
      
      const firestoreUpdate = ProductMapper.updateToFirestore(updateData, userId, now);
      
      await updateDoc(docRef, firestoreUpdate);
      
      // Return the updated product
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new ProductNotFoundError(id);
      }
      
      return ProductMapper.toDomain({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw error;
      }
      throw new ProductDatabaseError('update', error as Error);
    }
  }

  /**
   * Delete a product (soft delete by setting status to inactive)
   */
  async delete(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        status: 'inactive',
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
    } catch (error) {
      throw new ProductDatabaseError('delete', error as Error);
    }
  }

  /**
   * Hard delete a product (permanently remove from database)
   */
  async hardDelete(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw new ProductDatabaseError('hardDelete', error as Error);
    }
  }

  /**
   * Generate URL-friendly slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  async exists(id: string): Promise<boolean> {
    const product = await this.findById(id);
    return product !== null;
  }

  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const product = await this.findBySku(sku);
    return product !== null && product.id !== excludeId;
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const product = await this.findBySlug(slug);
    return product !== null && product.id !== excludeId;
  }

  async findByCategory(
    category: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ProductListResult> {
    return this.findMany(
      { category: category as ProductCategory, status: 'active' },
      { field: 'createdAt', direction: 'desc' },
      page,
      pageSize
    );
  }

  async findByOwner(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ProductListResult> {
    try {
      const constraints: QueryConstraint[] = [
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize + 1)
      ];

      const q = query(collection(this.db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const products: Product[] = [];
      const docs = querySnapshot.docs.slice(0, pageSize);

      docs.forEach((doc) => {
        products.push(ProductMapper.toDomain({ id: doc.id, ...doc.data() }));
      });

      return {
        products,
        total: products.length,
        page,
        pageSize,
        hasNext: querySnapshot.docs.length > pageSize,
        hasPrevious: page > 1
      };
    } catch (error) {
      throw new ProductDatabaseError('findByOwner', error as Error);
    }
  }

  async findFeatured(limit: number = 12): Promise<Product[]> {
    try {
      // In a real implementation, you might have a 'featured' field or use ratings
      const q = query(
        collection(this.db, this.collectionName),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        products.push(ProductMapper.toDomain({ id: doc.id, ...doc.data() }));
      });

      return products;
    } catch (error) {
      throw new ProductDatabaseError('findFeatured', error as Error);
    }
  }

  async findRecent(limit: number = 12): Promise<Product[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        products.push(ProductMapper.toDomain({ id: doc.id, ...doc.data() }));
      });

      return products;
    } catch (error) {
      throw new ProductDatabaseError('findRecent', error as Error);
    }
  }

  async findLowStock(userId?: string): Promise<Product[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', 'active'),
        where('inventory.trackInventory', '==', true)
      ];

      if (userId) {
        constraints.push(where('createdBy', '==', userId));
      }

      const q = query(collection(this.db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const product = ProductMapper.toDomain({ id: doc.id, ...doc.data() });

        // Check if product is actually low stock
        if (product.inventory.lowStockThreshold &&
            product.inventory.available <= product.inventory.lowStockThreshold) {
          products.push(product);
        }
      });

      return products;
    } catch (error) {
      throw new ProductDatabaseError('findLowStock', error as Error);
    }
  }

  async checkAvailability(
    productId: string,
    startDate: Date,
    endDate: Date,
    quantity: number = 1
  ): Promise<ProductAvailability> {
    try {
      const product = await this.findById(productId);

      if (!product) {
        return {
          productId,
          available: false,
          availableQuantity: 0,
          conflictingBookings: [],
          nextAvailableDate: undefined
        };
      }

      // Basic availability check based on inventory
      const available = product.status === 'active' &&
                       product.inventory.available >= quantity;

      return {
        productId,
        available,
        availableQuantity: product.inventory.available,
        conflictingBookings: [], // Would need to check against bookings collection
        nextAvailableDate: available ? undefined : new Date() // Simplified
      };
    } catch (error) {
      throw new ProductDatabaseError('checkAvailability', error as Error);
    }
  }

  async reserveInventory(
    productId: string,
    quantity: number,
    reservationId: string
  ): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, productId);
      const product = await this.findById(productId);

      if (!product) {
        throw new ProductNotFoundError(productId);
      }

      const newReserved = product.inventory.reserved + quantity;
      const newAvailable = product.inventory.quantity - newReserved;

      await updateDoc(docRef, {
        'inventory.reserved': newReserved,
        'inventory.available': newAvailable,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new ProductDatabaseError('reserveInventory', error as Error);
    }
  }

  async releaseInventory(
    productId: string,
    quantity: number,
    reservationId: string
  ): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, productId);
      const product = await this.findById(productId);

      if (!product) {
        throw new ProductNotFoundError(productId);
      }

      const newReserved = Math.max(0, product.inventory.reserved - quantity);
      const newAvailable = product.inventory.quantity - newReserved;

      await updateDoc(docRef, {
        'inventory.reserved': newReserved,
        'inventory.available': newAvailable,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new ProductDatabaseError('releaseInventory', error as Error);
    }
  }

  async updateInventory(
    productId: string,
    quantityChange: number,
    userId: string
  ): Promise<Product> {
    try {
      const product = await this.findById(productId);

      if (!product) {
        throw new ProductNotFoundError(productId);
      }

      const newQuantity = product.inventory.quantity + quantityChange;
      const newAvailable = newQuantity - product.inventory.reserved;

      const docRef = doc(this.db, this.collectionName, productId);
      await updateDoc(docRef, {
        'inventory.quantity': newQuantity,
        'inventory.available': newAvailable,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });

      return this.findById(productId) as Promise<Product>;
    } catch (error) {
      throw new ProductDatabaseError('updateInventory', error as Error);
    }
  }

  async bulkUpdate(
    updates: Array<{ id: string; data: UpdateProductInput }>,
    userId: string
  ): Promise<Product[]> {
    try {
      const batch = writeBatch(this.db);
      const now = serverTimestamp() as Timestamp;

      updates.forEach(({ id, data }) => {
        const docRef = doc(this.db, this.collectionName, id);
        const firestoreUpdate = ProductMapper.updateToFirestore(data, userId, now);
        batch.update(docRef, firestoreUpdate);
      });

      await batch.commit();

      // Return updated products
      const updatedProducts: Product[] = [];
      for (const { id } of updates) {
        const product = await this.findById(id);
        if (product) {
          updatedProducts.push(product);
        }
      }

      return updatedProducts;
    } catch (error) {
      throw new ProductDatabaseError('bulkUpdate', error as Error);
    }
  }

  async getStatistics(userId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    draft: number;
    lowStock: number;
    outOfStock: number;
  }> {
    try {
      const constraints: QueryConstraint[] = [];

      if (userId) {
        constraints.push(where('createdBy', '==', userId));
      }

      const q = query(collection(this.db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const stats = {
        total: 0,
        active: 0,
        inactive: 0,
        draft: 0,
        lowStock: 0,
        outOfStock: 0
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.total++;

        switch (data.status) {
          case 'active':
            stats.active++;
            break;
          case 'inactive':
            stats.inactive++;
            break;
          case 'draft':
            stats.draft++;
            break;
        }

        // Check stock levels
        if (data.inventory?.available === 0) {
          stats.outOfStock++;
        } else if (data.inventory?.lowStockThreshold &&
                   data.inventory?.available <= data.inventory.lowStockThreshold) {
          stats.lowStock++;
        }
      });

      return stats;
    } catch (error) {
      throw new ProductDatabaseError('getStatistics', error as Error);
    }
  }
}

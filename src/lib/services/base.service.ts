// Base service class with common patterns and utilities

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
  type Query,
  type WhereFilterOp,
  type OrderByDirection
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import type { ApiResponse, PaginationMeta } from '$lib/types';

export interface BaseEntity {
  id?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface QueryOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: OrderByDirection;
  startAfter?: QueryDocumentSnapshot;
  filters?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: any;
  }>;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  total?: number;
}

export class BaseService<T extends BaseEntity> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Ensure Firestore is initialized
   */
  protected ensureFirestore(): void {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
  }

  /**
   * Get collection reference
   */
  protected getCollection() {
    this.ensureFirestore();
    return collection(db, this.collectionName);
  }

  /**
   * Get document reference
   */
  protected getDocRef(id: string) {
    this.ensureFirestore();
    return doc(db, this.collectionName, id);
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.getCollection(), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw new Error(`Failed to create ${this.collectionName}`);
    }
  }

  /**
   * Get a document by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(this.getDocRef(id));
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by ID:`, error);
      throw new Error(`Failed to get ${this.collectionName}`);
    }
  }

  /**
   * Update a document
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw new Error(`Failed to update ${this.collectionName}`);
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(id));
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw new Error(`Failed to delete ${this.collectionName}`);
    }
  }

  /**
   * Build query with options
   */
  protected buildQuery(options: QueryOptions = {}): Query {
    let q: Query = this.getCollection();

    // Apply filters
    if (options.filters) {
      for (const filter of options.filters) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }
    }

    // Apply ordering
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy, options.orderDirection || 'desc'));
    }

    // Apply pagination
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }

    // Apply limit
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    return q;
  }

  /**
   * Get documents with query options
   */
  async getMany(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    try {
      const q = this.buildQuery(options);
      const querySnapshot = await getDocs(q);
      
      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as T);
      });

      const lastDoc = querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

      const hasMore = querySnapshot.docs.length === (options.limit || 0);

      return {
        data,
        lastDoc,
        hasMore
      };
    } catch (error) {
      console.error(`Error getting ${this.collectionName} list:`, error);
      throw new Error(`Failed to get ${this.collectionName} list`);
    }
  }

  /**
   * Get all documents (use with caution)
   */
  async getAll(): Promise<T[]> {
    const result = await this.getMany({ limit: 1000 });
    return result.data;
  }

  /**
   * Check if document exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const docSnap = await getDoc(this.getDocRef(id));
      return docSnap.exists();
    } catch (error) {
      console.error(`Error checking ${this.collectionName} existence:`, error);
      return false;
    }
  }

  /**
   * Count documents (approximate)
   */
  async count(filters?: QueryOptions['filters']): Promise<number> {
    try {
      const options: QueryOptions = { limit: 1000 };
      if (filters) {
        options.filters = filters;
      }
      
      const result = await this.getMany(options);
      return result.data.length;
    } catch (error) {
      console.error(`Error counting ${this.collectionName}:`, error);
      return 0;
    }
  }

  /**
   * Create API response wrapper
   */
  protected createResponse<TData = any>(
    success: boolean,
    data?: TData,
    error?: string,
    message?: string
  ): ApiResponse<TData> {
    return {
      success,
      data,
      error: error ? { code: 'UNKNOWN', message: error } : undefined,
      message
    };
  }

  /**
   * Handle service errors consistently
   */
  protected handleError(error: any, operation: string): never {
    console.error(`${this.collectionName} service error in ${operation}:`, error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication.');
    }
    
    if (error.code === 'not-found') {
      throw new Error(`${this.collectionName} not found.`);
    }
    
    if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please try again.');
    }
    
    throw new Error(error.message || `Failed to ${operation} ${this.collectionName}`);
  }
}

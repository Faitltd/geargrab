import type { DocumentData, Timestamp } from 'firebase/firestore';
import type { 
  Product, 
  CreateProductInput, 
  ProductCategory,
  ProductStatus 
} from '../../shared/types/Product';

/**
 * Product Data Mapper
 * Handles conversion between domain objects and database documents
 * Isolates the domain from database-specific concerns
 */
export class ProductMapper {
  /**
   * Convert Firestore document to Product domain object
   */
  static toDomain(doc: DocumentData & { id: string }): Product {
    return {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      category: doc.category as ProductCategory,
      subcategory: doc.subcategory,
      brand: doc.brand,
      model: doc.model,
      sku: doc.sku,
      price: {
        dailyRate: doc.price?.dailyRate || 0,
        weeklyRate: doc.price?.weeklyRate,
        monthlyRate: doc.price?.monthlyRate,
        securityDeposit: doc.price?.securityDeposit || 0,
        currency: doc.price?.currency || 'USD',
        discounts: doc.price?.discounts || []
      },
      inventory: {
        quantity: doc.inventory?.quantity || 0,
        reserved: doc.inventory?.reserved || 0,
        available: doc.inventory?.available || 0,
        trackInventory: doc.inventory?.trackInventory ?? true,
        allowBackorder: doc.inventory?.allowBackorder ?? false,
        lowStockThreshold: doc.inventory?.lowStockThreshold
      },
      specifications: doc.specifications || {},
      images: doc.images || [],
      tags: doc.tags || [],
      status: doc.status as ProductStatus,
      seo: {
        metaTitle: doc.seo?.metaTitle,
        metaDescription: doc.seo?.metaDescription,
        slug: doc.seo?.slug || '',
        keywords: doc.seo?.keywords || []
      },
      createdAt: doc.createdAt as Timestamp,
      updatedAt: doc.updatedAt as Timestamp,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy
    };
  }

  /**
   * Convert Product domain object to Firestore document
   */
  static toFirestore(product: Omit<Product, 'id'>): DocumentData {
    return {
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory || null,
      brand: product.brand || null,
      model: product.model || null,
      sku: product.sku || null,
      price: {
        dailyRate: product.price.dailyRate,
        weeklyRate: product.price.weeklyRate || null,
        monthlyRate: product.price.monthlyRate || null,
        securityDeposit: product.price.securityDeposit,
        currency: product.price.currency,
        discounts: product.price.discounts || []
      },
      inventory: {
        quantity: product.inventory.quantity,
        reserved: product.inventory.reserved,
        available: product.inventory.available,
        trackInventory: product.inventory.trackInventory,
        allowBackorder: product.inventory.allowBackorder,
        lowStockThreshold: product.inventory.lowStockThreshold || null
      },
      specifications: product.specifications,
      images: product.images,
      tags: product.tags,
      status: product.status,
      seo: {
        metaTitle: product.seo.metaTitle || null,
        metaDescription: product.seo.metaDescription || null,
        slug: product.seo.slug,
        keywords: product.seo.keywords
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      createdBy: product.createdBy,
      updatedBy: product.updatedBy,
      // Add search fields for better querying
      searchTerms: this.generateSearchTerms(product),
      // Add computed fields
      priceRange: this.calculatePriceRange(product.price.dailyRate),
      hasDiscount: (product.price.discounts?.length || 0) > 0
    };
  }

  /**
   * Convert CreateProductInput to Firestore document for creation
   */
  static createInputToFirestore(
    input: CreateProductInput, 
    userId: string,
    slug: string,
    createdAt: Timestamp,
    updatedAt: Timestamp
  ): DocumentData {
    return {
      name: input.name,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory || null,
      brand: input.brand || null,
      model: input.model || null,
      sku: input.sku || null,
      price: {
        dailyRate: input.price.dailyRate,
        weeklyRate: input.price.weeklyRate || null,
        monthlyRate: input.price.monthlyRate || null,
        securityDeposit: input.price.securityDeposit,
        currency: input.price.currency,
        discounts: input.price.discounts || []
      },
      inventory: {
        quantity: input.inventory.quantity,
        reserved: input.inventory.reserved,
        available: input.inventory.quantity - input.inventory.reserved,
        trackInventory: input.inventory.trackInventory,
        allowBackorder: input.inventory.allowBackorder,
        lowStockThreshold: input.inventory.lowStockThreshold || null
      },
      specifications: input.specifications,
      images: input.images,
      tags: input.tags.map(tag => tag.toLowerCase().trim()),
      status: 'draft', // New products start as draft
      seo: {
        metaTitle: input.seo.metaTitle || null,
        metaDescription: input.seo.metaDescription || null,
        slug: slug,
        keywords: input.seo.keywords.map(keyword => keyword.toLowerCase().trim())
      },
      createdAt: createdAt,
      updatedAt: updatedAt,
      createdBy: userId,
      updatedBy: userId,
      // Add search fields
      searchTerms: this.generateSearchTermsFromInput(input),
      // Add computed fields
      priceRange: this.calculatePriceRange(input.price.dailyRate),
      hasDiscount: (input.price.discounts?.length || 0) > 0
    };
  }

  /**
   * Generate search terms for full-text search
   */
  private static generateSearchTerms(product: Omit<Product, 'id'>): string[] {
    const terms: string[] = [];
    
    // Add name words
    terms.push(...product.name.toLowerCase().split(/\s+/));
    
    // Add description words (first 100 words)
    const descWords = product.description.toLowerCase().split(/\s+/).slice(0, 100);
    terms.push(...descWords);
    
    // Add category and subcategory
    terms.push(product.category.toLowerCase());
    if (product.subcategory) {
      terms.push(product.subcategory.toLowerCase());
    }
    
    // Add brand and model
    if (product.brand) {
      terms.push(product.brand.toLowerCase());
    }
    if (product.model) {
      terms.push(product.model.toLowerCase());
    }
    
    // Add tags
    terms.push(...product.tags);
    
    // Add specification values
    Object.values(product.specifications).forEach(value => {
      terms.push(...value.toLowerCase().split(/\s+/));
    });
    
    // Remove duplicates and empty strings
    return [...new Set(terms.filter(term => term.length > 0))];
  }

  /**
   * Generate search terms from create input
   */
  private static generateSearchTermsFromInput(input: CreateProductInput): string[] {
    const terms: string[] = [];
    
    // Add name words
    terms.push(...input.name.toLowerCase().split(/\s+/));
    
    // Add description words (first 100 words)
    const descWords = input.description.toLowerCase().split(/\s+/).slice(0, 100);
    terms.push(...descWords);
    
    // Add category and subcategory
    terms.push(input.category.toLowerCase());
    if (input.subcategory) {
      terms.push(input.subcategory.toLowerCase());
    }
    
    // Add brand and model
    if (input.brand) {
      terms.push(input.brand.toLowerCase());
    }
    if (input.model) {
      terms.push(input.model.toLowerCase());
    }
    
    // Add tags
    terms.push(...input.tags.map(tag => tag.toLowerCase()));
    
    // Add specification values
    Object.values(input.specifications).forEach(value => {
      terms.push(...value.toLowerCase().split(/\s+/));
    });
    
    // Remove duplicates and empty strings
    return [...new Set(terms.filter(term => term.length > 0))];
  }

  /**
   * Calculate price range category for filtering
   */
  private static calculatePriceRange(dailyRate: number): string {
    if (dailyRate < 25) return 'budget';
    if (dailyRate < 75) return 'mid-range';
    if (dailyRate < 150) return 'premium';
    return 'luxury';
  }

  /**
   * Convert partial update data to Firestore update
   */
  static updateToFirestore(
    updates: Record<string, any>,
    userId: string,
    updatedAt: Timestamp
  ): DocumentData {
    const firestoreUpdate: DocumentData = {
      updatedAt,
      updatedBy: userId
    };

    // Map each field that might be updated
    if (updates.name !== undefined) {
      firestoreUpdate.name = updates.name;
    }
    
    if (updates.description !== undefined) {
      firestoreUpdate.description = updates.description;
    }
    
    if (updates.category !== undefined) {
      firestoreUpdate.category = updates.category;
    }
    
    if (updates.subcategory !== undefined) {
      firestoreUpdate.subcategory = updates.subcategory || null;
    }
    
    if (updates.brand !== undefined) {
      firestoreUpdate.brand = updates.brand || null;
    }
    
    if (updates.model !== undefined) {
      firestoreUpdate.model = updates.model || null;
    }
    
    if (updates.sku !== undefined) {
      firestoreUpdate.sku = updates.sku || null;
    }
    
    if (updates.price !== undefined) {
      firestoreUpdate.price = updates.price;
      firestoreUpdate.priceRange = this.calculatePriceRange(updates.price.dailyRate);
      firestoreUpdate.hasDiscount = (updates.price.discounts?.length || 0) > 0;
    }
    
    if (updates.inventory !== undefined) {
      firestoreUpdate.inventory = updates.inventory;
    }
    
    if (updates.specifications !== undefined) {
      firestoreUpdate.specifications = updates.specifications;
    }
    
    if (updates.images !== undefined) {
      firestoreUpdate.images = updates.images;
    }
    
    if (updates.tags !== undefined) {
      firestoreUpdate.tags = updates.tags.map((tag: string) => tag.toLowerCase().trim());
    }
    
    if (updates.status !== undefined) {
      firestoreUpdate.status = updates.status;
    }
    
    if (updates.seo !== undefined) {
      firestoreUpdate.seo = updates.seo;
    }

    // Regenerate search terms if content fields changed
    const contentFields = ['name', 'description', 'category', 'subcategory', 'brand', 'model', 'tags', 'specifications'];
    if (contentFields.some(field => updates[field] !== undefined)) {
      // This would need the full product data to regenerate properly
      // In a real implementation, you might fetch the current product first
      firestoreUpdate.searchTerms = this.generatePartialSearchTerms(updates);
    }

    return firestoreUpdate;
  }

  /**
   * Generate partial search terms from update data
   */
  private static generatePartialSearchTerms(updates: Record<string, any>): string[] {
    const terms: string[] = [];
    
    if (updates.name) {
      terms.push(...updates.name.toLowerCase().split(/\s+/));
    }
    
    if (updates.description) {
      const descWords = updates.description.toLowerCase().split(/\s+/).slice(0, 100);
      terms.push(...descWords);
    }
    
    if (updates.category) {
      terms.push(updates.category.toLowerCase());
    }
    
    if (updates.subcategory) {
      terms.push(updates.subcategory.toLowerCase());
    }
    
    if (updates.brand) {
      terms.push(updates.brand.toLowerCase());
    }
    
    if (updates.model) {
      terms.push(updates.model.toLowerCase());
    }
    
    if (updates.tags) {
      terms.push(...updates.tags.map((tag: string) => tag.toLowerCase()));
    }
    
    if (updates.specifications) {
      Object.values(updates.specifications).forEach((value: any) => {
        terms.push(...String(value).toLowerCase().split(/\s+/));
      });
    }
    
    return [...new Set(terms.filter(term => term.length > 0))];
  }
}

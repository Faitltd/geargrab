import type { Timestamp } from 'firebase/firestore';
import type { 
  Product as IProduct, 
  ProductCategory, 
  ProductStatus, 
  ProductPrice, 
  ProductInventory,
  ProductSEO,
  CreateProductInput,
  UpdateProductInput
} from '../../shared/types/Product';
import { 
  ProductValidationError, 
  ProductBusinessRuleError 
} from '../../shared/errors/ProductErrors';
import { ValidationUtils } from '../../shared/utils/ValidationUtils';

/**
 * Product Entity - Contains business logic and rules
 * This is the core domain entity that encapsulates product behavior
 */
export class Product implements IProduct {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly category: ProductCategory;
  public readonly subcategory?: string;
  public readonly brand?: string;
  public readonly model?: string;
  public readonly sku?: string;
  public readonly price: ProductPrice;
  public readonly inventory: ProductInventory;
  public readonly specifications: Record<string, string>;
  public readonly images: string[];
  public readonly tags: string[];
  public readonly status: ProductStatus;
  public readonly seo: ProductSEO;
  public readonly createdAt: Timestamp;
  public readonly updatedAt: Timestamp;
  public readonly createdBy: string;
  public readonly updatedBy: string;

  constructor(data: IProduct) {
    // Validate the product data
    this.validateProductData(data);
    
    // Assign properties
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.subcategory = data.subcategory;
    this.brand = data.brand;
    this.model = data.model;
    this.sku = data.sku;
    this.price = data.price;
    this.inventory = data.inventory;
    this.specifications = data.specifications;
    this.images = data.images;
    this.tags = data.tags;
    this.status = data.status;
    this.seo = data.seo;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
  }

  /**
   * Factory method to create a new Product from input data
   */
  static create(input: CreateProductInput, userId: string): Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'> {
    // Validate input
    const validation = ValidationUtils.validateCreateProductInput(input);
    if (!validation.isValid) {
      throw new ProductValidationError('Invalid product data', validation.errors);
    }

    // Generate slug from name
    const slug = this.generateSlug(input.name);

    // Create product data
    const productData: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'> = {
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category,
      subcategory: input.subcategory?.trim(),
      brand: input.brand?.trim(),
      model: input.model?.trim(),
      sku: input.sku?.trim(),
      price: input.price,
      inventory: {
        ...input.inventory,
        available: input.inventory.quantity - input.inventory.reserved
      },
      specifications: input.specifications,
      images: input.images,
      tags: input.tags.map(tag => tag.toLowerCase().trim()),
      status: ProductStatus.DRAFT, // New products start as draft
      seo: {
        ...input.seo,
        slug,
        keywords: input.seo.keywords.map(keyword => keyword.toLowerCase().trim())
      },
      createdBy: userId,
      updatedBy: userId
    };

    return productData;
  }

  /**
   * Update product with new data
   */
  update(input: UpdateProductInput, userId: string): Omit<IProduct, 'id' | 'createdAt'> {
    // Validate input
    const validation = ValidationUtils.validateUpdateProductInput(input);
    if (!validation.isValid) {
      throw new ProductValidationError('Invalid update data', validation.errors);
    }

    // Create updated product data
    const updatedData: Omit<IProduct, 'id' | 'createdAt'> = {
      name: input.name?.trim() ?? this.name,
      description: input.description?.trim() ?? this.description,
      category: input.category ?? this.category,
      subcategory: input.subcategory?.trim() ?? this.subcategory,
      brand: input.brand?.trim() ?? this.brand,
      model: input.model?.trim() ?? this.model,
      sku: input.sku?.trim() ?? this.sku,
      price: input.price ? { ...this.price, ...input.price } : this.price,
      inventory: input.inventory ? { 
        ...this.inventory, 
        ...input.inventory,
        available: (input.inventory.quantity ?? this.inventory.quantity) - 
                  (input.inventory.reserved ?? this.inventory.reserved)
      } : this.inventory,
      specifications: input.specifications ?? this.specifications,
      images: input.images ?? this.images,
      tags: input.tags?.map(tag => tag.toLowerCase().trim()) ?? this.tags,
      status: input.status ?? this.status,
      seo: input.seo ? {
        ...this.seo,
        ...input.seo,
        slug: input.seo.metaTitle ? Product.generateSlug(input.seo.metaTitle) : this.seo.slug,
        keywords: input.seo.keywords?.map(keyword => keyword.toLowerCase().trim()) ?? this.seo.keywords
      } : this.seo,
      createdBy: this.createdBy,
      updatedBy: userId,
      updatedAt: this.updatedAt // Will be set by repository
    };

    return updatedData;
  }

  /**
   * Check if product is available for booking
   */
  isAvailable(quantity: number = 1): boolean {
    return this.status === ProductStatus.ACTIVE && 
           this.inventory.available >= quantity &&
           (!this.inventory.trackInventory || this.inventory.quantity >= quantity);
  }

  /**
   * Check if product is in low stock
   */
  isLowStock(): boolean {
    if (!this.inventory.lowStockThreshold) return false;
    return this.inventory.available <= this.inventory.lowStockThreshold;
  }

  /**
   * Reserve inventory for booking
   */
  reserveInventory(quantity: number): void {
    if (!this.isAvailable(quantity)) {
      throw new ProductBusinessRuleError(
        'Insufficient inventory available',
        { 
          requested: quantity, 
          available: this.inventory.available,
          productId: this.id 
        }
      );
    }

    // This would typically be handled by the repository/service
    // but we define the business rule here
  }

  /**
   * Calculate effective price for given duration
   */
  calculatePrice(days: number): number {
    if (days <= 0) {
      throw new ProductBusinessRuleError('Days must be greater than 0');
    }

    // Use monthly rate if available and duration is 30+ days
    if (days >= 30 && this.price.monthlyRate) {
      const months = Math.ceil(days / 30);
      return months * this.price.monthlyRate;
    }

    // Use weekly rate if available and duration is 7+ days
    if (days >= 7 && this.price.weeklyRate) {
      const weeks = Math.ceil(days / 7);
      return weeks * this.price.weeklyRate;
    }

    // Use daily rate
    return days * this.price.dailyRate;
  }

  /**
   * Apply discounts based on duration
   */
  calculateDiscountedPrice(days: number): { originalPrice: number; discountedPrice: number; discount?: any } {
    const originalPrice = this.calculatePrice(days);
    
    if (!this.price.discounts || this.price.discounts.length === 0) {
      return { originalPrice, discountedPrice: originalPrice };
    }

    // Find applicable discounts
    const applicableDiscounts = this.price.discounts.filter(discount => {
      const meetsMinDays = !discount.minDays || days >= discount.minDays;
      const meetsMaxDays = !discount.maxDays || days <= discount.maxDays;
      return meetsMinDays && meetsMaxDays;
    });

    if (applicableDiscounts.length === 0) {
      return { originalPrice, discountedPrice: originalPrice };
    }

    // Apply the best discount (highest value)
    const bestDiscount = applicableDiscounts.reduce((best, current) => {
      const currentValue = current.type === 'percentage' 
        ? (originalPrice * current.value / 100)
        : current.value;
      const bestValue = best.type === 'percentage' 
        ? (originalPrice * best.value / 100)
        : best.value;
      
      return currentValue > bestValue ? current : best;
    });

    const discountAmount = bestDiscount.type === 'percentage'
      ? originalPrice * bestDiscount.value / 100
      : bestDiscount.value;

    const discountedPrice = Math.max(0, originalPrice - discountAmount);

    return { originalPrice, discountedPrice, discount: bestDiscount };
  }

  /**
   * Generate URL-friendly slug from text
   */
  private static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Validate product data integrity
   */
  private validateProductData(data: IProduct): void {
    // Business rule validations
    if (data.inventory.reserved > data.inventory.quantity) {
      throw new ProductBusinessRuleError(
        'Reserved inventory cannot exceed total quantity',
        { reserved: data.inventory.reserved, quantity: data.inventory.quantity }
      );
    }

    if (data.inventory.available > data.inventory.quantity) {
      throw new ProductBusinessRuleError(
        'Available inventory cannot exceed total quantity',
        { available: data.inventory.available, quantity: data.inventory.quantity }
      );
    }

    if (data.price.weeklyRate && data.price.weeklyRate > data.price.dailyRate * 7) {
      throw new ProductBusinessRuleError(
        'Weekly rate should not exceed 7 times the daily rate'
      );
    }

    if (data.price.monthlyRate && data.price.monthlyRate > data.price.dailyRate * 30) {
      throw new ProductBusinessRuleError(
        'Monthly rate should not exceed 30 times the daily rate'
      );
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): IProduct {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      subcategory: this.subcategory,
      brand: this.brand,
      model: this.model,
      sku: this.sku,
      price: this.price,
      inventory: this.inventory,
      specifications: this.specifications,
      images: this.images,
      tags: this.tags,
      status: this.status,
      seo: this.seo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }
}

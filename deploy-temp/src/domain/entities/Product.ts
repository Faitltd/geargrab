/**
 * Product Domain Entity
 * Core business entity representing a product in the catalog
 */

export interface ProductProps {
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
 * Product domain entity with business logic
 */
export class Product {
  private constructor(private props: ProductProps) {
    this.validate();
  }

  /**
   * Factory method to create a new Product
   */
  static create(props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const now = new Date();
    return new Product({
      ...props,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute Product from persistence
   */
  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  /**
   * Generate unique product ID
   */
  private static generateId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate product properties
   */
  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Product name is required');
    }
    if (this.props.price < 0) {
      throw new Error('Product price cannot be negative');
    }
    if (this.props.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }
    if (!this.props.sku || this.props.sku.trim().length === 0) {
      throw new Error('Product SKU is required');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get description(): string { return this.props.description; }
  get price(): number { return this.props.price; }
  get category(): string { return this.props.category; }
  get sku(): string { return this.props.sku; }
  get stock(): number { return this.props.stock; }
  get isActive(): boolean { return this.props.isActive; }
  get tags(): string[] { return [...this.props.tags]; }
  get images(): string[] { return [...this.props.images]; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * Update product information
   */
  update(updates: Partial<Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    this.props = {
      ...this.props,
      ...updates,
      updatedAt: new Date(),
    };
    this.validate();
  }

  /**
   * Check if product is in stock
   */
  isInStock(): boolean {
    return this.props.stock > 0 && this.props.isActive;
  }

  /**
   * Reduce stock quantity
   */
  reduceStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (this.props.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.props.stock -= quantity;
    this.props.updatedAt = new Date();
  }

  /**
   * Increase stock quantity
   */
  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.props.stock += quantity;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate product
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate product
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): ProductProps {
    return { ...this.props };
  }
}

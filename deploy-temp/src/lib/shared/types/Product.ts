import type { Timestamp } from 'firebase/firestore';

// Core Product interface
export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  brand?: string;
  model?: string;
  sku?: string;
  price: ProductPrice;
  inventory: ProductInventory;
  specifications: Record<string, string>;
  images: string[];
  tags: string[];
  status: ProductStatus;
  seo: ProductSEO;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// Product category enumeration
export enum ProductCategory {
  OUTDOOR_GEAR = 'outdoor_gear',
  SPORTS_EQUIPMENT = 'sports_equipment',
  ELECTRONICS = 'electronics',
  TOOLS = 'tools',
  VEHICLES = 'vehicles',
  PHOTOGRAPHY = 'photography',
  MUSIC = 'music',
  FITNESS = 'fitness',
  CAMPING = 'camping',
  WATER_SPORTS = 'water_sports',
  WINTER_SPORTS = 'winter_sports',
  OTHER = 'other'
}

// Product status enumeration
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

// Product pricing structure
export interface ProductPrice {
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  securityDeposit: number;
  currency: string;
  discounts?: ProductDiscount[];
}

// Product discount structure
export interface ProductDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  minDays?: number;
  maxDays?: number;
  description: string;
}

// Product inventory management
export interface ProductInventory {
  quantity: number;
  reserved: number;
  available: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number;
}

// Product SEO information
export interface ProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
  keywords: string[];
}

// Product creation input (without system fields)
export interface CreateProductInput {
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  brand?: string;
  model?: string;
  sku?: string;
  price: ProductPrice;
  inventory: ProductInventory;
  specifications: Record<string, string>;
  images: string[];
  tags: string[];
  seo: Omit<ProductSEO, 'slug'>;
}

// Product update input (partial fields)
export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: ProductCategory;
  subcategory?: string;
  brand?: string;
  model?: string;
  sku?: string;
  price?: Partial<ProductPrice>;
  inventory?: Partial<ProductInventory>;
  specifications?: Record<string, string>;
  images?: string[];
  tags?: string[];
  status?: ProductStatus;
  seo?: Partial<ProductSEO>;
}

// Product query filters
export interface ProductFilters {
  category?: ProductCategory;
  subcategory?: string;
  brand?: string;
  status?: ProductStatus;
  priceRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  search?: string;
  availability?: {
    startDate?: Date;
    endDate?: Date;
  };
}

// Product sort options
export interface ProductSortOptions {
  field: 'name' | 'price' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

// Paginated product results
export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Product availability check
export interface ProductAvailability {
  productId: string;
  available: boolean;
  availableQuantity: number;
  conflictingBookings?: string[];
  nextAvailableDate?: Date;
}

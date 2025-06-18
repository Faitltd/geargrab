import type { 
  Product, 
  ProductCategory, 
  ProductStatus,
  ProductPrice,
  ProductInventory,
  ProductSEO
} from '../../shared/types/Product';

/**
 * Data Transfer Objects for Product API
 * These DTOs define the shape of data sent to/from the API
 */

// Base product response DTO
export interface ProductResponseDTO {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  brand?: string;
  model?: string;
  sku?: string;
  price: ProductPriceDTO;
  inventory: ProductInventoryDTO;
  specifications: Record<string, string>;
  images: string[];
  tags: string[];
  status: ProductStatus;
  seo: ProductSEODTO;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  createdBy: string;
  updatedBy: string;
}

// Product price DTO
export interface ProductPriceDTO {
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  securityDeposit: number;
  currency: string;
  discounts?: ProductDiscountDTO[];
}

// Product discount DTO
export interface ProductDiscountDTO {
  type: 'percentage' | 'fixed';
  value: number;
  minDays?: number;
  maxDays?: number;
  description: string;
}

// Product inventory DTO
export interface ProductInventoryDTO {
  quantity: number;
  reserved: number;
  available: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number;
}

// Product SEO DTO
export interface ProductSEODTO {
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
  keywords: string[];
}

// Product creation request DTO
export interface CreateProductRequestDTO {
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  brand?: string;
  model?: string;
  sku?: string;
  price: ProductPriceDTO;
  inventory: Omit<ProductInventoryDTO, 'available'>; // Available is calculated
  specifications: Record<string, string>;
  images: string[];
  tags: string[];
  seo: Omit<ProductSEODTO, 'slug'>; // Slug is generated
}

// Product update request DTO
export interface UpdateProductRequestDTO {
  name?: string;
  description?: string;
  category?: ProductCategory;
  subcategory?: string;
  brand?: string;
  model?: string;
  sku?: string;
  price?: Partial<ProductPriceDTO>;
  inventory?: Partial<Omit<ProductInventoryDTO, 'available'>>;
  specifications?: Record<string, string>;
  images?: string[];
  tags?: string[];
  status?: ProductStatus;
  seo?: Partial<ProductSEODTO>;
}

// Product list response DTO
export interface ProductListResponseDTO {
  products: ProductResponseDTO[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Product search request DTO
export interface ProductSearchRequestDTO {
  query?: string;
  category?: ProductCategory;
  subcategory?: string;
  brand?: string;
  status?: ProductStatus;
  priceRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

// Product availability request DTO
export interface ProductAvailabilityRequestDTO {
  productId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  quantity?: number;
}

// Product availability response DTO
export interface ProductAvailabilityResponseDTO {
  productId: string;
  available: boolean;
  availableQuantity: number;
  conflictingBookings?: string[];
  nextAvailableDate?: string; // ISO string
}

// Product statistics response DTO
export interface ProductStatisticsResponseDTO {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  lowStock: number;
  outOfStock: number;
}

// Product inventory update request DTO
export interface ProductInventoryUpdateRequestDTO {
  quantityChange: number;
  reason?: string;
}

// Bulk product update request DTO
export interface BulkProductUpdateRequestDTO {
  updates: Array<{
    id: string;
    data: UpdateProductRequestDTO;
  }>;
}

// Product reservation request DTO
export interface ProductReservationRequestDTO {
  productId: string;
  quantity: number;
  reservationId: string;
}

/**
 * DTO Mappers - Convert between domain objects and DTOs
 */
export class ProductDTOMapper {
  /**
   * Convert Product domain object to response DTO
   */
  static toResponseDTO(product: Product): ProductResponseDTO {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      model: product.model,
      sku: product.sku,
      price: {
        dailyRate: product.price.dailyRate,
        weeklyRate: product.price.weeklyRate,
        monthlyRate: product.price.monthlyRate,
        securityDeposit: product.price.securityDeposit,
        currency: product.price.currency,
        discounts: product.price.discounts
      },
      inventory: {
        quantity: product.inventory.quantity,
        reserved: product.inventory.reserved,
        available: product.inventory.available,
        trackInventory: product.inventory.trackInventory,
        allowBackorder: product.inventory.allowBackorder,
        lowStockThreshold: product.inventory.lowStockThreshold
      },
      specifications: product.specifications,
      images: product.images,
      tags: product.tags,
      status: product.status,
      seo: {
        metaTitle: product.seo.metaTitle,
        metaDescription: product.seo.metaDescription,
        slug: product.seo.slug,
        keywords: product.seo.keywords
      },
      createdAt: product.createdAt.toDate().toISOString(),
      updatedAt: product.updatedAt.toDate().toISOString(),
      createdBy: product.createdBy,
      updatedBy: product.updatedBy
    };
  }

  /**
   * Convert array of Products to list response DTO
   */
  static toListResponseDTO(
    products: Product[],
    total: number,
    page: number,
    pageSize: number,
    hasNext: boolean,
    hasPrevious: boolean
  ): ProductListResponseDTO {
    return {
      products: products.map(product => this.toResponseDTO(product)),
      pagination: {
        total,
        page,
        pageSize,
        hasNext,
        hasPrevious
      }
    };
  }

  /**
   * Convert create request DTO to domain input
   */
  static fromCreateRequestDTO(dto: CreateProductRequestDTO): any {
    return {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      subcategory: dto.subcategory,
      brand: dto.brand,
      model: dto.model,
      sku: dto.sku,
      price: {
        dailyRate: dto.price.dailyRate,
        weeklyRate: dto.price.weeklyRate,
        monthlyRate: dto.price.monthlyRate,
        securityDeposit: dto.price.securityDeposit,
        currency: dto.price.currency,
        discounts: dto.price.discounts || []
      },
      inventory: {
        quantity: dto.inventory.quantity,
        reserved: dto.inventory.reserved,
        trackInventory: dto.inventory.trackInventory,
        allowBackorder: dto.inventory.allowBackorder,
        lowStockThreshold: dto.inventory.lowStockThreshold
      },
      specifications: dto.specifications,
      images: dto.images,
      tags: dto.tags,
      seo: {
        metaTitle: dto.seo.metaTitle,
        metaDescription: dto.seo.metaDescription,
        keywords: dto.seo.keywords
      }
    };
  }

  /**
   * Convert update request DTO to domain input
   */
  static fromUpdateRequestDTO(dto: UpdateProductRequestDTO): any {
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.subcategory !== undefined) updateData.subcategory = dto.subcategory;
    if (dto.brand !== undefined) updateData.brand = dto.brand;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.inventory !== undefined) updateData.inventory = dto.inventory;
    if (dto.specifications !== undefined) updateData.specifications = dto.specifications;
    if (dto.images !== undefined) updateData.images = dto.images;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.seo !== undefined) updateData.seo = dto.seo;

    return updateData;
  }
}

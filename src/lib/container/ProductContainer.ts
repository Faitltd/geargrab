import type {
  CreateProductRequestDTO,
  ProductSearchRequestDTO
} from '$lib/application/dto/ProductDTO';

interface ControllerResult<T> {
  status: number;
  data?: T;
  error?: unknown;
}

interface ProductSummary {
  id: string;
  name: string;
  status: string;
  price: number;
  currency: string;
  featured?: boolean;
  createdAt: string;
}

interface ProductController {
  listProducts(
    request: ProductSearchRequestDTO,
    userId?: string,
    userRole?: string
  ): Promise<ControllerResult<{ items: ProductSummary[]; pagination: { page: number; pageSize: number; total: number } }>>;
  createProduct(
    request: CreateProductRequestDTO,
    userId: string,
    userRole?: string
  ): Promise<ControllerResult<{ id: string }>>;
  getFeaturedProducts(limit: number): Promise<ControllerResult<ProductSummary[]>>;
  getRecentProducts(limit: number): Promise<ControllerResult<ProductSummary[]>>;
  getProductsByCategory(
    category: string,
    page: number,
    pageSize: number,
    userId?: string,
    userRole?: string
  ): Promise<ControllerResult<{ items: ProductSummary[]; pagination: { page: number; pageSize: number; total: number } }>>;
  getUserProducts(
    userId: string,
    page: number,
    pageSize: number,
    userRole?: string
  ): Promise<ControllerResult<{ items: ProductSummary[]; pagination: { page: number; pageSize: number; total: number } }>>;
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; details?: Record<string, unknown> }>;
}

function createMockProduct(id: number): ProductSummary {
  return {
    id: `mock-product-${id}`,
    name: `Sample Gear ${id}`,
    status: 'active',
    price: 10000 + id * 2500,
    currency: 'USD',
    featured: id % 2 === 0,
    createdAt: new Date(Date.now() - id * 86_400_000).toISOString()
  };
}

const mockController: ProductController = {
  async listProducts(request) {
    const page = request.page || 1;
    const pageSize = request.pageSize || 20;
    const items = Array.from({ length: Math.min(pageSize, 10) }, (_, index) =>
      createMockProduct(index + (page - 1) * pageSize)
    );

    return {
      status: 200,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total: 0
        }
      }
    };
  },

  async createProduct(request, userId) {
    console.info('Mock createProduct called', { request, userId });
    return {
      status: 201,
      data: {
        id: `mock-product-${Date.now()}`
      }
    };
  },

  async getFeaturedProducts(limit) {
    const items = Array.from({ length: Math.min(limit, 6) }, (_, index) =>
      createMockProduct(index)
    );
    return { status: 200, data: items };
  },

  async getRecentProducts(limit) {
    const items = Array.from({ length: Math.min(limit, 6) }, (_, index) =>
      createMockProduct(index)
    );
    return { status: 200, data: items };
  },

  async getProductsByCategory(category, page = 1, pageSize = 20) {
    console.info('Mock getProductsByCategory', { category, page, pageSize });
    const items = Array.from({ length: Math.min(pageSize, 5) }, (_, index) =>
      ({
        ...createMockProduct(index + (page - 1) * pageSize),
        name: `${category} Gear ${index + 1}`,
        featured: category === 'featured'
      })
    );

    return {
      status: 200,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total: items.length
        }
      }
    };
  },

  async getUserProducts(userId, page = 1, pageSize = 20) {
    console.info('Mock getUserProducts called', { userId, page, pageSize });
    const items = Array.from({ length: Math.min(pageSize, 5) }, (_, index) =>
      createMockProduct(index)
    );

    return {
      status: 200,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total: items.length
        }
      }
    };
  },

  async healthCheck() {
    return {
      status: 'healthy',
      details: {
        timestamp: new Date().toISOString()
      }
    };
  }
};

export function getProductController(): ProductController {
  return mockController;
}

export function getProductContainer() {
  return {
    ...mockController
  };
}

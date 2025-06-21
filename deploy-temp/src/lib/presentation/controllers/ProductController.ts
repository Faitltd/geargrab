import type { 
  CreateProductRequestDTO,
  UpdateProductRequestDTO,
  ProductSearchRequestDTO,
  ProductResponseDTO,
  ProductListResponseDTO,
  ProductAvailabilityRequestDTO,
  ProductAvailabilityResponseDTO,
  ProductStatisticsResponseDTO,
  ProductInventoryUpdateRequestDTO,
  BulkProductUpdateRequestDTO,
  ProductReservationRequestDTO,
  ProductDTOMapper
} from '../../application/dto/ProductDTO';
import type { CreateProductUseCase } from '../../application/usecases/CreateProduct';
import type { GetProductUseCase } from '../../application/usecases/GetProduct';
import type { ListProductsUseCase } from '../../application/usecases/ListProducts';
import type { UpdateProductUseCase } from '../../application/usecases/UpdateProduct';
import type { DeleteProductUseCase } from '../../application/usecases/DeleteProduct';
import { 
  isProductError,
  ProductValidationError,
  ProductNotFoundError,
  ProductUnauthorizedError,
  ProductForbiddenError
} from '../../shared/errors/ProductErrors';

/**
 * Product Controller
 * Handles HTTP requests and responses for product operations
 * Acts as the interface between the web layer and application layer
 */
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly dtoMapper: typeof ProductDTOMapper
  ) {}

  /**
   * Create a new product
   */
  async createProduct(
    requestData: CreateProductRequestDTO,
    userId: string,
    userRole?: string
  ): Promise<{ data: ProductResponseDTO; status: number }> {
    try {
      // Convert DTO to domain input
      const createInput = this.dtoMapper.fromCreateRequestDTO(requestData);

      // Execute use case
      const product = await this.createProductUseCase.execute(createInput, userId, userRole);

      // Convert to response DTO
      const responseDTO = this.dtoMapper.toResponseDTO(product);

      return {
        data: responseDTO,
        status: 201
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a product by ID
   */
  async getProductById(
    id: string,
    userId?: string,
    userRole?: string
  ): Promise<{ data: ProductResponseDTO; status: number }> {
    try {
      const product = await this.getProductUseCase.executeById(id, userId, userRole);
      const responseDTO = this.dtoMapper.toResponseDTO(product);

      return {
        data: responseDTO,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a product by slug
   */
  async getProductBySlug(
    slug: string,
    userId?: string,
    userRole?: string
  ): Promise<{ data: ProductResponseDTO; status: number }> {
    try {
      const product = await this.getProductUseCase.executeBySlug(slug, userId, userRole);
      const responseDTO = this.dtoMapper.toResponseDTO(product);

      return {
        data: responseDTO,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get product with enhanced data
   */
  async getProductWithDetails(
    id: string,
    userId?: string,
    userRole?: string
  ): Promise<{ 
    data: {
      product: ProductResponseDTO;
      isOwner: boolean;
      canEdit: boolean;
      canDelete: boolean;
      relatedProducts?: ProductResponseDTO[];
    };
    status: number;
  }> {
    try {
      const result = await this.getProductUseCase.executeWithEnhancedData(id, userId, userRole);
      
      const responseData = {
        product: this.dtoMapper.toResponseDTO(result.product),
        isOwner: result.isOwner,
        canEdit: result.canEdit,
        canDelete: result.canDelete,
        relatedProducts: result.relatedProducts?.map(p => this.dtoMapper.toResponseDTO(p))
      };

      return {
        data: responseData,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List products with filtering and pagination
   */
  async listProducts(
    searchRequest: ProductSearchRequestDTO,
    userId?: string,
    userRole?: string
  ): Promise<{ data: ProductListResponseDTO; status: number }> {
    try {
      // Extract parameters from request
      const {
        query,
        category,
        subcategory,
        brand,
        status,
        priceRange,
        tags,
        page = 1,
        pageSize = 20,
        sortBy = 'createdAt',
        sortDirection = 'desc'
      } = searchRequest;

      // Build filters
      const filters = {
        category,
        subcategory,
        brand,
        status,
        priceRange,
        tags
      };

      // Build sort options
      const sort = {
        field: sortBy,
        direction: sortDirection
      };

      // Execute use case
      let result;
      if (query && query.trim()) {
        result = await this.listProductsUseCase.executeSearch(
          query,
          filters,
          sort,
          page,
          pageSize,
          userId,
          userRole
        );
      } else {
        result = await this.listProductsUseCase.execute(
          filters,
          sort,
          page,
          pageSize,
          userId,
          userRole
        );
      }

      // Convert to response DTO
      const responseDTO = this.dtoMapper.toListResponseDTO(
        result.products,
        result.total,
        result.page,
        result.pageSize,
        result.hasNext,
        result.hasPrevious
      );

      return {
        data: responseDTO,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: string,
    page: number = 1,
    pageSize: number = 20,
    userId?: string,
    userRole?: string
  ): Promise<{ data: ProductListResponseDTO; status: number }> {
    try {
      const result = await this.listProductsUseCase.executeByCategory(
        category as any,
        page,
        pageSize,
        userId,
        userRole
      );

      const responseDTO = this.dtoMapper.toListResponseDTO(
        result.products,
        result.total,
        result.page,
        result.pageSize,
        result.hasNext,
        result.hasPrevious
      );

      return {
        data: responseDTO,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user's products
   */
  async getUserProducts(
    ownerId: string,
    page: number = 1,
    pageSize: number = 20,
    requestingUserId?: string,
    userRole?: string
  ): Promise<{ 
    data: {
      products: ProductListResponseDTO;
      statistics: ProductStatisticsResponseDTO;
    };
    status: number;
  }> {
    try {
      const result = await this.listProductsUseCase.executeByOwner(
        ownerId,
        page,
        pageSize,
        requestingUserId,
        userRole
      );

      const responseData = {
        products: this.dtoMapper.toListResponseDTO(
          result.products.products,
          result.products.total,
          result.products.page,
          result.products.pageSize,
          result.products.hasNext,
          result.products.hasPrevious
        ),
        statistics: result.statistics
      };

      return {
        data: responseData,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(
    limit: number = 12
  ): Promise<{ data: ProductResponseDTO[]; status: number }> {
    try {
      const products = await this.listProductsUseCase.executeFeatured(limit);
      const responseData = products.map(p => this.dtoMapper.toResponseDTO(p));

      return {
        data: responseData,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get recent products
   */
  async getRecentProducts(
    limit: number = 12
  ): Promise<{ data: ProductResponseDTO[]; status: number }> {
    try {
      const products = await this.listProductsUseCase.executeRecent(limit);
      const responseData = products.map(p => this.dtoMapper.toResponseDTO(p));

      return {
        data: responseData,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update a product
   */
  async updateProduct(
    id: string,
    requestData: UpdateProductRequestDTO,
    userId: string,
    userRole?: string
  ): Promise<{ data: ProductResponseDTO; status: number }> {
    try {
      // Convert DTO to domain input
      const updateInput = this.dtoMapper.fromUpdateRequestDTO(requestData);

      // Execute use case
      const product = await this.updateProductUseCase.execute(id, updateInput, userId, userRole);

      // Convert to response DTO
      const responseDTO = this.dtoMapper.toResponseDTO(product);

      return {
        data: responseDTO,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(
    id: string,
    userId: string,
    userRole?: string
  ): Promise<{ status: number; message?: string }> {
    try {
      await this.deleteProductUseCase.execute(id, userId, userRole);

      return {
        status: 204
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors and convert to appropriate HTTP responses
   */
  private handleError(error: unknown): any {
    if (isProductError(error)) {
      return {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        },
        status: error.statusCode
      };
    }

    // Handle generic errors
    console.error('Unexpected error in ProductController:', error);
    
    return {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: {}
      },
      status: 500
    };
  }

  /**
   * Validate request parameters
   */
  private validateRequestParams(params: Record<string, any>): void {
    // Add common request validation logic here
    if (params.page !== undefined) {
      const page = parseInt(params.page);
      if (isNaN(page) || page < 1) {
        throw new ProductValidationError('Invalid page parameter', {
          page: ['Page must be a positive integer']
        });
      }
    }

    if (params.pageSize !== undefined) {
      const pageSize = parseInt(params.pageSize);
      if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        throw new ProductValidationError('Invalid pageSize parameter', {
          pageSize: ['Page size must be between 1 and 100']
        });
      }
    }
  }
}

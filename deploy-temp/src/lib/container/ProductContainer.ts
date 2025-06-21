import { FirestoreProductRepository } from '../infrastructure/repositories/FirestoreProductRepository';
import { ProductService } from '../domain/services/ProductService';
import { CreateProductUseCase } from '../application/usecases/CreateProduct';
import { GetProductUseCase } from '../application/usecases/GetProduct';
import { ListProductsUseCase } from '../application/usecases/ListProducts';
import { UpdateProductUseCase } from '../application/usecases/UpdateProduct';
import { DeleteProductUseCase } from '../application/usecases/DeleteProduct';
import { ProductController } from '../presentation/controllers/ProductController';
import { ProductDTOMapper } from '../application/dto/ProductDTO';

/**
 * Product Dependency Injection Container
 * Manages the creation and wiring of all product-related dependencies
 * Implements the Dependency Injection pattern for clean architecture
 */
export class ProductContainer {
  private static instance: ProductContainer;
  
  // Repository layer
  private _productRepository?: FirestoreProductRepository;
  
  // Domain layer
  private _productService?: ProductService;
  
  // Application layer (Use Cases)
  private _createProductUseCase?: CreateProductUseCase;
  private _getProductUseCase?: GetProductUseCase;
  private _listProductsUseCase?: ListProductsUseCase;
  private _updateProductUseCase?: UpdateProductUseCase;
  private _deleteProductUseCase?: DeleteProductUseCase;
  
  // Presentation layer
  private _productController?: ProductController;

  /**
   * Singleton pattern - get container instance
   */
  public static getInstance(): ProductContainer {
    if (!ProductContainer.instance) {
      ProductContainer.instance = new ProductContainer();
    }
    return ProductContainer.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get Product Repository instance
   */
  public getProductRepository(): FirestoreProductRepository {
    if (!this._productRepository) {
      this._productRepository = new FirestoreProductRepository();
    }
    return this._productRepository;
  }

  /**
   * Get Product Service instance
   */
  public getProductService(): ProductService {
    if (!this._productService) {
      const productRepository = this.getProductRepository();
      this._productService = new ProductService(productRepository);
    }
    return this._productService;
  }

  /**
   * Get Create Product Use Case instance
   */
  public getCreateProductUseCase(): CreateProductUseCase {
    if (!this._createProductUseCase) {
      const productService = this.getProductService();
      this._createProductUseCase = new CreateProductUseCase(productService);
    }
    return this._createProductUseCase;
  }

  /**
   * Get Get Product Use Case instance
   */
  public getGetProductUseCase(): GetProductUseCase {
    if (!this._getProductUseCase) {
      const productService = this.getProductService();
      this._getProductUseCase = new GetProductUseCase(productService);
    }
    return this._getProductUseCase;
  }

  /**
   * Get List Products Use Case instance
   */
  public getListProductsUseCase(): ListProductsUseCase {
    if (!this._listProductsUseCase) {
      const productService = this.getProductService();
      this._listProductsUseCase = new ListProductsUseCase(productService);
    }
    return this._listProductsUseCase;
  }

  /**
   * Get Update Product Use Case instance
   */
  public getUpdateProductUseCase(): UpdateProductUseCase {
    if (!this._updateProductUseCase) {
      const productService = this.getProductService();
      this._updateProductUseCase = new UpdateProductUseCase(productService);
    }
    return this._updateProductUseCase;
  }

  /**
   * Get Delete Product Use Case instance
   */
  public getDeleteProductUseCase(): DeleteProductUseCase {
    if (!this._deleteProductUseCase) {
      const productService = this.getProductService();
      this._deleteProductUseCase = new DeleteProductUseCase(productService);
    }
    return this._deleteProductUseCase;
  }

  /**
   * Get Product Controller instance
   */
  public getProductController(): ProductController {
    if (!this._productController) {
      const createProductUseCase = this.getCreateProductUseCase();
      const getProductUseCase = this.getGetProductUseCase();
      const listProductsUseCase = this.getListProductsUseCase();
      const updateProductUseCase = this.getUpdateProductUseCase();
      const deleteProductUseCase = this.getDeleteProductUseCase();

      this._productController = new ProductController(
        createProductUseCase,
        getProductUseCase,
        listProductsUseCase,
        updateProductUseCase,
        deleteProductUseCase,
        ProductDTOMapper
      );
    }
    return this._productController;
  }

  /**
   * Reset all instances (useful for testing)
   */
  public reset(): void {
    this._productRepository = undefined;
    this._productService = undefined;
    this._createProductUseCase = undefined;
    this._getProductUseCase = undefined;
    this._listProductsUseCase = undefined;
    this._updateProductUseCase = undefined;
    this._deleteProductUseCase = undefined;
    this._productController = undefined;
  }

  /**
   * Configure container with custom implementations (for testing)
   */
  public configure(config: {
    productRepository?: FirestoreProductRepository;
    productService?: ProductService;
  }): void {
    if (config.productRepository) {
      this._productRepository = config.productRepository;
    }
    if (config.productService) {
      this._productService = config.productService;
    }
  }

  /**
   * Health check - verify all dependencies can be created
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    components: Record<string, 'ok' | 'error'>;
    errors?: string[];
  }> {
    const components: Record<string, 'ok' | 'error'> = {};
    const errors: string[] = [];

    try {
      // Test repository
      const repository = this.getProductRepository();
      components.repository = 'ok';
    } catch (error) {
      components.repository = 'error';
      errors.push(`Repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test service
      const service = this.getProductService();
      components.service = 'ok';
    } catch (error) {
      components.service = 'error';
      errors.push(`Service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test use cases
      this.getCreateProductUseCase();
      this.getGetProductUseCase();
      this.getListProductsUseCase();
      this.getUpdateProductUseCase();
      this.getDeleteProductUseCase();
      components.useCases = 'ok';
    } catch (error) {
      components.useCases = 'error';
      errors.push(`Use Cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test controller
      const controller = this.getProductController();
      components.controller = 'ok';
    } catch (error) {
      components.controller = 'error';
      errors.push(`Controller: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const status = errors.length === 0 ? 'healthy' : 'unhealthy';

    return {
      status,
      components,
      ...(errors.length > 0 && { errors })
    };
  }

  /**
   * Get container information for debugging
   */
  public getInfo(): {
    initialized: {
      repository: boolean;
      service: boolean;
      useCases: {
        create: boolean;
        get: boolean;
        list: boolean;
        update: boolean;
        delete: boolean;
      };
      controller: boolean;
    };
  } {
    return {
      initialized: {
        repository: !!this._productRepository,
        service: !!this._productService,
        useCases: {
          create: !!this._createProductUseCase,
          get: !!this._getProductUseCase,
          list: !!this._listProductsUseCase,
          update: !!this._updateProductUseCase,
          delete: !!this._deleteProductUseCase
        },
        controller: !!this._productController
      }
    };
  }
}

/**
 * Convenience function to get the container instance
 */
export function getProductContainer(): ProductContainer {
  return ProductContainer.getInstance();
}

/**
 * Convenience function to get the product controller
 */
export function getProductController(): ProductController {
  return getProductContainer().getProductController();
}

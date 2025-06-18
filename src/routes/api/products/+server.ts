import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductController } from '$lib/container/ProductContainer';
import type { 
  CreateProductRequestDTO, 
  ProductSearchRequestDTO 
} from '$lib/application/dto/ProductDTO';

/**
 * Products API Endpoints
 * Handles CRUD operations for products
 */

// Get products with filtering and search
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const controller = getProductController();
    
    // Extract query parameters
    const query = url.searchParams.get('query') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const subcategory = url.searchParams.get('subcategory') || undefined;
    const brand = url.searchParams.get('brand') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const tags = url.searchParams.get('tags')?.split(',') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortDirection = url.searchParams.get('sortDirection') || 'desc';

    // Build search request
    const searchRequest: ProductSearchRequestDTO = {
      query,
      category: category as any,
      subcategory,
      brand,
      status: status as any,
      priceRange: (minPrice || maxPrice) ? {
        min: minPrice ? parseFloat(minPrice) : undefined,
        max: maxPrice ? parseFloat(maxPrice) : undefined
      } : undefined,
      tags,
      page,
      pageSize,
      sortBy: sortBy as any,
      sortDirection: sortDirection as any
    };

    // Execute request
    const result = await controller.listProducts(
      searchRequest,
      locals.userId,
      locals.userRole
    );

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Create a new product
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const controller = getProductController();
    
    // Parse request body
    const requestData: CreateProductRequestDTO = await request.json();

    // Execute request
    const result = await controller.createProduct(
      requestData,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return json(
      { 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Get featured products
export const GET_FEATURED: RequestHandler = async ({ url }) => {
  try {
    const controller = getProductController();
    const limit = parseInt(url.searchParams.get('limit') || '12');

    const result = await controller.getFeaturedProducts(limit);

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error('Error in GET /api/products/featured:', error);
    return json(
      { 
        error: 'Failed to fetch featured products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Get recent products
export const GET_RECENT: RequestHandler = async ({ url }) => {
  try {
    const controller = getProductController();
    const limit = parseInt(url.searchParams.get('limit') || '12');

    const result = await controller.getRecentProducts(limit);

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error('Error in GET /api/products/recent:', error);
    return json(
      { 
        error: 'Failed to fetch recent products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Get products by category
export const GET_BY_CATEGORY: RequestHandler = async ({ url, params }) => {
  try {
    const controller = getProductController();
    const category = params.category;
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    if (!category) {
      return json({ error: 'Category parameter is required' }, { status: 400 });
    }

    const result = await controller.getProductsByCategory(
      category,
      page,
      pageSize,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error('Error in GET /api/products/category:', error);
    return json(
      { 
        error: 'Failed to fetch products by category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Get user's products
export const GET_USER_PRODUCTS: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const controller = getProductController();
    const ownerId = url.searchParams.get('ownerId') || locals.userId;
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    const result = await controller.getUserProducts(
      ownerId,
      page,
      pageSize,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error('Error in GET /api/products/user:', error);
    return json(
      { 
        error: 'Failed to fetch user products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Health check endpoint
export const GET_HEALTH: RequestHandler = async () => {
  try {
    const { getProductContainer } = await import('$lib/container/ProductContainer');
    const container = getProductContainer();
    const health = await container.healthCheck();

    return json(health, { 
      status: health.status === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    console.error('Error in health check:', error);
    return json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
};

// Helper function to validate pagination parameters
function validatePaginationParams(page: number, pageSize: number): string | null {
  if (!Number.isInteger(page) || page < 1) {
    return 'Page must be a positive integer';
  }
  
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return 'Page size must be an integer between 1 and 100';
  }
  
  return null;
}

// Helper function to validate sort parameters
function validateSortParams(sortBy: string, sortDirection: string): string | null {
  const validSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
  const validSortDirections = ['asc', 'desc'];
  
  if (!validSortFields.includes(sortBy)) {
    return `Sort field must be one of: ${validSortFields.join(', ')}`;
  }
  
  if (!validSortDirections.includes(sortDirection)) {
    return `Sort direction must be one of: ${validSortDirections.join(', ')}`;
  }
  
  return null;
}

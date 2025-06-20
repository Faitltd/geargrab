import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductController } from '$lib/container/ProductContainer';
import type { UpdateProductRequestDTO } from '$lib/application/dto/ProductDTO';

/**
 * Individual Product API Endpoints
 * Handles operations on specific products by ID
 */

// Get a specific product by ID
export const GET: RequestHandler = async ({ params, locals, url }) => {
  try {
    const controller = getProductController();
    const productId = params.productId;
    
    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if enhanced data is requested
    const includeDetails = url.searchParams.get('includeDetails') === 'true';

    let result;
    if (includeDetails) {
      result = await controller.getProductWithDetails(
        productId,
        locals.userId,
        locals.userRole
      );
    } else {
      result = await controller.getProductById(
        productId,
        locals.userId,
        locals.userRole
      );
    }

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error in GET /api/products/${params.productId}:`, error);
    return json(
      { 
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Update a specific product
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const controller = getProductController();
    const productId = params.productId;
    
    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Parse request body
    const requestData: UpdateProductRequestDTO = await request.json();

    // Execute request
    const result = await controller.updateProduct(
      productId,
      requestData,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error in PUT /api/products/${params.productId}:`, error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return json(
      { 
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Partially update a specific product
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const controller = getProductController();
    const productId = params.productId;
    
    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Parse request body
    const requestData: UpdateProductRequestDTO = await request.json();

    // Execute request (same as PUT for now, but could have different validation)
    const result = await controller.updateProduct(
      productId,
      requestData,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error in PATCH /api/products/${params.productId}:`, error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return json(
      { 
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Delete a specific product
export const DELETE: RequestHandler = async ({ params, locals, url }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const controller = getProductController();
    const productId = params.productId;
    
    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if hard delete is requested (admin only)
    const hardDelete = url.searchParams.get('hard') === 'true';
    const confirmationToken = url.searchParams.get('confirmationToken');

    if (hardDelete) {
      // Hard delete requires admin role and confirmation token
      if (locals.userRole !== 'admin') {
        return json(
          { error: 'Hard delete requires admin privileges' },
          { status: 403 }
        );
      }

      if (!confirmationToken) {
        return json(
          { error: 'Confirmation token required for hard delete' },
          { status: 400 }
        );
      }

      // Note: Hard delete would need to be implemented in the use case
      return json(
        { error: 'Hard delete not implemented in this version' },
        { status: 501 }
      );
    }

    // Execute soft delete
    const result = await controller.deleteProduct(
      productId,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    // Return 204 No Content for successful deletion
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Error in DELETE /api/products/${params.productId}:`, error);
    return json(
      { 
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Get product by slug (SEO-friendly URLs)
export const GET_BY_SLUG: RequestHandler = async ({ params, locals }) => {
  try {
    const controller = getProductController();
    const slug = params.productId; // In this case, productId is actually the slug
    
    if (!slug) {
      return json({ error: 'Product slug is required' }, { status: 400 });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return json({ error: 'Invalid slug format' }, { status: 400 });
    }

    const result = await controller.getProductBySlug(
      slug,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error in GET /api/products/slug/${params.productId}:`, error);
    return json(
      { 
        error: 'Failed to fetch product by slug',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Update product status
export const POST_STATUS: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const controller = getProductController();
    const productId = params.productId;
    
    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Parse request body
    const { status } = await request.json();

    if (!status) {
      return json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'];
    if (!validStatuses.includes(status)) {
      return json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update product status
    const requestData: UpdateProductRequestDTO = { status };
    const result = await controller.updateProduct(
      productId,
      requestData,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error in POST /api/products/${params.productId}/status:`, error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return json(
      { 
        error: 'Failed to update product status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Update product inventory
export const POST_INVENTORY: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const controller = getProductController();
    const productId = params.productId;
    
    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Parse request body
    const inventoryUpdate = await request.json();

    // Update product inventory
    const requestData: UpdateProductRequestDTO = { inventory: inventoryUpdate };
    const result = await controller.updateProduct(
      productId,
      requestData,
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error in POST /api/products/${params.productId}/inventory:`, error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return json(
      { 
        error: 'Failed to update product inventory',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

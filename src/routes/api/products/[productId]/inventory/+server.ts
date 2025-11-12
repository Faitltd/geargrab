import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductController } from '$lib/container/ProductContainer';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const productId = params.productId;
    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    const inventoryUpdate = await request.json();
    const controller = getProductController();

    const result = await controller.updateProduct(
      productId,
      { inventory: inventoryUpdate },
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error updating inventory for product ${params.productId}:`, error);
    if (error instanceof SyntaxError) {
      return json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return json(
      { error: 'Failed to update product inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

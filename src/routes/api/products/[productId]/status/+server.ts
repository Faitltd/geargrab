import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductController } from '$lib/container/ProductContainer';

const VALID_STATUSES = ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'];

export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const productId = params.productId;
    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { status } = await request.json();
    if (!status || !VALID_STATUSES.includes(status)) {
      return json(
        { error: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const controller = getProductController();
    const result = await controller.updateProduct(
      productId,
      { status },
      locals.userId,
      locals.userRole
    );

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error updating status for product ${params.productId}:`, error);
    if (error instanceof SyntaxError) {
      return json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return json(
      { error: 'Failed to update product status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

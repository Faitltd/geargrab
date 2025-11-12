import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductController } from '$lib/container/ProductContainer';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const controller = getProductController();
    const ownerId = url.searchParams.get('ownerId') || locals.userId;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

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

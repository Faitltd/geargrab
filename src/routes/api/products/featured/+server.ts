import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductController } from '$lib/container/ProductContainer';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const controller = getProductController();
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);

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

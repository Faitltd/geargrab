import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductController } from '$lib/container/ProductContainer';

export const GET: RequestHandler = async ({ url, params, locals }) => {
  try {
    const category = params.category;
    if (!category) {
      return json({ error: 'Category parameter is required' }, { status: 400 });
    }

    const controller = getProductController();
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

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
    console.error('Error in GET /api/products/category/[category]:', error);
    return json(
      {
        error: 'Failed to fetch products by category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductController } from '$lib/container/ProductContainer';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const slug = params.slug;
    if (!slug) {
      return json({ error: 'Product slug is required' }, { status: 400 });
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return json({ error: 'Invalid slug format' }, { status: 400 });
    }

    const controller = getProductController();
    const result = await controller.getProductBySlug(slug, locals.userId, locals.userRole);

    if (result.error) {
      return json(result.error, { status: result.status });
    }

    return json(result.data, { status: result.status });
  } catch (error) {
    console.error(`Error in GET /api/products/slug/${params.slug}:`, error);
    return json(
      {
        error: 'Failed to fetch product by slug',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

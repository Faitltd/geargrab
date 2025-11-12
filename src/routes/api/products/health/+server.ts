import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductContainer } from '$lib/container/ProductContainer';

export const GET: RequestHandler = async () => {
  try {
    const container = getProductContainer();
    const health = await container.healthCheck();

    return json(health, {
      status: health.status === 'healthy' ? 200 : 503
    });
  } catch (error) {
    console.error('Error in GET /api/products/health:', error);
    return json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
};

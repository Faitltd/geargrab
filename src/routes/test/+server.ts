import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    return json({
      status: 'ok',
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      port: process.env.PORT || 'unknown'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return json({
      status: 'error',
      message: 'Test endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

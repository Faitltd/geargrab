import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Check if Stripe environment variables are configured
    const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    const isConfigured = !!(stripePublishableKey && stripeSecretKey);
    const isLiveMode = stripePublishableKey?.startsWith('pk_live_') && stripeSecretKey?.startsWith('sk_live_');
    
    return json({
      status: 'healthy',
      stripe: {
        configured: isConfigured,
        mode: isLiveMode ? 'live' : 'test',
        publishableKeyPrefix: stripePublishableKey?.substring(0, 12) + '...',
        secretKeyPrefix: stripeSecretKey?.substring(0, 12) + '...'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stripe health check error:', error);
    return json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

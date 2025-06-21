import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Check if Stripe is configured
    const isConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLISHABLE_KEY);
    
    if (!isConfigured) {
      return json({
        success: false,
        message: 'Stripe not configured',
        status: 'down',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Test Stripe API connection
    let serviceStatus = 'healthy';
    let serviceMessage = 'Stripe service is operational';

    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
      });

      // Test API connection by retrieving account info
      const account = await stripe.accounts.retrieve();
      
      if (!account) {
        serviceStatus = 'degraded';
        serviceMessage = 'Stripe account not accessible';
      }

    } catch (error) {
      console.error('Stripe health check error:', error);
      serviceStatus = 'down';
      serviceMessage = `Stripe API error: ${error.message}`;
    }

    return json({
      success: serviceStatus !== 'down',
      message: serviceMessage,
      status: serviceStatus,
      service: 'stripe',
      timestamp: new Date().toISOString(),
      configuration: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublishableKey: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
        webhookEndpoint: '/api/webhooks/stripe'
      }
    });

  } catch (error) {
    console.error('Payment health check failed:', error);
    return json({
      success: false,
      message: 'Payment health check failed',
      status: 'down',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

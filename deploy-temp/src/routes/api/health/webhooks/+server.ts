import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Check webhook endpoints availability
    const webhookEndpoints = [
      '/api/webhooks/stripe',
      '/api/webhooks/test'
    ];

    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
    
    return json({
      success: true,
      message: 'Webhook endpoints accessible',
      endpoints: webhookEndpoints,
      configuration: {
        hasStripeKey,
        hasWebhookSecret,
        stripeConfigured: hasStripeKey && hasWebhookSecret
      },
      supportedEvents: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'payment_intent.canceled',
        'payment_intent.requires_action',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook health check failed:', error);
    
    return json({
      success: false,
      error: 'Webhook health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';

// Test endpoint for payment intent creation
export const POST: RequestHandler = createSecureHandler(
  async (event, { body }) => {
    const { amount, currency, bookingId } = body;
    
    // Simulate payment intent creation
    return json({
      success: true,
      message: 'Payment intent creation test passed',
      paymentIntent: {
        id: `pi_test_${Date.now()}`,
        amount,
        currency,
        status: 'requires_payment_method',
        client_secret: `pi_test_${Date.now()}_secret_test`,
        metadata: {
          bookingId,
          service: 'booking'
        }
      }
    });
  },
  {
    rateLimit: 'payment',
    validateCSRF: false, // Skip CSRF for testing
    inputSchema: {
      amount: { required: true, type: 'number' as const, min: 50 }, // Minimum $0.50
      currency: { required: true, type: 'string' as const, allowedValues: ['usd'] },
      bookingId: { required: true, type: 'string' as const }
    }
  }
);

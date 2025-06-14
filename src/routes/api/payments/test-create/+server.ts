import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// COMPLETELY BYPASS ALL AUTHENTICATION - TEST ENDPOINT
export const POST: RequestHandler = async ({ request }) => {
  console.log('🧪 TEST PAYMENT ENDPOINT - NO AUTH WHATSOEVER');
  
  try {
    const body = await request.json();
    const { amount, currency = 'usd', metadata = {} } = body;
    
    console.log('📝 Test payment request:', { amount, currency, metadata });
    
    // Always return a working mock payment intent
    const mockPaymentIntent = {
      clientSecret: `pi_test_${Date.now()}_secret_test`,
      paymentIntentId: `pi_test_${Date.now()}`,
      mock: true,
      amount: amount || 6000,
      currency,
      status: 'requires_payment_method'
    };
    
    console.log('✅ Returning mock payment intent:', mockPaymentIntent);
    
    return json(mockPaymentIntent);
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    
    // Even on error, return a working payment intent
    return json({
      clientSecret: `pi_error_${Date.now()}_secret_error`,
      paymentIntentId: `pi_error_${Date.now()}`,
      mock: true,
      amount: 6000,
      currency: 'usd',
      status: 'requires_payment_method'
    });
  }
};

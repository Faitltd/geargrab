import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';
import { 
  requireAuth, 
  rateLimit, 
  validateString, 
  validateNumber 
} from '$lib/server/security';
import { 
  asyncHandler, 
  mapStripeError,
  ValidationError,
  NotFoundError
} from '$lib/server/errors';

// Initialize Stripe (only if secret key is available)
let stripe: any = null;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (stripeSecretKey) {
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

export const POST: RequestHandler = asyncHandler(async ({ request, locals, ...event }) => {
  // Apply rate limiting for payment operations
  const rateLimitResponse = rateLimit('payment')(event);
  if (rateLimitResponse) return rateLimitResponse;
  
  // Check authentication
  const authResponse = requireAuth({ locals } as any);
  if (authResponse) return authResponse;
  
  if (!stripe) {
    throw new ValidationError('Payment processing is not configured');
  }
  
  try {
    const requestData = await request.json();
    
    // Validate input
    const validationErrors: Record<string, string> = {};
    
    const listingIdValidation = validateString(requestData.listingId, { required: true });
    if (!listingIdValidation.isValid) {
      validationErrors.listingId = listingIdValidation.error!;
    }
    
    const amountValidation = validateNumber(requestData.amount, { 
      required: true, 
      min: 50, // Minimum $0.50
      max: 100000 // Maximum $1000.00
    });
    if (!amountValidation.isValid) {
      validationErrors.amount = amountValidation.error!;
    }
    
    if (Object.keys(validationErrors).length > 0) {
      throw new ValidationError('Validation failed', { fields: validationErrors });
    }
    
    // Verify the listing exists and get details
    const listingRef = adminFirestore.collection('listings').doc(listingIdValidation.value!);
    const listingDoc = await listingRef.get();
    
    if (!listingDoc.exists) {
      throw new NotFoundError('Listing not found');
    }
    
    const listing = listingDoc.data();
    
    if (listing?.status !== 'active') {
      throw new ValidationError('Listing is not available for booking');
    }
    
    // Prevent self-payment
    if (listing?.ownerUid === locals.userId) {
      throw new ValidationError('Cannot book your own listing');
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountValidation.value,
      currency: 'usd',
      metadata: {
        listingId: listingIdValidation.value!,
        userId: locals.userId!,
        listingTitle: listing.title || 'Gear Rental'
      },
      automatic_payment_methods: {
        enabled: true
      },
      capture_method: 'manual' // Capture payment after booking confirmation
    });
    
    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
    
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      throw mapStripeError(error);
    }
    throw error;
  }
});

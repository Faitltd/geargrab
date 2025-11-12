import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';
import { backgroundCheckProviders } from '$lib/services/backgroundCheckProviders';
import { sendBackgroundCheckEmails } from '$lib/services/email';

// Stripe integration for payments
let stripe: any = null;

async function getStripe() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || !secretKey.startsWith('sk_')) {
      throw new Error('Invalid or missing Stripe secret key');
    }

    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

// Submit a new background check request
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { checkType, provider, consentData, paymentMethodId } = await request.json();

    // Validate required fields
    if (!checkType || !provider || !consentData || !paymentMethodId) {
      return json({
        error: 'Missing required fields: checkType, provider, consentData, paymentMethodId'
      }, { status: 400 });
    }

    // Validate check type
    if (!['basic', 'standard', 'comprehensive'].includes(checkType)) {
      return json({ error: 'Invalid check type' }, { status: 400 });
    }

    // Validate provider
    const providerService = backgroundCheckProviders.getProvider(provider);
    if (!providerService) {
      return json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Check if user already has a pending background check
    const existingCheck = await adminFirestore
      .collection('verificationRequests')
      .where('userId', '==', locals.userId)
      .where('type', '==', 'background_check')
      .where('status', 'in', ['pending', 'in_progress'])
      .limit(1)
      .get();

    if (!existingCheck.empty) {
      return json({
        error: 'You already have a pending background check request'
      }, { status: 409 });
    }

    // Calculate pricing
    const pricing = {
      basic: 29.99,
      standard: 49.99,
      comprehensive: 79.99
    };

    const amount = pricing[checkType as keyof typeof pricing];
    if (!amount) {
      return json({ error: 'Invalid check type for pricing' }, { status: 400 });
    }

    // Process payment with Stripe
    const stripeClient = await getStripe();

    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${process.env.PUBLIC_BASE_URL}/dashboard/verification`,
        metadata: {
          userId: locals.userId,
          checkType,
          provider,
          service: 'background_check'
        }
      });

      if (paymentIntent.status !== 'succeeded') {
        return json({
          error: 'Payment failed. Please try again.'
        }, { status: 400 });
      }

    } catch (paymentError) {
      console.error('Payment error:', paymentError);
      return json({
        error: 'Payment processing failed. Please check your payment method.'
      }, { status: 400 });
    }

    // Create verification request
    const verificationRequest = {
      userId: locals.userId,
      type: 'background_check',
      status: 'pending',
      submittedAt: new Date(),
      backgroundCheckData: {
        checkType,
        provider,
        consentGiven: true,
        consentTimestamp: new Date(),
        consentData,
        payment: {
          amount,
          currency: 'usd',
          paymentIntentId: paymentIntent.id,
          status: 'paid',
          paidAt: new Date()
        },
        results: {
          criminalHistory: { status: 'pending' },
          sexOffenderRegistry: { status: 'pending' },
          globalWatchlist: { status: 'pending' },
          identityVerification: { status: 'pending' }
        }
      }
    };

    // Add additional checks for standard and comprehensive
    if (checkType === 'standard' || checkType === 'comprehensive') {
      verificationRequest.backgroundCheckData.results = {
        ...verificationRequest.backgroundCheckData.results,
        addressHistory: { status: 'pending' },
        ssnTrace: { status: 'pending' }
      };
    }

    if (checkType === 'comprehensive') {
      verificationRequest.backgroundCheckData.results = {
        ...verificationRequest.backgroundCheckData.results,
        motorVehicleRecords: { status: 'pending' },
        professionalLicenses: { status: 'pending' },
        educationVerification: { status: 'pending' },
        employmentHistory: { status: 'pending' }
      };
    }

    // Save to Firestore
    const docRef = await adminFirestore
      .collection('verificationRequests')
      .add(verificationRequest);

    // Initiate background check with provider
    try {
      const externalId = await providerService.initiateBackgroundCheck({
        userId: locals.userId,
        checkType,
        personalInfo: consentData.personalInfo,
        requestId: docRef.id
      });

      // Update with external ID
      await docRef.update({
        'backgroundCheckData.externalId': externalId,
        status: 'in_progress'
      });

      // Send confirmation email
      await sendBackgroundCheckEmails({
        userId: locals.userId,
        requestId: docRef.id,
        checkType,
        provider,
        status: 'initiated'
      });

      return json({
        success: true,
        requestId: docRef.id,
        externalId,
        message: 'Background check initiated successfully',
        estimatedCompletion: providerService.getEstimatedCompletion(checkType)
      });

    } catch (providerError) {
      console.error('Provider error:', providerError);
      
      // Update status to failed
      await docRef.update({
        status: 'failed',
        'backgroundCheckData.error': providerError.message
      });

      return json({ 
        error: 'Failed to initiate background check with provider' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error submitting background check:', error);
    return json({ 
      error: 'Failed to submit background check request' 
    }, { status: 500 });
  }
};

// Get background check status
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestId = url.searchParams.get('requestId');

    if (requestId) {
      // Get specific request
      const requestDoc = await adminFirestore
        .collection('verificationRequests')
        .doc(requestId)
        .get();

      if (!requestDoc.exists) {
        return json({ error: 'Request not found' }, { status: 404 });
      }

      const request = { id: requestDoc.id, ...requestDoc.data() };

      // Check if user owns this request
      if (request.userId !== locals.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }

      return json({ request });
    } else {
      // Get all background check requests for user
      const requestsSnapshot = await adminFirestore
        .collection('verificationRequests')
        .where('userId', '==', locals.userId)
        .where('type', '==', 'background_check')
        .orderBy('submittedAt', 'desc')
        .get();

      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return json({ requests });
    }

  } catch (error) {
    console.error('Error getting background check status:', error);
    return json({ 
      error: 'Failed to get background check status' 
    }, { status: 500 });
  }
};

// Cancel a background check request (only if pending)
export const DELETE: RequestHandler = async ({ url, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestId = url.searchParams.get('requestId');

    if (!requestId) {
      return json({ error: 'Request ID is required' }, { status: 400 });
    }

    const requestDoc = await adminFirestore
      .collection('verificationRequests')
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return json({ error: 'Request not found' }, { status: 404 });
    }

    const request = requestDoc.data();

    // Check if user owns this request
    if (request?.userId !== locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if request can be cancelled
    if (request?.status !== 'pending') {
      return json({ 
        error: 'Can only cancel pending requests' 
      }, { status: 400 });
    }

    // Cancel with provider if external ID exists
    if (request?.backgroundCheckData?.externalId) {
      const provider = backgroundCheckProviders.getProvider(
        request.backgroundCheckData.provider
      );
      
      if (provider) {
        try {
          await provider.cancelBackgroundCheck(
            request.backgroundCheckData.externalId
          );
        } catch (error) {
          console.error('Error cancelling with provider:', error);
          // Continue with local cancellation even if provider fails
        }
      }
    }

    // Update status to cancelled
    await requestDoc.ref.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      'backgroundCheckData.cancellationReason': 'User requested cancellation'
    });

    return json({
      success: true,
      message: 'Background check request cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling background check:', error);
    return json({ 
      error: 'Failed to cancel background check request' 
    }, { status: 500 });
  }
};

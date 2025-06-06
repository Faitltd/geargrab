import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Test endpoint for webhook processing
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { eventType, metadata } = body;
    
    // Basic validation
    if (!eventType) {
      return json({ 
        error: 'Missing eventType' 
      }, { status: 400 });
    }

    // Simulate webhook processing based on event type
    let processedData: any = {
      eventId: `test_event_${Date.now()}`,
      eventType,
      processed: true,
      timestamp: new Date().toISOString()
    };

    switch (eventType) {
      case 'payment_intent.succeeded':
        processedData = {
          ...processedData,
          paymentStatus: 'completed',
          amount: metadata?.amount || 0,
          userId: metadata?.userId || 'unknown',
          actions: ['update_booking_status', 'send_confirmation_email']
        };
        break;

      case 'payment_intent.payment_failed':
        processedData = {
          ...processedData,
          paymentStatus: 'failed',
          amount: metadata?.amount || 0,
          userId: metadata?.userId || 'unknown',
          actions: ['notify_user', 'retry_payment']
        };
        break;

      case 'background_check.completed':
        processedData = {
          ...processedData,
          checkStatus: metadata?.status || 'completed',
          userId: metadata?.userId || 'unknown',
          actions: ['update_user_verification', 'send_notification']
        };
        break;

      case 'user.created':
        processedData = {
          ...processedData,
          userId: metadata?.userId || 'unknown',
          actions: ['send_welcome_email', 'setup_user_profile']
        };
        break;

      default:
        processedData = {
          ...processedData,
          message: 'Unknown event type, logged for review',
          actions: ['log_event']
        };
        break;
    }

    return json({
      success: true,
      message: 'Webhook test processed successfully',
      event: processedData,
      metadata
    });

  } catch (error) {
    return json({ 
      error: 'Invalid webhook payload',
      details: error.message 
    }, { status: 400 });
  }
};

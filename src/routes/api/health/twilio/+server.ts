import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkTwilioHealth } from '$lib/services/twilio';

export const GET: RequestHandler = async () => {
  try {
    // Check Twilio configuration
    const hasTwilioConfig = !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
    
    if (!hasTwilioConfig) {
      return json({
        success: false,
        message: 'Twilio not configured',
        status: 'down',
        configuration: {
          hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
          hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
          hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER
        },
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Check Twilio service health
    const healthCheck = await checkTwilioHealth();
    
    if (!healthCheck.healthy) {
      return json({
        success: false,
        message: 'Twilio service unavailable',
        status: 'down',
        error: healthCheck.error,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    return json({
      success: true,
      message: 'Twilio service healthy',
      status: 'up',
      configuration: {
        hasAccountSid: true,
        hasAuthToken: true,
        hasPhoneNumber: true,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
      },
      features: [
        'SMS verification codes',
        'Booking notifications',
        'Security alerts',
        'Booking reminders'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Twilio health check failed:', error);
    
    return json({
      success: false,
      error: 'Twilio health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

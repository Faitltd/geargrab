import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Count available email templates
    const templateTypes = [
      'booking_confirmation',
      'booking_owner_notification', 
      'payment_confirmation',
      'payment_failed',
      'background_check_initiated',
      'background_check_completed',
      'identity_verified',
      'phone_verified'
    ];

    const provider = hasResendKey && !isDevelopment ? 'Resend' : 'Console (Development)';
    
    return json({
      success: true,
      message: 'Email system configured',
      provider,
      templateCount: templateTypes.length,
      templates: templateTypes,
      configuration: {
        hasApiKey: hasResendKey,
        isDevelopment,
        fromEmail: process.env.FROM_EMAIL || 'GearGrab <bookings@geargrab.co>'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email health check failed:', error);
    
    return json({
      success: false,
      error: 'Email health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Health check endpoint for production monitoring
export const GET: RequestHandler = async () => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        firebase: {
          configured: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
          projectId: process.env.FIREBASE_PROJECT_ID || 'not-configured'
        },
        stripe: {
          configured: !!process.env.STRIPE_SECRET_KEY,
          webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET
        },
        email: {
          configured: !!process.env.RESEND_API_KEY,
          fromEmail: process.env.FROM_EMAIL || 'not-configured'
        }
      },
      version: '1.0.0',
      deployment: {
        cloudRun: true,
        region: 'us-central1'
      }
    };

    // Check if critical services are configured for production
    const isProduction = process.env.NODE_ENV === 'production';
    const criticalServicesConfigured = 
      healthStatus.services.firebase.configured &&
      healthStatus.services.stripe.configured &&
      healthStatus.services.email.configured;

    if (isProduction && !criticalServicesConfigured) {
      return json({
        ...healthStatus,
        status: 'degraded',
        warnings: [
          !healthStatus.services.firebase.configured && 'Firebase Admin not configured',
          !healthStatus.services.stripe.configured && 'Stripe not configured',
          !healthStatus.services.email.configured && 'Email service not configured'
        ].filter(Boolean)
      }, { status: 200 });
    }

    return json(healthStatus, { status: 200 });

  } catch (error) {
    return json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

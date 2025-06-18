import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
<<<<<<< HEAD
import { adminFirestore, adminAuth } from '$lib/firebase/server';
import { dev } from '$app/environment';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    auth: ServiceHealth;
  };
  uptime: number;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

const startTime = Date.now();

export const GET: RequestHandler = async () => {
  const healthCheck: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: dev ? 'development' : 'production',
    services: {
      database: await checkFirestore(),
      auth: await checkAuth()
    },
    uptime: Math.floor((Date.now() - startTime) / 1000)
  };

  // Determine overall health status
  const serviceStatuses = Object.values(healthCheck.services).map(s => s.status);
  
  if (serviceStatuses.includes('unhealthy')) {
    healthCheck.status = 'unhealthy';
  } else if (serviceStatuses.includes('degraded')) {
    healthCheck.status = 'degraded';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;

  return json(healthCheck, { status: statusCode });
};

async function checkFirestore(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const testRef = adminFirestore.collection('_health').doc('test');
    await testRef.get();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkAuth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Try to verify a dummy token (this will fail but confirms auth service is responding)
    try {
      await adminAuth.verifyIdToken('dummy-token');
    } catch (error) {
      // Expected to fail with auth/argument-error, which means service is working
      if (error.code === 'auth/argument-error') {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime
        };
      }
      throw error;
    }
    
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
=======

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
>>>>>>> beb3d1682105fb60c57c754c76bfdd353748209a

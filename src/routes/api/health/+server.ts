import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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

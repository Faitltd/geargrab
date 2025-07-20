import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Health check endpoint for Cloud Run and load balancers
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Basic health check information
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      service: 'geargrab',
      checks: {
        server: 'ok',
        memory: 'ok',
        environment: 'ok'
      }
    };

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    // Check if memory usage is reasonable (less than 800MB)
    if (memoryUsageMB.rss > 800) {
      healthData.checks.memory = 'warning';
    }

    // Environment variables check
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'PUBLIC_FIREBASE_PROJECT_ID'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      healthData.checks.environment = 'error';
      (healthData as any).missingEnvVars = missingEnvVars;
    }

    // Determine overall status
    const hasErrors = Object.values(healthData.checks).includes('error');
    const hasWarnings = Object.values(healthData.checks).includes('warning');

    if (hasErrors) {
      healthData.status = 'unhealthy';
    } else if (hasWarnings) {
      healthData.status = 'degraded';
    }

    // Add memory info to response
    (healthData as any).memory = memoryUsageMB;

    // Return appropriate status code
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;

    return json(healthData, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'geargrab'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
};

// Simple HEAD request for basic health checks
export const HEAD: RequestHandler = async () => {
  try {
    return new Response(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
};

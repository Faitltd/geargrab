import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const systemHealth = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      summary: {
        healthy: 0,
        degraded: 0,
        down: 0,
        total: 0
      }
    };

    // List of health check endpoints
    const healthChecks = [
      { name: 'firebase', endpoint: '/api/health/firebase' },
      { name: 'database', endpoint: '/api/health/database' },
      { name: 'email', endpoint: '/api/health/email' },
      { name: 'payments', endpoint: '/api/health/payments' },
      { name: 'backgroundChecks', endpoint: '/api/health/background-checks' },
      { name: 'storage', endpoint: '/api/health/storage' },
      { name: 'webhooks', endpoint: '/api/health/webhooks' },
      { name: 'search', endpoint: '/api/health/search' }
    ];

    // Check each service
    for (const check of healthChecks) {
      try {
        const response = await fetch(`http://localhost:5173${check.endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        systemHealth.services[check.name] = {
          status: data.status || (data.success ? 'healthy' : 'down'),
          message: data.message || 'No message',
          lastChecked: data.timestamp || new Date().toISOString(),
          details: data
        };

        // Update summary counts
        const status = systemHealth.services[check.name].status;
        if (status === 'healthy') {
          systemHealth.summary.healthy++;
        } else if (status === 'degraded') {
          systemHealth.summary.degraded++;
        } else {
          systemHealth.summary.down++;
        }
        systemHealth.summary.total++;

      } catch (error) {
        console.error(`Health check failed for ${check.name}:`, error);
        systemHealth.services[check.name] = {
          status: 'down',
          message: `Health check failed: ${error.message}`,
          lastChecked: new Date().toISOString(),
          error: error.message
        };
        systemHealth.summary.down++;
        systemHealth.summary.total++;
      }
    }

    // Determine overall system health
    if (systemHealth.summary.down > 0) {
      systemHealth.overall = 'down';
    } else if (systemHealth.summary.degraded > 0) {
      systemHealth.overall = 'degraded';
    } else {
      systemHealth.overall = 'healthy';
    }

    // Add performance metrics
    systemHealth.performance = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Add environment info
    systemHealth.environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasFirebaseConfig: !!(process.env.VITE_FIREBASE_PROJECT_ID),
      hasStripeConfig: !!(process.env.STRIPE_SECRET_KEY),
      hasEmailConfig: !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY),
      hasBackgroundCheckConfig: !!(process.env.CHECKR_API_KEY)
    };

    return json(systemHealth, {
      status: systemHealth.overall === 'down' ? 503 : 200
    });

  } catch (error) {
    console.error('System health check failed:', error);
    return json({
      overall: 'down',
      message: 'System health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

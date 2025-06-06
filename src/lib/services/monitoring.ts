// Comprehensive monitoring and error tracking service for GearGrab
import { browser } from '$app/environment';
import { adminFirestore } from '$firebase/server';

export interface ErrorReport {
  id?: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'client' | 'server' | 'api' | 'payment' | 'background_check' | 'email';
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  id?: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  firebase: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  email: 'healthy' | 'degraded' | 'down';
  payments: 'healthy' | 'degraded' | 'down';
  backgroundChecks: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
}

class MonitoringService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize Firebase Analytics if in browser
    if (browser && typeof window !== 'undefined') {
      await this.initializeClientMonitoring();
    }

    this.isInitialized = true;
    console.log('Monitoring service initialized');
  }

  private async initializeClientMonitoring(): Promise<void> {
    // Initialize Firebase Analytics
    try {
      const { getAnalytics, logEvent } = await import('firebase/analytics');
      const { firebaseApp } = await import('$lib/firebase/client');
      
      if (firebaseApp) {
        const analytics = getAnalytics(firebaseApp);
        console.log('Firebase Analytics initialized');
        
        // Log app initialization
        logEvent(analytics, 'app_initialized', {
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Failed to initialize Firebase Analytics:', error);
    }

    // Set up global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        timestamp: new Date(),
        severity: 'medium',
        category: 'client',
        metadata: {
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date(),
        severity: 'high',
        category: 'client',
        metadata: {
          reason: event.reason
        }
      });
    });
  }

  // Log errors to monitoring system
  async logError(error: ErrorReport): Promise<void> {
    try {
      // Add user agent if in browser
      if (browser && typeof navigator !== 'undefined') {
        error.userAgent = navigator.userAgent;
        error.url = error.url || window.location.href;
      }

      // Log to console for development
      console.error('Error logged:', error);

      // Store in Firestore for persistence
      if (!browser) {
        await adminFirestore.collection('errorLogs').add({
          ...error,
          timestamp: error.timestamp || new Date()
        });
      }

      // Send to external monitoring service (Sentry, DataDog, etc.)
      await this.sendToExternalMonitoring(error);

      // Send alerts for critical errors
      if (error.severity === 'critical') {
        await this.sendAlert(error);
      }

    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Log performance metrics
  async logPerformance(metric: PerformanceMetric): Promise<void> {
    try {
      console.log('Performance metric:', metric);

      // Store in Firestore
      if (!browser) {
        await adminFirestore.collection('performanceMetrics').add({
          ...metric,
          timestamp: metric.timestamp || new Date()
        });
      }

      // Send to analytics
      if (browser) {
        await this.logAnalyticsEvent('performance_metric', {
          metric: metric.metric,
          value: metric.value,
          unit: metric.unit
        });
      }

    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }

  // Check system health
  async checkSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      firebase: 'healthy',
      database: 'healthy',
      email: 'healthy',
      payments: 'healthy',
      backgroundChecks: 'healthy',
      storage: 'healthy',
      lastChecked: new Date()
    };

    try {
      // Check Firebase/Firestore
      if (!browser) {
        try {
          await adminFirestore.collection('_health_check').limit(1).get();
        } catch (error) {
          health.firebase = 'down';
          health.database = 'down';
        }
      }

      // Check email service
      try {
        const emailHealthResponse = await fetch('/api/health/email');
        if (!emailHealthResponse.ok) {
          health.email = 'degraded';
        }
      } catch (error) {
        health.email = 'down';
      }

      // Check payment service
      try {
        const paymentHealthResponse = await fetch('/api/health/payments');
        if (!paymentHealthResponse.ok) {
          health.payments = 'degraded';
        }
      } catch (error) {
        health.payments = 'down';
      }

      // Check background check service
      try {
        const bgCheckHealthResponse = await fetch('/api/health/background-checks');
        if (!bgCheckHealthResponse.ok) {
          health.backgroundChecks = 'degraded';
        }
      } catch (error) {
        health.backgroundChecks = 'down';
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }

    return health;
  }

  // Log analytics events
  async logAnalyticsEvent(eventName: string, parameters?: Record<string, any>): Promise<void> {
    try {
      if (browser) {
        const { getAnalytics, logEvent } = await import('firebase/analytics');
        const { firebaseApp } = await import('$lib/firebase/client');
        
        if (firebaseApp) {
          const analytics = getAnalytics(firebaseApp);
          logEvent(analytics, eventName, {
            ...parameters,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.warn('Failed to log analytics event:', error);
    }
  }

  // Send to external monitoring service
  private async sendToExternalMonitoring(error: ErrorReport): Promise<void> {
    try {
      // Example: Send to Sentry
      if (process.env.SENTRY_DSN) {
        // Sentry integration would go here
        console.log('Would send to Sentry:', error);
      }

      // Example: Send to DataDog
      if (process.env.DATADOG_API_KEY) {
        // DataDog integration would go here
        console.log('Would send to DataDog:', error);
      }

    } catch (error) {
      console.error('Failed to send to external monitoring:', error);
    }
  }

  // Send alerts for critical issues
  private async sendAlert(error: ErrorReport): Promise<void> {
    try {
      // Send email alert
      if (process.env.ALERT_EMAIL) {
        await fetch('/api/alerts/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: process.env.ALERT_EMAIL,
            subject: `Critical Error in GearGrab: ${error.message}`,
            error
          })
        });
      }

      // Send Slack alert
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Critical Error in GearGrab`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Error', value: error.message, short: false },
                { title: 'Category', value: error.category, short: true },
                { title: 'Timestamp', value: error.timestamp.toISOString(), short: true }
              ]
            }]
          })
        });
      }

    } catch (alertError) {
      console.error('Failed to send alert:', alertError);
    }
  }
}

export const monitoringService = new MonitoringService();

// Helper functions for common monitoring tasks
export const logError = (error: Partial<ErrorReport>) => {
  return monitoringService.logError({
    message: error.message || 'Unknown error',
    timestamp: new Date(),
    severity: error.severity || 'medium',
    category: error.category || 'client',
    ...error
  });
};

export const logPerformance = (metric: string, value: number, unit: string = 'ms') => {
  return monitoringService.logPerformance({
    metric,
    value,
    unit,
    timestamp: new Date()
  });
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  return monitoringService.logAnalyticsEvent(eventName, parameters);
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Default system settings
const defaultSettings = {
  platform: {
    siteName: 'GearGrab',
    siteDescription: 'Rent outdoor gear from locals',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true
  },
  payments: {
    stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    platformFeePercentage: 10,
    minimumBookingAmount: 25,
    maximumBookingAmount: 5000,
    currency: 'USD'
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminEmailAlerts: true
  },
  security: {
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    allowPasswordReset: true
  },
  features: {
    enableChat: true,
    enableReviews: true,
    enableInsurance: true,
    enableBackgroundChecks: false,
    enableGeolocation: true
  }
};

// In a real implementation, you would store settings in a database
// For now, we'll use in-memory storage (will reset on server restart)
let currentSettings = { ...defaultSettings };

export const GET: RequestHandler = async () => {
  try {
    // In a real implementation, you would:
    // 1. Check admin authentication
    // 2. Load settings from database
    // 3. Return current settings

    console.log('📋 Loading system settings');

    return json({
      success: true,
      settings: currentSettings,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error loading settings:', error);
    return json({ 
      error: 'Failed to load settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { settings } = await request.json();

    if (!settings) {
      return json({ error: 'Settings object is required' }, { status: 400 });
    }

    // Validate settings structure
    const requiredSections = ['platform', 'payments', 'notifications', 'security', 'features'];
    for (const section of requiredSections) {
      if (!settings[section]) {
        return json({ error: `Missing required section: ${section}` }, { status: 400 });
      }
    }

    // Validate specific settings
    if (settings.payments.platformFeePercentage < 0 || settings.payments.platformFeePercentage > 50) {
      return json({ error: 'Platform fee percentage must be between 0 and 50' }, { status: 400 });
    }

    if (settings.payments.minimumBookingAmount < 1) {
      return json({ error: 'Minimum booking amount must be at least $1' }, { status: 400 });
    }

    if (settings.payments.maximumBookingAmount < settings.payments.minimumBookingAmount) {
      return json({ error: 'Maximum booking amount must be greater than minimum' }, { status: 400 });
    }

    if (settings.security.sessionTimeout < 1 || settings.security.sessionTimeout > 168) {
      return json({ error: 'Session timeout must be between 1 and 168 hours' }, { status: 400 });
    }

    if (settings.security.maxLoginAttempts < 3 || settings.security.maxLoginAttempts > 10) {
      return json({ error: 'Max login attempts must be between 3 and 10' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Check admin authentication
    // 2. Validate all settings
    // 3. Save to database
    // 4. Update environment variables if needed
    // 5. Trigger any necessary system updates

    // Update current settings
    currentSettings = {
      ...currentSettings,
      ...settings,
      lastUpdated: new Date().toISOString()
    };

    console.log('💾 System settings updated:', {
      platform: currentSettings.platform.siteName,
      maintenanceMode: currentSettings.platform.maintenanceMode,
      platformFee: currentSettings.payments.platformFeePercentage,
      featuresEnabled: Object.entries(currentSettings.features)
        .filter(([key, value]) => value)
        .map(([key]) => key)
    });

    // Log important changes
    if (settings.platform.maintenanceMode !== defaultSettings.platform.maintenanceMode) {
      console.log(`🚨 Maintenance mode ${settings.platform.maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
    }

    if (settings.platform.allowNewRegistrations !== defaultSettings.platform.allowNewRegistrations) {
      console.log(`👥 New registrations ${settings.platform.allowNewRegistrations ? 'ENABLED' : 'DISABLED'}`);
    }

    return json({
      success: true,
      message: 'Settings saved successfully',
      settings: currentSettings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving settings:', error);
    return json({ 
      error: 'Failed to save settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    // Reset to default settings
    currentSettings = { ...defaultSettings };

    console.log('🔄 System settings reset to defaults');

    return json({
      success: true,
      message: 'Settings reset to defaults',
      settings: currentSettings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting settings:', error);
    return json({ 
      error: 'Failed to reset settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// GET endpoint for specific setting sections
export const PATCH: RequestHandler = async ({ request, url }) => {
  try {
    const section = url.searchParams.get('section');
    
    if (!section) {
      return json({ error: 'Section parameter is required' }, { status: 400 });
    }

    if (!currentSettings[section as keyof typeof currentSettings]) {
      return json({ error: 'Invalid section' }, { status: 400 });
    }

    return json({
      success: true,
      section,
      settings: currentSettings[section as keyof typeof currentSettings]
    });

  } catch (error) {
    console.error('Error getting section settings:', error);
    return json({ 
      error: 'Failed to get section settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

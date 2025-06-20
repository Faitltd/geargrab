import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { backgroundCheckProviders } from '$lib/services/backgroundCheckProviders';

export const GET: RequestHandler = async () => {
  try {
    // Get available background check providers
    const providers = backgroundCheckProviders.getAllProviders();
    const defaultProvider = backgroundCheckProviders.getDefaultProvider();
    
    const providerInfo = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      isDefault: provider.id === defaultProvider.id
    }));

    const hasCheckrKey = !!process.env.CHECKR_API_KEY;
    const hasSterlingKey = !!process.env.STERLING_API_KEY;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return json({
      success: true,
      message: 'Background check providers available',
      providers: providerInfo.map(p => p.name),
      defaultProvider: defaultProvider.name,
      configuration: {
        hasCheckrKey,
        hasSterlingKey,
        isDevelopment,
        usingMockProvider: defaultProvider.id === 'mock'
      },
      checkTypes: ['basic', 'standard', 'comprehensive'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Background check health check failed:', error);
    
    return json({
      success: false,
      error: 'Background check health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

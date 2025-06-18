import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';

// Test endpoint for user registration flow
export const POST: RequestHandler = createSecureHandler(
  async (event, { body }) => {
    const { email, password, displayName } = body;
    
    // Simulate registration validation
    if (!email || !password || !displayName) {
      return json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Simulate successful registration
    return json({
      success: true,
      message: 'User registration test passed',
      user: {
        email,
        displayName,
        uid: `test_user_${Date.now()}`
      }
    });
  },
  {
    rateLimit: 'auth',
    validateCSRF: false, // Skip CSRF for testing
    inputSchema: {
      email: { required: true, type: 'email' as const },
      password: { required: true, type: 'string' as const, minLength: 8 },
      displayName: { required: true, type: 'string' as const, minLength: 2, maxLength: 50 }
    }
  }
);

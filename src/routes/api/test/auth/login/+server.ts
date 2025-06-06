import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';

// Test endpoint for user login flow
export const POST: RequestHandler = createSecureHandler(
  async (event, { body }) => {
    const { email, password } = body;
    
    // Simulate login validation
    if (!email || !password) {
      return json({ 
        error: 'Missing email or password' 
      }, { status: 400 });
    }

    // Simulate successful login
    return json({
      success: true,
      message: 'User login test passed',
      user: {
        email,
        uid: `test_user_${Date.now()}`,
        idToken: `test_token_${Date.now()}`
      }
    });
  },
  {
    rateLimit: 'auth',
    validateCSRF: false, // Skip CSRF for testing
    inputSchema: {
      email: { required: true, type: 'email' as const },
      password: { required: true, type: 'string' as const, minLength: 1 }
    }
  }
);

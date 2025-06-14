import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Simple endpoint to test authentication status
export const GET: RequestHandler = async ({ locals }) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return json({
    success: true,
    message: 'Authentication test endpoint',
    data: {
      isAuthenticated: !!locals.userId,
      userId: locals.userId || null,
      user: locals.user || null,
      environment: {
        isDevelopment,
        NODE_ENV: process.env.NODE_ENV,
        hasFirebaseAdmin: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'configured' : 'missing'
      }
    },
    timestamp: new Date().toISOString()
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json();
    
    return json({
      success: true,
      message: 'Authentication test POST endpoint',
      data: {
        isAuthenticated: !!locals.userId,
        userId: locals.userId || null,
        user: locals.user || null,
        requestBody: body,
        headers: {
          authorization: request.headers.get('authorization') ? 'present' : 'missing',
          contentType: request.headers.get('content-type')
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
};

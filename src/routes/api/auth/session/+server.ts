import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { verifyIdToken } from '$lib/firebase-admin';

// Set session cookie
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return json({ error: 'ID token is required' }, { status: 400 });
    }
    
    // Verify the ID token
    const decodedToken = await verifyIdToken(idToken);
    
    // Set session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    
    cookies.set('session', idToken, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/'
    });
    
    return json({ 
      success: true, 
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      }
    });
    
  } catch (error) {
    console.error('Error setting session cookie:', error);
    return json({ error: 'Invalid ID token' }, { status: 401 });
  }
};

// Clear session cookie
export const DELETE: RequestHandler = async ({ cookies }) => {
  try {
    cookies.delete('session', { path: '/' });
    
    return json({ success: true });
    
  } catch (error) {
    console.error('Error clearing session cookie:', error);
    return json({ error: 'Failed to clear session' }, { status: 500 });
  }
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$firebase/server';

// Create a session cookie
export const POST: RequestHandler = async ({ request, cookies }) => {
  const { idToken, expiresIn = 60 * 60 * 24 * 5 * 1000 } = await request.json();
  
  try {
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    // Set the cookie
    cookies.set('__session', sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: expiresIn / 1000 // Convert to seconds
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error creating session:', error);
    return json({ success: false, error: 'Failed to create session' }, { status: 401 });
  }
};

// Delete the session cookie
export const DELETE: RequestHandler = async ({ cookies }) => {
  cookies.delete('__session', { path: '/' });
  return json({ success: true });
};

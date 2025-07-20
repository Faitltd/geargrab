import { browser } from '$app/environment';
import { auth } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Set session cookie when user signs in
export const setSessionCookie = async (idToken: string) => {
  if (!browser) return;
  
  try {
    // Send the ID token to the server to set a session cookie
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to set session cookie');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting session cookie:', error);
    return false;
  }
};

// Clear session cookie when user signs out
export const clearSessionCookie = async () => {
  if (!browser) return;
  
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear session cookie');
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing session cookie:', error);
    return false;
  }
};

// Initialize auth state listener to sync with server
export const initializeAuthSession = () => {
  if (!browser || !auth) return;
  
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, set session cookie
      try {
        const idToken = await user.getIdToken();
        await setSessionCookie(idToken);
      } catch (error) {
        console.error('Error getting ID token:', error);
      }
    } else {
      // User is signed out, clear session cookie
      await clearSessionCookie();
    }
  });
};

// Check if user should be redirected after auth
export const handleAuthRedirect = () => {
  if (!browser) return;
  
  const redirectPath = sessionStorage.getItem('redirectAfterAuth');
  if (redirectPath && redirectPath !== window.location.pathname) {
    sessionStorage.removeItem('redirectAfterAuth');
    window.location.href = redirectPath;
  }
};

// Store current path for redirect after auth
export const storeRedirectPath = (path: string) => {
  if (!browser) return;
  
  // Don't store auth page or home page
  if (path === '/auth' || path === '/') return;
  
  sessionStorage.setItem('redirectAfterAuth', path);
};

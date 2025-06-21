import { browser } from '$app/environment';
import { auth } from './client';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  type UserCredential
} from 'firebase/auth';
import { createUserDocument } from './auth';

/**
 * Redirect-only Google authentication to completely avoid COOP issues
 * This implementation never uses popups and relies entirely on redirects
 */

// Track if redirect result has been handled to prevent double processing
let redirectResultHandled = false;

// Handle redirect result (call this on app initialization)
export async function handleGoogleRedirectResult(): Promise<UserCredential | null> {
  if (!browser) return null;

  // Prevent double handling of redirect result
  if (redirectResultHandled) {
    console.log('🔄 Redirect result already handled, skipping...');
    return null;
  }

  try {
    const result = await getRedirectResult(auth);
    if (result) {
      redirectResultHandled = true;
      console.log('✅ Google redirect sign-in successful:', result.user.email);
      await createUserDocument(result.user);
    }
    return result;
  } catch (error: any) {
    console.error('❌ Google redirect sign-in error:', error);
    throw error;
  }
}

// Sign in with Google using redirect only
export async function signInWithGoogleRedirectOnly(): Promise<never> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');

  const provider = new GoogleAuthProvider();

  // Add additional scopes if needed
  provider.addScope('email');
  provider.addScope('profile');

  // Set custom parameters
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    console.log('🔐 Starting Google redirect sign-in...');
    
    // Always use redirect method - never popups
    await signInWithRedirect(auth, provider);
    
    // This will redirect the page, so we never reach this point
    throw new Error('Redirecting to Google sign-in...');
  } catch (error: any) {
    console.error('❌ Google redirect sign-in error:', error);
    throw error;
  }
}

// Check if we're returning from a Google redirect
export function isReturningFromGoogleRedirect(): boolean {
  if (!browser) return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  const state = urlParams.get('state');
  const code = urlParams.get('code');
  
  // Check for Google OAuth redirect parameters
  return !!(state && code);
}

// Initialize redirect result handling
export async function initializeRedirectAuth(): Promise<UserCredential | null> {
  if (!browser) return null;

  // Prevent double handling of redirect result
  if (redirectResultHandled) {
    console.log('🔄 Redirect result already handled in initializeRedirectAuth, skipping...');
    return null;
  }

  try {
    // Check if we're returning from a redirect
    if (isReturningFromGoogleRedirect()) {
      console.log('🔄 Detected return from Google redirect, handling result...');
    }

    // Always check for redirect result on page load
    const result = await handleGoogleRedirectResult();

    if (result) {
      console.log('✅ Successfully handled Google redirect result');
      // Clear URL parameters to clean up the URL
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error initializing redirect auth:', error);
    return null;
  }
}

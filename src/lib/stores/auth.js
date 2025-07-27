/**
 * Authentication Store
 * Manages user authentication state with Firebase and API integration
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { base44 } from '../../api/base44Client.js';

// Auth state stores
export const user = writable(null);
export const loading = writable(true);
export const error = writable(null);

// Derived stores
export const isAuthenticated = derived(user, ($user) => !!$user);
export const isEmailVerified = derived(user, ($user) => $user?.is_email_verified || false);

// Firebase auth state listener
let firebaseUnsubscribe = null;

/**
 * Initialize authentication
 */
export async function initAuth() {
  if (!browser) return;
  
  loading.set(true);
  error.set(null);
  
  try {
    // Import Firebase auth
    const { auth, waitForAuth } = await import('../firebase/client.js');
    
    // Wait for Firebase to initialize
    await waitForAuth();
    
    // Set up Firebase auth state listener
    firebaseUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in with Firebase
          console.log('Firebase user signed in:', firebaseUser.email);
          
          // Get Firebase ID token and exchange for JWT
          const idToken = await firebaseUser.getIdToken();
          const response = await base44.auth.loginWithFirebase(idToken);
          
          // Update user store with API response
          user.set(response.user);
          error.set(null);
          
        } else {
          // User is signed out
          console.log('Firebase user signed out');
          user.set(null);
          
          // Clear stored tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        error.set(err.message);
        user.set(null);
      } finally {
        loading.set(false);
      }
    });
    
  } catch (err) {
    console.error('Auth initialization error:', err);
    error.set(err.message);
    loading.set(false);
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  if (!browser) return;
  
  loading.set(true);
  error.set(null);
  
  try {
    const { signInWithGoogle } = await import('../firebase/auth.js');
    const result = await signInWithGoogle();
    
    // Firebase auth state listener will handle the rest
    return result;
    
  } catch (err) {
    console.error('Google sign-in error:', err);
    error.set(err.message);
    loading.set(false);
    throw err;
  }
}

/**
 * Sign in with Facebook
 */
export async function signInWithFacebook() {
  if (!browser) return;
  
  loading.set(true);
  error.set(null);
  
  try {
    const { signInWithFacebook } = await import('../firebase/auth.js');
    const result = await signInWithFacebook();
    
    return result;
    
  } catch (err) {
    console.error('Facebook sign-in error:', err);
    error.set(err.message);
    loading.set(false);
    throw err;
  }
}

/**
 * Sign in with Twitter
 */
export async function signInWithTwitter() {
  if (!browser) return;

  loading.set(true);
  error.set(null);

  try {
    const { signInWithTwitter } = await import('../firebase/auth.js');
    const result = await signInWithTwitter();

    return result;

  } catch (err) {
    console.error('Twitter sign-in error:', err);
    error.set(err.message);
    loading.set(false);
    throw err;
  }
}

/**
 * Sign in with GitHub
 */
export async function signInWithGithub() {
  if (!browser) return;

  loading.set(true);
  error.set(null);

  try {
    const { signInWithGithub } = await import('../firebase/auth.js');
    const result = await signInWithGithub();

    return result;

  } catch (err) {
    console.error('GitHub sign-in error:', err);
    error.set(err.message);
    loading.set(false);
    throw err;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  if (!browser) return;
  
  loading.set(true);
  error.set(null);
  
  try {
    await base44.auth.logout();
    user.set(null);
    
  } catch (err) {
    console.error('Sign-out error:', err);
    error.set(err.message);
  } finally {
    loading.set(false);
  }
}

/**
 * Update user profile
 */
export async function updateProfile(profileData) {
  if (!browser) return;
  
  loading.set(true);
  error.set(null);
  
  try {
    const currentUser = get(user);
    if (!currentUser) throw new Error('No user signed in');
    
    // Update via API
    const response = await base44.entities.User.update(currentUser.id, profileData);
    user.set(response.user);
    
    return response;
    
  } catch (err) {
    console.error('Profile update error:', err);
    error.set(err.message);
    loading.set(false);
    throw err;
  }
}

/**
 * Refresh user data
 */
export async function refreshUser() {
  if (!browser) return;
  
  try {
    const response = await base44.auth.me();
    user.set(response.user);
    return response.user;
  } catch (err) {
    console.error('User refresh error:', err);
    user.set(null);
    throw err;
  }
}

/**
 * Clean up auth listeners
 */
export function cleanup() {
  if (firebaseUnsubscribe) {
    firebaseUnsubscribe();
    firebaseUnsubscribe = null;
  }
}

// Auto-initialize auth when store is imported
if (browser) {
  initAuth();
}

// Clean up on page unload
if (browser) {
  window.addEventListener('beforeunload', cleanup);
}

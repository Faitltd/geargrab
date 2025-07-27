/**
 * Firebase Authentication Helper Functions
 * Provides authentication methods for various providers
 */

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './client.js';

// Configure providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');

const twitterProvider = new TwitterAuthProvider();

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get additional user info
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    return {
      user: result.user,
      credential,
      token
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email address but different sign-in credentials.');
    }
    
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Sign in with Facebook
 */
export async function signInWithFacebook() {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    
    // Get additional user info
    const credential = FacebookAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    return {
      user: result.user,
      credential,
      token
    };
  } catch (error) {
    console.error('Facebook sign-in error:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email address but different sign-in credentials.');
    }
    
    throw new Error(error.message || 'Failed to sign in with Facebook');
  }
}

/**
 * Sign in with Twitter
 */
export async function signInWithTwitter() {
  try {
    const result = await signInWithPopup(auth, twitterProvider);
    
    // Get additional user info
    const credential = TwitterAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const secret = credential?.secret;
    
    return {
      user: result.user,
      credential,
      token,
      secret
    };
  } catch (error) {
    console.error('Twitter sign-in error:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email address but different sign-in credentials.');
    }
    
    throw new Error(error.message || 'Failed to sign in with Twitter');
  }
}

/**
 * Sign in with GitHub
 */
export async function signInWithGithub() {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    
    // Get additional user info
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    return {
      user: result.user,
      credential,
      token
    };
  } catch (error) {
    console.error('GitHub sign-in error:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email address but different sign-in credentials.');
    }
    
    throw new Error(error.message || 'Failed to sign in with GitHub');
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw new Error('Failed to sign out');
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Check if user is signed in
 */
export function isSignedIn() {
  return !!auth.currentUser;
}

/**
 * Get user ID token
 */
export async function getIdToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user signed in');
  }
  
  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Failed to get ID token:', error);
    throw new Error('Failed to get authentication token');
  }
}

/**
 * Refresh user token
 */
export async function refreshToken() {
  return getIdToken(true);
}

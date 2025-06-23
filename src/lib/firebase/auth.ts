import { browser } from '$app/environment';
import { auth } from './client';
import {
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type UserCredential,
  type User
} from 'firebase/auth';
import { firestore } from './client';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { User as FirestoreUser } from '$types/firestore';

// Handle redirect result (call this on app initialization)
export async function handleGoogleRedirectResult(): Promise<UserCredential | null> {
  if (!browser) return null;

  try {
    // Use the redirect-only implementation
    const { initializeRedirectAuth } = await import('./auth-redirect-only');
    return await initializeRedirectAuth();
  } catch (error: any) {
    console.error('❌ Google redirect sign-in error:', error);
    throw error;
  }
}



// Sign in with Google - supports both popup and redirect methods
export async function signInWithGoogle(usePopup: boolean = true): Promise<UserCredential> {
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
    console.log(`🔐 Attempting Google sign-in with ${usePopup ? 'popup' : 'redirect'} method...`);
    console.log('🔍 Firebase Auth object:', auth);
    console.log('🔍 Google Auth Provider:', provider);

    if (usePopup) {
      // Try popup method first
      console.log('🔄 Starting popup sign-in...');
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google popup sign-in successful:', {
        email: result.user.email,
        uid: result.user.uid,
        displayName: result.user.displayName
      });

      console.log('🔄 Creating user document...');
      await createUserDocument(result.user);
      console.log('✅ User document created successfully');

      return result;
    } else {
      // Use redirect method
      console.log('🔄 Using redirect method...');
      const { signInWithGoogleRedirectOnly } = await import('./auth-redirect-only');
      await signInWithGoogleRedirectOnly();
      throw new Error('Redirecting to Google sign-in...');
    }
  } catch (error: any) {
    console.error('❌ Google sign-in error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });

    // Handle specific Google auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in attempt is in progress. Please wait.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled. Please contact support.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for Google sign-in.');
    } else {
      throw new Error(`Google sign-in failed: ${error.message}`);
    }
  }
}



// Create user document in Firestore
export async function createUserDocument(user: User): Promise<void> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  
  const userRef = doc(firestore, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  // Only create if it doesn't exist
  if (!userSnap.exists()) {
    const userData: FirestoreUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      createdAt: serverTimestamp() as any,
      isVerified: false,
      ratings: {
        asOwner: 0,
        asRenter: 0
      }
    };
    
    await setDoc(userRef, userData);
    
    // Create private user data
    const privateRef = doc(firestore, 'users', user.uid, 'private', 'data');
    await setDoc(privateRef, {
      uid: user.uid,
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    });
  }
}

// Sign out
export async function signOut(): Promise<void> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  
  try {
    await firebaseSignOut(auth);
    // The auth state change will be handled by the onAuthStateChanged listener
    // in the root layout, which will update the authStore
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
}



// Update user profile
export async function updateUserProfile(
  displayName?: string, 
  photoURL?: string
): Promise<void> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  if (!auth.currentUser) throw new Error('No user is signed in');
  
  const updates: { displayName?: string; photoURL?: string } = {};
  if (displayName) updates.displayName = displayName;
  if (photoURL) updates.photoURL = photoURL;
  
  return updateProfile(auth.currentUser, updates);
}



// Admin functions
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    if (!browser) return false;
    const user = auth.currentUser;
    if (!user) return false;

    const adminDoc = await getDoc(doc(firestore, 'adminUsers', user.uid));
    return adminDoc.exists() && adminDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function makeUserAdmin(userId: string): Promise<void> {
  try {
    if (!browser) throw new Error('Admin functions can only be called in the browser');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be logged in to grant admin privileges');
    }

    // Check if current user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admins can grant admin privileges');
    }

    // Create admin document
    await setDoc(doc(firestore, 'adminUsers', userId), {
      isAdmin: true,
      role: 'admin',
      createdAt: serverTimestamp(),
      permissions: ['all'],
      createdBy: currentUser.uid,
      createdByEmail: currentUser.email
    });

    console.log(`Successfully granted admin privileges to user: ${userId}`);
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
}

export async function removeAdminPrivileges(userId: string): Promise<void> {
  try {
    if (!browser) throw new Error('Admin functions can only be called in the browser');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be logged in to remove admin privileges');
    }

    // Check if current user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admins can remove admin privileges');
    }

    // Prevent removing own admin privileges
    if (userId === currentUser.uid) {
      throw new Error('Cannot remove your own admin privileges');
    }

    // Remove admin document
    await deleteDoc(doc(firestore, 'adminUsers', userId));

    console.log(`Successfully removed admin privileges from user: ${userId}`);
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    throw error;
  }
}

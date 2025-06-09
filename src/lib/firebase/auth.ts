import { browser } from '$app/environment';
import { auth } from './client';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
  type User
} from 'firebase/auth';
import { firestore } from './client';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { User as FirestoreUser } from '$types/firestore';

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
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
    console.log('🔐 Attempting Google sign-in...');
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Google sign-in successful:', result.user.email);

    // Create or update user document in Firestore
    await createUserDocument(result.user);

    return result;
  } catch (error: any) {
    console.error('❌ Google sign-in error:', error);

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

// Sign up with email and password
export async function signUpWithEmail(
  email: string, 
  password: string, 
  displayName: string
): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  
  // Create the user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update the user profile with display name
  await updateProfile(userCredential.user, { displayName });
  
  // Create the user document in Firestore
  await createUserDocument(userCredential.user);
  
  return userCredential;
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

// Reset password
export async function resetPassword(email: string): Promise<void> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  return sendPasswordResetEmail(auth, email);
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

// Update user email
export async function updateUserEmail(newEmail: string): Promise<void> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  if (!auth.currentUser) throw new Error('No user is signed in');
  
  return updateEmail(auth.currentUser, newEmail);
}

// Update user password
export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  if (!auth.currentUser) throw new Error('No user is signed in');
  
  return updatePassword(auth.currentUser, newPassword);
}

// Reauthenticate user
export async function reauthenticate(password: string): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  if (!auth.currentUser) throw new Error('No user is signed in');
  if (!auth.currentUser.email) throw new Error('User has no email');

  const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
  return reauthenticateWithCredential(auth.currentUser, credential);
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

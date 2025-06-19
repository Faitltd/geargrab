import { browser } from '$app/environment';
import { auth } from './client';
import {
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type UserCredential,
  type User
} from 'firebase/auth';
import { firestore } from './client';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { User as FirestoreUser } from '$types/firestore';

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  const result = await signInWithPopup(auth, provider);

  // Create user document if it doesn't exist
  await createUserDocument(result.user);

  return result;
}

// Sign in with Facebook
export async function signInWithFacebook(): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');
  const result = await signInWithPopup(auth, provider);

  // Create user document if it doesn't exist
  await createUserDocument(result.user);

  return result;
}

// Sign in with GitHub
export async function signInWithGitHub(): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  const provider = new GithubAuthProvider();
  provider.addScope('user:email');
  const result = await signInWithPopup(auth, provider);

  // Create user document if it doesn't exist
  await createUserDocument(result.user);

  return result;
}

// Sign in with Apple
export async function signInWithApple(): Promise<UserCredential> {
  if (!browser) throw new Error('Auth functions can only be called in the browser');
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const result = await signInWithPopup(auth, provider);

  // Create user document if it doesn't exist
  await createUserDocument(result.user);

  return result;
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
  return firebaseSignOut(auth);
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

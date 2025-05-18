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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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
  return signInWithPopup(auth, provider);
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
  return firebaseSignOut(auth);
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

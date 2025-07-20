// Modern Firebase Configuration for SvelteKit v2 + Firebase v10
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import {
  getStorage,
  type FirebaseStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { browser, dev } from '$app/environment';
import {
  PUBLIC_FIREBASE_API_KEY,
  PUBLIC_FIREBASE_AUTH_DOMAIN,
  PUBLIC_FIREBASE_PROJECT_ID,
  PUBLIC_FIREBASE_STORAGE_BUCKET,
  PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  PUBLIC_FIREBASE_APP_ID
} from '$env/static/public';

// Firebase configuration
const firebaseConfig = {
  apiKey: PUBLIC_FIREBASE_API_KEY,
  authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase app (modern approach with getApps check)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Initialize Firebase only on client side with emulator support
if (browser) {
  // Check if Firebase app is already initialized
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Connect to emulators in development
  if (dev) {
    try {
      // Connect to Auth emulator
      if (!auth.config.emulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }

      // Connect to Firestore emulator
      if (!db._delegate._databaseId.projectId.includes('localhost')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }

      // Connect to Storage emulator
      if (!storage._host.includes('localhost')) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }
    } catch (error) {
      // Emulators might already be connected, ignore errors
      console.log('Firebase emulators already connected or not available');
    }
  }
}

// Export Firebase services
export { auth, db, storage };

// Export Firebase functions for modern usage
export {
  // Auth functions
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,

  // Firestore functions
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,

  // Storage functions
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

// Export Firebase app for SSR compatibility
export const getFirebaseApp = (): FirebaseApp | null => {
  if (browser) {
    return app;
  }
  return null;
};

// Modern Firebase initialization for SSR
export const initializeFirebaseForSSR = () => {
  if (!browser) {
    const existingApps = getApps();
    const serverApp = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
    return {
      app: serverApp,
      auth: getAuth(serverApp),
      db: getFirestore(serverApp),
      storage: getStorage(serverApp)
    };
  }
  return null;
};

// Modern Firebase error handling utility with comprehensive error codes
export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';

  switch (errorCode) {
    // Auth errors
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.';

    // Firestore errors
    case 'firestore/permission-denied':
      return 'You do not have permission to perform this action.';
    case 'firestore/unavailable':
      return 'Service is currently unavailable. Please try again later.';
    case 'firestore/not-found':
      return 'The requested document was not found.';
    case 'firestore/already-exists':
      return 'A document with this ID already exists.';

    // Storage errors
    case 'storage/unauthorized':
      return 'You are not authorized to perform this action.';
    case 'storage/canceled':
      return 'Upload was canceled.';
    case 'storage/unknown':
      return 'An unknown error occurred during upload.';
    case 'storage/object-not-found':
      return 'File not found.';
    case 'storage/quota-exceeded':
      return 'Storage quota exceeded.';

    default:
      return error?.message || 'An unexpected error occurred. Please try again.';
  }
};

// Firebase connection status with enhanced checks
export const isFirebaseConnected = (): boolean => {
  return browser && !!app && !!auth && !!db && !!storage;
};

// Firebase health check utility
export const checkFirebaseHealth = async (): Promise<{
  auth: boolean;
  firestore: boolean;
  storage: boolean;
}> => {
  const health = {
    auth: false,
    firestore: false,
    storage: false
  };

  if (!browser || !app) {
    return health;
  }

  try {
    // Check Auth
    health.auth = !!auth.currentUser || auth.currentUser === null;

    // Check Firestore
    const testDoc = doc(db, 'health', 'test');
    await getDoc(testDoc);
    health.firestore = true;

    // Check Storage
    const testRef = ref(storage, 'health/test.txt');
    // Just creating a reference doesn't throw, so we assume it's working
    health.storage = !!testRef;
  } catch (error) {
    console.warn('Firebase health check failed:', error);
  }

  return health;
};

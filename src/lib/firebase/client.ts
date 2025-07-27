/**
 * Firebase Client Configuration
 * Initialize Firebase app with authentication and Firestore
 */

import { browser } from '$app/environment';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingConfig.length > 0) {
  console.error('Missing Firebase configuration:', missingConfig);
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

if (browser) {
  try {
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize services
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    
    // Connect to emulators in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
      
      try {
        // Connect Auth emulator
        connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
        
        // Connect Firestore emulator
        connectFirestoreEmulator(firestore, emulatorHost, 8080);
        
        // Connect Storage emulator
        connectStorageEmulator(storage, emulatorHost, 9199);
        
        console.log('🔧 Connected to Firebase emulators');
      } catch (error) {
        console.warn('Failed to connect to Firebase emulators:', error);
      }
    }
    
    console.log('🔥 Firebase initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
} else {
  // Server-side: create placeholder objects
  app = {} as FirebaseApp;
  auth = {} as Auth;
  firestore = {} as Firestore;
  storage = {} as FirebaseStorage;
}

// Export initialized services
export { app, auth, firestore, storage };

// Export configuration for debugging
export const config = firebaseConfig;

// Helper function to check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  return browser && !!app && !!auth && !!firestore;
}

// Helper function to get current user safely
export function getCurrentUser() {
  if (!browser || !auth) return null;
  return auth.currentUser;
}

// Helper function to wait for auth to be ready
export function waitForAuth(): Promise<void> {
  return new Promise((resolve) => {
    if (!browser || !auth) {
      resolve();
      return;
    }
    
    const unsubscribe = auth.onAuthStateChanged(() => {
      unsubscribe();
      resolve();
    });
  });
}

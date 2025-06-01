import { browser } from '$app/environment';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { logFirebaseConfigStatus } from '$lib/utils/firebaseValidator';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF123'
};

// Initialize Firebase for the browser
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

if (browser) {
  // Log configuration status for debugging
  logFirebaseConfigStatus();

  // Initialize Firebase
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Initialize Firebase services
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);

  // Connect to emulators if enabled
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    console.log('🔧 Connecting to Firebase emulators...');

    // Connect to Auth emulator
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('✅ Connected to Auth emulator');
    } catch (error) {
      console.log('⚠️ Auth emulator already connected or failed to connect');
    }

    // Connect to Firestore emulator
    try {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
      console.log('✅ Connected to Firestore emulator');
    } catch (error) {
      console.log('⚠️ Firestore emulator already connected or failed to connect');
    }

    // Connect to Storage emulator
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('✅ Connected to Storage emulator');
    } catch (error) {
      console.log('⚠️ Storage emulator already connected or failed to connect');
    }
  }
}

export { firebaseApp, auth, firestore, storage };

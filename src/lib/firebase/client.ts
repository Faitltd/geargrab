import { browser } from '$app/environment';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig, emulatorConfig, logFirebaseConfigStatus } from './config';

// Initialize Firebase for the browser
let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (browser) {
  try {
    console.log('🔥 Starting Firebase initialization...');

    // Log configuration status for debugging
    logFirebaseConfigStatus();

    // Initialize Firebase app
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    console.log('✅ Firebase app initialized:', firebaseApp.name);

    // Initialize Firebase services
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);
    console.log('✅ Firebase services initialized');

    // Connect to emulators if enabled
    if (emulatorConfig.useEmulators) {
      console.log('🔧 Connecting to Firebase emulators...');

      // Connect to Auth emulator
      try {
        connectAuthEmulator(auth, `http://${emulatorConfig.auth.host}:${emulatorConfig.auth.port}`, { disableWarnings: true });
        console.log('✅ Connected to Auth emulator');
      } catch (error) {
        console.log('⚠️ Auth emulator already connected or failed to connect');
      }

      // Connect to Firestore emulator
      try {
        connectFirestoreEmulator(firestore, emulatorConfig.firestore.host, emulatorConfig.firestore.port);
        console.log('✅ Connected to Firestore emulator');
      } catch (error) {
        console.log('⚠️ Firestore emulator already connected or failed to connect');
      }

      // Connect to Storage emulator
      try {
        connectStorageEmulator(storage, emulatorConfig.storage.host, emulatorConfig.storage.port);
        console.log('✅ Connected to Storage emulator');
      } catch (error) {
        console.log('⚠️ Storage emulator already connected or failed to connect');
      }
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
} else {
  console.log('🔧 Not in browser environment - skipping Firebase initialization');
}

// Export Firebase services
export { firebaseApp, auth, firestore, storage };

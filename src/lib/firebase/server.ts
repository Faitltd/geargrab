import { dev } from '$app/environment';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { firebaseAdminConfig, validateFirebaseAdminConfig } from './config';

// Firebase Admin configuration
let adminApp: App;
let adminAuth: Auth;
let adminFirestore: Firestore;
let adminStorage: Storage;

// Initialize Firebase Admin SDK
try {
  if (getApps().length === 0) {
    // Check if we have valid credentials
    if (validateFirebaseAdminConfig()) {
      adminApp = initializeApp({
        credential: cert({
          projectId: firebaseAdminConfig.projectId,
          clientEmail: firebaseAdminConfig.clientEmail!,
          privateKey: firebaseAdminConfig.privateKey!
        }),
        storageBucket: `${firebaseAdminConfig.projectId}.appspot.com`
      });

      // Initialize services
      adminAuth = getAuth(adminApp);
      adminFirestore = getFirestore(adminApp);
      adminStorage = getStorage(adminApp);

      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.log('⚠️ Firebase Admin credentials not found, skipping server-side initialization');
      console.log('This is normal for development when using client-side Firebase only');

      // Create placeholder objects to prevent errors
      adminApp = null as any;
      adminAuth = null as any;
      adminFirestore = null as any;
      adminStorage = null as any;
    }
  } else {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminFirestore = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  console.log('⚠️ Continuing without server-side Firebase (client-side will still work)');

  // Create placeholder objects to prevent errors
  adminApp = null as any;
  adminAuth = null as any;
  adminFirestore = null as any;
  adminStorage = null as any;
}

// Export Firebase Admin services with safe fallbacks
export { adminApp, adminAuth, adminFirestore, adminStorage };

// Helper function to check if Firebase Admin is available
export function isFirebaseAdminAvailable(): boolean {
  return adminApp !== null && adminFirestore !== null;
}

// Safe wrapper for Firestore operations
export function safeAdminFirestore() {
  if (!adminFirestore) {
    throw new Error('Firebase Admin not initialized - server-side operations not available');
  }
  return adminFirestore;
}

// Safe wrapper for Auth operations
export function safeAdminAuth() {
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized - server-side auth operations not available');
  }
  return adminAuth;
}

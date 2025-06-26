// Firebase Admin SDK for server-side operations
// This file provides admin access to Firestore for server-side API routes

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, Timestamp } from 'firebase-admin/firestore';
import { dev } from '$app/environment';

let adminApp: App | null = null;
let adminFirestoreInstance: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 * Only initializes if not already initialized
 */
function initializeFirebaseAdmin(): App | null {
  try {
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      return adminApp;
    }

    // In development or if no service account key, return null
    if (dev || !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('🔧 Firebase Admin not available - missing service account key or in development mode');
      return null;
    }

    // Parse service account key
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      console.error('❌ Failed to parse Firebase service account key:', error);
      return null;
    }

    // Initialize admin app
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: 'geargrabco'
    });

    console.log('✅ Firebase Admin initialized successfully');
    return adminApp;

  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    return null;
  }
}

/**
 * Get Firebase Admin Firestore instance
 */
function getAdminFirestore(): Firestore | null {
  try {
    if (!adminFirestoreInstance) {
      const app = initializeFirebaseAdmin();
      if (!app) {
        return null;
      }
      adminFirestoreInstance = getFirestore(app);
    }
    return adminFirestoreInstance;
  } catch (error) {
    console.error('❌ Failed to get admin Firestore:', error);
    return null;
  }
}

/**
 * Check if Firebase Admin is available
 */
export function isFirebaseAdminAvailable(): boolean {
  return getAdminFirestore() !== null;
}

/**
 * Get admin Firestore instance with fallback
 */
export const adminFirestore = new Proxy({} as Firestore & { Timestamp: typeof Timestamp }, {
  get(target, prop) {
    // Handle Timestamp property specially
    if (prop === 'Timestamp') {
      return Timestamp;
    }
    
    const firestore = getAdminFirestore();
    if (!firestore) {
      // Return a mock object that throws helpful errors
      if (typeof prop === 'string' && ['collection', 'doc', 'batch'].includes(prop)) {
        return () => {
          throw new Error(`Firebase Admin not available - cannot call ${prop}(). Check service account configuration.`);
        };
      }
      throw new Error('Firebase Admin not available - check service account configuration');
    }
    return firestore[prop as keyof Firestore];
  }
});

/**
 * Get admin app instance
 */
export function getAdminApp(): App | null {
  return initializeFirebaseAdmin();
}

// Initialize on module load (but don't throw if it fails)
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.log('🔧 Firebase Admin initialization deferred:', error.message);
}

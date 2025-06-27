import { dev } from '$app/environment';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

// Try to import config, but don't fail if it doesn't exist
let firebaseAdminConfig: any = null;
let validateFirebaseAdminConfig: any = null;

try {
  const configModule = await import('./config');
  firebaseAdminConfig = configModule.firebaseAdminConfig;
  validateFirebaseAdminConfig = configModule.validateFirebaseAdminConfig;
} catch (error) {
  // Config module doesn't exist, we'll use environment variables directly
}
let adminApp: App;
let adminAuth: Auth;
let adminFirestore: Firestore;
let adminStorage: Storage;
let isAdminInitialized = false;

// Initialize Firebase Admin SDK
try {
  if (getApps().length === 0) {
    let shouldInitialize = false;
    let credentials: any = null;

    // Try config-based approach first
    if (validateFirebaseAdminConfig && validateFirebaseAdminConfig()) {
      shouldInitialize = true;
      credentials = {
        projectId: firebaseAdminConfig.projectId,
        clientEmail: firebaseAdminConfig.clientEmail!,
        privateKey: firebaseAdminConfig.privateKey!
      };
    }
    // Fallback to environment variables
    else {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

      console.log('🔍 Firebase Admin environment check:', {
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        projectId,
        clientEmail: clientEmail?.substring(0, 30) + '...',
        privateKeyLength: privateKey?.length
      });

      if (projectId && clientEmail && privateKey) {
        shouldInitialize = true;
        credentials = { projectId, clientEmail, privateKey };
        console.log('✅ Firebase Admin credentials found, will initialize');
      } else if (dev) {
        // For development, use demo project
        shouldInitialize = true;
        credentials = { projectId: 'demo-project' };
        console.log('🔧 Development mode: using demo project');
      } else {
        console.log('❌ Missing Firebase Admin credentials:', {
          projectId: !!projectId,
          clientEmail: !!clientEmail,
          privateKey: !!privateKey
        });
      }
    }

    if (shouldInitialize && credentials) {
      if (credentials.projectId === 'demo-project') {
        adminApp = initializeApp({
          projectId: 'demo-project'
        });
      } else {
        adminApp = initializeApp({
          credential: cert(credentials),
          storageBucket: `${credentials.projectId}.appspot.com`
        });
      }

      // Initialize services
      adminAuth = getAuth(adminApp);
      adminFirestore = getFirestore(adminApp);
      adminStorage = getStorage(adminApp);
      isAdminInitialized = true;

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
    isAdminInitialized = true;
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  console.log('⚠️ Continuing without server-side Firebase (client-side will still work)');

  // Create safe fallback objects that will throw meaningful errors
  const createErrorProxy = (serviceName: string) => new Proxy({}, {
    get() {
      throw new Error(`Firebase Admin ${serviceName} is not properly initialized. Check your environment variables.`);
    }
  });

  adminAuth = createErrorProxy('Auth') as Auth;
  adminFirestore = createErrorProxy('Firestore') as Firestore;
  adminStorage = createErrorProxy('Storage') as Storage;
  adminApp = createErrorProxy('App') as App;
}

// Export Firebase Admin services with safe fallbacks
export { adminApp, adminAuth, adminFirestore, adminStorage, isAdminInitialized };

// Helper function to check if Firebase Admin is available
export function isFirebaseAdminAvailable(): boolean {
  return isAdminInitialized && adminApp !== null && adminFirestore !== null && adminApp !== undefined;
}

// Safe wrapper for Firestore operations
export function safeAdminFirestore() {
  if (!adminFirestore || !isFirebaseAdminAvailable()) {
    throw new Error('Firebase Admin not initialized - server-side operations not available');
  }
  return adminFirestore;
}

// Safe wrapper for Auth operations
export function safeAdminAuth() {
  if (!adminAuth || !isFirebaseAdminAvailable()) {
    throw new Error('Firebase Admin not initialized - server-side auth operations not available');
  }
  return adminAuth;
}

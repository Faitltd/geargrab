import { dev } from '$app/environment';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminFirestore: Firestore;
let adminStorage: Storage;

// Initialize Firebase Admin SDK
try {
  // Only initialize if not already initialized
  if (getApps().length === 0) {
    if (dev) {
      // For development, use emulator or demo project
      adminApp = initializeApp({
        projectId: 'demo-project'
      });
    } else {
      // For production, use environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase Admin credentials. Please check environment variables.');
      }

      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        }),
        storageBucket: `${projectId}.appspot.com`
      });
    }
  } else {
    adminApp = getApps()[0];
  }

  // Initialize services
  adminAuth = getAuth(adminApp);
  adminFirestore = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);

} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);

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

export { adminApp, adminAuth, adminFirestore, adminStorage };

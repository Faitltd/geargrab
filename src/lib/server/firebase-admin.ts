// Firebase Admin SDK Setup
// Server-side Firebase initialization with service account authentication

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { config } from '$lib/config/production';
import { logger } from './logging';

// Admin SDK instances
let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminFirestore: Firestore | null = null;
let adminStorage: Storage | null = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin(): App {
  try {
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      logger.info('Firebase Admin SDK already initialized');
      return existingApps[0];
    }

    // Validate required configuration
    if (!config.firebase.projectId) {
      throw new Error('Firebase project ID is required');
    }

    if (!config.firebase.clientEmail || !config.firebase.privateKey) {
      throw new Error('Firebase service account credentials are required');
    }

    // Initialize with service account
    const app = initializeApp({
      credential: cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey
      }),
      projectId: config.firebase.projectId,
      storageBucket: config.firebase.storageBucket,
      databaseURL: config.firebase.databaseURL
    });

    logger.info('Firebase Admin SDK initialized successfully', {
      projectId: config.firebase.projectId,
      storageBucket: config.firebase.storageBucket
    });

    return app;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK', { error });
    throw error;
  }
}

/**
 * Get Firebase Admin App instance
 */
export function getAdminApp(): App {
  if (!adminApp) {
    adminApp = initializeFirebaseAdmin();
  }
  return adminApp;
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const app = getAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminFirestore(): Firestore {
  if (!adminFirestore) {
    const app = getAdminApp();
    adminFirestore = getFirestore(app);
    
    // Configure Firestore settings
    adminFirestore.settings({
      ignoreUndefinedProperties: true
    });
  }
  return adminFirestore;
}

/**
 * Get Firebase Admin Storage instance
 */
export function getAdminStorage(): Storage {
  if (!adminStorage) {
    const app = getAdminApp();
    adminStorage = getStorage(app);
  }
  return adminStorage;
}

/**
 * Verify Firebase ID token
 */
export async function verifyIdToken(idToken: string): Promise<{
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  [key: string]: any;
}> {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    logger.debug('ID token verified successfully', {
      uid: decodedToken.uid,
      email: decodedToken.email
    });

    return decodedToken;
  } catch (error) {
    logger.error('Failed to verify ID token', { error });
    throw new Error('Invalid authentication token');
  }
}

/**
 * Create custom token for user
 */
export async function createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
  try {
    const auth = getAdminAuth();
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    
    logger.debug('Custom token created successfully', { uid });
    
    return customToken;
  } catch (error) {
    logger.error('Failed to create custom token', { error, uid });
    throw new Error('Failed to create authentication token');
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string) {
  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUser(uid);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      },
      customClaims: userRecord.customClaims || {}
    };
  } catch (error) {
    logger.error('Failed to get user by UID', { error, uid });
    throw new Error('User not found');
  }
}

/**
 * Update user custom claims
 */
export async function setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, customClaims);
    
    logger.info('Custom claims updated successfully', { uid, customClaims });
  } catch (error) {
    logger.error('Failed to set custom claims', { error, uid, customClaims });
    throw new Error('Failed to update user permissions');
  }
}

/**
 * Delete user account
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    const auth = getAdminAuth();
    await auth.deleteUser(uid);
    
    logger.info('User deleted successfully', { uid });
  } catch (error) {
    logger.error('Failed to delete user', { error, uid });
    throw new Error('Failed to delete user account');
  }
}

/**
 * Batch get users
 */
export async function getUsers(uids: string[]) {
  try {
    const auth = getAdminAuth();
    const getUsersResult = await auth.getUsers(uids.map(uid => ({ uid })));
    
    return {
      users: getUsersResult.users.map(user => ({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        disabled: user.disabled
      })),
      notFound: getUsersResult.notFound.map(userIdentifier => userIdentifier.uid)
    };
  } catch (error) {
    logger.error('Failed to batch get users', { error, uids });
    throw new Error('Failed to retrieve users');
  }
}

/**
 * Firestore transaction helper
 */
export async function runTransaction<T>(
  updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  try {
    const firestore = getAdminFirestore();
    return await firestore.runTransaction(updateFunction);
  } catch (error) {
    logger.error('Transaction failed', { error });
    throw error;
  }
}

/**
 * Firestore batch write helper
 */
export function createBatch(): FirebaseFirestore.WriteBatch {
  const firestore = getAdminFirestore();
  return firestore.batch();
}

/**
 * Upload file to Firebase Storage
 */
export async function uploadFile(
  filePath: string,
  buffer: Buffer,
  metadata?: { [key: string]: string }
): Promise<string> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        metadata: metadata || {}
      }
    });

    // Make file publicly readable
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    logger.info('File uploaded successfully', { filePath, publicUrl });
    
    return publicUrl;
  } catch (error) {
    logger.error('Failed to upload file', { error, filePath });
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete file from Firebase Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    await file.delete();
    
    logger.info('File deleted successfully', { filePath });
  } catch (error) {
    logger.error('Failed to delete file', { error, filePath });
    throw new Error('Failed to delete file');
  }
}

/**
 * Health check for Firebase Admin SDK
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  services: {
    auth: boolean;
    firestore: boolean;
    storage: boolean;
  };
  error?: string;
}> {
  try {
    const results = await Promise.allSettled([
      // Test Auth
      getAdminAuth().listUsers(1),
      
      // Test Firestore
      getAdminFirestore().collection('_health').limit(1).get(),
      
      // Test Storage
      getAdminStorage().bucket().exists()
    ]);

    const services = {
      auth: results[0].status === 'fulfilled',
      firestore: results[1].status === 'fulfilled',
      storage: results[2].status === 'fulfilled'
    };

    const allHealthy = Object.values(services).every(Boolean);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      services
    };
  } catch (error) {
    logger.error('Firebase health check failed', { error });
    
    return {
      status: 'unhealthy',
      services: {
        auth: false,
        firestore: false,
        storage: false
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Initialize Firebase Admin SDK on module load
if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
  try {
    getAdminApp();
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK on startup', { error });
  }
}

export {
  adminApp,
  adminAuth,
  adminFirestore,
  adminStorage
};

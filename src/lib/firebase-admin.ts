import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import {
  FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID,
  FIREBASE_AUTH_URI,
  FIREBASE_TOKEN_URI
} from '$env/static/private';
import {
  PUBLIC_FIREBASE_PROJECT_ID
} from '$env/static/public';

// Firebase Admin configuration
const serviceAccount = {
  type: 'service_account',
  project_id: PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: FIREBASE_PRIVATE_KEY_ID,
  private_key: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: FIREBASE_CLIENT_EMAIL,
  client_id: FIREBASE_CLIENT_ID,
  auth_uri: FIREBASE_AUTH_URI,
  token_uri: FIREBASE_TOKEN_URI,
  universe_domain: 'googleapis.com'
};

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

// Initialize Firebase Admin SDK
try {
  adminApp = initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: `${PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
  });
  
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
} catch (error) {
  console.warn('Firebase Admin SDK initialization failed:', error);
}

// Export Firebase Admin services
export { adminAuth, adminDb, adminStorage };

// Utility function to verify Firebase ID tokens
export const verifyIdToken = async (idToken: string) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid authentication token');
  }
};

// Utility function to get user by UID
export const getUserByUid = async (uid: string) => {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('User not found');
  }
};

// Utility function to create custom token
export const createCustomToken = async (uid: string, additionalClaims?: object) => {
  try {
    const customToken = await adminAuth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new Error('Failed to create authentication token');
  }
};

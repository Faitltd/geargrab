import admin from 'firebase-admin';

type AdminFirestore = admin.firestore.Firestore & {
  Timestamp: typeof admin.firestore.Timestamp;
  FieldValue: typeof admin.firestore.FieldValue;
};

let adminApp: admin.app.App | null = null;

function loadServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️ Firebase Admin credentials are not fully configured. Some server features will be disabled.');
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

export function initializeFirebaseAdmin() {
  if (adminApp) return adminApp;

  if (admin.apps.length > 0) {
    adminApp = admin.app();
    return adminApp;
  }

  const credentials = loadServiceAccount();
  if (!credentials) {
    return null;
  }

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    adminApp = null;
  }

  return adminApp;
}

const app = initializeFirebaseAdmin();

let firestore: AdminFirestore | null = null;
let auth: admin.auth.Auth | null = null;
let storage: admin.storage.Storage | null = null;

if (app) {
  firestore = Object.assign(admin.firestore(app), {
    Timestamp: admin.firestore.Timestamp,
    FieldValue: admin.firestore.FieldValue
  });
  auth = admin.auth(app);
  storage = admin.storage(app);
}

export { admin };
export const adminFirestore = firestore;
export const adminAuth = auth;
export const adminStorage = storage;
export const adminBucket = storage?.bucket();
export const adminAppInstance = app;

export const isFirebaseAdminAvailable = () => !!adminApp;

/**
 * Firebase Admin SDK Configuration
 * Server-side Firebase authentication and services
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if Firebase is already initialized
  firebaseApp = admin.app();
} catch (error) {
  // Initialize Firebase Admin SDK
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // Validate required configuration
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    console.warn('⚠️  Firebase Admin SDK not configured. Firebase token verification will be disabled.');
    firebaseApp = null;
  } else {
    try {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      
      console.log('🔥 Firebase Admin SDK initialized successfully');
    } catch (initError) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', initError.message);
      firebaseApp = null;
    }
  }
}

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<object>} - Decoded token
 */
async function verifyFirebaseToken(idToken) {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error('Invalid Firebase token');
  }
}

/**
 * Get user by Firebase UID
 * @param {string} uid - Firebase user UID
 * @returns {Promise<object>} - User record
 */
async function getFirebaseUser(uid) {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Failed to get Firebase user:', error.message);
    throw new Error('User not found');
  }
}

/**
 * Create custom token for user
 * @param {string} uid - Firebase user UID
 * @param {object} additionalClaims - Additional claims to include
 * @returns {Promise<string>} - Custom token
 */
async function createCustomToken(uid, additionalClaims = {}) {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Failed to create custom token:', error.message);
    throw new Error('Token creation failed');
  }
}

/**
 * Update user claims
 * @param {string} uid - Firebase user UID
 * @param {object} customClaims - Custom claims to set
 * @returns {Promise<void>}
 */
async function setCustomUserClaims(uid, customClaims) {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    await admin.auth().setCustomUserClaims(uid, customClaims);
  } catch (error) {
    console.error('Failed to set custom user claims:', error.message);
    throw new Error('Failed to update user claims');
  }
}

/**
 * Send email verification
 * @param {string} email - User email
 * @returns {Promise<string>} - Verification link
 */
async function generateEmailVerificationLink(email) {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    const link = await admin.auth().generateEmailVerificationLink(email);
    return link;
  } catch (error) {
    console.error('Failed to generate email verification link:', error.message);
    throw new Error('Failed to generate verification link');
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<string>} - Password reset link
 */
async function generatePasswordResetLink(email) {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    const link = await admin.auth().generatePasswordResetLink(email);
    return link;
  } catch (error) {
    console.error('Failed to generate password reset link:', error.message);
    throw new Error('Failed to generate reset link');
  }
}

/**
 * Check if Firebase Admin is available
 * @returns {boolean}
 */
function isFirebaseAdminAvailable() {
  return !!firebaseApp;
}

module.exports = {
  admin,
  firebaseApp,
  verifyFirebaseToken,
  getFirebaseUser,
  createCustomToken,
  setCustomUserClaims,
  generateEmailVerificationLink,
  generatePasswordResetLink,
  isFirebaseAdminAvailable
};

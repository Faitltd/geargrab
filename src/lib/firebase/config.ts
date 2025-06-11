// Centralized Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF123'
};

// Firebase Admin configuration for server-side ONLY
// NOTE: This should only be used in server-side code, never in client-side code
export const firebaseAdminConfig = {
  projectId: typeof process !== 'undefined' ? process.env.FIREBASE_PROJECT_ID || 'geargrabco' : 'geargrabco',
  clientEmail: typeof process !== 'undefined' ? process.env.FIREBASE_ADMIN_CLIENT_EMAIL : undefined,
  privateKey: typeof process !== 'undefined' ? process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') : undefined
};

// Emulator configuration
export const emulatorConfig = {
  useEmulators: import.meta.env.VITE_USE_EMULATORS === 'true',
  auth: {
    host: 'localhost',
    port: 9099
  },
  firestore: {
    host: 'localhost',
    port: 8080
  },
  storage: {
    host: 'localhost',
    port: 9199
  }
};

// Validation helpers
export function validateFirebaseConfig(): boolean {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  
  for (const field of requiredFields) {
    if (!firebaseConfig[field as keyof typeof firebaseConfig] || 
        firebaseConfig[field as keyof typeof firebaseConfig] === `demo-${field}` ||
        firebaseConfig[field as keyof typeof firebaseConfig] === 'demo-key' ||
        firebaseConfig[field as keyof typeof firebaseConfig] === 'demo.firebaseapp.com' ||
        firebaseConfig[field as keyof typeof firebaseConfig] === 'demo-project' ||
        firebaseConfig[field as keyof typeof firebaseConfig] === 'demo.appspot.com' ||
        firebaseConfig[field as keyof typeof firebaseConfig] === '123456789' ||
        firebaseConfig[field as keyof typeof firebaseConfig] === '1:123456789:web:abcdef') {
      console.warn(`⚠️ Firebase config field '${field}' is missing or using demo value`);
      return false;
    }
  }
  
  return true;
}

export function validateFirebaseAdminConfig(): boolean {
  // Only validate admin config in server environment
  if (typeof process === 'undefined') {
    return false; // Not in server environment
  }
  return !!(firebaseAdminConfig.projectId &&
           firebaseAdminConfig.clientEmail &&
           firebaseAdminConfig.privateKey);
}

// Debug logging
export function logFirebaseConfigStatus(): void {
  console.log('🔥 Firebase Configuration Status:');
  console.log('Client Config:', {
    apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId?.substring(0, 20) + '...',
    valid: validateFirebaseConfig()
  });
  
  if (typeof process !== 'undefined') {
    console.log('Admin Config:', {
      projectId: firebaseAdminConfig.projectId,
      clientEmail: firebaseAdminConfig.clientEmail?.substring(0, 20) + '...',
      privateKey: firebaseAdminConfig.privateKey ? 'Present' : 'Missing',
      valid: validateFirebaseAdminConfig()
    });
  }
  
  if (emulatorConfig.useEmulators) {
    console.log('🔧 Emulator mode enabled');
  }
}

/**
 * Firebase Configuration Validator
 * Helps debug Firebase setup issues
 */

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFirebaseConfig(config: FirebaseConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check API Key
  if (!config.apiKey || config.apiKey === 'your-api-key' || config.apiKey === 'demo-key') {
    errors.push('API Key is missing or using placeholder value');
  } else if (!config.apiKey.startsWith('AIzaSy')) {
    warnings.push('API Key format looks unusual (should start with "AIzaSy")');
  }

  // Check Auth Domain
  if (!config.authDomain || config.authDomain.includes('your-project-id') || config.authDomain === 'demo.firebaseapp.com') {
    errors.push('Auth Domain is missing or using placeholder value');
  } else if (!config.authDomain.endsWith('.firebaseapp.com')) {
    warnings.push('Auth Domain should end with ".firebaseapp.com"');
  }

  // Check Project ID
  if (!config.projectId || config.projectId === 'your-project-id' || config.projectId === 'demo-project') {
    errors.push('Project ID is missing or using placeholder value');
  }

  // Check Storage Bucket
  if (!config.storageBucket || config.storageBucket.includes('your-project-id') || config.storageBucket === 'demo.appspot.com') {
    errors.push('Storage Bucket is missing or using placeholder value');
  } else if (!config.storageBucket.endsWith('.appspot.com')) {
    warnings.push('Storage Bucket should end with ".appspot.com"');
  }

  // Check Messaging Sender ID
  if (!config.messagingSenderId || config.messagingSenderId === 'your-messaging-sender-id' || config.messagingSenderId === '123456789') {
    errors.push('Messaging Sender ID is missing or using placeholder value');
  } else if (!/^\d+$/.test(config.messagingSenderId)) {
    warnings.push('Messaging Sender ID should be numeric');
  }

  // Check App ID
  if (!config.appId || config.appId === 'your-app-id' || config.appId === '1:123456789:web:abcdef') {
    errors.push('App ID is missing or using placeholder value');
  } else if (!config.appId.startsWith('1:')) {
    warnings.push('App ID format looks unusual (should start with "1:")');
  }

  // Check Measurement ID (optional)
  if (config.measurementId && !config.measurementId.startsWith('G-')) {
    warnings.push('Measurement ID should start with "G-"');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function logFirebaseConfigStatus(): void {
  if (typeof window === 'undefined') return; // Server-side

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };

  const validation = validateFirebaseConfig(config);

  console.group('🔥 Firebase Configuration Status');
  
  if (validation.isValid) {
    console.log('✅ Firebase configuration appears valid');
  } else {
    console.error('❌ Firebase configuration has issues');
  }

  if (validation.errors.length > 0) {
    console.group('❌ Errors (must fix):');
    validation.errors.forEach(error => console.error(`  • ${error}`));
    console.groupEnd();
  }

  if (validation.warnings.length > 0) {
    console.group('⚠️ Warnings (should check):');
    validation.warnings.forEach(warning => console.warn(`  • ${warning}`));
    console.groupEnd();
  }

  if (!validation.isValid) {
    console.log('📖 See FIREBASE_SETUP_GUIDE.md for setup instructions');
  }

  console.groupEnd();
}

export function getFirebaseConfigHelp(): string {
  return `
🔥 Firebase Setup Help:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project (or create new one)
3. Click gear icon → Project settings
4. Scroll to "Your apps" section
5. Click web app icon </>
6. Copy the configuration values to your .env file

Required environment variables:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN  
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

See FIREBASE_SETUP_GUIDE.md for detailed instructions.
  `.trim();
}

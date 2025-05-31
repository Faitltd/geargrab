#!/usr/bin/env node

/**
 * Firebase Environment Setup Script
 * Helps set up Firebase configuration interactively
 */

import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupFirebaseEnv() {
  console.log('🔥 Firebase Environment Setup for GearGrab\n');
  
  console.log('First, get your Firebase configuration:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Select your project (or create a new one)');
  console.log('3. Click the gear icon → Project settings');
  console.log('4. Scroll to "Your apps" section');
  console.log('5. Click the web app icon </>');
  console.log('6. Copy the configuration values\n');

  const config = {};

  console.log('Enter your Firebase configuration values:\n');

  config.apiKey = await question('API Key (starts with AIzaSy): ');
  config.authDomain = await question('Auth Domain (ends with .firebaseapp.com): ');
  config.projectId = await question('Project ID: ');
  config.storageBucket = await question('Storage Bucket (ends with .appspot.com): ');
  config.messagingSenderId = await question('Messaging Sender ID (numbers): ');
  config.appId = await question('App ID (starts with 1:): ');
  config.measurementId = await question('Measurement ID (optional, starts with G-): ');

  // Validate inputs
  const errors = [];
  
  if (!config.apiKey || !config.apiKey.startsWith('AIzaSy')) {
    errors.push('API Key should start with "AIzaSy"');
  }
  
  if (!config.authDomain || !config.authDomain.endsWith('.firebaseapp.com')) {
    errors.push('Auth Domain should end with ".firebaseapp.com"');
  }
  
  if (!config.projectId) {
    errors.push('Project ID is required');
  }
  
  if (!config.storageBucket || !config.storageBucket.endsWith('.appspot.com')) {
    errors.push('Storage Bucket should end with ".appspot.com"');
  }
  
  if (!config.messagingSenderId || !/^\d+$/.test(config.messagingSenderId)) {
    errors.push('Messaging Sender ID should be numeric');
  }
  
  if (!config.appId || !config.appId.startsWith('1:')) {
    errors.push('App ID should start with "1:"');
  }

  if (errors.length > 0) {
    console.log('\n❌ Configuration errors:');
    errors.forEach(error => console.log(`  • ${error}`));
    console.log('\nPlease check your values and try again.');
    rl.close();
    return;
  }

  // Create .env content
  const envContent = `# Firebase Configuration
VITE_FIREBASE_API_KEY=${config.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain}
VITE_FIREBASE_PROJECT_ID=${config.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
VITE_FIREBASE_APP_ID=${config.appId}
${config.measurementId ? `VITE_FIREBASE_MEASUREMENT_ID=${config.measurementId}` : '# VITE_FIREBASE_MEASUREMENT_ID='}

# Environment
VITE_USE_EMULATORS=false

# Add other environment variables as needed
# VITE_STRIPE_PUBLISHABLE_KEY=
# STRIPE_SECRET_KEY=
`;

  try {
    writeFileSync('.env', envContent);
    console.log('\n✅ Successfully created .env file!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Test authentication at /auth/login');
    console.log('3. Check browser console for any remaining errors');
    console.log('\nMake sure to:');
    console.log('• Enable Authentication in Firebase Console');
    console.log('• Set up Firestore Database');
    console.log('• Configure security rules');
    console.log('\nSee FIREBASE_SETUP_GUIDE.md for detailed instructions.');
  } catch (error) {
    console.error('\n❌ Error writing .env file:', error.message);
  }

  rl.close();
}

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
  console.log('\n\nSetup cancelled.');
  rl.close();
});

setupFirebaseEnv().catch(console.error);

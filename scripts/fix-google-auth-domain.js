#!/usr/bin/env node

/**
 * Google Auth Domain Configuration Fix
 * This script helps verify and provides instructions for fixing Google OAuth domain authorization
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Google Auth Domain Configuration Fix');
console.log('=====================================\n');

// Read environment variables
const envPath = join(__dirname, '..', '.env');
let firebaseConfig = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('VITE_FIREBASE_')) {
      const [key, value] = line.split('=');
      firebaseConfig[key] = value?.replace(/"/g, '');
    }
  });
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
}

console.log('📋 Current Firebase Configuration:');
console.log('Project ID:', firebaseConfig.VITE_FIREBASE_PROJECT_ID);
console.log('Auth Domain:', firebaseConfig.VITE_FIREBASE_AUTH_DOMAIN);
console.log('App ID:', firebaseConfig.VITE_FIREBASE_APP_ID);
console.log();

console.log('🔍 Issue: Domain not authorized for Google sign-in');
console.log('This happens when the production domain is not configured in Google OAuth settings.\n');

console.log('🛠️  SOLUTION - Follow these steps:');
console.log();

console.log('1️⃣  UPDATE GOOGLE CLOUD CONSOLE:');
console.log('   → Go to: https://console.cloud.google.com/apis/credentials');
console.log('   → Select project: geargrabco');
console.log('   → Find your OAuth 2.0 Client ID');
console.log('   → Add to "Authorized JavaScript origins":');
console.log('     • https://geargrab.co');
console.log('     • https://www.geargrab.co');
console.log('   → Add to "Authorized redirect URIs":');
console.log('     • https://geargrab.co/__/auth/handler');
console.log('     • https://www.geargrab.co/__/auth/handler');
console.log();

console.log('2️⃣  UPDATE FIREBASE AUTH:');
console.log('   → Go to: https://console.firebase.google.com/project/geargrabco/authentication/settings');
console.log('   → Under "Authorized domains", add:');
console.log('     • geargrab.co');
console.log('     • www.geargrab.co');
console.log();

console.log('3️⃣  VERIFY CONFIGURATION:');
console.log('   → Wait 5-10 minutes for changes to propagate');
console.log('   → Test Google sign-in on: https://geargrab.co/auth/login');
console.log();

console.log('📝 Additional Notes:');
console.log('   • Changes may take up to 10 minutes to take effect');
console.log('   • Clear browser cache if issues persist');
console.log('   • Ensure both www and non-www domains are added');
console.log();

console.log('🔗 Quick Links:');
console.log('   Google Cloud Console: https://console.cloud.google.com/apis/credentials');
console.log('   Firebase Console: https://console.firebase.google.com/project/geargrabco/authentication/settings');
console.log('   Test Login: https://geargrab.co/auth/login');
console.log();

console.log('✅ Once configured, Google sign-in will work on your production domain!');

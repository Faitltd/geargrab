#!/usr/bin/env node

/**
 * Google Authentication Configuration Verification Script
 * 
 * This script helps verify that Google authentication is properly configured
 * for the GearGrab application.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Google Authentication Configuration Verification\n');

// Check environment variables
function checkEnvironmentVariables() {
  console.log('📋 Checking Environment Variables...');
  
  const envPath = join(process.cwd(), '.env');
  let envContent;
  
  try {
    envContent = readFileSync(envPath, 'utf8');
  } catch (error) {
    console.error('❌ .env file not found');
    return false;
  }

  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  let allPresent = true;

  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (match && match[1] && match[1] !== 'your-value-here') {
      console.log(`✅ ${varName}: ${match[1].substring(0, 20)}...`);
    } else {
      console.log(`❌ ${varName}: Missing or placeholder value`);
      allPresent = false;
    }
  });

  return allPresent;
}

// Check Firebase configuration
function checkFirebaseConfig() {
  console.log('\n🔥 Checking Firebase Configuration...');
  
  const configPath = join(process.cwd(), 'src/lib/firebase/client.ts');
  let configContent;
  
  try {
    configContent = readFileSync(configPath, 'utf8');
  } catch (error) {
    console.error('❌ Firebase client configuration not found');
    return false;
  }

  // Check if GoogleAuthProvider is imported
  if (configContent.includes('GoogleAuthProvider')) {
    console.log('✅ GoogleAuthProvider import found');
  } else {
    console.log('⚠️ GoogleAuthProvider import not found in client config');
  }

  return true;
}

// Check auth implementation
function checkAuthImplementation() {
  console.log('\n🔐 Checking Authentication Implementation...');
  
  const authPath = join(process.cwd(), 'src/lib/firebase/auth.ts');
  let authContent;
  
  try {
    authContent = readFileSync(authPath, 'utf8');
  } catch (error) {
    console.error('❌ Auth implementation not found');
    return false;
  }

  const checks = [
    { name: 'signInWithGoogle function', pattern: /export.*signInWithGoogle/ },
    { name: 'GoogleAuthProvider usage', pattern: /new GoogleAuthProvider/ },
    { name: 'signInWithPopup usage', pattern: /signInWithPopup/ },
    { name: 'Error handling', pattern: /catch.*error/ },
    { name: 'Browser check', pattern: /if.*!browser/ }
  ];

  let allChecksPass = true;

  checks.forEach(check => {
    if (check.pattern.test(authContent)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allChecksPass = false;
    }
  });

  return allChecksPass;
}

// Check login/signup pages
function checkAuthPages() {
  console.log('\n📄 Checking Authentication Pages...');
  
  const pages = [
    { name: 'Login Page', path: 'src/routes/auth/login/+page.svelte' },
    { name: 'Signup Page', path: 'src/routes/auth/signup/+page.svelte' }
  ];

  let allPagesOk = true;

  pages.forEach(page => {
    const pagePath = join(process.cwd(), page.path);
    
    try {
      const pageContent = readFileSync(pagePath, 'utf8');
      
      if (pageContent.includes('handleGoogleSignIn') && pageContent.includes('signInWithGoogle')) {
        console.log(`✅ ${page.name}: Google auth implementation found`);
      } else {
        console.log(`❌ ${page.name}: Google auth implementation missing`);
        allPagesOk = false;
      }
    } catch (error) {
      console.log(`❌ ${page.name}: File not found`);
      allPagesOk = false;
    }
  });

  return allPagesOk;
}

// Provide recommendations
function provideRecommendations() {
  console.log('\n💡 Configuration Recommendations:');
  console.log('');
  console.log('1. Firebase Console Checklist:');
  console.log('   • Enable Google provider in Authentication > Sign-in method');
  console.log('   • Add authorized domains: localhost, geargrabco.firebaseapp.com');
  console.log('   • Verify project settings match your .env file');
  console.log('');
  console.log('2. Google Cloud Console Checklist:');
  console.log('   • Configure OAuth consent screen');
  console.log('   • Set authorized JavaScript origins');
  console.log('   • Set authorized redirect URIs');
  console.log('   • Add test users if app is in testing mode');
  console.log('');
  console.log('3. Testing:');
  console.log('   • Use the debug panel: http://localhost:5173/debug/auth');
  console.log('   • Check browser console for detailed errors');
  console.log('   • Test in incognito mode to avoid cache issues');
  console.log('');
  console.log('4. Common Issues:');
  console.log('   • Popup blockers preventing sign-in');
  console.log('   • Incorrect redirect URIs');
  console.log('   • App not verified (add test users)');
  console.log('   • Domain not authorized');
}

// Main verification function
function main() {
  let overallStatus = true;

  overallStatus &= checkEnvironmentVariables();
  overallStatus &= checkFirebaseConfig();
  overallStatus &= checkAuthImplementation();
  overallStatus &= checkAuthPages();

  console.log('\n' + '='.repeat(50));
  
  if (overallStatus) {
    console.log('🎉 All checks passed! Google authentication should work.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Visit: http://localhost:5173/debug/auth');
    console.log('3. Test Google authentication');
  } else {
    console.log('⚠️ Some issues found. Please review the checklist above.');
  }

  provideRecommendations();
}

// Run the verification
main();

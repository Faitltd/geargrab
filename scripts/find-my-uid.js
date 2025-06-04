#!/usr/bin/env node

/**
 * Script to find your Firebase Auth UID
 * Usage: node scripts/find-my-uid.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { config } from 'dotenv';
import readline from 'readline';

// Load environment variables
config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function findMyUID() {
  try {
    console.log('🔍 Find Your Firebase UID');
    console.log('==========================\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const email = await question('Enter your email: ');
    const password = await question('Enter your password: ');
    
    console.log('\n🔄 Signing in...');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('\n✅ Success! Here are your details:');
    console.log('================================');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 UID: ${user.uid}`);
    console.log(`👤 Display Name: ${user.displayName || 'Not set'}`);
    console.log('\n📋 To make yourself an admin, run:');
    console.log(`node scripts/make-admin.js ${user.uid}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.log('💡 Make sure you have an account. Sign up at: http://localhost:5173/auth/signup');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 Incorrect password. Please try again.');
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

findMyUID();

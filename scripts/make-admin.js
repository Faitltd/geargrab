#!/usr/bin/env node

/**
 * Script to make a user an admin in GearGrab
 * Usage: node scripts/make-admin.js <USER_UID>
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { config } from 'dotenv';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeUserAdmin(userUid) {
  try {
    console.log(`Making user ${userUid} an admin...`);
    
    const adminRef = doc(db, 'adminUsers', userUid);
    await setDoc(adminRef, {
      isAdmin: true,
      role: 'admin',
      createdAt: serverTimestamp(),
      permissions: ['all'],
      createdBy: 'script'
    });
    
    console.log(`✅ Successfully granted admin privileges to user: ${userUid}`);
    console.log(`The user can now access admin features at: /admin/users`);
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  }
}

// Get user UID from command line arguments
const userUid = process.argv[2];

if (!userUid) {
  console.error('❌ Please provide a user UID');
  console.log('Usage: node scripts/make-admin.js <USER_UID>');
  console.log('');
  console.log('To find a user UID:');
  console.log('1. Go to Firebase Console');
  console.log('2. Select your project');
  console.log('3. Go to Authentication → Users');
  console.log('4. Copy the UID of the user you want to make admin');
  process.exit(1);
}

// Validate UID format (basic check)
if (userUid.length < 10) {
  console.error('❌ Invalid UID format. UIDs are typically longer than 10 characters.');
  process.exit(1);
}

// Run the script
makeUserAdmin(userUid)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

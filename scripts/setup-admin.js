#!/usr/bin/env node

/**
 * Setup Admin User Script
 * This script creates the admin user document in Firestore
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

async function setupAdmin() {
  try {
    console.log('🔄 Setting up admin user...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // The UID from our memory - Admin@itsfait.com
    const adminUID = 'NivAg90815PbcmUrbtYOtqX30J02';
    
    console.log('👑 Creating admin document for UID:', adminUID);
    
    // Create admin document
    const adminRef = doc(db, 'adminUsers', adminUID);
    await setDoc(adminRef, {
      isAdmin: true,
      role: 'admin',
      createdAt: serverTimestamp(),
      permissions: ['all'],
      createdBy: 'setup-script',
      email: 'Admin@itsfait.com'
    });
    
    console.log('✅ Admin document created successfully!');
    console.log('📧 Admin email: Admin@itsfait.com');
    console.log('🆔 Admin UID:', adminUID);
    console.log('');
    console.log('🎉 Admin setup complete!');
    console.log('You can now log in as Admin@itsfait.com and see the admin dashboard.');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    process.exit(0);
  }
}

setupAdmin();

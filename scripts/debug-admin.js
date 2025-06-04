#!/usr/bin/env node

/**
 * Debug Admin Status Script
 * This script checks if the admin document exists and what data it contains
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
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

async function debugAdminStatus() {
  try {
    console.log('🔍 Debug Admin Status');
    console.log('=====================\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const userUid = 'NivAg90815PbcmUrbtYOtqX30J02';
    
    console.log(`🆔 Checking admin status for UID: ${userUid}\n`);

    // Check if adminUsers collection exists
    console.log('📁 Checking adminUsers collection...');
    const adminUsersRef = collection(db, 'adminUsers');
    const adminUsersSnap = await getDocs(adminUsersRef);
    
    if (adminUsersSnap.empty) {
      console.log('❌ adminUsers collection is empty or doesn\'t exist');
    } else {
      console.log(`✅ adminUsers collection exists with ${adminUsersSnap.size} documents`);
      
      // List all admin users
      console.log('\n📋 All admin users:');
      adminUsersSnap.forEach((doc) => {
        console.log(`  - ${doc.id}: ${JSON.stringify(doc.data(), null, 2)}`);
      });
    }

    // Check specific user document
    console.log(`\n🔍 Checking specific user document: ${userUid}`);
    const adminRef = doc(db, 'adminUsers', userUid);
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      const data = adminSnap.data();
      console.log('✅ Admin document exists!');
      console.log('📄 Document data:');
      console.log(JSON.stringify(data, null, 2));
      
      // Check specific fields
      console.log('\n🔍 Field analysis:');
      console.log(`  isAdmin: ${data.isAdmin} (type: ${typeof data.isAdmin})`);
      console.log(`  role: ${data.role} (type: ${typeof data.role})`);
      console.log(`  permissions: ${JSON.stringify(data.permissions)} (type: ${typeof data.permissions})`);
      
      // Check if it would pass the admin check
      const wouldPassCheck = data.isAdmin === true;
      console.log(`\n✅ Would pass admin check: ${wouldPassCheck}`);
      
    } else {
      console.log('❌ Admin document does not exist');
      console.log('\n💡 To create the admin document, run:');
      console.log(`node scripts/make-admin.js ${userUid}`);
    }

    // Check Firestore rules
    console.log('\n🔒 Testing Firestore rules...');
    try {
      // This will fail if rules are blocking access
      await getDoc(adminRef);
      console.log('✅ Firestore rules allow reading admin document');
    } catch (error) {
      console.log('❌ Firestore rules are blocking access:');
      console.log(`   Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugAdminStatus();

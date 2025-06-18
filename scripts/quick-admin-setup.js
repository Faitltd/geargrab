#!/usr/bin/env node

/**
 * Quick Admin Setup Script
 * This script helps you become an admin by either:
 * 1. Using your current Firebase Auth UID
 * 2. Providing a UID manually
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import readline from 'readline';

// Firebase config (you'll need to update this with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  // You can find this in your Firebase Console > Project Settings > General > Your apps
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

async function main() {
  try {
    console.log('🔧 GearGrab Admin Setup');
    console.log('========================\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log('Choose an option:');
    console.log('1. Sign in and make yourself admin');
    console.log('2. Make a specific UID admin');
    
    const choice = await question('\nEnter your choice (1 or 2): ');

    let userUid;

    if (choice === '1') {
      // Sign in and use current user
      const email = await question('Enter your email: ');
      const password = await question('Enter your password: ');
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        userUid = userCredential.user.uid;
        console.log(`✅ Signed in successfully! Your UID: ${userUid}`);
      } catch (error) {
        console.error('❌ Sign in failed:', error.message);
        process.exit(1);
      }
    } else if (choice === '2') {
      // Use provided UID
      userUid = await question('Enter the user UID: ');
    } else {
      console.log('❌ Invalid choice');
      process.exit(1);
    }

    if (!userUid) {
      console.log('❌ No UID provided');
      process.exit(1);
    }

    console.log(`\n🔄 Making user ${userUid} an admin...`);

    // Create admin document
    const adminRef = doc(db, 'adminUsers', userUid);
    await setDoc(adminRef, {
      isAdmin: true,
      role: 'admin',
      createdAt: serverTimestamp(),
      permissions: ['all'],
      createdBy: 'quick-admin-setup-script'
    });

    console.log('✅ Successfully granted admin privileges!');
    console.log(`🆔 Admin UID: ${userUid}`);
    console.log('🔗 You can now access admin features at: /admin/users');
    console.log('🔄 Refresh your browser to see the admin navigation.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();

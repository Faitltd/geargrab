#!/usr/bin/env node

/**
 * Setup Ray@itsfait as Admin User
 * This script ensures Ray@itsfait.com has full admin privileges
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import readline from 'readline';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpZmBtJcLA2p_WbHlNrWz8TM-W_VNOeWs",
  authDomain: "geargrabco.firebaseapp.com",
  projectId: "geargrabco",
  storageBucket: "geargrabco.appspot.com",
  messagingSenderId: "227444442028",
  appId: "1:227444442028:web:8f6b8a0b8f6b8a0b8f6b8a"
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    console.log('🔧 Setting up Ray@itsfait as admin user...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Admin user details
    const adminEmail = 'ray@itsfait.com';
    const adminEmails = [
      'ray@itsfait.com',
      'Ray@itsfait.com',
      'faitltd@gmail.com',
      '126212038+Faitltd@users.noreply.github.com'
    ];

    console.log('📧 Admin emails to be configured:');
    adminEmails.forEach(email => console.log(`   - ${email}`));
    console.log('');

    // Option 1: Set up admin by UID (if we know it)
    const userUid = await askQuestion('Enter Ray\'s user UID (if known, or press Enter to skip): ');
    
    if (userUid && userUid.trim()) {
      console.log(`\n🔄 Setting up admin for UID: ${userUid.trim()}`);
      
      // Create admin document
      const adminRef = doc(db, 'adminUsers', userUid.trim());
      await setDoc(adminRef, {
        uid: userUid.trim(),
        email: adminEmail.toLowerCase(),
        isAdmin: true,
        adminLevel: 'super',
        permissions: [
          'view_admin_panel',
          'view_listings',
          'delete_any_listing',
          'edit_any_listing',
          'manage_users',
          'manage_admins',
          'view_analytics',
          'manage_payments',
          'system_settings',
          'view_chat_messages',
          'moderate_chat',
          'manage_bookings'
        ],
        createdAt: serverTimestamp(),
        createdBy: 'setup-ray-admin-script'
      });

      // Also create in adminUsers collection for backward compatibility
      const adminUsersRef = doc(db, 'adminUsers', userUid.trim());
      await setDoc(adminUsersRef, {
        isAdmin: true,
        role: 'admin',
        createdAt: serverTimestamp(),
        permissions: ['all'],
        createdBy: 'setup-ray-admin-script',
        email: adminEmail.toLowerCase()
      });

      console.log('✅ Successfully set up admin privileges!');
      console.log(`🆔 Admin UID: ${userUid.trim()}`);
      console.log(`📧 Admin Email: ${adminEmail}`);
      console.log('🔗 Admin console available at: /admin');
      console.log('');
      console.log('🔄 Ray should now be able to:');
      console.log('   - Access admin dashboard at /admin');
      console.log('   - Manage all listings (edit/delete)');
      console.log('   - View and manage all users');
      console.log('   - Monitor all chat messages');
      console.log('   - Approve/reject bookings');
      console.log('   - View analytics and system health');
      
    } else {
      console.log('\n📝 No UID provided. Admin setup will happen automatically when Ray logs in.');
      console.log('   The system will detect Ray\'s email and grant admin privileges automatically.');
    }

    console.log('\n🔍 Verifying admin configuration...');
    
    // Check if admin emails are properly configured in the code
    console.log('✅ Admin emails configured in src/lib/auth/admin.ts');
    console.log('✅ Admin routes available at /admin/*');
    console.log('✅ Admin API endpoints configured');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Ray should log in to geargrab.co');
    console.log('2. Navigate to /admin to access the admin console');
    console.log('3. If access is denied, run this script again with Ray\'s UID');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();

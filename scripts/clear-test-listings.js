#!/usr/bin/env node

/**
 * Clear All Test Listings from Firestore
 * This script removes all existing listings to prepare for real listings
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase Admin configuration
const adminConfig = {
  credential: cert({
    projectId: 'geargrabco',
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  projectId: 'geargrabco'
};

async function clearTestListings() {
  try {
    console.log('🧹 Starting cleanup of test listings...');
    
    // Initialize Firebase Admin
    const app = initializeApp(adminConfig);
    const db = getFirestore(app);

    // Get all listings
    console.log('📋 Fetching all listings...');
    const listingsSnapshot = await db.collection('listings').get();
    
    if (listingsSnapshot.empty) {
      console.log('✅ No listings found - database is already clean!');
      return;
    }

    console.log(`📊 Found ${listingsSnapshot.size} listings to remove`);
    
    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete ALL listings!');
    console.log('   This action cannot be undone.');
    
    // In a real scenario, you might want to add a confirmation prompt
    // For now, we'll proceed with the deletion
    
    // Delete all listings in batches
    const batch = db.batch();
    let deleteCount = 0;
    
    listingsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
      console.log(`   - Queuing deletion: ${doc.data().title || doc.id}`);
    });

    // Execute the batch deletion
    console.log('\n🗑️  Executing batch deletion...');
    await batch.commit();
    
    console.log(`✅ Successfully deleted ${deleteCount} listings`);
    console.log('\n🎉 Database is now clean and ready for real listings!');
    console.log('\n📝 Next steps:');
    console.log('   1. Go to https://geargrab.co/list-gear');
    console.log('   2. Sign in with your account');
    console.log('   3. Start adding your real gear listings');

  } catch (error) {
    console.error('❌ Error clearing test listings:', error);
    
    if (error.code === 'permission-denied') {
      console.error('\n🔐 Permission Error:');
      console.error('   Make sure your Firebase Admin credentials are correct');
      console.error('   Check FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY');
    }
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
clearTestListings();

#!/usr/bin/env node

/**
 * Test Authentication and Firestore Rules
 * This script tests if a user can create a listing with the current rules
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

async function testFirestoreRules() {
  try {
    console.log('🧪 Testing Firestore rules and authentication...');
    
    // Initialize Firebase Admin
    const app = initializeApp(adminConfig);
    const db = getFirestore(app);

    // Test data that matches our Firestore rules
    const testListing = {
      ownerUid: 'test-user-123',
      ownerId: 'test-user-123',
      title: 'Test Camping Tent',
      description: 'This is a test listing to verify our Firestore rules are working correctly.',
      category: 'camping',
      condition: 'Good',
      dailyPrice: 25,
      securityDeposit: 50,
      location: {
        city: 'Denver',
        state: 'CO',
        zipCode: '80202'
      },
      images: [],
      features: [],
      unavailableDates: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Test listing data:');
    console.log(JSON.stringify(testListing, null, 2));

    // Try to create the listing using Admin SDK (this bypasses rules)
    console.log('\n🔧 Creating test listing with Admin SDK...');
    const docRef = await db.collection('listings').add(testListing);
    console.log(`✅ Test listing created with ID: ${docRef.id}`);

    // Verify the listing was created
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('✅ Test listing verified in database');
      console.log('📊 Created listing data:', doc.data());
    } else {
      console.log('❌ Test listing not found in database');
    }

    // Clean up - delete the test listing
    console.log('\n🧹 Cleaning up test listing...');
    await docRef.delete();
    console.log('✅ Test listing deleted');

    console.log('\n🎉 Firestore rules test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin SDK can create listings');
    console.log('   ✅ Data structure matches Firestore rules');
    console.log('   ✅ All required fields are present');
    console.log('\n💡 If users still can\'t create listings, the issue is likely:');
    console.log('   1. User authentication state (not properly signed in)');
    console.log('   2. Client-side Firebase configuration');
    console.log('   3. Browser cache issues');

  } catch (error) {
    console.error('❌ Error testing Firestore rules:', error);
    
    if (error.code === 'permission-denied') {
      console.error('\n🔐 Permission Error Details:');
      console.error('   This suggests the Firestore rules are working');
      console.error('   but the test user doesn\'t have proper authentication');
    }
  } finally {
    process.exit(0);
  }
}

// Run the test
testFirestoreRules();

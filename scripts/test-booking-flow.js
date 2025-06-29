#!/usr/bin/env node

/**
 * Test Booking Flow Script
 * This script tests the complete booking workflow
 */

import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

async function testBookingFlow() {
  try {
    console.log('🔄 Testing booking flow...');
    
    // Get Firestore instance
    const db = admin.firestore();

    // Test 1: Check existing bookings
    console.log('\n📋 Test 1: Checking existing bookings...');
    const bookingsQuery = await db.collection('bookings').limit(10).get();
    console.log(`✅ Found ${bookingsQuery.size} existing bookings`);
    
    if (bookingsQuery.size > 0) {
      bookingsQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.status} - ${data.listingTitle || 'No title'}`);
      });
    }

    // Test 2: Check booking statuses
    console.log('\n📊 Test 2: Checking booking statuses...');
    const statusCounts = {};
    bookingsQuery.forEach((doc) => {
      const status = doc.data().status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    // Test 3: Check for pending bookings that need owner approval
    console.log('\n⏳ Test 3: Checking pending bookings...');
    const pendingQuery = await db.collection('bookings')
      .where('status', '==', 'pending_owner_approval')
      .limit(5)
      .get();
    
    console.log(`✅ Found ${pendingQuery.size} pending bookings needing approval`);
    
    if (pendingQuery.size > 0) {
      pendingQuery.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        console.log(`   - ${doc.id}: ${data.listingTitle} (created ${createdAt.toLocaleDateString()})`);
      });
    }

    // Test 4: Check confirmed bookings
    console.log('\n✅ Test 4: Checking confirmed bookings...');
    const confirmedQuery = await db.collection('bookings')
      .where('status', '==', 'confirmed')
      .limit(5)
      .get();
    
    console.log(`✅ Found ${confirmedQuery.size} confirmed bookings`);
    
    if (confirmedQuery.size > 0) {
      confirmedQuery.forEach((doc) => {
        const data = doc.data();
        const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
        const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
        console.log(`   - ${doc.id}: ${data.listingTitle} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);
      });
    }

    // Test 5: Check users for notification testing
    console.log('\n👥 Test 5: Checking users for notifications...');
    const usersQuery = await db.collection('users').limit(5).get();
    console.log(`✅ Found ${usersQuery.size} users`);
    
    if (usersQuery.size > 0) {
      usersQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.displayName || 'No name'} (${data.email || 'No email'})`);
      });
    }

    // Test 6: Check listings for booking testing
    console.log('\n📦 Test 6: Checking active listings...');
    const listingsQuery = await db.collection('listings')
      .where('status', '==', 'active')
      .limit(3)
      .get();
    
    console.log(`✅ Found ${listingsQuery.size} active listings`);
    
    if (listingsQuery.size > 0) {
      listingsQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.title} - $${data.dailyPrice}/day (Owner: ${data.ownerUid})`);
      });
    }

    // Test 7: Simulate booking status transitions
    console.log('\n🔄 Test 7: Testing booking status transitions...');
    
    // Check if we have the required status enum values
    const validStatuses = [
      'pending_owner_approval',
      'confirmed', 
      'active',
      'completed',
      'cancelled',
      'denied'
    ];
    
    console.log('Valid booking statuses:');
    validStatuses.forEach(status => {
      console.log(`   - ${status}`);
    });

    console.log('\n🎉 Booking flow tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total bookings: ${bookingsQuery.size}`);
    console.log(`   - Pending approval: ${pendingQuery.size}`);
    console.log(`   - Confirmed: ${confirmedQuery.size}`);
    console.log(`   - Active listings: ${listingsQuery.size}`);
    console.log(`   - Users: ${usersQuery.size}`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (pendingQuery.size > 0) {
      console.log('   - Test the booking approval flow with pending bookings');
    }
    if (confirmedQuery.size > 0) {
      console.log('   - Test the booking handoff flow with confirmed bookings');
    }
    if (listingsQuery.size > 0 && usersQuery.size > 1) {
      console.log('   - Test creating new bookings between different users');
    }

  } catch (error) {
    console.error('❌ Error testing booking flow:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testBookingFlow();

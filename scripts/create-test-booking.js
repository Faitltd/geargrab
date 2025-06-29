#!/usr/bin/env node

/**
 * Create Test Booking Script
 * This script creates a test booking to verify the notification system
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

async function createTestBooking() {
  try {
    console.log('📝 Creating test booking...');
    
    // Get Firestore instance
    const db = admin.firestore();

    // Get an active listing
    const listingsQuery = await db.collection('listings')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (listingsQuery.empty) {
      console.error('❌ No active listings found');
      return;
    }

    const listingDoc = listingsQuery.docs[0];
    const listing = listingDoc.data();
    const listingId = listingDoc.id;

    console.log(`📦 Using listing: ${listing.title} (${listingId})`);

    // Get users (owner and renter)
    const usersQuery = await db.collection('users').limit(5).get();
    const users = [];
    usersQuery.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    // Find owner and a different user for renter
    const owner = users.find(u => u.id === listing.ownerUid);
    const renter = users.find(u => u.id !== listing.ownerUid && u.email);

    if (!owner || !renter) {
      console.error('❌ Could not find suitable owner and renter');
      return;
    }

    console.log(`👤 Owner: ${owner.displayName || 'No name'} (${owner.email})`);
    console.log(`👤 Renter: ${renter.displayName || 'No name'} (${renter.email})`);

    // Create booking dates (7 days from now for 3 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3);

    // Calculate pricing
    const days = 3;
    const dailyPrice = listing.dailyPrice || 25;
    const basePrice = dailyPrice * days;
    const serviceFee = Math.round(basePrice * 0.1);
    const totalPrice = basePrice + serviceFee;

    // Create booking data
    const bookingData = {
      listingId,
      listingTitle: listing.title,
      ownerUid: owner.id,
      renterUid: renter.id,
      startDate: admin.firestore.Timestamp.fromDate(startDate),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      days,
      dailyPrice,
      basePrice,
      serviceFee,
      totalPrice,
      status: 'pending_owner_approval',
      paymentStage: 'upfront',
      deliveryMethod: 'pickup',
      specialRequests: 'Test booking created by script for notification testing',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      upfrontPaymentId: 'test_payment_' + Date.now(),
      rentalPaymentId: null
    };

    // Create the booking
    const bookingRef = await db.collection('bookings').add(bookingData);
    console.log(`✅ Created test booking: ${bookingRef.id}`);

    // Display booking details
    console.log('\n📋 Booking Details:');
    console.log(`   ID: ${bookingRef.id}`);
    console.log(`   Listing: ${listing.title}`);
    console.log(`   Owner: ${owner.displayName} (${owner.email})`);
    console.log(`   Renter: ${renter.displayName} (${renter.email})`);
    console.log(`   Dates: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    console.log(`   Total: $${totalPrice} (${days} days × $${dailyPrice}/day + $${serviceFee} service fee)`);
    console.log(`   Status: ${bookingData.status}`);

    // Test the notification system (simulate what the API would do)
    console.log('\n📧 Testing notification system...');
    
    // Prepare email data (same format as the API)
    const emailData = {
      bookingId: bookingRef.id,
      confirmationNumber: bookingRef.id.substring(0, 8).toUpperCase(),
      listingTitle: listing.title,
      listingImage: listing.images?.[0] || '',
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
      totalPrice,
      renterName: renter.displayName || 'Guest',
      renterEmail: renter.email,
      ownerName: owner.displayName || 'Owner',
      ownerEmail: owner.email,
      deliveryMethod: 'pickup'
    };

    console.log('📧 Email notification data prepared:');
    console.log(`   To Owner: ${emailData.ownerEmail}`);
    console.log(`   Subject: New Booking Request - ${emailData.listingTitle}`);
    console.log(`   Confirmation: ${emailData.confirmationNumber}`);

    console.log('\n🎉 Test booking created successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Check the dashboard for the new booking');
    console.log('   2. Test the approval flow');
    console.log('   3. Verify email notifications are working');
    console.log(`   4. Use booking ID: ${bookingRef.id}`);

  } catch (error) {
    console.error('❌ Error creating test booking:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
createTestBooking();

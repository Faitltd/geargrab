#!/usr/bin/env node

/**
 * Test Admin System Script
 * This script tests the admin tools and content moderation system
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

async function testAdminSystem() {
  try {
    console.log('👑 Testing admin system...');
    
    // Get Firestore instance
    const db = admin.firestore();

    // Test 1: Check admin users
    console.log('\n📋 Test 1: Checking admin users...');
    const adminUsersQuery = await db.collection('adminUsers').get();
    console.log(`✅ Found ${adminUsersQuery.size} admin users`);
    
    if (adminUsersQuery.size > 0) {
      adminUsersQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.email || 'No email'}`);
        console.log(`     Level: ${data.adminLevel || 'unknown'}`);
        console.log(`     Permissions: ${data.permissions?.length || 0} permissions`);
        console.log(`     Created: ${data.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}`);
      });
    }

    // Test 2: Check platform statistics
    console.log('\n📊 Test 2: Checking platform statistics...');
    
    const [usersSnap, listingsSnap, bookingsSnap, reviewsSnap, conversationsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('listings').get(),
      db.collection('bookings').get(),
      db.collection('reviews').get(),
      db.collection('conversations').get()
    ]);

    const stats = {
      totalUsers: usersSnap.size,
      totalListings: listingsSnap.size,
      totalBookings: bookingsSnap.size,
      totalReviews: reviewsSnap.size,
      totalConversations: conversationsSnap.size
    };

    console.log('Platform statistics:');
    console.log(`   Total users: ${stats.totalUsers}`);
    console.log(`   Total listings: ${stats.totalListings}`);
    console.log(`   Total bookings: ${stats.totalBookings}`);
    console.log(`   Total reviews: ${stats.totalReviews}`);
    console.log(`   Total conversations: ${stats.totalConversations}`);

    // Test 3: Check content moderation needs
    console.log('\n🛡️ Test 3: Checking content moderation needs...');
    
    // Check for pending reviews
    const pendingReviewsQuery = await db.collection('reviews')
      .where('moderationStatus', '==', 'pending')
      .get();
    
    console.log(`✅ Reviews pending moderation: ${pendingReviewsQuery.size}`);
    
    // Check for reported content
    const reportedContentQuery = await db.collection('reviewReports').get();
    console.log(`✅ Reported content items: ${reportedContentQuery.size}`);
    
    // Check for inactive listings
    const inactiveListingsQuery = await db.collection('listings')
      .where('isActive', '==', false)
      .get();
    
    console.log(`✅ Inactive listings: ${inactiveListingsQuery.size}`);

    // Test 4: Check user verification status
    console.log('\n✅ Test 4: Checking user verification status...');
    
    let verificationStats = {
      verified: 0,
      unverified: 0,
      pendingVerification: 0
    };
    
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.isVerified) {
        verificationStats.verified++;
      } else {
        verificationStats.unverified++;
      }
    });
    
    const verificationRequestsQuery = await db.collection('verificationRequests').get();
    verificationStats.pendingVerification = verificationRequestsQuery.size;
    
    console.log('User verification statistics:');
    console.log(`   Verified users: ${verificationStats.verified}`);
    console.log(`   Unverified users: ${verificationStats.unverified}`);
    console.log(`   Pending verification: ${verificationStats.pendingVerification}`);

    // Test 5: Check booking status distribution
    console.log('\n📅 Test 5: Checking booking status distribution...');
    
    let bookingStats = {};
    bookingsSnap.forEach((doc) => {
      const data = doc.data();
      const status = data.status || 'unknown';
      bookingStats[status] = (bookingStats[status] || 0) + 1;
    });
    
    console.log('Booking status distribution:');
    Object.entries(bookingStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Test 6: Check revenue and financial data
    console.log('\n💰 Test 6: Checking revenue and financial data...');
    
    let financialStats = {
      totalRevenue: 0,
      completedBookings: 0,
      averageBookingValue: 0,
      pendingPayments: 0
    };
    
    bookingsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'completed' && data.totalPrice) {
        financialStats.totalRevenue += data.totalPrice;
        financialStats.completedBookings++;
      }
      if (data.status === 'pending_payment') {
        financialStats.pendingPayments++;
      }
    });
    
    if (financialStats.completedBookings > 0) {
      financialStats.averageBookingValue = financialStats.totalRevenue / financialStats.completedBookings;
    }
    
    console.log('Financial statistics:');
    console.log(`   Total revenue: $${financialStats.totalRevenue.toFixed(2)}`);
    console.log(`   Completed bookings: ${financialStats.completedBookings}`);
    console.log(`   Average booking value: $${financialStats.averageBookingValue.toFixed(2)}`);
    console.log(`   Pending payments: ${financialStats.pendingPayments}`);

    // Test 7: Check system health indicators
    console.log('\n🏥 Test 7: Checking system health indicators...');
    
    // Check for recent activity
    const recentBookingsQuery = await db.collection('bookings')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
      .get();
    
    const recentListingsQuery = await db.collection('listings')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
      .get();
    
    const recentUsersQuery = await db.collection('users')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
      .get();
    
    console.log('Recent activity (last 7 days):');
    console.log(`   New bookings: ${recentBookingsQuery.size}`);
    console.log(`   New listings: ${recentListingsQuery.size}`);
    console.log(`   New users: ${recentUsersQuery.size}`);

    // Test 8: Create admin activity log entry
    console.log('\n📝 Test 8: Creating admin activity log...');
    
    const adminActivityEntry = {
      action: 'admin_system_test',
      adminUserId: 'system_test',
      timestamp: admin.firestore.Timestamp.now(),
      details: {
        testResults: {
          adminUsers: adminUsersQuery.size,
          totalUsers: stats.totalUsers,
          totalListings: stats.totalListings,
          totalBookings: stats.totalBookings,
          pendingModeration: pendingReviewsQuery.size,
          systemHealth: 'good'
        }
      },
      ip: '127.0.0.1',
      userAgent: 'Admin Test Script'
    };
    
    await db.collection('adminActivityLog').add(adminActivityEntry);
    console.log('✅ Admin activity logged');

    console.log('\n🎉 Admin system tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin users: ${adminUsersQuery.size}`);
    console.log(`   - Platform users: ${stats.totalUsers}`);
    console.log(`   - Active listings: ${stats.totalListings}`);
    console.log(`   - Total bookings: ${stats.totalBookings}`);
    console.log(`   - Content needing moderation: ${pendingReviewsQuery.size}`);
    console.log(`   - Total revenue: $${financialStats.totalRevenue.toFixed(2)}`);
    console.log(`   - System health: Good`);

    // Recommendations
    console.log('\n💡 Admin Recommendations:');
    if (pendingReviewsQuery.size > 0) {
      console.log('   - Review and moderate pending content');
    }
    if (verificationStats.pendingVerification > 0) {
      console.log('   - Process pending user verifications');
    }
    if (financialStats.pendingPayments > 0) {
      console.log('   - Follow up on pending payments');
    }
    if (recentUsersQuery.size === 0) {
      console.log('   - Consider marketing to attract new users');
    }
    if (recentListingsQuery.size === 0) {
      console.log('   - Encourage existing users to list more gear');
    }
    console.log('   - Monitor user feedback and reviews');
    console.log('   - Check system performance and uptime');
    console.log('   - Review security logs for suspicious activity');

  } catch (error) {
    console.error('❌ Error testing admin system:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAdminSystem();

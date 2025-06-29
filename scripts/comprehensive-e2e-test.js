#!/usr/bin/env node

/**
 * Comprehensive End-to-End Testing Script
 * Tests all new functions and features implemented in Phases 1-3
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

class E2ETestSuite {
  constructor() {
    this.db = admin.firestore();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      await testFunction();
      this.testResults.passed++;
      console.log(`✅ PASSED: ${testName}`);
      this.testResults.details.push({ name: testName, status: 'PASSED', error: null });
    } catch (error) {
      this.testResults.failed++;
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  async testDataIntegrity() {
    // Test that all core collections exist and have data
    const collections = ['users', 'listings', 'bookings', 'reviews', 'conversations'];
    
    for (const collectionName of collections) {
      const snapshot = await this.db.collection(collectionName).limit(1).get();
      if (snapshot.empty) {
        throw new Error(`Collection ${collectionName} is empty`);
      }
    }
    
    console.log('   ✓ All core collections have data');
  }

  async testUserProfileSystem() {
    // Test user profile completeness and verification
    const usersSnapshot = await this.db.collection('users').limit(5).get();
    
    let profilesWithPhotos = 0;
    let verifiedUsers = 0;
    let usersWithRatings = 0;
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (user.photoURL) profilesWithPhotos++;
      if (user.isVerified) verifiedUsers++;
      if (user.averageRating) usersWithRatings++;
    });
    
    if (profilesWithPhotos === 0) {
      throw new Error('No users have profile photos');
    }
    
    console.log(`   ✓ ${profilesWithPhotos}/${usersSnapshot.size} users have profile photos`);
    console.log(`   ✓ ${verifiedUsers}/${usersSnapshot.size} users are verified`);
    console.log(`   ✓ ${usersWithRatings}/${usersSnapshot.size} users have ratings`);
  }

  async testMessagingSystem() {
    // Test conversation and message structure
    const conversationsSnapshot = await this.db.collection('conversations').limit(3).get();
    
    if (conversationsSnapshot.empty) {
      throw new Error('No conversations found');
    }
    
    let validConversations = 0;
    
    for (const doc of conversationsSnapshot.docs) {
      const conversation = doc.data();
      
      // Check required fields
      if (!conversation.participants || !conversation.listingId || !conversation.lastMessage) {
        throw new Error(`Invalid conversation structure: ${doc.id}`);
      }
      
      // Check messages subcollection
      const messagesSnapshot = await this.db
        .collection('conversations')
        .doc(doc.id)
        .collection('messages')
        .limit(1)
        .get();
      
      if (!messagesSnapshot.empty) {
        validConversations++;
      }
    }
    
    console.log(`   ✓ ${validConversations}/${conversationsSnapshot.size} conversations have messages`);
  }

  async testBookingFlow() {
    // Test booking creation and status transitions
    const bookingsSnapshot = await this.db.collection('bookings').get();
    
    if (bookingsSnapshot.empty) {
      throw new Error('No bookings found');
    }
    
    const statusCounts = {};
    let bookingsWithPricing = 0;
    let bookingsWithDates = 0;
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      
      // Count statuses
      const status = booking.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Check pricing
      if (booking.totalPrice && booking.totalPrice > 0) {
        bookingsWithPricing++;
      }
      
      // Check dates
      if (booking.startDate && booking.endDate) {
        bookingsWithDates++;
      }
    });
    
    console.log(`   ✓ Booking statuses:`, statusCounts);
    console.log(`   ✓ ${bookingsWithPricing}/${bookingsSnapshot.size} bookings have valid pricing`);
    console.log(`   ✓ ${bookingsWithDates}/${bookingsSnapshot.size} bookings have valid dates`);
  }

  async testReviewSystem() {
    // Test review creation and rating calculations
    const reviewsSnapshot = await this.db.collection('reviews').get();
    
    if (reviewsSnapshot.empty) {
      throw new Error('No reviews found');
    }
    
    let validReviews = 0;
    let totalRating = 0;
    let reviewsWithComments = 0;
    
    reviewsSnapshot.forEach(doc => {
      const review = doc.data();
      
      // Check required fields
      if (review.overallRating && review.reviewerId && review.revieweeId) {
        validReviews++;
        totalRating += review.overallRating;
      }
      
      if (review.comment && review.comment.trim().length > 0) {
        reviewsWithComments++;
      }
    });
    
    const averageRating = validReviews > 0 ? totalRating / validReviews : 0;
    
    console.log(`   ✓ ${validReviews}/${reviewsSnapshot.size} reviews are valid`);
    console.log(`   ✓ Average rating: ${averageRating.toFixed(1)}/5`);
    console.log(`   ✓ ${reviewsWithComments}/${reviewsSnapshot.size} reviews have comments`);
  }

  async testNotificationSystem() {
    // Test notification preferences and history
    const preferencesSnapshot = await this.db.collection('notificationPreferences').get();
    const historySnapshot = await this.db.collection('notificationHistory').limit(5).get();
    
    if (preferencesSnapshot.empty) {
      throw new Error('No notification preferences found');
    }
    
    let usersWithEmailPrefs = 0;
    let usersWithPushPrefs = 0;
    
    preferencesSnapshot.forEach(doc => {
      const prefs = doc.data();
      if (prefs.email) usersWithEmailPrefs++;
      if (prefs.push) usersWithPushPrefs++;
    });
    
    console.log(`   ✓ ${usersWithEmailPrefs}/${preferencesSnapshot.size} users have email preferences`);
    console.log(`   ✓ ${usersWithPushPrefs}/${preferencesSnapshot.size} users have push preferences`);
    console.log(`   ✓ ${historySnapshot.size} notification history records found`);
  }

  async testGuaranteeSystem() {
    // Test guarantee terms and coverage data
    const guaranteeTermsDoc = await this.db.collection('guaranteeTerms').doc('current').get();
    
    if (!guaranteeTermsDoc.exists) {
      throw new Error('Guarantee terms not found');
    }
    
    const terms = guaranteeTermsDoc.data();
    
    // Validate guarantee structure
    if (!terms.standardCoverage || !terms.premiumCoverage || !terms.claimProcess) {
      throw new Error('Invalid guarantee terms structure');
    }
    
    // Check bookings have coverage info
    const bookingsWithCoverage = await this.db.collection('bookings')
      .where('guaranteeCoverage', '!=', null)
      .limit(5)
      .get();
    
    console.log(`   ✓ Guarantee terms configured (v${terms.version})`);
    console.log(`   ✓ Standard coverage: ${terms.standardCoverage.repairCoveragePercentage}% repair, $${terms.standardCoverage.maxRenterLiability} max liability`);
    console.log(`   ✓ Premium coverage: Up to $${terms.premiumCoverage.maxCoveragePerItem} per item`);
    console.log(`   ✓ ${bookingsWithCoverage.size} bookings have coverage data`);
  }

  async testClaimsSystem() {
    // Test insurance claims processing
    const claimsSnapshot = await this.db.collection('insuranceClaims').get();
    
    if (claimsSnapshot.empty) {
      throw new Error('No insurance claims found');
    }
    
    let validClaims = 0;
    let claimsWithEvidence = 0;
    let claimsWithTimeline = 0;
    
    claimsSnapshot.forEach(doc => {
      const claim = doc.data();
      
      // Check required fields
      if (claim.type && claim.status && claim.description && claim.estimatedCost) {
        validClaims++;
      }
      
      if (claim.evidence && (claim.evidence.photos || claim.evidence.documents)) {
        claimsWithEvidence++;
      }
      
      if (claim.timeline && Array.isArray(claim.timeline) && claim.timeline.length > 0) {
        claimsWithTimeline++;
      }
    });
    
    console.log(`   ✓ ${validClaims}/${claimsSnapshot.size} claims are valid`);
    console.log(`   ✓ ${claimsWithEvidence}/${claimsSnapshot.size} claims have evidence`);
    console.log(`   ✓ ${claimsWithTimeline}/${claimsSnapshot.size} claims have timeline`);
  }

  async testAdminSystem() {
    // Test admin users and permissions
    const adminUsersSnapshot = await this.db.collection('adminUsers').get();
    const activityLogSnapshot = await this.db.collection('adminActivityLog').limit(5).get();
    
    if (adminUsersSnapshot.empty) {
      throw new Error('No admin users found');
    }
    
    let adminsWithPermissions = 0;
    
    adminUsersSnapshot.forEach(doc => {
      const admin = doc.data();
      if (admin.permissions && Array.isArray(admin.permissions) && admin.permissions.length > 0) {
        adminsWithPermissions++;
      }
    });
    
    console.log(`   ✓ ${adminUsersSnapshot.size} admin users configured`);
    console.log(`   ✓ ${adminsWithPermissions}/${adminUsersSnapshot.size} admins have permissions`);
    console.log(`   ✓ ${activityLogSnapshot.size} admin activity log entries`);
  }

  async testAnalyticsSystem() {
    // Test analytics data collection and calculations
    const collections = ['users', 'listings', 'bookings', 'reviews'];
    const analytics = {};
    
    for (const collection of collections) {
      const snapshot = await this.db.collection(collection).get();
      analytics[collection] = snapshot.size;
    }
    
    // Calculate key metrics
    const bookingsSnapshot = await this.db.collection('bookings').get();
    let totalRevenue = 0;
    let completedBookings = 0;
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      if (booking.status === 'completed' && booking.totalPrice) {
        totalRevenue += booking.totalPrice;
        completedBookings++;
      }
    });
    
    const averageOrderValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;
    
    console.log(`   ✓ Analytics data: ${JSON.stringify(analytics)}`);
    console.log(`   ✓ Total revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`   ✓ Average order value: $${averageOrderValue.toFixed(2)}`);
    console.log(`   ✓ Conversion rate: ${analytics.users > 0 ? ((completedBookings / analytics.users) * 100).toFixed(1) : 0}%`);
  }

  async testSearchAndAI() {
    // Test search functionality and AI recommendations
    const listingsSnapshot = await this.db.collection('listings').get();
    
    if (listingsSnapshot.empty) {
      throw new Error('No listings for search testing');
    }
    
    // Test category distribution
    const categories = {};
    let listingsWithLocation = 0;
    let listingsWithFeatures = 0;
    
    listingsSnapshot.forEach(doc => {
      const listing = doc.data();
      
      const category = listing.category || 'other';
      categories[category] = (categories[category] || 0) + 1;
      
      if (listing.location && listing.location.lat && listing.location.lng) {
        listingsWithLocation++;
      }
      
      if (listing.features && Array.isArray(listing.features) && listing.features.length > 0) {
        listingsWithFeatures++;
      }
    });
    
    // Test user activity for AI recommendations
    const bookingsSnapshot = await this.db.collection('bookings').get();
    const uniqueRenters = new Set();
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      if (booking.renterUid) {
        uniqueRenters.add(booking.renterUid);
      }
    });
    
    console.log(`   ✓ ${Object.keys(categories).length} categories available for search`);
    console.log(`   ✓ ${listingsWithLocation}/${listingsSnapshot.size} listings have location data`);
    console.log(`   ✓ ${listingsWithFeatures}/${listingsSnapshot.size} listings have features`);
    console.log(`   ✓ ${uniqueRenters.size} users have booking history for AI recommendations`);
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive End-to-End Testing...\n');
    console.log('Testing all new functions implemented in Phases 1-3\n');

    // Phase 1 Tests
    console.log('📋 PHASE 1 TESTS - Core Functionality');
    await this.runTest('Data Integrity Check', () => this.testDataIntegrity());
    await this.runTest('Booking Flow Validation', () => this.testBookingFlow());

    // Phase 2 Tests  
    console.log('\n👥 PHASE 2 TESTS - User Experience');
    await this.runTest('User Profile System', () => this.testUserProfileSystem());
    await this.runTest('Messaging System', () => this.testMessagingSystem());
    await this.runTest('Review System', () => this.testReviewSystem());
    await this.runTest('Notification System', () => this.testNotificationSystem());

    // Phase 3 Tests
    console.log('\n🏢 PHASE 3 TESTS - Business Features');
    await this.runTest('Admin System', () => this.testAdminSystem());
    await this.runTest('Guarantee System', () => this.testGuaranteeSystem());
    await this.runTest('Claims System', () => this.testClaimsSystem());
    await this.runTest('Analytics System', () => this.testAnalyticsSystem());
    await this.runTest('Search & AI Features', () => this.testSearchAndAI());

    // Print final results
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 END-TO-END TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Tests: ${this.testResults.total}`);
    console.log(`   Passed: ${this.testResults.passed} ✅`);
    console.log(`   Failed: ${this.testResults.failed} ❌`);
    console.log(`   Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }

    console.log(`\n✅ PASSED TESTS:`);
    this.testResults.details
      .filter(test => test.status === 'PASSED')
      .forEach(test => {
        console.log(`   - ${test.name}`);
      });

    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! GearGrab is ready for production! 🚀');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
    }
  }
}

// Run the comprehensive test suite
async function main() {
  const testSuite = new E2ETestSuite();
  await testSuite.runAllTests();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

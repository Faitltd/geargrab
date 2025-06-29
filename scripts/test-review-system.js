#!/usr/bin/env node

/**
 * Test Review System Script
 * This script tests the reviews and ratings functionality
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

async function testReviewSystem() {
  try {
    console.log('⭐ Testing review system...');
    
    // Get Firestore instance
    const db = admin.firestore();

    // Test 1: Check existing reviews
    console.log('\n📋 Test 1: Checking existing reviews...');
    const reviewsQuery = await db.collection('reviews').limit(10).get();
    console.log(`✅ Found ${reviewsQuery.size} existing reviews`);
    
    if (reviewsQuery.size > 0) {
      reviewsQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.overallRating}/5 stars`);
        console.log(`     Reviewer: ${data.reviewerName || 'Anonymous'}`);
        console.log(`     Title: "${data.title || 'No title'}"`);
        console.log(`     Comment: "${data.comment?.substring(0, 50)}..."`);
        console.log(`     Status: ${data.moderationStatus || 'unknown'}`);
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          console.log(`     Date: ${date.toLocaleDateString()}`);
        }
      });
    }

    // Test 2: Check review statistics
    console.log('\n📊 Test 2: Checking review statistics...');
    
    // Get users and listings for stats
    const usersQuery = await db.collection('users').limit(5).get();
    const listingsQuery = await db.collection('listings').limit(5).get();
    
    console.log('User review stats:');
    usersQuery.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.displayName || 'Unknown'}: ${data.reviewCount || 0} reviews, ${data.averageRating || 0}/5 avg`);
    });
    
    console.log('Listing review stats:');
    listingsQuery.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.title}: ${data.reviewCount || 0} reviews, ${data.averageRating || 0}/5 avg`);
    });

    // Test 3: Create sample reviews if none exist
    console.log('\n🆕 Test 3: Creating sample reviews...');
    
    if (reviewsQuery.size === 0 && usersQuery.size >= 2 && listingsQuery.size >= 1) {
      const users = [];
      usersQuery.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
      
      const listings = [];
      listingsQuery.forEach(doc => listings.push({ id: doc.id, ...doc.data() }));
      
      // Get completed bookings for realistic reviews
      const bookingsQuery = await db.collection('bookings')
        .where('status', '==', 'completed')
        .limit(3)
        .get();
      
      const sampleReviews = [
        {
          bookingId: bookingsQuery.size > 0 ? bookingsQuery.docs[0].id : 'sample_booking_1',
          listingId: listings[0].id,
          reviewerId: users[1].id,
          reviewerName: users[1].displayName || 'John Doe',
          reviewerAvatar: users[1].photoURL || null,
          revieweeId: users[0].id,
          revieweeType: 'owner',
          overallRating: 5,
          ratings: {
            communication: 5,
            condition: 5,
            cleanliness: 4,
            accuracy: 5,
            value: 5
          },
          title: 'Excellent gear and great communication!',
          comment: 'The tent was exactly as described and in perfect condition. Sarah was very responsive and made the pickup process smooth. Would definitely rent from her again!',
          pros: ['Great condition', 'Fast response', 'Easy pickup'],
          cons: [],
          wouldRecommend: true,
          isVerifiedBooking: true,
          isPublic: true,
          helpfulVotes: 0,
          reportCount: 0,
          moderationStatus: 'approved',
          createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
        },
        {
          bookingId: bookingsQuery.size > 1 ? bookingsQuery.docs[1].id : 'sample_booking_2',
          listingId: listings[0].id,
          reviewerId: users[2]?.id || users[0].id,
          reviewerName: users[2]?.displayName || users[0].displayName || 'Jane Smith',
          reviewerAvatar: users[2]?.photoURL || users[0].photoURL || null,
          revieweeId: users[0].id,
          revieweeType: 'owner',
          overallRating: 4,
          ratings: {
            communication: 4,
            condition: 4,
            cleanliness: 5,
            accuracy: 4,
            value: 4
          },
          title: 'Good quality gear, minor wear',
          comment: 'The backpack worked well for our hiking trip. There was some minor wear on the straps but nothing that affected functionality. Owner was helpful with setup instructions.',
          pros: ['Clean', 'Functional', 'Good instructions'],
          cons: ['Some wear on straps'],
          wouldRecommend: true,
          isVerifiedBooking: true,
          isPublic: true,
          helpfulVotes: 2,
          reportCount: 0,
          moderationStatus: 'approved',
          createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        },
        {
          bookingId: bookingsQuery.size > 2 ? bookingsQuery.docs[2].id : 'sample_booking_3',
          listingId: listings[1]?.id || listings[0].id,
          reviewerId: users[0].id,
          reviewerName: users[0].displayName || 'Sarah Johnson',
          reviewerAvatar: users[0].photoURL || null,
          revieweeId: users[1].id,
          revieweeType: 'renter',
          overallRating: 5,
          ratings: {
            communication: 5,
            condition: 5,
            cleanliness: 5,
            accuracy: 5,
            value: 5,
            reliability: 5
          },
          title: 'Perfect renter - highly recommended!',
          comment: 'John was an excellent renter. He picked up and returned the gear on time, kept everything clean, and communicated well throughout. Would definitely rent to him again!',
          pros: ['On time', 'Respectful', 'Good communication', 'Returned clean'],
          cons: [],
          wouldRecommend: true,
          isVerifiedBooking: true,
          isPublic: true,
          helpfulVotes: 1,
          reportCount: 0,
          moderationStatus: 'approved',
          createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
        }
      ];

      // Add sample reviews
      for (const review of sampleReviews) {
        const reviewRef = await db.collection('reviews').add(review);
        console.log(`✅ Created sample review: ${reviewRef.id}`);
        console.log(`   ${review.overallRating}/5 stars - "${review.title}"`);
        
        // Update listing stats
        const listingRef = db.collection('listings').doc(review.listingId);
        const listingDoc = await listingRef.get();
        const currentReviewCount = listingDoc.data()?.reviewCount || 0;
        const currentAvgRating = listingDoc.data()?.averageRating || 0;
        
        const newReviewCount = currentReviewCount + 1;
        const newAvgRating = ((currentAvgRating * currentReviewCount) + review.overallRating) / newReviewCount;
        
        await listingRef.update({
          reviewCount: newReviewCount,
          averageRating: newAvgRating,
          lastReviewDate: review.createdAt
        });
        
        // Update user stats
        const userRef = db.collection('users').doc(review.revieweeId);
        const userDoc = await userRef.get();
        const currentUserReviewCount = userDoc.data()?.reviewCount || 0;
        const currentUserAvgRating = userDoc.data()?.averageRating || 0;
        
        const newUserReviewCount = currentUserReviewCount + 1;
        const newUserAvgRating = ((currentUserAvgRating * currentUserReviewCount) + review.overallRating) / newUserReviewCount;
        
        await userRef.update({
          reviewCount: newUserReviewCount,
          averageRating: newUserAvgRating,
          lastReviewDate: review.createdAt
        });
      }
      
      console.log(`✅ Created ${sampleReviews.length} sample reviews with statistics`);
      
    } else if (reviewsQuery.size > 0) {
      console.log('✅ Reviews already exist');
    } else {
      console.log('⚠️  Not enough data to create sample reviews');
    }

    // Test 4: Check review moderation
    console.log('\n🛡️ Test 4: Checking review moderation...');
    
    const pendingReviewsQuery = await db.collection('reviews')
      .where('moderationStatus', '==', 'pending')
      .limit(5)
      .get();
    
    console.log(`✅ Found ${pendingReviewsQuery.size} reviews pending moderation`);
    
    const approvedReviewsQuery = await db.collection('reviews')
      .where('moderationStatus', '==', 'approved')
      .limit(10)
      .get();
    
    console.log(`✅ Found ${approvedReviewsQuery.size} approved reviews`);

    // Test 5: Calculate overall statistics
    console.log('\n📈 Test 5: Calculating overall statistics...');
    
    const allReviewsQuery = await db.collection('reviews').get();
    let totalRating = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let categoryTotals = {
      communication: 0,
      condition: 0,
      cleanliness: 0,
      accuracy: 0,
      value: 0
    };
    let recommendCount = 0;
    
    allReviewsQuery.forEach((doc) => {
      const data = doc.data();
      const rating = data.overallRating || 0;
      
      if (rating >= 1 && rating <= 5) {
        totalRating += rating;
        ratingCounts[rating]++;
      }
      
      if (data.ratings) {
        Object.keys(categoryTotals).forEach(category => {
          if (data.ratings[category]) {
            categoryTotals[category] += data.ratings[category];
          }
        });
      }
      
      if (data.wouldRecommend) {
        recommendCount++;
      }
    });
    
    const totalReviews = allReviewsQuery.size;
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    const recommendationRate = totalReviews > 0 ? (recommendCount / totalReviews) * 100 : 0;
    
    console.log('Overall review statistics:');
    console.log(`   Total reviews: ${totalReviews}`);
    console.log(`   Average rating: ${averageRating.toFixed(1)}/5`);
    console.log(`   Recommendation rate: ${recommendationRate.toFixed(1)}%`);
    console.log(`   Rating distribution:`);
    Object.entries(ratingCounts).forEach(([rating, count]) => {
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      console.log(`     ${rating} stars: ${count} (${percentage.toFixed(1)}%)`);
    });
    
    if (totalReviews > 0) {
      console.log(`   Category averages:`);
      Object.entries(categoryTotals).forEach(([category, total]) => {
        const average = total / totalReviews;
        console.log(`     ${category}: ${average.toFixed(1)}/5`);
      });
    }

    console.log('\n🎉 Review system tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Total reviews: ${totalReviews}`);
    console.log(`   - Average rating: ${averageRating.toFixed(1)}/5`);
    console.log(`   - Pending moderation: ${pendingReviewsQuery.size}`);
    console.log(`   - Approved reviews: ${approvedReviewsQuery.size}`);
    console.log(`   - Recommendation rate: ${recommendationRate.toFixed(1)}%`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (totalReviews === 0) {
      console.log('   - Test the review form UI with completed bookings');
    }
    if (pendingReviewsQuery.size > 0) {
      console.log('   - Review and moderate pending reviews');
    }
    if (averageRating < 4.0 && totalReviews > 0) {
      console.log('   - Investigate low ratings and improve service quality');
    }
    console.log('   - Test review display components in listing pages');
    console.log('   - Verify review statistics update correctly');
    console.log('   - Test review helpful voting and reporting features');

  } catch (error) {
    console.error('❌ Error testing review system:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testReviewSystem();

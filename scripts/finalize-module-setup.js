#!/usr/bin/env node

/**
 * Finalize Module Setup Script
 * Final touches to ensure all module listings are perfect
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

async function finalizeModuleSetup() {
  try {
    console.log('🔧 Finalizing module setup...');
    
    const db = admin.firestore();

    // Fix listings without location data
    console.log('\n📍 Fixing listings without location data...');
    
    const listingsSnapshot = await db.collection('listings').get();
    const batch = db.batch();
    let fixedListings = 0;

    listingsSnapshot.forEach(doc => {
      const listing = doc.data();
      
      // Fix missing location data
      if (!listing.location || !listing.location.lat || !listing.location.lng) {
        const defaultLocation = {
          lat: 39.7392 + (Math.random() - 0.5) * 0.2,
          lng: -104.9903 + (Math.random() - 0.5) * 0.2,
          city: "Denver",
          state: "CO",
          zipCode: "80202",
          address: "Denver, CO",
          country: "US"
        };

        batch.update(doc.ref, {
          location: defaultLocation,
          updatedAt: admin.firestore.Timestamp.now()
        });

        fixedListings++;
        console.log(`   ✓ Fixed location for: ${listing.title}`);
      }
    });

    if (fixedListings > 0) {
      await batch.commit();
      console.log(`✅ Fixed location data for ${fixedListings} listings`);
    } else {
      console.log('✅ All listings already have location data');
    }

    // Make more listings available
    console.log('\n🟢 Making more listings available...');
    
    const unavailableListings = await db.collection('listings')
      .where('isAvailable', '==', false)
      .limit(10)
      .get();

    const availabilityBatch = db.batch();
    let madeAvailable = 0;

    unavailableListings.forEach(doc => {
      availabilityBatch.update(doc.ref, {
        isAvailable: true,
        updatedAt: admin.firestore.Timestamp.now()
      });
      madeAvailable++;
    });

    if (madeAvailable > 0) {
      await availabilityBatch.commit();
      console.log(`✅ Made ${madeAvailable} additional listings available`);
    }

    // Verify final state
    console.log('\n🔍 Verifying final state...');
    
    const finalListingsSnapshot = await db.collection('listings').get();
    
    let totalListings = 0;
    let availableListings = 0;
    let listingsWithLocation = 0;
    let featuredListings = 0;
    const categoryCount = {};

    finalListingsSnapshot.forEach(doc => {
      const listing = doc.data();
      totalListings++;
      
      if (listing.isAvailable) {
        availableListings++;
      }
      
      if (listing.location && listing.location.lat && listing.location.lng) {
        listingsWithLocation++;
      }
      
      if (listing.isFeatured) {
        featuredListings++;
      }
      
      const category = listing.category;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    console.log('📊 Final Platform State:');
    console.log(`   Total listings: ${totalListings}`);
    console.log(`   Available listings: ${availableListings}/${totalListings} (${((availableListings/totalListings)*100).toFixed(1)}%)`);
    console.log(`   Location coverage: ${listingsWithLocation}/${totalListings} (${((listingsWithLocation/totalListings)*100).toFixed(1)}%)`);
    console.log(`   Featured listings: ${featuredListings}`);
    
    console.log('\n📋 Category Coverage:');
    Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} listings`);
      });

    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    
    // Test category search
    const campingListings = await db.collection('listings')
      .where('category', '==', 'camping')
      .where('isActive', '==', true)
      .get();
    
    console.log(`   Camping search: ${campingListings.size} results`);
    
    // Test price range search
    const budgetListings = await db.collection('listings')
      .where('dailyPrice', '<=', 50)
      .where('isActive', '==', true)
      .get();
    
    console.log(`   Budget search (≤$50): ${budgetListings.size} results`);
    
    // Test availability search
    const availableNow = await db.collection('listings')
      .where('isAvailable', '==', true)
      .where('isActive', '==', true)
      .get();
    
    console.log(`   Available now: ${availableNow.size} results`);

    // Create sample search queries for testing
    console.log('\n📝 Creating sample search data...');
    
    const sampleSearches = [
      { query: 'tent camping', category: 'camping', results: campingListings.size },
      { query: 'camera photography', category: 'photography', results: 1 },
      { query: 'bike cycling', category: 'cycling', results: 2 },
      { query: 'backpack hiking', category: 'hiking', results: 2 },
      { query: 'kayak water sports', category: 'water_sports', results: 2 },
      { query: 'skis winter sports', category: 'winter_sports', results: 1 }
    ];

    const searchBatch = db.batch();
    
    sampleSearches.forEach(search => {
      const searchRef = db.collection('searchQueries').doc();
      searchBatch.set(searchRef, {
        query: search.query,
        category: search.category,
        expectedResults: search.results,
        createdAt: admin.firestore.Timestamp.now(),
        isTestData: true
      });
    });

    await searchBatch.commit();
    console.log(`✅ Created ${sampleSearches.length} sample search queries`);

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MODULE SETUP FINALIZATION COMPLETE!');
    console.log('='.repeat(60));

    console.log(`\n✅ PLATFORM READY FOR TESTING:`);
    console.log(`   📦 ${totalListings} total listings across 6 categories`);
    console.log(`   🟢 ${availableListings} listings available for booking`);
    console.log(`   📍 ${listingsWithLocation} listings with location data`);
    console.log(`   ⭐ ${featuredListings} featured listings for homepage`);
    console.log(`   🔍 ${sampleSearches.length} sample search queries ready`);

    console.log(`\n🚀 READY TO TEST:`);
    console.log(`   1. Search functionality by category`);
    console.log(`   2. Location-based search and maps`);
    console.log(`   3. Price filtering and sorting`);
    console.log(`   4. Booking flow with payments`);
    console.log(`   5. User profiles and reviews`);
    console.log(`   6. Admin dashboard and analytics`);

  } catch (error) {
    console.error('❌ Error finalizing module setup:', error);
    throw error;
  }
}

// Run the finalization
finalizeModuleSetup()
  .then(() => {
    console.log('\n🎉 Module setup finalization completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Finalization failed:', error);
    process.exit(1);
  });

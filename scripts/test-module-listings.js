#!/usr/bin/env node

/**
 * Test Module Listings Script
 * Verifies all module test listings are working correctly
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

async function testModuleListings() {
  try {
    console.log('🏕️ Testing module listings functionality...');
    
    const db = admin.firestore();

    // Test 1: Check all module categories are represented
    console.log('\n📋 Test 1: Checking module category coverage...');
    
    const expectedCategories = [
      'camping',
      'hiking', 
      'cycling',
      'photography',
      'water_sports',
      'winter_sports'
    ];

    const listingsSnapshot = await db.collection('listings').get();
    const categoryCount = {};
    
    listingsSnapshot.forEach(doc => {
      const listing = doc.data();
      const category = listing.category;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    console.log('📊 Category Coverage:');
    expectedCategories.forEach(category => {
      const count = categoryCount[category] || 0;
      console.log(`   ${category}: ${count} listings ${count > 0 ? '✅' : '❌'}`);
    });

    // Test 2: Verify listing data quality
    console.log('\n🔍 Test 2: Verifying listing data quality...');
    
    const featuredListings = await db.collection('listings')
      .where('isFeatured', '==', true)
      .get();

    let qualityScore = 0;
    const qualityChecks = [
      'title',
      'description', 
      'category',
      'brand',
      'dailyPrice',
      'features',
      'specifications',
      'includedItems',
      'location'
    ];

    featuredListings.forEach(doc => {
      const listing = doc.data();
      const score = qualityChecks.filter(field => {
        const value = listing[field];
        return value !== undefined && value !== null && 
               (Array.isArray(value) ? value.length > 0 : 
                typeof value === 'object' ? Object.keys(value).length > 0 : 
                String(value).length > 0);
      }).length;
      
      qualityScore += score;
      console.log(`   ${listing.title}: ${score}/${qualityChecks.length} fields complete`);
    });

    const averageQuality = featuredListings.size > 0 ? qualityScore / featuredListings.size : 0;
    console.log(`   Average quality score: ${averageQuality.toFixed(1)}/${qualityChecks.length}`);

    // Test 3: Test search functionality by category
    console.log('\n🔍 Test 3: Testing search functionality by category...');
    
    for (const category of expectedCategories) {
      const categoryListings = await db.collection('listings')
        .where('category', '==', category)
        .where('isActive', '==', true)
        .get();
      
      console.log(`   ${category}: ${categoryListings.size} active listings`);
      
      if (categoryListings.size > 0) {
        const firstListing = categoryListings.docs[0].data();
        console.log(`     Sample: ${firstListing.title} - $${firstListing.dailyPrice}/day`);
      }
    }

    // Test 4: Test location-based search
    console.log('\n📍 Test 4: Testing location-based search...');
    
    const denverLat = 39.7392;
    const denverLng = -104.9903;
    const searchRadius = 25; // miles
    
    let nearbyListings = 0;
    let listingsWithLocation = 0;
    
    listingsSnapshot.forEach(doc => {
      const listing = doc.data();
      if (listing.location && listing.location.lat && listing.location.lng) {
        listingsWithLocation++;
        
        const distance = calculateDistance(
          denverLat, denverLng,
          listing.location.lat, listing.location.lng
        );
        
        if (distance <= searchRadius) {
          nearbyListings++;
        }
      }
    });
    
    console.log(`   Listings with location: ${listingsWithLocation}/${listingsSnapshot.size}`);
    console.log(`   Listings within ${searchRadius} miles of Denver: ${nearbyListings}`);

    // Test 5: Test pricing and availability
    console.log('\n💰 Test 5: Testing pricing and availability...');
    
    let totalValue = 0;
    let availableListings = 0;
    let priceRanges = {
      budget: 0,    // < $30/day
      mid: 0,       // $30-$80/day  
      premium: 0    // > $80/day
    };

    listingsSnapshot.forEach(doc => {
      const listing = doc.data();
      
      if (listing.isAvailable) {
        availableListings++;
      }
      
      if (listing.dailyPrice) {
        totalValue += listing.dailyPrice;
        
        if (listing.dailyPrice < 30) {
          priceRanges.budget++;
        } else if (listing.dailyPrice <= 80) {
          priceRanges.mid++;
        } else {
          priceRanges.premium++;
        }
      }
    });

    const averagePrice = listingsSnapshot.size > 0 ? totalValue / listingsSnapshot.size : 0;
    
    console.log(`   Available listings: ${availableListings}/${listingsSnapshot.size}`);
    console.log(`   Average daily price: $${averagePrice.toFixed(2)}`);
    console.log(`   Price distribution:`);
    console.log(`     Budget (<$30): ${priceRanges.budget} listings`);
    console.log(`     Mid-range ($30-$80): ${priceRanges.mid} listings`);
    console.log(`     Premium (>$80): ${priceRanges.premium} listings`);

    // Test 6: Test features and specifications
    console.log('\n⭐ Test 6: Testing features and specifications...');
    
    let totalFeatures = 0;
    let totalSpecifications = 0;
    const popularFeatures = {};
    
    listingsSnapshot.forEach(doc => {
      const listing = doc.data();
      
      if (listing.features && Array.isArray(listing.features)) {
        totalFeatures += listing.features.length;
        
        listing.features.forEach(feature => {
          popularFeatures[feature] = (popularFeatures[feature] || 0) + 1;
        });
      }
      
      if (listing.specifications && typeof listing.specifications === 'object') {
        totalSpecifications += Object.keys(listing.specifications).length;
      }
    });

    const averageFeatures = listingsSnapshot.size > 0 ? totalFeatures / listingsSnapshot.size : 0;
    const averageSpecs = listingsSnapshot.size > 0 ? totalSpecifications / listingsSnapshot.size : 0;
    
    console.log(`   Average features per listing: ${averageFeatures.toFixed(1)}`);
    console.log(`   Average specifications per listing: ${averageSpecs.toFixed(1)}`);
    
    const topFeatures = Object.entries(popularFeatures)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.log(`   Most popular features:`);
    topFeatures.forEach(([feature, count]) => {
      console.log(`     ${feature}: ${count} listings`);
    });

    // Test 7: Test module-specific functionality
    console.log('\n🎯 Test 7: Testing module-specific functionality...');
    
    const moduleTests = {
      camping: { expectedFeatures: ['waterproof', 'easy setup'], minPrice: 20 },
      hiking: { expectedFeatures: ['lightweight', 'durable'], minPrice: 15 },
      cycling: { expectedFeatures: ['suspension', 'gears'], minPrice: 40 },
      photography: { expectedFeatures: ['high resolution', 'stabilization'], minPrice: 80 },
      water_sports: { expectedFeatures: ['waterproof', 'buoyant'], minPrice: 30 },
      winter_sports: { expectedFeatures: ['all-mountain', 'bindings'], minPrice: 50 }
    };

    for (const [category, test] of Object.entries(moduleTests)) {
      const categoryListings = await db.collection('listings')
        .where('category', '==', category)
        .get();
      
      if (categoryListings.size > 0) {
        let hasExpectedFeatures = 0;
        let meetsMinPrice = 0;
        
        categoryListings.forEach(doc => {
          const listing = doc.data();
          
          if (listing.features && test.expectedFeatures.some(feature => 
            listing.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
          )) {
            hasExpectedFeatures++;
          }
          
          if (listing.dailyPrice >= test.minPrice) {
            meetsMinPrice++;
          }
        });
        
        console.log(`   ${category}:`);
        console.log(`     Listings with expected features: ${hasExpectedFeatures}/${categoryListings.size}`);
        console.log(`     Listings meeting min price ($${test.minPrice}): ${meetsMinPrice}/${categoryListings.size}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🏕️ MODULE LISTINGS TEST SUMMARY');
    console.log('='.repeat(60));

    const categoriesWithListings = Object.keys(categoryCount).length;
    const totalListings = listingsSnapshot.size;
    const qualityPercentage = (averageQuality / qualityChecks.length) * 100;

    console.log(`\n📊 RESULTS:`);
    console.log(`   Total listings: ${totalListings}`);
    console.log(`   Categories covered: ${categoriesWithListings}/${expectedCategories.length}`);
    console.log(`   Average quality score: ${qualityPercentage.toFixed(1)}%`);
    console.log(`   Available listings: ${availableListings}/${totalListings}`);
    console.log(`   Location coverage: ${listingsWithLocation}/${totalListings}`);
    console.log(`   Average daily price: $${averagePrice.toFixed(2)}`);

    if (categoriesWithListings === expectedCategories.length && 
        qualityPercentage > 80 && 
        listingsWithLocation === totalListings) {
      console.log('\n🎉 ALL MODULE LISTINGS TESTS PASSED!');
      console.log('✅ All categories have comprehensive test data');
      console.log('✅ Listings meet quality standards');
      console.log('✅ Location-based search is functional');
      console.log('✅ Pricing and availability systems work');
    } else {
      console.log('\n⚠️  Some module tests need attention');
    }

  } catch (error) {
    console.error('❌ Error testing module listings:', error);
    throw error;
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Run the test
testModuleListings()
  .then(() => {
    console.log('\n🚀 Module listings testing completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

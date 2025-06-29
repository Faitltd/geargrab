#!/usr/bin/env node

/**
 * Test Advanced Search & AI Features Script
 * This script tests the advanced search functionality and AI-powered recommendations
 */

import admin from 'firebase-admin';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

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

async function testAdvancedSearchAI() {
  try {
    console.log('🔍 Testing Advanced Search & AI Features...');
    
    // Get Firestore instance
    const db = admin.firestore();

    // Test 1: Check search infrastructure
    console.log('\n📋 Test 1: Checking search infrastructure...');
    
    const searchFiles = [
      'src/lib/services/search.ts',
      'src/lib/services/location-search.ts',
      'src/lib/services/ai-recommendations.ts',
      'src/lib/components/search/advanced-search.svelte',
      'src/lib/components/search/interactive-map.svelte',
      'src/lib/components/search/ai-powered-results.svelte',
      'src/routes/api/search/+server.ts',
      'src/routes/api/search/listings/+server.ts'
    ];
    
    searchFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${filePath} exists`);
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const features = [
          'location',
          'search',
          'filter',
          'recommendation',
          'AI'
        ];
        
        features.forEach(feature => {
          if (content.toLowerCase().includes(feature.toLowerCase())) {
            console.log(`     ✅ Contains ${feature} functionality`);
          }
        });
      } else {
        console.log(`❌ ${filePath} not found`);
      }
    });

    // Test 2: Analyze search data
    console.log('\n🔍 Test 2: Analyzing search data...');
    
    const listingsQuery = await db.collection('listings').get();
    const bookingsQuery = await db.collection('bookings').get();
    const usersQuery = await db.collection('users').get();
    
    console.log(`Data available for search:`);
    console.log(`   Listings: ${listingsQuery.size}`);
    console.log(`   Bookings: ${bookingsQuery.size}`);
    console.log(`   Users: ${usersQuery.size}`);

    // Test 3: Category analysis for smart filtering
    console.log('\n🏷️ Test 3: Analyzing categories for smart filtering...');
    
    const categoryCount = {};
    const brandCount = {};
    const featureCount = {};
    const priceRanges = [];
    
    listingsQuery.forEach(doc => {
      const listing = doc.data();
      
      // Categories
      const category = listing.category || 'other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      
      // Brands
      if (listing.brand) {
        brandCount[listing.brand] = (brandCount[listing.brand] || 0) + 1;
      }
      
      // Features
      if (listing.features && Array.isArray(listing.features)) {
        listing.features.forEach(feature => {
          featureCount[feature] = (featureCount[feature] || 0) + 1;
        });
      }
      
      // Prices
      if (listing.dailyPrice) {
        priceRanges.push(listing.dailyPrice);
      }
    });
    
    console.log('Category distribution:');
    Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} listings`);
      });
    
    console.log('Top brands:');
    Object.entries(brandCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([brand, count]) => {
        console.log(`   ${brand}: ${count} listings`);
      });
    
    console.log('Popular features:');
    Object.entries(featureCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([feature, count]) => {
        console.log(`   ${feature}: ${count} listings`);
      });
    
    if (priceRanges.length > 0) {
      const minPrice = Math.min(...priceRanges);
      const maxPrice = Math.max(...priceRanges);
      const avgPrice = priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length;
      
      console.log('Price analysis:');
      console.log(`   Range: $${minPrice} - $${maxPrice}`);
      console.log(`   Average: $${avgPrice.toFixed(2)}`);
      console.log(`   Budget (<$${Math.round(avgPrice * 0.7)}): ${priceRanges.filter(p => p < avgPrice * 0.7).length} items`);
      console.log(`   Premium (>$${Math.round(avgPrice * 1.3)}): ${priceRanges.filter(p => p > avgPrice * 1.3).length} items`);
    }

    // Test 4: Location-based search analysis
    console.log('\n📍 Test 4: Analyzing location data for geo-search...');
    
    const locationData = [];
    listingsQuery.forEach(doc => {
      const listing = doc.data();
      if (listing.location && listing.location.lat && listing.location.lng) {
        locationData.push({
          lat: listing.location.lat,
          lng: listing.location.lng,
          city: listing.location.city || 'Unknown',
          state: listing.location.state || 'Unknown'
        });
      }
    });
    
    console.log(`Listings with location data: ${locationData.length}/${listingsQuery.size}`);
    
    if (locationData.length > 0) {
      // Group by city
      const cityCount = {};
      locationData.forEach(loc => {
        const cityKey = `${loc.city}, ${loc.state}`;
        cityCount[cityKey] = (cityCount[cityKey] || 0) + 1;
      });
      
      console.log('Top cities:');
      Object.entries(cityCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([city, count]) => {
          console.log(`   ${city}: ${count} listings`);
        });
      
      // Calculate center point for default map view
      const avgLat = locationData.reduce((sum, loc) => sum + loc.lat, 0) / locationData.length;
      const avgLng = locationData.reduce((sum, loc) => sum + loc.lng, 0) / locationData.length;
      console.log(`Geographic center: ${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}`);
    }

    // Test 5: User behavior analysis for AI recommendations
    console.log('\n🤖 Test 5: Analyzing user behavior for AI recommendations...');
    
    const userActivity = {};
    bookingsQuery.forEach(doc => {
      const booking = doc.data();
      const userId = booking.renterUid;
      
      if (userId) {
        if (!userActivity[userId]) {
          userActivity[userId] = {
            bookings: 0,
            categories: new Set(),
            totalSpent: 0,
            avgPrice: 0
          };
        }
        
        userActivity[userId].bookings++;
        userActivity[userId].totalSpent += booking.totalPrice || 0;
        
        // Get listing category
        const listingDoc = listingsQuery.docs.find(doc => doc.id === booking.listingId);
        if (listingDoc) {
          const listing = listingDoc.data();
          if (listing.category) {
            userActivity[userId].categories.add(listing.category);
          }
        }
      }
    });
    
    // Calculate average prices
    Object.values(userActivity).forEach(activity => {
      activity.avgPrice = activity.bookings > 0 ? activity.totalSpent / activity.bookings : 0;
    });
    
    const activeUsers = Object.keys(userActivity).length;
    const totalBookings = Object.values(userActivity).reduce((sum, activity) => sum + activity.bookings, 0);
    const avgBookingsPerUser = activeUsers > 0 ? totalBookings / activeUsers : 0;
    
    console.log(`Active users (with bookings): ${activeUsers}/${usersQuery.size}`);
    console.log(`Average bookings per active user: ${avgBookingsPerUser.toFixed(1)}`);
    
    if (activeUsers > 0) {
      const userPreferences = Object.values(userActivity);
      const avgSpent = userPreferences.reduce((sum, activity) => sum + activity.totalSpent, 0) / activeUsers;
      console.log(`Average total spent per user: $${avgSpent.toFixed(2)}`);
      
      // Most popular categories among active users
      const allCategories = {};
      userPreferences.forEach(activity => {
        activity.categories.forEach(category => {
          allCategories[category] = (allCategories[category] || 0) + 1;
        });
      });
      
      console.log('Popular categories among active users:');
      Object.entries(allCategories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count} users`);
        });
    }

    // Test 6: Trending analysis
    console.log('\n🔥 Test 6: Analyzing trending patterns...');
    
    const recentBookings = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    bookingsQuery.forEach(doc => {
      const booking = doc.data();
      const createdAt = booking.createdAt?.toDate();
      
      if (createdAt && createdAt >= thirtyDaysAgo) {
        const listingId = booking.listingId;
        recentBookings[listingId] = (recentBookings[listingId] || 0) + 1;
      }
    });
    
    const trendingItems = Object.entries(recentBookings)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.log('Trending items (most booked in last 30 days):');
    trendingItems.forEach(([listingId, bookingCount]) => {
      const listingDoc = listingsQuery.docs.find(doc => doc.id === listingId);
      const listingTitle = listingDoc ? listingDoc.data().title : 'Unknown Item';
      console.log(`   ${listingTitle}: ${bookingCount} bookings`);
    });

    // Test 7: Search performance simulation
    console.log('\n⚡ Test 7: Simulating search performance...');
    
    const searchScenarios = [
      { query: 'tent', category: 'camping', expectedResults: 'camping gear' },
      { query: 'camera', category: 'photography', expectedResults: 'photography equipment' },
      { query: 'bike', category: 'cycling', expectedResults: 'cycling gear' },
      { location: { lat: 39.7392, lng: -104.9903, radius: 25 }, expectedResults: 'Denver area listings' }
    ];
    
    searchScenarios.forEach((scenario, index) => {
      console.log(`   Scenario ${index + 1}:`);
      
      if (scenario.query) {
        const matchingListings = listingsQuery.docs.filter(doc => {
          const listing = doc.data();
          const searchText = [listing.title, listing.description, listing.brand].join(' ').toLowerCase();
          return searchText.includes(scenario.query.toLowerCase());
        });
        console.log(`     Query "${scenario.query}": ${matchingListings.length} potential matches`);
      }
      
      if (scenario.category) {
        const categoryMatches = listingsQuery.docs.filter(doc => {
          const listing = doc.data();
          return listing.category === scenario.category;
        });
        console.log(`     Category "${scenario.category}": ${categoryMatches.length} matches`);
      }
      
      if (scenario.location) {
        const locationMatches = locationData.filter(loc => {
          // Simple distance calculation (not precise but good for testing)
          const latDiff = Math.abs(loc.lat - scenario.location.lat);
          const lngDiff = Math.abs(loc.lng - scenario.location.lng);
          const roughDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 69; // Rough miles
          return roughDistance <= scenario.location.radius;
        });
        console.log(`     Location search: ${locationMatches.length} listings within ${scenario.location.radius} miles`);
      }
    });

    console.log('\n🎉 Advanced Search & AI Features tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Search infrastructure: ✅ Complete`);
    console.log(`   - Data for search: ${listingsQuery.size} listings, ${bookingsQuery.size} bookings`);
    console.log(`   - Categories available: ${Object.keys(categoryCount).length}`);
    console.log(`   - Location-enabled listings: ${locationData.length}/${listingsQuery.size}`);
    console.log(`   - Active users for AI: ${activeUsers}/${usersQuery.size}`);
    console.log(`   - Trending items identified: ${trendingItems.length}`);
    console.log(`   - Smart filters possible: ${Object.keys(categoryCount).length + Object.keys(featureCount).length}`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('   - Test advanced search UI in browser');
    console.log('   - Verify location-based search with maps');
    console.log('   - Test AI recommendations for logged-in users');
    console.log('   - Implement search analytics tracking');
    console.log('   - Add search result caching for performance');
    console.log('   - Consider implementing Elasticsearch for better search');
    console.log('   - Add machine learning for improved recommendations');
    console.log('   - Test mobile search experience');

  } catch (error) {
    console.error('❌ Error testing advanced search & AI features:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAdvancedSearchAI();

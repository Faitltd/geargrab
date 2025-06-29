#!/usr/bin/env node

/**
 * Test Search API Script
 * This script tests the search functionality by directly querying Firebase
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

async function testSearchAPI() {
  try {
    console.log('🔍 Testing search functionality...');
    
    // Get Firestore instance
    const db = admin.firestore();

    // Test 1: Get all active listings
    console.log('\n📦 Test 1: Getting all active listings...');
    const allListingsQuery = await db.collection('listings')
      .where('status', '==', 'active')
      .limit(10)
      .get();

    console.log(`✅ Found ${allListingsQuery.size} active listings`);
    
    if (allListingsQuery.size > 0) {
      allListingsQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.title} (${data.category}) - $${data.dailyPrice}/day`);
      });
    }

    // Test 2: Search by category
    console.log('\n🏕️ Test 2: Searching for camping gear...');
    const campingQuery = await db.collection('listings')
      .where('status', '==', 'active')
      .where('category', '==', 'camping')
      .limit(5)
      .get();

    console.log(`✅ Found ${campingQuery.size} camping items`);
    
    if (campingQuery.size > 0) {
      campingQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.title} - $${data.dailyPrice}/day`);
      });
    }

    // Test 3: Search by text (client-side filtering simulation)
    console.log('\n🔍 Test 3: Text search for "tent"...');
    const textSearchQuery = await db.collection('listings')
      .where('status', '==', 'active')
      .limit(20)
      .get();

    let tentResults = [];
    textSearchQuery.forEach((doc) => {
      const data = doc.data();
      const searchableText = [
        data.title,
        data.description,
        data.brand,
        data.model,
        data.category,
        ...(data.features || [])
      ].join(' ').toLowerCase();

      if (searchableText.includes('tent')) {
        tentResults.push({ id: doc.id, ...data });
      }
    });

    console.log(`✅ Found ${tentResults.length} items matching "tent"`);
    
    if (tentResults.length > 0) {
      tentResults.forEach((item) => {
        console.log(`   - ${item.title} - $${item.dailyPrice}/day`);
      });
    }

    // Test 4: Search by location
    console.log('\n📍 Test 4: Searching by location (Salt Lake City)...');
    const locationQuery = await db.collection('listings')
      .where('status', '==', 'active')
      .where('location.city', '==', 'Salt Lake City')
      .limit(5)
      .get();

    console.log(`✅ Found ${locationQuery.size} items in Salt Lake City`);
    
    if (locationQuery.size > 0) {
      locationQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.title} - $${data.dailyPrice}/day`);
      });
    }

    // Test 5: Price range search (client-side filtering)
    console.log('\n💰 Test 5: Searching by price range ($20-$50) - client-side...');
    const allForPriceQuery = await db.collection('listings')
      .where('status', '==', 'active')
      .limit(20)
      .get();

    let priceFilteredResults = [];
    allForPriceQuery.forEach((doc) => {
      const data = doc.data();
      if (data.dailyPrice >= 20 && data.dailyPrice <= 50) {
        priceFilteredResults.push({ id: doc.id, ...data });
      }
    });

    console.log(`✅ Found ${priceFilteredResults.length} items in $20-$50 range`);

    if (priceFilteredResults.length > 0) {
      priceFilteredResults.forEach((item) => {
        console.log(`   - ${item.title} - $${item.dailyPrice}/day`);
      });
    }

    // Test 6: Search by location (Denver)
    console.log('\n📍 Test 6: Searching by location (Denver)...');
    const denverQuery = await db.collection('listings')
      .where('status', '==', 'active')
      .where('location.city', '==', 'Denver')
      .limit(5)
      .get();

    console.log(`✅ Found ${denverQuery.size} items in Denver`);

    if (denverQuery.size > 0) {
      denverQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.title} - $${data.dailyPrice}/day`);
      });
    }

    console.log('\n🎉 Search API tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total active listings: ${allListingsQuery.size}`);
    console.log(`   - Camping gear: ${campingQuery.size}`);
    console.log(`   - Items with "tent": ${tentResults.length}`);
    console.log(`   - Salt Lake City items: ${locationQuery.size}`);
    console.log(`   - $20-$50 price range: ${priceFilteredResults.length}`);
    console.log(`   - Denver items: ${denverQuery.size}`);

  } catch (error) {
    console.error('❌ Error testing search API:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testSearchAPI();

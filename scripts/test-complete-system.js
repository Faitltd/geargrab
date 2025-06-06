#!/usr/bin/env node

/**
 * Complete System Test Script
 * 
 * Tests all the newly implemented features:
 * 1. Listings database with geolocation
 * 2. Image upload for listings
 * 3. Search with Haversine filtering
 * 4. Message file attachments
 * 5. FCM notifications
 * 6. Booking system
 * 
 * Usage:
 * node scripts/test-complete-system.js
 */

const BASE_URL = 'http://localhost:5173';

console.log('🧪 Testing Complete GearGrab System...\n');

// Test 1: Health Checks
console.log('🏥 Testing Health Checks:');

async function testHealthChecks() {
  try {
    // Test Twilio health
    const twilioResponse = await fetch(`${BASE_URL}/api/health/twilio`);
    const twilioData = await twilioResponse.json();
    console.log(`  Twilio: ${twilioData.success ? '✅' : '❌'} ${twilioData.message}`);

    // Test Firebase connection (via debug endpoint)
    const envResponse = await fetch(`${BASE_URL}/api/debug/env`);
    const envData = await envResponse.json();
    console.log(`  Environment: ${envData.twilioAccountSid === 'SET' ? '✅' : '❌'} Variables loaded`);

  } catch (error) {
    console.log(`  ❌ Health check failed: ${error.message}`);
  }
}

// Test 2: Geocoding API
console.log('\n🗺️ Testing Geocoding API:');

async function testGeocoding() {
  try {
    // Test forward geocoding
    const address = 'Denver, CO';
    const forwardResponse = await fetch(`${BASE_URL}/api/geocode?address=${encodeURIComponent(address)}`);
    const forwardData = await forwardResponse.json();
    
    if (forwardData.success) {
      console.log(`  ✅ Forward geocoding: ${address} -> ${forwardData.result.lat}, ${forwardData.result.lng}`);
      
      // Test reverse geocoding
      const reverseResponse = await fetch(`${BASE_URL}/api/geocode?lat=${forwardData.result.lat}&lng=${forwardData.result.lng}`);
      const reverseData = await reverseResponse.json();
      
      if (reverseData.success) {
        console.log(`  ✅ Reverse geocoding: ${reverseData.result.formattedAddress}`);
      } else {
        console.log(`  ❌ Reverse geocoding failed: ${reverseData.error}`);
      }
    } else {
      console.log(`  ❌ Forward geocoding failed: ${forwardData.error}`);
    }

  } catch (error) {
    console.log(`  ❌ Geocoding test failed: ${error.message}`);
  }
}

// Test 3: Search API
console.log('\n🔍 Testing Search API:');

async function testSearch() {
  try {
    // Test basic search
    const searchResponse = await fetch(`${BASE_URL}/api/search/listings?q=camera&limit=5`);
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log(`  ✅ Basic search: Found ${searchData.listings.length} listings`);
      
      // Test location-based search
      const locationResponse = await fetch(`${BASE_URL}/api/search/listings?lat=39.7392&lng=-104.9903&radius=50&limit=5`);
      const locationData = await locationResponse.json();
      
      if (locationData.success) {
        console.log(`  ✅ Location search: Found ${locationData.listings.length} listings near Denver`);
      } else {
        console.log(`  ❌ Location search failed: ${locationData.error}`);
      }
    } else {
      console.log(`  ❌ Basic search failed: ${searchData.error}`);
    }

  } catch (error) {
    console.log(`  ❌ Search test failed: ${error.message}`);
  }
}

// Test 4: API Endpoints (Authentication Required)
console.log('\n🔐 Testing Protected API Endpoints:');

async function testProtectedEndpoints() {
  try {
    // Test listing image upload (should require auth)
    const uploadResponse = await fetch(`${BASE_URL}/api/listings/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log(`  Image Upload: ${uploadResponse.status === 401 ? '✅' : '❌'} Auth required (${uploadResponse.status})`);

    // Test message attachment upload (should require auth)
    const attachmentResponse = await fetch(`${BASE_URL}/api/messages/upload-attachment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log(`  Message Attachment: ${attachmentResponse.status === 401 ? '✅' : '❌'} Auth required (${attachmentResponse.status})`);

    // Test booking creation (should require auth)
    const bookingResponse = await fetch(`${BASE_URL}/api/bookings/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log(`  Booking Creation: ${bookingResponse.status === 401 ? '✅' : '❌'} Auth required (${bookingResponse.status})`);

    // Test notification sending (should require auth)
    const notificationResponse = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log(`  Notifications: ${notificationResponse.status === 401 ? '✅' : '❌'} Auth required (${notificationResponse.status})`);

  } catch (error) {
    console.log(`  ❌ Protected endpoints test failed: ${error.message}`);
  }
}

// Test 5: Environment Configuration
console.log('\n⚙️ Testing Environment Configuration:');

function testEnvironmentConfig() {
  const requiredVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'GOOGLE_MAPS_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL'
  ];

  console.log('  Required environment variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const displayValue = varName.includes('TOKEN') || varName.includes('KEY') || varName.includes('PRIVATE') 
        ? '***hidden***' 
        : value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`    ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`    ❌ ${varName}: Not set`);
    }
  });
}

// Test 6: Database Schema Validation
console.log('\n📊 Database Schema Information:');

function testDatabaseSchema() {
  console.log('  Expected Firestore Collections:');
  const collections = [
    'users - User profiles and authentication data',
    'listings - Gear listings with geolocation',
    'bookings - Booking requests and confirmations',
    'messages - Chat messages with file attachments',
    'phoneVerifications - SMS verification codes',
    'auditLogs - Security and activity logs'
  ];

  collections.forEach(collection => {
    console.log(`    📁 ${collection}`);
  });

  console.log('\n  Expected Firebase Storage Buckets:');
  const buckets = [
    'listings/{listingId}/ - Listing images',
    'message_attachments/{conversationId}/ - Message files',
    'users/{userId}/profile/ - Profile images',
    'verification/{userId}/ - Verification documents',
    'bookings/{bookingId}/ - Booking evidence'
  ];

  buckets.forEach(bucket => {
    console.log(`    🗂️ ${bucket}`);
  });
}

// Run all tests
async function runAllTests() {
  await testHealthChecks();
  await testGeocoding();
  await testSearch();
  await testProtectedEndpoints();
  testEnvironmentConfig();
  testDatabaseSchema();

  console.log('\n🎉 Complete system test finished!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up Google Maps API key for geocoding');
  console.log('2. Test with authenticated user sessions');
  console.log('3. Create sample listings with real data');
  console.log('4. Test file uploads with actual files');
  console.log('5. Test booking flow end-to-end');
  console.log('6. Set up FCM for push notifications');
}

// Execute tests
runAllTests().catch(console.error);

#!/usr/bin/env node

/**
 * Debug Location Data Script
 * Check existing listing structure to understand the error
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

async function debugLocationData() {
  try {
    console.log('🔍 Debugging location data structure...');
    
    const db = admin.firestore();

    // Get first few listings to examine structure
    const listingsSnapshot = await db.collection('listings').limit(3).get();
    
    if (listingsSnapshot.empty) {
      throw new Error('No listings found');
    }

    console.log(`Found ${listingsSnapshot.size} listings to examine`);

    listingsSnapshot.forEach((doc, index) => {
      const listing = doc.data();
      
      console.log(`\n📋 Listing ${index + 1}: ${listing.title || 'Untitled'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Location field exists: ${listing.location !== undefined}`);
      
      if (listing.location) {
        console.log(`   Location type: ${typeof listing.location}`);
        console.log(`   Location content:`, JSON.stringify(listing.location, null, 2));
        
        if (typeof listing.location === 'object') {
          console.log(`   Has lat: ${listing.location.lat !== undefined}`);
          console.log(`   Has lng: ${listing.location.lng !== undefined}`);
        }
      } else {
        console.log(`   Location: null/undefined`);
      }
      
      // Show all fields for debugging
      console.log(`   All fields:`, Object.keys(listing));
    });

  } catch (error) {
    console.error('❌ Error debugging location data:', error);
    throw error;
  }
}

// Run the debug script
debugLocationData()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });

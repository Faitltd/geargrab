#!/usr/bin/env node

/**
 * Simple Location Data Fix Script
 * Adds lat/lng coordinates to listings that don't have them
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

async function fixLocationData() {
  try {
    console.log('📍 Fixing location data for listings...');
    
    const db = admin.firestore();

    // Get all listings
    const listingsSnapshot = await db.collection('listings').get();
    
    if (listingsSnapshot.empty) {
      throw new Error('No listings found');
    }

    console.log(`Found ${listingsSnapshot.size} listings to check`);

    const batch = db.batch();
    let updatedCount = 0;

    // Default Colorado coordinates (Denver area)
    const defaultLocation = {
      lat: 39.7392,
      lng: -104.9903,
      city: 'Denver',
      state: 'CO',
      address: 'Denver, CO',
      zipCode: '80202',
      country: 'US'
    };

    for (const doc of listingsSnapshot.docs) {
      const listing = doc.data();
      
      // Check if listing needs location data
      const hasDirectCoords = listing.location && listing.location.lat && listing.location.lng;
      const hasNestedCoords = listing.location && listing.location.coordinates && 
                             listing.location.coordinates.lat && listing.location.coordinates.lng;
      
      if (hasDirectCoords || hasNestedCoords) {
        console.log(`   ✅ ${listing.title || 'Untitled'} - already has coordinates`);
        continue;
      }

      // Add random variation to coordinates (within ~10 mile radius)
      const latVariation = (Math.random() - 0.5) * 0.2; // ~10 miles
      const lngVariation = (Math.random() - 0.5) * 0.2; // ~10 miles
      
      const newLocationData = {
        ...defaultLocation,
        lat: defaultLocation.lat + latVariation,
        lng: defaultLocation.lng + lngVariation
      };

      // Preserve existing location data if it exists
      if (listing.location) {
        newLocationData.city = listing.location.city || defaultLocation.city;
        newLocationData.state = listing.location.state || defaultLocation.state;
        newLocationData.zipCode = listing.location.zipCode || defaultLocation.zipCode;
        newLocationData.address = `${newLocationData.city}, ${newLocationData.state}`;
      }

      // Update the listing
      batch.update(doc.ref, {
        location: newLocationData,
        updatedAt: admin.firestore.Timestamp.now()
      });

      updatedCount++;
      console.log(`   ✓ Updated ${listing.title || 'Untitled'}: ${newLocationData.city}, ${newLocationData.state} (${newLocationData.lat.toFixed(4)}, ${newLocationData.lng.toFixed(4)})`);
    }

    // Commit the batch update
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updatedCount} listings with location data`);
    } else {
      console.log('✅ All listings already have location data');
    }

    // Verify the update
    console.log('\n🔍 Verifying location data...');
    const updatedListingsSnapshot = await db.collection('listings').get();
    
    let listingsWithLocation = 0;
    
    updatedListingsSnapshot.forEach(doc => {
      const listing = doc.data();
      const hasDirectCoords = listing.location && listing.location.lat && listing.location.lng;
      const hasNestedCoords = listing.location && listing.location.coordinates && 
                             listing.location.coordinates.lat && listing.location.coordinates.lng;
      
      if (hasDirectCoords || hasNestedCoords) {
        listingsWithLocation++;
      }
    });

    console.log(`📊 Location Data Summary:`);
    console.log(`   Total listings: ${updatedListingsSnapshot.size}`);
    console.log(`   Listings with location: ${listingsWithLocation}/${updatedListingsSnapshot.size}`);
    console.log(`   Coverage: ${((listingsWithLocation / updatedListingsSnapshot.size) * 100).toFixed(1)}%`);

    // Test location-based search
    console.log('\n🔍 Testing location-based search...');
    
    const denverLat = 39.7392;
    const denverLng = -104.9903;
    const searchRadius = 25; // miles
    
    let nearbyListings = 0;
    
    updatedListingsSnapshot.forEach(doc => {
      const listing = doc.data();
      let lat, lng;
      
      if (listing.location && listing.location.lat && listing.location.lng) {
        lat = listing.location.lat;
        lng = listing.location.lng;
      } else if (listing.location && listing.location.coordinates) {
        lat = listing.location.coordinates.lat;
        lng = listing.location.coordinates.lng;
      }
      
      if (lat && lng) {
        const distance = calculateDistance(denverLat, denverLng, lat, lng);
        
        if (distance <= searchRadius) {
          nearbyListings++;
        }
      }
    });
    
    console.log(`   Listings within ${searchRadius} miles of Denver: ${nearbyListings}`);
    
    if (listingsWithLocation === updatedListingsSnapshot.size) {
      console.log('\n🎉 All listings now have location data!');
      console.log('✅ Geo-search functionality is ready!');
    } else {
      console.log('\n⚠️  Some listings still missing location data');
    }

  } catch (error) {
    console.error('❌ Error fixing location data:', error);
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

// Run the script
fixLocationData()
  .then(() => {
    console.log('\n🚀 Location data fix completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

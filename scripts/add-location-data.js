#!/usr/bin/env node

/**
 * Add Location Data to Listings Script
 * Adds lat/lng coordinates to all listings for geo-search functionality
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

// Colorado cities with coordinates (GearGrab's primary market)
const coloradoCities = [
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Boulder', state: 'CO', lat: 40.0150, lng: -105.2705 },
  { city: 'Fort Collins', state: 'CO', lat: 40.5853, lng: -105.0844 },
  { city: 'Colorado Springs', state: 'CO', lat: 38.8339, lng: -104.8214 },
  { city: 'Aspen', state: 'CO', lat: 39.1911, lng: -106.8175 },
  { city: 'Vail', state: 'CO', lat: 39.6403, lng: -106.3742 },
  { city: 'Steamboat Springs', state: 'CO', lat: 40.4850, lng: -106.8317 },
  { city: 'Durango', state: 'CO', lat: 37.2753, lng: -107.8801 },
  { city: 'Grand Junction', state: 'CO', lat: 39.0639, lng: -108.5506 },
  { city: 'Pueblo', state: 'CO', lat: 38.2544, lng: -104.6091 }
];

async function addLocationDataToListings() {
  try {
    console.log('📍 Adding location data to listings...');
    
    const db = admin.firestore();

    // Get all listings
    const listingsSnapshot = await db.collection('listings').get();
    
    if (listingsSnapshot.empty) {
      throw new Error('No listings found');
    }

    console.log(`Found ${listingsSnapshot.size} listings to update`);

    const batch = db.batch();
    let updatedCount = 0;

    listingsSnapshot.forEach((doc, index) => {
      const listing = doc.data();
      
      // Check if listing already has complete location data
      const hasDirectCoords = listing.location && listing.location.lat && listing.location.lng;
      const hasNestedCoords = listing.location && listing.location.coordinates &&
                             listing.location.coordinates.lat && listing.location.coordinates.lng;

      if (hasDirectCoords || hasNestedCoords) {
        console.log(`   ⏭️  Skipping ${listing.title} - already has location data`);
        return;
      }

      // Assign a random Colorado city to each listing
      const randomCity = coloradoCities[index % coloradoCities.length];

      if (!randomCity || !randomCity.lat || !randomCity.lng) {
        console.log(`   ⚠️  Skipping ${listing.title} - invalid city data`);
        return;
      }

      // Add some random variation to coordinates (within ~5 mile radius)
      const latVariation = (Math.random() - 0.5) * 0.1; // ~5 miles
      const lngVariation = (Math.random() - 0.5) * 0.1; // ~5 miles

      const locationData = {
        lat: randomCity.lat + latVariation,
        lng: randomCity.lng + lngVariation,
        city: randomCity.city,
        state: randomCity.state,
        address: `${randomCity.city}, ${randomCity.state}`,
        zipCode: `8${Math.floor(Math.random() * 9000) + 1000}`, // Random Colorado-like zip
        country: 'US'
      };

      // Update the listing
      batch.update(doc.ref, {
        location: locationData,
        updatedAt: admin.firestore.Timestamp.now()
      });

      updatedCount++;
      console.log(`   ✓ Updated ${listing.title}: ${locationData.city}, ${locationData.state}`);
    });

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
    const cityDistribution = {};
    
    updatedListingsSnapshot.forEach(doc => {
      const listing = doc.data();
      const hasDirectCoords = listing.location && listing.location.lat && listing.location.lng;
      const hasNestedCoords = listing.location && listing.location.coordinates &&
                             listing.location.coordinates.lat && listing.location.coordinates.lng;

      if (hasDirectCoords || hasNestedCoords) {
        listingsWithLocation++;
        const city = listing.location.city || 'Unknown';
        cityDistribution[city] = (cityDistribution[city] || 0) + 1;
      }
    });

    console.log(`📊 Location Data Summary:`);
    console.log(`   Total listings: ${updatedListingsSnapshot.size}`);
    console.log(`   Listings with location: ${listingsWithLocation}/${updatedListingsSnapshot.size}`);
    console.log(`   Coverage: ${((listingsWithLocation / updatedListingsSnapshot.size) * 100).toFixed(1)}%`);
    
    console.log(`\n🏙️ City Distribution:`);
    Object.entries(cityDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([city, count]) => {
        console.log(`   ${city}: ${count} listings`);
      });

    // Test location-based search
    console.log('\n🔍 Testing location-based search...');
    
    // Search within 25 miles of Denver
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
      console.log('\n🎉 Location data successfully added to all listings!');
      console.log('✅ Geo-search functionality is now ready!');
    } else {
      console.log('\n⚠️  Some listings still missing location data');
    }

  } catch (error) {
    console.error('❌ Error adding location data:', error);
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
addLocationDataToListings()
  .then(() => {
    console.log('\n🚀 Location data addition completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

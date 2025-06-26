#!/usr/bin/env node

/**
 * Remove Dummy Listings from Firestore Database
 * This script identifies and removes all dummy/test listings from the database
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'geargrabco',
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

let app;
try {
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId
  });
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

const db = getFirestore(app);

// Dummy listing identifiers (titles, brands, or other identifying features)
const DUMMY_IDENTIFIERS = [
  // Titles
  'REI Co-op Half Dome 4 Plus Tent',
  'Professional DSLR Camera Kit - Canon EOS R5',
  'Mountain Bike - Trek Fuel EX 8',
  'Mountain Bike - Trek X-Caliber 8',
  'Kayak - Wilderness Systems Pungo 120',
  'Canon EOS R5',
  'Trek Fuel EX 8',
  'Trek X-Caliber 8',
  'Wilderness Systems Pungo 120',
  
  // Brands that are likely dummy data
  'REI Co-op',
  'Trek',
  'Wilderness Systems',
  
  // Common dummy descriptions
  'Experience the great outdoors',
  'Complete professional photography setup',
  'High-performance full-suspension mountain bike',
  'High-quality mountain bike for trail riding',
  'Stable and comfortable kayak for lake adventures',
  
  // Dummy owner names
  'David Wilson',
  'Marcus Rodriguez',
  'James Taylor',
  'Sarah Johnson',
  'Lisa Martinez',
  
  // Dummy locations
  'Salt Lake City',
  'Denver',
  'Boulder',
  'Fort Collins'
];

async function removeDummyListings() {
  try {
    console.log('🔍 Scanning for dummy listings...');
    
    // Get all listings
    const listingsRef = db.collection('listings');
    const snapshot = await listingsRef.get();
    
    if (snapshot.empty) {
      console.log('📭 No listings found in database');
      return;
    }
    
    console.log(`📦 Found ${snapshot.size} total listings`);
    
    const dummyListings = [];
    const realListings = [];
    
    // Analyze each listing
    snapshot.forEach((doc) => {
      const data = doc.data();
      const listing = { id: doc.id, ...data };
      
      // Check if this looks like a dummy listing
      const isDummy = isDummyListing(listing);
      
      if (isDummy) {
        dummyListings.push(listing);
      } else {
        realListings.push(listing);
      }
    });
    
    console.log(`🎯 Identified ${dummyListings.length} dummy listings`);
    console.log(`✅ Identified ${realListings.length} real listings`);
    
    if (dummyListings.length === 0) {
      console.log('🎉 No dummy listings found to remove!');
      return;
    }
    
    // Show what will be removed
    console.log('\n📋 Dummy listings to be removed:');
    dummyListings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title} (ID: ${listing.id})`);
      console.log(`   Owner: ${listing.owner?.name || 'Unknown'}`);
      console.log(`   Location: ${listing.location?.city || 'Unknown'}`);
      console.log('');
    });
    
    // Remove dummy listings
    console.log('🗑️ Removing dummy listings...');
    const batch = db.batch();
    
    dummyListings.forEach((listing) => {
      const docRef = listingsRef.doc(listing.id);
      batch.delete(docRef);
    });
    
    await batch.commit();
    
    console.log(`✅ Successfully removed ${dummyListings.length} dummy listings!`);
    console.log(`📊 Remaining listings: ${realListings.length}`);
    
    if (realListings.length > 0) {
      console.log('\n📋 Remaining real listings:');
      realListings.forEach((listing, index) => {
        console.log(`${index + 1}. ${listing.title} (ID: ${listing.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error removing dummy listings:', error);
  }
}

function isDummyListing(listing) {
  const searchText = [
    listing.title || '',
    listing.description || '',
    listing.brand || '',
    listing.model || '',
    listing.owner?.name || '',
    listing.location?.city || '',
    listing.location?.state || ''
  ].join(' ').toLowerCase();
  
  // Check against dummy identifiers
  for (const identifier of DUMMY_IDENTIFIERS) {
    if (searchText.includes(identifier.toLowerCase())) {
      return true;
    }
  }
  
  // Check for other dummy patterns
  if (listing.owner?.uid && listing.owner.uid.startsWith('owner')) {
    return true; // UIDs like 'owner123', 'owner456'
  }
  
  // Check for dummy email patterns
  if (listing.owner?.email && listing.owner.email.includes('example.com')) {
    return true;
  }
  
  // Check for unrealistic pricing (too perfect numbers)
  if (listing.dailyPrice && [25, 45, 50, 65, 85].includes(listing.dailyPrice)) {
    return true;
  }
  
  return false;
}

// Run the script
removeDummyListings()
  .then(() => {
    console.log('🎉 Dummy listing removal completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

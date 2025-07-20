#!/usr/bin/env node

/**
 * Update REI references to GearGrab in Firestore
 * 
 * This script updates existing Firestore data to replace REI with GearGrab
 * 
 * Usage: node scripts/update-rei-to-geargrab.js
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  doc, 
  updateDoc
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANV1v2FhD2KtXxBUsfGrDm9442dGGCuYs",
  authDomain: "geargrabco.firebaseapp.com",
  projectId: "geargrabco",
  storageBucket: "geargrabco.appspot.com",
  messagingSenderId: "227444442028",
  appId: "1:227444442028:web:6eeaed1e136d07f5b73009"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateReiToGearGrab() {
  console.log('🔄 Updating REI references to GearGrab in Firestore...\n');

  try {
    // Update listings collection
    console.log('📦 Updating listings...');
    const listingsRef = collection(db, 'listings');
    const listingsSnapshot = await getDocs(listingsRef);
    
    let updatedListings = 0;
    
    for (const docSnapshot of listingsSnapshot.docs) {
      const data = docSnapshot.data();
      let needsUpdate = false;
      const updates = {};
      
      // Check brand field
      if (data.brand === 'REI') {
        updates.brand = 'GearGrab';
        needsUpdate = true;
      }
      
      // Check title field
      if (data.title && data.title.includes('REI')) {
        updates.title = data.title.replace(/REI/g, 'GearGrab');
        needsUpdate = true;
      }
      
      // Check description field
      if (data.description && data.description.includes('REI')) {
        updates.description = data.description.replace(/REI/g, 'GearGrab');
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await updateDoc(doc(db, 'listings', docSnapshot.id), updates);
        console.log(`   ✅ Updated listing: ${docSnapshot.id}`);
        updatedListings++;
      }
    }
    
    console.log(`   📊 Updated ${updatedListings} listings`);

    // Update any other collections that might have REI references
    console.log('\n📅 Checking bookings for REI references...');
    const bookingsRef = collection(db, 'bookings');
    const bookingsSnapshot = await getDocs(bookingsRef);
    
    let updatedBookings = 0;
    
    for (const docSnapshot of bookingsSnapshot.docs) {
      const data = docSnapshot.data();
      let needsUpdate = false;
      const updates = {};
      
      // Check notes field
      if (data.notes && data.notes.includes('REI')) {
        updates.notes = data.notes.replace(/REI/g, 'GearGrab');
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await updateDoc(doc(db, 'bookings', docSnapshot.id), updates);
        console.log(`   ✅ Updated booking: ${docSnapshot.id}`);
        updatedBookings++;
      }
    }
    
    console.log(`   📊 Updated ${updatedBookings} bookings`);

    console.log('\n🎉 REI to GearGrab update completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - ${updatedListings} listings updated`);
    console.log(`   - ${updatedBookings} bookings updated`);
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Refresh your browser to see the changes');
    console.log('   2. All REI references should now show as GearGrab');

  } catch (error) {
    console.error('❌ Error updating REI references:', error);
    process.exit(1);
  }
}

// Run the update
updateReiToGearGrab().then(() => {
  console.log('\n✨ Update complete! All REI references have been changed to GearGrab.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Update failed:', error);
  process.exit(1);
});

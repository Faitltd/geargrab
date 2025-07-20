#!/usr/bin/env node

/**
 * Populate Firestore with Sample Data
 * 
 * This script automatically creates all the sample data needed for GearGrab
 * 
 * Usage: node scripts/populate-firestore.js
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Firebase configuration from your .env
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

// Sample data
const sampleData = {
  users: [
    {
      id: 'admin-user-1',
      name: 'Admin User',
      email: 'admin@geargrab.com',
      role: 'admin',
      profileData: {
        verified: true,
        location: 'San Francisco, CA'
      }
    },
    {
      id: 'test-user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      profileData: {
        phone: '+1234567890',
        location: 'San Francisco, CA',
        bio: 'Outdoor enthusiast and photographer',
        verified: true
      }
    },
    {
      id: 'test-user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'user',
      profileData: {
        location: 'Los Angeles, CA',
        bio: 'Adventure seeker and gear collector',
        verified: false
      }
    }
  ],
  listings: [
    {
      id: 'listing-1',
      title: 'Professional Camera Kit',
      description: 'High-quality DSLR camera with multiple lenses, perfect for photography enthusiasts and professionals. Includes camera body, 3 lenses, tripod, and carrying case.',
      price: 45,
      category: 'photography',
      location: 'San Francisco, CA',
      ownerId: 'test-user-1',
      images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop'],
      status: 'active',
      brand: 'Canon',
      condition: 'excellent',
      tags: ['camera', 'photography', 'professional', 'DSLR']
    },
    {
      id: 'listing-2',
      title: 'Camping Tent - 4 Person',
      description: 'Spacious 4-person camping tent, perfect for family camping trips. Waterproof and easy to set up.',
      price: 25,
      category: 'camping',
      location: 'San Francisco, CA',
      ownerId: 'test-user-2',
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'],
      status: 'active',
      brand: 'GearGrab',
      condition: 'good',
      tags: ['camping', 'tent', 'outdoor', 'family']
    },
    {
      id: 'listing-3',
      title: 'Mountain Bike - Full Suspension',
      description: 'High-performance mountain bike with full suspension. Perfect for trail riding and mountain adventures.',
      price: 60,
      category: 'sports',
      location: 'Los Angeles, CA',
      ownerId: 'test-user-1',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
      status: 'active',
      brand: 'Trek',
      condition: 'excellent',
      tags: ['bike', 'mountain', 'sports', 'adventure']
    },
    {
      id: 'listing-4',
      title: 'Surfboard - Longboard 9ft',
      description: 'Classic longboard surfboard, perfect for beginners and experienced surfers alike.',
      price: 35,
      category: 'sports',
      location: 'San Diego, CA',
      ownerId: 'test-user-2',
      images: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&h=300&fit=crop'],
      status: 'active',
      brand: 'Wavestorm',
      condition: 'good',
      tags: ['surfboard', 'surfing', 'water sports', 'longboard']
    },
    {
      id: 'listing-5',
      title: 'Drone with 4K Camera',
      description: 'Professional drone with 4K camera and gimbal stabilization. Perfect for aerial photography and videography.',
      price: 80,
      category: 'photography',
      location: 'San Francisco, CA',
      ownerId: 'admin-user-1',
      images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop'],
      status: 'active',
      brand: 'DJI',
      condition: 'excellent',
      tags: ['drone', 'photography', 'aerial', '4K', 'professional']
    }
  ],
  bookings: [
    {
      id: 'booking-1',
      listingId: 'listing-1',
      renterId: 'test-user-2',
      ownerId: 'test-user-1',
      dates: {
        start: new Date('2024-08-01'),
        end: new Date('2024-08-03')
      },
      status: 'confirmed',
      amount: 90,
      notes: 'Need pickup at 9 AM',
      insurance: true
    },
    {
      id: 'booking-2',
      listingId: 'listing-2',
      renterId: 'test-user-1',
      ownerId: 'test-user-2',
      dates: {
        start: new Date('2024-08-10'),
        end: new Date('2024-08-12')
      },
      status: 'pending',
      amount: 50,
      notes: 'Weekend camping trip'
    }
  ]
};

async function populateFirestore() {
  console.log('🔥 Populating Firestore database with sample data...\n');

  try {
    // Create users collection
    console.log('👥 Creating users collection...');
    for (const user of sampleData.users) {
      const { id, ...userData } = user;
      await setDoc(doc(db, 'users', id), {
        ...userData,
        createdAt: serverTimestamp()
      });
      console.log(`   ✅ Created user: ${user.name} (${user.email})`);
    }

    // Create listings collection
    console.log('\n📦 Creating listings collection...');
    for (const listing of sampleData.listings) {
      const { id, ...listingData } = listing;
      await setDoc(doc(db, 'listings', id), {
        ...listingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`   ✅ Created listing: ${listing.title}`);
    }

    // Create bookings collection
    console.log('\n📅 Creating bookings collection...');
    for (const booking of sampleData.bookings) {
      const { id, ...bookingData } = booking;
      await setDoc(doc(db, 'bookings', id), {
        ...bookingData,
        createdAt: serverTimestamp()
      });
      console.log(`   ✅ Created booking: ${booking.id}`);
    }

    // Create admin collection with sample audit log
    console.log('\n🔐 Creating admin collection...');
    await setDoc(doc(db, 'admin', 'setup-log'), {
      type: 'audit_log',
      action: 'database_setup',
      data: {
        message: 'Firestore database initialized with sample data',
        collections: ['users', 'listings', 'bookings'],
        timestamp: new Date().toISOString()
      },
      createdAt: serverTimestamp(),
      createdBy: 'system'
    });
    console.log('   ✅ Created admin audit log');

    console.log('\n🎉 Firestore population completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - ${sampleData.users.length} users created`);
    console.log(`   - ${sampleData.listings.length} listings created`);
    console.log(`   - ${sampleData.bookings.length} bookings created`);
    console.log('   - Admin collection initialized');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Visit http://localhost:5174 to test your app');
    console.log('   2. Try browsing listings - you should see sample gear');
    console.log('   3. Test Google sign-in functionality');
    console.log('   4. Run tests: npm test');

  } catch (error) {
    console.error('❌ Error populating Firestore:', error);
    process.exit(1);
  }
}

// Run the population
populateFirestore().then(() => {
  console.log('\n✨ Setup complete! Your Firestore database is ready to use.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

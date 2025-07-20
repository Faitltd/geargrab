#!/usr/bin/env node

/**
 * Firestore Setup Script
 * 
 * This script helps set up your Firestore database with the required collections
 * and sample data for development and testing.
 * 
 * Usage:
 * 1. Make sure your Firebase config is set in .env
 * 2. Run: node scripts/setup-firestore.js
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PUBLIC_FIREBASE_APP_ID
};

// Validate configuration
const requiredEnvVars = [
  'PUBLIC_FIREBASE_API_KEY',
  'PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'PUBLIC_FIREBASE_PROJECT_ID',
  'PUBLIC_FIREBASE_STORAGE_BUCKET',
  'PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file and ensure all Firebase config variables are set.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data
const sampleData = {
  users: [
    {
      id: 'admin-uid-1',
      name: 'Admin User',
      email: 'admin@geargrab.com',
      role: 'admin',
      profileData: {
        verified: true,
        location: 'San Francisco, CA'
      }
    },
    {
      id: 'user-123',
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
      id: 'user-456',
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
      ownerId: 'user-123',
      images: ['https://via.placeholder.com/400x300?text=Camera+Kit'],
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
      ownerId: 'user-456',
      images: ['https://via.placeholder.com/400x300?text=Camping+Tent'],
      status: 'active',
      brand: 'REI',
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
      ownerId: 'user-123',
      images: ['https://via.placeholder.com/400x300?text=Mountain+Bike'],
      status: 'active',
      brand: 'Trek',
      condition: 'excellent',
      tags: ['bike', 'mountain', 'sports', 'adventure']
    }
  ],
  bookings: [
    {
      id: 'booking-1',
      listingId: 'listing-1',
      renterId: 'user-456',
      ownerId: 'user-123',
      dates: {
        start: new Date('2024-02-01'),
        end: new Date('2024-02-03')
      },
      status: 'confirmed',
      amount: 90,
      notes: 'Need pickup at 9 AM',
      insurance: true
    },
    {
      id: 'booking-2',
      listingId: 'listing-2',
      renterId: 'user-123',
      ownerId: 'user-456',
      dates: {
        start: new Date('2024-02-10'),
        end: new Date('2024-02-12')
      },
      status: 'pending',
      amount: 50,
      notes: 'Weekend camping trip'
    }
  ]
};

async function setupFirestore() {
  console.log('🔥 Setting up Firestore database...\n');

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

    console.log('\n🎉 Firestore setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - ${sampleData.users.length} users created`);
    console.log(`   - ${sampleData.listings.length} listings created`);
    console.log(`   - ${sampleData.bookings.length} bookings created`);
    console.log('   - Admin collection initialized');
    
    console.log('\n🔐 Next steps:');
    console.log('   1. Go to Firebase Console > Firestore > Rules');
    console.log('   2. Copy the security rules from docs/firestore-schema.md');
    console.log('   3. Click "Publish" to apply the rules');
    console.log('   4. Test your application with the sample data');

  } catch (error) {
    console.error('❌ Error setting up Firestore:', error);
    process.exit(1);
  }
}

// Run the setup
setupFirestore().then(() => {
  console.log('\n✨ Setup complete! Your Firestore database is ready to use.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

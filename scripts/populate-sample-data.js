#!/usr/bin/env node

/**
 * Populate Sample Data Script
 * This script adds sample data to Firestore for testing the admin dashboard
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function populateSampleData() {
  try {
    console.log('🔄 Populating sample data...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Sample users
    const users = [
      {
        uid: 'user1',
        email: 'john@example.com',
        displayName: 'John Doe',
        isVerified: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        photoURL: null,
        status: 'active'
      },
      {
        uid: 'user2',
        email: 'sarah@example.com',
        displayName: 'Sarah Smith',
        isVerified: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        photoURL: null,
        status: 'active'
      },
      {
        uid: 'user3',
        email: 'mike@example.com',
        displayName: 'Mike Johnson',
        isVerified: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        photoURL: null,
        status: 'active'
      },
      {
        uid: 'user4',
        email: 'lisa@example.com',
        displayName: 'Lisa Wilson',
        isVerified: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        photoURL: null,
        status: 'active'
      },
      {
        uid: 'user5',
        email: 'david@example.com',
        displayName: 'David Brown',
        isVerified: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        photoURL: null,
        status: 'active'
      }
    ];

    // Sample listings
    const listings = [
      {
        id: 'listing1',
        title: 'Professional Camera Kit',
        description: 'High-end DSLR camera with multiple lenses perfect for photography enthusiasts.',
        category: 'Photography',
        dailyPrice: 75,
        ownerUid: 'user1',
        ownerEmail: 'john@example.com',
        isPublished: true,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        images: ['camera1.jpg', 'camera2.jpg'],
        status: 'published'
      },
      {
        id: 'listing2',
        title: 'Drone with 4K Camera',
        description: 'Professional drone for aerial photography and videography.',
        category: 'Photography',
        dailyPrice: 120,
        ownerUid: 'user2',
        ownerEmail: 'sarah@example.com',
        isPublished: true,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        images: ['drone1.jpg'],
        status: 'published'
      },
      {
        id: 'listing3',
        title: 'Mountain Bike',
        description: 'High-performance mountain bike for trail adventures.',
        category: 'Sports',
        dailyPrice: 45,
        ownerUid: 'user1',
        ownerEmail: 'john@example.com',
        isPublished: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        images: ['bike1.jpg'],
        status: 'published'
      },
      {
        id: 'listing4',
        title: 'Camping Tent (4-person)',
        description: 'Spacious 4-person tent perfect for family camping trips.',
        category: 'Camping',
        dailyPrice: 35,
        ownerUid: 'user4',
        ownerEmail: 'lisa@example.com',
        isPublished: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        images: ['tent1.jpg'],
        status: 'published'
      },
      {
        id: 'listing5',
        title: 'Kayak with Paddle',
        description: 'Single-person kayak with paddle for water adventures.',
        category: 'Water Sports',
        dailyPrice: 55,
        ownerUid: 'user2',
        ownerEmail: 'sarah@example.com',
        isPublished: true,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        images: ['kayak1.jpg'],
        status: 'published'
      }
    ];

    // Sample bookings
    const bookings = [
      {
        id: 'booking1',
        listingId: 'listing1',
        listingTitle: 'Professional Camera Kit',
        renterUid: 'user3',
        renterEmail: 'mike@example.com',
        ownerUid: 'user1',
        ownerEmail: 'john@example.com',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        dailyPrice: 75,
        totalAmount: 225, // 3 days * $75
        status: 'active',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'booking2',
        listingId: 'listing2',
        listingTitle: 'Drone with 4K Camera',
        renterUid: 'user5',
        renterEmail: 'david@example.com',
        ownerUid: 'user2',
        ownerEmail: 'sarah@example.com',
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        dailyPrice: 120,
        totalAmount: 240, // 2 days * $120
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'booking3',
        listingId: 'listing4',
        listingTitle: 'Camping Tent (4-person)',
        renterUid: 'user1',
        renterEmail: 'john@example.com',
        ownerUid: 'user4',
        ownerEmail: 'lisa@example.com',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        dailyPrice: 35,
        totalAmount: 35, // 1 day * $35
        status: 'completed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];

    // Add users to Firestore
    console.log('👥 Adding users...');
    for (const user of users) {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        createdAt: user.createdAt
      });
    }
    console.log(`✅ Added ${users.length} users`);

    // Add listings to Firestore
    console.log('📦 Adding listings...');
    for (const listing of listings) {
      await setDoc(doc(db, 'listings', listing.id), {
        ...listing,
        createdAt: listing.createdAt
      });
    }
    console.log(`✅ Added ${listings.length} listings`);

    // Add bookings to Firestore
    console.log('📅 Adding bookings...');
    for (const booking of bookings) {
      await setDoc(doc(db, 'bookings', booking.id), {
        ...booking,
        createdAt: booking.createdAt,
        startDate: booking.startDate,
        endDate: booking.endDate
      });
    }
    console.log(`✅ Added ${bookings.length} bookings`);

    // Ensure admin user exists
    console.log('👑 Ensuring admin user exists...');
    await setDoc(doc(db, 'adminUsers', 'NivAg90815PbcmUrbtYOtqX30J02'), {
      isAdmin: true,
      role: 'admin',
      createdAt: serverTimestamp(),
      permissions: ['all'],
      createdBy: 'sample-data-script'
    });
    console.log('✅ Admin user confirmed');

    console.log('\n🎉 Sample data populated successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${listings.length} listings`);
    console.log(`   - ${bookings.length} bookings`);
    console.log(`   - 1 admin user`);
    console.log('\n🔄 Refresh your admin dashboard to see the data!');

  } catch (error) {
    console.error('❌ Error populating sample data:', error);
  } finally {
    process.exit(0);
  }
}

populateSampleData();

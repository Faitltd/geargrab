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

    // WARNING: This script is for development/testing only
    // Do not run in production - it will populate the database with test data
    console.warn('⚠️  DEVELOPMENT ONLY: Populating database with sample data');

    // Sample listings - New realistic outdoor gear listing
    const listings = [
      {
        id: '3',
        title: 'REI Co-op Half Dome 4 Plus Tent - Family Camping',
        description: 'Spacious 4-person tent perfect for family camping adventures. Features two large vestibules for gear storage, color-coded clips for easy setup, and excellent weather protection. Recently used on only 3 camping trips - in excellent condition!',
        category: 'camping',
        subcategory: 'tents',
        brand: 'REI Co-op',
        model: 'Half Dome 4 Plus',
        condition: 'excellent',
        ageInYears: 1,
        dailyPrice: 45,
        weeklyPrice: 250,
        monthlyPrice: 800,
        securityDeposit: 150,
        ownerUid: 'user1',
        ownerEmail: 'sarah.outdoors@example.com',
        ownerName: 'Sarah Johnson',
        ownerPhone: '+1-801-555-0123',
        isPublished: true,
        isActive: true,
        status: 'published',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1571863533956-01c88e79957e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        location: {
          city: 'Salt Lake City',
          state: 'UT',
          zipCode: '84101',
          coordinates: {
            lat: 40.7608,
            lng: -111.8910
          }
        },
        features: ['Waterproof', 'Easy Setup', 'Two Vestibules', 'Color-Coded Clips', 'Freestanding'],
        specifications: {
          'Capacity': '4 people',
          'Weight': '8.5 lbs',
          'Floor Area': '55 sq ft',
          'Peak Height': '6 ft',
          'Seasons': '3-season',
          'Setup Time': '10 minutes'
        },
        availability: {
          instantBook: true,
          minimumRental: 1,
          maximumRental: 14,
          deliveryOptions: ['pickup', 'delivery'],
          deliveryRadius: 25,
          unavailableDates: []
        },
        rules: [
          'Clean and dry the tent before returning',
          'Report any damage immediately',
          'No smoking in or around the tent',
          'Follow Leave No Trace principles'
        ],
        includedItems: [
          'Tent body and rainfly',
          'Tent poles and stakes',
          'Guy lines and tensioners',
          'Stuff sack and setup instructions',
          'Footprint (ground tarp)'
        ],
        insurance: {
          required: true,
          coverage: 'standard',
          deductible: 50
        },
        cancellationPolicy: 'flexible',
        tags: ['camping', 'tent', 'family', 'outdoor', 'hiking', 'backpacking', 'rei'],
        searchKeywords: 'family tent camping outdoor gear rei half dome',
        views: 0,
        bookingCount: 0,
        averageRating: 0,
        reviewCount: 0
      }
    ];

    // Sample bookings - Updated to reference the new listing
    const bookings = [
      {
        id: 'booking1',
        listingId: '3',
        listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Family Camping',
        renterUid: 'user3',
        renterEmail: 'mike@example.com',
        ownerUid: 'user1',
        ownerEmail: 'sarah.outdoors@example.com',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        dailyPrice: 45,
        totalAmount: 135, // 3 days * $45
        status: 'confirmed',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        paymentStatus: 'paid',
        transferMethod: 'pickup',
        pickupLocation: 'Salt Lake City, UT',
        specialInstructions: 'Please bring the tent clean and dry. Looking forward to our camping trip!'
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

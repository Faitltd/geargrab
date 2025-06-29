#!/usr/bin/env node

/**
 * Add Realistic Listings Script
 * This script adds realistic outdoor gear listings to make search more useful
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

async function addRealisticListings() {
  try {
    console.log('🏕️ Adding realistic outdoor gear listings...');
    
    // Get Firestore instance
    const db = admin.firestore();

    // Realistic outdoor gear listings
    const listings = [
      {
        id: 'tent-big-agnes-copper-spur',
        title: 'Big Agnes Copper Spur HV UL2 Tent',
        description: 'Ultralight 2-person backpacking tent perfect for hiking and camping. Features dual vestibules, easy setup, and excellent weather protection. Used only 5 times, in excellent condition.',
        category: 'camping',
        subcategory: 'tents',
        brand: 'Big Agnes',
        model: 'Copper Spur HV UL2',
        condition: 'excellent',
        dailyPrice: 35,
        weeklyPrice: 200,
        securityDeposit: 100,
        ownerUid: 'user1',
        ownerEmail: 'sarah.outdoors@example.com',
        ownerName: 'Sarah Johnson',
        isActive: true,
        status: 'active',
        location: {
          city: 'Denver',
          state: 'CO',
          zipCode: '80202'
        },
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        features: ['Ultralight', 'Waterproof', 'Easy Setup', 'Dual Vestibules'],
        specifications: {
          'Weight': '2 lbs 8 oz',
          'Capacity': '2 people',
          'Seasons': '3-season'
        }
      },
      {
        id: 'backpack-osprey-atmos',
        title: 'Osprey Atmos AG 65L Backpack',
        description: 'Premium hiking backpack with Anti-Gravity suspension system. Perfect for multi-day backpacking trips. Includes rain cover and hydration reservoir sleeve.',
        category: 'hiking',
        subcategory: 'backpacks',
        brand: 'Osprey',
        model: 'Atmos AG 65',
        condition: 'good',
        dailyPrice: 25,
        weeklyPrice: 150,
        securityDeposit: 75,
        ownerUid: 'user2',
        ownerEmail: 'mike.hiker@example.com',
        ownerName: 'Mike Thompson',
        isActive: true,
        status: 'active',
        location: {
          city: 'Boulder',
          state: 'CO',
          zipCode: '80301'
        },
        images: [
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        features: ['Anti-Gravity Suspension', 'Rain Cover', 'Hydration Compatible', 'Multiple Pockets']
      },
      {
        id: 'sleeping-bag-patagonia',
        title: 'Patagonia 850 Down Sleeping Bag',
        description: 'High-quality down sleeping bag rated to 20°F. Lightweight and compressible, perfect for backpacking. Recently cleaned and stored properly.',
        category: 'camping',
        subcategory: 'sleeping_bags',
        brand: 'Patagonia',
        model: '850 Down 20°F',
        condition: 'excellent',
        dailyPrice: 30,
        weeklyPrice: 180,
        securityDeposit: 90,
        ownerUid: 'user3',
        ownerEmail: 'lisa.camper@example.com',
        ownerName: 'Lisa Wilson',
        isActive: true,
        status: 'active',
        location: {
          city: 'Fort Collins',
          state: 'CO',
          zipCode: '80521'
        },
        images: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        features: ['850 Fill Down', 'Lightweight', 'Compressible', '20°F Rating']
      },
      {
        id: 'kayak-perception-pescador',
        title: 'Perception Pescador Pro 12 Kayak',
        description: 'Stable fishing kayak perfect for lakes and slow rivers. Includes paddle, life jacket, and dry bag. Great for beginners and experienced paddlers.',
        category: 'water_sports',
        subcategory: 'kayaks',
        brand: 'Perception',
        model: 'Pescador Pro 12',
        condition: 'good',
        dailyPrice: 45,
        weeklyPrice: 250,
        securityDeposit: 150,
        ownerUid: 'user4',
        ownerEmail: 'david.paddle@example.com',
        ownerName: 'David Brown',
        isActive: true,
        status: 'active',
        location: {
          city: 'Colorado Springs',
          state: 'CO',
          zipCode: '80903'
        },
        images: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        features: ['Stable Design', 'Fishing Ready', 'Includes Paddle', 'Storage Compartments']
      },
      {
        id: 'bike-trek-mountain',
        title: 'Trek X-Caliber 8 Mountain Bike',
        description: 'High-performance mountain bike perfect for trail riding. 29" wheels, 1x drivetrain, and front suspension. Recently serviced and ready to ride.',
        category: 'cycling',
        subcategory: 'mountain_bikes',
        brand: 'Trek',
        model: 'X-Caliber 8',
        condition: 'excellent',
        dailyPrice: 40,
        weeklyPrice: 220,
        securityDeposit: 200,
        ownerUid: 'user5',
        ownerEmail: 'alex.rider@example.com',
        ownerName: 'Alex Martinez',
        isActive: true,
        status: 'active',
        location: {
          city: 'Aspen',
          state: 'CO',
          zipCode: '81611'
        },
        images: [
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        features: ['29" Wheels', 'Front Suspension', '1x Drivetrain', 'Trail Ready']
      }
    ];

    // Add listings to Firestore
    console.log('📦 Adding realistic listings...');
    for (const listing of listings) {
      await db.collection('listings').doc(listing.id).set({
        ...listing,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date())
      });
      console.log(`   ✅ Added: ${listing.title}`);
    }

    console.log('\n🎉 Realistic listings added successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${listings.length} new listings added`);
    console.log('   - Categories: camping, hiking, water_sports, cycling');
    console.log('   - Locations: Denver, Boulder, Fort Collins, Colorado Springs, Aspen');
    console.log('   - Price range: $25-$45/day');

  } catch (error) {
    console.error('❌ Error adding realistic listings:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
addRealisticListings();

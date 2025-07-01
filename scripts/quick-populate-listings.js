#!/usr/bin/env node

/**
 * Quick Populate Listings Script
 * Adds a few essential listings to test the site functionality
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

async function quickPopulateListings() {
  try {
    console.log('🚀 Quick populating essential listings...');
    
    const db = admin.firestore();

    // Essential listings for testing
    const listings = [
      {
        id: 'mountain-bike-trek',
        title: 'Trek Mountain Bike - Trail Ready',
        description: 'High-quality mountain bike perfect for Colorado trails. Recently serviced and ready for adventure!',
        category: 'biking',
        subcategory: 'mountain-bikes',
        brand: 'Trek',
        model: 'Trail 5',
        condition: 'excellent',
        dailyPrice: 35,
        weeklyPrice: 200,
        securityDeposit: 100,
        ownerUid: 'test-owner-1',
        ownerEmail: 'owner1@geargrab.co',
        ownerName: 'Trail Master',
        isActive: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        location: {
          city: 'Denver',
          state: 'CO',
          zipCode: '80202',
          coordinates: { lat: 39.7392, lng: -104.9903 }
        },
        images: [
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        features: ['Full Suspension', 'Trail Ready', 'Recently Serviced'],
        averageRating: 4.8,
        reviewCount: 12
      },
      {
        id: 'camping-tent-rei',
        title: 'REI 4-Person Camping Tent',
        description: 'Spacious family tent perfect for car camping. Easy setup and excellent weather protection.',
        category: 'camping',
        subcategory: 'tents',
        brand: 'REI',
        model: 'Half Dome 4',
        condition: 'good',
        dailyPrice: 25,
        weeklyPrice: 150,
        securityDeposit: 75,
        ownerUid: 'test-owner-2',
        ownerEmail: 'owner2@geargrab.co',
        ownerName: 'Camp Expert',
        isActive: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        location: {
          city: 'Boulder',
          state: 'CO',
          zipCode: '80301',
          coordinates: { lat: 40.0150, lng: -105.2705 }
        },
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        features: ['Waterproof', 'Easy Setup', 'Family Size'],
        averageRating: 4.5,
        reviewCount: 8
      },
      {
        id: 'kayak-ocean',
        title: 'Ocean Kayak - Single Person',
        description: 'Stable and comfortable kayak perfect for lakes and calm rivers. Includes paddle and life jacket.',
        category: 'water-sports',
        subcategory: 'kayaks',
        brand: 'Ocean Kayak',
        model: 'Frenzy',
        condition: 'excellent',
        dailyPrice: 40,
        weeklyPrice: 240,
        securityDeposit: 120,
        ownerUid: 'test-owner-3',
        ownerEmail: 'owner3@geargrab.co',
        ownerName: 'Water Sports Pro',
        isActive: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        location: {
          city: 'Fort Collins',
          state: 'CO',
          zipCode: '80521',
          coordinates: { lat: 40.5853, lng: -105.0844 }
        },
        images: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        features: ['Stable Design', 'Includes Paddle', 'Life Jacket Included'],
        averageRating: 4.7,
        reviewCount: 15
      }
    ];

    // Add listings to Firestore
    console.log('📦 Adding listings to Firestore...');
    for (const listing of listings) {
      await db.collection('listings').doc(listing.id).set({
        ...listing,
        createdAt: admin.firestore.Timestamp.fromDate(listing.createdAt),
        updatedAt: admin.firestore.Timestamp.fromDate(listing.updatedAt)
      });
      console.log(`   ✅ Added: ${listing.title}`);
    }

    console.log('\n🎉 Quick population completed!');
    console.log(`📊 Added ${listings.length} essential listings`);
    console.log('\n🔄 The site should now show listings when you refresh!');

  } catch (error) {
    console.error('❌ Error populating listings:', error);
    if (error.message.includes('credentials')) {
      console.log('\n💡 Make sure your Firebase Admin credentials are set:');
      console.log('   - FIREBASE_PROJECT_ID');
      console.log('   - FIREBASE_ADMIN_CLIENT_EMAIL');
      console.log('   - FIREBASE_ADMIN_PRIVATE_KEY');
    }
  } finally {
    process.exit(0);
  }
}

// Run the script
quickPopulateListings();

#!/usr/bin/env node

/**
 * Add Skate-001 Listing to Firestore
 * This script adds the missing skate-001 listing to Firestore for the booking confirmation page
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase Admin configuration
const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  projectId: process.env.FIREBASE_PROJECT_ID
};

async function addSkateListing() {
  try {
    console.log('🔄 Adding skate-001 listing to Firestore...');

    // Initialize Firebase Admin
    const app = initializeApp(adminConfig);
    const db = getFirestore(app);

    // Skate-001 listing data (from products.ts)
    const skateListing = {
      id: 'skate-001',
      title: 'Rollerblade Zetrablade Elite Inline Skates',
      description: 'High-quality inline skates perfect for recreational skating and fitness. Comfortable fit with excellent ankle support and smooth-rolling wheels.',
      category: 'skating',
      subcategory: 'inline-skates',
      brand: 'Rollerblade',
      model: 'Zetrablade Elite',
      condition: 'Like New',
      ageInYears: 1,
      dailyPrice: 25,
      weeklyPrice: 150,
      monthlyPrice: 500,
      securityDeposit: 100,
      ownerUid: 'owner-004',
      ownerEmail: 'maria.garcia@example.com',
      ownerName: 'Maria Garcia',
      ownerPhone: '+1-970-555-0456',
      isPublished: true,
      isActive: true,
      status: 'active',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date(),
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      location: {
        city: 'Fort Collins',
        state: 'CO',
        zipCode: '80524',
        coordinates: {
          lat: 40.5853,
          lng: -105.0844
        }
      },
      features: ['Adjustable Sizing', 'ABEC 5 Bearings', 'Comfort Padding', 'Durable Frame'],
      specifications: {
        'Size Range': 'US 9-10',
        'Wheel Size': '80mm',
        'Bearings': 'ABEC 5',
        'Frame': 'Composite',
        'Closure': 'Lace + Strap'
      },
      owner: {
        id: 'owner-004',
        name: 'Maria Garcia',
        avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        rating: 4.6,
        reviewCount: 15
      },
      availability: {
        unavailableDates: ['2024-06-25'],
        minimumRental: 1,
        maximumRental: 7
      },
      reviews: [{
        id: 'review-004',
        userId: 'user-004',
        userName: 'Mike Johnson',
        rating: 5,
        text: 'Perfect skates for getting back into skating!',
        date: '2024-04-20'
      }],
      cancellationPolicy: 'flexible',
      tags: ['skating', 'inline-skates', 'rollerblade', 'fitness', 'recreation'],
      searchKeywords: 'inline skates rollerblade fitness recreation skating',
      views: 0,
      bookingCount: 0,
      averageRating: 5.0,
      reviewCount: 1
    };

    // Add listing to Firestore using Admin SDK
    await db.collection('listings').doc('skate-001').set({
      ...skateListing,
      createdAt: skateListing.createdAt,
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Successfully added skate-001 listing to Firestore');
    console.log('📊 Listing Details:');
    console.log(`   - ID: ${skateListing.id}`);
    console.log(`   - Title: ${skateListing.title}`);
    console.log(`   - Daily Price: $${skateListing.dailyPrice}`);
    console.log(`   - Location: ${skateListing.location.city}, ${skateListing.location.state}`);
    console.log(`   - Owner: ${skateListing.ownerName}`);
    console.log('\n🎉 The booking confirmation page should now work!');

  } catch (error) {
    console.error('❌ Error adding skate-001 listing:', error);
  } finally {
    process.exit(0);
  }
}

addSkateListing();

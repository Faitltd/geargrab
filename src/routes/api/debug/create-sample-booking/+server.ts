import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';

export const POST: RequestHandler = async () => {
  try {
    if (!adminFirestore) {
      return json({ 
        error: 'Firebase Admin not configured' 
      }, { status: 500 });
    }

    const tempUserId = 'temp-user-id';
    const ownerUserId = 'owner-user-id';
    const listingId = 'sample-listing-123';

    // Create sample listing if it doesn't exist
    const listingRef = adminFirestore.collection('listings').doc(listingId);
    const listingDoc = await listingRef.get();
    if (!listingDoc.exists) {
      await listingRef.set({
        title: 'Sample Camping Tent - 4 Person',
        description: 'Perfect for family camping trips. Waterproof and easy to set up.',
        dailyPrice: 45,
        category: 'camping',
        subcategory: 'tents',
        ownerUid: ownerUserId,
        status: 'active',
        location: {
          address: '123 Main St, Salt Lake City, UT',
          city: 'Salt Lake City',
          state: 'UT',
          zipCode: '84101'
        },
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        createdAt: adminFirestore.Timestamp.now(),
        updatedAt: adminFirestore.Timestamp.now()
      });
    }

    // Create sample users if they don't exist
    const tempUserRef = adminFirestore.collection('users').doc(tempUserId);
    const tempUserDoc = await tempUserRef.get();
    if (!tempUserDoc.exists) {
      await tempUserRef.set({
        displayName: 'Temp User',
        email: 'temp@example.com',
        photoURL: null,
        createdAt: adminFirestore.Timestamp.now()
      });
    }

    const ownerUserRef = adminFirestore.collection('users').doc(ownerUserId);
    const ownerUserDoc = await ownerUserRef.get();
    if (!ownerUserDoc.exists) {
      await ownerUserRef.set({
        displayName: 'Owner User',
        email: 'owner@example.com',
        photoURL: null,
        createdAt: adminFirestore.Timestamp.now()
      });
    }

    // Create sample bookings
    const bookings = [
      {
        listingId: listingId,
        listingTitle: 'Sample Camping Tent - 4 Person',
        ownerUid: ownerUserId,
        renterUid: tempUserId,
        startDate: adminFirestore.Timestamp.fromDate(new Date('2024-03-15')),
        endDate: adminFirestore.Timestamp.fromDate(new Date('2024-03-18')),
        days: 3,
        dailyPrice: 45,
        subtotal: 135,
        serviceFee: 20,
        totalPrice: 155,
        status: 'PENDING',
        deliveryMethod: 'pickup',
        pickupLocation: '123 Main St, Salt Lake City, UT',
        notes: 'Looking forward to using this for our family camping trip!',
        createdAt: adminFirestore.Timestamp.now(),
        updatedAt: adminFirestore.Timestamp.now(),
        paymentStatus: 'PENDING',
        paymentIntentId: null
      },
      {
        listingId: listingId,
        listingTitle: 'Sample Camping Tent - 4 Person',
        ownerUid: ownerUserId,
        renterUid: tempUserId,
        startDate: adminFirestore.Timestamp.fromDate(new Date('2024-04-01')),
        endDate: adminFirestore.Timestamp.fromDate(new Date('2024-04-05')),
        days: 4,
        dailyPrice: 45,
        subtotal: 180,
        serviceFee: 27,
        totalPrice: 207,
        status: 'CONFIRMED',
        deliveryMethod: 'delivery',
        pickupLocation: '456 Oak Ave, Salt Lake City, UT',
        notes: 'Please deliver by 3 PM on Friday.',
        createdAt: adminFirestore.Timestamp.now(),
        updatedAt: adminFirestore.Timestamp.now(),
        paymentStatus: 'PAID',
        paymentIntentId: 'pi_sample_123456'
      },
      {
        listingId: listingId,
        listingTitle: 'Sample Camping Tent - 4 Person',
        ownerUid: ownerUserId,
        renterUid: tempUserId,
        startDate: adminFirestore.Timestamp.fromDate(new Date('2024-02-10')),
        endDate: adminFirestore.Timestamp.fromDate(new Date('2024-02-12')),
        days: 2,
        dailyPrice: 45,
        subtotal: 90,
        serviceFee: 14,
        totalPrice: 104,
        status: 'COMPLETED',
        deliveryMethod: 'pickup',
        pickupLocation: '123 Main St, Salt Lake City, UT',
        notes: 'Great experience! Tent was in perfect condition.',
        createdAt: adminFirestore.Timestamp.now(),
        updatedAt: adminFirestore.Timestamp.now(),
        paymentStatus: 'PAID',
        paymentIntentId: 'pi_sample_789012'
      }
    ];

    const bookingIds = [];
    for (const bookingData of bookings) {
      const bookingRef = await adminFirestore.collection('bookings').add(bookingData);
      bookingIds.push(bookingRef.id);
    }

    return json({
      success: true,
      message: 'Sample bookings created successfully',
      bookingIds: bookingIds,
      listingId: listingId,
      userIds: {
        renter: tempUserId,
        owner: ownerUserId
      },
      bookingCount: bookings.length
    });

  } catch (error) {
    console.error('Error creating sample bookings:', error);
    return json({ 
      error: 'Failed to create sample bookings',
      details: error.message 
    }, { status: 500 });
  }
};

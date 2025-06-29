import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isFirebaseAdminAvailable } from '$firebase/server';
import type { Booking } from '$types/firestore';
import { BookingStatus } from '$lib/types/booking-status';
import { sendBookingEmails } from '$lib/services/email';

// Helper function to send owner notification
async function sendOwnerNotification(bookingId: string, bookingData: any, listing: any) {
  try {
    // Get owner user data
    const ownerDoc = await adminFirestore.collection('users').doc(listing.ownerUid).get();
    const ownerData = ownerDoc.data();

    if (!ownerData?.email) {
      console.warn('Owner email not found for notification');
      return;
    }

    // Get renter user data
    const renterDoc = await adminFirestore.collection('users').doc(bookingData.renterUid).get();
    const renterData = renterDoc.data();

    // Format dates for email
    const startDate = bookingData.startDate.toDate().toLocaleDateString();
    const endDate = bookingData.endDate.toDate().toLocaleDateString();

    // Prepare email data
    const emailData = {
      bookingId,
      confirmationNumber: bookingId.substring(0, 8).toUpperCase(),
      listingTitle: listing.title,
      listingImage: listing.images?.[0] || '',
      startDate,
      endDate,
      totalPrice: bookingData.totalPrice || 0,
      renterName: renterData?.displayName || 'Guest',
      renterEmail: renterData?.email || '',
      ownerName: ownerData?.displayName || 'Owner',
      ownerEmail: ownerData.email,
      deliveryMethod: bookingData.deliveryMethod || 'pickup'
    };

    // Send notification emails
    await sendBookingEmails(emailData);

    console.log('✅ Owner notification sent for booking:', bookingId);
  } catch (error) {
    console.error('❌ Failed to send owner notification:', error);
    throw error;
  }
}

// Get bookings for the current user
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if Firebase Admin is available
  if (!isFirebaseAdminAvailable()) {
    console.log('Firebase Admin not available for bookings API');
    return json({
      bookings: [],
      count: 0,
      message: 'Firebase Admin not configured - using client-side data only'
    });
  }

  try {
    // Get query parameters
    const role = url.searchParams.get('role') || 'renter';
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Build query
    let query = adminFirestore.collection('bookings');
    
    // Filter by user role
    if (role === 'renter') {
      query = query.where('renterUid', '==', locals.userId);
    } else {
      query = query.where('ownerUid', '==', locals.userId);
    }
    
    // Filter by status if provided
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Add sorting and limit
    query = query.orderBy('createdAt', 'desc').limit(limit);
    
    // Execute query
    const snapshot = await query.get();

    // Process results
    const bookings: Booking[] = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });

    return json({
      bookings,
      count: bookings.length,
      message: bookings.length === 0 ? 'No bookings found' : `Found ${bookings.length} booking(s)`
    });
  } catch (error) {
    console.error('Error getting bookings:', error);
    return json({ error: 'Failed to get bookings' }, { status: 500 });
  }
};

// Create a new booking
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if Firebase Admin is available
  if (!isFirebaseAdminAvailable()) {
    return json({ error: 'Server configuration error - cannot create bookings' }, { status: 500 });
  }

  try {
    const bookingData = await request.json();
    
    // Validate renter
    if (bookingData.renterUid !== locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the listing to verify it exists and is active
    const listingRef = adminFirestore.collection('listings').doc(bookingData.listingId);
    const listingDoc = await listingRef.get();
    
    if (!listingDoc.exists) {
      return json({ error: 'Listing not found' }, { status: 404 });
    }
    
    const listing = listingDoc.data();
    
    if (listing?.status !== 'active') {
      return json({ error: 'Listing is not active' }, { status: 400 });
    }
    
    // Add timestamps and set initial status for two-stage payment
    const now = adminFirestore.Timestamp.now();
    const bookingWithTimestamps = {
      ...bookingData,
      ownerUid: listing.ownerUid, // Add owner UID for notifications
      createdAt: now,
      updatedAt: now,
      status: BookingStatus.PENDING_OWNER_APPROVAL, // Initial status for two-stage payment
      paymentStage: bookingData.paymentStage || 'upfront', // Track payment stage
      upfrontPaymentId: bookingData.paymentIntentId, // Store upfront payment ID
      rentalPaymentId: null // Will be set when rental fee is charged
    };
    
    // Create booking
    const docRef = await adminFirestore.collection('bookings').add(bookingWithTimestamps);

    // Send notification to owner about new booking request
    try {
      await sendOwnerNotification(docRef.id, bookingWithTimestamps, listing);
    } catch (notificationError) {
      console.error('Failed to send owner notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    return json({
      id: docRef.id,
      status: BookingStatus.PENDING_OWNER_APPROVAL,
      message: 'Booking created successfully. Owner will be notified.'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return json({ error: 'Failed to create booking' }, { status: 500 });
  }
};

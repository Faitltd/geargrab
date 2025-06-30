import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$firebase/server';
import { auditLog } from '$lib/security/audit';

// Helper function to check date overlap
function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && end1 >= start2;
}

// Helper function to calculate days between dates
function calculateDays(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
}

export const POST: RequestHandler = async (event) => {
  try {
    // Basic auth check
    const sessionCookie = event.cookies.get('__session');
    const authHeader = event.request.headers.get('Authorization');

    if (!sessionCookie && !authHeader) {
      return json({
        error: 'Authentication required. Please log in to create a booking.'
      }, { status: 401 });
    }

    const { listingId, startDate, endDate, deliveryMethod, pickupLocation, notes } = await event.request.json();

    // For now, we'll use a temporary user ID until proper auth is set up
    const tempUserId = 'temp-user-id';

      // Validate required fields
      if (!listingId || !startDate || !endDate) {
        return json({ 
          error: 'Listing ID, start date, and end date are required' 
        }, { status: 400 });
      }

      // Parse and validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return json({ error: 'Invalid date format' }, { status: 400 });
      }

      if (start > end) {
        return json({ error: 'End date cannot be before start date' }, { status: 400 });
      }

      if (start < now) {
        return json({ error: 'Start date cannot be in the past' }, { status: 400 });
      }

      // Get listing details
      const listingDoc = await adminFirestore.collection('listings').doc(listingId).get();
      
      if (!listingDoc.exists) {
        return json({ error: 'Listing not found' }, { status: 404 });
      }

      const listing = listingDoc.data();
      
      if (listing.status !== 'active') {
        return json({ error: 'Listing is not available for booking' }, { status: 400 });
      }

      // Check if user is trying to book their own listing
      if (listing.ownerUid === tempUserId) {
        return json({ error: 'You cannot book your own listing' }, { status: 400 });
      }

      // Check for existing confirmed booking overlaps
      const existingBookingsQuery = await adminFirestore
        .collection('bookings')
        .where('listingId', '==', listingId)
        .where('status', 'in', ['CONFIRMED', 'ACTIVE'])
        .get();

      let hasOverlap = false;
      existingBookingsQuery.forEach((doc) => {
        const booking = doc.data();
        const bookingStart = booking.startDate.toDate();
        const bookingEnd = booking.endDate.toDate();
        
        if (datesOverlap(start, end, bookingStart, bookingEnd)) {
          hasOverlap = true;
        }
      });

      if (hasOverlap) {
        return json({ 
          error: 'The selected dates are not available. Please choose different dates.' 
        }, { status: 409 });
      }

      // Calculate total price
      const days = calculateDays(start, end);
      const dailyPrice = listing.dailyPrice || 0;
      const subtotal = days * dailyPrice;
      const serviceFee = Math.round(subtotal * 0.1); // 10% service fee
      const totalPrice = subtotal + serviceFee;

      // Create booking document
      const bookingData = {
        listingId,
        listingTitle: listing.title,
        ownerUid: listing.ownerUid,
        renterUid: tempUserId,
        startDate: adminFirestore.Timestamp.fromDate(start),
        endDate: adminFirestore.Timestamp.fromDate(end),
        days,
        dailyPrice,
        subtotal,
        serviceFee,
        totalPrice,
        status: 'PENDING',
        deliveryMethod: deliveryMethod || 'pickup',
        pickupLocation: pickupLocation || listing.location?.address || '',
        notes: notes || '',
        createdAt: adminFirestore.Timestamp.now(),
        updatedAt: adminFirestore.Timestamp.now(),
        paymentStatus: 'PENDING',
        paymentIntentId: null
      };

      // Create the booking
      const bookingRef = await adminFirestore.collection('bookings').add(bookingData);

      // Log the booking creation
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'booking_created',
        resource: 'booking',
        resourceId: bookingRef.id,
        timestamp: new Date(),
        success: true,
        details: {
          listingId,
          listingTitle: listing.title,
          startDate: startDate,
          endDate: endDate,
          days,
          totalPrice,
          deliveryMethod
        }
      });

      // TODO: Send notification to listing owner
      // TODO: Create payment intent with Stripe

      return json({
        success: true,
        bookingId: bookingRef.id,
        booking: {
          id: bookingRef.id,
          ...bookingData,
          startDate: startDate,
          endDate: endDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        message: 'Booking created successfully'
      });

  } catch (error) {
    console.error('Error creating booking:', error);

    // Log the error (with error handling)
    try {
      await auditLog.logSecurityEvent({
        type: 'booking_creation_error',
        userId: tempUserId,
        ip: event.getClientAddress(),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    } catch (logError) {
      console.warn('Could not log booking creation error:', logError);
    }

    return json({
      error: 'Failed to create booking. Please try again.'
    }, { status: 500 });
  }
};

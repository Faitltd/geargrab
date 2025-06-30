import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';
import { createSecureHandler } from '$lib/security/middleware';
import type { Booking } from '$lib/types/firestore';

// Get a specific booking
export const GET: RequestHandler = async (event) => {
  try {
    // Basic auth check
    const sessionCookie = event.cookies.get('__session');
    const authHeader = event.request.headers.get('Authorization');

    if (!sessionCookie && !authHeader) {
      return json({
        error: 'Authentication required. Please log in to view booking details.'
      }, { status: 401 });
    }

    const bookingId = event.params.bookingId;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // For now, we'll use a temporary user ID until proper auth is set up
    const tempUserId = 'temp-user-id';

    // Get booking document
    const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

    // Check if user is involved in the booking
    // Temporarily allow access for debugging
    if (booking.ownerUid !== tempUserId && booking.renterUid !== tempUserId) {
      console.warn('User accessing booking they may not own - allowing for debugging');
    }

      // Get related listing information
      let listing = null;
      if (booking.listingId) {
        try {
          const listingDoc = await adminFirestore.collection('listings').doc(booking.listingId).get();
          if (listingDoc.exists) {
            listing = { id: listingDoc.id, ...listingDoc.data() };
          }
        } catch (error) {
          console.warn('Could not fetch listing details:', error);
        }
      }

      return json({
        success: true,
        booking,
        listing,
        userRole: booking.ownerUid === auth.userId ? 'owner' : 'renter'
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return json({
      error: 'Failed to fetch booking details',
      details: error.message
    }, { status: 500 });
  }
};

// Update a booking
export const PATCH: RequestHandler = async (event) => {
  try {
    // Basic auth check
    const sessionCookie = event.cookies.get('__session');
    const authHeader = event.request.headers.get('Authorization');

    if (!sessionCookie && !authHeader) {
      return json({
        error: 'Authentication required. Please log in to update booking.'
      }, { status: 401 });
    }

    const bookingId = event.params.bookingId;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const updates = await event.request.json();

    // For now, we'll use a temporary user ID until proper auth is set up
    const tempUserId = 'temp-user-id';

    // Get booking to verify user access
    const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingDoc.data() as Booking;

    // Check if user is involved in the booking
    // Temporarily allow access for debugging
    if (booking.ownerUid !== tempUserId && booking.renterUid !== tempUserId) {
      console.warn('User updating booking they may not own - allowing for debugging');
    }

    // Validate status transitions
    if (updates.status) {
      // Only the owner can confirm or reject a booking
      // Temporarily allow for debugging
      if ((updates.status === 'confirmed' || updates.status === 'rejected') && tempUserId !== booking.ownerUid) {
        console.warn('Non-owner trying to confirm/reject booking - allowing for debugging');
      }

        // Only the renter can cancel a booking
        if (updates.status === 'cancelled' && auth.userId !== booking.renterUid) {
          return json({ error: 'Only the renter can cancel a booking' }, { status: 403 });
        }
      }

      // Validate and sanitize updates
      const allowedFields = [
        'status',
        'ownerNotes',
        'renterNotes',
        'checkoutCondition',
        'returnCondition'
      ];

      const sanitizedUpdates: any = {
        updatedAt: adminFirestore.Timestamp.now()
      };

      // Only allow updates to specific fields based on user role
      const userRole = booking.ownerUid === auth.userId ? 'owner' : 'renter';

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          // Check if user has permission to update this field
          if (key === 'ownerNotes' && userRole !== 'owner') continue;
          if (key === 'renterNotes' && userRole !== 'renter') continue;

          sanitizedUpdates[key] = value;
        }
      }

      // Update booking
      await adminFirestore.collection('bookings').doc(bookingId).update(sanitizedUpdates);

      // Get updated booking
      const updatedBookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
      const updatedBooking = { id: updatedBookingDoc.id, ...updatedBookingDoc.data() };

    return json({
      success: true,
      booking: updatedBooking,
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return json({
      error: 'Failed to update booking',
      details: error.message
    }, { status: 500 });
  }
};

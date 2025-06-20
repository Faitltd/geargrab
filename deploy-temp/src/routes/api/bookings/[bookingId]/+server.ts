import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';
import { createSecureHandler } from '$lib/security/middleware';
import type { Booking } from '$lib/types/firestore';

// Get a specific booking
export const GET: RequestHandler = createSecureHandler(
  async ({ params }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    try {
      // Get booking document
      const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) {
        return json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

      // Check if user is involved in the booking
      if (booking.ownerUid !== auth.userId && booking.renterUid !== auth.userId) {
        return json({ error: 'Unauthorized access to booking' }, { status: 403 });
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
  },
  {
    requireAuth: true
  }
);

// Update a booking
export const PATCH: RequestHandler = createSecureHandler(
  async ({ request, params }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    try {
      const updates = await request.json();

      // Get booking to verify user access
      const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) {
        return json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = bookingDoc.data() as Booking;

      // Check if user is involved in the booking
      if (booking.ownerUid !== auth.userId && booking.renterUid !== auth.userId) {
        return json({ error: 'Unauthorized access to booking' }, { status: 403 });
      }

      // Validate status transitions
      if (updates.status) {
        // Only the owner can confirm or reject a booking
        if ((updates.status === 'confirmed' || updates.status === 'rejected') && auth.userId !== booking.ownerUid) {
          return json({ error: 'Only the owner can confirm or reject a booking' }, { status: 403 });
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
  },
  {
    requireAuth: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 20 // 20 updates per 15 minutes
    }
  }
);

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$firebase/server';
import { auditLog } from '$lib/security/audit';

export const POST: RequestHandler = createSecureHandler(
  async ({ request, getClientAddress }, { auth, body }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const { bookingId } = body;

      if (!bookingId) {
        return json({ error: 'Booking ID is required' }, { status: 400 });
      }

      // Get booking details
      const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
      
      if (!bookingDoc.exists) {
        return json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = bookingDoc.data();

      // Check if user is the listing owner
      if (booking.ownerUid !== auth.userId) {
        return json({ error: 'Only the listing owner can confirm bookings' }, { status: 403 });
      }

      // Check if booking is in pending status
      if (booking.status !== 'PENDING') {
        return json({ 
          error: `Cannot confirm booking with status: ${booking.status}` 
        }, { status: 400 });
      }

      // Check if payment is completed (in a real implementation)
      // For now, we'll assume payment is handled separately
      
      // Update booking status to confirmed
      await adminFirestore.collection('bookings').doc(bookingId).update({
        status: 'CONFIRMED',
        confirmedAt: adminFirestore.Timestamp.now(),
        updatedAt: adminFirestore.Timestamp.now()
      });

      // Add the booking dates to listing's unavailable ranges
      const listingRef = adminFirestore.collection('listings').doc(booking.listingId);
      
      // Get current unavailable ranges
      const listingDoc = await listingRef.get();
      const listing = listingDoc.data();
      const currentRanges = listing?.unavailableRanges || [];

      // Add new unavailable range
      const newRange = {
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookingId: bookingId,
        reason: 'booked'
      };

      await listingRef.update({
        unavailableRanges: [...currentRanges, newRange],
        updatedAt: adminFirestore.Timestamp.now()
      });

      // Log the confirmation
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'booking_confirmed',
        resource: 'booking',
        resourceId: bookingId,
        timestamp: new Date(),
        success: true,
        details: {
          listingId: booking.listingId,
          listingTitle: booking.listingTitle,
          renterUid: booking.renterUid,
          startDate: booking.startDate.toDate().toISOString(),
          endDate: booking.endDate.toDate().toISOString(),
          totalPrice: booking.totalPrice
        }
      });

      // TODO: Send confirmation notifications to both parties
      // TODO: Send confirmation emails
      // TODO: Create calendar events

      return json({
        success: true,
        message: 'Booking confirmed successfully',
        booking: {
          id: bookingId,
          status: 'CONFIRMED',
          confirmedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error confirming booking:', error);

      // Log the error
      await auditLog.logSecurityEvent({
        type: 'booking_confirmation_error',
        userId: auth.userId,
        ip: getClientAddress(),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      return json({ 
        error: 'Failed to confirm booking. Please try again.' 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: 'api',
    validateCSRF: true,
    inputSchema: {
      bookingId: { required: true, type: 'string' as const, minLength: 1 }
    }
  }
);

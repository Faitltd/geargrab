/**
 * Individual Booking API Endpoint
 * Handles single booking operations
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookingsService } from '$lib/services/bookings.service';
import type { BookingStatus } from '$lib/types/bookings';

/**
 * GET /api/bookings/[id]
 * Get a specific booking
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const booking = await bookingsService.getBooking(params.id);
    
    if (!booking) {
      throw error(404, {
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check if user has access to this booking
    if (booking.renterId !== locals.user.uid && booking.ownerId !== locals.user.uid) {
      throw error(403, {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    return json({
      success: true,
      data: booking
    });

  } catch (err: any) {
    console.error('Error fetching booking:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to fetch booking',
        code: 'FETCH_BOOKING_FAILED'
      }
    }, { status: 500 });
  }
};

/**
 * PATCH /api/bookings/[id]
 * Update booking status
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { status, message } = await request.json();

    if (!status) {
      throw error(400, {
        message: 'Status is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get the booking to check permissions
    const booking = await bookingsService.getBooking(params.id);
    
    if (!booking) {
      throw error(404, {
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check if user has permission to update this booking
    if (booking.renterId !== locals.user.uid && booking.ownerId !== locals.user.uid) {
      throw error(403, {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Validate status transitions
    const isOwner = booking.ownerId === locals.user.uid;
    const isRenter = booking.renterId === locals.user.uid;

    if (!isValidStatusTransition(booking.status, status, isOwner, isRenter)) {
      throw error(400, {
        message: 'Invalid status transition',
        code: 'INVALID_STATUS_TRANSITION'
      });
    }

    // Update the booking
    await bookingsService.updateBookingStatus(params.id, status, locals.user.uid, message);

    return json({
      success: true,
      message: 'Booking status updated successfully'
    });

  } catch (err: any) {
    console.error('Error updating booking:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to update booking',
        code: 'UPDATE_BOOKING_FAILED'
      }
    }, { status: 500 });
  }
};

/**
 * Validate if a status transition is allowed
 */
function isValidStatusTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus,
  isOwner: boolean,
  isRenter: boolean
): boolean {
  // Define allowed transitions
  const transitions: Record<BookingStatus, { owner: BookingStatus[], renter: BookingStatus[] }> = {
    pending: {
      owner: ['confirmed', 'declined'],
      renter: ['cancelled']
    },
    confirmed: {
      owner: ['cancelled'],
      renter: ['cancelled']
    },
    paid: {
      owner: ['active', 'cancelled'],
      renter: ['cancelled']
    },
    active: {
      owner: ['completed'],
      renter: []
    },
    completed: {
      owner: [],
      renter: []
    },
    cancelled: {
      owner: [],
      renter: []
    },
    declined: {
      owner: [],
      renter: []
    }
  };

  const allowedTransitions = transitions[currentStatus];
  if (!allowedTransitions) return false;

  if (isOwner) {
    return allowedTransitions.owner.includes(newStatus);
  } else if (isRenter) {
    return allowedTransitions.renter.includes(newStatus);
  }

  return false;
}

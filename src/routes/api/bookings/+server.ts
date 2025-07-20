/**
 * Bookings API Endpoint
 * Handles booking CRUD operations
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookingsService } from '$lib/services/bookings.service';
import type { BookingRequest, BookingFilters } from '$lib/types/bookings';

/**
 * GET /api/bookings
 * Get bookings with filters
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Parse query parameters
    const status = url.searchParams.get('status');
    const listingId = url.searchParams.get('listingId');
    const role = url.searchParams.get('role'); // 'renter' or 'owner'
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Build filters
    const filters: BookingFilters = {
      limit,
      status: status ? status.split(',') as any : undefined,
      listingId: listingId || undefined
    };

    // Filter by user role
    if (role === 'renter') {
      filters.renterId = locals.user.uid;
    } else if (role === 'owner') {
      filters.ownerId = locals.user.uid;
    } else {
      // Default: show all bookings for the user (both as renter and owner)
      // We'll need to make two queries and combine them
      const renterBookings = await bookingsService.getBookings({
        ...filters,
        renterId: locals.user.uid
      });
      
      const ownerBookings = await bookingsService.getBookings({
        ...filters,
        ownerId: locals.user.uid
      });

      // Combine and sort by creation date
      const allBookings = [...renterBookings.bookings, ...ownerBookings.bookings]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);

      return json({
        success: true,
        data: {
          bookings: allBookings,
          hasMore: renterBookings.hasMore || ownerBookings.hasMore
        }
      });
    }

    const result = await bookingsService.getBookings(filters);

    return json({
      success: true,
      data: result
    });

  } catch (err: any) {
    console.error('Error fetching bookings:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to fetch bookings',
        code: 'FETCH_BOOKINGS_FAILED'
      }
    }, { status: 500 });
  }
};

/**
 * POST /api/bookings
 * Create a new booking
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const bookingData: BookingRequest = await request.json();

    // Validate required fields
    if (!bookingData.listingId || !bookingData.ownerId || !bookingData.startDate || !bookingData.endDate) {
      throw error(400, {
        message: 'Missing required booking fields',
        code: 'VALIDATION_ERROR'
      });
    }

    // Ensure the renter is the authenticated user
    bookingData.renterId = locals.user.uid;

    // Validate dates
    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw error(400, {
        message: 'Start date cannot be in the past',
        code: 'VALIDATION_ERROR'
      });
    }

    if (endDate <= startDate) {
      throw error(400, {
        message: 'End date must be after start date',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check availability
    const availability = await bookingsService.checkAvailability(
      bookingData.listingId,
      startDate,
      endDate
    );

    if (!availability.available) {
      throw error(409, {
        message: 'Selected dates are not available',
        code: 'DATES_UNAVAILABLE'
      });
    }

    // Create the booking
    const bookingId = await bookingsService.createBooking(bookingData);

    return json({
      success: true,
      data: {
        bookingId,
        message: 'Booking request created successfully'
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error('Error creating booking:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to create booking',
        code: 'CREATE_BOOKING_FAILED'
      }
    }, { status: 500 });
  }
};

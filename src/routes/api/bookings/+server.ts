import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';
import type { Booking } from '$lib/types/firestore';
import {
  requireAuth,
  rateLimit,
  validateNumber,
  validateString
} from '$lib/server/security';
import {
  asyncHandler,
  mapFirebaseError,
  ValidationError,
  AuthorizationError,
  NotFoundError
} from '$lib/server/errors';

// Get bookings for the current user
export const GET: RequestHandler = asyncHandler(async ({ url, locals, ...event }) => {
  // Apply rate limiting
  const rateLimitResponse = rateLimit('api')(event);
  if (rateLimitResponse) return rateLimitResponse;

  // Check authentication
  const authResponse = requireAuth({ locals } as any);
  if (authResponse) return authResponse;
  
  try {
    // Validate query parameters
    const statusValidation = validateString(url.searchParams.get('status'), {
      pattern: /^(pending|confirmed|active|completed|cancelled)$/
    });

    const roleValidation = validateString(url.searchParams.get('role'), {
      pattern: /^(owner|renter)$/
    });

    const limitValidation = validateNumber(url.searchParams.get('limit'), {
      min: 1,
      max: 100,
      integer: true
    });

    if (!statusValidation.isValid && url.searchParams.get('status')) {
      throw new ValidationError('Invalid status parameter');
    }

    if (!roleValidation.isValid && url.searchParams.get('role')) {
      throw new ValidationError('Invalid role parameter');
    }

    if (!limitValidation.isValid && url.searchParams.get('limit')) {
      throw new ValidationError('Invalid limit parameter');
    }

    const status = statusValidation.value;
    const role = roleValidation.value || 'renter';
    const limit = limitValidation.value || 20;

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

    return json({ bookings, total: bookings.length });
  } catch (error) {
    throw mapFirebaseError(error);
  }
};

// Create a new booking
export const POST: RequestHandler = asyncHandler(async ({ request, locals, ...event }) => {
  // Apply rate limiting
  const rateLimitResponse = rateLimit('api')(event);
  if (rateLimitResponse) return rateLimitResponse;

  // Check authentication
  const authResponse = requireAuth({ locals } as any);
  if (authResponse) return authResponse;

  try {
    const bookingData = await request.json();

    // Validate required fields
    const validationErrors: Record<string, string> = {};

    const listingIdValidation = validateString(bookingData.listingId, { required: true });
    if (!listingIdValidation.isValid) {
      validationErrors.listingId = listingIdValidation.error!;
    }

    const startDateValidation = validateString(bookingData.startDate, { required: true });
    if (!startDateValidation.isValid) {
      validationErrors.startDate = startDateValidation.error!;
    }

    const endDateValidation = validateString(bookingData.endDate, { required: true });
    if (!endDateValidation.isValid) {
      validationErrors.endDate = endDateValidation.error!;
    }

    const totalPriceValidation = validateNumber(bookingData.totalPrice, {
      required: true,
      min: 0
    });
    if (!totalPriceValidation.isValid) {
      validationErrors.totalPrice = totalPriceValidation.error!;
    }

    if (Object.keys(validationErrors).length > 0) {
      throw new ValidationError('Validation failed', { fields: validationErrors });
    }

    // Validate renter
    if (bookingData.renterUid !== locals.userId) {
      throw new AuthorizationError('Cannot create booking for another user');
    }

    // Get the listing to verify it exists and is active
    const listingRef = adminFirestore.collection('listings').doc(listingIdValidation.value!);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      throw new NotFoundError('Listing not found');
    }

    const listing = listingDoc.data();

    if (listing?.status !== 'active') {
      throw new ValidationError('Listing is not available for booking');
    }

    // Prevent self-booking
    if (listing?.ownerUid === locals.userId) {
      throw new ValidationError('Cannot book your own listing');
    }

    // Add timestamps and sanitized data
    const now = adminFirestore.Timestamp.now();
    const sanitizedBookingData = {
      listingId: listingIdValidation.value,
      listingTitle: listing.title,
      listingImage: listing.images?.[0] || '',
      ownerUid: listing.ownerUid,
      renterUid: locals.userId,
      startDate: new Date(startDateValidation.value!),
      endDate: new Date(endDateValidation.value!),
      totalPrice: totalPriceValidation.value,
      securityDeposit: listing.securityDeposit || 0,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // Create booking
    const docRef = await adminFirestore.collection('bookings').add(sanitizedBookingData);

    return json({
      id: docRef.id,
      message: 'Booking created successfully'
    }, { status: 201 });

  } catch (error) {
    throw mapFirebaseError(error);
  }
});

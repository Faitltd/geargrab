import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';
import type { Booking } from '$lib/types/firestore';

// Get a specific booking
export const GET: RequestHandler = async ({ params, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const bookingId = params.bookingId;
    
    // Get the booking
    const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (!bookingDoc.exists) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
    
    // Check if the user is involved in the booking
    if (booking.renterUid !== locals.userId && booking.ownerUid !== locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return json({ booking });
  } catch (error) {
    console.error('Error getting booking:', error);
    return json({ error: 'Failed to get booking' }, { status: 500 });
  }
};

// Update a booking
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const bookingId = params.bookingId;
    const updates = await request.json();
    
    // Get the booking
    const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (!bookingDoc.exists) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const booking = bookingDoc.data() as Booking;
    
    // Check if the user is involved in the booking
    if (booking.renterUid !== locals.userId && booking.ownerUid !== locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate status transitions
    if (updates.status) {
      // Only the owner can confirm or reject a booking
      if ((updates.status === 'confirmed' || updates.status === 'rejected') && locals.userId !== booking.ownerUid) {
        return json({ error: 'Only the owner can confirm or reject a booking' }, { status: 401 });
      }
      
      // Only the renter can cancel a booking
      if (updates.status === 'cancelled' && locals.userId !== booking.renterUid) {
        return json({ error: 'Only the renter can cancel a booking' }, { status: 401 });
      }
    }
    
    // Add updated timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: adminFirestore.Timestamp.now()
    };
    
    // Update booking
    await bookingRef.update(updatesWithTimestamp);
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    return json({ error: 'Failed to update booking' }, { status: 500 });
  }
};

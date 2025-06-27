import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isAdminInitialized } from '$lib/firebase/server';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Check if Firebase Admin is available
    if (!isAdminInitialized || !adminFirestore) {
      return json({ 
        error: 'Firebase Admin not initialized',
        details: 'Missing Firebase Admin credentials'
      }, { status: 500 });
    }

    // Get query parameters
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // Build query
    let query = adminFirestore.collection('bookings')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // Apply status filter if not 'all'
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Execute query
    const snapshot = await query.get();
    
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      startDate: doc.data().startDate?.toDate?.() || new Date(doc.data().startDate),
      endDate: doc.data().endDate?.toDate?.() || new Date(doc.data().endDate),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
    }));

    return json({
      success: true,
      bookings,
      totalCount: bookings.length,
      status: status
    });

  } catch (error) {
    console.error('Error loading bookings:', error);
    return json({ 
      error: 'Failed to load bookings',
      details: error.message
    }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    // Check if Firebase Admin is available
    if (!isAdminInitialized || !adminFirestore) {
      return json({ 
        error: 'Firebase Admin not initialized',
        details: 'Missing Firebase Admin credentials'
      }, { status: 500 });
    }

    const { bookingId, status, adminNotes } = await request.json();
    
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    if (!status) {
      return json({ error: 'Status is required' }, { status: 400 });
    }

    // Update booking
    const updateData = {
      status,
      updatedAt: new Date(),
      adminUpdated: true
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await adminFirestore.collection('bookings').doc(bookingId).update(updateData);

    return json({ 
      success: true,
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

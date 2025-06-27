import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isFirebaseAdminAvailable } from '$lib/firebase/server';
import type { Listing } from '$types/firestore';

// Server-side admin check function
async function isUserAdminServer(userId: string): Promise<boolean> {
  try {
    if (!isFirebaseAdminAvailable() || !adminFirestore) {
      return false;
    }

    // Check admin collection in Firestore using server-side Firebase
    const adminDoc = await adminFirestore.collection('adminUsers').doc(userId).get();
    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      return adminData?.isAdmin === true;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get a specific listing by ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const listingId = params.listingId;
    
    if (!listingId) {
      return json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Get listing from Firestore
    const listingDoc = await adminFirestore.collection('listings').doc(listingId).get();
    
    if (!listingDoc.exists) {
      return json({ error: 'Listing not found' }, { status: 404 });
    }

    const listing = { id: listingDoc.id, ...listingDoc.data() } as Listing;
    
    // Increment view count (optional)
    try {
      await adminFirestore.collection('listings').doc(listingId).update({
        views: (listing.views || 0) + 1,
        updatedAt: adminFirestore.Timestamp.now()
      });
    } catch (error) {
      console.warn('Failed to increment view count:', error);
    }

    return json({ listing });
  } catch (error) {
    console.error('Error getting listing:', error);
    return json({ error: 'Failed to get listing' }, { status: 500 });
  }
};

// Update a specific listing
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = params.listingId;
    
    if (!listingId) {
      return json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Get existing listing to check ownership
    const existingDoc = await adminFirestore.collection('listings').doc(listingId).get();
    
    if (!existingDoc.exists) {
      return json({ error: 'Listing not found' }, { status: 404 });
    }

    const existingListing = existingDoc.data();
    
    // Check if user owns the listing
    if (existingListing?.ownerUid !== locals.userId) {
      return json({ error: 'Unauthorized - you can only update your own listings' }, { status: 403 });
    }

    const updateData = await request.json();
    
    // Prevent updating certain fields
    delete updateData.id;
    delete updateData.ownerUid;
    delete updateData.createdAt;
    delete updateData.views;
    delete updateData.bookingCount;

    // Add updated timestamp
    updateData.updatedAt = adminFirestore.Timestamp.now();

    // Update listing
    await adminFirestore.collection('listings').doc(listingId).update(updateData);

    return json({
      success: true,
      message: 'Listing updated successfully'
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return json({ error: 'Failed to update listing' }, { status: 500 });
  }
};

// Delete a specific listing
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = params.listingId;

    if (!listingId) {
      return json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Check if Firebase Admin is available
    if (!isFirebaseAdminAvailable()) {
      return json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get existing listing to check ownership
    const existingDoc = await adminFirestore.collection('listings').doc(listingId).get();

    if (!existingDoc.exists) {
      return json({ error: 'Listing not found' }, { status: 404 });
    }

    const existingListing = existingDoc.data();

    // Check if user is admin or owns the listing
    const isAdmin = await isUserAdminServer(locals.userId);
    const isOwner = existingListing?.ownerUid === locals.userId;

    if (!isAdmin && !isOwner) {
      return json({ error: 'Unauthorized - you can only delete your own listings or must be an admin' }, { status: 403 });
    }

    // Check if listing has active bookings
    const bookingsSnapshot = await adminFirestore.collection('bookings')
      .where('listingId', '==', listingId)
      .where('status', 'in', ['pending', 'confirmed', 'active'])
      .get();

    if (!bookingsSnapshot.empty) {
      return json({ 
        error: 'Cannot delete listing with active bookings. Please wait for bookings to complete or cancel them first.' 
      }, { status: 400 });
    }

    // Soft delete by updating status
    await adminFirestore.collection('listings').doc(listingId).update({
      status: 'deleted',
      deletedAt: adminFirestore.Timestamp.now(),
      updatedAt: adminFirestore.Timestamp.now()
    });

    return json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return json({ error: 'Failed to delete listing' }, { status: 500 });
  }
};

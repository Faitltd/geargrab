import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import type { Claim, Booking } from '$lib/types/firestore';

const CLAIMS_COLLECTION = 'claims';
const BOOKINGS_COLLECTION = 'bookings';

// --- Helper Functions ---

async function getBooking(bookingId: string): Promise<Booking | null> {
  const bookingDoc = await adminDb.collection(BOOKINGS_COLLECTION).doc(bookingId).get();
  if (!bookingDoc.exists) {
    return null;
  }
  return { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
}

function validateClaimData(data: any) {
  const { bookingId, reason, description } = data;
  if (!bookingId || typeof bookingId !== 'string') {
    throw error(400, 'Invalid or missing bookingId');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    throw error(400, 'Invalid or missing reason');
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw error(400, 'Invalid or missing description');
  }
  return { bookingId, reason, description };
}

function validateClaimStatusUpdate(data: any) {
  const { claimId, status } = data;
  if (!claimId || typeof claimId !== 'string') {
    throw error(400, 'Invalid or missing claimId');
  }
  const validStatuses: Claim['status'][] = ['pending', 'under_review', 'information_requested', 'approved', 'rejected', 'resolved', 'escalated_to_support'];
  if (!status || typeof status !== 'string' || !validStatuses.includes(status as Claim['status'])) {
    throw error(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  return { claimId, status: status as Claim['status'] };
}


// --- Request Handlers ---

// POST /api/claims - Create a new claim
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized: User not authenticated');
  }
  const currentUserId = locals.user.uid;

  try {
    const requestData = await request.json();
    const { bookingId, reason, description } = validateClaimData(requestData);

    const booking = await getBooking(bookingId);
    if (!booking) {
      throw error(404, 'Booking not found');
    }

    // Ensure the user is either the renter or owner of the booking
    if (currentUserId !== booking.renterUid && currentUserId !== booking.ownerUid) {
      throw error(403, 'Forbidden: User is not associated with this booking');
    }

    const newClaimRef = adminDb.collection(CLAIMS_COLLECTION).doc();
    const newClaim: Claim = {
      id: newClaimRef.id,
      bookingId,
      listingId: booking.listingId,
      claimantUid: currentUserId,
      ownerUid: booking.ownerUid,
      renterUid: booking.renterUid,
      reason,
      description,
      status: 'pending',
      evidenceUrls: requestData.evidenceUrls || [], // Optional
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await newClaimRef.set(newClaim);
    return json({ message: 'Claim created successfully', claim: newClaim }, { status: 201 });

  } catch (err: any) {
    console.error('Error creating claim:', err);
    if (err.status && err.body?.message) { // Handle errors thrown by `error()`
        throw err;
    }
    throw error(500, err.message || 'Internal server error while creating claim');
  }
};

// GET /api/claims - Fetch claims
export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized: User not authenticated');
  }
  const currentUserId = locals.user.uid;
  const isAdmin = !!locals.user.isAdmin; // Assuming isAdmin is a boolean property on user

  try {
    const queryStatus = url.searchParams.get('status') as Claim['status'] | null;
    const limitParam = parseInt(url.searchParams.get('limit') || '10', 10);
    const startAfterDocId = url.searchParams.get('startAfter');

    let query: FirebaseFirestore.Query = adminDb.collection(CLAIMS_COLLECTION);

    if (isAdmin) {
      // Admins can see all claims, optionally filter by status
      if (queryStatus) {
        query = query.where('status', '==', queryStatus);
      }
    } else {
      // Non-admins see claims they filed, or are owner/renter for the booking
      query = query.where(
        new FirebaseFirestore.Filter.or(
            FirebaseFirestore.Filter.where('claimantUid', '==', currentUserId),
            FirebaseFirestore.Filter.where('ownerUid', '==', currentUserId),
            FirebaseFirestore.Filter.where('renterUid', '==', currentUserId)
        )
      );
      if (queryStatus) {
        // Non-admins can also filter their relevant claims by status
        query = query.where('status', '==', queryStatus);
      }
    }

    query = query.orderBy('createdAt', 'desc'); // Default sort

    if (startAfterDocId) {
      const startAtDoc = await adminDb.collection(CLAIMS_COLLECTION).doc(startAfterDocId).get();
      if (startAtDoc.exists) {
        query = query.startAfter(startAtDoc);
      }
    }

    query = query.limit(limitParam);

    const snapshot = await query.get();
    const claims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim));

    return json({ claims });

  } catch (err: any) {
    console.error('Error fetching claims:', err);
    if (err.status && err.body?.message) {
        throw err;
    }
    throw error(500, err.message || 'Internal server error while fetching claims');
  }
};

// PUT /api/claims - Update claim status (Admins only)
export const PUT: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized: User not authenticated');
  }
  if (!locals.user.isAdmin) {
    throw error(403, 'Forbidden: Only admins can update claim status');
  }

  try {
    const requestData = await request.json();
    const { claimId, status } = validateClaimStatusUpdate(requestData);
    
    const { resolutionDetails, adminNotes } = requestData; // Optional fields

    const claimRef = adminDb.collection(CLAIMS_COLLECTION).doc(claimId);
    const claimDoc = await claimRef.get();

    if (!claimDoc.exists) {
      throw error(404, 'Claim not found');
    }

    const updateData: Partial<Record<keyof Claim, any>> & { updatedAt: Timestamp } = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (resolutionDetails !== undefined && typeof resolutionDetails === 'string') {
      updateData.resolutionDetails = resolutionDetails;
    }
    if (adminNotes !== undefined && typeof adminNotes === 'string') {
      updateData.adminNotes = adminNotes;
    }
    if (status === 'resolved' || status === 'approved' || status === 'rejected') {
        updateData.resolvedAt = Timestamp.now();
    }


    await claimRef.update(updateData);
    const updatedClaim = { id: claimDoc.id, ...claimDoc.data(), ...updateData } as Claim;

    return json({ message: 'Claim status updated successfully', claim: updatedClaim });

  } catch (err: any) {
    console.error('Error updating claim status:', err);
    if (err.status && err.body?.message) {
        throw err;
    }
    throw error(500, err.message || 'Internal server error while updating claim');
  }
};

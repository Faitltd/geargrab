import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import type { GGVerification, User } from '$lib/types/firestore';

const VERIFICATIONS_COLLECTION = 'gg_verifications';
const USERS_COLLECTION = 'users';

// --- Helper Functions ---

function validateVerificationSubmission(data: any) {
  const { documentType, documentFrontUrl, faceImageUrl } = data;
  const validTypes = ['drivers_license', 'passport', 'national_id', 'residence_permit', 'other'];
  if (!documentType || !validTypes.includes(documentType)) {
    throw error(400, `Invalid or missing documentType. Must be one of: ${validTypes.join(', ')}`);
  }
  if (!documentFrontUrl || typeof documentFrontUrl !== 'string') {
    throw error(400, 'Invalid or missing documentFrontUrl');
  }
  if (!faceImageUrl || typeof faceImageUrl !== 'string') {
    throw error(400, 'Invalid or missing faceImageUrl');
  }
  // documentBackUrl is optional
  if (data.documentBackUrl && typeof data.documentBackUrl !== 'string') {
    throw error(400, 'Invalid documentBackUrl');
  }
  return { documentType, documentFrontUrl, documentBackUrl: data.documentBackUrl, faceImageUrl };
}

function validateVerificationUpdate(data: any) {
  const { verificationId, status } = data;
  if (!verificationId || typeof verificationId !== 'string') {
    throw error(400, 'Invalid or missing verificationId');
  }
  const validStatuses: GGVerification['status'][] = ['pending_review', 'approved', 'rejected', 'needs_resubmission', 'expired', 'in_progress'];
  if (!status || !validStatuses.includes(status as GGVerification['status'])) {
    throw error(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  return { verificationId, status: status as GGVerification['status'], rejectionReason: data.rejectionReason, rejectionCode: data.rejectionCode, verificationDetails: data.verificationDetails };
}

// --- Request Handlers ---

// POST /api/ggverify - Submit a new verification request
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized: User not authenticated');
  }
  const loggedInUser = locals.user;

  try {
    const requestData = await request.json();
    let targetUserId = loggedInUser.uid;

    // Admin submitting for another user
    if (loggedInUser.isAdmin && requestData.userId && typeof requestData.userId === 'string') {
      targetUserId = requestData.userId;
    } else if (requestData.userId && requestData.userId !== loggedInUser.uid && !loggedInUser.isAdmin) {
      throw error(403, 'Forbidden: You can only submit verification requests for yourself.');
    }
    
    const { documentType, documentFrontUrl, documentBackUrl, faceImageUrl } = validateVerificationSubmission(requestData);

    // Check for existing pending or approved verification for the user
    const existingQuery = await adminDb.collection(VERIFICATIONS_COLLECTION)
      .where('userId', '==', targetUserId)
      .where('status', 'in', ['pending_review', 'approved', 'in_progress'])
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      throw error(409, 'Conflict: An active or approved verification request already exists for this user.');
    }
    
    // Check if user exists
    const userDoc = await adminDb.collection(USERS_COLLECTION).doc(targetUserId).get();
    if (!userDoc.exists) {
        throw error(404, `User with ID ${targetUserId} not found.`);
    }

    const newVerificationRef = adminDb.collection(VERIFICATIONS_COLLECTION).doc();
    const newVerification: GGVerification = {
      id: newVerificationRef.id,
      userId: targetUserId,
      documentType,
      documentFrontUrl,
      documentBackUrl,
      faceImageUrl,
      status: 'pending_review',
      attempts: 1, // First attempt
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await newVerificationRef.set(newVerification);
    return json({ message: 'Verification request submitted successfully', verification: newVerification }, { status: 201 });

  } catch (err: any) {
    console.error('Error submitting verification request:', err);
    if (err.status && err.body?.message) { throw err; }
    throw error(500, err.message || 'Internal server error while submitting verification request');
  }
};

// GET /api/ggverify - Fetch verification requests
export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized: User not authenticated');
  }
  const loggedInUser = locals.user;

  try {
    const queryStatus = url.searchParams.get('status') as GGVerification['status'] | null;
    const queryUserId = url.searchParams.get('userId');
    const limitParam = parseInt(url.searchParams.get('limit') || '10', 10);
    const startAfterDocId = url.searchParams.get('startAfter');

    let query: FirebaseFirestore.Query = adminDb.collection(VERIFICATIONS_COLLECTION);

    if (loggedInUser.isAdmin) {
      if (queryUserId) {
        query = query.where('userId', '==', queryUserId);
      }
      if (queryStatus) {
        query = query.where('status', '==', queryStatus);
      }
    } else {
      // Non-admins can only see their own requests
      query = query.where('userId', '==', loggedInUser.uid);
      if (queryStatus) { // Allow non-admins to filter their own requests by status
        query = query.where('status', '==', queryStatus);
      }
    }

    query = query.orderBy('createdAt', 'desc');

    if (startAfterDocId) {
      const startAtDoc = await adminDb.collection(VERIFICATIONS_COLLECTION).doc(startAfterDocId).get();
      if (startAtDoc.exists) {
        query = query.startAfter(startAtDoc);
      }
    }

    query = query.limit(limitParam);
    const snapshot = await query.get();
    const verifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GGVerification));

    return json({ verifications });

  } catch (err: any) {
    console.error('Error fetching verification requests:', err);
    if (err.status && err.body?.message) { throw err; }
    throw error(500, err.message || 'Internal server error while fetching verification requests');
  }
};

// PUT /api/ggverify - Update verification status (Admins only)
export const PUT: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized: User not authenticated');
  }
  if (!locals.user.isAdmin) {
    throw error(403, 'Forbidden: Only admins can update verification status');
  }
  const adminUserId = locals.user.uid;

  try {
    const requestData = await request.json();
    const { verificationId, status, rejectionReason, rejectionCode, verificationDetails } = validateVerificationUpdate(requestData);

    const verificationRef = adminDb.collection(VERIFICATIONS_COLLECTION).doc(verificationId);
    const verificationDoc = await verificationRef.get();

    if (!verificationDoc.exists) {
      throw error(404, 'Verification request not found');
    }
    const verificationData = verificationDoc.data() as GGVerification;

    const updateData: Partial<GGVerification> & { updatedAt: Timestamp, reviewedAt: Timestamp, reviewedBy: string } = {
      status,
      updatedAt: Timestamp.now(),
      reviewedAt: Timestamp.now(),
      reviewedBy: adminUserId,
    };

    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    if (rejectionCode) updateData.rejectionCode = rejectionCode;
    if (verificationDetails) updateData.verificationDetails = verificationDetails;
    
    // If status is changing to 'needs_resubmission', you might want to increment attempts
    if (status === 'needs_resubmission' && verificationData.status !== 'needs_resubmission') {
        updateData.attempts = (verificationData.attempts || 1) + 1;
    }


    if (status === 'approved') {
      const userRef = adminDb.collection(USERS_COLLECTION).doc(verificationData.userId);
      const userUpdate: Partial<User> & { updatedAt: Timestamp } = {
        isGGVerified: true,
        ggVerifiedAt: Timestamp.now(),
        // Potentially set a ggVerificationLevel based on documentType or other criteria
        ggVerificationLevel: 'level1', // Example
        updatedAt: Timestamp.now(), // Assuming User type has updatedAt
      };
      await userRef.update(userUpdate);
    } else if (verificationData.status === 'approved' && status !== 'approved') {
        // If an approved verification is being changed to a non-approved status
        const userRef = adminDb.collection(USERS_COLLECTION).doc(verificationData.userId);
        const userUpdate: Partial<User> & { updatedAt: Timestamp } = {
            isGGVerified: false,
            // Optionally clear ggVerifiedAt and ggVerificationLevel
            // ggVerifiedAt: FieldValue.delete() as any, 
            // ggVerificationLevel: FieldValue.delete() as any,
            updatedAt: Timestamp.now(),
        };
        await userRef.update(userUpdate);
    }


    await verificationRef.update(updateData);
    const updatedVerification = { ...verificationData, ...updateData };

    return json({ message: 'Verification status updated successfully', verification: updatedVerification });

  } catch (err: any) {
    console.error('Error updating verification status:', err);
    if (err.status && err.body?.message) { throw err; }
    throw error(500, err.message || 'Internal server error while updating verification status');
  }
};

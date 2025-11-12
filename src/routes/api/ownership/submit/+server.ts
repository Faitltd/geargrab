import type { RequestHandler } from "./$types";
import { json } from '@sveltejs/kit';
import { adminFirestore } from '$lib/firebase/server';
import { authenticateRequest } from '$lib/security/middleware';
import { 
  checkProofRequirement, 
  validateProofSubmission, 
  createOwnershipProof 
} from '$lib/services/proof-of-ownership';
import crypto from 'crypto';

export async function POST({ request }) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionData = await request.json();
    const {
      listingId,
      gearTitle,
      gearValue,
      category,
      documents,
      metadata
    } = submissionData;

    // Validate required fields
    if (!listingId || !gearTitle || !gearValue || !category) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!documents || documents.length === 0) {
      return json({ error: 'At least one document is required' }, { status: 400 });
    }

    // Check if listing exists and belongs to user
    const listingDoc = await adminFirestore.collection('listings').doc(listingId).get();
    
    if (!listingDoc.exists) {
      return json({ error: 'Listing not found' }, { status: 404 });
    }

    const listing = listingDoc.data();
    if (listing.ownerUid !== auth.userId) {
      return json({ error: 'You can only submit ownership proof for your own listings' }, { status: 403 });
    }

    // Check if proof is required
    const requirement = checkProofRequirement(category, listing.dailyPrice, gearValue);
    
    if (!requirement.required) {
      return json({ error: 'Ownership proof is not required for this item' }, { status: 400 });
    }

    // Validate documents
    const validation = validateProofSubmission(documents, requirement);
    if (!validation.valid) {
      return json({ 
        error: 'Document validation failed',
        details: validation.errors 
      }, { status: 400 });
    }

    // Check if proof already exists
    if (listing.ownershipProofId) {
      const existingProofDoc = await adminFirestore
        .collection('ownershipProofs')
        .doc(listing.ownershipProofId)
        .get();
      
      if (existingProofDoc.exists) {
        const existingProof = existingProofDoc.data();
        if (existingProof.status === 'pending' || existingProof.status === 'approved') {
          return json({ 
            error: 'Ownership proof already submitted for this listing',
            status: existingProof.status 
          }, { status: 400 });
        }
      }
    }

    // Process documents (in production, you would upload to cloud storage)
    const processedDocuments = documents.map((doc: any, index: number) => ({
      id: crypto.randomBytes(8).toString('hex'),
      type: doc.type,
      name: doc.name,
      description: doc.description || '',
      size: doc.size,
      order: index + 1,
      // In production, you would upload the file and store the URL
      fileUrl: `placeholder-url-${doc.id}`,
      uploadedAt: new Date(),
      verified: false
    }));

    // Create ownership proof
    const proofId = await createOwnershipProof(
      listingId,
      auth.userId,
      gearTitle,
      gearValue,
      processedDocuments,
      {
        ipAddress: getClientIP(request),
        userAgent: metadata.userAgent || request.headers.get('user-agent') || 'unknown'
      }
    );

    // Create notification for user
    await adminFirestore.collection('notifications').add({
      userId: auth.userId,
      type: 'ownership_proof_submitted',
      title: 'Ownership Proof Submitted',
      message: `Your ownership proof for "${gearTitle}" has been submitted and is being reviewed.`,
      data: {
        proofId,
        listingId,
        gearTitle,
        estimatedProcessingTime: getEstimatedProcessingTime()
      },
      createdAt: adminFirestore.Timestamp.now(),
      read: false
    });

    console.log(`📋 Ownership proof ${proofId} submitted for listing ${listingId} by user ${auth.userId}`);

    return json({
      success: true,
      proofId,
      status: 'pending',
      message: 'Ownership proof submitted successfully',
      estimatedProcessingTime: getEstimatedProcessingTime()
    });

  } catch (error) {
    console.error('Error submitting ownership proof:', error);
    return json({ 
      error: 'Failed to submit ownership proof',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET({ url, request }) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proofId = url.searchParams.get('proofId');
    const listingId = url.searchParams.get('listingId');
    const userId = url.searchParams.get('userId') || auth.userId;

    // Check if user can access this ownership proof
    if (userId !== auth.userId) {
      // Check if requesting user is admin
      const userDoc = await adminFirestore.collection('users').doc(auth.userId).get();
      const userData = userDoc.data();
      
      if (!userData?.isAdmin) {
        return json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (proofId) {
      // Get specific ownership proof
      const proofDoc = await adminFirestore
        .collection('ownershipProofs')
        .doc(proofId)
        .get();

      if (!proofDoc.exists) {
        return json({ error: 'Ownership proof not found' }, { status: 404 });
      }

      const proof = proofDoc.data();

      // Check access permissions
      if (proof.userId !== auth.userId && !userData?.isAdmin) {
        return json({ error: 'Access denied' }, { status: 403 });
      }

      return json({
        success: true,
        ownershipProof: {
          ...proof,
          verification: {
            ...proof.verification,
            submittedAt: proof.verification?.submittedAt?.toDate(),
            reviewedAt: proof.verification?.reviewedAt?.toDate()
          },
          createdAt: proof.createdAt?.toDate(),
          updatedAt: proof.updatedAt?.toDate(),
          documents: proof.documents?.map((doc: any) => ({
            ...doc,
            uploadedAt: doc.uploadedAt?.toDate()
          }))
        }
      });
    } else if (listingId) {
      // Get ownership proof for specific listing
      const listingDoc = await adminFirestore.collection('listings').doc(listingId).get();
      
      if (!listingDoc.exists) {
        return json({ error: 'Listing not found' }, { status: 404 });
      }

      const listing = listingDoc.data();
      
      if (!listing.ownershipProofId) {
        return json({ 
          success: true, 
          ownershipProof: null,
          required: checkProofRequirement(listing.category, listing.dailyPrice, listing.estimatedValue).required
        });
      }

      const proofDoc = await adminFirestore
        .collection('ownershipProofs')
        .doc(listing.ownershipProofId)
        .get();

      if (!proofDoc.exists) {
        return json({ 
          success: true, 
          ownershipProof: null,
          required: checkProofRequirement(listing.category, listing.dailyPrice, listing.estimatedValue).required
        });
      }

      const proof = proofDoc.data();

      return json({
        success: true,
        ownershipProof: {
          ...proof,
          verification: {
            ...proof.verification,
            submittedAt: proof.verification?.submittedAt?.toDate(),
            reviewedAt: proof.verification?.reviewedAt?.toDate()
          },
          createdAt: proof.createdAt?.toDate(),
          updatedAt: proof.updatedAt?.toDate()
        },
        required: true
      });
    } else {
      // Get user's ownership proofs
      const proofsQuery = await adminFirestore
        .collection('ownershipProofs')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const proofs = proofsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        verification: {
          ...doc.data().verification,
          submittedAt: doc.data().verification?.submittedAt?.toDate(),
          reviewedAt: doc.data().verification?.reviewedAt?.toDate()
        },
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      return json({
        success: true,
        ownershipProofs: proofs
      });
    }

  } catch (error) {
    console.error('Error getting ownership proof:', error);
    return json({ 
      error: 'Failed to get ownership proof',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Get estimated processing time
 */
function getEstimatedProcessingTime(): string {
  const now = new Date();
  const businessHours = now.getHours() >= 9 && now.getHours() < 17;
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  
  if (businessHours && isWeekday) {
    return '2-4 hours';
  } else {
    return '4-24 hours';
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

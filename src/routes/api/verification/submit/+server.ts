import type { RequestHandler } from "./$types";
import { json } from '@sveltejs/kit';
import { adminFirestore, adminStorage } from '$lib/firebase/server';
import { authenticateRequest } from '$lib/security/middleware';
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
      gearPhotos,
      idPhoto,
      timestampConfirmed,
      submittedAt,
      userAgent,
      ipAddress
    } = submissionData;

    // Validate required fields
    if (!gearPhotos || gearPhotos.length < 3) {
      return json({ error: 'At least 3 gear photos are required' }, { status: 400 });
    }

    if (!idPhoto) {
      return json({ error: 'ID photo is required' }, { status: 400 });
    }

    if (!timestampConfirmed) {
      return json({ error: 'Timestamp confirmation is required' }, { status: 400 });
    }

    // Generate verification ID
    const verificationId = crypto.randomBytes(16).toString('hex');

    // Create verification document
    const verificationDoc = {
      id: verificationId,
      userId: auth.userId,
      listingId: listingId || null,
      gearTitle: gearTitle || 'Unknown Item',
      status: 'pending',
      submittedAt: adminFirestore.Timestamp.fromDate(new Date(submittedAt)),
      
      // Photo metadata (not actual files)
      gearPhotos: gearPhotos.map((photo: any, index: number) => ({
        id: photo.id,
        name: photo.name,
        size: photo.size,
        timestamp: photo.timestamp,
        metadata: photo.metadata,
        order: index + 1,
        type: 'gear_photo'
      })),
      
      idPhoto: {
        id: idPhoto.id,
        name: idPhoto.name,
        size: idPhoto.size,
        timestamp: idPhoto.timestamp,
        type: 'government_id'
      },
      
      // Verification metadata
      verification: {
        timestampConfirmed,
        ipAddress,
        userAgent,
        submissionHash: generateSubmissionHash(auth.userId, submittedAt, gearPhotos.length),
        photoCount: gearPhotos.length,
        totalFileSize: [...gearPhotos, idPhoto].reduce((sum, photo) => sum + photo.size, 0)
      },
      
      // Processing status
      processing: {
        automatedChecks: {
          status: 'pending',
          completedAt: null,
          results: null
        },
        manualReview: {
          status: 'pending',
          assignedTo: null,
          completedAt: null,
          reviewerId: null,
          notes: null
        }
      },
      
      // Audit trail
      timeline: [{
        timestamp: adminFirestore.Timestamp.now(),
        event: 'verification_submitted',
        description: 'Verification submitted by user',
        actor: auth.userId,
        metadata: {
          photoCount: gearPhotos.length,
          hasIdPhoto: !!idPhoto,
          timestampConfirmed
        }
      }],
      
      createdAt: adminFirestore.Timestamp.now(),
      updatedAt: adminFirestore.Timestamp.now()
    };

    // Save verification document
    await adminFirestore.collection('verifications').doc(verificationId).set(verificationDoc);

    // Update listing with verification status if listingId provided
    if (listingId) {
      try {
        await adminFirestore.collection('listings').doc(listingId).update({
          verificationStatus: 'pending',
          verificationId: verificationId,
          verificationSubmittedAt: adminFirestore.Timestamp.now(),
          updatedAt: adminFirestore.Timestamp.now()
        });
      } catch (listingError) {
        console.error('Error updating listing verification status:', listingError);
        // Don't fail the verification if listing update fails
      }
    }

    // Create notification for user
    await adminFirestore.collection('notifications').add({
      userId: auth.userId,
      type: 'verification_submitted',
      title: 'Verification Submitted',
      message: `Your verification for "${gearTitle}" has been submitted and is being reviewed.`,
      data: {
        verificationId,
        listingId,
        gearTitle,
        estimatedProcessingTime: getEstimatedProcessingTime()
      },
      createdAt: adminFirestore.Timestamp.now(),
      read: false
    });

    // Schedule automated checks (in a real implementation, this would trigger a Cloud Function)
    console.log(`🔍 Verification ${verificationId} submitted for user ${auth.userId}`);
    
    // In production, you would trigger automated verification checks here
    // For now, we'll just log it
    scheduleAutomatedVerification(verificationId);

    return json({
      success: true,
      verificationId,
      status: 'pending',
      message: 'Verification submitted successfully',
      estimatedProcessingTime: getEstimatedProcessingTime()
    });

  } catch (error) {
    console.error('Error submitting verification:', error);
    return json({ 
      error: 'Failed to submit verification',
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

    const verificationId = url.searchParams.get('verificationId');
    const userId = url.searchParams.get('userId') || auth.userId;

    // Check if user can access this verification
    if (userId !== auth.userId) {
      // Check if requesting user is admin
      const userDoc = await adminFirestore.collection('users').doc(auth.userId).get();
      const userData = userDoc.data();
      
      if (!userData?.isAdmin) {
        return json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (verificationId) {
      // Get specific verification
      const verificationDoc = await adminFirestore
        .collection('verifications')
        .doc(verificationId)
        .get();

      if (!verificationDoc.exists) {
        return json({ error: 'Verification not found' }, { status: 404 });
      }

      const verification = verificationDoc.data();

      // Check access permissions
      if (verification.userId !== auth.userId && !userData?.isAdmin) {
        return json({ error: 'Access denied' }, { status: 403 });
      }

      return json({
        success: true,
        verification: {
          ...verification,
          submittedAt: verification.submittedAt?.toDate(),
          createdAt: verification.createdAt?.toDate(),
          updatedAt: verification.updatedAt?.toDate(),
          timeline: verification.timeline?.map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp?.toDate()
          }))
        }
      });
    } else {
      // Get user's verifications
      const verificationsQuery = await adminFirestore
        .collection('verifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const verifications = verificationsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      return json({
        success: true,
        verifications
      });
    }

  } catch (error) {
    console.error('Error getting verification:', error);
    return json({ 
      error: 'Failed to get verification',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to generate submission hash for integrity verification
function generateSubmissionHash(userId: string, submittedAt: string, photoCount: number): string {
  const data = `${userId}:${submittedAt}:${photoCount}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper function to get estimated processing time
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

// Helper function to schedule automated verification (placeholder)
async function scheduleAutomatedVerification(verificationId: string) {
  // In a real implementation, this would:
  // 1. Trigger Cloud Functions for automated checks
  // 2. Perform image analysis and validation
  // 3. Check for duplicate submissions
  // 4. Validate timestamp authenticity
  // 5. Queue for manual review if needed
  
  console.log(`📋 Scheduled automated verification for ${verificationId}`);
  
  // For demo purposes, we could simulate some automated checks
  // In production, this would be handled by separate microservices
}

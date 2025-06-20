import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$lib/firebase/server';
import { auditLog } from '$lib/security/audit';

// Confirm rental handoff (pre or post rental)
export const POST: RequestHandler = createSecureHandler(
  async ({ request, params }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    try {
      const { phase, userRole, conditionNotes, damageReported, damageDescription } = await request.json();

      // Validate input
      if (!phase || !['pre', 'post'].includes(phase)) {
        return json({ error: 'Valid phase is required (pre or post)' }, { status: 400 });
      }

      if (!userRole || !['owner', 'renter'].includes(userRole)) {
        return json({ error: 'Valid user role is required (owner or renter)' }, { status: 400 });
      }

      if (phase === 'post' && damageReported && !damageDescription?.trim()) {
        return json({ error: 'Damage description is required when reporting damage' }, { status: 400 });
      }

      // Get booking to verify user access
      const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) {
        return json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = bookingDoc.data();
      if (!booking) {
        return json({ error: 'Invalid booking data' }, { status: 400 });
      }

      // Check if user is involved in the booking
      if (booking.ownerUid !== auth.userId && booking.renterUid !== auth.userId) {
        return json({ error: 'Unauthorized access to booking' }, { status: 403 });
      }

      // Verify user role matches
      const actualUserRole = booking.ownerUid === auth.userId ? 'owner' : 'renter';
      if (actualUserRole !== userRole) {
        return json({ error: 'User role mismatch' }, { status: 400 });
      }

      // Check if already confirmed
      const confirmationField = `photoDocumentation.${phase}Rental.${userRole}Confirmed`;
      if (booking.photoDocumentation?.[`${phase}Rental`]?.[`${userRole}Confirmed`]) {
        return json({ error: 'Handoff already confirmed' }, { status: 400 });
      }

      // Prepare update data
      const updateData: any = {
        [confirmationField]: true,
        updatedAt: adminFirestore.Timestamp.now()
      };

      // Add condition notes if provided
      if (conditionNotes?.trim()) {
        updateData[`photoDocumentation.${phase}Rental.${userRole}Notes`] = conditionNotes.trim();
      }

      // Handle damage reporting for post-rental
      if (phase === 'post' && damageReported) {
        updateData[`photoDocumentation.${phase}Rental.damageReported`] = true;
        updateData[`photoDocumentation.${phase}Rental.damageDescription`] = damageDescription.trim();
        updateData[`photoDocumentation.${phase}Rental.damageReportedBy`] = auth.userId;
        updateData[`photoDocumentation.${phase}Rental.damageReportedAt`] = adminFirestore.Timestamp.now();
      }

      // Add handoff tracking
      const handoffField = phase === 'pre' ? 'pickupConfirmed' : 'returnConfirmed';
      updateData[`handoffDetails.${handoffField}`] = {
        confirmedBy: auth.userId,
        confirmedAt: adminFirestore.Timestamp.now(),
        conditionNotes: conditionNotes?.trim() || null
      };

      // Check if both parties have confirmed
      const otherRole = userRole === 'owner' ? 'renter' : 'owner';
      const otherPartyConfirmed = booking.photoDocumentation?.[`${phase}Rental`]?.[`${otherRole}Confirmed`];
      
      if (otherPartyConfirmed) {
        // Both parties confirmed - mark phase as complete
        updateData[`photoDocumentation.${phase}Rental.confirmedAt`] = adminFirestore.Timestamp.now();
        
        // Update booking status if appropriate
        if (phase === 'pre' && booking.status === 'confirmed') {
          updateData.status = 'active';
        } else if (phase === 'post' && booking.status === 'active') {
          updateData.status = damageReported ? 'disputed' : 'completed';
        }
      }

      // Update booking
      await adminFirestore.collection('bookings').doc(bookingId).update(updateData);

      // Log the confirmation
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: `${phase}_rental_handoff_confirmed`,
        resource: 'booking',
        resourceId: bookingId,
        timestamp: new Date(),
        success: true,
        details: {
          phase,
          userRole,
          damageReported: damageReported || false,
          conditionNotes: conditionNotes?.trim() || null,
          bothPartiesConfirmed: !!otherPartyConfirmed
        }
      });

      // Create insurance claim if damage was reported
      if (phase === 'post' && damageReported && damageDescription?.trim()) {
        try {
          const claimData = {
            bookingId,
            listingId: booking.listingId,
            claimantId: auth.userId,
            respondentId: userRole === 'owner' ? booking.renterUid : booking.ownerUid,
            type: 'damage',
            status: 'submitted',
            description: damageDescription.trim(),
            incidentDate: adminFirestore.Timestamp.now(),
            reportedDate: adminFirestore.Timestamp.now(),
            evidence: {
              photos: [], // Will be populated from rental photos
              documents: [],
              witnessStatements: []
            },
            timeline: [{
              date: adminFirestore.Timestamp.now(),
              action: 'Claim submitted',
              actor: auth.userId,
              notes: 'Damage reported during post-rental handoff'
            }],
            createdAt: adminFirestore.Timestamp.now(),
            updatedAt: adminFirestore.Timestamp.now()
          };

          await adminFirestore.collection('insuranceClaims').add(claimData);
        } catch (error) {
          console.error('Error creating insurance claim:', error);
          // Don't fail the handoff confirmation if claim creation fails
        }
      }

      return json({
        success: true,
        message: 'Handoff confirmed successfully',
        bothPartiesConfirmed: !!otherPartyConfirmed,
        bookingStatus: updateData.status || booking.status,
        claimCreated: phase === 'post' && damageReported
      });

    } catch (error) {
      console.error('Error confirming handoff:', error);
      
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'handoff_confirmation_failed',
        resource: 'booking',
        resourceId: bookingId,
        timestamp: new Date(),
        success: false,
        details: {
          error: error.message,
          stack: error.stack
        }
      });

      return json({ 
        error: 'Failed to confirm handoff',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10 // 10 confirmations per 15 minutes
    }
  }
);

// Get handoff status for a booking
export const GET: RequestHandler = createSecureHandler(
  async ({ params }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    try {
      // Get booking to verify user access
      const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) {
        return json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = bookingDoc.data();
      if (!booking) {
        return json({ error: 'Invalid booking data' }, { status: 400 });
      }

      // Check if user is involved in the booking
      if (booking.ownerUid !== auth.userId && booking.renterUid !== auth.userId) {
        return json({ error: 'Unauthorized access to booking' }, { status: 403 });
      }

      const userRole = booking.ownerUid === auth.userId ? 'owner' : 'renter';
      const photoDoc = booking.photoDocumentation || {};

      return json({
        success: true,
        userRole,
        handoffStatus: {
          preRental: {
            ownerConfirmed: photoDoc.preRental?.ownerConfirmed || false,
            renterConfirmed: photoDoc.preRental?.renterConfirmed || false,
            completed: !!photoDoc.preRental?.confirmedAt
          },
          postRental: {
            ownerConfirmed: photoDoc.postRental?.ownerConfirmed || false,
            renterConfirmed: photoDoc.postRental?.renterConfirmed || false,
            completed: !!photoDoc.postRental?.confirmedAt,
            damageReported: photoDoc.postRental?.damageReported || false
          }
        },
        handoffDetails: booking.handoffDetails || {}
      });

    } catch (error) {
      console.error('Error fetching handoff status:', error);
      return json({ 
        error: 'Failed to fetch handoff status',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true
  }
);

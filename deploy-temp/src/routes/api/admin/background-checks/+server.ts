import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$firebase/server';
import { backgroundCheckProviders } from '$lib/services/backgroundCheckProviders';
import { sendBackgroundCheckEmails } from '$lib/services/email';

// Check if user is admin (you'll need to implement this based on your auth system)
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const adminDoc = await adminFirestore
      .collection('adminUsers')
      .doc(userId)
      .get();
    
    return adminDoc.exists && adminDoc.data()?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get all background check requests (admin only)
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authentication
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin privileges
  if (!(await isAdmin(locals.userId))) {
    return json({ error: 'Admin privileges required' }, { status: 403 });
  }

  try {
    const status = url.searchParams.get('status');
    const provider = url.searchParams.get('provider');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = adminFirestore
      .collection('verificationRequests')
      .where('type', '==', 'background_check');

    // Add filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (provider) {
      query = query.where('backgroundCheckData.provider', '==', provider);
    }

    // Add ordering and pagination
    query = query
      .orderBy('submittedAt', 'desc')
      .limit(limit)
      .offset(offset);

    // Execute query
    const snapshot = await query.get();
    
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate?.() || doc.data().submittedAt,
      reviewedAt: doc.data().reviewedAt?.toDate?.() || doc.data().reviewedAt
    }));

    // Get statistics
    const statsSnapshot = await adminFirestore
      .collection('verificationRequests')
      .where('type', '==', 'background_check')
      .get();

    const stats = {
      total: statsSnapshot.size,
      pending: 0,
      inProgress: 0,
      approved: 0,
      rejected: 0,
      failed: 0
    };

    statsSnapshot.docs.forEach(doc => {
      const status = doc.data().status;
      if (status in stats) {
        stats[status as keyof typeof stats]++;
      }
    });

    return json({
      requests,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: snapshot.size === limit
      }
    });

  } catch (error) {
    console.error('Error getting background check requests:', error);
    return json({ 
      error: 'Failed to get background check requests' 
    }, { status: 500 });
  }
};

// Update background check status (admin only)
export const PATCH: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin privileges
  if (!(await isAdmin(locals.userId))) {
    return json({ error: 'Admin privileges required' }, { status: 403 });
  }

  try {
    const { requestId, action, notes, rejectionReason } = await request.json();

    if (!requestId || !action) {
      return json({ 
        error: 'Missing required fields: requestId, action' 
      }, { status: 400 });
    }

    // Get the verification request
    const requestDoc = await adminFirestore
      .collection('verificationRequests')
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data();

    // Process different actions
    switch (action) {
      case 'approve':
        await requestDoc.ref.update({
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: locals.userId,
          notes: notes || 'Manually approved by admin',
          'backgroundCheckData.overallStatus': 'pass',
          'backgroundCheckData.riskLevel': 'low'
        });

        // Send approval email
        await sendBackgroundCheckEmails({
          userId: requestData?.userId,
          requestId,
          checkType: requestData?.backgroundCheckData?.checkType,
          provider: requestData?.backgroundCheckData?.provider,
          status: 'approved'
        });

        break;

      case 'reject':
        if (!rejectionReason) {
          return json({ 
            error: 'Rejection reason is required' 
          }, { status: 400 });
        }

        await requestDoc.ref.update({
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: locals.userId,
          rejectionReason,
          notes: notes || `Rejected: ${rejectionReason}`,
          'backgroundCheckData.overallStatus': 'fail'
        });

        // Send rejection email
        await sendBackgroundCheckEmails({
          userId: requestData?.userId,
          requestId,
          checkType: requestData?.backgroundCheckData?.checkType,
          provider: requestData?.backgroundCheckData?.provider,
          status: 'rejected',
          rejectionReason
        });

        break;

      case 'rerun':
        // Rerun background check with provider
        const provider = backgroundCheckProviders.getProvider(
          requestData?.backgroundCheckData?.provider
        );

        if (!provider) {
          return json({ error: 'Invalid provider' }, { status: 400 });
        }

        try {
          // Cancel existing check if it has an external ID
          if (requestData?.backgroundCheckData?.externalId) {
            await provider.cancelBackgroundCheck(
              requestData.backgroundCheckData.externalId
            );
          }

          // Start new check
          const newExternalId = await provider.initiateBackgroundCheck({
            userId: requestData?.userId,
            checkType: requestData?.backgroundCheckData?.checkType,
            personalInfo: requestData?.backgroundCheckData?.personalInfo,
            requestId
          });

          await requestDoc.ref.update({
            status: 'in_progress',
            'backgroundCheckData.externalId': newExternalId,
            'backgroundCheckData.rerunAt': new Date(),
            'backgroundCheckData.rerunBy': locals.userId,
            notes: notes || 'Background check rerun by admin'
          });

        } catch (providerError) {
          return json({ 
            error: `Failed to rerun background check: ${providerError.message}` 
          }, { status: 500 });
        }

        break;

      case 'add_note':
        const existingNotes = requestData?.notes || '';
        const newNote = `[${new Date().toISOString()}] Admin (${locals.userId}): ${notes}`;
        const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

        await requestDoc.ref.update({
          notes: updatedNotes,
          lastUpdated: new Date()
        });

        break;

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

    return json({
      success: true,
      message: `Background check ${action} completed successfully`
    });

  } catch (error) {
    console.error('Error updating background check:', error);
    return json({ 
      error: 'Failed to update background check' 
    }, { status: 500 });
  }
};

// Bulk operations on background checks (admin only)
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin privileges
  if (!(await isAdmin(locals.userId))) {
    return json({ error: 'Admin privileges required' }, { status: 403 });
  }

  try {
    const { action, requestIds, notes, rejectionReason } = await request.json();

    if (!action || !requestIds || !Array.isArray(requestIds)) {
      return json({ 
        error: 'Missing required fields: action, requestIds' 
      }, { status: 400 });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each request
    for (const requestId of requestIds) {
      try {
        const requestDoc = await adminFirestore
          .collection('verificationRequests')
          .doc(requestId)
          .get();

        if (!requestDoc.exists) {
          results.failed++;
          results.errors.push(`Request ${requestId} not found`);
          continue;
        }

        const requestData = requestDoc.data();

        switch (action) {
          case 'bulk_approve':
            await requestDoc.ref.update({
              status: 'approved',
              reviewedAt: new Date(),
              reviewedBy: locals.userId,
              notes: notes || 'Bulk approved by admin',
              'backgroundCheckData.overallStatus': 'pass',
              'backgroundCheckData.riskLevel': 'low'
            });

            // Send approval email
            await sendBackgroundCheckEmails({
              userId: requestData?.userId,
              requestId,
              checkType: requestData?.backgroundCheckData?.checkType,
              provider: requestData?.backgroundCheckData?.provider,
              status: 'approved'
            });

            break;

          case 'bulk_reject':
            if (!rejectionReason) {
              results.failed++;
              results.errors.push(`Request ${requestId}: Rejection reason required`);
              continue;
            }

            await requestDoc.ref.update({
              status: 'rejected',
              reviewedAt: new Date(),
              reviewedBy: locals.userId,
              rejectionReason,
              notes: notes || `Bulk rejected: ${rejectionReason}`,
              'backgroundCheckData.overallStatus': 'fail'
            });

            // Send rejection email
            await sendBackgroundCheckEmails({
              userId: requestData?.userId,
              requestId,
              checkType: requestData?.backgroundCheckData?.checkType,
              provider: requestData?.backgroundCheckData?.provider,
              status: 'rejected',
              rejectionReason
            });

            break;

          default:
            results.failed++;
            results.errors.push(`Request ${requestId}: Invalid action`);
            continue;
        }

        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push(`Request ${requestId}: ${error.message}`);
      }
    }

    return json({
      success: true,
      message: `Bulk operation completed: ${results.successful} successful, ${results.failed} failed`,
      results
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return json({ 
      error: 'Failed to perform bulk operation' 
    }, { status: 500 });
  }
};

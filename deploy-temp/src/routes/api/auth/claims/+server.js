/**
 * Custom Claims API Endpoints
 * Handles setting and managing custom claims for Firebase Auth
 */

import { json } from '@sveltejs/kit';
import { 
  setListingOwnerClaim, 
  removeListingOwnerClaim,
  setBookingParticipantClaims,
  setMessageParticipantClaims,
  setAdminClaim,
  refreshUserToken,
  cleanupResourceClaim,
  initializeUserClaims
} from '../../../../lib/auth/customClaims.js';

/**
 * POST /api/auth/claims
 * Set custom claims for various resources
 */
export async function POST({ request, locals }) {
  try {
    // Verify user is authenticated
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { action, ...data } = await request.json();

    switch (action) {
      case 'set_listing_owner':
        await setListingOwnerClaim(data.uid, data.listingId);
        break;

      case 'remove_listing_owner':
        await removeListingOwnerClaim(data.uid, data.listingId);
        break;

      case 'set_booking_participants':
        await setBookingParticipantClaims(data.renterUid, data.ownerUid, data.bookingId);
        break;

      case 'set_message_participants':
        await setMessageParticipantClaims(data.participantUids, data.messageId);
        break;

      case 'set_admin':
        // Only existing admins can set admin claims
        if (!locals.user.customClaims?.admin) {
          return json({ error: 'Admin privileges required' }, { status: 403 });
        }
        await setAdminClaim(data.uid, data.isAdmin);
        break;

      case 'initialize_user':
        await initializeUserClaims(data.uid);
        break;

      case 'cleanup_resource':
        await cleanupResourceClaim(data.uid, data.resourceType, data.resourceId);
        break;

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

    // Refresh token to apply new claims
    if (data.refreshToken) {
      await refreshUserToken(data.uid);
    }

    return json({ success: true, message: 'Claims updated successfully' });

  } catch (error) {
    console.error('Error updating claims:', error);
    return json({ error: 'Failed to update claims' }, { status: 500 });
  }
}

/**
 * GET /api/auth/claims
 * Get current user's custom claims
 */
export async function GET({ locals }) {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Claims are available in the user object from the auth middleware
    const claims = locals.user.customClaims || {};

    return json({ 
      success: true, 
      claims,
      uid: locals.user.uid
    });

  } catch (error) {
    console.error('Error getting claims:', error);
    return json({ error: 'Failed to get claims' }, { status: 500 });
  }
}

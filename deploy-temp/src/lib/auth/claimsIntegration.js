/**
 * Claims Integration Utilities
 * Helper functions to integrate custom claims with your existing endpoints
 */

import { 
  setListingOwnerClaim, 
  removeListingOwnerClaim,
  setBookingParticipantClaims,
  setMessageParticipantClaims,
  cleanupResourceClaim
} from './customClaims.js';

/**
 * Call this when a user creates a new listing
 * @param {string} userId - User ID who created the listing
 * @param {string} listingId - ID of the created listing
 */
export async function onListingCreated(userId, listingId) {
  try {
    await setListingOwnerClaim(userId, listingId);
    console.log(`Set listing owner claim for user ${userId}, listing ${listingId}`);
  } catch (error) {
    console.error('Failed to set listing owner claim:', error);
    // Don't throw - this shouldn't break the listing creation
  }
}

/**
 * Call this when a user deletes a listing
 * @param {string} userId - User ID who owns the listing
 * @param {string} listingId - ID of the deleted listing
 */
export async function onListingDeleted(userId, listingId) {
  try {
    await removeListingOwnerClaim(userId, listingId);
    console.log(`Removed listing owner claim for user ${userId}, listing ${listingId}`);
  } catch (error) {
    console.error('Failed to remove listing owner claim:', error);
  }
}

/**
 * Call this when a booking is created
 * @param {string} renterUid - Renter user ID
 * @param {string} ownerUid - Owner user ID
 * @param {string} bookingId - Booking ID
 */
export async function onBookingCreated(renterUid, ownerUid, bookingId) {
  try {
    await setBookingParticipantClaims(renterUid, ownerUid, bookingId);
    console.log(`Set booking participant claims for booking ${bookingId}`);
  } catch (error) {
    console.error('Failed to set booking participant claims:', error);
  }
}

/**
 * Call this when a booking is cancelled/completed
 * @param {string} renterUid - Renter user ID
 * @param {string} ownerUid - Owner user ID
 * @param {string} bookingId - Booking ID
 */
export async function onBookingEnded(renterUid, ownerUid, bookingId) {
  try {
    await cleanupResourceClaim(renterUid, 'booking', bookingId);
    await cleanupResourceClaim(ownerUid, 'booking', bookingId);
    console.log(`Cleaned up booking participant claims for booking ${bookingId}`);
  } catch (error) {
    console.error('Failed to cleanup booking participant claims:', error);
  }
}

/**
 * Call this when a message/conversation is created
 * @param {Array} participantUids - Array of participant user IDs
 * @param {string} messageId - Message/conversation ID
 */
export async function onMessageCreated(participantUids, messageId) {
  try {
    await setMessageParticipantClaims(participantUids, messageId);
    console.log(`Set message participant claims for message ${messageId}`);
  } catch (error) {
    console.error('Failed to set message participant claims:', error);
  }
}

/**
 * Call this when a user signs up to initialize their claims
 * @param {string} userId - New user ID
 */
export async function onUserSignUp(userId) {
  try {
    await initializeUserClaims(userId);
    console.log(`Initialized claims for new user ${userId}`);
  } catch (error) {
    console.error('Failed to initialize user claims:', error);
  }
}

/**
 * Middleware to check if user has required claims for storage access
 * @param {Object} user - User object from auth
 * @param {string} requiredClaim - Required claim type
 * @param {string} resourceId - Resource ID to check
 * @returns {boolean} Whether user has required access
 */
export function hasStorageAccess(user, requiredClaim, resourceId = null) {
  if (!user || !user.customClaims) {
    return false;
  }

  const claims = user.customClaims;

  switch (requiredClaim) {
    case 'listing_owner':
      return claims.listing_owner && 
             (!resourceId || claims.owned_listings?.includes(resourceId));
    
    case 'booking_participant':
      return claims.booking_participant && 
             (!resourceId || claims.participant_bookings?.includes(resourceId));
    
    case 'message_participant':
      return claims.message_participant && 
             (!resourceId || claims.participant_messages?.includes(resourceId));
    
    case 'admin':
      return claims.admin === true;
    
    default:
      return false;
  }
}

/**
 * Express/SvelteKit middleware to validate storage access
 * Use this in your file upload endpoints
 */
export function validateStorageAccess(requiredClaim, getResourceId = null) {
  return (req, res, next) => {
    const user = req.user || req.locals?.user;
    const resourceId = getResourceId ? getResourceId(req) : null;
    
    if (!hasStorageAccess(user, requiredClaim, resourceId)) {
      return res.status(403).json({
        error: 'Insufficient permissions for storage access',
        required: requiredClaim,
        resourceId
      });
    }
    
    next();
  };
}

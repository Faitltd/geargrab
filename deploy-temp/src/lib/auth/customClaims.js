/**
 * Custom Claims Management for Firebase Auth
 * Handles setting custom claims for secure storage access
 */

import { adminAuth, adminFirestore } from '../firebase/server.ts';

/**
 * Set custom claims for a user
 * @param {string} uid - User ID
 * @param {Object} claims - Custom claims to set
 */
export async function setCustomClaims(uid, claims) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    console.log(`Custom claims set for user ${uid}:`, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw error;
  }
}

/**
 * Get current custom claims for a user
 * @param {string} uid - User ID
 * @returns {Object} Current custom claims
 */
export async function getCustomClaims(uid) {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord.customClaims || {};
  } catch (error) {
    console.error('Error getting custom claims:', error);
    throw error;
  }
}

/**
 * Set listing owner claim when user creates/owns a listing
 * @param {string} uid - User ID
 * @param {string} listingId - Listing ID
 */
export async function setListingOwnerClaim(uid, listingId) {
  try {
    const currentClaims = await getCustomClaims(uid);
    const ownedListings = currentClaims.owned_listings || [];
    
    if (!ownedListings.includes(listingId)) {
      ownedListings.push(listingId);
    }
    
    await setCustomClaims(uid, {
      ...currentClaims,
      listing_owner: true,
      owned_listings: ownedListings
    });
  } catch (error) {
    console.error('Error setting listing owner claim:', error);
    throw error;
  }
}

/**
 * Remove listing owner claim when user deletes a listing
 * @param {string} uid - User ID
 * @param {string} listingId - Listing ID
 */
export async function removeListingOwnerClaim(uid, listingId) {
  try {
    const currentClaims = await getCustomClaims(uid);
    const ownedListings = (currentClaims.owned_listings || []).filter(id => id !== listingId);
    
    await setCustomClaims(uid, {
      ...currentClaims,
      listing_owner: ownedListings.length > 0,
      owned_listings: ownedListings
    });
  } catch (error) {
    console.error('Error removing listing owner claim:', error);
    throw error;
  }
}

/**
 * Set booking participant claim for users involved in a booking
 * @param {string} renterUid - Renter user ID
 * @param {string} ownerUid - Owner user ID
 * @param {string} bookingId - Booking ID
 */
export async function setBookingParticipantClaims(renterUid, ownerUid, bookingId) {
  try {
    // Set claim for renter
    const renterClaims = await getCustomClaims(renterUid);
    const renterBookings = renterClaims.participant_bookings || [];
    if (!renterBookings.includes(bookingId)) {
      renterBookings.push(bookingId);
    }
    
    await setCustomClaims(renterUid, {
      ...renterClaims,
      booking_participant: true,
      participant_bookings: renterBookings
    });

    // Set claim for owner
    const ownerClaims = await getCustomClaims(ownerUid);
    const ownerBookings = ownerClaims.participant_bookings || [];
    if (!ownerBookings.includes(bookingId)) {
      ownerBookings.push(bookingId);
    }
    
    await setCustomClaims(ownerUid, {
      ...ownerClaims,
      booking_participant: true,
      participant_bookings: ownerBookings
    });
  } catch (error) {
    console.error('Error setting booking participant claims:', error);
    throw error;
  }
}

/**
 * Set message participant claim for users in a conversation
 * @param {Array} participantUids - Array of participant user IDs
 * @param {string} messageId - Message/conversation ID
 */
export async function setMessageParticipantClaims(participantUids, messageId) {
  try {
    for (const uid of participantUids) {
      const currentClaims = await getCustomClaims(uid);
      const participantMessages = currentClaims.participant_messages || [];
      
      if (!participantMessages.includes(messageId)) {
        participantMessages.push(messageId);
      }
      
      await setCustomClaims(uid, {
        ...currentClaims,
        message_participant: true,
        participant_messages: participantMessages
      });
    }
  } catch (error) {
    console.error('Error setting message participant claims:', error);
    throw error;
  }
}

/**
 * Set admin claim for a user
 * @param {string} uid - User ID
 * @param {boolean} isAdmin - Whether user should be admin
 */
export async function setAdminClaim(uid, isAdmin = true) {
  try {
    const currentClaims = await getCustomClaims(uid);
    
    await setCustomClaims(uid, {
      ...currentClaims,
      admin: isAdmin
    });

    // Also update the adminUsers collection in Firestore
    if (isAdmin) {
      await adminFirestore.collection('adminUsers').doc(uid).set({
        isAdmin: true,
        grantedAt: new Date(),
        grantedBy: 'system'
      });
    } else {
      await adminFirestore.collection('adminUsers').doc(uid).delete();
    }
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw error;
  }
}

/**
 * Refresh user token to apply new custom claims
 * Call this after setting claims to ensure they're immediately available
 * @param {string} uid - User ID
 */
export async function refreshUserToken(uid) {
  try {
    // Revoke existing tokens to force refresh
    await adminAuth.revokeRefreshTokens(uid);
    console.log(`Tokens revoked for user ${uid} - new claims will apply on next login`);
  } catch (error) {
    console.error('Error refreshing user token:', error);
    throw error;
  }
}

/**
 * Clean up claims when resources are deleted
 * @param {string} uid - User ID
 * @param {string} resourceType - Type of resource ('listing', 'booking', 'message')
 * @param {string} resourceId - Resource ID
 */
export async function cleanupResourceClaim(uid, resourceType, resourceId) {
  try {
    const currentClaims = await getCustomClaims(uid);
    let updatedClaims = { ...currentClaims };

    switch (resourceType) {
      case 'listing':
        const ownedListings = (currentClaims.owned_listings || []).filter(id => id !== resourceId);
        updatedClaims.owned_listings = ownedListings;
        updatedClaims.listing_owner = ownedListings.length > 0;
        break;
        
      case 'booking':
        const participantBookings = (currentClaims.participant_bookings || []).filter(id => id !== resourceId);
        updatedClaims.participant_bookings = participantBookings;
        updatedClaims.booking_participant = participantBookings.length > 0;
        break;
        
      case 'message':
        const participantMessages = (currentClaims.participant_messages || []).filter(id => id !== resourceId);
        updatedClaims.participant_messages = participantMessages;
        updatedClaims.message_participant = participantMessages.length > 0;
        break;
    }

    await setCustomClaims(uid, updatedClaims);
  } catch (error) {
    console.error('Error cleaning up resource claim:', error);
    throw error;
  }
}

/**
 * Initialize claims for a new user
 * @param {string} uid - User ID
 */
export async function initializeUserClaims(uid) {
  try {
    await setCustomClaims(uid, {
      admin: false,
      listing_owner: false,
      booking_participant: false,
      message_participant: false,
      owned_listings: [],
      participant_bookings: [],
      participant_messages: []
    });
  } catch (error) {
    console.error('Error initializing user claims:', error);
    throw error;
  }
}

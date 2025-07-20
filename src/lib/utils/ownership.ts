import type { User } from 'firebase/auth';
import type { ListingData } from '$lib/services/listings';

// Check if user owns a listing
export const isListingOwner = (listing: ListingData | null, user: User | null): boolean => {
  if (!listing || !user) return false;
  return listing.ownerId === user.uid;
};

// Check if user can edit a listing
export const canEditListing = (listing: ListingData | null, user: User | null): boolean => {
  if (!listing || !user) return false;
  
  // Only owner can edit
  if (!isListingOwner(listing, user)) return false;
  
  // Can't edit sold or rented items (but can change status)
  return true;
};

// Check if user can delete a listing
export const canDeleteListing = (listing: ListingData | null, user: User | null): boolean => {
  if (!listing || !user) return false;
  
  // Only owner can delete
  if (!isListingOwner(listing, user)) return false;
  
  // Can delete any status (owner's choice)
  return true;
};

// Check if user can change listing status
export const canChangeListingStatus = (listing: ListingData | null, user: User | null): boolean => {
  if (!listing || !user) return false;
  
  // Only owner can change status
  return isListingOwner(listing, user);
};

// Check if user can view listing (including inactive ones)
export const canViewListing = (listing: ListingData | null, user: User | null): boolean => {
  if (!listing) return false;
  
  // Public listings are viewable by all authenticated users
  if (listing.status === 'active') return true;
  
  // Private/inactive listings only viewable by owner
  return isListingOwner(listing, user);
};

// Check if user can contact listing owner
export const canContactOwner = (listing: ListingData | null, user: User | null): boolean => {
  if (!listing || !user) return false;
  
  // Can't contact yourself
  if (isListingOwner(listing, user)) return false;
  
  // Can only contact for active listings
  return listing.status === 'active';
};

// Check if user can make an offer
export const canMakeOffer = (listing: ListingData | null, user: User | null): boolean => {
  if (!listing || !user) return false;
  
  // Can't make offer on your own listing
  if (isListingOwner(listing, user)) return false;
  
  // Can only make offers on active sale listings
  return listing.status === 'active' && listing.listingType === 'sale';
};

// Check if user can rent an item
export const canRentItem = (listing: ListingData | null, user: User | null): boolean => {
  if (!listing || !user) return false;
  
  // Can't rent your own item
  if (isListingOwner(listing, user)) return false;
  
  // Can only rent active rental listings
  return listing.status === 'active' && listing.listingType === 'rent';
};

// Get user permissions for a listing
export interface ListingPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canContact: boolean;
  canMakeOffer: boolean;
  canRent: boolean;
  isOwner: boolean;
}

export const getListingPermissions = (
  listing: ListingData | null, 
  user: User | null
): ListingPermissions => {
  return {
    canView: canViewListing(listing, user),
    canEdit: canEditListing(listing, user),
    canDelete: canDeleteListing(listing, user),
    canChangeStatus: canChangeListingStatus(listing, user),
    canContact: canContactOwner(listing, user),
    canMakeOffer: canMakeOffer(listing, user),
    canRent: canRentItem(listing, user),
    isOwner: isListingOwner(listing, user)
  };
};

// Validation helpers for UI state
export const getActionButtonState = (
  action: 'edit' | 'delete' | 'contact' | 'offer' | 'rent',
  permissions: ListingPermissions,
  listing: ListingData | null
): {
  enabled: boolean;
  visible: boolean;
  tooltip?: string;
} => {
  if (!listing) {
    return { enabled: false, visible: false };
  }

  switch (action) {
    case 'edit':
      return {
        enabled: permissions.canEdit,
        visible: permissions.isOwner,
        tooltip: !permissions.canEdit ? 'You can only edit your own listings' : undefined
      };
      
    case 'delete':
      return {
        enabled: permissions.canDelete,
        visible: permissions.isOwner,
        tooltip: !permissions.canDelete ? 'You can only delete your own listings' : undefined
      };
      
    case 'contact':
      return {
        enabled: permissions.canContact,
        visible: !permissions.isOwner && listing.status === 'active',
        tooltip: !permissions.canContact 
          ? permissions.isOwner 
            ? 'You cannot contact yourself' 
            : 'This listing is not available for contact'
          : undefined
      };
      
    case 'offer':
      return {
        enabled: permissions.canMakeOffer,
        visible: !permissions.isOwner && listing.listingType === 'sale',
        tooltip: !permissions.canMakeOffer
          ? permissions.isOwner
            ? 'You cannot make an offer on your own listing'
            : listing.status !== 'active'
              ? 'This item is no longer available'
              : 'Offers not available for this listing'
          : undefined
      };
      
    case 'rent':
      return {
        enabled: permissions.canRent,
        visible: !permissions.isOwner && listing.listingType === 'rent',
        tooltip: !permissions.canRent
          ? permissions.isOwner
            ? 'You cannot rent your own item'
            : listing.status !== 'active'
              ? 'This item is no longer available for rent'
              : 'This item is not available for rent'
          : undefined
      };
      
    default:
      return { enabled: false, visible: false };
  }
};

// Helper to get user-friendly status messages
export const getOwnershipMessage = (
  listing: ListingData | null,
  user: User | null
): string | null => {
  if (!listing || !user) return null;
  
  if (isListingOwner(listing, user)) {
    switch (listing.status) {
      case 'active':
        return 'This is your active listing';
      case 'sold':
        return 'You have marked this item as sold';
      case 'rented':
        return 'You have marked this item as rented';
      case 'inactive':
        return 'This is your inactive listing';
      default:
        return 'This is your listing';
    }
  }
  
  return null;
};

// Helper to determine if actions should be shown in UI
export const shouldShowOwnerActions = (
  listing: ListingData | null,
  user: User | null
): boolean => {
  return isListingOwner(listing, user);
};

export const shouldShowBuyerActions = (
  listing: ListingData | null,
  user: User | null
): boolean => {
  if (!listing || !user) return false;
  return !isListingOwner(listing, user) && listing.status === 'active';
};

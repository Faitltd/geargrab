import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '$lib/firebase';
import { encodeGeohash, getGeohashPrecision, getGeohashesInRadius, calculateDistance, type Coordinates } from '$lib/utils/geolocation';
import type { ReviewStats } from './reviews';

// Utility function to generate geohash from coordinates
export const generateGeohash = (coordinates: Coordinates, radiusMiles = 25): { geohash: string; precision: number } => {
  const precision = getGeohashPrecision(radiusMiles);
  const geohash = encodeGeohash(coordinates.latitude, coordinates.longitude, precision);
  return { geohash, precision };
};

export interface ListingData {
  id?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  listingType: 'sale' | 'rent';
  price?: string;
  rentalPrice?: string;
  rentalPeriod?: 'day' | 'week' | 'month';
  condition: string;
  brand?: string;
  size?: string;
  weight?: string;
  availabilityDates?: string[];
  imageUrls: string[];
  tags: string[];
  ownerId: string;
  ownerEmail: string;
  status: 'active' | 'sold' | 'rented' | 'inactive';
  createdAt: any;
  updatedAt: any;
  views: number;
  featured: boolean;
  // Geolocation fields
  coordinates?: Coordinates;
  geohash?: string;
  geohashPrecision?: number;
  // Review stats
  reviewStats?: ReviewStats;
}

// Upload images to Firebase Storage
export const uploadListingImages = async (
  images: File[], 
  listingId: string
): Promise<string[]> => {
  if (!storage) {
    throw new Error('Firebase storage not initialized');
  }
  
  const uploadPromises = images.map(async (image, index) => {
    const fileName = `${listingId}_${index}_${Date.now()}.${image.name.split('.').pop()}`;
    const imageRef = ref(storage, `listings/${listingId}/${fileName}`);
    
    const snapshot = await uploadBytes(imageRef, image);
    return getDownloadURL(snapshot.ref);
  });
  
  return Promise.all(uploadPromises);
};

// Delete images from Firebase Storage
export const deleteListingImages = async (imageUrls: string[]): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase storage not initialized');
  }
  
  const deletePromises = imageUrls.map(async (url) => {
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
    } catch (error) {
      console.warn('Failed to delete image:', url, error);
    }
  });
  
  await Promise.all(deletePromises);
};

// Create a new listing
export const createListing = async (
  listingData: Omit<ListingData, 'id' | 'imageUrls' | 'createdAt' | 'updatedAt' | 'views' | 'featured'>,
  images: File[]
): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Generate geohash if coordinates are provided
    let geohashData = {};
    if (listingData.coordinates) {
      const { geohash, precision } = generateGeohash(listingData.coordinates);
      geohashData = {
        geohash,
        geohashPrecision: precision
      };
    }

    // Create the listing document first to get an ID
    const listingRef = await addDoc(collection(db, 'listings'), {
      ...listingData,
      ...geohashData,
      imageUrls: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      featured: false,
      status: 'active'
    });
    
    // Upload images if any
    let imageUrls: string[] = [];
    if (images.length > 0) {
      imageUrls = await uploadListingImages(images, listingRef.id);
      
      // Update the listing with image URLs
      await updateDoc(listingRef, {
        imageUrls,
        updatedAt: serverTimestamp()
      });
    }
    
    return listingRef.id;
    
  } catch (error) {
    console.error('Error creating listing:', error);
    throw new Error('Failed to create listing');
  }
};

// Update an existing listing with ownership validation
export const updateListing = async (
  listingId: string,
  updates: Partial<ListingData>,
  currentUserId: string,
  newImages?: File[]
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const listingRef = doc(db, 'listings', listingId);

    // First, verify ownership
    const existingListing = await getDoc(listingRef);
    if (!existingListing.exists()) {
      throw new Error('Listing not found');
    }

    const listingData = existingListing.data() as ListingData;
    if (listingData.ownerId !== currentUserId) {
      throw new Error('You can only edit your own listings');
    }

    // Upload new images if provided
    let imageUrls: string[] = [];
    if (newImages && newImages.length > 0) {
      imageUrls = await uploadListingImages(newImages, listingId);
    }

    // Prepare update data
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // Ensure ownership fields cannot be changed
    delete updateData.ownerId;
    delete updateData.ownerEmail;
    delete updateData.createdAt;

    // Add new image URLs if any
    if (imageUrls.length > 0) {
      updateData.imageUrls = imageUrls;
    }

    await updateDoc(listingRef, updateData);

  } catch (error) {
    console.error('Error updating listing:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update listing');
  }
};

// Get a single listing by ID
export const getListing = async (listingId: string): Promise<ListingData | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const listingRef = doc(db, 'listings', listingId);
    const listingSnap = await getDoc(listingRef);
    
    if (listingSnap.exists()) {
      return {
        id: listingSnap.id,
        ...listingSnap.data()
      } as ListingData;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting listing:', error);
    throw new Error('Failed to get listing');
  }
};

// Pagination result interface
export interface PaginatedListings {
  listings: ListingData[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

// Get listings with filters and pagination
export const getListings = async (options: {
  category?: string;
  listingType?: 'sale' | 'rent';
  ownerId?: string;
  status?: string;
  limitCount?: number;
  lastDoc?: QueryDocumentSnapshot | null;
  sortBy?: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'title';
  // Geo-filtering options
  nearbyLocation?: Coordinates;
  nearbyRadius?: number;
} = {}): Promise<PaginatedListings> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    let q = query(collection(db, 'listings'));

    // Add filters
    if (options.category) {
      q = query(q, where('category', '==', options.category));
    }

    if (options.listingType) {
      q = query(q, where('listingType', '==', options.listingType));
    }

    if (options.ownerId) {
      q = query(q, where('ownerId', '==', options.ownerId));
    }

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    // Geo-filtering: Use geohash for proximity search
    if (options.nearbyLocation && options.nearbyRadius) {
      const geohashes = getGeohashesInRadius(options.nearbyLocation, options.nearbyRadius);

      // For Firestore, we need to use array-contains-any with geohash prefixes
      // This is a simplified approach - in production, you might want to use multiple queries
      if (geohashes.length > 0) {
        // Use the first few characters of geohashes for broader matching
        const geohashPrefixes = geohashes.map(hash => hash.substring(0, 4));
        const uniquePrefixes = [...new Set(geohashPrefixes)].slice(0, 10); // Firestore limit

        if (uniquePrefixes.length > 0) {
          // Note: This requires a composite index on geohash + other filter fields
          q = query(q, where('geohash', '>=', uniquePrefixes[0]), where('geohash', '<', uniquePrefixes[0] + '\uf8ff'));
        }
      }
    }

    // Add ordering based on sortBy option
    const sortBy = options.sortBy || 'newest';
    switch (sortBy) {
      case 'oldest':
        q = query(q, orderBy('createdAt', 'asc'));
        break;
      case 'price-low':
        // Note: This requires a composite index for price + createdAt
        q = query(q, orderBy('price', 'asc'), orderBy('createdAt', 'desc'));
        break;
      case 'price-high':
        // Note: This requires a composite index for price + createdAt
        q = query(q, orderBy('price', 'desc'), orderBy('createdAt', 'desc'));
        break;
      case 'title':
        q = query(q, orderBy('title', 'asc'), orderBy('createdAt', 'desc'));
        break;
      case 'newest':
      default:
        q = query(q, orderBy('createdAt', 'desc'));
        break;
    }

    // Add pagination cursor
    if (options.lastDoc) {
      q = query(q, startAfter(options.lastDoc));
    }

    // Add limit (default to 20 for infinite scroll)
    const limitCount = options.limitCount || 20;
    q = query(q, limit(limitCount));

    const querySnapshot = await getDocs(q);

    let listings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ListingData[];

    // Client-side distance filtering for more precise results
    if (options.nearbyLocation && options.nearbyRadius) {
      listings = listings.filter(listing => {
        if (!listing.coordinates) return false;

        const distance = calculateDistance(options.nearbyLocation!, listing.coordinates);
        return distance <= options.nearbyRadius!;
      });

      // Sort by distance when using proximity filter
      listings.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;

        const distanceA = calculateDistance(options.nearbyLocation!, a.coordinates);
        const distanceB = calculateDistance(options.nearbyLocation!, b.coordinates);
        return distanceA - distanceB;
      });
    }

    // Get the last document for pagination
    const lastDoc = querySnapshot.docs.length > 0
      ? querySnapshot.docs[querySnapshot.docs.length - 1]
      : null;

    // Check if there are more documents
    const hasMore = querySnapshot.docs.length === limitCount;

    return {
      listings,
      lastDoc,
      hasMore
    };

  } catch (error) {
    console.error('Error getting listings:', error);
    throw new Error('Failed to get listings');
  }
};

// Legacy function for backward compatibility
export const getListingsLegacy = async (options: {
  category?: string;
  listingType?: 'sale' | 'rent';
  ownerId?: string;
  status?: string;
  limitCount?: number;
} = {}): Promise<ListingData[]> => {
  const result = await getListings(options);
  return result.listings;
};

// Delete a listing with ownership validation
export const deleteListing = async (listingId: string, currentUserId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Get the listing to verify ownership and access image URLs
    const listing = await getListing(listingId);

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Verify ownership
    if (listing.ownerId !== currentUserId) {
      throw new Error('You can only delete your own listings');
    }

    // Delete associated images
    if (listing.imageUrls.length > 0) {
      await deleteListingImages(listing.imageUrls);
    }

    // Delete the listing document
    const listingRef = doc(db, 'listings', listingId);
    await deleteDoc(listingRef);

  } catch (error) {
    console.error('Error deleting listing:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete listing');
  }
};

/**
 * Get listings by user ID (owner)
 */
export const getUserListings = async (userId: string): Promise<ListingData[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      collection(db, 'listings'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const listings: ListingData[] = [];

    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...doc.data()
      } as ListingData);
    });

    return listings;
  } catch (error) {
    console.error('Error getting user listings:', error);
    throw new Error('Failed to get user listings');
  }
};

// Increment view count
export const incrementListingViews = async (listingId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const listingRef = doc(db, 'listings', listingId);
    const listing = await getDoc(listingRef);
    
    if (listing.exists()) {
      const currentViews = listing.data().views || 0;
      await updateDoc(listingRef, {
        views: currentViews + 1,
        updatedAt: serverTimestamp()
      });
    }
    
  } catch (error) {
    console.error('Error incrementing views:', error);
    // Don't throw error for view counting failures
  }
};

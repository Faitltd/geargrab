// Refactored listings service using base service patterns

import { BaseService, type QueryOptions, type PaginatedResult } from './base.service';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '$lib/firebase';
import { 
  encodeGeohash, 
  getGeohashPrecision, 
  getGeohashesInRadius, 
  calculateDistance, 
  type Coordinates 
} from '$lib/utils/geolocation';
import type { 
  ListingData, 
  ListingFilters, 
  ListingSearchParams,
  GearCondition,
  ListingStatus 
} from '$lib/types';

export class ListingsService extends BaseService<ListingData> {
  constructor() {
    super('listings');
  }

  /**
   * Create a new listing with images
   */
  async createListing(
    listingData: Omit<ListingData, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'favorites'>,
    images: File[]
  ): Promise<string> {
    try {
      // Generate geohash if coordinates are provided
      let geohashData = {};
      if (listingData.location?.coordinates) {
        const { geohash, precision } = this.generateGeohash(listingData.location.coordinates);
        geohashData = {
          geohash,
          geohashPrecision: precision
        };
      }

      // Create the listing document first to get an ID
      const listingId = await this.create({
        ...listingData,
        ...geohashData,
        images: [],
        views: 0,
        favorites: 0,
        status: 'active' as ListingStatus
      });
      
      // Upload images if any
      if (images.length > 0) {
        const imageUrls = await this.uploadImages(images, listingId);
        
        // Update the listing with image URLs
        await this.update(listingId, {
          images: imageUrls
        });
      }

      return listingId;
    } catch (error) {
      this.handleError(error, 'create listing');
    }
  }

  /**
   * Upload images to Firebase Storage
   */
  async uploadImages(images: File[], listingId: string): Promise<string[]> {
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
  }

  /**
   * Delete images from Firebase Storage
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
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
  }

  /**
   * Search listings with filters and pagination
   */
  async searchListings(params: ListingSearchParams): Promise<PaginatedResult<ListingData>> {
    try {
      const options: QueryOptions = {
        limit: params.limit || 20,
        orderBy: this.getSortField(params.sortBy),
        orderDirection: params.sortOrder || 'desc'
      };

      // Build filters
      const filters: QueryOptions['filters'] = [];

      if (params.category) {
        filters.push({ field: 'category', operator: '==', value: params.category });
      }

      if (params.forSale !== undefined) {
        filters.push({ field: 'availability.forSale', operator: '==', value: params.forSale });
      }

      if (params.forRent !== undefined) {
        filters.push({ field: 'availability.forRent', operator: '==', value: params.forRent });
      }

      if (params.condition && params.condition.length > 0) {
        filters.push({ field: 'condition', operator: 'in', value: params.condition });
      }

      // Add location-based filtering if coordinates provided
      if (params.location && params.radius) {
        const geohashes = getGeohashesInRadius(params.location, params.radius);
        if (geohashes.length > 0) {
          // For now, we'll use the first geohash as a simple filter
          // In production, you'd want to implement proper geospatial queries
          filters.push({ field: 'geohash', operator: '>=', value: geohashes[0] });
        }
      }

      options.filters = filters;

      const result = await this.getMany(options);

      // Post-process for location filtering if needed
      if (params.location && params.radius) {
        result.data = result.data.filter(listing => {
          if (!listing.location?.coordinates) return false;
          const distance = calculateDistance(params.location!, listing.location.coordinates);
          return distance <= params.radius!;
        });
      }

      return result;
    } catch (error) {
      this.handleError(error, 'search listings');
    }
  }

  /**
   * Get listings by owner
   */
  async getOwnerListings(ownerId: string): Promise<ListingData[]> {
    try {
      const result = await this.getMany({
        filters: [{ field: 'owner.id', operator: '==', value: ownerId }],
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });
      return result.data;
    } catch (error) {
      this.handleError(error, 'get owner listings');
    }
  }

  /**
   * Increment listing views
   */
  async incrementViews(listingId: string): Promise<void> {
    try {
      const listing = await this.getById(listingId);
      if (listing) {
        await this.update(listingId, {
          views: (listing.views || 0) + 1
        });
      }
    } catch (error) {
      console.warn('Failed to increment views:', error);
      // Don't throw error for view tracking
    }
  }

  /**
   * Update listing status
   */
  async updateStatus(listingId: string, status: ListingStatus): Promise<void> {
    try {
      await this.update(listingId, { status });
    } catch (error) {
      this.handleError(error, 'update listing status');
    }
  }

  /**
   * Delete listing with images
   */
  async deleteListing(listingId: string): Promise<void> {
    try {
      const listing = await this.getById(listingId);
      if (listing && listing.images.length > 0) {
        await this.deleteImages(listing.images);
      }
      await this.delete(listingId);
    } catch (error) {
      this.handleError(error, 'delete listing');
    }
  }

  /**
   * Generate geohash for coordinates
   */
  private generateGeohash(coordinates: Coordinates) {
    const precision = getGeohashPrecision(1000); // 1km precision
    const geohash = encodeGeohash(coordinates.latitude, coordinates.longitude, precision);
    return { geohash, precision };
  }

  /**
   * Get sort field for query
   */
  private getSortField(sortBy?: string): string {
    switch (sortBy) {
      case 'price':
        return 'pricing.salePrice';
      case 'distance':
        return 'geohash';
      case 'newest':
        return 'createdAt';
      case 'rating':
        return 'owner.rating';
      default:
        return 'createdAt';
    }
  }
}

// Export singleton instance
export const listingsService = new ListingsService();

// Export legacy functions for backward compatibility
export const createListing = listingsService.createListing.bind(listingsService);
export const getListing = listingsService.getById.bind(listingsService);
export const getListings = listingsService.searchListings.bind(listingsService);
export const getUserListings = listingsService.getOwnerListings.bind(listingsService);
export const incrementListingViews = listingsService.incrementViews.bind(listingsService);
export const updateListingStatus = listingsService.updateStatus.bind(listingsService);
export const deleteListing = listingsService.deleteListing.bind(listingsService);
export const uploadListingImages = listingsService.uploadImages.bind(listingsService);
export const deleteListingImages = listingsService.deleteImages.bind(listingsService);

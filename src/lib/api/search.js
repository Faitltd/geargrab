/**
 * Search API
 * Handles search functionality for gear, users, and locations
 */

import { firestore } from '$lib/firebase/client';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';

export class SearchAPI {
  /**
   * Search for gear listings
   * @param {Object} filters - Search filters
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchGear(filters = {}, options = {}) {
    try {
      const {
        category,
        location,
        priceMin,
        priceMax,
        availability,
        condition,
        searchTerm,
        sortBy = 'created',
        sortOrder = 'desc',
        pageSize = 20,
        lastDoc = null
      } = { ...filters, ...options };

      let q = collection(firestore, 'listings');
      const constraints = [];

      // Add filters
      if (category && category !== 'all') {
        constraints.push(where('category', '==', category));
      }

      if (condition && condition !== 'all') {
        constraints.push(where('condition', '==', condition));
      }

      if (priceMin !== undefined) {
        constraints.push(where('price', '>=', priceMin));
      }

      if (priceMax !== undefined) {
        constraints.push(where('price', '<=', priceMax));
      }

      // Location-based search (simplified - in production would use geohash)
      if (location) {
        constraints.push(where('location.city', '==', location));
      }

      // Availability filter
      if (availability) {
        constraints.push(where('available', '==', true));
      }

      // Add sorting
      if (sortBy === 'price') {
        constraints.push(orderBy('price', sortOrder));
      } else if (sortBy === 'rating') {
        constraints.push(orderBy('rating', sortOrder));
      } else {
        constraints.push(orderBy('createdAt', sortOrder));
      }

      // Add pagination
      constraints.push(limit(pageSize));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      q = query(q, ...constraints);
      const snapshot = await getDocs(q);
      
      const results = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter by search term if provided (client-side for now)
        if (!searchTerm || 
            data.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
          results.push({
            id: doc.id,
            ...data
          });
        }
      });

      return {
        success: true,
        results,
        hasMore: snapshot.docs.length === pageSize,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error searching gear:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Search for users/guides
   * @param {Object} filters - Search filters
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchUsers(filters = {}, options = {}) {
    try {
      const {
        userType = 'all', // 'guide', 'owner', 'all'
        location,
        specialty,
        verified,
        ratingMin,
        searchTerm,
        sortBy = 'rating',
        sortOrder = 'desc',
        pageSize = 20,
        lastDoc = null
      } = { ...filters, ...options };

      let q = collection(firestore, 'users');
      const constraints = [];

      // Filter by user type
      if (userType === 'guide') {
        constraints.push(where('isGuide', '==', true));
      }

      // Location filter
      if (location) {
        constraints.push(where('location.city', '==', location));
      }

      // Specialty filter for guides
      if (specialty && userType === 'guide') {
        constraints.push(where('guideProfile.specialties', 'array-contains', specialty));
      }

      // Verification filter
      if (verified) {
        constraints.push(where('verificationStatus', '==', 'verified'));
      }

      // Rating filter
      if (ratingMin) {
        constraints.push(where('rating', '>=', ratingMin));
      }

      // Add sorting
      if (sortBy === 'rating') {
        constraints.push(orderBy('rating', sortOrder));
      } else if (sortBy === 'experience') {
        constraints.push(orderBy('guideProfile.yearsExperience', sortOrder));
      } else {
        constraints.push(orderBy('createdAt', sortOrder));
      }

      // Add pagination
      constraints.push(limit(pageSize));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      q = query(q, ...constraints);
      const snapshot = await getDocs(q);
      
      const results = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter by search term if provided
        if (!searchTerm || 
            data.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.guideProfile?.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))) {
          results.push({
            id: doc.id,
            ...data
          });
        }
      });

      return {
        success: true,
        results,
        hasMore: snapshot.docs.length === pageSize,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Get popular search terms
   * @returns {Promise<Array>} Popular search terms
   */
  static async getPopularSearches() {
    try {
      // In a real implementation, this would come from analytics
      return {
        success: true,
        terms: [
          'camping gear',
          'hiking boots',
          'tents',
          'backpacks',
          'climbing gear',
          'ski equipment',
          'kayaks',
          'mountain bikes'
        ]
      };
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return {
        success: false,
        error: error.message,
        terms: []
      };
    }
  }

  /**
   * Get search suggestions based on input
   * @param {string} input - Search input
   * @returns {Promise<Array>} Search suggestions
   */
  static async getSearchSuggestions(input) {
    try {
      if (!input || input.length < 2) {
        return { success: true, suggestions: [] };
      }

      // In a real implementation, this would use a search service like Algolia
      const suggestions = [
        'camping tent',
        'hiking backpack',
        'climbing harness',
        'ski boots',
        'kayak paddle',
        'mountain bike',
        'sleeping bag',
        'camping stove'
      ].filter(term => 
        term.toLowerCase().includes(input.toLowerCase())
      );

      return {
        success: true,
        suggestions: suggestions.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Search by location/map bounds
   * @param {Object} bounds - Map bounds
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Location-based search results
   */
  static async searchByLocation(bounds, filters = {}) {
    try {
      const { north, south, east, west } = bounds;
      
      // In a real implementation, this would use geospatial queries
      // For now, we'll do a simplified location search
      const results = await this.searchGear({
        ...filters,
        // Add location constraints based on bounds
      });

      return results;
    } catch (error) {
      console.error('Error searching by location:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }
}

/**
 * Search for locations
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Location results
 */
export async function searchLocations(filters = {}) {
  try {
    // Stub implementation for deployment
    return [
      {
        id: 'loc-1',
        name: 'Denver, CO',
        coordinates: { lat: 39.7392, lng: -104.9903 },
        listingCount: 45,
        distance: 0
      },
      {
        id: 'loc-2',
        name: 'Boulder, CO',
        coordinates: { lat: 40.0150, lng: -105.2705 },
        listingCount: 23,
        distance: 25
      },
      {
        id: 'loc-3',
        name: 'Fort Collins, CO',
        coordinates: { lat: 40.5853, lng: -105.0844 },
        listingCount: 18,
        distance: 65
      }
    ];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

export default SearchAPI;

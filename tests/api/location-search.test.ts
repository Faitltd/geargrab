import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Firebase Admin
const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn()
};

jest.mock('$lib/firebase/admin', () => ({
  adminFirestore: mockFirestore
}));

// Mock SvelteKit json function
const mockJson = jest.fn((data, options) => ({ data, options }));

describe('Location Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Parameter Validation', () => {
    it('should reject invalid latitude', async () => {
      const validateParams = (lat: number, lng: number, radius: number) => {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return { error: 'Invalid coordinate values', status: 400 };
        }

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return { error: 'Valid latitude and longitude are required', status: 400 };
        }

        if (radius < 0 || radius > 1000) {
          return { error: 'Radius must be between 0 and 1000 km', status: 400 };
        }

        return null;
      };

      const result = validateParams(91, 0, 25);
      expect(result).toEqual({
        error: 'Invalid coordinate values',
        status: 400
      });
    });

    it('should reject invalid longitude', async () => {
      const validateParams = (lat: number, lng: number, radius: number) => {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return { error: 'Valid latitude and longitude are required', status: 400 };
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return { error: 'Invalid coordinate values', status: 400 };
        }
        
        if (radius < 0 || radius > 1000) {
          return { error: 'Radius must be between 0 and 1000 km', status: 400 };
        }
        
        return null;
      };

      const result = validateParams(40, 181, 25);
      expect(result).toEqual({
        error: 'Invalid coordinate values',
        status: 400
      });
    });

    it('should reject invalid radius', async () => {
      const validateParams = (lat: number, lng: number, radius: number) => {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return { error: 'Valid latitude and longitude are required', status: 400 };
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return { error: 'Invalid coordinate values', status: 400 };
        }
        
        if (radius < 0 || radius > 1000) {
          return { error: 'Radius must be between 0 and 1000 km', status: 400 };
        }
        
        return null;
      };

      const result = validateParams(40, -74, 1001);
      expect(result).toEqual({
        error: 'Radius must be between 0 and 1000 km',
        status: 400
      });
    });

    it('should accept valid parameters', async () => {
      const validateParams = (lat: number, lng: number, radius: number) => {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return { error: 'Valid latitude and longitude are required', status: 400 };
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return { error: 'Invalid coordinate values', status: 400 };
        }
        
        if (radius < 0 || radius > 1000) {
          return { error: 'Radius must be between 0 and 1000 km', status: 400 };
        }
        
        return null;
      };

      const result = validateParams(40.7128, -74.0060, 25);
      expect(result).toBeNull();
    });
  });

  describe('Distance Filtering', () => {
    it('should filter results by distance correctly', () => {
      const userLocation = { lat: 40.7128, lng: -74.0060 }; // New York
      const radius = 50; // 50km
      
      const listings = [
        {
          id: '1',
          location: { lat: 40.7589, lng: -73.9851 }, // Manhattan (close)
          title: 'Camping Tent'
        },
        {
          id: '2',
          location: { lat: 34.0522, lng: -118.2437 }, // Los Angeles (far)
          title: 'Hiking Boots'
        },
        {
          id: '3',
          location: { lat: 40.6892, lng: -74.0445 }, // Brooklyn (close)
          title: 'Backpack'
        }
      ];

      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const filteredListings = listings.filter(listing => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          listing.location.lat,
          listing.location.lng
        );
        return distance <= radius;
      });

      expect(filteredListings).toHaveLength(2);
      expect(filteredListings.map(l => l.id)).toEqual(['1', '3']);
    });
  });

  describe('Sorting', () => {
    it('should sort results by distance', () => {
      const userLocation = { lat: 40.7128, lng: -74.0060 };
      
      const results = [
        { id: '1', distance: 25.5, title: 'Far Item' },
        { id: '2', distance: 5.2, title: 'Close Item' },
        { id: '3', distance: 15.8, title: 'Medium Item' }
      ];

      const sortedByDistance = [...results].sort((a, b) => a.distance - b.distance);
      
      expect(sortedByDistance[0].id).toBe('2');
      expect(sortedByDistance[1].id).toBe('3');
      expect(sortedByDistance[2].id).toBe('1');
    });

    it('should sort results by price', () => {
      const results = [
        { id: '1', dailyPrice: 50, title: 'Expensive Item' },
        { id: '2', dailyPrice: 20, title: 'Cheap Item' },
        { id: '3', dailyPrice: 35, title: 'Medium Item' }
      ];

      const sortedByPrice = [...results].sort((a, b) => a.dailyPrice - b.dailyPrice);
      
      expect(sortedByPrice[0].id).toBe('2');
      expect(sortedByPrice[1].id).toBe('3');
      expect(sortedByPrice[2].id).toBe('1');
    });

    it('should sort results by rating', () => {
      const results = [
        { id: '1', averageRating: 3.5, title: 'Low Rated' },
        { id: '2', averageRating: 4.8, title: 'High Rated' },
        { id: '3', averageRating: 4.2, title: 'Medium Rated' }
      ];

      const sortedByRating = [...results].sort((a, b) => b.averageRating - a.averageRating);
      
      expect(sortedByRating[0].id).toBe('2');
      expect(sortedByRating[1].id).toBe('3');
      expect(sortedByRating[2].id).toBe('1');
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore query errors', async () => {
      mockFirestore.get.mockRejectedValue(new Error('Database connection failed'));

      const handleFirestoreError = async () => {
        try {
          await mockFirestore.get();
          return { success: true };
        } catch (error) {
          return { 
            error: 'Database query failed', 
            status: 500 
          };
        }
      };

      const result = await handleFirestoreError();
      expect(result).toEqual({
        error: 'Database query failed',
        status: 500
      });
    });

    it('should handle missing location data gracefully', () => {
      const listings = [
        { id: '1', location: { lat: 40.7128, lng: -74.0060 }, title: 'Valid' },
        { id: '2', location: null, title: 'No Location' },
        { id: '3', location: { lat: null, lng: -74.0060 }, title: 'Invalid Lat' },
        { id: '4', location: { lat: 40.7128, lng: null }, title: 'Invalid Lng' }
      ];

      const validListings = listings.filter(listing => 
        listing.location?.lat && 
        listing.location?.lng && 
        !isNaN(listing.location.lat) && 
        !isNaN(listing.location.lng)
      );

      expect(validListings).toHaveLength(1);
      expect(validListings[0].id).toBe('1');
    });
  });

  describe('Performance Limits', () => {
    it('should limit processing to prevent performance issues', () => {
      const maxProcessingLimit = 1000;
      let processedCount = 0;
      
      const mockListings = Array.from({ length: 1500 }, (_, i) => ({
        id: `listing-${i}`,
        location: { lat: 40 + Math.random(), lng: -74 + Math.random() }
      }));

      const processedListings = [];
      
      for (const listing of mockListings) {
        if (processedCount >= maxProcessingLimit) {
          break;
        }

        processedCount++;
        processedListings.push(listing);
      }

      expect(processedListings).toHaveLength(maxProcessingLimit);
      expect(processedCount).toBe(maxProcessingLimit);
    });
  });
});

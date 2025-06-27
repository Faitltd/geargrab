// Location-based search service for GearGrab
import { Loader } from '@googlemaps/js-api-loader';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Location state stores
export const userLocation = writable<{ lat: number; lng: number } | null>(null);
export const locationPermission = writable<'granted' | 'denied' | 'prompt'>('prompt');
export const mapLoaded = writable(false);

// Search filters
export interface SearchFilters {
  location?: { lat: number; lng: number };
  radius?: number; // in kilometers
  category?: string;
  priceMin?: number;
  priceMax?: number;
  availableFrom?: string;
  availableTo?: string;
  sortBy?: 'distance' | 'price' | 'rating' | 'newest';
}

// Search result with distance
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  dailyPrice: number;
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
    address?: string;
  };
  distance?: number; // in kilometers
  images: string[];
  category: string;
  owner: {
    name: string;
    rating: number;
    avatar?: string;
  };
}

class LocationSearchService {
  private googleMaps: any = null;
  private loader: Loader;

  constructor() {
    this.loader = new Loader({
      apiKey: (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'your-google-maps-api-key',
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    if (browser) {
      this.initialize();
    }
  }

  private async initialize() {
    try {
      // Load Google Maps API
      this.googleMaps = (await this.loader.load()).maps;
      mapLoaded.set(true);
      console.log('✅ Google Maps API loaded');

      // Request user location
      await this.requestUserLocation();
    } catch (error) {
      console.error('❌ Failed to initialize location search:', error);
    }
  }

  async requestUserLocation(): Promise<{ lat: number; lng: number } | null> {
    if (!browser || !navigator.geolocation) {
      console.warn('Geolocation not supported');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          userLocation.set(location);
          locationPermission.set('granted');
          console.log('✅ User location obtained:', location);
          resolve(location);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          locationPermission.set('denied');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Search gear with location filters
  async searchGear(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      const searchParams = new URLSearchParams();
      
      // Add location parameters
      if (filters.location) {
        searchParams.set('lat', filters.location.lat.toString());
        searchParams.set('lng', filters.location.lng.toString());
      }
      
      if (filters.radius) {
        searchParams.set('radius', filters.radius.toString());
      }
      
      // Add other filters
      if (filters.category) searchParams.set('category', filters.category);
      if (filters.priceMin) searchParams.set('priceMin', filters.priceMin.toString());
      if (filters.priceMax) searchParams.set('priceMax', filters.priceMax.toString());
      if (filters.availableFrom) searchParams.set('availableFrom', filters.availableFrom);
      if (filters.availableTo) searchParams.set('availableTo', filters.availableTo);
      if (filters.sortBy) searchParams.set('sortBy', filters.sortBy);

      const response = await fetch(`/api/search/location?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching gear:', error);
      return [];
    }
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.googleMaps) {
      console.warn('Google Maps not loaded');
      return null;
    }

    return new Promise((resolve) => {
      const geocoder = new this.googleMaps!.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.error('Geocoding failed:', status);
          resolve(null);
        }
      });
    });
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.googleMaps) {
      console.warn('Google Maps not loaded');
      return null;
    }

    return new Promise((resolve) => {
      const geocoder = new this.googleMaps!.Geocoder();
      const latlng = new this.googleMaps!.LatLng(lat, lng);
      
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          console.error('Reverse geocoding failed:', status);
          resolve(null);
        }
      });
    });
  }

  // Get nearby cities/areas
  async getNearbyPlaces(lat: number, lng: number, radius: number = 50): Promise<string[]> {
    try {
      const response = await fetch(`/api/search/nearby-places?lat=${lat}&lng=${lng}&radius=${radius}`);
      
      if (!response.ok) {
        throw new Error('Failed to get nearby places');
      }

      const data = await response.json();
      return data.places || [];
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return [];
    }
  }

  // Save user's preferred search location
  async saveSearchLocation(location: { lat: number; lng: number; name: string }) {
    try {
      const response = await fetch('/api/user/search-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(location)
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving search location:', error);
      return false;
    }
  }

  // Get saved search locations
  async getSavedLocations(): Promise<Array<{ lat: number; lng: number; name: string }>> {
    try {
      const response = await fetch('/api/user/search-locations');
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.locations || [];
    } catch (error) {
      console.error('Error getting saved locations:', error);
      return [];
    }
  }

  // Check if Google Maps is loaded
  get isLoaded(): boolean {
    return !!this.googleMaps;
  }

  // Get Google Maps instance
  get maps(): typeof google.maps | null {
    return this.googleMaps;
  }
}

// Export singleton instance
export const locationSearchService = new LocationSearchService();

// Utility functions
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

export function getDistanceColor(distance: number): string {
  if (distance < 5) return 'text-green-400';
  if (distance < 15) return 'text-yellow-400';
  return 'text-red-400';
}

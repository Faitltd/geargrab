// Geolocation utilities for proximity-based filtering

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeohashBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Base32 encoding for geohash
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Generate geohash from coordinates
 */
export function encodeGeohash(lat: number, lng: number, precision = 7): string {
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let geohash = '';
  let bits = 0;
  let bit = 0;
  let even = true;

  while (geohash.length < precision) {
    if (even) {
      // Longitude
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        bit = (bit << 1) | 1;
        lngRange[0] = mid;
      } else {
        bit = bit << 1;
        lngRange[1] = mid;
      }
    } else {
      // Latitude
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        bit = (bit << 1) | 1;
        latRange[0] = mid;
      } else {
        bit = bit << 1;
        latRange[1] = mid;
      }
    }

    even = !even;
    bits++;

    if (bits === 5) {
      geohash += BASE32[bit];
      bits = 0;
      bit = 0;
    }
  }

  return geohash;
}

/**
 * Decode geohash to coordinates
 */
export function decodeGeohash(geohash: string): { lat: number; lng: number; bounds: GeohashBounds } {
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let even = true;

  for (let i = 0; i < geohash.length; i++) {
    const char = geohash[i];
    const idx = BASE32.indexOf(char);
    
    if (idx === -1) {
      throw new Error(`Invalid geohash character: ${char}`);
    }

    for (let j = 4; j >= 0; j--) {
      const bit = (idx >> j) & 1;
      
      if (even) {
        // Longitude
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (bit === 1) {
          lngRange[0] = mid;
        } else {
          lngRange[1] = mid;
        }
      } else {
        // Latitude
        const mid = (latRange[0] + latRange[1]) / 2;
        if (bit === 1) {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }
      
      even = !even;
    }
  }

  const lat = (latRange[0] + latRange[1]) / 2;
  const lng = (lngRange[0] + lngRange[1]) / 2;

  return {
    lat,
    lng,
    bounds: {
      minLat: latRange[0],
      maxLat: latRange[1],
      minLng: lngRange[0],
      maxLng: lngRange[1]
    }
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLng = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get geohash neighbors for proximity search
 */
export function getGeohashNeighbors(geohash: string): string[] {
  const neighbors = [];
  const precision = geohash.length;
  
  // Get all 8 neighboring geohashes
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  const decoded = decodeGeohash(geohash);
  const latStep = (decoded.bounds.maxLat - decoded.bounds.minLat);
  const lngStep = (decoded.bounds.maxLng - decoded.bounds.minLng);
  
  for (const [latDir, lngDir] of directions) {
    const newLat = decoded.lat + (latDir * latStep);
    const newLng = decoded.lng + (lngDir * lngStep);
    
    // Check bounds
    if (newLat >= -90 && newLat <= 90 && newLng >= -180 && newLng <= 180) {
      neighbors.push(encodeGeohash(newLat, newLng, precision));
    }
  }
  
  return neighbors;
}

/**
 * Get geohashes within a radius (approximate)
 */
export function getGeohashesInRadius(center: Coordinates, radiusMiles: number, precision = 6): string[] {
  const centerGeohash = encodeGeohash(center.latitude, center.longitude, precision);
  const geohashes = new Set([centerGeohash]);
  
  // Add neighbors based on radius
  // This is a simplified approach - for production, consider using a proper geohash library
  const neighbors = getGeohashNeighbors(centerGeohash);
  
  for (const neighbor of neighbors) {
    const neighborCoords = decodeGeohash(neighbor);
    const distance = calculateDistance(center, {
      latitude: neighborCoords.lat,
      longitude: neighborCoords.lng
    });
    
    if (distance <= radiusMiles) {
      geohashes.add(neighbor);
      
      // Add second-level neighbors for larger radius
      if (radiusMiles > 10) {
        const secondLevelNeighbors = getGeohashNeighbors(neighbor);
        for (const secondNeighbor of secondLevelNeighbors) {
          const secondCoords = decodeGeohash(secondNeighbor);
          const secondDistance = calculateDistance(center, {
            latitude: secondCoords.lat,
            longitude: secondCoords.lng
          });
          
          if (secondDistance <= radiusMiles) {
            geohashes.add(secondNeighbor);
          }
        }
      }
    }
  }
  
  return Array.from(geohashes);
}

/**
 * Get user's current location
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let message = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Geocode address to coordinates (placeholder - would use Google Maps API in production)
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  // This is a placeholder implementation
  // In production, you would use Google Maps Geocoding API or similar service
  throw new Error('Geocoding not implemented - would use Google Maps API');
}

/**
 * Reverse geocode coordinates to address (placeholder)
 */
export async function reverseGeocode(coords: Coordinates): Promise<string> {
  // This is a placeholder implementation
  // In production, you would use Google Maps Reverse Geocoding API
  throw new Error('Reverse geocoding not implemented - would use Google Maps API');
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    const feet = Math.round(miles * 5280);
    return `${feet} ft`;
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${Math.round(miles)} mi`;
  }
}

/**
 * Get precision level based on radius
 */
export function getGeohashPrecision(radiusMiles: number): number {
  if (radiusMiles <= 1) return 7;      // ~0.6 miles
  if (radiusMiles <= 5) return 6;      // ~2.4 miles  
  if (radiusMiles <= 25) return 5;     // ~12 miles
  if (radiusMiles <= 100) return 4;    // ~78 miles
  return 3;                            // ~312 miles
}

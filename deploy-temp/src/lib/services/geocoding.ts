/**
 * Geocoding Service using Google Maps Geocoding API
 * Converts addresses to latitude/longitude coordinates
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  addressComponents: {
    streetNumber?: string;
    route?: string;
    locality?: string; // city
    administrativeAreaLevel1?: string; // state
    postalCode?: string;
    country?: string;
  };
}

export interface GeocodeResponse {
  success: boolean;
  result?: GeocodeResult;
  error?: string;
}

// Haversine distance calculation
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert miles to kilometers
export function milesToKm(miles: number): number {
  return miles * 1.60934;
}

// Convert kilometers to miles
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

// Geocode an address using Google Maps API
export async function geocodeAddress(address: string): Promise<GeocodeResponse> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Google Maps API key not configured'
      };
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: `Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`
      };
    }

    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        error: 'No results found for the provided address'
      };
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Parse address components
    const addressComponents: GeocodeResult['addressComponents'] = {};
    
    result.address_components.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressComponents.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        addressComponents.route = component.long_name;
      } else if (types.includes('locality')) {
        addressComponents.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressComponents.administrativeAreaLevel1 = component.short_name;
      } else if (types.includes('postal_code')) {
        addressComponents.postalCode = component.long_name;
      } else if (types.includes('country')) {
        addressComponents.country = component.long_name;
      }
    });

    return {
      success: true,
      result: {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        addressComponents
      }
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Geocoding failed'
    };
  }
}

// Reverse geocode coordinates to address
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResponse> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Google Maps API key not configured'
      };
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: `Reverse geocoding failed: ${data.status}`
      };
    }

    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        error: 'No address found for the provided coordinates'
      };
    }

    const result = data.results[0];

    // Parse address components (same as geocodeAddress)
    const addressComponents: GeocodeResult['addressComponents'] = {};
    
    result.address_components.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressComponents.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        addressComponents.route = component.long_name;
      } else if (types.includes('locality')) {
        addressComponents.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressComponents.administrativeAreaLevel1 = component.short_name;
      } else if (types.includes('postal_code')) {
        addressComponents.postalCode = component.long_name;
      } else if (types.includes('country')) {
        addressComponents.country = component.long_name;
      }
    });

    return {
      success: true,
      result: {
        lat,
        lng,
        formattedAddress: result.formatted_address,
        addressComponents
      }
    };

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reverse geocoding failed'
    };
  }
}

// Get bounding box for a given center point and radius
export function getBoundingBox(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = radiusKm / 111; // Approximate km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos(toRadians(centerLat))); // Adjust for longitude

  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLng + lngDelta,
    west: centerLng - lngDelta
  };
}

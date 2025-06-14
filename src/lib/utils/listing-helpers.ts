/**
 * Helper functions for working with listings
 * Ensures consistent data structure and display
 */

import { validateListing, generateSampleListing } from './listingValidation.js';

/**
 * Safely adds a new listing with validation and enhancement
 */
export function addNewListing(listingData: any): { success: boolean; listing?: any; errors: string[]; warnings: string[] } {
  const validation = validateListing(listingData);
  
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  return {
    success: true,
    listing: validation.enhancedListing,
    errors: [],
    warnings: validation.warnings
  };
}

/**
 * Batch validates multiple listings
 */
export function validateListings(listings: any[]): { valid: any[]; invalid: any[]; warnings: string[] } {
  const valid: any[] = [];
  const invalid: any[] = [];
  const allWarnings: string[] = [];

  for (const listing of listings) {
    const validation = validateListing(listing);
    if (validation.isValid) {
      valid.push(validation.enhancedListing);
    } else {
      invalid.push({ listing, errors: validation.errors });
    }
    allWarnings.push(...validation.warnings);
  }

  return { valid, invalid, warnings: allWarnings };
}

/**
 * Creates a new listing with proper defaults
 */
export function createListing(data: {
  title: string;
  category: string;
  dailyPrice: number;
  description?: string;
  images?: string[];
  location?: { city: string; state: string; zipCode?: string };
  [key: string]: any;
}): any {
  const sampleListing = generateSampleListing(data);
  const validation = validateListing(sampleListing);
  
  if (validation.isValid) {
    return validation.enhancedListing;
  } else {
    throw new Error(`Invalid listing data: ${validation.errors.join(', ')}`);
  }
}

/**
 * Example usage and testing function
 */
export function testListingCreation(): void {
  console.log('🧪 Testing listing creation and validation...');

  // Test 1: Valid listing
  try {
    const validListing = createListing({
      title: 'Test Mountain Bike',
      category: 'biking',
      dailyPrice: 45,
      description: 'Great mountain bike for trails',
      location: { city: 'Boulder', state: 'CO' }
    });
    console.log('✅ Valid listing created:', validListing.title);
  } catch (error) {
    console.error('❌ Failed to create valid listing:', error);
  }

  // Test 2: Listing with bad images
  try {
    const listingWithBadImages = createListing({
      title: 'Test Camping Gear',
      category: 'camping',
      dailyPrice: 30,
      images: ['invalid-url', '', 'not-a-url']
    });
    console.log('✅ Listing with bad images enhanced:', listingWithBadImages.images);
  } catch (error) {
    console.error('❌ Failed to enhance listing with bad images:', error);
  }

  // Test 3: Minimal listing
  try {
    const minimalListing = createListing({
      title: 'Minimal Test Item',
      category: 'outdoor-gear',
      dailyPrice: 20
    });
    console.log('✅ Minimal listing created with defaults:', minimalListing.title);
  } catch (error) {
    console.error('❌ Failed to create minimal listing:', error);
  }

  // Test 4: Invalid listing (should fail)
  try {
    const result = addNewListing({
      // Missing required fields
      description: 'This should fail'
    });
    if (!result.success) {
      console.log('✅ Invalid listing correctly rejected:', result.errors);
    } else {
      console.error('❌ Invalid listing was incorrectly accepted');
    }
  } catch (error) {
    console.log('✅ Invalid listing correctly threw error:', error);
  }

  console.log('🧪 Listing validation tests completed!');
}

/**
 * Gets category suggestions based on title/description
 */
export function suggestCategory(title: string, description: string = ''): string {
  const text = (title + ' ' + description).toLowerCase();
  
  const categoryKeywords = {
    'biking': ['bike', 'bicycle', 'cycling', 'mountain bike', 'road bike', 'e-bike'],
    'camping': ['tent', 'sleeping bag', 'camp', 'backpack', 'stove', 'lantern'],
    'hiking': ['hiking', 'backpack', 'trail', 'boots', 'trekking'],
    'skiing': ['ski', 'snowboard', 'winter', 'snow', 'alpine', 'nordic'],
    'climbing': ['climb', 'rope', 'harness', 'helmet', 'boulder', 'rock'],
    'water-sports': ['kayak', 'paddle', 'surf', 'swim', 'boat', 'water'],
    'electric-mobility': ['electric', 'scooter', 'e-bike', 'onewheel', 'skateboard'],
    'photography': ['camera', 'lens', 'photo', 'drone', 'tripod'],
    'fishing': ['fish', 'rod', 'reel', 'tackle', 'fly'],
    'skating': ['skate', 'rollerblade', 'inline']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'outdoor-gear'; // Default category
}

/**
 * Estimates daily price based on category and title
 */
export function estimateDailyPrice(category: string, title: string = ''): number {
  const basePrices: Record<string, number> = {
    'biking': 40,
    'camping': 25,
    'hiking': 20,
    'skiing': 50,
    'climbing': 35,
    'water-sports': 45,
    'electric-mobility': 55,
    'photography': 75,
    'fishing': 30,
    'skating': 25,
    'outdoor-gear': 30
  };

  let basePrice = basePrices[category] || 30;

  // Adjust based on keywords in title
  const titleLower = title.toLowerCase();
  if (titleLower.includes('premium') || titleLower.includes('professional')) {
    basePrice *= 1.5;
  } else if (titleLower.includes('basic') || titleLower.includes('beginner')) {
    basePrice *= 0.8;
  }

  return Math.round(basePrice);
}

/**
 * Utility functions for validating and enhancing listing data
 * Ensures new listings display properly with images and required fields
 */

export interface ListingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  enhancedListing?: any;
}

/**
 * Validates a listing object and ensures it has proper image URLs
 */
export function validateListing(listing: any): ListingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let enhancedListing = { ...listing };

  // Required fields validation
  if (!listing.title || typeof listing.title !== 'string') {
    errors.push('Title is required and must be a string');
  }

  if (!listing.category || typeof listing.category !== 'string') {
    errors.push('Category is required and must be a string');
  }

  if (!listing.dailyPrice || typeof listing.dailyPrice !== 'number') {
    errors.push('Daily price is required and must be a number');
  }

  // Image validation and enhancement
  const imageResult = validateAndEnhanceImages(listing.images, listing.category);
  if (imageResult.errors.length > 0) {
    errors.push(...imageResult.errors);
  }
  if (imageResult.warnings.length > 0) {
    warnings.push(...imageResult.warnings);
  }
  enhancedListing.images = imageResult.images;

  // Location validation
  if (!listing.location || typeof listing.location !== 'object') {
    warnings.push('Location should be an object with city and state');
    enhancedListing.location = { city: 'Local', state: 'Area' };
  }

  // Rating validation
  if (listing.averageRating && (typeof listing.averageRating !== 'number' || listing.averageRating < 0 || listing.averageRating > 5)) {
    warnings.push('Average rating should be a number between 0 and 5');
    enhancedListing.averageRating = 4.5;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    enhancedListing
  };
}

/**
 * Validates and enhances image arrays for listings
 */
function validateAndEnhanceImages(images: any, category: string): { images: string[], errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validImages: string[] = [];

  // Handle missing or invalid images array
  if (!images || !Array.isArray(images)) {
    warnings.push('Images array is missing or invalid, using category default');
    return {
      images: [getDefaultImageForCategory(category)],
      errors,
      warnings
    };
  }

  // Validate each image URL
  for (const img of images) {
    if (typeof img === 'string' && img.trim()) {
      const cleanedUrl = cleanImageUrl(img.trim());
      if (cleanedUrl) {
        validImages.push(cleanedUrl);
      } else {
        warnings.push(`Invalid image URL: ${img}`);
      }
    }
  }

  // If no valid images found, use category default
  if (validImages.length === 0) {
    warnings.push('No valid images found, using category default');
    validImages = [getDefaultImageForCategory(category)];
  }

  return { images: validImages, errors, warnings };
}

/**
 * Cleans and validates image URLs
 */
function cleanImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Remove whitespace
  url = url.trim();
  if (!url) return null;
  
  // Fix malformed URLs with multiple https://
  const cleanedUrl = url.replace(/https:\/\/https:\/\/https:\/\//, 'https://').replace(/https:\/\/https:\/\//, 'https://');
  
  // Basic URL validation
  try {
    new URL(cleanedUrl);
    return cleanedUrl;
  } catch {
    // If it's not a valid URL, check if it's a local path
    if (cleanedUrl.startsWith('/') || cleanedUrl.startsWith('./')) {
      return cleanedUrl;
    }
    return null;
  }
}

/**
 * Gets default image for a category
 */
function getDefaultImageForCategory(category: string): string {
  const defaultImages: Record<string, string> = {
    'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'biking': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'electric-mobility': 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'skating': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'hiking': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'skiing': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'climbing': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'water-sports': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'photography': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'fishing': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'winter-sports': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'outdoor-gear': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'sports': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'adventure': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'equipment': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  };
  
  // Try exact match first
  if (defaultImages[category]) {
    return defaultImages[category];
  }
  
  // Try partial matches for subcategories
  const categoryLower = category.toLowerCase();
  for (const [key, value] of Object.entries(defaultImages)) {
    if (categoryLower.includes(key) || key.includes(categoryLower)) {
      return value;
    }
  }
  
  // Ultimate fallback - outdoor gear image
  return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
}

/**
 * Generates a sample listing with proper structure for testing
 * NOTE: This is for development/testing only - production should use real data
 */
export function generateSampleListing(overrides: Partial<any> = {}): any {
  console.warn('generateSampleListing is for development only - use real data in production');

  const defaultListing = {
    id: `sample-${Date.now()}`,
    title: 'Sample Outdoor Gear',
    description: 'High-quality outdoor equipment perfect for your next adventure.',
    category: 'outdoor-gear',
    subcategory: 'equipment',
    brand: 'Sample Brand',
    model: 'Sample Model',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 25,
    weeklyPrice: 150,
    monthlyPrice: 500,
    securityDeposit: 100,
    location: { city: 'Denver', state: 'CO', zipCode: '80202' },
    images: [getDefaultImageForCategory(overrides.category || 'outdoor-gear')],
    features: ['High Quality', 'Well Maintained', 'Ready to Use'],
    specifications: { 'Condition': 'Like New', 'Age': '1 year' },
    owner: { 
      id: 'sample-owner', 
      name: 'Sample Owner', 
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', 
      rating: 4.8, 
      reviewCount: 15 
    },
    availability: { unavailableDates: [], minimumRental: 1, maximumRental: 14 },
    reviews: [],
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    averageRating: 4.5,
    reviewCount: 10
  };

  return { ...defaultListing, ...overrides };
}

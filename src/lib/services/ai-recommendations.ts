// AI-powered recommendation service for GearGrab
import { firestore } from '$lib/firebase/client';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export interface UserPreferences {
  categories: string[];
  priceRange: { min: number; max: number };
  location: { lat: number; lng: number; radius: number };
  brands: string[];
  features: string[];
  rentalHistory: string[];
}

export interface RecommendationScore {
  listingId: string;
  score: number;
  reasons: string[];
  confidence: number;
}

export interface SmartFilter {
  id: string;
  name: string;
  description: string;
  type: 'category' | 'price' | 'location' | 'feature' | 'availability';
  value: any;
  count: number;
  boost: number;
}

class AIRecommendationService {
  private userPreferences: Map<string, UserPreferences> = new Map();
  private categoryWeights = {
    camping: 1.2,
    hiking: 1.1,
    photography: 1.3,
    cycling: 1.0,
    water_sports: 0.9,
    winter_sports: 0.8,
    climbing: 1.1
  };

  // Get personalized recommendations for a user
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<RecommendationScore[]> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Get all available listings
      const listingsQuery = query(
        collection(firestore, 'listings'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const listingsSnap = await getDocs(listingsQuery);
      const listings = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate recommendation scores
      const recommendations: RecommendationScore[] = [];
      
      for (const listing of listings) {
        const score = this.calculateRecommendationScore(listing, preferences, userId);
        if (score.score > 0.3) { // Only include items with decent scores
          recommendations.push(score);
        }
      }
      
      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  // Calculate recommendation score for a listing
  private calculateRecommendationScore(listing: any, preferences: UserPreferences, userId: string): RecommendationScore {
    let score = 0;
    const reasons: string[] = [];
    let confidence = 0.5;

    // Category preference scoring
    if (preferences.categories.includes(listing.category)) {
      const categoryBoost = this.categoryWeights[listing.category as keyof typeof this.categoryWeights] || 1.0;
      score += 0.3 * categoryBoost;
      reasons.push(`Matches your interest in ${listing.category}`);
      confidence += 0.1;
    }

    // Price preference scoring
    const price = listing.dailyPrice || 0;
    if (price >= preferences.priceRange.min && price <= preferences.priceRange.max) {
      score += 0.2;
      reasons.push('Within your price range');
      confidence += 0.1;
    } else if (price < preferences.priceRange.min) {
      score += 0.1; // Still good if it's cheaper
      reasons.push('Great value option');
    }

    // Location proximity scoring
    if (preferences.location && listing.location) {
      const distance = this.calculateDistance(
        preferences.location.lat,
        preferences.location.lng,
        listing.location.lat,
        listing.location.lng
      );
      
      if (distance <= preferences.location.radius) {
        const proximityScore = Math.max(0, (preferences.location.radius - distance) / preferences.location.radius);
        score += 0.25 * proximityScore;
        reasons.push(`Only ${distance.toFixed(1)} miles away`);
        confidence += 0.15;
      }
    }

    // Brand preference scoring
    if (preferences.brands.includes(listing.brand)) {
      score += 0.15;
      reasons.push(`From ${listing.brand}, a brand you like`);
      confidence += 0.1;
    }

    // Feature matching scoring
    const matchingFeatures = (listing.features || []).filter((feature: string) => 
      preferences.features.includes(feature)
    );
    if (matchingFeatures.length > 0) {
      score += 0.1 * (matchingFeatures.length / Math.max(preferences.features.length, 1));
      reasons.push(`Has features you're looking for: ${matchingFeatures.join(', ')}`);
      confidence += 0.05 * matchingFeatures.length;
    }

    // Rating and popularity boost
    if (listing.averageRating && listing.averageRating >= 4.5) {
      score += 0.1;
      reasons.push(`Highly rated (${listing.averageRating}/5)`);
      confidence += 0.05;
    }

    // Availability boost
    if (listing.isAvailable) {
      score += 0.05;
      reasons.push('Available now');
    }

    // Recency boost for new listings
    const createdAt = listing.createdAt?.toDate() || new Date(0);
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated <= 7) {
      score += 0.05;
      reasons.push('Recently listed');
    }

    // Ensure confidence doesn't exceed 1
    confidence = Math.min(confidence, 1.0);

    return {
      listingId: listing.id,
      score: Math.min(score, 1.0),
      reasons,
      confidence
    };
  }

  // Get smart filters based on user behavior and current search
  async getSmartFilters(userId?: string, currentQuery?: string): Promise<SmartFilter[]> {
    try {
      const filters: SmartFilter[] = [];
      
      // Get all listings for analysis
      const listingsQuery = query(
        collection(firestore, 'listings'),
        where('isActive', '==', true),
        limit(200)
      );
      
      const listingsSnap = await getDocs(listingsQuery);
      const listings = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Category filters with counts
      const categoryCount: Record<string, number> = {};
      listings.forEach(listing => {
        const category = listing.category || 'other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      
      Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .forEach(([category, count]) => {
          filters.push({
            id: `category_${category}`,
            name: category.charAt(0).toUpperCase() + category.slice(1),
            description: `${count} items available`,
            type: 'category',
            value: category,
            count,
            boost: this.categoryWeights[category as keyof typeof this.categoryWeights] || 1.0
          });
        });

      // Price range filters
      const prices = listings.map(l => l.dailyPrice || 0).filter(p => p > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        filters.push(
          {
            id: 'price_budget',
            name: 'Budget Friendly',
            description: `Under $${Math.round(avgPrice * 0.7)}`,
            type: 'price',
            value: { max: Math.round(avgPrice * 0.7) },
            count: prices.filter(p => p <= avgPrice * 0.7).length,
            boost: 1.1
          },
          {
            id: 'price_premium',
            name: 'Premium Options',
            description: `$${Math.round(avgPrice * 1.3)}+`,
            type: 'price',
            value: { min: Math.round(avgPrice * 1.3) },
            count: prices.filter(p => p >= avgPrice * 1.3).length,
            boost: 0.9
          }
        );
      }

      // Feature-based filters
      const featureCount: Record<string, number> = {};
      listings.forEach(listing => {
        (listing.features || []).forEach((feature: string) => {
          featureCount[feature] = (featureCount[feature] || 0) + 1;
        });
      });
      
      Object.entries(featureCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([feature, count]) => {
          filters.push({
            id: `feature_${feature}`,
            name: feature,
            description: `${count} items with this feature`,
            type: 'feature',
            value: feature,
            count,
            boost: 1.0
          });
        });

      // Availability filters
      const availableCount = listings.filter(l => l.isAvailable).length;
      if (availableCount > 0) {
        filters.push({
          id: 'availability_now',
          name: 'Available Now',
          description: `${availableCount} items ready to rent`,
          type: 'availability',
          value: true,
          count: availableCount,
          boost: 1.2
        });
      }

      // Sort filters by relevance (boost * count)
      return filters.sort((a, b) => (b.boost * b.count) - (a.boost * a.count));
      
    } catch (error) {
      console.error('Error getting smart filters:', error);
      return [];
    }
  }

  // Get trending gear based on recent activity
  async getTrendingGear(limit: number = 6): Promise<any[]> {
    try {
      // Get recent bookings to identify trending items
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const bookingsSnap = await getDocs(bookingsQuery);
      const listingCounts: Record<string, number> = {};
      
      bookingsSnap.docs.forEach(doc => {
        const booking = doc.data();
        const listingId = booking.listingId;
        if (listingId) {
          listingCounts[listingId] = (listingCounts[listingId] || 0) + 1;
        }
      });
      
      // Get the most booked listings
      const trendingListingIds = Object.entries(listingCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);
      
      // Fetch the actual listings
      const trendingListings = [];
      for (const listingId of trendingListingIds) {
        const listingsQuery = query(
          collection(firestore, 'listings'),
          where('__name__', '==', listingId)
        );
        const listingSnap = await getDocs(listingsQuery);
        if (!listingSnap.empty) {
          const listing = { id: listingSnap.docs[0].id, ...listingSnap.docs[0].data() };
          trendingListings.push(listing);
        }
      }
      
      return trendingListings;
      
    } catch (error) {
      console.error('Error getting trending gear:', error);
      return [];
    }
  }

  // Get user preferences from their activity
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId)!;
    }

    try {
      // Get user's booking history
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('renterUid', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const bookingsSnap = await getDocs(bookingsQuery);
      
      const categories: string[] = [];
      const brands: string[] = [];
      const features: string[] = [];
      const prices: number[] = [];
      const rentalHistory: string[] = [];
      
      // Analyze booking history
      for (const bookingDoc of bookingsSnap.docs) {
        const booking = bookingDoc.data();
        rentalHistory.push(booking.listingId);
        
        // Get listing details
        const listingQuery = query(
          collection(firestore, 'listings'),
          where('__name__', '==', booking.listingId)
        );
        const listingSnap = await getDocs(listingQuery);
        
        if (!listingSnap.empty) {
          const listing = listingSnap.docs[0].data();
          
          if (listing.category) categories.push(listing.category);
          if (listing.brand) brands.push(listing.brand);
          if (listing.dailyPrice) prices.push(listing.dailyPrice);
          if (listing.features) features.push(...listing.features);
        }
      }
      
      // Calculate preferences
      const preferences: UserPreferences = {
        categories: [...new Set(categories)],
        brands: [...new Set(brands)],
        features: [...new Set(features)],
        rentalHistory,
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) * 0.8 : 0,
          max: prices.length > 0 ? Math.max(...prices) * 1.2 : 500
        },
        location: {
          lat: 39.7392, // Default to Denver
          lng: -104.9903,
          radius: 25
        }
      };
      
      this.userPreferences.set(userId, preferences);
      return preferences;
      
    } catch (error) {
      console.error('Error getting user preferences:', error);
      
      // Return default preferences
      return {
        categories: [],
        brands: [],
        features: [],
        rentalHistory: [],
        priceRange: { min: 0, max: 500 },
        location: { lat: 39.7392, lng: -104.9903, radius: 25 }
      };
    }
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const aiRecommendationService = new AIRecommendationService();

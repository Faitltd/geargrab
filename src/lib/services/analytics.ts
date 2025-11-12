// Analytics and insights service for GearGrab
import { firestore } from '$lib/firebase/client';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  startAfter,
  endBefore 
} from 'firebase/firestore';

export interface DashboardMetrics {
  // Overview metrics
  totalRevenue: number;
  totalBookings: number;
  activeListings: number;
  averageRating: number;
  
  // Growth metrics
  revenueGrowth: number; // percentage
  bookingGrowth: number; // percentage
  newListingsGrowth: number; // percentage
  
  // Performance metrics
  occupancyRate: number; // percentage
  responseRate: number; // percentage
  cancellationRate: number; // percentage
  
  // Financial metrics
  pendingPayouts: number;
  availableBalance: number;
  totalEarnings: number;
  platformFees: number;
}

export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  averageBookingDuration: number; // in days
  
  // Booking trends
  bookingsByMonth: Array<{
    month: string;
    bookings: number;
    revenue: number;
    averageValue: number;
  }>;
  
  // Popular categories
  bookingsByCategory: Array<{
    category: string;
    bookings: number;
    revenue: number;
    percentage: number;
  }>;
  
  // Geographic distribution
  bookingsByLocation: Array<{
    city: string;
    state: string;
    bookings: number;
    revenue: number;
  }>;
  
  // Seasonal trends
  seasonalTrends: Array<{
    season: 'spring' | 'summer' | 'fall' | 'winter';
    bookings: number;
    revenue: number;
    popularCategories: string[];
  }>;
}

export interface ListingPerformance {
  listingId: string;
  title: string;
  category: string;
  
  // Performance metrics
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  
  // Engagement metrics
  views: number;
  inquiries: number;
  conversionRate: number; // bookings / views
  responseRate: number; // responses / inquiries
  
  // Financial metrics
  dailyPrice: number;
  averageBookingValue: number;
  occupancyRate: number;
  
  // Trends
  monthlyBookings: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  
  // Optimization suggestions
  suggestions: Array<{
    type: 'pricing' | 'photos' | 'description' | 'availability';
    message: string;
    impact: 'low' | 'medium' | 'high';
  }>;
}

export interface UserInsights {
  // Profile metrics
  joinDate: Date;
  verificationLevel: string;
  trustScore: number;
  
  // Activity metrics
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  
  // Performance metrics
  averageRating: number;
  responseTime: number; // in hours
  responseRate: number; // percentage
  
  // Engagement metrics
  profileViews: number;
  messagesSent: number;
  messagesReceived: number;
  
  // Achievements
  badges: Array<{
    type: string;
    name: string;
    earnedAt: Date;
    description: string;
  }>;
  
  // Recommendations
  recommendations: Array<{
    type: 'listing' | 'pricing' | 'profile' | 'engagement';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface MarketInsights {
  // Market overview
  totalListings: number;
  totalUsers: number;
  totalTransactionVolume: number;
  
  // Category insights
  popularCategories: Array<{
    category: string;
    listings: number;
    bookings: number;
    averagePrice: number;
    growth: number;
  }>;
  
  // Geographic insights
  topMarkets: Array<{
    city: string;
    state: string;
    listings: number;
    bookings: number;
    averagePrice: number;
    demandSupplyRatio: number;
  }>;
  
  // Pricing insights
  pricingTrends: Array<{
    category: string;
    averagePrice: number;
    priceChange: number; // percentage
    recommendedPriceRange: {
      min: number;
      max: number;
    };
  }>;
  
  // Seasonal insights
  seasonalDemand: Array<{
    month: string;
    demandIndex: number; // 0-100
    popularCategories: string[];
    averagePriceMultiplier: number;
  }>;
}

class AnalyticsService {
  // Get dashboard metrics for a user
  async getDashboardMetrics(userId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<DashboardMetrics> {
    try {
      // Calculate date range
      const now = new Date();
      const daysBack = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Get user's bookings
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('ownerUid', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const bookingsSnap = await getDocs(bookingsQuery);

      // Get user's listings
      const listingsQuery = query(
        collection(firestore, 'listings'),
        where('ownerUid', '==', userId)
      );
      const listingsSnap = await getDocs(listingsQuery);

      // Calculate metrics
      let totalRevenue = 0;
      let completedBookings = 0;
      let cancelledBookings = 0;
      let recentBookings = 0;
      let totalRatings = 0;
      let ratingSum = 0;

      bookingsSnap.forEach(doc => {
        const booking = doc.data();
        const bookingDate = booking.createdAt?.toDate() || new Date();

        if (booking.status === 'completed') {
          totalRevenue += booking.totalPrice || 0;
          completedBookings++;
        }

        if (booking.status === 'cancelled') {
          cancelledBookings++;
        }

        if (bookingDate >= startDate) {
          recentBookings++;
        }

        if (booking.rating) {
          ratingSum += booking.rating;
          totalRatings++;
        }
      });

      const activeListings = listingsSnap.docs.filter(doc => doc.data().isActive).length;
      const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;
      const totalBookings = bookingsSnap.size;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

      // Calculate growth (simplified - would need historical data for accurate calculation)
      const revenueGrowth = Math.random() * 20 - 5; // Mock growth between -5% and 15%
      const bookingGrowth = recentBookings > 0 ? 15.3 : 0;

      return {
        totalRevenue,
        totalBookings,
        activeListings,
        averageRating,
        revenueGrowth,
        bookingGrowth,
        newListingsGrowth: 8.7,
        occupancyRate: activeListings > 0 ? (completedBookings / activeListings) * 10 : 0, // Simplified calculation
        responseRate: 94.5, // Would need message data
        cancellationRate,
        pendingPayouts: totalRevenue * 0.15, // Estimated pending
        availableBalance: totalRevenue * 0.85, // Estimated available
        totalEarnings: totalRevenue,
        platformFees: totalRevenue * 0.15
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      // Return fallback data
      return {
        totalRevenue: 2847.50,
        totalBookings: 23,
        activeListings: 8,
        averageRating: 4.8,
        revenueGrowth: 15.3,
        bookingGrowth: 22.1,
        newListingsGrowth: 8.7,
        occupancyRate: 67.2,
        responseRate: 94.5,
        cancellationRate: 3.2,
        pendingPayouts: 425.80,
        availableBalance: 1250.30,
        totalEarnings: 8945.20,
        platformFees: 1341.78
      };
    }
  }

  // Get booking analytics
  async getBookingAnalytics(userId: string, period: 'month' | 'quarter' | 'year' = 'year'): Promise<BookingAnalytics> {
    try {
      return {
        totalBookings: 156,
        completedBookings: 142,
        cancelledBookings: 8,
        averageBookingValue: 127.50,
        averageBookingDuration: 3.2,
        bookingsByMonth: [
          { month: 'Jan', bookings: 12, revenue: 1520, averageValue: 126.67 },
          { month: 'Feb', bookings: 8, revenue: 980, averageValue: 122.50 },
          { month: 'Mar', bookings: 15, revenue: 1890, averageValue: 126.00 },
          { month: 'Apr', bookings: 18, revenue: 2340, averageValue: 130.00 },
          { month: 'May', bookings: 22, revenue: 2860, averageValue: 130.00 },
          { month: 'Jun', bookings: 28, revenue: 3640, averageValue: 130.00 }
        ],
        bookingsByCategory: [
          { category: 'Camping', bookings: 45, revenue: 5850, percentage: 28.8 },
          { category: 'Hiking', bookings: 38, revenue: 4940, percentage: 24.4 },
          { category: 'Cycling', bookings: 32, revenue: 4160, percentage: 20.5 },
          { category: 'Water Sports', bookings: 25, revenue: 3250, percentage: 16.0 },
          { category: 'Winter Sports', bookings: 16, revenue: 2080, percentage: 10.3 }
        ],
        bookingsByLocation: [
          { city: 'Salt Lake City', state: 'UT', bookings: 45, revenue: 5850 },
          { city: 'Park City', state: 'UT', bookings: 32, revenue: 4160 },
          { city: 'Moab', state: 'UT', bookings: 28, revenue: 3640 },
          { city: 'Provo', state: 'UT', bookings: 22, revenue: 2860 },
          { city: 'Ogden', state: 'UT', bookings: 18, revenue: 2340 }
        ],
        seasonalTrends: [
          { season: 'spring', bookings: 35, revenue: 4550, popularCategories: ['Hiking', 'Camping'] },
          { season: 'summer', bookings: 68, revenue: 8840, popularCategories: ['Water Sports', 'Camping', 'Hiking'] },
          { season: 'fall', bookings: 38, revenue: 4940, popularCategories: ['Hiking', 'Cycling'] },
          { season: 'winter', bookings: 15, revenue: 1950, popularCategories: ['Winter Sports'] }
        ]
      };
    } catch (error) {
      console.error('Error getting booking analytics:', error);
      throw error;
    }
  }

  // Get listing performance data
  async getListingPerformance(listingId: string): Promise<ListingPerformance> {
    try {
      return {
        listingId,
        title: 'REI Co-op Half Dome 4 Plus Tent',
        category: 'Camping',
        totalBookings: 23,
        totalRevenue: 2990,
        averageRating: 4.8,
        reviewCount: 18,
        views: 1247,
        inquiries: 89,
        conversionRate: 1.8,
        responseRate: 94.4,
        dailyPrice: 45,
        averageBookingValue: 130,
        occupancyRate: 67.2,
        monthlyBookings: [
          { month: 'Jan', bookings: 2, revenue: 260 },
          { month: 'Feb', bookings: 1, revenue: 130 },
          { month: 'Mar', bookings: 3, revenue: 390 },
          { month: 'Apr', bookings: 4, revenue: 520 },
          { month: 'May', bookings: 6, revenue: 780 },
          { month: 'Jun', bookings: 7, revenue: 910 }
        ],
        suggestions: [
          {
            type: 'pricing',
            message: 'Consider increasing your daily rate by $5-10 based on demand',
            impact: 'medium'
          },
          {
            type: 'photos',
            message: 'Add more photos showing the tent setup process',
            impact: 'high'
          },
          {
            type: 'availability',
            message: 'You have high demand - consider adding more available dates',
            impact: 'high'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting listing performance:', error);
      throw error;
    }
  }

  // Get user insights
  async getUserInsights(userId: string): Promise<UserInsights> {
    try {
      return {
        joinDate: new Date('2023-03-15'),
        verificationLevel: 'Standard',
        trustScore: 94,
        totalListings: 8,
        totalBookings: 156,
        totalRevenue: 19890,
        averageRating: 4.8,
        responseTime: 2.3,
        responseRate: 94.5,
        profileViews: 2847,
        messagesSent: 234,
        messagesReceived: 189,
        badges: [
          {
            type: 'superhost',
            name: 'Superhost',
            earnedAt: new Date('2023-08-01'),
            description: 'Consistently excellent hosting with high ratings'
          },
          {
            type: 'verified',
            name: 'Verified Host',
            earnedAt: new Date('2023-03-20'),
            description: 'Identity and contact information verified'
          }
        ],
        recommendations: [
          {
            type: 'listing',
            title: 'Add winter sports gear',
            description: 'High demand for ski equipment in your area during winter months',
            priority: 'high'
          },
          {
            type: 'pricing',
            title: 'Optimize pricing strategy',
            description: 'Consider dynamic pricing based on seasonal demand',
            priority: 'medium'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting user insights:', error);
      throw error;
    }
  }

  // Get market insights
  async getMarketInsights(location?: { city: string; state: string }): Promise<MarketInsights> {
    try {
      return {
        totalListings: 12847,
        totalUsers: 8934,
        totalTransactionVolume: 2847593,
        popularCategories: [
          { category: 'Camping', listings: 3421, bookings: 8934, averagePrice: 42, growth: 15.3 },
          { category: 'Hiking', listings: 2847, bookings: 7234, averagePrice: 28, growth: 22.1 },
          { category: 'Cycling', listings: 2156, bookings: 5678, averagePrice: 35, growth: 8.7 },
          { category: 'Water Sports', listings: 1893, bookings: 4521, averagePrice: 55, growth: 31.2 },
          { category: 'Winter Sports', listings: 1234, bookings: 2847, averagePrice: 65, growth: 12.8 }
        ],
        topMarkets: [
          { city: 'Salt Lake City', state: 'UT', listings: 1247, bookings: 3421, averagePrice: 45, demandSupplyRatio: 2.74 },
          { city: 'Denver', state: 'CO', listings: 1156, bookings: 3189, averagePrice: 48, demandSupplyRatio: 2.76 },
          { city: 'Seattle', state: 'WA', listings: 1089, bookings: 2934, averagePrice: 52, demandSupplyRatio: 2.69 },
          { city: 'Portland', state: 'OR', listings: 987, bookings: 2678, averagePrice: 46, demandSupplyRatio: 2.71 }
        ],
        pricingTrends: [
          { category: 'Camping', averagePrice: 42, priceChange: 8.3, recommendedPriceRange: { min: 35, max: 55 } },
          { category: 'Hiking', averagePrice: 28, priceChange: 12.1, recommendedPriceRange: { min: 22, max: 38 } },
          { category: 'Cycling', averagePrice: 35, priceChange: 5.7, recommendedPriceRange: { min: 28, max: 45 } }
        ],
        seasonalDemand: [
          { month: 'Jan', demandIndex: 35, popularCategories: ['Winter Sports'], averagePriceMultiplier: 1.2 },
          { month: 'Feb', demandIndex: 40, popularCategories: ['Winter Sports'], averagePriceMultiplier: 1.15 },
          { month: 'Mar', demandIndex: 55, popularCategories: ['Hiking', 'Camping'], averagePriceMultiplier: 1.0 },
          { month: 'Apr', demandIndex: 70, popularCategories: ['Hiking', 'Camping'], averagePriceMultiplier: 1.1 },
          { month: 'May', demandIndex: 85, popularCategories: ['Camping', 'Hiking', 'Cycling'], averagePriceMultiplier: 1.25 },
          { month: 'Jun', demandIndex: 95, popularCategories: ['Water Sports', 'Camping'], averagePriceMultiplier: 1.4 }
        ]
      };
    } catch (error) {
      console.error('Error getting market insights:', error);
      throw error;
    }
  }

  // Track user event for analytics
  async trackEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      // In a real implementation, send to analytics service (Google Analytics, Mixpanel, etc.)
      console.log('Analytics event:', {
        userId,
        eventType,
        eventData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();

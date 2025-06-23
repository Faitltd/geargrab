// Review and rating service for GearGrab
import { db } from '$lib/firebase/client';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  increment 
} from 'firebase/firestore';

export interface Review {
  id: string;
  bookingId: string;
  listingId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  revieweeId: string; // The person being reviewed (owner or renter)
  revieweeType: 'owner' | 'renter';
  
  // Ratings (1-5 scale)
  overallRating: number;
  ratings: {
    communication: number;
    condition: number;      // For gear condition
    cleanliness: number;
    accuracy: number;       // How accurate the listing was
    value: number;          // Value for money
    experience?: number;    // Overall experience (for owner reviews)
    reliability?: number;   // For renter reliability
  };
  
  // Review content
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  
  // Additional info
  wouldRecommend: boolean;
  isVerifiedBooking: boolean;
  helpfulVotes: number;
  reportCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  
  // Response from reviewee
  response?: {
    comment: string;
    createdAt: Date;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages: {
    communication: number;
    condition: number;
    cleanliness: number;
    accuracy: number;
    value: number;
  };
  recommendationRate: number; // Percentage who would recommend
}

export interface ReviewPrompt {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  otherPartyId: string;
  otherPartyName: string;
  otherPartyType: 'owner' | 'renter';
  rentalPeriod: {
    startDate: Date;
    endDate: Date;
  };
  isEligible: boolean;
  hasReviewed: boolean;
  remindersSent: number;
  lastReminderDate?: Date;
}

class ReviewService {
  // Submit a new review
  async submitReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'helpfulVotes' | 'reportCount'>): Promise<string> {
    try {
      const reviewsRef = collection(db, 'reviews');
      
      const review = {
        ...reviewData,
        helpfulVotes: 0,
        reportCount: 0,
        moderationStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(reviewsRef, review);
      
      // Update listing/user stats
      await this.updateReviewStats(reviewData.listingId, reviewData.revieweeId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  // Get reviews for a listing
  async getListingReviews(listingId: string, limitCount: number = 20): Promise<Review[]> {
    try {
      const reviewsRef = collection(db, 'reviews');
      const q = query(
        reviewsRef,
        where('listingId', '==', listingId),
        where('moderationStatus', '==', 'approved'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          response: data.response ? {
            ...data.response,
            createdAt: data.response.createdAt?.toDate()
          } : undefined
        } as Review);
      });

      return reviews;
    } catch (error) {
      console.error('Error getting listing reviews:', error);
      throw error;
    }
  }

  // Get reviews by a user
  async getUserReviews(userId: string, type: 'written' | 'received' = 'written'): Promise<Review[]> {
    try {
      const reviewsRef = collection(db, 'reviews');
      const field = type === 'written' ? 'reviewerId' : 'revieweeId';
      
      const q = query(
        reviewsRef,
        where(field, '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Review);
      });

      return reviews;
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw error;
    }
  }

  // Calculate review statistics
  async calculateReviewStats(targetId: string, type: 'listing' | 'user'): Promise<ReviewStats> {
    try {
      const reviewsRef = collection(db, 'reviews');
      const field = type === 'listing' ? 'listingId' : 'revieweeId';
      
      const q = query(
        reviewsRef,
        where(field, '==', targetId),
        where('moderationStatus', '==', 'approved')
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push(data as Review);
      });

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          categoryAverages: {
            communication: 0,
            condition: 0,
            cleanliness: 0,
            accuracy: 0,
            value: 0
          },
          recommendationRate: 0
        };
      }

      // Calculate statistics
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews;
      
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(r => {
        ratingDistribution[r.overallRating as keyof typeof ratingDistribution]++;
      });

      const categoryAverages = {
        communication: reviews.reduce((sum, r) => sum + r.ratings.communication, 0) / totalReviews,
        condition: reviews.reduce((sum, r) => sum + r.ratings.condition, 0) / totalReviews,
        cleanliness: reviews.reduce((sum, r) => sum + r.ratings.cleanliness, 0) / totalReviews,
        accuracy: reviews.reduce((sum, r) => sum + r.ratings.accuracy, 0) / totalReviews,
        value: reviews.reduce((sum, r) => sum + r.ratings.value, 0) / totalReviews
      };

      const recommendationRate = (reviews.filter(r => r.wouldRecommend).length / totalReviews) * 100;

      return {
        totalReviews,
        averageRating,
        ratingDistribution,
        categoryAverages,
        recommendationRate
      };
    } catch (error) {
      console.error('Error calculating review stats:', error);
      throw error;
    }
  }

  // Update review statistics in listing/user documents
  private async updateReviewStats(listingId: string, userId: string): Promise<void> {
    try {
      // Update listing stats
      const listingStats = await this.calculateReviewStats(listingId, 'listing');
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        reviewCount: listingStats.totalReviews,
        averageRating: listingStats.averageRating,
        lastReviewDate: serverTimestamp()
      });

      // Update user stats
      const userStats = await this.calculateReviewStats(userId, 'user');
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        reviewCount: userStats.totalReviews,
        averageRating: userStats.averageRating,
        lastReviewDate: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating review stats:', error);
    }
  }

  // Add response to review
  async addReviewResponse(reviewId: string, response: string, responderId: string): Promise<void> {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        response: {
          comment: response,
          createdAt: serverTimestamp(),
          responderId
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding review response:', error);
      throw error;
    }
  }

  // Mark review as helpful
  async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        helpfulVotes: increment(1)
      });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw error;
    }
  }

  // Report review
  async reportReview(reviewId: string, reason: string, reporterId: string): Promise<void> {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        reportCount: increment(1)
      });

      // Create report record
      const reportsRef = collection(db, 'reviewReports');
      await addDoc(reportsRef, {
        reviewId,
        reason,
        reporterId,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }

  // Get pending review prompts for a user
  async getReviewPrompts(userId: string): Promise<ReviewPrompt[]> {
    try {
      // This would typically query completed bookings that haven't been reviewed
      // For now, return sample data
      return [
        {
          bookingId: 'booking_123',
          listingId: 'listing_456',
          listingTitle: 'REI Co-op Half Dome 4 Plus Tent',
          listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
          otherPartyId: 'owner_789',
          otherPartyName: 'David Wilson',
          otherPartyType: 'owner',
          rentalPeriod: {
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-01-18')
          },
          isEligible: true,
          hasReviewed: false,
          remindersSent: 1,
          lastReminderDate: new Date('2024-01-20')
        }
      ];
    } catch (error) {
      console.error('Error getting review prompts:', error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();

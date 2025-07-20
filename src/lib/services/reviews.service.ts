// Reviews service for managing review data and statistics

import { BaseService, type QueryOptions, type PaginatedResult } from './base.service';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import type {
  ReviewData,
  ReviewStats,
  ReviewFilters,
  ReviewSubmission,
  ReviewType,
  ReviewRequest,
  UserRatingStats,
  ReviewResponse
} from '$lib/types';

export class ReviewsService extends BaseService<ReviewData> {
  constructor() {
    super('reviews');
  }

  /**
   * Get reviews for a specific listing
   */
  async getListingReviews(
    listingId: string, 
    limitCount: number = 10,
    filters?: ReviewFilters
  ): Promise<PaginatedResult<ReviewData>> {
    try {
      const options: QueryOptions = {
        filters: [
          { field: 'listingId', operator: '==', value: listingId },
          { field: 'type', operator: '==', value: 'listing' }
        ],
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: limitCount
      };

      // Apply additional filters
      if (filters?.rating && filters.rating.length > 0) {
        options.filters!.push({ field: 'rating', operator: 'in', value: filters.rating });
      }

      if (filters?.verified !== undefined) {
        options.filters!.push({ field: 'verified', operator: '==', value: filters.verified });
      }

      if (filters?.hasPhotos !== undefined) {
        if (filters.hasPhotos) {
          options.filters!.push({ field: 'photos', operator: '!=', value: null });
        }
      }

      return await this.getMany(options);
    } catch (error) {
      this.handleError(error, 'get listing reviews');
    }
  }

  /**
   * Get reviews for a specific user (as reviewee)
   */
  async getUserReviews(
    userId: string,
    type?: ReviewType,
    limitCount: number = 10
  ): Promise<PaginatedResult<ReviewData>> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'revieweeId', operator: '==', value: userId }
      ];

      if (type) {
        filters.push({ field: 'type', operator: '==', value: type });
      }

      const options: QueryOptions = {
        filters,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: limitCount
      };

      return await this.getMany(options);
    } catch (error) {
      this.handleError(error, 'get user reviews');
    }
  }

  /**
   * Calculate review statistics for a listing
   */
  async getListingReviewStats(listingId: string): Promise<ReviewStats> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('listingId', '==', listingId),
        where('type', '==', 'listing')
      );

      const querySnapshot = await getDocs(q);
      const reviews: ReviewData[] = [];
      
      querySnapshot.forEach((doc) => {
        reviews.push({
          id: doc.id,
          ...doc.data()
        } as ReviewData);
      });

      return this.calculateReviewStats(reviews);
    } catch (error) {
      this.handleError(error, 'get listing review stats');
    }
  }

  /**
   * Calculate review statistics for a user
   */
  async getUserReviewStats(userId: string, type?: ReviewType): Promise<ReviewStats> {
    try {
      const filters = [
        where('revieweeId', '==', userId)
      ];

      if (type) {
        filters.push(where('type', '==', type));
      }

      const q = query(
        collection(db, 'reviews'),
        ...filters
      );

      const querySnapshot = await getDocs(q);
      const reviews: ReviewData[] = [];
      
      querySnapshot.forEach((doc) => {
        reviews.push({
          id: doc.id,
          ...doc.data()
        } as ReviewData);
      });

      return this.calculateReviewStats(reviews);
    } catch (error) {
      this.handleError(error, 'get user review stats');
    }
  }

  /**
   * Calculate statistics from review data
   */
  private calculateReviewStats(reviews: ReviewData[]): ReviewStats {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentReviews: [],
        topTags: []
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating) as keyof typeof ratingDistribution;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    // Get recent reviews (latest 5)
    const recentReviews = reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Calculate top tags
    const tagCounts: Record<string, number> = {};
    reviews.forEach(review => {
      if (review.tags) {
        review.tags.forEach(tag => {
          tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
        });
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
        sentiment: 'neutral' as const // Would need sentiment analysis for proper classification
      }));

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      ratingDistribution,
      recentReviews,
      topTags
    };
  }

  /**
   * Submit a new review
   */
  async submitReview(reviewData: ReviewSubmission): Promise<string> {
    try {
      // Check if user has already reviewed this item
      const existingReviewQuery = query(
        collection(db, 'reviews'),
        where('reviewerId', '==', reviewData.revieweeId),
        where('listingId', '==', reviewData.listingId),
        where('type', '==', reviewData.type)
      );

      const existingReviews = await getDocs(existingReviewQuery);
      if (!existingReviews.empty) {
        throw new Error('You have already reviewed this item');
      }

      // Create review document
      const review: Omit<ReviewData, 'id' | 'createdAt' | 'updatedAt'> = {
        reviewerId: reviewData.revieweeId, // This should be the current user ID
        revieweeId: reviewData.revieweeId,
        listingId: reviewData.listingId,
        rentalId: reviewData.rentalId,
        saleId: reviewData.saleId,
        type: reviewData.type,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        photos: [], // Photos would be uploaded separately
        helpful: 0,
        reported: false,
        verified: false, // Would be set based on actual transaction verification
        tags: reviewData.tags?.map(tagName => ({ 
          id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: tagName,
          category: 'neutral' as const
        }))
      };

      return await this.create(review);
    } catch (error) {
      this.handleError(error, 'submit review');
    }
  }

  /**
   * Get a single review with reviewer details
   */
  async getReviewWithDetails(reviewId: string): Promise<ReviewData | null> {
    try {
      const review = await this.getById(reviewId);
      if (!review) return null;

      // In a real implementation, you might want to fetch reviewer details
      // from a users collection and merge them with the review data
      return review;
    } catch (error) {
      this.handleError(error, 'get review with details');
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      const review = await this.getById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      await this.update(reviewId, {
        helpful: (review.helpful || 0) + 1
      });
    } catch (error) {
      this.handleError(error, 'mark review helpful');
    }
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: string, reason: string): Promise<void> {
    try {
      await this.update(reviewId, {
        reported: true,
        reportReason: reason,
        reportedAt: serverTimestamp(),
        reportCount: increment(1)
      });
    } catch (error) {
      this.handleError(error, 'report review');
    }
  }

  /**
   * Create a review request after booking completion
   */
  async createReviewRequest(
    bookingId: string,
    rentalId: string | undefined,
    listingId: string,
    listingTitle: string,
    listingImageUrl: string | undefined,
    reviewerId: string,
    reviewerName: string,
    revieweeId: string,
    revieweeName: string,
    revieweeAvatar: string | undefined,
    type: ReviewType
  ): Promise<string> {
    try {
      const reviewRequest: Omit<ReviewRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        bookingId,
        rentalId,
        listingId,
        listingTitle,
        listingImageUrl,
        reviewerId,
        reviewerName,
        revieweeId,
        revieweeName,
        revieweeAvatar,
        type,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
        remindersSent: 0,
        completed: false
      };

      const docRef = await addDoc(collection(db, 'review_requests'), {
        ...reviewRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      this.handleError(error, 'create review request');
    }
  }

  /**
   * Get pending review requests for a user
   */
  async getPendingReviewRequests(userId: string): Promise<ReviewRequest[]> {
    try {
      const q = query(
        collection(db, 'review_requests'),
        where('reviewerId', '==', userId),
        where('completed', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const requests: ReviewRequest[] = [];

      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        } as ReviewRequest);
      });

      return requests;
    } catch (error) {
      this.handleError(error, 'get pending review requests');
    }
  }

  /**
   * Mark review request as completed
   */
  async completeReviewRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'review_requests', requestId), {
        completed: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      this.handleError(error, 'complete review request');
    }
  }

  /**
   * Get comprehensive user rating statistics
   */
  async getUserRatingStats(userId: string): Promise<UserRatingStats> {
    try {
      // Get reviews as renter
      const renterReviews = await this.getUserReviews(userId, 'renter');
      const renterData = renterReviews.data || [];

      // Get reviews as owner
      const ownerReviews = await this.getUserReviews(userId, 'owner');
      const ownerData = ownerReviews.data || [];

      // Calculate renter stats
      const renterStats = this.calculateUserStats(renterData);

      // Calculate owner stats
      const ownerStats = this.calculateUserStats(ownerData);

      // Calculate overall stats
      const allReviews = [...renterData, ...ownerData];
      const overallStats = this.calculateUserStats(allReviews);

      // Calculate response rate
      const reviewsWithResponses = allReviews.filter(review => review.response).length;
      const responseRate = allReviews.length > 0 ? (reviewsWithResponses / allReviews.length) * 100 : 0;

      return {
        asRenter: renterStats,
        asOwner: ownerStats,
        overall: {
          ...overallStats,
          responseRate: Math.round(responseRate)
        }
      };
    } catch (error) {
      this.handleError(error, 'get user rating stats');
    }
  }

  /**
   * Calculate user statistics from reviews
   */
  private calculateUserStats(reviews: ReviewData[]): { totalReviews: number; averageRating: number; recentRating: number } {
    if (reviews.length === 0) {
      return { totalReviews: 0, averageRating: 0, recentRating: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calculate recent rating (last 10 reviews)
    const recentReviews = reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const recentRating = recentReviews.length > 0
      ? recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length
      : averageRating;

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      recentRating: Math.round(recentRating * 10) / 10
    };
  }

  /**
   * Toggle helpful vote on a review
   */
  async toggleHelpfulVote(reviewId: string, userId: string): Promise<boolean> {
    try {
      const review = await this.getById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      const hasVoted = review.helpfulVotes?.includes(userId) || false;

      if (hasVoted) {
        // Remove vote
        await this.update(reviewId, {
          helpfulVotes: arrayRemove(userId),
          helpful: increment(-1)
        });
        return false;
      } else {
        // Add vote
        await this.update(reviewId, {
          helpfulVotes: arrayUnion(userId),
          helpful: increment(1)
        });
        return true;
      }
    } catch (error) {
      this.handleError(error, 'toggle helpful vote');
    }
  }

  /**
   * Add response to a review
   */
  async addReviewResponse(reviewId: string, responderId: string, comment: string): Promise<void> {
    try {
      const response: ReviewResponse = {
        id: `response_${Date.now()}`,
        responderId,
        comment,
        createdAt: serverTimestamp()
      };

      await this.update(reviewId, {
        response,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      this.handleError(error, 'add review response');
    }
  }

  /**
   * Update review response
   */
  async updateReviewResponse(reviewId: string, comment: string): Promise<void> {
    try {
      const review = await this.getById(reviewId);
      if (!review?.response) {
        throw new Error('Review response not found');
      }

      const updatedResponse = {
        ...review.response,
        comment,
        updatedAt: serverTimestamp()
      };

      await this.update(reviewId, {
        response: updatedResponse,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      this.handleError(error, 'update review response');
    }
  }

  /**
   * Delete review response
   */
  async deleteReviewResponse(reviewId: string): Promise<void> {
    try {
      await this.update(reviewId, {
        response: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      this.handleError(error, 'delete review response');
    }
  }
}

// Export singleton instance
export const reviewsService = new ReviewsService();

// Export convenience functions
export const getListingReviews = reviewsService.getListingReviews.bind(reviewsService);
export const getListingReviewStats = reviewsService.getListingReviewStats.bind(reviewsService);
export const getUserReviews = reviewsService.getUserReviews.bind(reviewsService);
export const getUserReviewStats = reviewsService.getUserReviewStats.bind(reviewsService);
export const submitReview = reviewsService.submitReview.bind(reviewsService);
export const getReviewWithDetails = reviewsService.getReviewWithDetails.bind(reviewsService);
export const markReviewHelpful = reviewsService.markReviewHelpful.bind(reviewsService);
export const reportReview = reviewsService.reportReview.bind(reviewsService);

// Export new functions
export const createReviewRequest = reviewsService.createReviewRequest.bind(reviewsService);
export const getPendingReviewRequests = reviewsService.getPendingReviewRequests.bind(reviewsService);
export const completeReviewRequest = reviewsService.completeReviewRequest.bind(reviewsService);
export const getUserRatingStats = reviewsService.getUserRatingStats.bind(reviewsService);
export const toggleHelpfulVote = reviewsService.toggleHelpfulVote.bind(reviewsService);
export const addReviewResponse = reviewsService.addReviewResponse.bind(reviewsService);
export const updateReviewResponse = reviewsService.updateReviewResponse.bind(reviewsService);
export const deleteReviewResponse = reviewsService.deleteReviewResponse.bind(reviewsService);

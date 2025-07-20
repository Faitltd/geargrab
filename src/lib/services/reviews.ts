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
  runTransaction,
  type DocumentData
} from 'firebase/firestore';
import { db } from '$lib/firebase';

// Review data interfaces
export interface Review {
  id?: string;
  listingId: string;
  listingTitle: string;
  rentalId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  recipientId: string; // The user being reviewed (owner)
  rating: number; // 1-5 stars
  comment: string;
  reviewType: 'listing' | 'user'; // Review for listing or user
  tags?: string[]; // Optional tags like 'clean', 'responsive', 'damaged'
  helpful: number; // Count of helpful votes
  reported: boolean; // If review has been reported
  verified: boolean; // If reviewer actually rented the item
  createdAt: any;
  updatedAt: any;
}

// Review statistics
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
}

// Review form data
export interface ReviewFormData {
  rating: number;
  comment: string;
  tags?: string[];
}

/**
 * Submit a review for a completed rental
 */
export const submitReview = async (
  rentalId: string,
  listingId: string,
  listingTitle: string,
  recipientId: string,
  reviewData: ReviewFormData,
  reviewerId: string,
  reviewerName: string,
  reviewerEmail: string
): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  // Validate rating
  if (reviewData.rating < 1 || reviewData.rating > 5) {
    throw new Error('Rating must be between 1 and 5 stars');
  }

  // Validate comment
  if (!reviewData.comment.trim()) {
    throw new Error('Review comment is required');
  }

  if (reviewData.comment.length > 1000) {
    throw new Error('Review comment must be less than 1000 characters');
  }

  try {
    // Check if review already exists for this rental
    const existingReviewQuery = query(
      collection(db, 'reviews'),
      where('rentalId', '==', rentalId),
      where('reviewerId', '==', reviewerId)
    );
    
    const existingReviews = await getDocs(existingReviewQuery);
    if (!existingReviews.empty) {
      throw new Error('You have already reviewed this rental');
    }

    // Create review document
    const reviewDoc: Omit<Review, 'id'> = {
      listingId,
      listingTitle,
      rentalId,
      reviewerId,
      reviewerName,
      reviewerEmail,
      recipientId,
      rating: reviewData.rating,
      comment: reviewData.comment.trim(),
      reviewType: 'listing', // For now, we're doing listing reviews
      tags: reviewData.tags || [],
      helpful: 0,
      reported: false,
      verified: true, // Since it's from a completed rental
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Use transaction to ensure consistency
    const reviewId = await runTransaction(db, async (transaction) => {
      // Add review to main reviews collection
      const reviewRef = await addDoc(collection(db, 'reviews'), reviewDoc);

      // Add review to listing's reviews subcollection
      const listingReviewRef = doc(db, 'listings', listingId, 'reviews', reviewRef.id);
      transaction.set(listingReviewRef, {
        ...reviewDoc,
        id: reviewRef.id
      });

      // Add review to recipient's received reviews
      const userReviewRef = doc(db, 'users', recipientId, 'receivedReviews', reviewRef.id);
      transaction.set(userReviewRef, {
        ...reviewDoc,
        id: reviewRef.id
      });

      // Update listing review stats
      await updateListingReviewStats(listingId, reviewData.rating, transaction);

      // Update user review stats
      await updateUserReviewStats(recipientId, reviewData.rating, transaction);

      return reviewRef.id;
    });

    return reviewId;

  } catch (error) {
    console.error('Error submitting review:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to submit review');
  }
};

/**
 * Update listing review statistics
 */
const updateListingReviewStats = async (
  listingId: string,
  newRating: number,
  transaction: any
) => {
  const listingRef = doc(db, 'listings', listingId);
  const listingDoc = await transaction.get(listingRef);
  
  if (listingDoc.exists()) {
    const listingData = listingDoc.data();
    const currentStats = listingData.reviewStats || {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    const newTotalReviews = currentStats.totalReviews + 1;
    const newAverageRating = (
      (currentStats.averageRating * currentStats.totalReviews + newRating) / 
      newTotalReviews
    );

    const newRatingDistribution = { ...currentStats.ratingDistribution };
    newRatingDistribution[newRating as keyof typeof newRatingDistribution]++;

    transaction.update(listingRef, {
      reviewStats: {
        totalReviews: newTotalReviews,
        averageRating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution: newRatingDistribution
      },
      updatedAt: serverTimestamp()
    });
  }
};

/**
 * Update user review statistics
 */
const updateUserReviewStats = async (
  userId: string,
  newRating: number,
  transaction: any
) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await transaction.get(userRef);
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const currentStats = userData.reviewStats || {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    const newTotalReviews = currentStats.totalReviews + 1;
    const newAverageRating = (
      (currentStats.averageRating * currentStats.totalReviews + newRating) / 
      newTotalReviews
    );

    const newRatingDistribution = { ...currentStats.ratingDistribution };
    newRatingDistribution[newRating as keyof typeof newRatingDistribution]++;

    transaction.update(userRef, {
      reviewStats: {
        totalReviews: newTotalReviews,
        averageRating: Math.round(newAverageRating * 10) / 10,
        ratingDistribution: newRatingDistribution
      },
      updatedAt: serverTimestamp()
    });
  }
};

/**
 * Get reviews for a listing
 */
export const getListingReviews = async (
  listingId: string,
  limitCount: number = 10
): Promise<Review[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      collection(db, 'listings', listingId, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      } as Review);
    });

    return reviews;
  } catch (error) {
    console.error('Error getting listing reviews:', error);
    throw new Error('Failed to get listing reviews');
  }
};

/**
 * Get reviews received by a user
 */
export const getUserReceivedReviews = async (
  userId: string,
  limitCount: number = 10
): Promise<Review[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      collection(db, 'users', userId, 'receivedReviews'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      } as Review);
    });

    return reviews;
  } catch (error) {
    console.error('Error getting user received reviews:', error);
    throw new Error('Failed to get user received reviews');
  }
};

/**
 * Get review statistics for a listing
 */
export const getListingReviewStats = async (listingId: string): Promise<ReviewStats | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const listingDoc = await getDoc(doc(db, 'listings', listingId));
    
    if (listingDoc.exists()) {
      const listingData = listingDoc.data();
      return listingData.reviewStats || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting listing review stats:', error);
    throw new Error('Failed to get listing review stats');
  }
};

/**
 * Get review statistics for a user
 */
export const getUserReviewStats = async (userId: string): Promise<ReviewStats | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.reviewStats || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user review stats:', error);
    throw new Error('Failed to get user review stats');
  }
};

/**
 * Check if user can review a rental
 */
export const canUserReview = async (
  rentalId: string,
  userId: string
): Promise<{ canReview: boolean; reason?: string }> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Check if rental exists and is completed
    const rentalDoc = await getDoc(doc(db, 'rentals', rentalId));
    
    if (!rentalDoc.exists()) {
      return { canReview: false, reason: 'Rental not found' };
    }

    const rentalData = rentalDoc.data();
    
    if (rentalData.renterId !== userId) {
      return { canReview: false, reason: 'You can only review rentals you participated in' };
    }

    if (rentalData.status !== 'completed') {
      return { canReview: false, reason: 'Rental must be completed before reviewing' };
    }

    // Check if review already exists
    const existingReviewQuery = query(
      collection(db, 'reviews'),
      where('rentalId', '==', rentalId),
      where('reviewerId', '==', userId)
    );
    
    const existingReviews = await getDocs(existingReviewQuery);
    if (!existingReviews.empty) {
      return { canReview: false, reason: 'You have already reviewed this rental' };
    }

    return { canReview: true };

  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return { canReview: false, reason: 'Error checking review eligibility' };
  }
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (reviewDoc.exists()) {
      const currentHelpful = reviewDoc.data().helpful || 0;
      await updateDoc(reviewRef, {
        helpful: currentHelpful + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    throw new Error('Failed to mark review as helpful');
  }
};

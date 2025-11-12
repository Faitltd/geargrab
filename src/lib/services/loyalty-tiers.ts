import { adminFirestore } from '$lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

export interface LoyaltyTier {
  id: 'bronze' | 'silver' | 'gold' | 'platinum';
  name: string;
  description: string;
  requirements: {
    minRentals: number;
    minRevenue?: number;
    minRating?: number;
    maxCancellations?: number;
  };
  benefits: {
    platformFeeReduction: number; // Percentage reduction (0.1 = 10%)
    prioritySupport: boolean;
    earlyAccess: boolean;
    badgeColor: string;
    badgeIcon: string;
    specialPerks: string[];
  };
  color: string;
  icon: string;
}

export interface OwnerMetrics {
  userId: string;
  period: string; // YYYY-MM-DD format for the week ending
  completedRentals: number;
  totalRevenue: number;
  averageRating: number;
  cancellationRate: number;
  responseTime: number; // Average hours to respond
  listingCount: number;
  newListings: number;
  disputes: number;
  positiveReviews: number;
  totalReviews: number;
}

export interface OwnerLoyaltyStatus {
  userId: string;
  currentTier: LoyaltyTier['id'];
  previousTier?: LoyaltyTier['id'];
  tierSince: Date;
  lastEvaluated: Date;
  nextEvaluation: Date;
  metrics: OwnerMetrics;
  tierHistory: Array<{
    tier: LoyaltyTier['id'];
    startDate: Date;
    endDate?: Date;
    reason: string;
  }>;
  benefits: {
    platformFeeReduction: number;
    lifetimeEarnings: number;
    totalSavings: number;
  };
}

// Define loyalty tiers
export const LOYALTY_TIERS: Record<string, LoyaltyTier> = {
  bronze: {
    id: 'bronze',
    name: 'Bronze Owner',
    description: 'Getting started with GearGrab',
    requirements: {
      minRentals: 0,
      minRating: 0
    },
    benefits: {
      platformFeeReduction: 0,
      prioritySupport: false,
      earlyAccess: false,
      badgeColor: '#CD7F32',
      badgeIcon: '🥉',
      specialPerks: ['Basic owner dashboard', 'Standard support']
    },
    color: '#CD7F32',
    icon: '🥉'
  },
  silver: {
    id: 'silver',
    name: 'Silver Owner',
    description: 'Active community member',
    requirements: {
      minRentals: 3,
      minRating: 4.0,
      maxCancellations: 0.1 // 10% max cancellation rate
    },
    benefits: {
      platformFeeReduction: 0.05, // 5% reduction
      prioritySupport: false,
      earlyAccess: false,
      badgeColor: '#C0C0C0',
      badgeIcon: '🥈',
      specialPerks: ['5% platform fee reduction', 'Enhanced analytics', 'Listing optimization tips']
    },
    color: '#C0C0C0',
    icon: '🥈'
  },
  gold: {
    id: 'gold',
    name: 'Gold Owner',
    description: 'Trusted gear provider',
    requirements: {
      minRentals: 7,
      minRating: 4.5,
      maxCancellations: 0.05 // 5% max cancellation rate
    },
    benefits: {
      platformFeeReduction: 0.10, // 10% reduction
      prioritySupport: true,
      earlyAccess: true,
      badgeColor: '#FFD700',
      badgeIcon: '🥇',
      specialPerks: [
        '10% platform fee reduction',
        'Priority customer support',
        'Early access to new features',
        'Featured listing opportunities',
        'Advanced analytics dashboard'
      ]
    },
    color: '#FFD700',
    icon: '🥇'
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Owner',
    description: 'Elite gear provider',
    requirements: {
      minRentals: 15,
      minRating: 4.8,
      maxCancellations: 0.02 // 2% max cancellation rate
    },
    benefits: {
      platformFeeReduction: 0.15, // 15% reduction
      prioritySupport: true,
      earlyAccess: true,
      badgeColor: '#E5E4E2',
      badgeIcon: '💎',
      specialPerks: [
        '15% platform fee reduction',
        'Dedicated account manager',
        'Beta feature access',
        'Premium listing placement',
        'Custom marketing support',
        'Quarterly business reviews',
        'Exclusive owner events'
      ]
    },
    color: '#E5E4E2',
    icon: '💎'
  }
};

/**
 * Calculate owner metrics for the past 30 days
 */
export async function calculateOwnerMetrics(userId: string): Promise<OwnerMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get completed bookings in the last 30 days
  const bookingsQuery = await adminFirestore
    .collection('bookings')
    .where('ownerUid', '==', userId)
    .where('status', '==', 'completed')
    .where('updatedAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    .get();

  const bookings = bookingsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Calculate metrics
  const completedRentals = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  
  // Get ratings for completed bookings
  const ratings = bookings
    .map(booking => booking.ownerRating)
    .filter(rating => rating && rating > 0);
  
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
    : 0;

  // Get cancellation data
  const cancellationsQuery = await adminFirestore
    .collection('bookings')
    .where('ownerUid', '==', userId)
    .where('status', '==', 'cancelled')
    .where('updatedAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    .get();

  const totalBookings = completedRentals + cancellationsQuery.size;
  const cancellationRate = totalBookings > 0 ? cancellationsQuery.size / totalBookings : 0;

  // Get listing count
  const listingsQuery = await adminFirestore
    .collection('listings')
    .where('ownerUid', '==', userId)
    .where('isActive', '==', true)
    .get();

  const listingCount = listingsQuery.size;

  // Get new listings in the last 30 days
  const newListingsQuery = await adminFirestore
    .collection('listings')
    .where('ownerUid', '==', userId)
    .where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    .get();

  const newListings = newListingsQuery.size;

  // Calculate review metrics
  const positiveReviews = ratings.filter(rating => rating >= 4).length;
  const totalReviews = ratings.length;

  return {
    userId,
    period: new Date().toISOString().split('T')[0],
    completedRentals,
    totalRevenue,
    averageRating,
    cancellationRate,
    responseTime: 0, // TODO: Calculate from message response times
    listingCount,
    newListings,
    disputes: 0, // TODO: Calculate from dispute records
    positiveReviews,
    totalReviews
  };
}

/**
 * Determine loyalty tier based on metrics
 */
export function calculateLoyaltyTier(metrics: OwnerMetrics): LoyaltyTier['id'] {
  const tiers = Object.values(LOYALTY_TIERS).sort((a, b) => b.requirements.minRentals - a.requirements.minRentals);

  for (const tier of tiers) {
    const meetsRentals = metrics.completedRentals >= tier.requirements.minRentals;
    const meetsRating = !tier.requirements.minRating || metrics.averageRating >= tier.requirements.minRating;
    const meetsCancellations = !tier.requirements.maxCancellations || metrics.cancellationRate <= tier.requirements.maxCancellations;

    if (meetsRentals && meetsRating && meetsCancellations) {
      return tier.id;
    }
  }

  return 'bronze'; // Default tier
}

/**
 * Update owner loyalty status
 */
export async function updateOwnerLoyaltyStatus(userId: string): Promise<OwnerLoyaltyStatus> {
  const metrics = await calculateOwnerMetrics(userId);
  const newTier = calculateLoyaltyTier(metrics);

  // Get existing loyalty status
  const loyaltyRef = adminFirestore.collection('ownerLoyalty').doc(userId);
  const loyaltyDoc = await loyaltyRef.get();
  
  let loyaltyStatus: OwnerLoyaltyStatus;
  const now = new Date();

  if (loyaltyDoc.exists) {
    const existing = loyaltyDoc.data() as OwnerLoyaltyStatus;
    const tierChanged = existing.currentTier !== newTier;

    loyaltyStatus = {
      ...existing,
      currentTier: newTier,
      previousTier: tierChanged ? existing.currentTier : existing.previousTier,
      tierSince: tierChanged ? now : existing.tierSince,
      lastEvaluated: now,
      nextEvaluation: getNextEvaluationDate(),
      metrics,
      tierHistory: tierChanged 
        ? [
            ...existing.tierHistory,
            {
              tier: newTier,
              startDate: now,
              reason: `Tier ${tierChanged ? 'upgraded' : 'maintained'} based on 30-day performance`
            }
          ]
        : existing.tierHistory,
      benefits: {
        platformFeeReduction: LOYALTY_TIERS[newTier].benefits.platformFeeReduction,
        lifetimeEarnings: existing.benefits.lifetimeEarnings + metrics.totalRevenue,
        totalSavings: existing.benefits.totalSavings + calculateTierSavings(metrics.totalRevenue, newTier)
      }
    };
  } else {
    // New loyalty status
    loyaltyStatus = {
      userId,
      currentTier: newTier,
      tierSince: now,
      lastEvaluated: now,
      nextEvaluation: getNextEvaluationDate(),
      metrics,
      tierHistory: [{
        tier: newTier,
        startDate: now,
        reason: 'Initial tier assignment'
      }],
      benefits: {
        platformFeeReduction: LOYALTY_TIERS[newTier].benefits.platformFeeReduction,
        lifetimeEarnings: metrics.totalRevenue,
        totalSavings: calculateTierSavings(metrics.totalRevenue, newTier)
      }
    };
  }

  // Save updated status
  await loyaltyRef.set({
    ...loyaltyStatus,
    tierSince: Timestamp.fromDate(loyaltyStatus.tierSince),
    lastEvaluated: Timestamp.fromDate(loyaltyStatus.lastEvaluated),
    nextEvaluation: Timestamp.fromDate(loyaltyStatus.nextEvaluation),
    tierHistory: loyaltyStatus.tierHistory.map(entry => ({
      ...entry,
      startDate: Timestamp.fromDate(entry.startDate),
      endDate: entry.endDate ? Timestamp.fromDate(entry.endDate) : null
    }))
  });

  return loyaltyStatus;
}

/**
 * Get next evaluation date (next Monday)
 */
function getNextEvaluationDate(): Date {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay() + 1) % 7);
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek;
}

/**
 * Calculate savings from tier benefits
 */
function calculateTierSavings(revenue: number, tier: LoyaltyTier['id']): number {
  const platformFeeRate = 0.15; // 15% standard platform fee
  const standardFee = revenue * platformFeeRate;
  const tierReduction = LOYALTY_TIERS[tier].benefits.platformFeeReduction;
  const discountedFee = standardFee * (1 - tierReduction);
  return standardFee - discountedFee;
}

/**
 * Get all owners due for evaluation
 */
export async function getOwnersForEvaluation(): Promise<string[]> {
  const now = Timestamp.now();
  
  // Get owners whose next evaluation is due
  const query = await adminFirestore
    .collection('ownerLoyalty')
    .where('nextEvaluation', '<=', now)
    .get();

  return query.docs.map(doc => doc.id);
}

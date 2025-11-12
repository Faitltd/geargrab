import type { RequestHandler } from "./$types";
import { json } from '@sveltejs/kit';
import { authenticateRequest } from '$lib/security/middleware';
import { adminFirestore } from '$lib/firebase/server';
import { LOYALTY_TIERS, calculateOwnerMetrics, calculateLoyaltyTier } from '$lib/services/loyalty-tiers';

export async function GET({ request, url }) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = url.searchParams.get('userId') || auth.userId;

    // Check if user can access this loyalty status
    if (userId !== auth.userId) {
      // Check if requesting user is admin
      const userDoc = await adminFirestore.collection('users').doc(auth.userId).get();
      const userData = userDoc.data();
      
      if (!userData?.isAdmin) {
        return json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get loyalty status
    const loyaltyDoc = await adminFirestore
      .collection('ownerLoyalty')
      .doc(userId)
      .get();

    if (!loyaltyDoc.exists) {
      // User doesn't have loyalty status yet, calculate it
      const metrics = await calculateOwnerMetrics(userId);
      const tier = calculateLoyaltyTier(metrics);

      return json({
        success: true,
        loyaltyStatus: {
          userId,
          currentTier: tier,
          tierSince: new Date(),
          lastEvaluated: null,
          nextEvaluation: getNextMondayDate(),
          metrics,
          tierHistory: [],
          benefits: {
            platformFeeReduction: LOYALTY_TIERS[tier].benefits.platformFeeReduction,
            lifetimeEarnings: 0,
            totalSavings: 0
          }
        },
        tierInfo: LOYALTY_TIERS[tier],
        allTiers: LOYALTY_TIERS
      });
    }

    const loyaltyData = loyaltyDoc.data();
    
    // Convert Firestore timestamps to dates
    const loyaltyStatus = {
      ...loyaltyData,
      tierSince: loyaltyData.tierSince?.toDate(),
      lastEvaluated: loyaltyData.lastEvaluated?.toDate(),
      nextEvaluation: loyaltyData.nextEvaluation?.toDate(),
      tierHistory: loyaltyData.tierHistory?.map((entry: any) => ({
        ...entry,
        startDate: entry.startDate?.toDate(),
        endDate: entry.endDate?.toDate()
      })) || []
    };

    return json({
      success: true,
      loyaltyStatus,
      tierInfo: LOYALTY_TIERS[loyaltyStatus.currentTier],
      allTiers: LOYALTY_TIERS,
      progressToNext: calculateProgressToNextTier(loyaltyStatus.metrics, loyaltyStatus.currentTier)
    });

  } catch (error) {
    console.error('Error getting loyalty status:', error);
    return json({ 
      error: 'Failed to get loyalty status',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, userId } = await request.json();

    if (action === 'refresh') {
      // Manually refresh loyalty status for a user
      const targetUserId = userId || auth.userId;

      // Check permissions
      if (targetUserId !== auth.userId) {
        const userDoc = await adminFirestore.collection('users').doc(auth.userId).get();
        const userData = userDoc.data();
        
        if (!userData?.isAdmin) {
          return json({ error: 'Admin access required' }, { status: 403 });
        }
      }

      // Update loyalty status
      const { updateOwnerLoyaltyStatus } = await import('$lib/services/loyalty-tiers');
      const updatedStatus = await updateOwnerLoyaltyStatus(targetUserId);

      return json({
        success: true,
        message: 'Loyalty status refreshed',
        loyaltyStatus: {
          ...updatedStatus,
          tierSince: updatedStatus.tierSince,
          lastEvaluated: updatedStatus.lastEvaluated,
          nextEvaluation: updatedStatus.nextEvaluation
        },
        tierInfo: LOYALTY_TIERS[updatedStatus.currentTier]
      });
    }

    return json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating loyalty status:', error);
    return json({ 
      error: 'Failed to update loyalty status',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Calculate progress towards next tier
 */
function calculateProgressToNextTier(metrics: any, currentTier: string) {
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex === tierOrder.length - 1) {
    // Already at highest tier
    return {
      nextTier: null,
      progress: 100,
      requirements: null
    };
  }

  const nextTier = tierOrder[currentIndex + 1];
  const nextTierRequirements = LOYALTY_TIERS[nextTier].requirements;

  const progress = {
    nextTier,
    requirements: nextTierRequirements,
    current: {
      rentals: metrics.completedRentals || 0,
      rating: metrics.averageRating || 0,
      cancellationRate: metrics.cancellationRate || 0
    },
    needed: {
      rentals: Math.max(0, nextTierRequirements.minRentals - (metrics.completedRentals || 0)),
      rating: nextTierRequirements.minRating ? Math.max(0, nextTierRequirements.minRating - (metrics.averageRating || 0)) : 0,
      cancellationRate: nextTierRequirements.maxCancellations ? Math.max(0, (metrics.cancellationRate || 0) - nextTierRequirements.maxCancellations) : 0
    },
    progress: 0
  };

  // Calculate overall progress percentage
  const rentalProgress = Math.min(100, (progress.current.rentals / nextTierRequirements.minRentals) * 100);
  const ratingProgress = nextTierRequirements.minRating 
    ? Math.min(100, (progress.current.rating / nextTierRequirements.minRating) * 100)
    : 100;
  const cancellationProgress = nextTierRequirements.maxCancellations
    ? Math.min(100, (1 - progress.current.cancellationRate / nextTierRequirements.maxCancellations) * 100)
    : 100;

  progress.progress = Math.min(100, (rentalProgress + ratingProgress + cancellationProgress) / 3);

  return progress;
}

/**
 * Get next Monday date
 */
function getNextMondayDate(): Date {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay() + 1) % 7);
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek;
}

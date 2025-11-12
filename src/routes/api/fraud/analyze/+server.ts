import type { RequestHandler } from "./$types";
import { json } from '@sveltejs/kit';
import { adminFirestore } from '$lib/firebase/server';
import { authenticateRequest } from '$lib/security/middleware';
import { analyzeFraudRisk, FRAUD_RULES } from '$lib/services/fraud-detection';

export async function POST({ request }) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, userId, userType, bookingData } = await request.json();

    // Validate required fields
    if (!bookingId || !userId || !userType || !bookingData) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['renter', 'owner'].includes(userType)) {
      return json({ error: 'Invalid user type' }, { status: 400 });
    }

    // Check if user has permission to analyze this booking
    const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingDoc.data();
    
    // Only allow analysis by the booking participants or admins
    if (booking.renterUid !== auth.userId && booking.ownerUid !== auth.userId) {
      const userDoc = await adminFirestore.collection('users').doc(auth.userId).get();
      const userData = userDoc.data();
      
      if (!userData?.isAdmin) {
        return json({ error: 'Access denied' }, { status: 403 });
      }
    }

    console.log(`🔍 Starting fraud analysis for booking ${bookingId}`);

    // Run fraud analysis
    const fraudScore = await analyzeFraudRisk(bookingId, userId, userType, bookingData);

    return json({
      success: true,
      fraudScore: {
        ...fraudScore,
        analysis: {
          ...fraudScore.analysis,
          analyzedAt: fraudScore.analysis.analyzedAt.toISOString()
        },
        createdAt: fraudScore.createdAt.toISOString(),
        updatedAt: fraudScore.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error analyzing fraud risk:', error);
    return json({ 
      error: 'Failed to analyze fraud risk',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET({ url, request }) {
  try {
    // Authenticate request (admin only for viewing fraud scores)
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userDoc = await adminFirestore.collection('users').doc(auth.userId).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const bookingId = url.searchParams.get('bookingId');
    const userId = url.searchParams.get('userId');
    const riskLevel = url.searchParams.get('riskLevel');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = adminFirestore.collection('fraudScores').orderBy('createdAt', 'desc');

    // Apply filters
    if (bookingId) {
      query = query.where('bookingId', '==', bookingId);
    }
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (riskLevel) {
      query = query.where('riskLevel', '==', riskLevel);
    }

    query = query.limit(limit);

    const fraudScoresSnapshot = await query.get();
    const fraudScores = fraudScoresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      analysis: {
        ...doc.data().analysis,
        analyzedAt: doc.data().analysis?.analyzedAt?.toDate()
      },
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Get fraud statistics
    const allScoresSnapshot = await adminFirestore.collection('fraudScores').get();
    const allScores = allScoresSnapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: allScores.length,
      byRiskLevel: allScores.reduce((acc, score) => {
        acc[score.riskLevel] = (acc[score.riskLevel] || 0) + 1;
        return acc;
      }, {}),
      byUserType: allScores.reduce((acc, score) => {
        acc[score.userType] = (acc[score.userType] || 0) + 1;
        return acc;
      }, {}),
      averageScore: allScores.length > 0 
        ? allScores.reduce((sum, score) => sum + score.totalScore, 0) / allScores.length 
        : 0,
      flaggedBookings: allScores.filter(score => score.actions?.flagged).length,
      blockedBookings: allScores.filter(score => score.actions?.blocked).length,
      last24Hours: allScores.filter(score => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return score.createdAt?.toDate() > dayAgo;
      }).length
    };

    // Get most common fraud signals
    const signalCounts = {};
    allScores.forEach(score => {
      score.signals?.forEach(signal => {
        signalCounts[signal.type] = (signalCounts[signal.type] || 0) + 1;
      });
    });

    const topSignals = Object.entries(signalCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    return json({
      success: true,
      data: {
        fraudScores,
        stats,
        topSignals,
        rules: FRAUD_RULES
      }
    });

  } catch (error) {
    console.error('Error getting fraud scores:', error);
    return json({ 
      error: 'Failed to get fraud scores',
      details: error.message 
    }, { status: 500 });
  }
}

// Update fraud score (admin only)
export async function PATCH({ request }) {
  try {
    // Authenticate request (admin only)
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userDoc = await adminFirestore.collection('users').doc(auth.userId).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const { fraudScoreId, action, notes } = await request.json();

    if (!fraudScoreId || !action) {
      return json({ error: 'Fraud score ID and action are required' }, { status: 400 });
    }

    const fraudScoreDoc = await adminFirestore.collection('fraudScores').doc(fraudScoreId).get();
    
    if (!fraudScoreDoc.exists) {
      return json({ error: 'Fraud score not found' }, { status: 404 });
    }

    const fraudScore = fraudScoreDoc.data();
    const now = adminFirestore.Timestamp.now();

    let updateData: any = {
      updatedAt: now
    };

    switch (action) {
      case 'approve':
        // Override fraud detection - allow booking
        updateData['actions.flagged'] = false;
        updateData['actions.blocked'] = false;
        updateData['actions.requiresReview'] = false;
        updateData.adminOverride = {
          action: 'approved',
          adminId: auth.userId,
          notes: notes || 'Manually approved by admin',
          timestamp: now
        };
        
        // Update booking status if it was blocked
        if (fraudScore.actions?.blocked) {
          await adminFirestore.collection('bookings').doc(fraudScore.bookingId).update({
            status: 'confirmed', // Or appropriate status
            fraudScore: fraudScore.totalScore,
            adminApproved: true,
            updatedAt: now
          });
        }
        break;

      case 'block':
        // Block the booking
        updateData['actions.flagged'] = true;
        updateData['actions.blocked'] = true;
        updateData['actions.requiresReview'] = false;
        updateData.adminOverride = {
          action: 'blocked',
          adminId: auth.userId,
          notes: notes || 'Manually blocked by admin',
          timestamp: now
        };
        
        // Update booking status
        await adminFirestore.collection('bookings').doc(fraudScore.bookingId).update({
          status: 'blocked_fraud',
          fraudScore: fraudScore.totalScore,
          adminBlocked: true,
          updatedAt: now
        });
        break;

      case 'flag':
        // Flag for further review
        updateData['actions.flagged'] = true;
        updateData['actions.requiresReview'] = true;
        updateData.adminOverride = {
          action: 'flagged',
          adminId: auth.userId,
          notes: notes || 'Flagged for review by admin',
          timestamp: now
        };
        break;

      case 'clear':
        // Clear all flags
        updateData['actions.flagged'] = false;
        updateData['actions.blocked'] = false;
        updateData['actions.requiresReview'] = false;
        updateData.adminOverride = {
          action: 'cleared',
          adminId: auth.userId,
          notes: notes || 'Cleared by admin',
          timestamp: now
        };
        break;

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the fraud score
    await adminFirestore.collection('fraudScores').doc(fraudScoreId).update(updateData);

    // Log the admin action
    await adminFirestore.collection('fraudLogs').add({
      type: 'admin_action',
      fraudScoreId,
      bookingId: fraudScore.bookingId,
      userId: fraudScore.userId,
      action,
      adminId: auth.userId,
      notes: notes || null,
      timestamp: now
    });

    return json({
      success: true,
      message: `Fraud score ${action}d successfully`,
      fraudScoreId
    });

  } catch (error) {
    console.error('Error updating fraud score:', error);
    return json({ 
      error: 'Failed to update fraud score',
      details: error.message 
    }, { status: 500 });
  }
}

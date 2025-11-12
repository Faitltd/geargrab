import { adminFirestore } from '$lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

export interface RefundTrigger {
  type: 'no_response' | 'no_show' | 'cancelled_late' | 'unresponsive_during_rental';
  description: string;
  timeoutHours: number;
  refundPercentage: number;
  requiresManualReview: boolean;
}

export interface AutoRefundCase {
  id: string;
  bookingId: string;
  renterId: string;
  ownerId: string;
  gearTitle: string;
  totalAmount: number;
  refundAmount: number;
  
  trigger: RefundTrigger;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  timeline: Array<{
    timestamp: Date;
    event: string;
    description: string;
    actor?: string;
    metadata?: any;
  }>;
  
  // Detection details
  detection: {
    detectedAt: Date;
    triggerEvent: string;
    lastOwnerActivity?: Date;
    responseDeadline: Date;
    evidenceData: any;
  };
  
  // Refund processing
  refund: {
    initiatedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    stripeRefundId?: string;
    failureReason?: string;
    processingNotes?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Refund trigger configurations
export const REFUND_TRIGGERS: Record<string, RefundTrigger> = {
  no_initial_response: {
    type: 'no_response',
    description: 'Owner did not respond to booking request within 24 hours',
    timeoutHours: 24,
    refundPercentage: 1.0, // 100% refund
    requiresManualReview: false
  },
  
  no_show_pickup: {
    type: 'no_show',
    description: 'Owner did not show up for scheduled pickup',
    timeoutHours: 2, // 2 hours past scheduled time
    refundPercentage: 1.0, // 100% refund
    requiresManualReview: false
  },
  
  no_show_delivery: {
    type: 'no_show',
    description: 'Owner did not deliver gear as scheduled',
    timeoutHours: 2, // 2 hours past scheduled time
    refundPercentage: 1.0, // 100% refund
    requiresManualReview: false
  },
  
  unresponsive_during_rental: {
    type: 'unresponsive_during_rental',
    description: 'Owner became unresponsive during active rental period',
    timeoutHours: 12, // 12 hours for urgent issues
    refundPercentage: 0.5, // 50% refund (partial rental completed)
    requiresManualReview: true
  },
  
  late_cancellation_by_owner: {
    type: 'cancelled_late',
    description: 'Owner cancelled within 24 hours of rental start',
    timeoutHours: 0, // Immediate
    refundPercentage: 1.0, // 100% refund + compensation
    requiresManualReview: false
  }
};

/**
 * Monitor bookings for auto-refund triggers
 */
export async function monitorBookingsForRefunds(): Promise<{
  checked: number;
  triggered: number;
  cases: string[];
}> {
  console.log('🔍 Starting auto-refund monitoring...');
  
  const results = {
    checked: 0,
    triggered: 0,
    cases: [] as string[]
  };

  // Get bookings that might need refunds
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Check for unresponded booking requests
  await checkUnrespondedBookings(results, twentyFourHoursAgo);
  
  // Check for no-show situations
  await checkNoShowSituations(results, now);
  
  // Check for unresponsive owners during rentals
  await checkUnresponsiveDuringRentals(results, now);
  
  // Check for late cancellations by owners
  await checkLateCancellations(results, now);
  
  console.log(`✅ Auto-refund monitoring complete: ${results.triggered} cases triggered from ${results.checked} bookings`);
  
  return results;
}

/**
 * Check for booking requests that haven't been responded to
 */
async function checkUnrespondedBookings(results: any, cutoffTime: Date) {
  const bookingsQuery = await adminFirestore
    .collection('bookings')
    .where('status', '==', 'pending')
    .where('createdAt', '<=', Timestamp.fromDate(cutoffTime))
    .get();

  for (const doc of bookingsQuery.docs) {
    results.checked++;
    const booking = { id: doc.id, ...doc.data() };
    
    // Check if owner has responded
    const messagesQuery = await adminFirestore
      .collection('messages')
      .where('bookingId', '==', booking.id)
      .where('senderId', '==', booking.ownerUid)
      .limit(1)
      .get();
    
    if (messagesQuery.empty) {
      // No response from owner, trigger refund
      const caseId = await createAutoRefundCase(
        booking,
        REFUND_TRIGGERS.no_initial_response,
        'no_owner_response_24h',
        { lastChecked: new Date() }
      );
      
      results.triggered++;
      results.cases.push(caseId);
    }
  }
}

/**
 * Check for no-show situations
 */
async function checkNoShowSituations(results: any, now: Date) {
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  // Check confirmed bookings where pickup/delivery time has passed
  const bookingsQuery = await adminFirestore
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .where('startDate', '<=', Timestamp.fromDate(twoHoursAgo))
    .get();

  for (const doc of bookingsQuery.docs) {
    results.checked++;
    const booking = { id: doc.id, ...doc.data() };
    
    // Check if gear was actually picked up/delivered
    const pickupConfirmed = booking.pickupConfirmed || false;
    const deliveryConfirmed = booking.deliveryConfirmed || false;
    
    if (!pickupConfirmed && !deliveryConfirmed) {
      // No pickup/delivery confirmed, check for no-show
      const trigger = booking.deliveryMethod === 'delivery' 
        ? REFUND_TRIGGERS.no_show_delivery 
        : REFUND_TRIGGERS.no_show_pickup;
      
      const caseId = await createAutoRefundCase(
        booking,
        trigger,
        'no_show_detected',
        { 
          scheduledTime: booking.startDate,
          deliveryMethod: booking.deliveryMethod,
          hoursOverdue: Math.floor((now.getTime() - booking.startDate.toDate().getTime()) / (1000 * 60 * 60))
        }
      );
      
      results.triggered++;
      results.cases.push(caseId);
    }
  }
}

/**
 * Check for owners who become unresponsive during rentals
 */
async function checkUnresponsiveDuringRentals(results: any, now: Date) {
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  
  // Check active rentals with unresolved issues
  const bookingsQuery = await adminFirestore
    .collection('bookings')
    .where('status', '==', 'active')
    .get();

  for (const doc of bookingsQuery.docs) {
    results.checked++;
    const booking = { id: doc.id, ...doc.data() };
    
    // Check for unresolved issues or urgent messages
    const issuesQuery = await adminFirestore
      .collection('rentalIssues')
      .where('bookingId', '==', booking.id)
      .where('status', '==', 'open')
      .where('priority', 'in', ['high', 'urgent'])
      .where('createdAt', '<=', Timestamp.fromDate(twelveHoursAgo))
      .get();
    
    if (!issuesQuery.empty) {
      // Check if owner has responded to any issues
      const lastOwnerMessage = await getLastOwnerMessage(booking.id, booking.ownerUid);
      
      if (!lastOwnerMessage || lastOwnerMessage.timestamp < twelveHoursAgo) {
        const caseId = await createAutoRefundCase(
          booking,
          REFUND_TRIGGERS.unresponsive_during_rental,
          'unresponsive_to_urgent_issue',
          { 
            issueCount: issuesQuery.size,
            lastOwnerActivity: lastOwnerMessage?.timestamp,
            urgentIssues: issuesQuery.docs.map(doc => doc.data().description)
          }
        );
        
        results.triggered++;
        results.cases.push(caseId);
      }
    }
  }
}

/**
 * Check for late cancellations by owners
 */
async function checkLateCancellations(results: any, now: Date) {
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  // Check for recent cancellations by owners within 24 hours of start
  const bookingsQuery = await adminFirestore
    .collection('bookings')
    .where('status', '==', 'cancelled')
    .where('cancelledBy', '==', 'owner')
    .where('startDate', '<=', Timestamp.fromDate(oneDayFromNow))
    .where('cancelledAt', '>=', Timestamp.fromDate(new Date(now.getTime() - 60 * 60 * 1000))) // Last hour
    .get();

  for (const doc of bookingsQuery.docs) {
    results.checked++;
    const booking = { id: doc.id, ...doc.data() };
    
    const hoursUntilStart = (booking.startDate.toDate().getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilStart <= 24) {
      const caseId = await createAutoRefundCase(
        booking,
        REFUND_TRIGGERS.late_cancellation_by_owner,
        'owner_cancelled_within_24h',
        { 
          hoursUntilStart,
          cancellationReason: booking.cancellationReason || 'No reason provided'
        }
      );
      
      results.triggered++;
      results.cases.push(caseId);
    }
  }
}

/**
 * Create an auto-refund case
 */
async function createAutoRefundCase(
  booking: any,
  trigger: RefundTrigger,
  triggerEvent: string,
  evidenceData: any
): Promise<string> {
  const caseId = adminFirestore.collection('autoRefundCases').doc().id;
  const now = new Date();
  
  const refundAmount = Math.round(booking.totalPrice * trigger.refundPercentage);
  
  const autoRefundCase: Omit<AutoRefundCase, 'id'> = {
    bookingId: booking.id,
    renterId: booking.renterUid,
    ownerId: booking.ownerUid,
    gearTitle: booking.gearTitle || 'Unknown Item',
    totalAmount: booking.totalPrice,
    refundAmount,
    
    trigger,
    status: trigger.requiresManualReview ? 'pending' : 'processing',
    
    timeline: [{
      timestamp: now,
      event: 'case_created',
      description: `Auto-refund case created: ${trigger.description}`,
      metadata: { triggerEvent, evidenceData }
    }],
    
    detection: {
      detectedAt: now,
      triggerEvent,
      responseDeadline: new Date(now.getTime() + trigger.timeoutHours * 60 * 60 * 1000),
      evidenceData
    },
    
    refund: {},
    
    createdAt: now,
    updatedAt: now
  };
  
  // Save the case
  await adminFirestore.collection('autoRefundCases').doc(caseId).set({
    ...autoRefundCase,
    detection: {
      ...autoRefundCase.detection,
      detectedAt: Timestamp.fromDate(autoRefundCase.detection.detectedAt),
      responseDeadline: Timestamp.fromDate(autoRefundCase.detection.responseDeadline)
    },
    timeline: autoRefundCase.timeline.map(entry => ({
      ...entry,
      timestamp: Timestamp.fromDate(entry.timestamp)
    })),
    createdAt: Timestamp.fromDate(autoRefundCase.createdAt),
    updatedAt: Timestamp.fromDate(autoRefundCase.updatedAt)
  });
  
  // Create notifications
  await createRefundNotifications(caseId, autoRefundCase);
  
  // If no manual review required, start processing immediately
  if (!trigger.requiresManualReview) {
    await processAutoRefund(caseId);
  }
  
  console.log(`💰 Auto-refund case ${caseId} created for booking ${booking.id}: ${trigger.description}`);
  
  return caseId;
}

/**
 * Process an auto-refund
 */
async function processAutoRefund(caseId: string): Promise<void> {
  try {
    const caseDoc = await adminFirestore.collection('autoRefundCases').doc(caseId).get();
    
    if (!caseDoc.exists) {
      throw new Error('Auto-refund case not found');
    }
    
    const refundCase = caseDoc.data() as AutoRefundCase;
    
    // Update status to processing
    await adminFirestore.collection('autoRefundCases').doc(caseId).update({
      status: 'processing',
      'refund.initiatedAt': Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // In production, this would call Stripe to process the refund
    // For now, we'll simulate the refund process
    const mockStripeRefundId = `re_${Date.now()}`;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update booking status
    await adminFirestore.collection('bookings').doc(refundCase.bookingId).update({
      status: 'refunded',
      refundAmount: refundCase.refundAmount,
      refundReason: refundCase.trigger.description,
      refundedAt: Timestamp.now(),
      autoRefundCaseId: caseId,
      updatedAt: Timestamp.now()
    });
    
    // Complete the refund case
    await adminFirestore.collection('autoRefundCases').doc(caseId).update({
      status: 'completed',
      'refund.completedAt': Timestamp.now(),
      'refund.stripeRefundId': mockStripeRefundId,
      'refund.processingNotes': 'Automatic refund processed successfully',
      updatedAt: Timestamp.now()
    });
    
    console.log(`✅ Auto-refund ${caseId} processed successfully: $${refundCase.refundAmount}`);
    
  } catch (error) {
    console.error(`❌ Error processing auto-refund ${caseId}:`, error);
    
    // Mark as failed
    await adminFirestore.collection('autoRefundCases').doc(caseId).update({
      status: 'failed',
      'refund.failedAt': Timestamp.now(),
      'refund.failureReason': error.message,
      updatedAt: Timestamp.now()
    });
  }
}

/**
 * Create notifications for refund case
 */
async function createRefundNotifications(caseId: string, refundCase: AutoRefundCase): Promise<void> {
  // Notify renter
  await adminFirestore.collection('notifications').add({
    userId: refundCase.renterId,
    type: 'auto_refund_initiated',
    title: 'Automatic Refund Initiated',
    message: `We've initiated a refund for your booking due to owner unresponsiveness.`,
    data: {
      caseId,
      bookingId: refundCase.bookingId,
      refundAmount: refundCase.refundAmount,
      reason: refundCase.trigger.description
    },
    createdAt: Timestamp.now(),
    read: false
  });
  
  // Notify owner
  await adminFirestore.collection('notifications').add({
    userId: refundCase.ownerId,
    type: 'auto_refund_warning',
    title: 'Automatic Refund Processed',
    message: `A refund has been issued due to unresponsiveness. Please check your account.`,
    data: {
      caseId,
      bookingId: refundCase.bookingId,
      refundAmount: refundCase.refundAmount,
      reason: refundCase.trigger.description
    },
    createdAt: Timestamp.now(),
    read: false
  });
  
  // Notify admins
  await adminFirestore.collection('adminNotifications').add({
    type: 'auto_refund_case',
    title: 'Auto-Refund Case Created',
    message: `${refundCase.trigger.description} - $${refundCase.refundAmount} refund`,
    data: {
      caseId,
      bookingId: refundCase.bookingId,
      trigger: refundCase.trigger.type,
      requiresReview: refundCase.trigger.requiresManualReview
    },
    createdAt: Timestamp.now(),
    read: false
  });
}

/**
 * Get last message from owner
 */
async function getLastOwnerMessage(bookingId: string, ownerUid: string): Promise<{ timestamp: Date } | null> {
  const messagesQuery = await adminFirestore
    .collection('messages')
    .where('bookingId', '==', bookingId)
    .where('senderId', '==', ownerUid)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  
  if (messagesQuery.empty) {
    return null;
  }
  
  const message = messagesQuery.docs[0].data();
  return {
    timestamp: message.createdAt.toDate()
  };
}

import { adminFirestore } from '$lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

export interface FraudSignal {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  description: string;
  evidence: any;
  weight: number; // Multiplier for final score
}

export interface FraudScore {
  bookingId: string;
  userId: string;
  userType: 'renter' | 'owner';
  
  // Overall scoring
  totalScore: number; // 0-100 (higher = more suspicious)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1 (how confident we are in the score)
  
  // Individual signals
  signals: FraudSignal[];
  
  // Analysis metadata
  analysis: {
    analyzedAt: Date;
    modelVersion: string;
    dataPoints: number;
    processingTime: number;
  };
  
  // Actions taken
  actions: {
    flagged: boolean;
    blocked: boolean;
    requiresReview: boolean;
    notificationsTriggered: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Fraud detection rules and weights
export const FRAUD_RULES = {
  // User behavior patterns
  rapid_bookings: {
    weight: 0.8,
    threshold: 5, // 5+ bookings in 1 hour
    severity: 'high' as const,
    description: 'Unusually rapid booking pattern detected'
  },
  
  new_user_high_value: {
    weight: 0.6,
    threshold: 500, // $500+ booking for user <7 days old
    severity: 'medium' as const,
    description: 'New user attempting high-value booking'
  },
  
  multiple_failed_payments: {
    weight: 0.9,
    threshold: 3, // 3+ failed payments in 24h
    severity: 'high' as const,
    description: 'Multiple failed payment attempts'
  },
  
  velocity_anomaly: {
    weight: 0.7,
    threshold: 10, // 10x normal booking velocity
    severity: 'medium' as const,
    description: 'Booking velocity significantly above normal'
  },
  
  // Geographic patterns
  impossible_travel: {
    weight: 0.9,
    threshold: 500, // 500+ miles in <2 hours
    severity: 'critical' as const,
    description: 'Impossible travel pattern detected'
  },
  
  vpn_or_proxy: {
    weight: 0.5,
    threshold: 0.8, // 80% confidence VPN/proxy
    severity: 'low' as const,
    description: 'VPN or proxy usage detected'
  },
  
  // Device and session patterns
  device_fingerprint_mismatch: {
    weight: 0.6,
    threshold: 0.7, // 70% different from previous sessions
    severity: 'medium' as const,
    description: 'Device fingerprint inconsistency'
  },
  
  suspicious_user_agent: {
    weight: 0.4,
    threshold: 1, // Known bot/scraper user agents
    severity: 'low' as const,
    description: 'Suspicious browser or automated tool detected'
  },
  
  // Communication patterns
  copy_paste_messages: {
    weight: 0.5,
    threshold: 0.9, // 90% similarity to other messages
    severity: 'medium' as const,
    description: 'Copy-paste or template messages detected'
  },
  
  no_profile_interaction: {
    weight: 0.3,
    threshold: 1, // No profile views before booking
    severity: 'low' as const,
    description: 'No profile or gear research before booking'
  },
  
  // Financial patterns
  payment_method_cycling: {
    weight: 0.8,
    threshold: 3, // 3+ different payment methods in 24h
    severity: 'high' as const,
    description: 'Rapid cycling through payment methods'
  },
  
  chargeback_history: {
    weight: 0.9,
    threshold: 1, // Any chargeback history
    severity: 'high' as const,
    description: 'Previous chargeback or dispute history'
  }
};

/**
 * Analyze a booking for fraud signals
 */
export async function analyzeFraudRisk(
  bookingId: string,
  userId: string,
  userType: 'renter' | 'owner',
  bookingData: any
): Promise<FraudScore> {
  const startTime = Date.now();
  console.log(`🔍 Starting fraud analysis for booking ${bookingId} by ${userType} ${userId}`);
  
  const signals: FraudSignal[] = [];
  
  // Gather user data for analysis
  const userData = await gatherUserData(userId);
  const sessionData = await gatherSessionData(userId);
  const bookingHistory = await gatherBookingHistory(userId);
  
  // Run fraud detection rules
  await Promise.all([
    checkRapidBookings(signals, userId, bookingHistory),
    checkNewUserHighValue(signals, userData, bookingData),
    checkPaymentPatterns(signals, userId),
    checkGeographicPatterns(signals, sessionData, bookingData),
    checkDevicePatterns(signals, sessionData),
    checkCommunicationPatterns(signals, userId, bookingId),
    checkFinancialPatterns(signals, userId)
  ]);
  
  // Calculate overall score
  const totalScore = calculateFraudScore(signals);
  const riskLevel = determineRiskLevel(totalScore);
  const confidence = calculateConfidence(signals);
  
  // Determine actions
  const actions = determineActions(totalScore, riskLevel, signals);
  
  const fraudScore: FraudScore = {
    bookingId,
    userId,
    userType,
    totalScore,
    riskLevel,
    confidence,
    signals,
    analysis: {
      analyzedAt: new Date(),
      modelVersion: '1.0.0',
      dataPoints: signals.length,
      processingTime: Date.now() - startTime
    },
    actions,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Save fraud score
  await saveFraudScore(fraudScore);
  
  // Execute actions
  if (actions.flagged || actions.blocked) {
    await executeFraudActions(fraudScore);
  }
  
  console.log(`✅ Fraud analysis complete: ${totalScore}/100 (${riskLevel}) for booking ${bookingId}`);
  
  return fraudScore;
}

/**
 * Check for rapid booking patterns
 */
async function checkRapidBookings(signals: FraudSignal[], userId: string, bookingHistory: any[]) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentBookings = bookingHistory.filter(b => b.createdAt > oneHourAgo);
  
  if (recentBookings.length >= FRAUD_RULES.rapid_bookings.threshold) {
    signals.push({
      type: 'rapid_bookings',
      severity: FRAUD_RULES.rapid_bookings.severity,
      score: Math.min(100, recentBookings.length * 15), // 15 points per booking
      description: `${recentBookings.length} bookings in the last hour`,
      evidence: { recentBookings: recentBookings.length, timeWindow: '1 hour' },
      weight: FRAUD_RULES.rapid_bookings.weight
    });
  }
}

/**
 * Check for new users making high-value bookings
 */
async function checkNewUserHighValue(signals: FraudSignal[], userData: any, bookingData: any) {
  const accountAge = Date.now() - userData.createdAt.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  if (accountAge < sevenDays && bookingData.totalPrice >= FRAUD_RULES.new_user_high_value.threshold) {
    const score = Math.min(100, (bookingData.totalPrice / 100) + (sevenDays - accountAge) / (24 * 60 * 60 * 1000));
    
    signals.push({
      type: 'new_user_high_value',
      severity: FRAUD_RULES.new_user_high_value.severity,
      score,
      description: `New user (${Math.floor(accountAge / (24 * 60 * 60 * 1000))} days old) booking $${bookingData.totalPrice} item`,
      evidence: { 
        accountAgeDays: Math.floor(accountAge / (24 * 60 * 60 * 1000)),
        bookingValue: bookingData.totalPrice 
      },
      weight: FRAUD_RULES.new_user_high_value.weight
    });
  }
}

/**
 * Check payment patterns
 */
async function checkPaymentPatterns(signals: FraudSignal[], userId: string) {
  // Check for failed payments in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const failedPaymentsQuery = await adminFirestore
    .collection('paymentAttempts')
    .where('userId', '==', userId)
    .where('status', '==', 'failed')
    .where('createdAt', '>=', Timestamp.fromDate(oneDayAgo))
    .get();
  
  if (failedPaymentsQuery.size >= FRAUD_RULES.multiple_failed_payments.threshold) {
    signals.push({
      type: 'multiple_failed_payments',
      severity: FRAUD_RULES.multiple_failed_payments.severity,
      score: failedPaymentsQuery.size * 25, // 25 points per failed payment
      description: `${failedPaymentsQuery.size} failed payment attempts in 24 hours`,
      evidence: { failedPayments: failedPaymentsQuery.size, timeWindow: '24 hours' },
      weight: FRAUD_RULES.multiple_failed_payments.weight
    });
  }
}

/**
 * Check geographic patterns
 */
async function checkGeographicPatterns(signals: FraudSignal[], sessionData: any, bookingData: any) {
  // Check for impossible travel (simplified)
  if (sessionData.previousLocation && sessionData.currentLocation) {
    const distance = calculateDistance(
      sessionData.previousLocation,
      sessionData.currentLocation
    );
    const timeDiff = sessionData.currentSession.createdAt - sessionData.previousSession.createdAt;
    const hoursElapsed = timeDiff / (1000 * 60 * 60);
    
    if (distance > FRAUD_RULES.impossible_travel.threshold && hoursElapsed < 2) {
      signals.push({
        type: 'impossible_travel',
        severity: FRAUD_RULES.impossible_travel.severity,
        score: Math.min(100, distance / 10), // Scale based on distance
        description: `${distance} miles traveled in ${hoursElapsed.toFixed(1)} hours`,
        evidence: { distance, hoursElapsed, locations: [sessionData.previousLocation, sessionData.currentLocation] },
        weight: FRAUD_RULES.impossible_travel.weight
      });
    }
  }
  
  // Check for VPN/Proxy usage (simplified)
  if (sessionData.vpnProbability > FRAUD_RULES.vpn_or_proxy.threshold) {
    signals.push({
      type: 'vpn_or_proxy',
      severity: FRAUD_RULES.vpn_or_proxy.severity,
      score: sessionData.vpnProbability * 100,
      description: `High probability of VPN/proxy usage (${(sessionData.vpnProbability * 100).toFixed(0)}%)`,
      evidence: { vpnProbability: sessionData.vpnProbability },
      weight: FRAUD_RULES.vpn_or_proxy.weight
    });
  }
}

/**
 * Check device and session patterns
 */
async function checkDevicePatterns(signals: FraudSignal[], sessionData: any) {
  // Check device fingerprint consistency
  if (sessionData.fingerprintSimilarity < (1 - FRAUD_RULES.device_fingerprint_mismatch.threshold)) {
    signals.push({
      type: 'device_fingerprint_mismatch',
      severity: FRAUD_RULES.device_fingerprint_mismatch.severity,
      score: (1 - sessionData.fingerprintSimilarity) * 100,
      description: `Device fingerprint ${((1 - sessionData.fingerprintSimilarity) * 100).toFixed(0)}% different from previous sessions`,
      evidence: { fingerprintSimilarity: sessionData.fingerprintSimilarity },
      weight: FRAUD_RULES.device_fingerprint_mismatch.weight
    });
  }
  
  // Check for suspicious user agents
  if (sessionData.suspiciousUserAgent) {
    signals.push({
      type: 'suspicious_user_agent',
      severity: FRAUD_RULES.suspicious_user_agent.severity,
      score: 60,
      description: 'Suspicious browser or automated tool detected',
      evidence: { userAgent: sessionData.userAgent },
      weight: FRAUD_RULES.suspicious_user_agent.weight
    });
  }
}

/**
 * Check communication patterns
 */
async function checkCommunicationPatterns(signals: FraudSignal[], userId: string, bookingId: string) {
  // Check for copy-paste messages (simplified)
  const messagesQuery = await adminFirestore
    .collection('messages')
    .where('senderId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  if (messagesQuery.size >= 2) {
    const messages = messagesQuery.docs.map(doc => doc.data().content);
    const similarity = calculateMessageSimilarity(messages);
    
    if (similarity > FRAUD_RULES.copy_paste_messages.threshold) {
      signals.push({
        type: 'copy_paste_messages',
        severity: FRAUD_RULES.copy_paste_messages.severity,
        score: similarity * 100,
        description: `${(similarity * 100).toFixed(0)}% similarity in recent messages`,
        evidence: { messageSimilarity: similarity, messageCount: messages.length },
        weight: FRAUD_RULES.copy_paste_messages.weight
      });
    }
  }
}

/**
 * Check financial patterns
 */
async function checkFinancialPatterns(signals: FraudSignal[], userId: string) {
  // Check for payment method cycling
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const paymentMethodsQuery = await adminFirestore
    .collection('paymentMethods')
    .where('userId', '==', userId)
    .where('createdAt', '>=', Timestamp.fromDate(oneDayAgo))
    .get();
  
  if (paymentMethodsQuery.size >= FRAUD_RULES.payment_method_cycling.threshold) {
    signals.push({
      type: 'payment_method_cycling',
      severity: FRAUD_RULES.payment_method_cycling.severity,
      score: paymentMethodsQuery.size * 20, // 20 points per payment method
      description: `${paymentMethodsQuery.size} different payment methods added in 24 hours`,
      evidence: { paymentMethods: paymentMethodsQuery.size, timeWindow: '24 hours' },
      weight: FRAUD_RULES.payment_method_cycling.weight
    });
  }
}

/**
 * Calculate overall fraud score
 */
function calculateFraudScore(signals: FraudSignal[]): number {
  if (signals.length === 0) return 0;
  
  const weightedSum = signals.reduce((sum, signal) => {
    return sum + (signal.score * signal.weight);
  }, 0);
  
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  
  return Math.min(100, Math.round(weightedSum / Math.max(totalWeight, 1)));
}

/**
 * Determine risk level based on score
 */
function determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * Calculate confidence in the score
 */
function calculateConfidence(signals: FraudSignal[]): number {
  if (signals.length === 0) return 0.5; // Neutral confidence with no signals
  
  const highConfidenceSignals = signals.filter(s => s.severity === 'high' || s.severity === 'critical').length;
  const totalSignals = signals.length;
  
  return Math.min(1, 0.3 + (highConfidenceSignals / totalSignals) * 0.7);
}

/**
 * Determine what actions to take
 */
function determineActions(score: number, riskLevel: string, signals: FraudSignal[]) {
  const actions = {
    flagged: false,
    blocked: false,
    requiresReview: false,
    notificationsTriggered: [] as string[]
  };
  
  if (score >= 80 || riskLevel === 'critical') {
    actions.blocked = true;
    actions.flagged = true;
    actions.requiresReview = true;
    actions.notificationsTriggered.push('admin_critical_fraud');
  } else if (score >= 60 || riskLevel === 'high') {
    actions.flagged = true;
    actions.requiresReview = true;
    actions.notificationsTriggered.push('admin_high_fraud');
  } else if (score >= 30 || riskLevel === 'medium') {
    actions.flagged = true;
    actions.notificationsTriggered.push('admin_medium_fraud');
  }
  
  return actions;
}

// Helper functions (simplified implementations)
async function gatherUserData(userId: string) {
  const userDoc = await adminFirestore.collection('users').doc(userId).get();
  return userDoc.exists ? { ...userDoc.data(), createdAt: userDoc.data()?.createdAt?.toDate() } : {};
}

async function gatherSessionData(userId: string) {
  // Simplified session data gathering
  return {
    currentLocation: { lat: 39.7392, lng: -104.9903 }, // Denver
    previousLocation: null,
    vpnProbability: Math.random() * 0.3, // Random low probability
    fingerprintSimilarity: 0.8 + Math.random() * 0.2, // High similarity
    suspiciousUserAgent: false,
    userAgent: 'Mozilla/5.0...'
  };
}

async function gatherBookingHistory(userId: string) {
  const bookingsQuery = await adminFirestore
    .collection('bookings')
    .where('renterUid', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  
  return bookingsQuery.docs.map(doc => ({
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()
  }));
}

function calculateDistance(loc1: any, loc2: any): number {
  // Simplified distance calculation (Haversine formula)
  const R = 3959; // Earth's radius in miles
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateMessageSimilarity(messages: string[]): number {
  // Simplified similarity calculation
  if (messages.length < 2) return 0;
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < messages.length - 1; i++) {
    for (let j = i + 1; j < messages.length; j++) {
      const similarity = messages[i].toLowerCase() === messages[j].toLowerCase() ? 1 : 0;
      totalSimilarity += similarity;
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

async function saveFraudScore(fraudScore: FraudScore) {
  await adminFirestore.collection('fraudScores').add({
    ...fraudScore,
    analysis: {
      ...fraudScore.analysis,
      analyzedAt: Timestamp.fromDate(fraudScore.analysis.analyzedAt)
    },
    createdAt: Timestamp.fromDate(fraudScore.createdAt),
    updatedAt: Timestamp.fromDate(fraudScore.updatedAt)
  });
}

async function executeFraudActions(fraudScore: FraudScore) {
  // Create admin notifications
  for (const notificationType of fraudScore.actions.notificationsTriggered) {
    await adminFirestore.collection('adminNotifications').add({
      type: notificationType,
      title: `Fraud Alert: ${fraudScore.riskLevel.toUpperCase()} Risk`,
      message: `Booking ${fraudScore.bookingId} flagged with ${fraudScore.totalScore}/100 fraud score`,
      data: {
        bookingId: fraudScore.bookingId,
        userId: fraudScore.userId,
        userType: fraudScore.userType,
        fraudScore: fraudScore.totalScore,
        riskLevel: fraudScore.riskLevel,
        signals: fraudScore.signals.map(s => s.type)
      },
      createdAt: Timestamp.now(),
      read: false
    });
  }
  
  // Block booking if critical
  if (fraudScore.actions.blocked) {
    await adminFirestore.collection('bookings').doc(fraudScore.bookingId).update({
      status: 'blocked_fraud',
      fraudScore: fraudScore.totalScore,
      blockedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }
}

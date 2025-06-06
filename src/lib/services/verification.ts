// User verification service for GearGrab
import { firestore } from '$lib/firebase/client';
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
  serverTimestamp 
} from 'firebase/firestore';

export interface VerificationRequest {
  id: string;
  userId: string;
  type: 'identity' | 'phone' | 'email' | 'address' | 'payment' | 'background_check';
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'in_progress';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  
  // Identity verification
  identityData?: {
    documentType: 'drivers_license' | 'passport' | 'state_id';
    documentNumber: string;
    fullName: string;
    dateOfBirth: Date;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    documentImages: string[]; // URLs to uploaded images
  };
  
  // Phone verification
  phoneData?: {
    phoneNumber: string;
    verificationCode: string;
    attempts: number;
    lastAttempt: Date;
  };
  
  // Email verification
  emailData?: {
    emailAddress: string;
    verificationToken: string;
    verified: boolean;
  };
  
  // Address verification
  addressData?: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    verificationMethod: 'utility_bill' | 'bank_statement' | 'lease_agreement';
    documentImages: string[];
  };
  
  // Payment verification
  paymentData?: {
    method: 'bank_account' | 'credit_card';
    last4Digits: string;
    verified: boolean;
  };

  // Background check verification
  backgroundCheckData?: {
    checkType: 'basic' | 'standard' | 'comprehensive';
    provider: 'checkr' | 'sterling' | 'accurate' | 'internal';
    externalId?: string; // ID from background check provider
    consentGiven: boolean;
    consentTimestamp: Date;
    results?: {
      criminalHistory: {
        status: 'clear' | 'records_found' | 'pending';
        details?: string;
        recordsFound?: Array<{
          type: 'felony' | 'misdemeanor' | 'infraction';
          description: string;
          date: Date;
          jurisdiction: string;
          disposition: string;
        }>;
      };
      sexOffenderRegistry: {
        status: 'clear' | 'found' | 'pending';
        details?: string;
      };
      globalWatchlist: {
        status: 'clear' | 'found' | 'pending';
        details?: string;
      };
      identityVerification: {
        status: 'verified' | 'failed' | 'pending';
        ssnTrace?: boolean;
        addressHistory?: boolean;
      };
      motorVehicleRecords?: {
        status: 'clear' | 'violations_found' | 'pending';
        violations?: Array<{
          type: string;
          date: Date;
          description: string;
        }>;
      };
    };
    completedAt?: Date;
    expiresAt?: Date; // Background checks expire after certain period
    riskLevel?: 'low' | 'medium' | 'high';
    overallStatus: 'pass' | 'fail' | 'review_required' | 'pending';
  };

  rejectionReason?: string;
  notes?: string;
}

export interface UserVerificationStatus {
  userId: string;
  isVerified: boolean;
  verificationLevel: 'none' | 'basic' | 'standard' | 'premium';
  verifiedMethods: {
    identity: boolean;
    phone: boolean;
    email: boolean;
    address: boolean;
    payment: boolean;
    background_check: boolean;
  };
  backgroundCheckStatus?: {
    status: 'not_started' | 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed';
    checkType?: 'basic' | 'standard' | 'comprehensive';
    completedAt?: Date;
    expiresAt?: Date;
    riskLevel?: 'low' | 'medium' | 'high';
    overallResult?: 'pass' | 'fail' | 'review_required';
    requiresRenewal?: boolean;
  };
  verificationScore: number; // 0-100
  badges: VerificationBadge[];
  lastUpdated: Date;
}

export interface VerificationBadge {
  type: 'identity_verified' | 'phone_verified' | 'email_verified' | 'address_verified' | 'payment_verified' | 'background_check_verified' | 'background_check_premium' | 'superhost' | 'trusted_renter';
  name: string;
  description: string;
  earnedAt: Date;
  icon: string;
}

export interface VerificationRequirement {
  type: string;
  name: string;
  description: string;
  required: boolean;
  estimatedTime: string;
  benefits: string[];
}

// Verification requirements for different levels
export const VERIFICATION_REQUIREMENTS: Record<string, VerificationRequirement[]> = {
  basic: [
    {
      type: 'email',
      name: 'Email Verification',
      description: 'Verify your email address',
      required: true,
      estimatedTime: '2 minutes',
      benefits: ['Receive booking notifications', 'Account security']
    },
    {
      type: 'phone',
      name: 'Phone Verification',
      description: 'Verify your phone number',
      required: true,
      estimatedTime: '3 minutes',
      benefits: ['SMS notifications', 'Account recovery', 'Enhanced security']
    }
  ],
  standard: [
    {
      type: 'identity',
      name: 'Identity Verification',
      description: 'Upload a government-issued ID',
      required: true,
      estimatedTime: '5 minutes',
      benefits: ['Increased trust', 'Higher booking rates', 'Access to premium gear']
    },
    {
      type: 'payment',
      name: 'Payment Verification',
      description: 'Verify your payment method',
      required: true,
      estimatedTime: '2 minutes',
      benefits: ['Faster bookings', 'Reduced security deposits']
    }
  ],
  premium: [
    {
      type: 'address',
      name: 'Address Verification',
      description: 'Verify your home address',
      required: false,
      estimatedTime: '10 minutes',
      benefits: ['Maximum trust level', 'Priority support', 'Special offers']
    },
    {
      type: 'background_check',
      name: 'Background Check',
      description: 'Complete a comprehensive background check',
      required: true,
      estimatedTime: '2-5 business days',
      benefits: ['Highest trust level', 'Access to premium gear', 'Reduced security deposits', 'Priority booking']
    }
  ]
};

class VerificationService {
  // Submit verification request
  async submitVerificationRequest(
    userId: string,
    type: VerificationRequest['type'],
    data: any
  ): Promise<string> {
    try {
      const verificationsRef = collection(firestore, 'verificationRequests');
      
      const request: Omit<VerificationRequest, 'id'> = {
        userId,
        type,
        status: 'pending',
        submittedAt: new Date(),
        [`${type}Data`]: data
      };

      const docRef = await addDoc(verificationsRef, {
        ...request,
        submittedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting verification request:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(userId: string, email: string): Promise<string> {
    const verificationToken = Math.random().toString(36).substring(2, 15);
    
    const emailData = {
      emailAddress: email,
      verificationToken,
      verified: false
    };

    // In a real implementation, send verification email here
    console.log(`Email verification token for ${email}: ${verificationToken}`);
    
    return this.submitVerificationRequest(userId, 'email', emailData);
  }

  // Verify phone number using Twilio API
  async verifyPhone(userId: string, phoneNumber: string): Promise<{ success: boolean; message: string; expiresAt?: string }> {
    try {
      const response = await fetch('/api/verify-phone/request-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send verification code');
      }

      return {
        success: true,
        message: 'Verification code sent successfully',
        expiresAt: result.expiresAt
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send verification code'
      };
    }
  }

  // Confirm phone verification using Twilio API
  async confirmPhoneVerification(userId: string, code: string): Promise<{ success: boolean; message: string; phoneNumber?: string }> {
    try {
      const response = await fetch('/api/verify-phone/confirm-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.error || 'Failed to verify code'
        };
      }

      return {
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber: result.phoneNumber
      };
    } catch (error) {
      console.error('Error confirming phone verification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify code'
      };
    }
  }

  // Submit identity verification
  async submitIdentityVerification(
    userId: string,
    identityData: VerificationRequest['identityData']
  ): Promise<string> {
    return this.submitVerificationRequest(userId, 'identity', identityData);
  }

  // Submit background check request
  async submitBackgroundCheck(
    userId: string,
    checkType: 'basic' | 'standard' | 'comprehensive' = 'standard',
    provider: 'checkr' | 'sterling' | 'accurate' | 'internal' = 'checkr'
  ): Promise<string> {
    const backgroundCheckData = {
      checkType,
      provider,
      consentGiven: true,
      consentTimestamp: new Date(),
      overallStatus: 'pending' as const
    };

    const requestId = await this.submitVerificationRequest(userId, 'background_check', backgroundCheckData);

    // In a real implementation, this would trigger the actual background check
    // with the chosen provider (Checkr, Sterling, etc.)
    await this.initiateExternalBackgroundCheck(requestId, userId, backgroundCheckData);

    return requestId;
  }

  // Initiate external background check with third-party provider
  private async initiateExternalBackgroundCheck(
    requestId: string,
    userId: string,
    checkData: any
  ): Promise<void> {
    try {
      // Update status to in_progress
      const requestRef = doc(firestore, 'verificationRequests', requestId);
      await updateDoc(requestRef, {
        status: 'in_progress',
        'backgroundCheckData.externalId': `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      // In a real implementation, this would make API calls to:
      // - Checkr API: https://docs.checkr.com/
      // - Sterling API: https://www.sterlingcheck.com/api/
      // - Accurate Background API: https://www.accuratebackground.com/

      console.log(`Background check initiated for user ${userId} with provider ${checkData.provider}`);

      // Simulate background check processing (remove in production)
      setTimeout(async () => {
        await this.simulateBackgroundCheckCompletion(requestId);
      }, 5000); // 5 seconds for demo, real checks take 1-5 business days

    } catch (error) {
      console.error('Error initiating background check:', error);
      throw error;
    }
  }

  // Simulate background check completion (for demo purposes)
  private async simulateBackgroundCheckCompletion(requestId: string): Promise<void> {
    try {
      const requestRef = doc(firestore, 'verificationRequests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) return;

      const request = requestDoc.data() as VerificationRequest;

      // Simulate results (in production, this would come from the provider's webhook)
      const simulatedResults = {
        criminalHistory: {
          status: 'clear' as const,
          details: 'No criminal records found'
        },
        sexOffenderRegistry: {
          status: 'clear' as const,
          details: 'No matches found in sex offender registry'
        },
        globalWatchlist: {
          status: 'clear' as const,
          details: 'No matches found in global watchlists'
        },
        identityVerification: {
          status: 'verified' as const,
          ssnTrace: true,
          addressHistory: true
        }
      };

      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        'backgroundCheckData.results': simulatedResults,
        'backgroundCheckData.completedAt': serverTimestamp(),
        'backgroundCheckData.expiresAt': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        'backgroundCheckData.riskLevel': 'low',
        'backgroundCheckData.overallStatus': 'pass'
      });

      // Update user verification status
      await this.updateUserVerificationStatus(request.userId);

    } catch (error) {
      console.error('Error completing background check:', error);
    }
  }

  // Get user verification status
  async getUserVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    try {
      const userRef = doc(firestore, 'userVerifications', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate()
        } as UserVerificationStatus;
      }
      
      // Return default status for new users
      return {
        userId,
        isVerified: false,
        verificationLevel: 'none',
        verifiedMethods: {
          identity: false,
          phone: false,
          email: false,
          address: false,
          payment: false,
          background_check: false
        },
        verificationScore: 0,
        badges: [],
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting user verification status:', error);
      throw error;
    }
  }

  // Update user verification status
  async updateUserVerificationStatus(userId: string): Promise<void> {
    try {
      // Get all approved verification requests for user
      const verificationsRef = collection(firestore, 'verificationRequests');
      const q = query(
        verificationsRef,
        where('userId', '==', userId),
        where('status', '==', 'approved')
      );

      const querySnapshot = await getDocs(q);
      const verifiedMethods = {
        identity: false,
        phone: false,
        email: false,
        address: false,
        payment: false,
        background_check: false
      };

      querySnapshot.forEach((doc) => {
        const request = doc.data() as VerificationRequest;
        verifiedMethods[request.type] = true;
      });

      // Calculate verification level and score
      const { level, score } = this.calculateVerificationLevel(verifiedMethods);
      
      // Generate badges
      const badges = this.generateBadges(verifiedMethods);

      const status: UserVerificationStatus = {
        userId,
        isVerified: level !== 'none',
        verificationLevel: level,
        verifiedMethods,
        verificationScore: score,
        badges,
        lastUpdated: new Date()
      };

      const userRef = doc(firestore, 'userVerifications', userId);
      await updateDoc(userRef, {
        ...status,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user verification status:', error);
      throw error;
    }
  }

  // Calculate verification level and score
  private calculateVerificationLevel(verifiedMethods: UserVerificationStatus['verifiedMethods']): {
    level: UserVerificationStatus['verificationLevel'];
    score: number;
  } {
    let score = 0;

    if (verifiedMethods.email) score += 10;
    if (verifiedMethods.phone) score += 20;
    if (verifiedMethods.identity) score += 30;
    if (verifiedMethods.payment) score += 20;
    if (verifiedMethods.address) score += 10;
    if (verifiedMethods.background_check) score += 30; // High value for background check

    let level: UserVerificationStatus['verificationLevel'] = 'none';

    if (verifiedMethods.email && verifiedMethods.phone) {
      level = 'basic';
    }

    if (level === 'basic' && verifiedMethods.identity && verifiedMethods.payment) {
      level = 'standard';
    }

    if (level === 'standard' && verifiedMethods.background_check) {
      level = 'premium';
    }

    return { level, score };
  }

  // Generate verification badges
  private generateBadges(verifiedMethods: UserVerificationStatus['verifiedMethods']): VerificationBadge[] {
    const badges: VerificationBadge[] = [];
    const now = new Date();

    if (verifiedMethods.email) {
      badges.push({
        type: 'email_verified',
        name: 'Email Verified',
        description: 'Email address has been verified',
        earnedAt: now,
        icon: '📧'
      });
    }

    if (verifiedMethods.phone) {
      badges.push({
        type: 'phone_verified',
        name: 'Phone Verified',
        description: 'Phone number has been verified',
        earnedAt: now,
        icon: '📱'
      });
    }

    if (verifiedMethods.identity) {
      badges.push({
        type: 'identity_verified',
        name: 'Identity Verified',
        description: 'Government ID has been verified',
        earnedAt: now,
        icon: '🆔'
      });
    }

    if (verifiedMethods.payment) {
      badges.push({
        type: 'payment_verified',
        name: 'Payment Verified',
        description: 'Payment method has been verified',
        earnedAt: now,
        icon: '💳'
      });
    }

    if (verifiedMethods.address) {
      badges.push({
        type: 'address_verified',
        name: 'Address Verified',
        description: 'Home address has been verified',
        earnedAt: now,
        icon: '🏠'
      });
    }

    if (verifiedMethods.background_check) {
      badges.push({
        type: 'background_check_verified',
        name: 'Background Check Verified',
        description: 'Comprehensive background check completed',
        earnedAt: now,
        icon: '🛡️'
      });
    }

    // Premium background check badge for comprehensive checks
    // This would be determined by checking the actual background check data
    if (verifiedMethods.background_check) {
      badges.push({
        type: 'background_check_premium',
        name: 'Premium Verified',
        description: 'Highest level of verification completed',
        earnedAt: now,
        icon: '⭐'
      });
    }

    return badges;
  }

  // Get verification requirements for a level
  getVerificationRequirements(level: 'basic' | 'standard' | 'premium'): VerificationRequirement[] {
    return VERIFICATION_REQUIREMENTS[level] || [];
  }

  // Admin methods for managing verification requests
  async getAllVerificationRequests(): Promise<VerificationRequest[]> {
    try {
      const verificationsRef = collection(firestore, 'verificationRequests');
      const querySnapshot = await getDocs(verificationsRef);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VerificationRequest));
    } catch (error) {
      console.error('Error getting all verification requests:', error);
      throw error;
    }
  }

  async approveVerificationRequest(requestId: string, notes?: string): Promise<void> {
    try {
      const requestRef = doc(firestore, 'verificationRequests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: 'admin', // In real app, use actual admin user ID
        notes: notes || 'Approved by administrator'
      });

      // Get the request to update user verification status
      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        const request = requestDoc.data() as VerificationRequest;
        await this.updateUserVerificationStatus(request.userId);
      }
    } catch (error) {
      console.error('Error approving verification request:', error);
      throw error;
    }
  }

  async rejectVerificationRequest(requestId: string, reason: string): Promise<void> {
    try {
      const requestRef = doc(firestore, 'verificationRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: 'admin', // In real app, use actual admin user ID
        rejectionReason: reason
      });

      // Get the request to update user verification status
      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        const request = requestDoc.data() as VerificationRequest;
        await this.updateUserVerificationStatus(request.userId);
      }
    } catch (error) {
      console.error('Error rejecting verification request:', error);
      throw error;
    }
  }

  // Get user verification requests (for user's own requests)
  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    try {
      const verificationsRef = collection(firestore, 'verificationRequests');
      const q = query(
        verificationsRef,
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VerificationRequest));
    } catch (error) {
      console.error('Error getting user verification requests:', error);
      throw error;
    }
  }
}

export const verificationService = new VerificationService();

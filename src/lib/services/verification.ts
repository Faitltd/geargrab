// User verification service for GearGrab
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
  serverTimestamp 
} from 'firebase/firestore';

export interface VerificationRequest {
  id: string;
  userId: string;
  type: 'identity' | 'phone' | 'email' | 'address' | 'payment';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
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
  };
  verificationScore: number; // 0-100
  badges: VerificationBadge[];
  lastUpdated: Date;
}

export interface VerificationBadge {
  type: 'identity_verified' | 'phone_verified' | 'email_verified' | 'address_verified' | 'payment_verified' | 'superhost' | 'trusted_renter';
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
      const verificationsRef = collection(db, 'verificationRequests');
      
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

  // Verify phone number
  async verifyPhone(userId: string, phoneNumber: string): Promise<string> {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const phoneData = {
      phoneNumber,
      verificationCode,
      attempts: 0,
      lastAttempt: new Date()
    };

    // In a real implementation, send SMS here
    console.log(`SMS verification code for ${phoneNumber}: ${verificationCode}`);
    
    return this.submitVerificationRequest(userId, 'phone', phoneData);
  }

  // Confirm phone verification
  async confirmPhoneVerification(requestId: string, code: string): Promise<boolean> {
    try {
      const requestRef = doc(db, 'verificationRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Verification request not found');
      }

      const request = requestDoc.data() as VerificationRequest;
      
      if (request.phoneData?.verificationCode === code) {
        await updateDoc(requestRef, {
          status: 'approved',
          reviewedAt: serverTimestamp(),
          'phoneData.verified': true
        });
        
        // Update user verification status
        await this.updateUserVerificationStatus(request.userId);
        
        return true;
      } else {
        // Increment attempts
        await updateDoc(requestRef, {
          'phoneData.attempts': (request.phoneData?.attempts || 0) + 1,
          'phoneData.lastAttempt': serverTimestamp()
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error confirming phone verification:', error);
      throw error;
    }
  }

  // Submit identity verification
  async submitIdentityVerification(
    userId: string,
    identityData: VerificationRequest['identityData']
  ): Promise<string> {
    return this.submitVerificationRequest(userId, 'identity', identityData);
  }

  // Get user verification status
  async getUserVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    try {
      const userRef = doc(db, 'userVerifications', userId);
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
          payment: false
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
      const verificationsRef = collection(db, 'verificationRequests');
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
        payment: false
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

      const userRef = doc(db, 'userVerifications', userId);
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
    if (verifiedMethods.identity) score += 40;
    if (verifiedMethods.payment) score += 20;
    if (verifiedMethods.address) score += 10;

    let level: UserVerificationStatus['verificationLevel'] = 'none';
    
    if (verifiedMethods.email && verifiedMethods.phone) {
      level = 'basic';
    }
    
    if (level === 'basic' && verifiedMethods.identity && verifiedMethods.payment) {
      level = 'standard';
    }
    
    if (level === 'standard' && verifiedMethods.address) {
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

    return badges;
  }

  // Get verification requirements for a level
  getVerificationRequirements(level: 'basic' | 'standard' | 'premium'): VerificationRequirement[] {
    return VERIFICATION_REQUIREMENTS[level] || [];
  }
}

export const verificationService = new VerificationService();

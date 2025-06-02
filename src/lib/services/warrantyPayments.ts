// Warranty payment system for GearGrab
import { browser } from '$app/environment';
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
import { initializeStripe, createPaymentIntent } from './payments';

export interface WarrantyPlan {
  id: 'basic' | 'standard' | 'premium' | 'comprehensive';
  name: string;
  description: string;
  duration: number; // in months
  coverage: {
    accidentalDamage: boolean;
    theft: boolean;
    lossOfUse: boolean;
    expeditedReplacement: boolean;
    worldwideCoverage: boolean;
    noDeductible: boolean;
  };
  pricing: {
    percentage: number; // Percentage of item value
    minimum: number;    // Minimum fee
    maximum: number;    // Maximum fee
  };
  features: string[];
  exclusions: string[];
}

export interface WarrantyPurchase {
  id: string;
  userId: string;
  listingId: string;
  bookingId?: string;
  planId: WarrantyPlan['id'];
  itemValue: number;
  warrantyPrice: number;
  status: 'pending' | 'active' | 'expired' | 'claimed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  paymentIntentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarrantyClaim {
  id: string;
  warrantyId: string;
  userId: string;
  claimType: 'damage' | 'theft' | 'loss' | 'malfunction';
  description: string;
  estimatedCost: number;
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'paid';
  evidence: {
    photos: string[];
    receipts: string[];
    policeReport?: string;
  };
  timeline: Array<{
    date: Date;
    action: string;
    actor: string;
    notes: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Warranty plan definitions
export const WARRANTY_PLANS: WarrantyPlan[] = [
  {
    id: 'basic',
    name: 'Basic Protection',
    description: 'Essential coverage for peace of mind',
    duration: 12,
    coverage: {
      accidentalDamage: true,
      theft: false,
      lossOfUse: false,
      expeditedReplacement: false,
      worldwideCoverage: false,
      noDeductible: false
    },
    pricing: {
      percentage: 3,
      minimum: 15,
      maximum: 150
    },
    features: [
      'Accidental damage coverage',
      'Repair or replacement up to item value',
      'Simple claims process',
      '24/7 customer support'
    ],
    exclusions: [
      'Intentional damage',
      'Normal wear and tear',
      'Theft or loss',
      'Commercial use'
    ]
  },
  {
    id: 'standard',
    name: 'Standard Protection',
    description: 'Comprehensive coverage for most situations',
    duration: 12,
    coverage: {
      accidentalDamage: true,
      theft: true,
      lossOfUse: false,
      expeditedReplacement: false,
      worldwideCoverage: false,
      noDeductible: false
    },
    pricing: {
      percentage: 5,
      minimum: 25,
      maximum: 250
    },
    features: [
      'Accidental damage coverage',
      'Theft protection',
      'Repair or replacement up to item value',
      'Fast claims processing',
      '24/7 customer support'
    ],
    exclusions: [
      'Intentional damage',
      'Normal wear and tear',
      'Commercial use',
      'Acts of war'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Protection',
    description: 'Advanced coverage with expedited service',
    duration: 24,
    coverage: {
      accidentalDamage: true,
      theft: true,
      lossOfUse: true,
      expeditedReplacement: true,
      worldwideCoverage: false,
      noDeductible: true
    },
    pricing: {
      percentage: 8,
      minimum: 40,
      maximum: 400
    },
    features: [
      'Accidental damage coverage',
      'Theft protection',
      'Loss of use compensation',
      'Expedited replacement (24-48 hours)',
      'No deductible',
      'Priority customer support'
    ],
    exclusions: [
      'Intentional damage',
      'Commercial use',
      'Acts of war',
      'Nuclear incidents'
    ]
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Protection',
    description: 'Ultimate coverage for professional users',
    duration: 36,
    coverage: {
      accidentalDamage: true,
      theft: true,
      lossOfUse: true,
      expeditedReplacement: true,
      worldwideCoverage: true,
      noDeductible: true
    },
    pricing: {
      percentage: 12,
      minimum: 60,
      maximum: 600
    },
    features: [
      'Accidental damage coverage',
      'Theft protection worldwide',
      'Loss of use compensation',
      'Expedited replacement (12-24 hours)',
      'No deductible',
      'Worldwide coverage',
      'Dedicated account manager',
      'Professional use coverage'
    ],
    exclusions: [
      'Intentional damage',
      'Acts of war',
      'Nuclear incidents'
    ]
  }
];

class WarrantyPaymentService {
  // Calculate warranty cost
  calculateWarrantyCost(itemValue: number, planId: WarrantyPlan['id']): number {
    const plan = WARRANTY_PLANS.find(p => p.id === planId);
    if (!plan) return 0;

    const calculatedCost = itemValue * (plan.pricing.percentage / 100);
    return Math.max(
      plan.pricing.minimum,
      Math.min(plan.pricing.maximum, calculatedCost)
    );
  }

  // Get warranty plan details
  getWarrantyPlan(planId: WarrantyPlan['id']): WarrantyPlan | null {
    return WARRANTY_PLANS.find(p => p.id === planId) || null;
  }

  // Purchase warranty
  async purchaseWarranty(
    userId: string,
    listingId: string,
    planId: WarrantyPlan['id'],
    itemValue: number,
    bookingId?: string
  ): Promise<{ warrantyId: string; paymentIntentId: string; clientSecret: string }> {
    try {
      const plan = this.getWarrantyPlan(planId);
      if (!plan) {
        throw new Error('Invalid warranty plan');
      }

      const warrantyPrice = this.calculateWarrantyCost(itemValue, planId);
      
      // Create payment intent
      const { clientSecret, paymentIntentId } = await createPaymentIntent(
        warrantyPrice,
        'usd',
        {
          type: 'warranty',
          userId,
          listingId,
          planId,
          itemValue: itemValue.toString()
        }
      );

      // Create warranty record
      const warrantyData: Omit<WarrantyPurchase, 'id'> = {
        userId,
        listingId,
        bookingId,
        planId,
        itemValue,
        warrantyPrice,
        status: 'pending',
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.duration * 30 * 24 * 60 * 60 * 1000),
        paymentIntentId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const warrantyRef = collection(firestore, 'warranties');
      const docRef = await addDoc(warrantyRef, {
        ...warrantyData,
        startDate: serverTimestamp(),
        endDate: new Date(Date.now() + plan.duration * 30 * 24 * 60 * 60 * 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        warrantyId: docRef.id,
        paymentIntentId,
        clientSecret
      };
    } catch (error) {
      console.error('Error purchasing warranty:', error);
      throw error;
    }
  }

  // Confirm warranty payment
  async confirmWarrantyPayment(warrantyId: string): Promise<void> {
    try {
      const warrantyRef = doc(firestore, 'warranties', warrantyId);
      await updateDoc(warrantyRef, {
        status: 'active',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error confirming warranty payment:', error);
      throw error;
    }
  }

  // Submit warranty claim
  async submitClaim(
    warrantyId: string,
    claimData: Omit<WarrantyClaim, 'id' | 'warrantyId' | 'timeline' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const claimsRef = collection(firestore, 'warrantyClaims');
      
      const claim = {
        ...claimData,
        warrantyId,
        timeline: [{
          date: serverTimestamp(),
          action: 'Claim submitted',
          actor: claimData.userId,
          notes: 'Initial claim submission'
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(claimsRef, claim);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting warranty claim:', error);
      throw error;
    }
  }

  // Get user warranties
  async getUserWarranties(userId: string): Promise<WarrantyPurchase[]> {
    try {
      const warrantiesRef = collection(firestore, 'warranties');
      const q = query(
        warrantiesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const warranties: WarrantyPurchase[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        warranties.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as WarrantyPurchase);
      });

      return warranties;
    } catch (error) {
      console.error('Error getting user warranties:', error);
      throw error;
    }
  }

  // Get warranty claims
  async getWarrantyClaims(warrantyId: string): Promise<WarrantyClaim[]> {
    try {
      const claimsRef = collection(firestore, 'warrantyClaims');
      const q = query(
        claimsRef,
        where('warrantyId', '==', warrantyId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const claims: WarrantyClaim[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        claims.push({
          id: doc.id,
          ...data,
          timeline: data.timeline?.map((t: any) => ({
            ...t,
            date: t.date?.toDate()
          })),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as WarrantyClaim);
      });

      return claims;
    } catch (error) {
      console.error('Error getting warranty claims:', error);
      throw error;
    }
  }
}

export const warrantyPaymentService = new WarrantyPaymentService();

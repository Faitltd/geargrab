// Insurance and warranty service for GearGrab
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

export interface InsuranceTier {
  id: 'none' | 'basic' | 'standard' | 'premium';
  name: string;
  description: string;
  coverage: {
    damageLimit: number;
    theftLimit: number;
    deductible: number;
    personalLiability: boolean;
    weatherDamage: boolean;
    accidentalDamage: boolean;
  };
  pricing: {
    percentage: number; // Percentage of rental price
    minimum: number;    // Minimum fee
    maximum: number;    // Maximum fee
  };
  features: string[];
}

export interface InsuranceClaim {
  id: string;
  bookingId: string;
  listingId: string;
  claimantId: string;
  respondentId: string;
  type: 'damage' | 'theft' | 'loss' | 'personal_injury';
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'settled';
  description: string;
  incidentDate: Date;
  reportedDate: Date;
  estimatedCost: number;
  approvedAmount?: number;
  evidence: {
    photos: string[];
    documents: string[];
    witnessStatements: string[];
  };
  timeline: {
    date: Date;
    action: string;
    actor: string;
    notes?: string;
  }[];
  resolution?: {
    type: 'repair' | 'replacement' | 'monetary';
    amount: number;
    details: string;
    completedDate: Date;
  };
}

export interface WarrantyInfo {
  listingId: string;
  warrantyType: 'manufacturer' | 'owner' | 'geargrab';
  duration: number; // in days
  coverage: string[];
  exclusions: string[];
  claimProcess: string;
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

// Insurance tier definitions
export const INSURANCE_TIERS: InsuranceTier[] = [
  {
    id: 'none',
    name: 'No Insurance',
    description: 'Rent at your own risk',
    coverage: {
      damageLimit: 0,
      theftLimit: 0,
      deductible: 0,
      personalLiability: false,
      weatherDamage: false,
      accidentalDamage: false
    },
    pricing: {
      percentage: 0,
      minimum: 0,
      maximum: 0
    },
    features: [
      'No coverage provided',
      'Full responsibility for damages',
      'Security deposit at risk'
    ]
  },
  {
    id: 'basic',
    name: 'Basic Protection',
    description: 'Essential coverage for peace of mind',
    coverage: {
      damageLimit: 500,
      theftLimit: 500,
      deductible: 50,
      personalLiability: false,
      weatherDamage: false,
      accidentalDamage: true
    },
    pricing: {
      percentage: 8,
      minimum: 5,
      maximum: 25
    },
    features: [
      'Up to $500 damage coverage',
      'Up to $500 theft protection',
      '$50 deductible',
      'Accidental damage covered',
      '24/7 claim support'
    ]
  },
  {
    id: 'standard',
    name: 'Standard Protection',
    description: 'Comprehensive coverage for most situations',
    coverage: {
      damageLimit: 2000,
      theftLimit: 2000,
      deductible: 25,
      personalLiability: true,
      weatherDamage: true,
      accidentalDamage: true
    },
    pricing: {
      percentage: 12,
      minimum: 10,
      maximum: 50
    },
    features: [
      'Up to $2,000 damage coverage',
      'Up to $2,000 theft protection',
      '$25 deductible',
      'Weather damage covered',
      'Personal liability protection',
      'Priority claim processing',
      '24/7 emergency support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Protection',
    description: 'Maximum coverage and benefits',
    coverage: {
      damageLimit: 10000,
      theftLimit: 10000,
      deductible: 0,
      personalLiability: true,
      weatherDamage: true,
      accidentalDamage: true
    },
    pricing: {
      percentage: 18,
      minimum: 15,
      maximum: 100
    },
    features: [
      'Up to $10,000 damage coverage',
      'Up to $10,000 theft protection',
      'No deductible',
      'Full weather protection',
      'Enhanced personal liability',
      'Expedited claim processing',
      'Concierge support',
      'Replacement gear during claims'
    ]
  }
];

class InsuranceService {
  // Calculate insurance cost
  calculateInsuranceCost(
    rentalPrice: number, 
    tierId: InsuranceTier['id']
  ): number {
    const tier = INSURANCE_TIERS.find(t => t.id === tierId);
    if (!tier || tier.id === 'none') return 0;

    const calculatedCost = rentalPrice * (tier.pricing.percentage / 100);
    return Math.max(
      tier.pricing.minimum,
      Math.min(tier.pricing.maximum, calculatedCost)
    );
  }

  // Get insurance tier details
  getInsuranceTier(tierId: InsuranceTier['id']): InsuranceTier | null {
    return INSURANCE_TIERS.find(t => t.id === tierId) || null;
  }

  // Submit insurance claim
  async submitClaim(claimData: Omit<InsuranceClaim, 'id' | 'timeline'>): Promise<string> {
    try {
      const claimsRef = collection(firestore, 'insuranceClaims');
      
      const claim = {
        ...claimData,
        timeline: [{
          date: serverTimestamp(),
          action: 'Claim submitted',
          actor: claimData.claimantId,
          notes: 'Initial claim submission'
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(claimsRef, claim);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  }

  // Update claim status
  async updateClaimStatus(
    claimId: string, 
    status: InsuranceClaim['status'],
    notes?: string,
    actorId?: string
  ): Promise<void> {
    try {
      const claimRef = doc(firestore, 'insuranceClaims', claimId);
      
      // Get current claim to update timeline
      const claimDoc = await getDoc(claimRef);
      if (!claimDoc.exists()) {
        throw new Error('Claim not found');
      }

      const currentClaim = claimDoc.data();
      const newTimelineEntry = {
        date: serverTimestamp(),
        action: `Status changed to ${status}`,
        actor: actorId || 'system',
        notes: notes || ''
      };

      await updateDoc(claimRef, {
        status,
        timeline: [...(currentClaim.timeline || []), newTimelineEntry],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating claim status:', error);
      throw error;
    }
  }

  // Get user's claims
  async getUserClaims(userId: string): Promise<InsuranceClaim[]> {
    try {
      const claimsRef = collection(firestore, 'insuranceClaims');
      const q = query(
        claimsRef,
        where('claimantId', '==', userId),
        orderBy('reportedDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const claims: InsuranceClaim[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        claims.push({
          id: doc.id,
          ...data,
          incidentDate: data.incidentDate?.toDate(),
          reportedDate: data.reportedDate?.toDate(),
          timeline: data.timeline?.map((entry: any) => ({
            ...entry,
            date: entry.date?.toDate()
          })) || []
        } as InsuranceClaim);
      });

      return claims;
    } catch (error) {
      console.error('Error getting user claims:', error);
      throw error;
    }
  }

  // Add warranty information
  async addWarrantyInfo(warrantyData: WarrantyInfo): Promise<void> {
    try {
      const warrantyRef = doc(firestore, 'warranties', warrantyData.listingId);
      await updateDoc(warrantyRef, {
        ...warrantyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding warranty info:', error);
      throw error;
    }
  }

  // Get warranty information for a listing
  async getWarrantyInfo(listingId: string): Promise<WarrantyInfo | null> {
    try {
      const warrantyRef = doc(firestore, 'warranties', listingId);
      const warrantyDoc = await getDoc(warrantyRef);
      
      if (warrantyDoc.exists()) {
        return warrantyDoc.data() as WarrantyInfo;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting warranty info:', error);
      throw error;
    }
  }

  // Process insurance payout
  async processInsurancePayout(
    claimId: string,
    approvedAmount: number,
    resolutionDetails: InsuranceClaim['resolution']
  ): Promise<void> {
    try {
      const claimRef = doc(firestore, 'insuranceClaims', claimId);
      
      await updateDoc(claimRef, {
        status: 'settled',
        approvedAmount,
        resolution: {
          ...resolutionDetails,
          completedDate: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      // In a real implementation, this would trigger payment processing
      console.log(`Insurance payout of $${approvedAmount} processed for claim ${claimId}`);
    } catch (error) {
      console.error('Error processing insurance payout:', error);
      throw error;
    }
  }
}

export const insuranceService = new InsuranceService();

import { firestore } from '$lib/firebase/client';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

export interface BackgroundCheckProvider {
  id: 'checkr' | 'sterling' | 'accurate' | 'internal';
  name: string;
  description: string;
  features: string[];
  pricing: {
    basic: number;
    standard: number;
    comprehensive: number;
  };
  turnaroundTime: {
    basic: string;
    standard: string;
    comprehensive: string;
  };
}

export interface BackgroundCheckConfig {
  enabled: boolean;
  requiredForLevel: 'none' | 'standard' | 'premium';
  defaultProvider: BackgroundCheckProvider['id'];
  autoApproveThreshold: number; // Risk score threshold for auto-approval
  renewalPeriod: number; // Days before background check expires
  providers: BackgroundCheckProvider[];
}

export interface BackgroundCheckConsent {
  userId: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  ipAddress: string;
  userAgent: string;
  consentText: string;
  signature?: string; // Digital signature if required
}

// Background check providers configuration
export const BACKGROUND_CHECK_PROVIDERS: BackgroundCheckProvider[] = [
  {
    id: 'checkr',
    name: 'Checkr',
    description: 'Industry-leading background check provider with fast turnaround times',
    features: [
      'Criminal history search',
      'Sex offender registry',
      'Global watchlist screening',
      'SSN trace and verification',
      'Address history',
      'Motor vehicle records'
    ],
    pricing: {
      basic: 25,
      standard: 35,
      comprehensive: 50
    },
    turnaroundTime: {
      basic: '1-2 business days',
      standard: '2-3 business days',
      comprehensive: '3-5 business days'
    }
  },
  {
    id: 'sterling',
    name: 'Sterling',
    description: 'Comprehensive background screening with global coverage',
    features: [
      'Multi-jurisdictional criminal search',
      'Federal criminal search',
      'Sex offender registry',
      'Global sanctions screening',
      'Identity verification',
      'Professional license verification'
    ],
    pricing: {
      basic: 30,
      standard: 40,
      comprehensive: 60
    },
    turnaroundTime: {
      basic: '1-3 business days',
      standard: '2-4 business days',
      comprehensive: '3-7 business days'
    }
  },
  {
    id: 'accurate',
    name: 'Accurate Background',
    description: 'Reliable background checks with detailed reporting',
    features: [
      'County criminal search',
      'Statewide criminal search',
      'Federal criminal search',
      'Sex offender search',
      'Terrorist watch list',
      'Address verification'
    ],
    pricing: {
      basic: 20,
      standard: 30,
      comprehensive: 45
    },
    turnaroundTime: {
      basic: '1-2 business days',
      standard: '2-4 business days',
      comprehensive: '3-5 business days'
    }
  }
];

// Default configuration
export const DEFAULT_BACKGROUND_CHECK_CONFIG: BackgroundCheckConfig = {
  enabled: true,
  requiredForLevel: 'premium',
  defaultProvider: 'checkr',
  autoApproveThreshold: 75, // Auto-approve if risk score is above 75
  renewalPeriod: 365, // Renew every year
  providers: BACKGROUND_CHECK_PROVIDERS
};

class BackgroundCheckService {
  private config: BackgroundCheckConfig = DEFAULT_BACKGROUND_CHECK_CONFIG;

  // Get background check configuration
  getConfig(): BackgroundCheckConfig {
    return this.config;
  }

  // Update configuration (admin only)
  async updateConfig(newConfig: Partial<BackgroundCheckConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // In a real implementation, save to database
    const configRef = doc(firestore, 'systemConfig', 'backgroundChecks');
    await updateDoc(configRef, newConfig);
  }

  // Record user consent for background check
  async recordConsent(
    userId: string,
    ipAddress: string,
    userAgent: string,
    signature?: string
  ): Promise<string> {
    const consent: BackgroundCheckConsent = {
      userId,
      consentGiven: true,
      consentTimestamp: new Date(),
      ipAddress,
      userAgent,
      consentText: this.getConsentText(),
      signature
    };

    const consentRef = collection(firestore, 'backgroundCheckConsents');
    const docRef = await addDoc(consentRef, {
      ...consent,
      consentTimestamp: serverTimestamp()
    });

    return docRef.id;
  }

  // Get consent text
  private getConsentText(): string {
    return `
I hereby authorize GearGrab and its designated agents to conduct a comprehensive background check, 
which may include but is not limited to:

• Criminal history records
• Sex offender registry searches
• Global watchlist and sanctions screening
• Identity verification and SSN trace
• Address history verification
• Motor vehicle records (if applicable)

I understand that this information will be used to verify my identity and assess my eligibility 
to participate in the GearGrab platform. I certify that all information provided is true and 
accurate to the best of my knowledge.

I understand that I have the right to dispute any inaccurate information found in my background 
check and that I will be provided with a copy of the report if adverse action is taken based 
on its contents.

This authorization will remain in effect for the duration of my participation in the GearGrab 
platform or until I revoke it in writing.
    `.trim();
  }

  // Check if user has given consent
  async hasUserConsent(userId: string): Promise<boolean> {
    const consentRef = collection(firestore, 'backgroundCheckConsents');
    const q = query(
      consentRef,
      where('userId', '==', userId),
      where('consentGiven', '==', true)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // Get background check pricing
  getPricing(
    provider: BackgroundCheckProvider['id'],
    checkType: 'basic' | 'standard' | 'comprehensive'
  ): number {
    const providerConfig = this.config.providers.find(p => p.id === provider);
    return providerConfig?.pricing[checkType] || 0;
  }

  // Get estimated turnaround time
  getTurnaroundTime(
    provider: BackgroundCheckProvider['id'],
    checkType: 'basic' | 'standard' | 'comprehensive'
  ): string {
    const providerConfig = this.config.providers.find(p => p.id === provider);
    return providerConfig?.turnaroundTime[checkType] || 'Unknown';
  }

  // Check if background check is required for verification level
  isRequiredForLevel(level: 'basic' | 'standard' | 'premium'): boolean {
    if (!this.config.enabled) return false;
    
    const levelHierarchy = { basic: 1, standard: 2, premium: 3 };
    const requiredLevel = levelHierarchy[this.config.requiredForLevel];
    const userLevel = levelHierarchy[level];
    
    return userLevel >= requiredLevel;
  }

  // Calculate risk score based on background check results
  calculateRiskScore(results: any): number {
    let score = 100; // Start with perfect score

    // Deduct points for criminal history
    if (results.criminalHistory?.status === 'records_found') {
      const records = results.criminalHistory.recordsFound || [];
      records.forEach((record: any) => {
        switch (record.type) {
          case 'felony':
            score -= 30;
            break;
          case 'misdemeanor':
            score -= 15;
            break;
          case 'infraction':
            score -= 5;
            break;
        }
      });
    }

    // Deduct points for sex offender registry
    if (results.sexOffenderRegistry?.status === 'found') {
      score -= 50;
    }

    // Deduct points for watchlist matches
    if (results.globalWatchlist?.status === 'found') {
      score -= 40;
    }

    // Deduct points for identity verification failures
    if (results.identityVerification?.status === 'failed') {
      score -= 20;
    }

    // Deduct points for motor vehicle violations
    if (results.motorVehicleRecords?.status === 'violations_found') {
      const violations = results.motorVehicleRecords.violations || [];
      score -= violations.length * 5; // 5 points per violation
    }

    return Math.max(0, score); // Ensure score doesn't go below 0
  }

  // Determine approval status based on risk score
  determineApprovalStatus(riskScore: number): 'pass' | 'fail' | 'review_required' {
    if (riskScore >= this.config.autoApproveThreshold) {
      return 'pass';
    } else if (riskScore >= 50) {
      return 'review_required';
    } else {
      return 'fail';
    }
  }
}

export const backgroundCheckService = new BackgroundCheckService();

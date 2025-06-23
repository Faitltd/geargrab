export interface GearConditionPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  timestamp: Date;
  uploadedBy: string; // userId
  uploadedByRole: 'owner' | 'renter';
  photoType: 'overview' | 'damage' | 'wear' | 'serial_number' | 'accessories' | 'custom';
  metadata?: {
    location?: string;
    weather?: string;
    notes?: string;
  };
}

export interface GearConditionReport {
  id: string;
  bookingId: string;
  listingId: string;
  reportType: 'pickup' | 'return';
  status: 'pending' | 'completed' | 'disputed';
  
  // Photos by category
  photos: {
    overview: GearConditionPhoto[];
    damage: GearConditionPhoto[];
    wear: GearConditionPhoto[];
    serialNumber: GearConditionPhoto[];
    accessories: GearConditionPhoto[];
    custom: GearConditionPhoto[];
  };
  
  // Condition assessment
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  conditionNotes: string;
  
  // Damage/issues
  damages: GearDamage[];
  
  // Signatures/confirmations
  ownerConfirmation?: {
    confirmed: boolean;
    timestamp: Date;
    signature?: string;
    notes?: string;
  };
  
  renterConfirmation?: {
    confirmed: boolean;
    timestamp: Date;
    signature?: string;
    notes?: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface GearDamage {
  id: string;
  type: 'scratch' | 'dent' | 'tear' | 'stain' | 'missing_part' | 'malfunction' | 'other';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  photos: string[]; // photo IDs
  estimatedCost?: number;
  repairRequired: boolean;
  discoveredBy: 'owner' | 'renter';
  discoveredAt: Date;
}

export interface PhotoUploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export interface ConditionPhotoRequirements {
  overview: {
    required: true;
    minPhotos: 3;
    maxPhotos: 8;
    description: 'Overall condition of the gear from multiple angles';
  };
  damage: {
    required: false;
    minPhotos: 0;
    maxPhotos: 10;
    description: 'Any existing damage, scratches, or wear';
  };
  wear: {
    required: false;
    minPhotos: 0;
    maxPhotos: 5;
    description: 'Normal wear and tear areas';
  };
  serialNumber: {
    required: true;
    minPhotos: 1;
    maxPhotos: 2;
    description: 'Serial numbers, model numbers, or identifying marks';
  };
  accessories: {
    required: false;
    minPhotos: 0;
    maxPhotos: 5;
    description: 'Included accessories, cases, or additional items';
  };
  custom: {
    required: false;
    minPhotos: 0;
    maxPhotos: 5;
    description: 'Additional photos as needed';
  };
}

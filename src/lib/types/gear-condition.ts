import type { Timestamp } from 'firebase/firestore';

export type ConditionReportPhase = 'pickup' | 'return';
export type ConditionReportStatus = 'draft' | 'in_progress' | 'completed' | 'disputed';
export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor';

export type ConditionPhotoCategory =
  | 'overview'
  | 'damage'
  | 'wear'
  | 'serialNumber'
  | 'accessories'
  | 'custom';

export interface ConditionPhoto {
  id: string;
  url: string;
  category: ConditionPhotoCategory;
  uploaderId: string;
  uploadedAt: Date | Timestamp;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ConditionPhotoRequirements {
  [key: string]: {
    required: boolean;
    minPhotos: number;
    maxPhotos: number;
    description: string;
  };
}

export interface GearConditionReport {
  id: string;
  bookingId: string;
  listingId: string;
  reportType: ConditionReportPhase;
  createdBy: string;
  userRole: 'owner' | 'renter';
  status: ConditionReportStatus;
  overallCondition: ConditionRating;
  conditionNotes?: string;
  confirmationSignature?: string;
  confirmationNotes?: string;
  confirmedBy?: string;
  confirmedAt?: Date | Timestamp;
  photos: Record<ConditionPhotoCategory, ConditionPhoto[]>;
  timeline?: Array<{
    id: string;
    timestamp: Date | Timestamp;
    event: string;
    actor: string;
    notes?: string;
  }>;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Verification and condition check related types

import type { BaseEntity, Coordinates } from './common';

export interface ConditionCheck extends BaseEntity {
  rentalId: string;
  listingId: string;
  userId: string;
  userRole: 'renter' | 'owner';
  type: 'before' | 'after';
  status: ConditionCheckStatus;
  photos: ConditionPhoto[];
  notes?: string;
  location?: ConditionCheckLocation;
  completedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  disputes?: ConditionDispute[];
}

export type ConditionCheckStatus = 'pending' | 'completed' | 'disputed' | 'resolved';

export interface ConditionPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  description?: string;
  timestamp: string;
  metadata?: PhotoMetadata;
  annotations?: PhotoAnnotation[];
}

export interface PhotoMetadata {
  size: number;
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
  exif?: {
    camera?: string;
    timestamp?: string;
    location?: Coordinates;
  };
}

export interface PhotoAnnotation {
  id: string;
  type: 'damage' | 'wear' | 'note';
  position: {
    x: number;
    y: number;
  };
  description: string;
  severity?: 'minor' | 'moderate' | 'major';
}

export interface ConditionCheckLocation {
  coordinates: Coordinates;
  address?: string;
  accuracy?: number;
  timestamp: string;
}

export interface ConditionDispute extends BaseEntity {
  conditionCheckId: string;
  initiatedBy: string;
  reason: DisputeReason;
  description: string;
  evidence: DisputeEvidence[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type DisputeReason = 
  | 'damage_not_disclosed'
  | 'condition_mismatch'
  | 'missing_items'
  | 'additional_damage'
  | 'photo_quality'
  | 'other';

export interface DisputeEvidence {
  type: 'photo' | 'document' | 'message';
  url: string;
  description?: string;
  timestamp: string;
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated';

export interface DisputeResolution {
  outcome: 'favor_renter' | 'favor_owner' | 'split_liability' | 'no_fault';
  compensation?: {
    amount: number;
    recipient: string;
    reason: string;
  };
  notes?: string;
}

export interface CapturedPhoto {
  id: string;
  blob: Blob;
  url: string;
  timestamp: string;
  metadata?: {
    size: number;
    type: string;
  };
}

export interface CameraSettings {
  facingMode: 'user' | 'environment';
  resolution: {
    width: number;
    height: number;
  };
  quality: number;
}

export interface VerificationTemplate {
  id: string;
  name: string;
  category: string;
  requiredPhotos: VerificationPhotoRequirement[];
  instructions: string[];
}

export interface VerificationPhotoRequirement {
  id: string;
  name: string;
  description: string;
  example?: string;
  required: boolean;
  multiple: boolean;
}

export interface VerificationSession {
  id: string;
  templateId: string;
  userId: string;
  status: 'in_progress' | 'completed' | 'failed';
  photos: ConditionPhoto[];
  startedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

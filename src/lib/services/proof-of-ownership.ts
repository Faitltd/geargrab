import { adminFirestore } from '$lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

export interface ProofOfOwnershipRequirement {
  required: boolean;
  reason: string;
  minValue: number;
  documentTypes: string[];
  additionalInfo?: string;
}

export interface ProofDocument {
  id: string;
  type: 'receipt' | 'warranty' | 'guarantee' | 'serial_number' | 'manual' | 'other';
  name: string;
  description?: string;
  file?: File;
  preview?: string;
  uploadedAt: Date;
  verified: boolean;
  verificationNotes?: string;
}

export interface OwnershipProof {
  id: string;
  listingId: string;
  userId: string;
  gearTitle: string;
  gearValue: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs_more_info';
  
  // Required documents
  documents: ProofDocument[];
  
  // Verification details
  verification: {
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    notes?: string;
    rejectionReason?: string;
  };
  
  // Metadata
  metadata: {
    ipAddress: string;
    userAgent: string;
    submissionHash: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Value thresholds that require proof of ownership
export const PROOF_REQUIREMENTS = {
  // High-value items always require proof
  HIGH_VALUE_THRESHOLD: 500, // $500+
  
  // Medium-value items require proof for certain categories
  MEDIUM_VALUE_THRESHOLD: 200, // $200+
  
  // Categories that always require proof regardless of value
  ALWAYS_REQUIRE_CATEGORIES: [
    'cameras-photography',
    'electronics',
    'bikes',
    'climbing-gear'
  ],
  
  // Categories that require proof at lower thresholds
  SENSITIVE_CATEGORIES: {
    'winter-sports': 300,
    'water-sports': 250,
    'camping-gear': 400
  }
};

/**
 * Check if proof of ownership is required for a listing
 */
export function checkProofRequirement(
  category: string,
  dailyPrice: number,
  estimatedValue?: number
): ProofOfOwnershipRequirement {
  const value = estimatedValue || (dailyPrice * 30); // Estimate value from daily price
  
  // Always require for certain categories
  if (PROOF_REQUIREMENTS.ALWAYS_REQUIRE_CATEGORIES.includes(category)) {
    return {
      required: true,
      reason: 'High-risk category requires ownership verification',
      minValue: 0,
      documentTypes: ['receipt', 'warranty', 'serial_number'],
      additionalInfo: 'Items in this category require proof of ownership regardless of value due to theft risk.'
    };
  }
  
  // Check sensitive category thresholds
  const sensitiveThreshold = PROOF_REQUIREMENTS.SENSITIVE_CATEGORIES[category];
  if (sensitiveThreshold && value >= sensitiveThreshold) {
    return {
      required: true,
      reason: `Items over $${sensitiveThreshold} in this category require verification`,
      minValue: sensitiveThreshold,
      documentTypes: ['receipt', 'warranty'],
      additionalInfo: 'This helps protect against stolen goods and builds renter confidence.'
    };
  }
  
  // Check high-value threshold
  if (value >= PROOF_REQUIREMENTS.HIGH_VALUE_THRESHOLD) {
    return {
      required: true,
      reason: `High-value items over $${PROOF_REQUIREMENTS.HIGH_VALUE_THRESHOLD} require ownership verification`,
      minValue: PROOF_REQUIREMENTS.HIGH_VALUE_THRESHOLD,
      documentTypes: ['receipt', 'warranty', 'guarantee'],
      additionalInfo: 'High-value items require additional verification to protect all users.'
    };
  }
  
  // Check medium-value threshold
  if (value >= PROOF_REQUIREMENTS.MEDIUM_VALUE_THRESHOLD) {
    return {
      required: false, // Recommended but not required
      reason: `Recommended for items over $${PROOF_REQUIREMENTS.MEDIUM_VALUE_THRESHOLD}`,
      minValue: PROOF_REQUIREMENTS.MEDIUM_VALUE_THRESHOLD,
      documentTypes: ['receipt', 'warranty'],
      additionalInfo: 'Adding proof of ownership increases booking rates and renter confidence.'
    };
  }
  
  return {
    required: false,
    reason: 'No proof required for this item',
    minValue: 0,
    documentTypes: []
  };
}

/**
 * Get accepted document types with descriptions
 */
export function getDocumentTypes(): Array<{
  type: string;
  label: string;
  description: string;
  examples: string[];
  priority: number;
}> {
  return [
    {
      type: 'receipt',
      label: 'Purchase Receipt',
      description: 'Original receipt or invoice showing purchase',
      examples: ['Store receipt', 'Online order confirmation', 'Credit card statement'],
      priority: 1
    },
    {
      type: 'warranty',
      label: 'Warranty Documentation',
      description: 'Warranty card or registration',
      examples: ['Warranty card', 'Product registration', 'Manufacturer documentation'],
      priority: 2
    },
    {
      type: 'guarantee',
      label: 'Coverage Documentation',
      description: 'GearGrab Guarantee policy or appraisal',
      examples: ['Homeowners coverage', 'Gear GearGrab Guarantee policy', 'Professional appraisal'],
      priority: 3
    },
    {
      type: 'serial_number',
      label: 'Serial Number Photo',
      description: 'Clear photo of serial number or model number',
      examples: ['Serial number plate', 'Model sticker', 'Engraved numbers'],
      priority: 4
    },
    {
      type: 'manual',
      label: 'Owner\'s Manual',
      description: 'Original manual or documentation',
      examples: ['User manual', 'Setup guide', 'Product documentation'],
      priority: 5
    },
    {
      type: 'other',
      label: 'Other Documentation',
      description: 'Any other proof of ownership',
      examples: ['Gift receipt', 'Inheritance documentation', 'Transfer of ownership'],
      priority: 6
    }
  ];
}

/**
 * Validate proof of ownership submission
 */
export function validateProofSubmission(
  documents: ProofDocument[],
  requirement: ProofOfOwnershipRequirement
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!requirement.required) {
    return { valid: true, errors, warnings };
  }
  
  if (documents.length === 0) {
    errors.push('At least one proof document is required');
    return { valid: false, errors, warnings };
  }
  
  // Check for required document types
  const submittedTypes = documents.map(doc => doc.type);
  const hasReceipt = submittedTypes.includes('receipt');
  const hasWarranty = submittedTypes.includes('warranty');
  const hasSerial = submittedTypes.includes('serial_number');
  
  // High-value items need stronger proof
  if (requirement.minValue >= PROOF_REQUIREMENTS.HIGH_VALUE_THRESHOLD) {
    if (!hasReceipt && !hasWarranty) {
      errors.push('High-value items require either a purchase receipt or warranty documentation');
    }
    
    if (!hasSerial) {
      warnings.push('Serial number photo is highly recommended for high-value items');
    }
  }
  
  // Medium-value items need at least one strong document
  if (requirement.minValue >= PROOF_REQUIREMENTS.MEDIUM_VALUE_THRESHOLD) {
    if (!hasReceipt && !hasWarranty && !hasSerial) {
      errors.push('Please provide at least a receipt, warranty, or serial number photo');
    }
  }
  
  // Validate individual documents
  documents.forEach((doc, index) => {
    if (!doc.name || doc.name.trim().length === 0) {
      errors.push(`Document ${index + 1} must have a name`);
    }
    
    if (doc.type === 'other' && (!doc.description || doc.description.trim().length < 10)) {
      errors.push(`"Other" document type requires a detailed description`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create ownership proof submission
 */
export async function createOwnershipProof(
  listingId: string,
  userId: string,
  gearTitle: string,
  gearValue: number,
  documents: ProofDocument[],
  metadata: { ipAddress: string; userAgent: string }
): Promise<string> {
  const proofId = adminFirestore.collection('ownershipProofs').doc().id;
  
  const ownershipProof: Omit<OwnershipProof, 'id'> = {
    listingId,
    userId,
    gearTitle,
    gearValue,
    status: 'pending',
    documents: documents.map(doc => ({
      ...doc,
      uploadedAt: new Date(),
      verified: false
    })),
    verification: {
      submittedAt: new Date()
    },
    metadata: {
      ...metadata,
      submissionHash: generateSubmissionHash(userId, listingId, documents.length)
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Save to Firestore
  await adminFirestore.collection('ownershipProofs').doc(proofId).set({
    ...ownershipProof,
    verification: {
      submittedAt: Timestamp.fromDate(ownershipProof.verification.submittedAt)
    },
    createdAt: Timestamp.fromDate(ownershipProof.createdAt),
    updatedAt: Timestamp.fromDate(ownershipProof.updatedAt),
    documents: ownershipProof.documents.map(doc => ({
      ...doc,
      uploadedAt: Timestamp.fromDate(doc.uploadedAt)
    }))
  });
  
  // Update listing with proof status
  await adminFirestore.collection('listings').doc(listingId).update({
    ownershipProofId: proofId,
    ownershipProofStatus: 'pending',
    ownershipProofSubmittedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  // Create notification for admins
  await adminFirestore.collection('adminNotifications').add({
    type: 'ownership_proof_submitted',
    title: 'New Ownership Proof Submitted',
    message: `${gearTitle} requires ownership verification review`,
    data: {
      proofId,
      listingId,
      userId,
      gearTitle,
      gearValue,
      documentCount: documents.length
    },
    createdAt: Timestamp.now(),
    read: false
  });
  
  return proofId;
}

/**
 * Generate submission hash for integrity verification
 */
function generateSubmissionHash(userId: string, listingId: string, documentCount: number): string {
  const crypto = require('crypto');
  const data = `${userId}:${listingId}:${documentCount}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Get ownership proof status for a listing
 */
export async function getOwnershipProofStatus(listingId: string): Promise<{
  required: boolean;
  status?: string;
  proofId?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
}> {
  try {
    const listingDoc = await adminFirestore.collection('listings').doc(listingId).get();
    
    if (!listingDoc.exists) {
      throw new Error('Listing not found');
    }
    
    const listing = listingDoc.data();
    const requirement = checkProofRequirement(
      listing.category,
      listing.dailyPrice,
      listing.estimatedValue
    );
    
    if (!requirement.required) {
      return { required: false };
    }
    
    if (!listing.ownershipProofId) {
      return { required: true, status: 'not_submitted' };
    }
    
    const proofDoc = await adminFirestore
      .collection('ownershipProofs')
      .doc(listing.ownershipProofId)
      .get();
    
    if (!proofDoc.exists) {
      return { required: true, status: 'not_submitted' };
    }
    
    const proof = proofDoc.data();
    
    return {
      required: true,
      status: proof.status,
      proofId: listing.ownershipProofId,
      submittedAt: proof.verification?.submittedAt?.toDate(),
      reviewedAt: proof.verification?.reviewedAt?.toDate()
    };
    
  } catch (error) {
    console.error('Error getting ownership proof status:', error);
    return { required: false };
  }
}

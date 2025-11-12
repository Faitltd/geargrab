/**
 * User Verification Service
 * Handles user identity verification and document validation
 */

import { firestore } from '$lib/firebase/client';
import { doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';

export const VERIFICATION_REQUIREMENTS = {
  IDENTITY: 'identity',
  ADDRESS: 'address',
  PHONE: 'phone',
  EMAIL: 'email'
};

export const verificationService = {
  getStatus: async (userId) => {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          success: true,
          status: userData.verificationStatus || 'unverified',
          requirements: userData.verificationRequirements || [],
          submittedAt: userData.verificationSubmittedAt,
          completedAt: userData.verificationCompletedAt
        };
      }

      return {
        success: false,
        error: 'User not found'
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  submitDocuments: async (userId, documents) => {
    return VerificationService.submitVerification(userId, documents);
  }
};

export class VerificationService {
  /**
   * Submit verification documents
   * @param {string} userId - User ID
   * @param {Object} documents - Verification documents
   * @returns {Promise<Object>} Verification submission result
   */
  static async submitVerification(userId, documents) {
    try {
      const verificationData = {
        userId,
        documents,
        status: 'pending',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        notes: ''
      };

      // Add verification record
      const verificationRef = await addDoc(
        collection(firestore, 'verifications'),
        verificationData
      );

      // Update user verification status
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date()
      });

      return {
        success: true,
        verificationId: verificationRef.id,
        message: 'Verification documents submitted successfully'
      };
    } catch (error) {
      console.error('Error submitting verification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get verification status for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Verification status
   */
  static async getVerificationStatus(userId) {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const userData = userDoc.data();
      return {
        success: true,
        status: userData.verificationStatus || 'unverified',
        submittedAt: userData.verificationSubmittedAt,
        verifiedAt: userData.verifiedAt
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate document format and requirements
   * @param {File} file - Document file
   * @param {string} type - Document type (id, selfie, etc.)
   * @returns {Object} Validation result
   */
  static validateDocument(file, type) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push('File must be JPEG, PNG, or PDF format');
    }

    // Type-specific validation
    if (type === 'selfie' && file.type === 'application/pdf') {
      errors.push('Selfie must be an image file (JPEG or PNG)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get verification requirements
   * @returns {Object} Verification requirements
   */
  static getVerificationRequirements() {
    return {
      required: [
        {
          type: 'government_id',
          name: 'Government-issued ID',
          description: 'Driver\'s license, passport, or state ID',
          formats: ['JPEG', 'PNG', 'PDF'],
          maxSize: '10MB'
        },
        {
          type: 'selfie',
          name: 'Selfie with ID',
          description: 'Clear photo of yourself holding your ID',
          formats: ['JPEG', 'PNG'],
          maxSize: '10MB'
        }
      ],
      optional: [
        {
          type: 'address_proof',
          name: 'Proof of Address',
          description: 'Utility bill or bank statement (last 3 months)',
          formats: ['JPEG', 'PNG', 'PDF'],
          maxSize: '10MB'
        }
      ],
      guidelines: [
        'All documents must be clear and legible',
        'Photos should be well-lit with no glare',
        'All four corners of documents must be visible',
        'Personal information must be clearly readable',
        'Documents must be current and not expired'
      ]
    };
  }

  /**
   * Check if user meets verification requirements for specific actions
   * @param {Object} user - User object
   * @param {string} action - Action requiring verification
   * @returns {Object} Verification check result
   */
  static checkVerificationRequirement(user, action) {
    const verificationStatus = user?.verificationStatus || 'unverified';
    
    const requirements = {
      'list_gear': ['verified'],
      'book_gear': ['pending', 'verified'],
      'become_guide': ['verified'],
      'high_value_booking': ['verified'] // Bookings over $500
    };

    const requiredStatuses = requirements[action] || [];
    const isVerified = requiredStatuses.includes(verificationStatus);

    return {
      verified: isVerified,
      currentStatus: verificationStatus,
      requiredStatuses,
      message: isVerified 
        ? 'Verification requirements met'
        : `This action requires verification. Current status: ${verificationStatus}`
    };
  }
}

export default VerificationService;

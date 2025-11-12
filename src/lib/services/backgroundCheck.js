/**
 * Background Check Service
 * Handles background check requests and verification
 */

import { firestore } from '$lib/firebase/client';
import { doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';

export const backgroundCheckService = {
  requestCheck: async (userId, checkData) => {
    return BackgroundCheckService.requestBackgroundCheck(userId, checkData);
  },

  getStatus: async (userId) => {
    return BackgroundCheckService.getBackgroundCheckStatus(userId);
  },

  getResults: async (checkId) => {
    return BackgroundCheckService.getBackgroundCheckResults(checkId);
  }
};

export class BackgroundCheckService {
  /**
   * Request a background check for a user
   * @param {string} userId - User ID
   * @param {Object} checkData - Background check data
   * @returns {Promise<Object>} Background check request result
   */
  static async requestBackgroundCheck(userId, checkData) {
    try {
      const backgroundCheckData = {
        userId,
        ...checkData,
        status: 'pending',
        requestedAt: new Date(),
        completedAt: null,
        results: null,
        provider: 'checkr', // Example provider
        checkId: null
      };

      // Add background check record
      const checkRef = await addDoc(
        collection(firestore, 'backgroundChecks'),
        backgroundCheckData
      );

      // Update user background check status
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        backgroundCheckStatus: 'pending',
        backgroundCheckRequestedAt: new Date(),
        backgroundCheckId: checkRef.id
      });

      return {
        success: true,
        checkId: checkRef.id,
        message: 'Background check requested successfully'
      };
    } catch (error) {
      console.error('Error requesting background check:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get background check status for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Background check status
   */
  static async getBackgroundCheckStatus(userId) {
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
        status: userData.backgroundCheckStatus || 'not_requested',
        requestedAt: userData.backgroundCheckRequestedAt,
        completedAt: userData.backgroundCheckCompletedAt,
        checkId: userData.backgroundCheckId
      };
    } catch (error) {
      console.error('Error getting background check status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate background check requirements
   * @param {Object} checkData - Background check data to validate
   * @returns {Object} Validation result
   */
  static validateBackgroundCheckData(checkData) {
    const errors = [];
    const required = ['firstName', 'lastName', 'dateOfBirth', 'ssn', 'address'];

    // Check required fields
    required.forEach(field => {
      if (!checkData[field]) {
        errors.push(`${field} is required`);
      }
    });

    // Validate date of birth (must be 18+)
    if (checkData.dateOfBirth) {
      const birthDate = new Date(checkData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18) {
        errors.push('Must be 18 years or older');
      }
    }

    // Validate SSN format (basic check)
    if (checkData.ssn && !/^\d{3}-?\d{2}-?\d{4}$/.test(checkData.ssn)) {
      errors.push('Invalid SSN format');
    }

    // Validate address
    if (checkData.address) {
      const requiredAddressFields = ['street', 'city', 'state', 'zipCode'];
      requiredAddressFields.forEach(field => {
        if (!checkData.address[field]) {
          errors.push(`Address ${field} is required`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get background check requirements and information
   * @returns {Object} Background check requirements
   */
  static getBackgroundCheckRequirements() {
    return {
      required: [
        {
          field: 'firstName',
          name: 'First Name',
          description: 'Legal first name as it appears on government ID'
        },
        {
          field: 'lastName',
          name: 'Last Name',
          description: 'Legal last name as it appears on government ID'
        },
        {
          field: 'dateOfBirth',
          name: 'Date of Birth',
          description: 'Must be 18 years or older'
        },
        {
          field: 'ssn',
          name: 'Social Security Number',
          description: 'Required for identity verification'
        },
        {
          field: 'address',
          name: 'Current Address',
          description: 'Current residential address'
        }
      ],
      process: [
        'Submit required personal information',
        'Background check is initiated with our trusted provider',
        'Results are typically available within 1-3 business days',
        'You will be notified via email when results are ready',
        'Approved users can access enhanced features'
      ],
      coverage: [
        'Criminal history check',
        'Sex offender registry check',
        'Identity verification',
        'Address verification',
        'Social Security number verification'
      ],
      privacy: [
        'All information is encrypted and securely stored',
        'Background check data is only used for verification purposes',
        'Information is not shared with other users',
        'You can request deletion of your data at any time'
      ]
    };
  }

  /**
   * Check if user meets background check requirements for specific actions
   * @param {Object} user - User object
   * @param {string} action - Action requiring background check
   * @returns {Object} Background check requirement result
   */
  static checkBackgroundCheckRequirement(user, action) {
    const backgroundCheckStatus = user?.backgroundCheckStatus || 'not_requested';
    
    const requirements = {
      'list_high_value_gear': ['approved'], // Gear over $1000
      'become_guide': ['approved'],
      'host_events': ['approved'],
      'verified_member': ['approved']
    };

    const requiredStatuses = requirements[action] || [];
    const meetsRequirement = requiredStatuses.includes(backgroundCheckStatus);

    return {
      meetsRequirement,
      currentStatus: backgroundCheckStatus,
      requiredStatuses,
      message: meetsRequirement 
        ? 'Background check requirements met'
        : `This action requires an approved background check. Current status: ${backgroundCheckStatus}`
    };
  }

  /**
   * Simulate background check processing (for demo purposes)
   * @param {string} checkId - Background check ID
   * @returns {Promise<Object>} Processing result
   */
  static async simulateBackgroundCheckProcessing(checkId) {
    try {
      // In a real implementation, this would integrate with a background check provider
      // For demo purposes, we'll simulate a successful check
      
      const checkRef = doc(firestore, 'backgroundChecks', checkId);
      const results = {
        criminal: 'clear',
        identity: 'verified',
        address: 'verified',
        overall: 'approved',
        completedAt: new Date()
      };

      await updateDoc(checkRef, {
        status: 'completed',
        results,
        completedAt: new Date()
      });

      return {
        success: true,
        results,
        message: 'Background check completed successfully'
      };
    } catch (error) {
      console.error('Error processing background check:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default BackgroundCheckService;

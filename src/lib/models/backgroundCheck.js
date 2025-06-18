/**
 * Background Check Data Model
 * FCRA-compliant data storage for background check records
 */

import { adminFirestore } from '$lib/firebase/server';

export class BackgroundCheckRecord {
  constructor(data) {
    this.userId = data.userId || null; // null until approved
    this.checkrReportId = data.checkrReportId;
    this.checkrCandidateId = data.checkrCandidateId;
    this.status = data.status; // 'pending', 'clear', 'pending_adverse', 'final_adverse'
    this.checkDate = data.checkDate || new Date();
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.consentTimestamp = data.consentTimestamp;
    this.consentIp = data.consentIp;
    this.consentUserAgent = data.consentUserAgent;
    this.reportPdfUrl = data.reportPdfUrl || null;
    this.preAdverseSent = data.preAdverseSent || false;
    this.preAdverseSentAt = data.preAdverseSentAt || null;
    this.finalAdverseSent = data.finalAdverseSent || false;
    this.finalAdverseSentAt = data.finalAdverseSentAt || null;
    this.decision = data.decision || null; // Decision object from Checkr
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Save background check record to Firestore
   * @returns {Promise<string>} Document ID
   */
  async save() {
    try {
      this.updatedAt = new Date();
      
      const docRef = await adminFirestore
        .collection('backgroundChecks')
        .add(this.toFirestore());
      
      console.log('Background check record saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving background check record:', error);
      throw error;
    }
  }

  /**
   * Update existing background check record
   * @param {string} docId - Document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  static async update(docId, updates) {
    try {
      updates.updatedAt = new Date();
      
      await adminFirestore
        .collection('backgroundChecks')
        .doc(docId)
        .update(updates);
      
      console.log('Background check record updated:', docId);
    } catch (error) {
      console.error('Error updating background check record:', error);
      throw error;
    }
  }

  /**
   * Find background check record by Checkr report ID
   * @param {string} reportId - Checkr report ID
   * @returns {Promise<Object|null>} Background check record
   */
  static async findByReportId(reportId) {
    try {
      const snapshot = await adminFirestore
        .collection('backgroundChecks')
        .where('checkrReportId', '==', reportId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error finding background check by report ID:', error);
      throw error;
    }
  }

  /**
   * Find background check record by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} Background check record
   */
  static async findByEmail(email) {
    try {
      const snapshot = await adminFirestore
        .collection('backgroundChecks')
        .where('email', '==', email)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error finding background check by email:', error);
      throw error;
    }
  }

  /**
   * Find records pending final adverse action
   * @param {number} daysAgo - Number of days ago to check
   * @returns {Promise<Array>} Array of records
   */
  static async findPendingFinalAdverse(daysAgo = 5) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      const snapshot = await adminFirestore
        .collection('backgroundChecks')
        .where('status', '==', 'pending_adverse')
        .where('finalAdverseSent', '==', false)
        .where('preAdverseSentAt', '<=', cutoffDate)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error finding pending final adverse records:', error);
      throw error;
    }
  }

  /**
   * Find records for data purge (older than specified days)
   * @param {number} daysAgo - Number of days ago to check
   * @returns {Promise<Array>} Array of records to purge
   */
  static async findRecordsForPurge(daysAgo = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      const snapshot = await adminFirestore
        .collection('backgroundChecks')
        .where('checkDate', '<=', cutoffDate)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error finding records for purge:', error);
      throw error;
    }
  }

  /**
   * Purge sensitive data from old records
   * @param {string} docId - Document ID
   * @returns {Promise<void>}
   */
  static async purgeSensitiveData(docId) {
    try {
      const updates = {
        reportPdfUrl: null,
        firstName: null,
        lastName: null,
        consentIp: null,
        consentUserAgent: null,
        metadata: {},
        purgedAt: new Date(),
        updatedAt: new Date()
      };

      await adminFirestore
        .collection('backgroundChecks')
        .doc(docId)
        .update(updates);

      console.log('Sensitive data purged for record:', docId);
    } catch (error) {
      console.error('Error purging sensitive data:', error);
      throw error;
    }
  }

  /**
   * Get statistics for admin dashboard
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics() {
    try {
      const snapshot = await adminFirestore
        .collection('backgroundChecks')
        .get();

      const stats = {
        total: 0,
        clear: 0,
        pending: 0,
        pendingAdverse: 0,
        finalAdverse: 0,
        last30Days: 0
      };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        stats.total++;

        switch (data.status) {
          case 'clear':
            stats.clear++;
            break;
          case 'pending':
            stats.pending++;
            break;
          case 'pending_adverse':
            stats.pendingAdverse++;
            break;
          case 'final_adverse':
            stats.finalAdverse++;
            break;
        }

        if (data.checkDate && data.checkDate.toDate() > thirtyDaysAgo) {
          stats.last30Days++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting background check statistics:', error);
      throw error;
    }
  }

  /**
   * Convert to Firestore format
   * @returns {Object} Firestore-compatible object
   */
  toFirestore() {
    return {
      userId: this.userId,
      checkrReportId: this.checkrReportId,
      checkrCandidateId: this.checkrCandidateId,
      status: this.status,
      checkDate: this.checkDate,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      consentTimestamp: this.consentTimestamp,
      consentIp: this.consentIp,
      consentUserAgent: this.consentUserAgent,
      reportPdfUrl: this.reportPdfUrl,
      preAdverseSent: this.preAdverseSent,
      preAdverseSentAt: this.preAdverseSentAt,
      finalAdverseSent: this.finalAdverseSent,
      finalAdverseSentAt: this.finalAdverseSentAt,
      decision: this.decision,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Validate required fields for FCRA compliance
   * @returns {Array} Array of validation errors
   */
  validate() {
    const errors = [];

    if (!this.email) errors.push('Email is required');
    if (!this.firstName) errors.push('First name is required');
    if (!this.lastName) errors.push('Last name is required');
    if (!this.consentTimestamp) errors.push('Consent timestamp is required');
    if (!this.consentIp) errors.push('Consent IP address is required');
    if (!this.checkrReportId) errors.push('Checkr report ID is required');

    return errors;
  }
}

export default BackgroundCheckRecord;

/**
 * FCRA Final Adverse Notice Cron Job
 * Sends final adverse action notices after 5 business days as required by FCRA
 */

import cron from 'node-cron';
import { fcraNoticeService } from '$lib/utils/fcra-notices.js';
import { BackgroundCheckRecord } from '$lib/models/backgroundCheck.js';
// import { fetchReport } from '$lib/utils/i-prospect-check-client.js';

class FinalAdverseNoticeJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.jobStats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      noticesSent: 0,
      errors: []
    };
  }

  /**
   * Start the cron job
   * Runs daily at 2:00 AM
   */
  start() {
    console.log('Starting Final Adverse Notice cron job...');
    
    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      await this.runJob();
    }, {
      timezone: 'America/New_York' // Adjust timezone as needed
    });

    console.log('Final Adverse Notice cron job scheduled to run daily at 2:00 AM');
  }

  /**
   * Run the job manually (for testing)
   */
  async runJob() {
    if (this.isRunning) {
      console.log('Final adverse notice job already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    this.jobStats.totalRuns++;

    console.log('Starting final adverse notice job run at:', this.lastRun.toISOString());

    try {
      // Find records that need final adverse notices
      const pendingRecords = await this.findRecordsNeedingFinalNotice();
      
      console.log(`Found ${pendingRecords.length} records needing final adverse notices`);

      if (pendingRecords.length === 0) {
        console.log('No final adverse notices to send');
        this.jobStats.successfulRuns++;
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each record
      for (const record of pendingRecords) {
        try {
          await this.sendFinalAdverseNotice(record);
          successCount++;
          this.jobStats.noticesSent++;
        } catch (error) {
          console.error(`Failed to send final adverse notice for record ${record.id}:`, error);
          this.jobStats.errors.push({
            recordId: record.id,
            email: record.email,
            error: error.message,
            timestamp: new Date()
          });
          errorCount++;
        }

        // Add small delay between emails to avoid rate limiting
        await this.delay(1000);
      }

      console.log(`Final adverse notice job completed: ${successCount} sent, ${errorCount} failed`);
      
      if (errorCount === 0) {
        this.jobStats.successfulRuns++;
      } else {
        this.jobStats.failedRuns++;
      }

    } catch (error) {
      console.error('Final adverse notice job failed:', error);
      this.jobStats.failedRuns++;
      this.jobStats.errors.push({
        type: 'job_failure',
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Find records that need final adverse notices
   * @returns {Promise<Array>} Records needing final notices
   */
  async findRecordsNeedingFinalNotice() {
    try {
      // Calculate 5 business days ago
      const fiveBusinessDaysAgo = this.calculateBusinessDaysAgo(5);
      
      console.log('Looking for records with pre-adverse notices sent before:', fiveBusinessDaysAgo.toISOString());

      // Find records that:
      // 1. Have status 'pending_adverse'
      // 2. Had pre-adverse notice sent at least 5 business days ago
      // 3. Have not yet had final adverse notice sent
      const records = await BackgroundCheckRecord.findPendingFinalAdverse(5);
      
      // Filter by business days (more precise calculation)
      const filteredRecords = records.filter(record => {
        if (!record.preAdverseSentAt) return false;
        
        const sentDate = record.preAdverseSentAt.toDate ? record.preAdverseSentAt.toDate() : new Date(record.preAdverseSentAt);
        const businessDaysElapsed = this.calculateBusinessDaysBetween(sentDate, new Date());
        
        return businessDaysElapsed >= 5;
      });

      console.log(`Filtered to ${filteredRecords.length} records that meet business day criteria`);
      
      return filteredRecords;

    } catch (error) {
      console.error('Error finding records needing final notice:', error);
      throw error;
    }
  }

  /**
   * Send final adverse notice for a record
   * @param {Object} record - Background check record
   */
  async sendFinalAdverseNotice(record) {
    try {
      console.log(`Sending final adverse notice to: ${record.email} (Record: ${record.id})`);

      // Send the final adverse notice
      await fcraNoticeService.sendFinalAdverseNotice(
        record.email,
        record.reportPdfUrl || `https://dashboard.checkr.com/reports/${record.checkrReportId}`,
        {
          firstName: record.firstName,
          lastName: record.lastName
        }
      );

      // Update the record to mark final adverse notice as sent
      await BackgroundCheckRecord.update(record.id, {
        finalAdverseSent: true,
        finalAdverseSentAt: new Date(),
        status: 'final_adverse'
      });

      console.log(`Final adverse notice sent successfully to: ${record.email}`);

    } catch (error) {
      console.error(`Failed to send final adverse notice to ${record.email}:`, error);
      
      // Update record to indicate failure
      await BackgroundCheckRecord.update(record.id, {
        finalAdverseError: error.message,
        finalAdverseErrorAt: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Calculate business days between two dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Number of business days
   */
  calculateBusinessDaysBetween(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    
    while (current < endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  /**
   * Calculate date that is N business days ago
   * @param {number} businessDays - Number of business days
   * @returns {Date} Date N business days ago
   */
  calculateBusinessDaysAgo(businessDays) {
    const date = new Date();
    let daysSubtracted = 0;
    
    while (daysSubtracted < businessDays) {
      date.setDate(date.getDate() - 1);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        daysSubtracted++;
      }
    }
    
    return date;
  }

  /**
   * Add delay for rate limiting
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get job statistics
   * @returns {Object} Job statistics
   */
  getStats() {
    return {
      ...this.jobStats,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.getNextRunTime()
    };
  }

  /**
   * Get next scheduled run time
   * @returns {Date} Next run time
   */
  getNextRunTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2:00 AM
    
    // If it's already past 2 AM today, next run is tomorrow
    if (now.getHours() >= 2) {
      return tomorrow;
    } else {
      // Next run is today at 2 AM
      const today = new Date(now);
      today.setHours(2, 0, 0, 0);
      return today;
    }
  }

  /**
   * Clear error history (for maintenance)
   */
  clearErrors() {
    this.jobStats.errors = [];
    console.log('Job error history cleared');
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.jobStats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      noticesSent: 0,
      errors: []
    };
    console.log('Job statistics reset');
  }
}

// Export singleton instance
export const finalAdverseNoticeJob = new FinalAdverseNoticeJob();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  finalAdverseNoticeJob.start();
  console.log('Final adverse notice cron job started automatically in production mode');
}

export default finalAdverseNoticeJob;

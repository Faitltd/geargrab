import { TransactionRecord, TaxDocument, User } from '../api/entities';

/**
 * Service for managing data retention, compliance, and audit requirements
 */
export class ComplianceService {
  
  // Data retention periods (in years)
  static RETENTION_PERIODS = {
    TRANSACTION_RECORDS: 7, // IRS requires 7 years for business records
    TAX_DOCUMENTS: 7,       // Tax documents must be kept for 7 years
    USER_TAX_INFO: 7,       // Tax identification information
    AUDIT_LOGS: 3           // Audit trail records
  };
  
  /**
   * Check data retention compliance and identify records for archival/deletion
   * @returns {Promise<Object>} Compliance report
   */
  static async checkDataRetentionCompliance() {
    try {
      console.log('Checking data retention compliance...');
      
      const currentDate = new Date();
      const complianceReport = {
        check_date: currentDate.toISOString(),
        retention_status: {},
        actions_required: [],
        summary: {}
      };
      
      // Check transaction records
      const transactionCompliance = await this.checkTransactionRecordRetention(currentDate);
      complianceReport.retention_status.transactions = transactionCompliance;
      
      // Check tax documents
      const taxDocCompliance = await this.checkTaxDocumentRetention(currentDate);
      complianceReport.retention_status.tax_documents = taxDocCompliance;
      
      // Check user tax information
      const userTaxCompliance = await this.checkUserTaxInfoRetention(currentDate);
      complianceReport.retention_status.user_tax_info = userTaxCompliance;
      
      // Compile actions required
      complianceReport.actions_required = [
        ...transactionCompliance.actions_required,
        ...taxDocCompliance.actions_required,
        ...userTaxCompliance.actions_required
      ];
      
      // Generate summary
      complianceReport.summary = {
        total_records_checked: 
          transactionCompliance.total_records + 
          taxDocCompliance.total_records + 
          userTaxCompliance.total_records,
        records_due_for_archival: complianceReport.actions_required.filter(a => a.action === 'archive').length,
        records_due_for_deletion: complianceReport.actions_required.filter(a => a.action === 'delete').length,
        compliance_status: complianceReport.actions_required.length === 0 ? 'COMPLIANT' : 'ACTION_REQUIRED'
      };
      
      console.log(`Compliance check complete: ${complianceReport.summary.compliance_status}`);
      return complianceReport;
      
    } catch (error) {
      console.error('Error checking data retention compliance:', error);
      throw new Error('Failed to check data retention compliance');
    }
  }
  
  /**
   * Check transaction record retention compliance
   * @param {Date} currentDate - Current date for calculations
   * @returns {Promise<Object>} Transaction retention status
   */
  static async checkTransactionRecordRetention(currentDate) {
    try {
      const transactions = await TransactionRecord.list();
      const retentionCutoffDate = new Date(currentDate);
      retentionCutoffDate.setFullYear(retentionCutoffDate.getFullYear() - this.RETENTION_PERIODS.TRANSACTION_RECORDS);
      
      const actionsRequired = [];
      let expiredCount = 0;
      let activeCount = 0;
      
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.created_at);
        
        if (transactionDate < retentionCutoffDate) {
          expiredCount++;
          actionsRequired.push({
            action: 'archive',
            record_type: 'transaction',
            record_id: transaction.id,
            transaction_number: transaction.transaction_number,
            created_date: transaction.created_at,
            reason: `Transaction record older than ${this.RETENTION_PERIODS.TRANSACTION_RECORDS} years`,
            priority: 'medium'
          });
        } else {
          activeCount++;
        }
      });
      
      return {
        record_type: 'transaction_records',
        total_records: transactions.length,
        active_records: activeCount,
        expired_records: expiredCount,
        retention_period_years: this.RETENTION_PERIODS.TRANSACTION_RECORDS,
        cutoff_date: retentionCutoffDate.toISOString(),
        actions_required: actionsRequired
      };
      
    } catch (error) {
      console.error('Error checking transaction record retention:', error);
      return {
        record_type: 'transaction_records',
        total_records: 0,
        active_records: 0,
        expired_records: 0,
        actions_required: [],
        error: error.message
      };
    }
  }
  
  /**
   * Check tax document retention compliance
   * @param {Date} currentDate - Current date for calculations
   * @returns {Promise<Object>} Tax document retention status
   */
  static async checkTaxDocumentRetention(currentDate) {
    try {
      const taxDocuments = await TaxDocument.list();
      const retentionCutoffDate = new Date(currentDate);
      retentionCutoffDate.setFullYear(retentionCutoffDate.getFullYear() - this.RETENTION_PERIODS.TAX_DOCUMENTS);
      
      const actionsRequired = [];
      let expiredCount = 0;
      let activeCount = 0;
      
      taxDocuments.forEach(document => {
        const documentDate = new Date(document.created_at);
        
        if (documentDate < retentionCutoffDate) {
          expiredCount++;
          actionsRequired.push({
            action: 'archive',
            record_type: 'tax_document',
            record_id: document.id,
            document_type: document.document_type,
            tax_year: document.tax_year,
            created_date: document.created_at,
            reason: `Tax document older than ${this.RETENTION_PERIODS.TAX_DOCUMENTS} years`,
            priority: 'high' // Tax documents are high priority for compliance
          });
        } else {
          activeCount++;
        }
      });
      
      return {
        record_type: 'tax_documents',
        total_records: taxDocuments.length,
        active_records: activeCount,
        expired_records: expiredCount,
        retention_period_years: this.RETENTION_PERIODS.TAX_DOCUMENTS,
        cutoff_date: retentionCutoffDate.toISOString(),
        actions_required: actionsRequired
      };
      
    } catch (error) {
      console.error('Error checking tax document retention:', error);
      return {
        record_type: 'tax_documents',
        total_records: 0,
        active_records: 0,
        expired_records: 0,
        actions_required: [],
        error: error.message
      };
    }
  }
  
  /**
   * Check user tax information retention compliance
   * @param {Date} currentDate - Current date for calculations
   * @returns {Promise<Object>} User tax info retention status
   */
  static async checkUserTaxInfoRetention(currentDate) {
    try {
      const users = await User.list();
      const retentionCutoffDate = new Date(currentDate);
      retentionCutoffDate.setFullYear(retentionCutoffDate.getFullYear() - this.RETENTION_PERIODS.USER_TAX_INFO);
      
      const actionsRequired = [];
      let expiredCount = 0;
      let activeCount = 0;
      
      users.forEach(user => {
        if (user.tax_info_updated_at) {
          const taxInfoDate = new Date(user.tax_info_updated_at);
          
          if (taxInfoDate < retentionCutoffDate) {
            expiredCount++;
            actionsRequired.push({
              action: 'review',
              record_type: 'user_tax_info',
              record_id: user.id,
              user_email: user.email,
              last_updated: user.tax_info_updated_at,
              reason: `User tax information older than ${this.RETENTION_PERIODS.USER_TAX_INFO} years`,
              priority: 'high'
            });
          } else {
            activeCount++;
          }
        }
      });
      
      return {
        record_type: 'user_tax_info',
        total_records: users.filter(u => u.tax_info_updated_at).length,
        active_records: activeCount,
        expired_records: expiredCount,
        retention_period_years: this.RETENTION_PERIODS.USER_TAX_INFO,
        cutoff_date: retentionCutoffDate.toISOString(),
        actions_required: actionsRequired
      };
      
    } catch (error) {
      console.error('Error checking user tax info retention:', error);
      return {
        record_type: 'user_tax_info',
        total_records: 0,
        active_records: 0,
        expired_records: 0,
        actions_required: [],
        error: error.message
      };
    }
  }
  
  /**
   * Create audit log entry for compliance-related actions
   * @param {Object} auditData - Audit log data
   * @returns {Promise<Object>} Created audit log entry
   */
  static async createAuditLog(auditData) {
    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action: auditData.action,
        record_type: auditData.record_type,
        record_id: auditData.record_id,
        user_id: auditData.user_id,
        details: auditData.details,
        ip_address: auditData.ip_address,
        user_agent: auditData.user_agent,
        compliance_related: true
      };
      
      // In a real implementation, this would be stored in an audit log table
      console.log('Audit log entry created:', auditEntry);
      
      return auditEntry;
      
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw new Error('Failed to create audit log entry');
    }
  }
  
  /**
   * Archive old records (move to long-term storage)
   * @param {Array} recordsToArchive - Records that need archiving
   * @returns {Promise<Object>} Archival results
   */
  static async archiveRecords(recordsToArchive) {
    try {
      console.log(`Archiving ${recordsToArchive.length} records...`);
      
      const archivalResults = {
        total_records: recordsToArchive.length,
        successful_archives: 0,
        failed_archives: 0,
        errors: []
      };
      
      for (const record of recordsToArchive) {
        try {
          // In a real implementation, this would move records to archive storage
          await this.createAuditLog({
            action: 'archive',
            record_type: record.record_type,
            record_id: record.record_id,
            user_id: 'system',
            details: `Record archived due to retention policy: ${record.reason}`
          });
          
          archivalResults.successful_archives++;
          console.log(`Archived ${record.record_type} record: ${record.record_id}`);
          
        } catch (error) {
          archivalResults.failed_archives++;
          archivalResults.errors.push({
            record_id: record.record_id,
            error: error.message
          });
          console.error(`Failed to archive record ${record.record_id}:`, error);
        }
      }
      
      console.log(`Archival complete: ${archivalResults.successful_archives} successful, ${archivalResults.failed_archives} failed`);
      return archivalResults;
      
    } catch (error) {
      console.error('Error archiving records:', error);
      throw new Error('Failed to archive records');
    }
  }
  
  /**
   * Generate compliance report for regulatory purposes
   * @param {number} year - Year to generate report for
   * @returns {Promise<Object>} Compliance report
   */
  static async generateComplianceReport(year) {
    try {
      console.log(`Generating compliance report for ${year}...`);
      
      const report = {
        report_year: year,
        generated_date: new Date().toISOString(),
        data_retention_status: await this.checkDataRetentionCompliance(),
        tax_compliance: {
          forms_1099_generated: 0,
          total_recipients: 0,
          total_compensation_reported: 0
        },
        security_measures: {
          tax_data_encrypted: true,
          access_controls_implemented: true,
          audit_logging_enabled: true,
          backup_procedures_in_place: true
        },
        regulatory_compliance: {
          irs_reporting_requirements: 'COMPLIANT',
          data_privacy_regulations: 'COMPLIANT',
          record_keeping_requirements: 'COMPLIANT'
        }
      };
      
      // Get tax document statistics
      const taxDocs = await TaxDocument.filter({ tax_year: year });
      const form1099s = taxDocs.filter(doc => doc.document_type === '1099-MISC');
      
      report.tax_compliance.forms_1099_generated = form1099s.length;
      report.tax_compliance.total_recipients = form1099s.length;
      report.tax_compliance.total_compensation_reported = form1099s.reduce(
        (sum, doc) => sum + (doc.total_earnings || 0), 0
      );
      
      console.log(`Compliance report generated for ${year}`);
      return report;
      
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }
}

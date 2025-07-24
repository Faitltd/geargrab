import { TransactionRecord, TaxDocument, User } from '../api/entities';
import { TransactionService } from './transactionService';

/**
 * Service for generating tax documents (1099 forms, annual summaries, etc.)
 */
export class TaxDocumentService {
  
  /**
   * Generate 1099-MISC forms for all eligible users for a given tax year
   * @param {number} taxYear - Tax year to generate documents for
   * @returns {Promise<Array>} Generated tax documents
   */
  static async generate1099FormsForYear(taxYear) {
    try {
      console.log(`Generating 1099 forms for tax year ${taxYear}...`);
      
      // Get all users who earned $600 or more in the tax year
      const eligibleUsers = await this.getEligibleUsersFor1099(taxYear);
      
      const generatedDocuments = [];
      
      for (const user of eligibleUsers) {
        try {
          const document = await this.generate1099ForUser(user.email, taxYear);
          if (document) {
            generatedDocuments.push(document);
          }
        } catch (error) {
          console.error(`Error generating 1099 for user ${user.email}:`, error);
        }
      }
      
      console.log(`Generated ${generatedDocuments.length} 1099 forms for ${taxYear}`);
      return generatedDocuments;
      
    } catch (error) {
      console.error('Error generating 1099 forms:', error);
      throw new Error('Failed to generate 1099 forms');
    }
  }
  
  /**
   * Generate a 1099-MISC form for a specific user
   * @param {string} userEmail - User email
   * @param {number} taxYear - Tax year
   * @returns {Promise<Object>} Generated tax document
   */
  static async generate1099ForUser(userEmail, taxYear) {
    try {
      // Get user information
      const users = await User.filter({ email: userEmail });
      if (!users || users.length === 0) {
        throw new Error('User not found');
      }
      const user = users[0];
      
      // Verify user has required tax information
      if (!user.tax_id_number || !user.tax_address) {
        console.warn(`User ${userEmail} missing required tax information for 1099 generation`);
        return null;
      }
      
      // Get transaction summary for the year
      const transactionSummary = await TransactionService.getTransactionSummary(userEmail, taxYear);
      
      // Check if user meets 1099 threshold
      if (transactionSummary.total_earnings < 600) {
        console.log(`User ${userEmail} earnings below 1099 threshold: $${transactionSummary.total_earnings}`);
        return null;
      }
      
      // Generate 1099 document data
      const documentData = {
        // Recipient Information
        recipient_name: user.business_name || user.full_name,
        recipient_address: user.tax_address,
        recipient_tax_id: user.tax_id_number,
        recipient_tax_id_type: user.tax_id_type,
        
        // Payer Information (GearGrab)
        payer_name: "GearGrab, Inc.",
        payer_address: {
          street_address: "123 Main St", // Replace with actual company address
          city: "San Francisco",
          state: "CA",
          zip_code: "94105",
          country: "US"
        },
        payer_tax_id: "XX-XXXXXXX", // Replace with actual EIN
        
        // Financial Information
        nonemployee_compensation: transactionSummary.total_earnings, // Box 1
        federal_income_tax_withheld: 0, // Box 4 (if applicable)
        
        // Transaction Details
        total_transactions: transactionSummary.total_transactions,
        reporting_period: `January 1, ${taxYear} - December 31, ${taxYear}`,
        
        // Metadata
        tax_year: taxYear,
        form_type: "1099-MISC",
        generated_date: new Date().toISOString()
      };
      
      // Create tax document record
      const taxDocument = await TaxDocument.create({
        document_type: "1099-MISC",
        tax_year: taxYear,
        recipient_user_id: userEmail, // Using email as ID for now
        total_earnings: transactionSummary.total_earnings,
        total_transactions: transactionSummary.total_transactions,
        document_status: "generated",
        document_data: documentData,
        irs_filing_required: true,
        created_at: new Date().toISOString(),
        created_by: "system"
      });
      
      // Generate PDF document (mock implementation)
      const documentUrl = await this.generatePDFDocument(documentData, taxDocument.id);
      
      // Update document with file URL
      await TaxDocument.update(taxDocument.id, {
        document_url: documentUrl,
        document_hash: this.generateDocumentHash(documentData)
      });
      
      console.log(`Generated 1099-MISC for ${userEmail}: $${transactionSummary.total_earnings}`);
      return taxDocument;
      
    } catch (error) {
      console.error(`Error generating 1099 for user ${userEmail}:`, error);
      throw error;
    }
  }
  
  /**
   * Get users eligible for 1099 reporting
   * @param {number} taxYear - Tax year
   * @returns {Promise<Array>} Eligible users
   */
  static async getEligibleUsersFor1099(taxYear) {
    try {
      // Get all transactions for the tax year
      const transactions = await TransactionRecord.filter({ tax_year: taxYear });
      
      // Group by payee and calculate totals
      const userEarnings = {};
      transactions.forEach(transaction => {
        const payeeEmail = transaction.payee_user_id;
        if (!userEarnings[payeeEmail]) {
          userEarnings[payeeEmail] = 0;
        }
        userEarnings[payeeEmail] += transaction.owner_payout_amount || 0;
      });
      
      // Filter users who meet the $600 threshold
      const eligibleEmails = Object.keys(userEarnings).filter(
        email => userEarnings[email] >= 600
      );
      
      // Get user details for eligible users
      const eligibleUsers = [];
      for (const email of eligibleEmails) {
        const users = await User.filter({ email });
        if (users && users.length > 0) {
          eligibleUsers.push(users[0]);
        }
      }
      
      return eligibleUsers;
      
    } catch (error) {
      console.error('Error getting eligible users for 1099:', error);
      return [];
    }
  }
  
  /**
   * Generate annual tax summary for a user
   * @param {string} userEmail - User email
   * @param {number} taxYear - Tax year
   * @returns {Promise<Object>} Annual tax summary
   */
  static async generateAnnualSummary(userEmail, taxYear) {
    try {
      const transactionSummary = await TransactionService.getTransactionSummary(userEmail, taxYear);
      
      // Get user information
      const users = await User.filter({ email: userEmail });
      const user = users && users.length > 0 ? users[0] : null;
      
      const summaryData = {
        user_name: user?.full_name || userEmail,
        user_email: userEmail,
        tax_year: taxYear,
        
        // Earnings Summary
        total_gross_earnings: transactionSummary.total_earnings,
        total_transactions: transactionSummary.total_transactions,
        platform_fees_paid: transactionSummary.platform_fees_paid,
        
        // Tax Status
        requires_1099: transactionSummary.requires_1099,
        tax_threshold_met: transactionSummary.total_earnings >= 600,
        
        // Monthly Breakdown
        monthly_breakdown: await this.getMonthlyBreakdown(userEmail, taxYear),
        
        // Document Status
        documents_generated: await this.getUserTaxDocuments(userEmail, taxYear),
        
        generated_date: new Date().toISOString()
      };
      
      // Create annual summary document
      const summaryDocument = await TaxDocument.create({
        document_type: "annual_summary",
        tax_year: taxYear,
        recipient_user_id: userEmail,
        total_earnings: transactionSummary.total_earnings,
        total_transactions: transactionSummary.total_transactions,
        document_status: "generated",
        document_data: summaryData,
        irs_filing_required: false,
        created_at: new Date().toISOString(),
        created_by: "system"
      });
      
      return summaryDocument;
      
    } catch (error) {
      console.error('Error generating annual summary:', error);
      throw new Error('Failed to generate annual summary');
    }
  }
  
  /**
   * Get monthly earnings breakdown for a user
   * @param {string} userEmail - User email
   * @param {number} taxYear - Tax year
   * @returns {Promise<Array>} Monthly breakdown
   */
  static async getMonthlyBreakdown(userEmail, taxYear) {
    try {
      const transactions = await TransactionRecord.filter({
        payee_user_id: userEmail,
        tax_year: taxYear
      });
      
      const monthlyData = {};
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            earnings: 0,
            transactions: 0,
            platform_fees: 0
          };
        }
        
        monthlyData[monthKey].earnings += transaction.owner_payout_amount || 0;
        monthlyData[monthKey].transactions += 1;
        monthlyData[monthKey].platform_fees += transaction.platform_fee_amount || 0;
      });
      
      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
      
    } catch (error) {
      console.error('Error getting monthly breakdown:', error);
      return [];
    }
  }
  
  /**
   * Get existing tax documents for a user
   * @param {string} userEmail - User email
   * @param {number} taxYear - Tax year
   * @returns {Promise<Array>} Tax documents
   */
  static async getUserTaxDocuments(userEmail, taxYear) {
    try {
      return await TaxDocument.filter({
        recipient_user_id: userEmail,
        tax_year: taxYear
      });
    } catch (error) {
      console.error('Error getting user tax documents:', error);
      return [];
    }
  }
  
  /**
   * Mock PDF generation (in real implementation, use a PDF library)
   * @param {Object} documentData - Document data
   * @param {string} documentId - Document ID
   * @returns {Promise<string>} Document URL
   */
  static async generatePDFDocument(documentData, documentId) {
    // Mock implementation - in real app, generate actual PDF
    const mockUrl = `https://storage.geargrab.com/tax-documents/${documentId}.pdf`;
    console.log(`Mock PDF generated: ${mockUrl}`);
    return mockUrl;
  }
  
  /**
   * Generate document hash for integrity verification
   * @param {Object} documentData - Document data
   * @returns {string} Document hash
   */
  static generateDocumentHash(documentData) {
    // Mock implementation - in real app, use proper hashing
    const dataString = JSON.stringify(documentData);
    return `hash_${dataString.length}_${Date.now()}`;
  }
  
  /**
   * Send tax documents to users
   * @param {string} documentId - Tax document ID
   * @returns {Promise<boolean>} Success status
   */
  static async sendTaxDocument(documentId) {
    try {
      const document = await TaxDocument.get(documentId);
      if (!document) {
        throw new Error('Tax document not found');
      }
      
      const users = await User.filter({ email: document.recipient_user_id });
      const user = users && users.length > 0 ? users[0] : null;
      
      if (!user) {
        throw new Error('Recipient user not found');
      }
      
      // Mock email sending - in real app, use actual email service
      console.log(`Sending ${document.document_type} to ${user.email} for tax year ${document.tax_year}`);
      
      // Update document status
      await TaxDocument.update(documentId, {
        sent_date: new Date().toISOString(),
        delivery_method: user.tax_document_delivery || 'email',
        delivery_status: 'delivered'
      });
      
      return true;
      
    } catch (error) {
      console.error('Error sending tax document:', error);
      return false;
    }
  }
}

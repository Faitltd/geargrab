import { TransactionRecord, TaxDocument, User, Rental } from '../api/entities';

/**
 * Service for exporting transaction data and generating reports for tax purposes
 */
export class DataExportService {
  
  /**
   * Export transaction data for a specific tax year
   * @param {number} taxYear - Tax year to export
   * @param {string} format - Export format ('csv', 'json', 'xlsx')
   * @returns {Promise<Object>} Export data and metadata
   */
  static async exportTransactionData(taxYear, format = 'csv') {
    try {
      console.log(`Exporting transaction data for ${taxYear} in ${format} format...`);
      
      // Get all transactions for the tax year
      const transactions = await TransactionRecord.filter({ tax_year: taxYear });
      
      // Get related user and rental data
      const userEmails = [...new Set([
        ...transactions.map(t => t.payer_user_id),
        ...transactions.map(t => t.payee_user_id)
      ])];
      
      const users = await User.list();
      const userMap = new Map(users.map(u => [u.email, u]));
      
      // Prepare export data
      const exportData = transactions.map(transaction => ({
        // Transaction Details
        transaction_id: transaction.id,
        transaction_number: transaction.transaction_number,
        transaction_date: transaction.transaction_date,
        tax_year: transaction.tax_year,
        
        // Financial Information
        base_amount: transaction.base_amount,
        platform_fee_amount: transaction.platform_fee_amount,
        payment_processing_fee: transaction.payment_processing_fee,
        tax_amount: transaction.tax_amount,
        total_amount: transaction.total_amount,
        owner_payout_amount: transaction.owner_payout_amount,
        platform_revenue: transaction.platform_revenue,
        
        // Parties
        payer_email: transaction.payer_user_id,
        payer_name: userMap.get(transaction.payer_user_id)?.full_name || 'Unknown',
        payee_email: transaction.payee_user_id,
        payee_name: userMap.get(transaction.payee_user_id)?.full_name || 'Unknown',
        payee_tax_id_type: userMap.get(transaction.payee_user_id)?.tax_id_type || 'Not provided',
        payee_entity_type: userMap.get(transaction.payee_user_id)?.entity_type || 'individual',
        
        // Payment Processing
        payment_processor: transaction.payment_processor,
        payment_processor_transaction_id: transaction.payment_processor_transaction_id,
        payment_method_type: transaction.payment_method_type,
        payment_status: transaction.payment_status,
        
        // Tax Reporting
        requires_1099: transaction.requires_1099,
        is_business_transaction: transaction.is_business_transaction,
        
        // Rental Reference
        rental_id: transaction.rental_id
      }));
      
      // Generate export based on format
      let exportContent;
      let mimeType;
      let fileExtension;
      
      switch (format.toLowerCase()) {
        case 'csv':
          exportContent = this.generateCSV(exportData);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'json':
          exportContent = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        case 'xlsx':
          // Mock XLSX generation - in real app, use a library like xlsx
          exportContent = this.generateMockXLSX(exportData);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      const exportMetadata = {
        filename: `geargrab_transactions_${taxYear}.${fileExtension}`,
        mimeType,
        recordCount: exportData.length,
        taxYear,
        exportDate: new Date().toISOString(),
        totalVolume: exportData.reduce((sum, t) => sum + (t.total_amount || 0), 0),
        totalRevenue: exportData.reduce((sum, t) => sum + (t.platform_revenue || 0), 0)
      };
      
      console.log(`Exported ${exportData.length} transactions for ${taxYear}`);
      
      return {
        content: exportContent,
        metadata: exportMetadata
      };
      
    } catch (error) {
      console.error('Error exporting transaction data:', error);
      throw new Error('Failed to export transaction data');
    }
  }
  
  /**
   * Generate annual tax report for all users
   * @param {number} taxYear - Tax year for the report
   * @returns {Promise<Object>} Annual tax report
   */
  static async generateAnnualTaxReport(taxYear) {
    try {
      console.log(`Generating annual tax report for ${taxYear}...`);
      
      // Get all transactions for the tax year
      const transactions = await TransactionRecord.filter({ tax_year: taxYear });
      
      // Get all users
      const users = await User.list();
      const userMap = new Map(users.map(u => [u.email, u]));
      
      // Calculate user earnings
      const userEarnings = {};
      transactions.forEach(transaction => {
        const payeeEmail = transaction.payee_user_id;
        if (!userEarnings[payeeEmail]) {
          userEarnings[payeeEmail] = {
            email: payeeEmail,
            name: userMap.get(payeeEmail)?.full_name || 'Unknown',
            entity_type: userMap.get(payeeEmail)?.entity_type || 'individual',
            tax_id_type: userMap.get(payeeEmail)?.tax_id_type || 'Not provided',
            total_earnings: 0,
            platform_fees_paid: 0,
            transaction_count: 0,
            requires_1099: false
          };
        }
        
        userEarnings[payeeEmail].total_earnings += transaction.owner_payout_amount || 0;
        userEarnings[payeeEmail].platform_fees_paid += transaction.platform_fee_amount || 0;
        userEarnings[payeeEmail].transaction_count += 1;
        userEarnings[payeeEmail].requires_1099 = userEarnings[payeeEmail].total_earnings >= 600;
      });
      
      // Sort by earnings (highest first)
      const sortedEarnings = Object.values(userEarnings)
        .sort((a, b) => b.total_earnings - a.total_earnings);
      
      // Calculate summary statistics
      const summary = {
        tax_year: taxYear,
        total_transactions: transactions.length,
        total_volume: transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0),
        total_platform_revenue: transactions.reduce((sum, t) => sum + (t.platform_revenue || 0), 0),
        total_user_earnings: sortedEarnings.reduce((sum, u) => sum + u.total_earnings, 0),
        users_requiring_1099: sortedEarnings.filter(u => u.requires_1099).length,
        total_users_with_earnings: sortedEarnings.length,
        average_earnings_per_user: sortedEarnings.length > 0 
          ? sortedEarnings.reduce((sum, u) => sum + u.total_earnings, 0) / sortedEarnings.length 
          : 0
      };
      
      // Monthly breakdown
      const monthlyBreakdown = this.calculateMonthlyBreakdown(transactions);
      
      const report = {
        summary,
        user_earnings: sortedEarnings,
        monthly_breakdown: monthlyBreakdown,
        generated_date: new Date().toISOString()
      };
      
      console.log(`Generated annual tax report for ${taxYear}: ${sortedEarnings.length} users, ${summary.users_requiring_1099} requiring 1099`);
      
      return report;
      
    } catch (error) {
      console.error('Error generating annual tax report:', error);
      throw new Error('Failed to generate annual tax report');
    }
  }
  
  /**
   * Export 1099 recipient data for IRS filing
   * @param {number} taxYear - Tax year
   * @returns {Promise<Object>} 1099 filing data
   */
  static async export1099FilingData(taxYear) {
    try {
      console.log(`Exporting 1099 filing data for ${taxYear}...`);
      
      // Get all tax documents for the year
      const taxDocuments = await TaxDocument.filter({
        tax_year: taxYear,
        document_type: '1099-MISC'
      });
      
      // Get user information for recipients
      const users = await User.list();
      const userMap = new Map(users.map(u => [u.email, u]));
      
      const filingData = taxDocuments.map(doc => {
        const user = userMap.get(doc.recipient_user_id);
        return {
          // Recipient Information
          recipient_name: user?.business_name || user?.full_name || 'Unknown',
          recipient_address_line1: user?.tax_address?.street_address || '',
          recipient_city: user?.tax_address?.city || '',
          recipient_state: user?.tax_address?.state || '',
          recipient_zip: user?.tax_address?.zip_code || '',
          recipient_country: user?.tax_address?.country || 'US',
          recipient_tin: user?.tax_id_number || '',
          recipient_tin_type: user?.tax_id_type || '',
          
          // Payment Information
          nonemployee_compensation: doc.total_earnings || 0, // Box 1
          federal_income_tax_withheld: 0, // Box 4
          
          // Document Information
          tax_year: doc.tax_year,
          document_id: doc.id,
          generated_date: doc.created_at,
          
          // Filing Status
          irs_filing_required: doc.irs_filing_required,
          document_status: doc.document_status
        };
      });
      
      return {
        filing_data: filingData,
        summary: {
          tax_year: taxYear,
          total_recipients: filingData.length,
          total_compensation: filingData.reduce((sum, f) => sum + f.nonemployee_compensation, 0),
          export_date: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('Error exporting 1099 filing data:', error);
      throw new Error('Failed to export 1099 filing data');
    }
  }
  
  /**
   * Generate CSV content from data array
   * @param {Array} data - Data to convert to CSV
   * @returns {string} CSV content
   */
  static generateCSV(data) {
    if (data.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }
  
  /**
   * Mock XLSX generation (in real app, use proper XLSX library)
   * @param {Array} data - Data to convert
   * @returns {string} Mock XLSX content
   */
  static generateMockXLSX(data) {
    // In a real implementation, use a library like 'xlsx' or 'exceljs'
    return `Mock XLSX content for ${data.length} records`;
  }
  
  /**
   * Calculate monthly breakdown of transactions
   * @param {Array} transactions - Transaction data
   * @returns {Array} Monthly breakdown
   */
  static calculateMonthlyBreakdown(transactions) {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          transaction_count: 0,
          total_volume: 0,
          platform_revenue: 0,
          user_earnings: 0
        };
      }
      
      monthlyData[monthKey].transaction_count += 1;
      monthlyData[monthKey].total_volume += transaction.total_amount || 0;
      monthlyData[monthKey].platform_revenue += transaction.platform_revenue || 0;
      monthlyData[monthKey].user_earnings += transaction.owner_payout_amount || 0;
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }
  
  /**
   * Download export data as file (browser implementation)
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType) {
    if (typeof window !== 'undefined') {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }
}

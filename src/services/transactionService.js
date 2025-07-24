import { TransactionRecord, RefundAdjustment, User } from '../api/entities';

/**
 * Service for managing financial transactions and tax-related data
 */
export class TransactionService {
  
  /**
   * Create a comprehensive transaction record from a rental payment
   * @param {Object} rentalData - The rental information
   * @param {Object} paymentData - Payment processor information
   * @param {Object} feeBreakdown - Detailed fee breakdown
   * @returns {Promise<Object>} Created transaction record
   */
  static async createTransactionRecord(rentalData, paymentData, feeBreakdown) {
    try {
      // Generate unique transaction number
      const transactionNumber = await this.generateTransactionNumber();
      
      // Calculate fee allocation
      const feeAllocation = this.calculateFeeAllocation(feeBreakdown);
      
      // Determine tax year
      const taxYear = new Date().getFullYear();
      
      // Check if this requires 1099 reporting
      const requires1099 = await TransactionService.checkRequires1099(rentalData.owner_email, feeAllocation.owner_payout_amount, taxYear);
      
      const transactionRecord = await TransactionRecord.create({
        // Unique Identifiers
        transaction_number: transactionNumber,
        rental_id: rentalData.rental_id,
        
        // Payment Processing
        payment_processor: paymentData.processor || 'stripe',
        payment_processor_transaction_id: paymentData.transaction_id,
        payment_method_type: paymentData.method_type || 'card',
        payment_status: paymentData.status || 'completed',
        
        // Financial Breakdown
        base_amount: feeBreakdown.base_amount,
        platform_fee_amount: feeBreakdown.platform_fee,
        payment_processing_fee: feeBreakdown.processing_fee || 0,
        tax_amount: feeBreakdown.tax_amount || 0,
        total_amount: feeBreakdown.total_amount,
        
        // Fee Allocation
        owner_payout_amount: feeAllocation.owner_payout_amount,
        platform_revenue: feeAllocation.platform_revenue,
        
        // Parties
        payer_user_id: rentalData.renter_email, // Using email as ID for now
        payee_user_id: rentalData.owner_email,
        
        // Timing
        transaction_date: new Date().toISOString(),
        tax_year: taxYear,
        
        // Tax Reporting
        requires_1099: requires1099,
        is_business_transaction: await TransactionService.isBusinessTransaction(rentalData.owner_email),
        
        // Audit Trail
        created_at: new Date().toISOString(),
        created_by: rentalData.renter_email
      });
      
      // Update annual earnings tracking
      await this.updateAnnualEarnings(rentalData.owner_email, feeAllocation.owner_payout_amount, taxYear);
      
      return transactionRecord;
      
    } catch (error) {
      console.error('Error creating transaction record:', error);
      throw new Error('Failed to create transaction record');
    }
  }
  
  /**
   * Generate a unique transaction number
   * @returns {Promise<string>} Transaction number
   */
  static async generateTransactionNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-${year}-${timestamp}-${random}`;
  }
  
  /**
   * Calculate how fees are allocated between parties
   * @param {Object} feeBreakdown - Fee breakdown from payment
   * @returns {Object} Fee allocation
   */
  static calculateFeeAllocation(feeBreakdown) {
    const platformFeeRate = 0.10; // 10% platform fee
    const processingFeeRate = 0.029; // ~2.9% typical processing fee
    
    const baseAmount = feeBreakdown.base_amount;
    const platformFee = baseAmount * platformFeeRate;
    const processingFee = feeBreakdown.processing_fee || (baseAmount * processingFeeRate);
    
    // Owner gets base amount minus platform fee
    const ownerPayoutAmount = baseAmount - platformFee;
    
    // Platform revenue is platform fee minus processing costs
    const platformRevenue = platformFee - processingFee;
    
    return {
      owner_payout_amount: ownerPayoutAmount,
      platform_revenue: platformRevenue,
      platform_fee: platformFee,
      processing_fee: processingFee
    };
  }
  
  /**
   * Check if a user's annual earnings require 1099 reporting
   * @param {string} userEmail - User email
   * @param {number} additionalAmount - New transaction amount
   * @param {number} taxYear - Tax year
   * @returns {Promise<boolean>} Whether 1099 is required
   */
  static async checkRequires1099(userEmail, additionalAmount, taxYear) {
    try {
      // Get current annual earnings
      const currentEarnings = await TransactionService.getAnnualEarnings(userEmail, taxYear);
      const totalEarnings = currentEarnings + additionalAmount;

      // 1099 threshold is $600
      return totalEarnings >= 600;
    } catch (error) {
      console.error('Error checking 1099 requirement:', error);
      return false;
    }
  }
  
  /**
   * Check if a transaction is business-to-business
   * @param {string} userEmail - User email
   * @returns {Promise<boolean>} Whether user is a business entity
   */
  static async isBusinessTransaction(userEmail) {
    try {
      const user = await User.filter({ email: userEmail });
      if (user && user.length > 0) {
        const entityType = user[0].entity_type;
        return entityType === 'business' || entityType === 'corporation' || entityType === 'llc';
      }
      return false;
    } catch (error) {
      console.error('Error checking business transaction:', error);
      return false;
    }
  }
  
  /**
   * Get annual earnings for a user
   * @param {string} userEmail - User email
   * @param {number} taxYear - Tax year
   * @returns {Promise<number>} Annual earnings
   */
  static async getAnnualEarnings(userEmail, taxYear) {
    try {
      const transactions = await TransactionRecord.filter({
        payee_user_id: userEmail,
        tax_year: taxYear
      });
      
      return transactions.reduce((total, transaction) => {
        return total + (transaction.owner_payout_amount || 0);
      }, 0);
    } catch (error) {
      console.error('Error getting annual earnings:', error);
      return 0;
    }
  }
  
  /**
   * Update user's annual earnings tracking
   * @param {string} userEmail - User email
   * @param {number} amount - Transaction amount
   * @param {number} taxYear - Tax year
   */
  static async updateAnnualEarnings(userEmail, amount, taxYear) {
    try {
      const users = await User.filter({ email: userEmail });
      if (users && users.length > 0) {
        const user = users[0];
        const annualEarnings = user.annual_earnings || {};
        annualEarnings[taxYear] = (annualEarnings[taxYear] || 0) + amount;
        
        await User.update(user.id, {
          annual_earnings: annualEarnings,
          requires_1099: annualEarnings[taxYear] >= 600
        });
      }
    } catch (error) {
      console.error('Error updating annual earnings:', error);
    }
  }
  
  /**
   * Create a refund/adjustment record
   * @param {string} originalTransactionId - Original transaction ID
   * @param {Object} adjustmentData - Adjustment details
   * @returns {Promise<Object>} Created adjustment record
   */
  static async createRefundAdjustment(originalTransactionId, adjustmentData) {
    try {
      const adjustment = await RefundAdjustment.create({
        original_transaction_id: originalTransactionId,
        adjustment_type: adjustmentData.type,
        adjustment_amount: adjustmentData.amount,
        reason: adjustmentData.reason,
        affects_tax_reporting: adjustmentData.affects_tax_reporting || true,
        tax_year_impact: adjustmentData.tax_year || new Date().getFullYear(),
        processed_date: new Date().toISOString(),
        processor_reference: adjustmentData.processor_reference,
        created_at: new Date().toISOString(),
        created_by: adjustmentData.created_by
      });
      
      // Update annual earnings if this affects tax reporting
      if (adjustmentData.affects_tax_reporting) {
        await this.adjustAnnualEarnings(
          originalTransactionId, 
          adjustmentData.amount, 
          adjustmentData.tax_year
        );
      }
      
      return adjustment;
    } catch (error) {
      console.error('Error creating refund adjustment:', error);
      throw new Error('Failed to create refund adjustment');
    }
  }
  
  /**
   * Adjust annual earnings for refunds/adjustments
   * @param {string} transactionId - Original transaction ID
   * @param {number} adjustmentAmount - Adjustment amount
   * @param {number} taxYear - Tax year
   */
  static async adjustAnnualEarnings(transactionId, adjustmentAmount, taxYear) {
    try {
      // Get original transaction to find the payee
      const transaction = await TransactionRecord.get(transactionId);
      if (transaction) {
        const users = await User.filter({ email: transaction.payee_user_id });
        if (users && users.length > 0) {
          const user = users[0];
          const annualEarnings = user.annual_earnings || {};
          annualEarnings[taxYear] = Math.max(0, (annualEarnings[taxYear] || 0) - adjustmentAmount);
          
          await User.update(user.id, {
            annual_earnings: annualEarnings,
            requires_1099: annualEarnings[taxYear] >= 600
          });
        }
      }
    } catch (error) {
      console.error('Error adjusting annual earnings:', error);
    }
  }
  
  /**
   * Get transaction summary for tax reporting
   * @param {string} userEmail - User email
   * @param {number} taxYear - Tax year
   * @returns {Promise<Object>} Transaction summary
   */
  static async getTransactionSummary(userEmail, taxYear) {
    try {
      const transactions = await TransactionRecord.filter({
        payee_user_id: userEmail,
        tax_year: taxYear
      });
      
      const summary = {
        total_earnings: 0,
        total_transactions: transactions.length,
        platform_fees_paid: 0,
        requires_1099: false,
        transactions: transactions
      };
      
      transactions.forEach(transaction => {
        summary.total_earnings += transaction.owner_payout_amount || 0;
        summary.platform_fees_paid += transaction.platform_fee_amount || 0;
      });
      
      summary.requires_1099 = summary.total_earnings >= 600;
      
      return summary;
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      throw new Error('Failed to get transaction summary');
    }
  }
}

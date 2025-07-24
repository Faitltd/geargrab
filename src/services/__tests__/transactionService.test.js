import { TransactionService } from '../transactionService';
import { TransactionRecord, User } from '../../api/entities';

// Mock the entities
jest.mock('../../api/entities', () => ({
  TransactionRecord: {
    create: jest.fn(),
    filter: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  },
  User: {
    filter: jest.fn(),
    update: jest.fn(),
  },
  RefundAdjustment: {
    create: jest.fn(),
  },
}));

describe('TransactionService', () => {
  let dateSpy, mathSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() for consistent transaction numbers
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01
    mathSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123);
  });

  afterEach(() => {
    // Only restore the specific spies we created
    if (dateSpy) dateSpy.mockRestore();
    if (mathSpy) mathSpy.mockRestore();
  });

  describe('createTransactionRecord', () => {
    const mockRentalData = {
      rental_id: 'rental-123',
      renter_email: 'renter@example.com',
      owner_email: 'owner@example.com',
    };

    const mockPaymentData = {
      processor: 'stripe',
      transaction_id: 'stripe_123',
      method_type: 'card',
      status: 'completed',
    };

    const mockFeeBreakdown = {
      base_amount: 100,
      platform_fee: 10,
      processing_fee: 3,
      tax_amount: 0,
      total_amount: 113,
    };

    it('should create a comprehensive transaction record', async () => {
      // Save original methods
      const originalCheckRequires1099 = TransactionService.checkRequires1099;
      const originalIsBusinessTransaction = TransactionService.isBusinessTransaction;
      const originalUpdateAnnualEarnings = TransactionService.updateAnnualEarnings;

      try {
        // Mock dependencies
        TransactionRecord.create.mockResolvedValue({ id: 'txn-123' });
        TransactionService.checkRequires1099 = jest.fn().mockResolvedValue(false);
        TransactionService.isBusinessTransaction = jest.fn().mockResolvedValue(false);
        TransactionService.updateAnnualEarnings = jest.fn().mockResolvedValue();

        const result = await TransactionService.createTransactionRecord(
          mockRentalData,
          mockPaymentData,
          mockFeeBreakdown
        );

      expect(TransactionRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_number: expect.stringMatching(/^TXN-\d{4}-\d+-123$/),
          rental_id: 'rental-123',
          payment_processor: 'stripe',
          payment_processor_transaction_id: 'stripe_123',
          payment_method_type: 'card',
          payment_status: 'completed',
          base_amount: 100,
          platform_fee_amount: 10,
          payment_processing_fee: 3,
          tax_amount: 0,
          total_amount: 113,
          owner_payout_amount: 90, // base_amount - platform_fee
          platform_revenue: 7, // platform_fee - processing_fee
          payer_user_id: 'renter@example.com',
          payee_user_id: 'owner@example.com',
          transaction_date: expect.any(String),
          tax_year: expect.any(Number),
          requires_1099: false,
          is_business_transaction: false,
          created_at: expect.any(String),
          created_by: 'renter@example.com',
        })
      );

      expect(result).toEqual({ id: 'txn-123' });
      } finally {
        // Restore original methods
        TransactionService.checkRequires1099 = originalCheckRequires1099;
        TransactionService.isBusinessTransaction = originalIsBusinessTransaction;
        TransactionService.updateAnnualEarnings = originalUpdateAnnualEarnings;
      }
    });

    it('should handle errors gracefully', async () => {
      TransactionRecord.create.mockRejectedValue(new Error('Database error'));

      await expect(
        TransactionService.createTransactionRecord(
          mockRentalData,
          mockPaymentData,
          mockFeeBreakdown
        )
      ).rejects.toThrow('Failed to create transaction record');
    });
  });

  describe('calculateFeeAllocation', () => {
    it('should correctly calculate fee allocation', () => {
      const feeBreakdown = {
        base_amount: 100,
        processing_fee: 3,
      };

      const result = TransactionService.calculateFeeAllocation(feeBreakdown);

      expect(result).toEqual({
        owner_payout_amount: 90, // 100 - 10 (10% platform fee)
        platform_revenue: 7, // 10 - 3 (platform fee - processing fee)
        platform_fee: 10,
        processing_fee: 3,
      });
    });

    it('should calculate processing fee if not provided', () => {
      const feeBreakdown = {
        base_amount: 100,
      };

      const result = TransactionService.calculateFeeAllocation(feeBreakdown);

      expect(result).toEqual({
        owner_payout_amount: 90,
        platform_revenue: expect.closeTo(7.1, 2), // 10 - 2.9 (calculated processing fee)
        platform_fee: 10,
        processing_fee: expect.closeTo(2.9, 2), // 2.9% of base amount
      });
    });
  });

  describe('checkRequires1099', () => {
    it('should return true when annual earnings exceed $600', async () => {
      // Mock the getAnnualEarnings method
      const originalMethod = TransactionService.getAnnualEarnings;
      TransactionService.getAnnualEarnings = jest.fn().mockResolvedValue(500);

      try {
        const result = await TransactionService.checkRequires1099(
          'user@example.com',
          200,
          2022
        );



        expect(result).toBe(true);
        expect(TransactionService.getAnnualEarnings).toHaveBeenCalledWith(
          'user@example.com',
          2022
        );
      } finally {
        TransactionService.getAnnualEarnings = originalMethod;
      }
    });

    it('should return false when annual earnings are below $600', async () => {
      const originalMethod = TransactionService.getAnnualEarnings;
      TransactionService.getAnnualEarnings = jest.fn().mockResolvedValue(400);

      try {
        const result = await TransactionService.checkRequires1099(
          'user@example.com',
          100,
          2022
        );

        expect(result).toBe(false);
      } finally {
        TransactionService.getAnnualEarnings = originalMethod;
      }
    });

    it('should handle errors and return false', async () => {
      const originalMethod = TransactionService.getAnnualEarnings;
      TransactionService.getAnnualEarnings = jest.fn().mockRejectedValue(new Error('Database error'));

      try {
        const result = await TransactionService.checkRequires1099(
          'user@example.com',
          200,
          2022
        );

        expect(result).toBe(false);
      } finally {
        TransactionService.getAnnualEarnings = originalMethod;
      }
    });
  });

  describe('isBusinessTransaction', () => {
    it('should return true for business entities', async () => {
      User.filter.mockResolvedValue([
        { email: 'business@example.com', entity_type: 'business' }
      ]);

      const result = await TransactionService.isBusinessTransaction('business@example.com');

      expect(result).toBe(true);
    });

    it('should return false for individual entities', async () => {
      User.filter.mockResolvedValue([
        { email: 'individual@example.com', entity_type: 'individual' }
      ]);

      const result = await TransactionService.isBusinessTransaction('individual@example.com');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      User.filter.mockResolvedValue([]);

      const result = await TransactionService.isBusinessTransaction('notfound@example.com');

      expect(result).toBe(false);
    });
  });

  describe('getAnnualEarnings', () => {
    it('should calculate total annual earnings correctly', async () => {
      const mockTransactions = [
        { owner_payout_amount: 100 },
        { owner_payout_amount: 200 },
        { owner_payout_amount: 150 },
      ];

      TransactionRecord.filter.mockResolvedValue(mockTransactions);

      const result = await TransactionService.getAnnualEarnings('user@example.com', 2022);

      expect(result).toBe(450);
      expect(TransactionRecord.filter).toHaveBeenCalledWith({
        payee_user_id: 'user@example.com',
        tax_year: 2022,
      });
    });

    it('should return 0 when no transactions found', async () => {
      TransactionRecord.filter.mockResolvedValue([]);

      const result = await TransactionService.getAnnualEarnings('user@example.com', 2022);

      expect(result).toBe(0);
    });

    it('should handle errors and return 0', async () => {
      TransactionRecord.filter.mockRejectedValue(new Error('Database error'));

      const result = await TransactionService.getAnnualEarnings('user@example.com', 2022);

      expect(result).toBe(0);
    });
  });

  describe('getTransactionSummary', () => {
    it('should generate comprehensive transaction summary', async () => {
      const mockTransactions = [
        {
          owner_payout_amount: 100,
          platform_fee_amount: 10,
        },
        {
          owner_payout_amount: 200,
          platform_fee_amount: 20,
        },
      ];

      TransactionRecord.filter.mockResolvedValue(mockTransactions);

      const result = await TransactionService.getTransactionSummary('user@example.com', 2022);

      expect(result).toEqual({
        total_earnings: 300,
        total_transactions: 2,
        platform_fees_paid: 30,
        requires_1099: false, // 300 < 600
        transactions: mockTransactions,
      });
    });

    it('should set requires_1099 to true when earnings >= $600', async () => {
      const mockTransactions = [
        { owner_payout_amount: 700, platform_fee_amount: 70 },
      ];

      TransactionRecord.filter.mockResolvedValue(mockTransactions);

      const result = await TransactionService.getTransactionSummary('user@example.com', 2022);

      expect(result.requires_1099).toBe(true);
    });
  });
});

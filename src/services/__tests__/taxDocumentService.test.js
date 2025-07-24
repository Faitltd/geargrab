import { TaxDocumentService } from '../taxDocumentService';
import { TransactionRecord, TaxDocument, User } from '../../api/entities';
import { TransactionService } from '../transactionService';

// Mock the dependencies
jest.mock('../../api/entities', () => ({
  TransactionRecord: {
    filter: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  TaxDocument: {
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    filter: jest.fn(),
  },
  User: {
    filter: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../transactionService', () => ({
  TransactionService: {
    getTransactionSummary: jest.fn(),
  },
}));

describe('TaxDocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate1099ForUser', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      full_name: 'John Doe',
      tax_id_number: '123-45-6789',
      tax_id_type: 'ssn',
      tax_address: {
        street_address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip_code: '12345',
        country: 'US',
      },
    };

    const mockTransactionSummary = {
      total_earnings: 1000,
      total_transactions: 5,
      platform_fees_paid: 100,
      requires_1099: true,
    };

    it('should generate 1099-MISC for eligible user', async () => {
      User.filter.mockResolvedValue([mockUser]);
      TransactionService.getTransactionSummary.mockResolvedValue(mockTransactionSummary);
      TaxDocument.create.mockResolvedValue({ id: 'tax-doc-123' });
      TaxDocumentService.generatePDFDocument = jest.fn().mockResolvedValue('https://example.com/doc.pdf');
      TaxDocumentService.generateDocumentHash = jest.fn().mockReturnValue('hash123');
      TaxDocument.update.mockResolvedValue();

      const result = await TaxDocumentService.generate1099ForUser('user@example.com', 2022);

      expect(User.filter).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(TransactionService.getTransactionSummary).toHaveBeenCalledWith('user@example.com', 2022);
      
      expect(TaxDocument.create).toHaveBeenCalledWith({
        document_type: '1099-MISC',
        tax_year: 2022,
        recipient_user_id: 'user@example.com',
        total_earnings: 1000,
        total_transactions: 5,
        document_status: 'generated',
        document_data: expect.objectContaining({
          recipient_name: 'John Doe',
          recipient_tax_id: '123-45-6789',
          nonemployee_compensation: 1000,
          tax_year: 2022,
        }),
        irs_filing_required: true,
        created_at: expect.any(String),
        created_by: 'system',
      });

      expect(result).toEqual({ id: 'tax-doc-123' });
    });

    it('should return null for user below 1099 threshold', async () => {
      const lowEarningsUser = { ...mockUser };
      const lowEarningsSummary = {
        ...mockTransactionSummary,
        total_earnings: 500,
        requires_1099: false,
      };

      User.filter.mockResolvedValue([lowEarningsUser]);
      TransactionService.getTransactionSummary.mockResolvedValue(lowEarningsSummary);

      const result = await TaxDocumentService.generate1099ForUser('user@example.com', 2022);

      expect(result).toBeNull();
      expect(TaxDocument.create).not.toHaveBeenCalled();
    });

    it('should return null for user without tax information', async () => {
      const userWithoutTaxInfo = {
        ...mockUser,
        tax_id_number: null,
        tax_address: null,
      };

      User.filter.mockResolvedValue([userWithoutTaxInfo]);

      const result = await TaxDocumentService.generate1099ForUser('user@example.com', 2022);

      expect(result).toBeNull();
      expect(TransactionService.getTransactionSummary).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      User.filter.mockResolvedValue([]);

      await expect(
        TaxDocumentService.generate1099ForUser('notfound@example.com', 2022)
      ).rejects.toThrow('User not found');
    });
  });

  describe('getEligibleUsersFor1099', () => {
    it('should return users with earnings >= $600', async () => {
      const mockTransactions = [
        { payee_user_id: 'user1@example.com', owner_payout_amount: 700 },
        { payee_user_id: 'user2@example.com', owner_payout_amount: 300 },
        { payee_user_id: 'user2@example.com', owner_payout_amount: 400 }, // Total: 700
        { payee_user_id: 'user3@example.com', owner_payout_amount: 500 }, // Below threshold
      ];

      const mockUsers = [
        { email: 'user1@example.com', full_name: 'User One' },
        { email: 'user2@example.com', full_name: 'User Two' },
        { email: 'user3@example.com', full_name: 'User Three' },
      ];

      TransactionRecord.filter.mockResolvedValue(mockTransactions);
      User.filter
        .mockResolvedValueOnce([mockUsers[0]]) // user1
        .mockResolvedValueOnce([mockUsers[1]]); // user2

      const result = await TaxDocumentService.getEligibleUsersFor1099(2022);

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[1].email).toBe('user2@example.com');
    });

    it('should handle empty transaction list', async () => {
      TransactionRecord.filter.mockResolvedValue([]);

      const result = await TaxDocumentService.getEligibleUsersFor1099(2022);

      expect(result).toEqual([]);
    });
  });

  describe('generateAnnualSummary', () => {
    it('should generate comprehensive annual summary', async () => {
      const mockUser = {
        email: 'user@example.com',
        full_name: 'John Doe',
      };

      const mockTransactionSummary = {
        total_earnings: 1500,
        total_transactions: 10,
        platform_fees_paid: 150,
        requires_1099: true,
      };

      User.filter.mockResolvedValue([mockUser]);
      TransactionService.getTransactionSummary.mockResolvedValue(mockTransactionSummary);
      TaxDocumentService.getMonthlyBreakdown = jest.fn().mockResolvedValue([
        { month: '2022-01', earnings: 500, transactions: 3 },
        { month: '2022-02', earnings: 1000, transactions: 7 },
      ]);
      TaxDocumentService.getUserTaxDocuments = jest.fn().mockResolvedValue([]);
      TaxDocument.create.mockResolvedValue({ id: 'summary-123' });

      const result = await TaxDocumentService.generateAnnualSummary('user@example.com', 2022);

      expect(TaxDocument.create).toHaveBeenCalledWith({
        document_type: 'annual_summary',
        tax_year: 2022,
        recipient_user_id: 'user@example.com',
        total_earnings: 1500,
        total_transactions: 10,
        document_status: 'generated',
        document_data: expect.objectContaining({
          user_name: 'John Doe',
          user_email: 'user@example.com',
          tax_year: 2022,
          total_gross_earnings: 1500,
          total_transactions: 10,
          requires_1099: true,
        }),
        irs_filing_required: false,
        created_at: expect.any(String),
        created_by: 'system',
      });

      expect(result).toEqual({ id: 'summary-123' });
    });
  });

  describe('getMonthlyBreakdown', () => {
    it('should calculate monthly earnings breakdown', async () => {
      const mockTransactions = [
        {
          transaction_date: '2022-01-15T10:00:00Z',
          owner_payout_amount: 100,
          platform_fee_amount: 10,
        },
        {
          transaction_date: '2022-01-20T10:00:00Z',
          owner_payout_amount: 200,
          platform_fee_amount: 20,
        },
        {
          transaction_date: '2022-02-10T10:00:00Z',
          owner_payout_amount: 300,
          platform_fee_amount: 30,
        },
      ];

      TransactionRecord.filter.mockResolvedValue(mockTransactions);

      const result = await TaxDocumentService.getMonthlyBreakdown('user@example.com', 2022);

      expect(result).toEqual([
        {
          month: '2022-01',
          earnings: 500,
          transactions: 3,
        },
        {
          month: '2022-02',
          earnings: 1000,
          transactions: 7,
        },
      ]);
    });
  });

  describe('sendTaxDocument', () => {
    it('should send tax document and update status', async () => {
      const mockDocument = {
        id: 'doc-123',
        document_type: '1099-MISC',
        recipient_user_id: 'user@example.com',
        tax_year: 2022,
      };

      const mockUser = {
        email: 'user@example.com',
        tax_document_delivery: 'email',
      };

      TaxDocument.get.mockResolvedValue(mockDocument);
      User.filter.mockResolvedValue([mockUser]);
      TaxDocument.update.mockResolvedValue();

      const result = await TaxDocumentService.sendTaxDocument('doc-123');

      expect(TaxDocument.update).toHaveBeenCalledWith('doc-123', {
        sent_date: expect.any(String),
        delivery_method: 'email',
        delivery_status: 'delivered',
      });

      expect(result).toBe(true);
    });

    it('should handle document not found', async () => {
      TaxDocument.get.mockResolvedValue(null);

      const result = await TaxDocumentService.sendTaxDocument('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('generate1099FormsForYear', () => {
    it('should generate 1099 forms for all eligible users', async () => {
      const mockEligibleUsers = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
      ];

      TaxDocumentService.getEligibleUsersFor1099 = jest.fn().mockResolvedValue(mockEligibleUsers);
      TaxDocumentService.generate1099ForUser = jest.fn()
        .mockResolvedValueOnce({ id: 'doc1' })
        .mockResolvedValueOnce({ id: 'doc2' });

      const result = await TaxDocumentService.generate1099FormsForYear(2022);

      expect(TaxDocumentService.getEligibleUsersFor1099).toHaveBeenCalledWith(2022);
      expect(TaxDocumentService.generate1099ForUser).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should handle errors for individual users gracefully', async () => {
      const mockEligibleUsers = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
      ];

      TaxDocumentService.getEligibleUsersFor1099 = jest.fn().mockResolvedValue(mockEligibleUsers);
      TaxDocumentService.generate1099ForUser = jest.fn()
        .mockResolvedValueOnce({ id: 'doc1' })
        .mockRejectedValueOnce(new Error('User error'));

      const result = await TaxDocumentService.generate1099FormsForYear(2022);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'doc1' });
    });
  });
});

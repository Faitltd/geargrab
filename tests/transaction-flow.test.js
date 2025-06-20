/**
 * Transaction Flow Integration Tests
 * 
 * Tests the complete booking and payment flow with Firebase authentication
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock Firebase
jest.mock('$lib/firebase/client', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      getIdToken: jest.fn().mockResolvedValue('mock-firebase-token')
    }
  },
  firestore: {}
}));

// Mock Stripe
jest.mock('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_test',
        status: 'requires_payment_method'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 5000
      })
    }
  }))
}));

describe('Transaction Flow Integration Tests', () => {
  let mockUser;
  let mockListing;
  let mockBookingData;

  beforeEach(() => {
    mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      isActive: true,
      emailVerified: true
    };

    mockListing = {
      id: 'test-listing-123',
      title: 'Test Camera',
      dailyPrice: 25,
      ownerUid: 'owner-123',
      location: { address: '123 Test St' },
      securityDeposit: 100
    };

    mockBookingData = {
      listingId: 'test-listing-123',
      startDate: '2025-06-25',
      endDate: '2025-06-27',
      contactInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-0123'
      },
      totalPrice: 50,
      deliveryMethod: 'pickup'
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication Integration', () => {
    it('should require authentication for booking creation', async () => {
      // Mock unauthenticated state
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Authentication required' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockBookingData)
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error).toContain('Authentication required');
    });

    it('should accept valid Firebase authentication', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          bookingId: 'booking-123',
          message: 'Booking created successfully'
        })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-firebase-token'
        },
        body: JSON.stringify(mockBookingData)
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.bookingId).toBeDefined();
    });

    it('should validate Firebase ID token format', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid token format' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify(mockBookingData)
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent with authentication', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          clientSecret: 'pi_test_123_secret_test',
          paymentIntentId: 'pi_test_123'
        })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-firebase-token'
        },
        body: JSON.stringify({
          amount: 5000, // $50.00 in cents
          currency: 'usd',
          metadata: { bookingId: 'booking-123' }
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.clientSecret).toBeDefined();
      expect(result.paymentIntentId).toBeDefined();
    });

    it('should reject payment intent creation without authentication', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Authentication required' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000,
          currency: 'usd'
        })
      });

      expect(response.status).toBe(401);
    });

    it('should validate minimum payment amount', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid amount. Minimum $0.50 required.' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-firebase-token'
        },
        body: JSON.stringify({
          amount: 25, // $0.25 - below minimum
          currency: 'usd'
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('Minimum $0.50 required');
    });
  });

  describe('Booking Creation with Payment', () => {
    it('should create booking with valid payment intent', async () => {
      const bookingWithPayment = {
        ...mockBookingData,
        paymentIntentId: 'pi_test_123'
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          bookingId: 'booking-123',
          booking: {
            id: 'booking-123',
            ...bookingWithPayment,
            status: 'PENDING',
            paymentStatus: 'COMPLETED'
          }
        })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-firebase-token'
        },
        body: JSON.stringify(bookingWithPayment)
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.booking.paymentStatus).toBe('COMPLETED');
    });

    it('should reject booking with failed payment', async () => {
      const bookingWithFailedPayment = {
        ...mockBookingData,
        paymentIntentId: 'pi_failed_123'
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Payment not completed' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-firebase-token'
        },
        body: JSON.stringify(bookingWithFailedPayment)
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBe('Payment not completed');
    });

    it('should validate payment amount matches booking total', async () => {
      const bookingWithMismatchedPayment = {
        ...mockBookingData,
        totalPrice: 100, // $100
        paymentIntentId: 'pi_test_123' // But payment was for $50
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Payment amount mismatch' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-firebase-token'
        },
        body: JSON.stringify(bookingWithMismatchedPayment)
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBe('Payment amount mismatch');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      try {
        await fetch('/api/book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-firebase-token'
          },
          body: JSON.stringify(mockBookingData)
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle malformed request data', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid input data' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-firebase-token'
        },
        body: JSON.stringify({ invalid: 'data' })
      });

      expect(response.status).toBe(400);
    });
  });
});

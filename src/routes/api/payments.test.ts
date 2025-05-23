import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET } from './api/payments/+server'; // Adjust path if needed
import { json, error } from '@sveltejs/kit'; // These are mocked
import Stripe from 'stripe'; // This is mocked
import { adminDb, Timestamp } from '$firebase/server'; // These are mocked

// --- MOCK SETUP (Simplified for brevity, assume a more robust setup like vitest.setup.ts) ---
vi.mock('@sveltejs/kit', async () => ({
  json: vi.fn((data, init) => ({ data, status: init?.status || 200, ...init })),
  error: vi.fn((status, body) => ({ status, body })),
}));
vi.mock('$env/static/private', () => ({ STRIPE_SECRET_KEY: 'sk_test_mocked' }));
vi.mock('$firebase/server', () => ({
  adminAuth: {}, // Not directly used in this route, but good to have
  adminDb: {}, // Not directly used in this route for DB writes, but good to have
  Timestamp: { now: vi.fn(() => new Date()) }
}));

const mockStripePaymentIntentsCreate = vi.fn();
const mockStripePaymentIntentsRetrieve = vi.fn();
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    paymentIntents: {
      create: mockStripePaymentIntentsCreate,
      retrieve: mockStripePaymentIntentsRetrieve,
    },
  })),
}));
// --- END MOCK SETUP ---


describe('/api/payments', () => {
  let mockLocals;
  let mockRequest;

  beforeEach(() => {
    vi.resetAllMocks(); // Resets all vi.fn() calls etc.

    mockLocals = { user: null }; // Default to no user
    mockRequest = {
      json: vi.fn(),
      url: new URL('http://localhost/api/payments'),
    };
    
    // Ensure Stripe constructor is called so the instance is set up for mocking
    new Stripe('sk_test_mocked');
  });

  // --- POST /api/payments ---
  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      const response = await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should return 400 if required parameters are missing', async () => {
      mockLocals.user = { uid: 'testUser123' };
      mockRequest.json.mockResolvedValueOnce({}); // Missing all params
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, 'Missing required parameters: amount, currency, paymentMethodId');
    });

    it('should return 400 for invalid amount', async () => {
      mockLocals.user = { uid: 'testUser123' };
      mockRequest.json.mockResolvedValueOnce({ amount: -100, currency: 'usd', paymentMethodId: 'pm_card_visa' });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, 'Invalid amount: Must be a positive integer representing cents.');
    });
    
    it('should return 400 for invalid currency', async () => {
      mockLocals.user = { uid: 'testUser123' };
      mockRequest.json.mockResolvedValueOnce({ amount: 1000, currency: 'us', paymentMethodId: 'pm_card_visa' });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, 'Invalid currency: Must be a 3-letter ISO currency code.');
    });

    it('should return 400 for invalid paymentMethodId', async () => {
      mockLocals.user = { uid: 'testUser123' };
      mockRequest.json.mockResolvedValueOnce({ amount: 1000, currency: 'usd', paymentMethodId: 'invalid_pm_id' });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, 'Invalid paymentMethodId.');
    });

    it('should create a payment intent and return clientSecret and status on success', async () => {
      mockLocals.user = { uid: 'testUser123' };
      const paymentData = { amount: 1000, currency: 'usd', paymentMethodId: 'pm_card_visa' };
      mockRequest.json.mockResolvedValueOnce(paymentData);
      const mockPaymentIntent = { client_secret: 'pi_123_secret_456', status: 'requires_payment_method' };
      mockStripePaymentIntentsCreate.mockResolvedValueOnce(mockPaymentIntent);

      const response = await POST({ request: mockRequest, locals: mockLocals });

      expect(mockStripePaymentIntentsCreate).toHaveBeenCalledWith({
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentData.paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });
      expect(json).toHaveBeenCalledWith({
        clientSecret: mockPaymentIntent.client_secret,
        status: mockPaymentIntent.status,
      });
    });

    it('should handle Stripe API errors during creation', async () => {
      mockLocals.user = { uid: 'testUser123' };
      mockRequest.json.mockResolvedValueOnce({ amount: 1000, currency: 'usd', paymentMethodId: 'pm_card_visa' });
      const stripeError = { type: 'StripeCardError', message: 'Your card was declined.', statusCode: 402 };
      mockStripePaymentIntentsCreate.mockRejectedValueOnce(stripeError);

      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(stripeError.statusCode, stripeError.message);
    });
  });

  // --- GET /api/payments?paymentIntentId={id} ---
  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      await GET({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should return 400 if paymentIntentId is missing', async () => {
      mockLocals.user = { uid: 'testUser123' };
      // No paymentIntentId in mockRequest.url.searchParams
      await GET({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, 'Missing paymentIntentId query parameter');
    });
    
    it('should return 400 if paymentIntentId is invalid format', async () => {
      mockLocals.user = { uid: 'testUser123' };
      mockRequest.url.searchParams.set('paymentIntentId', 'invalid_pi_id');
      await GET({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, 'Invalid paymentIntentId format.');
    });

    it('should retrieve payment intent status and return it', async () => {
      mockLocals.user = { uid: 'testUser123' };
      const paymentIntentId = 'pi_12345';
      mockRequest.url.searchParams.set('paymentIntentId', paymentIntentId);
      const mockPaymentIntent = { status: 'succeeded', amount: 1000, currency: 'usd' };
      mockStripePaymentIntentsRetrieve.mockResolvedValueOnce(mockPaymentIntent);

      await GET({ request: mockRequest, locals: mockLocals });

      expect(mockStripePaymentIntentsRetrieve).toHaveBeenCalledWith(paymentIntentId);
      expect(json).toHaveBeenCalledWith({
        status: mockPaymentIntent.status,
        amount: mockPaymentIntent.amount,
        currency: mockPaymentIntent.currency,
      });
    });

    it('should handle Stripe API errors during retrieval', async () => {
      mockLocals.user = { uid: 'testUser123' };
      const paymentIntentId = 'pi_12345';
      mockRequest.url.searchParams.set('paymentIntentId', paymentIntentId);
      const stripeError = { type: 'StripeInvalidRequestError', message: 'No such payment_intent: pi_12345', statusCode: 404 };
      mockStripePaymentIntentsRetrieve.mockRejectedValueOnce(stripeError);

      await GET({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(stripeError.statusCode, stripeError.message);
    });
  });
});

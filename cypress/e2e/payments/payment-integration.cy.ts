// Payment Integration End-to-End Tests
// Tests Stripe payment flows and transaction handling

describe('Payment Integration', () => {
  let testListing: any;
  let testUser: any;

  beforeEach(() => {
    cy.clearTestData();
    
    // Create test user and listing
    cy.createTestUser({
      email: 'payer@example.com',
      password: 'password123',
      name: 'Test Payer'
    }).then((user) => {
      testUser = user;
    });
    
    cy.createTestListing({
      title: 'Test Equipment',
      price: 100,
      category: 'sports'
    }).then((listing) => {
      testListing = listing;
    });
  });

  describe('Stripe Payment Processing', () => {
    beforeEach(() => {
      cy.login('payer@example.com', 'password123');
      
      // Navigate to payment page
      cy.visit(`/listings/${testListing.id}`);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);
      
      cy.get('[data-cy="start-date-input"]').type(startDate.toISOString().split('T')[0]);
      cy.get('[data-cy="end-date-input"]').type(endDate.toISOString().split('T')[0]);
      cy.get('[data-cy="check-availability-button"]').click();
      cy.get('[data-cy="book-now-button"]').click();
      cy.get('[data-cy="proceed-to-payment-button"]').click();
    });

    it('should process successful payment with valid card', () => {
      // Use Stripe test card that succeeds
      cy.fillPaymentForm({
        number: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="payment-submit-button"]').click();
      
      // Wait for payment processing
      cy.get('[data-cy="payment-processing"]').should('be.visible');
      cy.get('[data-cy="payment-success"]').should('be.visible', { timeout: 15000 });
      
      // Should redirect to confirmation
      cy.url().should('include', '/booking/confirmation');
      cy.get('[data-cy="payment-confirmation"]').should('be.visible');
      cy.get('[data-cy="transaction-id"]').should('be.visible');
    });

    it('should handle declined card', () => {
      // Use Stripe test card that gets declined
      cy.fillPaymentForm({
        number: '4000000000000002',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="payment-submit-button"]').click();
      
      cy.get('[data-cy="payment-error"]').should('be.visible');
      cy.get('[data-cy="payment-error"]').should('contain.text', 'Your card was declined');
      
      // Should stay on payment page
      cy.url().should('include', '/payment');
    });

    it('should handle insufficient funds', () => {
      // Use Stripe test card for insufficient funds
      cy.fillPaymentForm({
        number: '4000000000009995',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="payment-submit-button"]').click();
      
      cy.get('[data-cy="payment-error"]').should('contain.text', 'insufficient funds');
    });

    it('should handle expired card', () => {
      // Use Stripe test card that is expired
      cy.fillPaymentForm({
        number: '4000000000000069',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="payment-submit-button"]').click();
      
      cy.get('[data-cy="payment-error"]').should('contain.text', 'expired');
    });

    it('should handle incorrect CVC', () => {
      // Use Stripe test card with incorrect CVC
      cy.fillPaymentForm({
        number: '4000000000000127',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="payment-submit-button"]').click();
      
      cy.get('[data-cy="payment-error"]').should('contain.text', 'security code');
    });

    it('should validate payment form fields', () => {
      // Test empty form submission
      cy.get('[data-cy="payment-submit-button"]').click();
      
      cy.get('[data-cy="stripe-card-errors"]').should('be.visible');
      
      // Test invalid card number
      cy.fillPaymentForm({
        number: '1234567890123456',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="stripe-card-errors"]').should('contain.text', 'card number is invalid');
      
      // Test invalid expiry
      cy.fillPaymentForm({
        number: '4242424242424242',
        expiry: '13/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="stripe-card-errors"]').should('contain.text', 'expiry month is invalid');
      
      // Test invalid CVC
      cy.fillPaymentForm({
        number: '4242424242424242',
        expiry: '12/25',
        cvc: '12',
        name: 'Test User'
      });
      
      cy.get('[data-cy="stripe-card-errors"]').should('contain.text', 'security code is incomplete');
    });

    it('should show payment summary before processing', () => {
      cy.get('[data-cy="payment-summary"]').should('be.visible');
      cy.get('[data-cy="item-name"]').should('contain.text', testListing.title);
      cy.get('[data-cy="rental-dates"]').should('be.visible');
      cy.get('[data-cy="subtotal"]').should('be.visible');
      cy.get('[data-cy="service-fee"]').should('be.visible');
      cy.get('[data-cy="total-amount"]').should('be.visible');
      
      // Verify amounts are correct
      cy.get('[data-cy="subtotal"]').should('contain.text', '$300'); // 3 days * $100
      cy.get('[data-cy="total-amount"]').should('match', /\$\d+\.\d{2}/);
    });

    it('should handle 3D Secure authentication', () => {
      // Use Stripe test card that requires 3D Secure
      cy.fillPaymentForm({
        number: '4000000000003220',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="payment-submit-button"]').click();
      
      // Should show 3D Secure modal
      cy.get('[data-cy="stripe-3ds-modal"]').should('be.visible');
      
      // Complete 3D Secure (in test mode, this would be automated)
      cy.get('[data-cy="complete-3ds-button"]').click();
      
      cy.get('[data-cy="payment-success"]').should('be.visible');
    });
  });

  describe('Payment Security', () => {
    beforeEach(() => {
      cy.login('payer@example.com', 'password123');
    });

    it('should not store sensitive payment data', () => {
      cy.visit('/payment');
      
      // Fill payment form
      cy.fillPaymentForm({
        number: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      // Check that card data is not stored in localStorage or sessionStorage
      cy.window().then((win) => {
        const localStorage = JSON.stringify(win.localStorage);
        const sessionStorage = JSON.stringify(win.sessionStorage);
        
        expect(localStorage).to.not.include('4242424242424242');
        expect(sessionStorage).to.not.include('4242424242424242');
      });
    });

    it('should use HTTPS for payment processing', () => {
      cy.visit('/payment');
      
      cy.location('protocol').should('eq', 'https:');
      
      // Check that Stripe requests use HTTPS
      cy.intercept('POST', 'https://api.stripe.com/**').as('stripeRequest');
      
      cy.fillPaymentForm();
      cy.get('[data-cy="payment-submit-button"]').click();
      
      cy.wait('@stripeRequest').then((interception) => {
        expect(interception.request.url).to.include('https://');
      });
    });

    it('should validate payment amount server-side', () => {
      // Attempt to manipulate payment amount client-side
      cy.visit('/payment');
      
      cy.window().then((win) => {
        // Try to modify payment amount in DOM
        const totalElement = win.document.querySelector('[data-cy="total-amount"]');
        if (totalElement) {
          totalElement.textContent = '$1.00';
        }
      });
      
      cy.fillPaymentForm();
      cy.get('[data-cy="payment-submit-button"]').click();
      
      // Server should reject the manipulated amount
      cy.get('[data-cy="payment-error"]').should('contain.text', 'Payment amount mismatch');
    });
  });

  describe('Payment History and Receipts', () => {
    let paymentId: string;

    beforeEach(() => {
      cy.login('payer@example.com', 'password123');
      
      // Complete a successful payment
      cy.visit('/payment');
      cy.fillPaymentForm();
      cy.completeStripePayment();
      
      // Get payment ID from confirmation page
      cy.get('[data-cy="transaction-id"]').invoke('text').then((id) => {
        paymentId = id;
      });
    });

    it('should show payment in transaction history', () => {
      cy.visit('/dashboard/payments');
      
      cy.get('[data-cy="payment-history"]').should('be.visible');
      cy.get('[data-cy="payment-row"]').should('have.length.at.least', 1);
      
      cy.get('[data-cy="payment-row"]').first().within(() => {
        cy.get('[data-cy="payment-amount"]').should('be.visible');
        cy.get('[data-cy="payment-date"]').should('be.visible');
        cy.get('[data-cy="payment-status"]').should('contain.text', 'Completed');
        cy.get('[data-cy="view-receipt-button"]').should('be.visible');
      });
    });

    it('should generate and display receipt', () => {
      cy.visit('/dashboard/payments');
      
      cy.get('[data-cy="view-receipt-button"]').first().click();
      
      cy.get('[data-cy="receipt-modal"]').should('be.visible');
      cy.get('[data-cy="receipt-transaction-id"]').should('contain.text', paymentId);
      cy.get('[data-cy="receipt-amount"]').should('be.visible');
      cy.get('[data-cy="receipt-date"]').should('be.visible');
      cy.get('[data-cy="receipt-item-details"]').should('be.visible');
      
      // Test download receipt
      cy.get('[data-cy="download-receipt-button"]').click();
      
      // Verify download was initiated (file would be downloaded)
      cy.get('[data-cy="download-success"]').should('be.visible');
    });

    it('should send receipt email', () => {
      cy.visit('/dashboard/payments');
      
      cy.get('[data-cy="view-receipt-button"]').first().click();
      cy.get('[data-cy="email-receipt-button"]').click();
      
      cy.shouldShowSuccess('Receipt sent to your email');
    });
  });

  describe('Refund Processing', () => {
    let bookingId: string;

    beforeEach(() => {
      cy.login('payer@example.com', 'password123');
      
      // Create a booking that can be refunded
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/bookings`,
        body: {
          listingId: testListing.id,
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          totalCost: 300,
          paymentStatus: 'completed'
        }
      }).then((response) => {
        bookingId = response.body.id;
      });
    });

    it('should process full refund for cancelled booking', () => {
      cy.visit(`/dashboard/bookings/${bookingId}`);
      
      cy.get('[data-cy="cancel-booking-button"]').click();
      cy.get('[data-cy="refund-option"]').select('full');
      cy.get('[data-cy="confirm-cancel-button"]').click();
      
      cy.shouldShowSuccess('Booking cancelled and refund processed');
      cy.get('[data-cy="refund-status"]').should('contain.text', 'Refund Pending');
      
      // Check refund appears in payment history
      cy.visit('/dashboard/payments');
      cy.get('[data-cy="refund-row"]').should('be.visible');
      cy.get('[data-cy="refund-amount"]').should('contain.text', '$300.00');
    });

    it('should process partial refund based on cancellation policy', () => {
      cy.visit(`/dashboard/bookings/${bookingId}`);
      
      cy.get('[data-cy="cancel-booking-button"]').click();
      
      // Should show cancellation policy
      cy.get('[data-cy="cancellation-policy"]').should('be.visible');
      cy.get('[data-cy="refund-amount"]').should('be.visible');
      
      cy.get('[data-cy="confirm-cancel-button"]').click();
      
      cy.shouldShowSuccess('Booking cancelled and partial refund processed');
    });

    it('should handle refund failures', () => {
      // Mock refund failure
      cy.intercept('POST', '/api/payments/refund', {
        statusCode: 400,
        body: { error: 'Refund failed' }
      });
      
      cy.visit(`/dashboard/bookings/${bookingId}`);
      cy.get('[data-cy="cancel-booking-button"]').click();
      cy.get('[data-cy="confirm-cancel-button"]').click();
      
      cy.get('[data-cy="refund-error"]').should('contain.text', 'Refund could not be processed');
    });
  });

  describe('Webhook Handling', () => {
    it('should handle successful payment webhook', () => {
      // Simulate Stripe webhook
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/webhooks/stripe`,
        headers: {
          'stripe-signature': 'test-signature'
        },
        body: {
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test_123',
              amount: 30000,
              status: 'succeeded'
            }
          }
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('should handle failed payment webhook', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/webhooks/stripe`,
        headers: {
          'stripe-signature': 'test-signature'
        },
        body: {
          type: 'payment_intent.payment_failed',
          data: {
            object: {
              id: 'pi_test_456',
              amount: 30000,
              status: 'requires_payment_method'
            }
          }
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });
});

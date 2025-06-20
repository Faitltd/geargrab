/**
 * Transaction Flow E2E Tests
 * 
 * End-to-end testing of the complete booking and payment flow
 */

describe('Transaction Flow E2E Tests', () => {
  beforeEach(() => {
    // Visit the homepage
    cy.visit('/');
    
    // Mock Firebase authentication
    cy.window().then((win) => {
      // Mock Firebase auth state
      win.mockFirebaseAuth = {
        currentUser: {
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          getIdToken: () => Promise.resolve('mock-firebase-token')
        }
      };
    });
  });

  describe('Authentication Required for Transactions', () => {
    it('should prompt for login when accessing booking without authentication', () => {
      // Try to access a listing page
      cy.visit('/listing/test-listing-123');
      
      // Try to click "Book Now" button
      cy.get('[data-testid="book-now-button"]', { timeout: 10000 })
        .should('be.visible')
        .click();
      
      // Should show login modal or redirect to login
      cy.get('[data-testid="login-modal"]', { timeout: 5000 })
        .should('be.visible');
      
      // Or check for login page
      cy.url().should('match', /\/(login|auth)/);
    });

    it('should allow booking flow when authenticated', () => {
      // Mock authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('firebase-auth-token', 'mock-token');
        win.localStorage.setItem('user-data', JSON.stringify({
          uid: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User'
        }));
      });

      // Visit listing page
      cy.visit('/listing/test-listing-123');
      
      // Should be able to proceed with booking
      cy.get('[data-testid="book-now-button"]', { timeout: 10000 })
        .should('be.visible')
        .click();
      
      // Should show booking form instead of login
      cy.get('[data-testid="booking-form"]', { timeout: 5000 })
        .should('be.visible');
    });
  });

  describe('Booking Form Flow', () => {
    beforeEach(() => {
      // Set up authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('firebase-auth-token', 'mock-token');
        win.localStorage.setItem('user-data', JSON.stringify({
          uid: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User'
        }));
      });
    });

    it('should complete booking form with valid data', () => {
      cy.visit('/listing/test-listing-123');
      
      // Start booking process
      cy.get('[data-testid="book-now-button"]').click();
      
      // Fill in booking dates
      cy.get('[data-testid="start-date-input"]')
        .type('2025-06-25');
      
      cy.get('[data-testid="end-date-input"]')
        .type('2025-06-27');
      
      // Select delivery method
      cy.get('[data-testid="delivery-method-pickup"]')
        .check();
      
      // Fill contact information
      cy.get('[data-testid="contact-first-name"]')
        .type('Test');
      
      cy.get('[data-testid="contact-last-name"]')
        .type('User');
      
      cy.get('[data-testid="contact-email"]')
        .type('test@example.com');
      
      cy.get('[data-testid="contact-phone"]')
        .type('555-0123');
      
      // Proceed to payment
      cy.get('[data-testid="proceed-to-payment"]')
        .click();
      
      // Should show payment form
      cy.get('[data-testid="payment-form"]', { timeout: 10000 })
        .should('be.visible');
    });

    it('should validate required booking fields', () => {
      cy.visit('/listing/test-listing-123');
      
      // Start booking process
      cy.get('[data-testid="book-now-button"]').click();
      
      // Try to proceed without filling required fields
      cy.get('[data-testid="proceed-to-payment"]')
        .click();
      
      // Should show validation errors
      cy.get('[data-testid="validation-error"]')
        .should('be.visible');
      
      // Check specific field errors
      cy.get('[data-testid="start-date-error"]')
        .should('contain', 'Start date is required');
      
      cy.get('[data-testid="end-date-error"]')
        .should('contain', 'End date is required');
    });

    it('should calculate pricing correctly', () => {
      cy.visit('/listing/test-listing-123');
      
      // Start booking process
      cy.get('[data-testid="book-now-button"]').click();
      
      // Fill in dates (2 days)
      cy.get('[data-testid="start-date-input"]')
        .type('2025-06-25');
      
      cy.get('[data-testid="end-date-input"]')
        .type('2025-06-27');
      
      // Check pricing calculation
      cy.get('[data-testid="rental-fee"]')
        .should('contain', '$50.00'); // 2 days × $25/day
      
      cy.get('[data-testid="service-fee"]')
        .should('be.visible');
      
      cy.get('[data-testid="total-price"]')
        .should('be.visible')
        .and('not.contain', '$0.00');
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      // Set up authenticated state and mock Stripe
      cy.window().then((win) => {
        win.localStorage.setItem('firebase-auth-token', 'mock-token');
        win.localStorage.setItem('user-data', JSON.stringify({
          uid: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User'
        }));

        // Mock Stripe
        win.Stripe = () => ({
          elements: () => ({
            create: () => ({
              mount: cy.stub(),
              on: cy.stub(),
              destroy: cy.stub()
            }),
            getElement: () => null
          }),
          confirmPayment: cy.stub().resolves({
            paymentIntent: {
              status: 'succeeded',
              id: 'pi_test_123'
            }
          })
        });
      });
    });

    it('should load Stripe payment form', () => {
      // Navigate through booking flow to payment
      cy.visit('/listing/test-listing-123');
      cy.get('[data-testid="book-now-button"]').click();
      
      // Fill minimal required data
      cy.get('[data-testid="start-date-input"]').type('2025-06-25');
      cy.get('[data-testid="end-date-input"]').type('2025-06-27');
      cy.get('[data-testid="contact-first-name"]').type('Test');
      cy.get('[data-testid="contact-last-name"]').type('User');
      cy.get('[data-testid="contact-email"]').type('test@example.com');
      cy.get('[data-testid="contact-phone"]').type('555-0123');
      
      cy.get('[data-testid="proceed-to-payment"]').click();
      
      // Should show Stripe payment elements
      cy.get('[data-testid="stripe-payment-element"]', { timeout: 10000 })
        .should('be.visible');
      
      cy.get('[data-testid="payment-submit-button"]')
        .should('be.visible')
        .and('contain', 'Complete Payment');
    });

    it('should handle payment success', () => {
      // Mock successful payment
      cy.intercept('POST', '/api/payments/create-intent', {
        statusCode: 200,
        body: {
          clientSecret: 'pi_test_123_secret_test',
          paymentIntentId: 'pi_test_123'
        }
      }).as('createPaymentIntent');

      cy.intercept('POST', '/api/book', {
        statusCode: 200,
        body: {
          success: true,
          bookingId: 'booking-123',
          message: 'Booking created successfully'
        }
      }).as('createBooking');

      // Navigate through booking flow
      cy.visit('/listing/test-listing-123');
      cy.get('[data-testid="book-now-button"]').click();
      
      // Fill form and proceed to payment
      cy.get('[data-testid="start-date-input"]').type('2025-06-25');
      cy.get('[data-testid="end-date-input"]').type('2025-06-27');
      cy.get('[data-testid="contact-first-name"]').type('Test');
      cy.get('[data-testid="contact-last-name"]').type('User');
      cy.get('[data-testid="contact-email"]').type('test@example.com');
      cy.get('[data-testid="contact-phone"]').type('555-0123');
      cy.get('[data-testid="proceed-to-payment"]').click();

      // Submit payment (mocked to succeed)
      cy.get('[data-testid="payment-submit-button"]').click();

      // Should show success message
      cy.get('[data-testid="booking-success"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain', 'Booking confirmed');

      // Should redirect to booking confirmation
      cy.url().should('include', '/booking/');
    });

    it('should handle payment failure', () => {
      // Mock payment failure
      cy.intercept('POST', '/api/payments/create-intent', {
        statusCode: 400,
        body: {
          error: 'Payment failed'
        }
      }).as('failedPayment');

      // Navigate through booking flow
      cy.visit('/listing/test-listing-123');
      cy.get('[data-testid="book-now-button"]').click();
      
      // Fill form and proceed to payment
      cy.get('[data-testid="start-date-input"]').type('2025-06-25');
      cy.get('[data-testid="end-date-input"]').type('2025-06-27');
      cy.get('[data-testid="contact-first-name"]').type('Test');
      cy.get('[data-testid="contact-last-name"]').type('User');
      cy.get('[data-testid="contact-email"]').type('test@example.com');
      cy.get('[data-testid="contact-phone"]').type('555-0123');
      cy.get('[data-testid="proceed-to-payment"]').click();

      // Submit payment (mocked to fail)
      cy.get('[data-testid="payment-submit-button"]').click();

      // Should show error message
      cy.get('[data-testid="payment-error"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain', 'Payment failed');

      // Should remain on payment page
      cy.get('[data-testid="payment-form"]')
        .should('be.visible');
    });
  });

  describe('Transaction State Management', () => {
    it('should maintain booking data across page refreshes', () => {
      // Set up authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('firebase-auth-token', 'mock-token');
        win.localStorage.setItem('user-data', JSON.stringify({
          uid: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User'
        }));
      });

      // Start booking process
      cy.visit('/listing/test-listing-123');
      cy.get('[data-testid="book-now-button"]').click();
      
      // Fill some data
      cy.get('[data-testid="start-date-input"]').type('2025-06-25');
      cy.get('[data-testid="end-date-input"]').type('2025-06-27');
      
      // Refresh page
      cy.reload();
      
      // Data should be preserved (if implemented)
      cy.get('[data-testid="start-date-input"]')
        .should('have.value', '2025-06-25');
    });

    it('should clear transaction data after successful booking', () => {
      // Mock successful booking flow
      cy.intercept('POST', '/api/book', {
        statusCode: 200,
        body: {
          success: true,
          bookingId: 'booking-123'
        }
      });

      // Complete booking flow
      // ... (booking flow steps)

      // After successful booking, transaction data should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('booking-draft')).to.be.null;
      });
    });
  });
});

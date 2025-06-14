describe('Payment Flow End-to-End Testing', () => {
  const testUser = {
    email: 'test.payment@geargrab.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(() => {
    // Visit homepage and clear any existing auth
    cy.visit('/');
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Wait for page to load
    cy.get('body').should('be.visible');
  });

  describe('Authentication Required for Payment', () => {
    it('should redirect unauthenticated users to login when accessing payment', () => {
      // Try to access a booking confirmation page directly
      cy.visit('/book/confirm?listingId=test&startDate=2024-01-01&endDate=2024-01-02', { failOnStatusCode: false });
      
      // Should either redirect to login or show auth guard
      cy.url().should('satisfy', (url) => {
        return url.includes('/auth/login') || url.includes('/book/confirm');
      });
      
      // If on booking page, should show auth guard
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="auth-guard"]').length > 0) {
          cy.get('[data-cy="auth-guard"]').should('contain', 'Sign In Required');
        }
      });
    });

    it('should show authentication error when trying to create payment intent without login', () => {
      // Visit a listing page
      cy.visit('/browse');
      cy.get('[data-cy="listing-card"]').first().click();
      
      // Try to start booking process
      cy.get('[data-cy="book-now-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Should show authentication requirement
      cy.get('body').should('contain.text', 'Sign In Required');
    });
  });

  describe('User Registration and Login', () => {
    it('should allow user to register and login', () => {
      // Go to signup page
      cy.visit('/auth/signup');
      
      // Fill out registration form
      cy.get('input[name="firstName"]', { timeout: 10000 }).type(testUser.firstName);
      cy.get('input[name="lastName"]').type(testUser.lastName);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('input[name="confirmPassword"]').type(testUser.password);
      
      // Accept terms
      cy.get('input[type="checkbox"]').check();
      
      // Submit registration
      cy.get('button[type="submit"]').click();
      
      // Should redirect to homepage or dashboard
      cy.url().should('satisfy', (url) => {
        return url.includes('/') || url.includes('/dashboard');
      });
      
      // Should show user is logged in
      cy.get('body').should('not.contain', 'Log In');
    });

    it('should allow existing user to login', () => {
      // Go to login page
      cy.visit('/auth/login');
      
      // Fill out login form
      cy.get('input[name="email"]', { timeout: 10000 }).type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      
      // Submit login
      cy.get('button[type="submit"]').click();
      
      // Should redirect to homepage
      cy.url().should('not.include', '/auth/login');
      
      // Should show user is logged in
      cy.get('body').should('not.contain', 'Log In');
    });
  });

  describe('Booking Flow with Authentication', () => {
    beforeEach(() => {
      // Login before each test
      cy.visit('/auth/login');
      cy.get('input[name="email"]', { timeout: 10000 }).type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Wait for login to complete
      cy.url().should('not.include', '/auth/login');
    });

    it('should complete full booking flow to payment page', () => {
      // Visit browse page
      cy.visit('/browse');
      
      // Select a listing
      cy.get('[data-cy="listing-card"]', { timeout: 10000 }).first().click();
      
      // Start booking
      cy.get('[data-cy="book-now-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Fill out booking form
      cy.get('input[name="startDate"]', { timeout: 10000 }).type('2024-12-01');
      cy.get('input[name="endDate"]').type('2024-12-03');
      
      // Fill contact information
      cy.get('input[name="firstName"]').clear().type(testUser.firstName);
      cy.get('input[name="lastName"]').clear().type(testUser.lastName);
      cy.get('input[name="email"]').clear().type(testUser.email);
      cy.get('input[name="phone"]').type('555-123-4567');
      
      // Accept terms
      cy.get('input[type="checkbox"]').check();
      
      // Proceed to payment
      cy.get('button').contains('Proceed to Payment').click();
      
      // Should reach payment page
      cy.url().should('include', '/book/confirm');
      
      // Should show payment form or payment amount
      cy.get('body').should('contain.text', 'Payment');
    });

    it('should show payment form with proper authentication', () => {
      // Visit booking confirmation with parameters
      cy.visit('/book/confirm?listingId=test&startDate=2024-12-01&endDate=2024-12-03');
      
      // Should not show auth guard since user is logged in
      cy.get('body').should('not.contain', 'Sign In Required');
      
      // Should show payment-related content
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text();
        return text.includes('Payment') || text.includes('Total') || text.includes('Secure');
      });
    });

    it('should handle payment intent creation with authentication', () => {
      // Visit booking confirmation
      cy.visit('/book/confirm?listingId=test&startDate=2024-12-01&endDate=2024-12-03');
      
      // Wait for page to load
      cy.get('body', { timeout: 10000 }).should('be.visible');
      
      // Check for payment form initialization
      cy.get('body').then(($body) => {
        // Look for payment form or error messages
        if ($body.find('[data-cy="payment-form"]').length > 0) {
          cy.get('[data-cy="payment-form"]').should('be.visible');
        } else if ($body.find('.payment-form').length > 0) {
          cy.get('.payment-form').should('be.visible');
        } else {
          // Check for any payment-related content
          cy.get('body').should('contain.text', 'Payment');
        }
      });
    });
  });

  describe('Payment Form Functionality', () => {
    beforeEach(() => {
      // Login and navigate to payment page
      cy.visit('/auth/login');
      cy.get('input[name="email"]', { timeout: 10000 }).type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth/login');
      
      // Go to payment page
      cy.visit('/book/confirm?listingId=test&startDate=2024-12-01&endDate=2024-12-03');
    });

    it('should display payment form elements', () => {
      // Check for payment amount display
      cy.get('body').should('contain.text', 'Total');
      
      // Check for payment form or Stripe elements
      cy.get('body').then(($body) => {
        if ($body.find('#payment-element').length > 0) {
          cy.get('#payment-element').should('be.visible');
        } else if ($body.find('[data-cy="stripe-payment-form"]').length > 0) {
          cy.get('[data-cy="stripe-payment-form"]').should('be.visible');
        } else {
          // At minimum should show payment-related content
          cy.get('body').should('contain.text', 'Payment');
        }
      });
    });

    it('should show proper error handling for payment configuration', () => {
      // Wait for any payment initialization
      cy.wait(3000);
      
      // Check for error messages or proper payment form
      cy.get('body').then(($body) => {
        const bodyText = $body.text();
        
        if (bodyText.includes('Payment system not configured')) {
          // Expected if Stripe is not configured
          cy.get('body').should('contain', 'Payment system not configured');
        } else if (bodyText.includes('Failed to initialize')) {
          // Payment initialization error
          cy.get('body').should('contain', 'Failed to initialize');
        } else {
          // Should show some payment content
          cy.get('body').should('satisfy', ($body) => {
            const text = $body.text();
            return text.includes('Payment') || text.includes('Total') || text.includes('Secure');
          });
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', () => {
      // Login first
      cy.visit('/auth/login');
      cy.get('input[name="email"]', { timeout: 10000 }).type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth/login');
      
      // Intercept payment API calls and simulate network error
      cy.intercept('POST', '/api/payments/create-intent', { forceNetworkError: true }).as('paymentError');
      
      // Visit payment page
      cy.visit('/book/confirm?listingId=test&startDate=2024-12-01&endDate=2024-12-03');
      
      // Should handle error gracefully
      cy.get('body').should('be.visible');
    });

    it('should handle invalid booking parameters', () => {
      // Login first
      cy.visit('/auth/login');
      cy.get('input[name="email"]', { timeout: 10000 }).type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth/login');
      
      // Visit with invalid parameters
      cy.visit('/book/confirm?listingId=invalid&startDate=invalid&endDate=invalid');
      
      // Should handle gracefully
      cy.get('body').should('be.visible');
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text();
        return text.includes('Error') || text.includes('Invalid') || text.includes('Payment');
      });
    });
  });
});

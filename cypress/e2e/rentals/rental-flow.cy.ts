// Rental Flow End-to-End Tests
// Tests complete rental process from search to booking confirmation

describe('Rental Flow', () => {
  let testListing: any;
  let renterUser: any;
  let ownerUser: any;

  beforeEach(() => {
    cy.clearTestData();
    
    // Create owner user and listing
    cy.createTestUser({
      email: 'owner@example.com',
      password: 'password123',
      name: 'Listing Owner'
    }).then((user) => {
      ownerUser = user;
      cy.login('owner@example.com', 'password123');
      
      cy.createTestListing({
        title: 'Professional Camera Kit',
        description: 'Complete camera setup with lenses and accessories',
        category: 'photography',
        price: 85,
        location: 'San Francisco, CA',
        condition: 'excellent'
      }).then((listing) => {
        testListing = listing;
        cy.logout();
      });
    });
    
    // Create renter user
    cy.createTestUser({
      email: 'renter@example.com',
      password: 'password123',
      name: 'Gear Renter'
    }).then((user) => {
      renterUser = user;
    });
  });

  describe('Search and Discovery', () => {
    beforeEach(() => {
      cy.login('renter@example.com', 'password123');
    });

    it('should find listings through search', () => {
      cy.visit('/');
      
      // Search for camera equipment
      cy.get('[data-cy="search-input"]').type('camera');
      cy.get('[data-cy="search-button"]').click();
      
      cy.url().should('include', '/listings');
      cy.get('[data-cy="listing-card"]').should('have.length.at.least', 1);
      cy.get('[data-cy="listing-title"]').should('contain.text', 'Professional Camera Kit');
    });

    it('should filter by location', () => {
      cy.visitListings();
      
      cy.get('[data-cy="location-filter"]').type('San Francisco');
      cy.get('[data-cy="apply-filters-button"]').click();
      
      cy.get('[data-cy="listing-card"]').should('have.length.at.least', 1);
      cy.get('[data-cy="listing-location"]').should('contain.text', 'San Francisco');
    });

    it('should show listing details', () => {
      cy.visit(`/listings/${testListing.id}`);
      
      cy.get('[data-cy="listing-title"]').should('contain.text', testListing.title);
      cy.get('[data-cy="listing-description"]').should('contain.text', testListing.description);
      cy.get('[data-cy="listing-price"]').should('contain.text', `$${testListing.price}`);
      cy.get('[data-cy="listing-owner"]').should('contain.text', ownerUser.name);
      cy.get('[data-cy="book-now-button"]').should('be.visible');
    });
  });

  describe('Booking Process', () => {
    beforeEach(() => {
      cy.login('renter@example.com', 'password123');
    });

    it('should complete booking flow successfully', () => {
      cy.visit(`/listings/${testListing.id}`);
      
      // Select rental dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // 1 week from now
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10); // 10 days from now
      
      cy.get('[data-cy="start-date-input"]').type(startDate.toISOString().split('T')[0]);
      cy.get('[data-cy="end-date-input"]').type(endDate.toISOString().split('T')[0]);
      
      // Check availability
      cy.get('[data-cy="check-availability-button"]').click();
      cy.get('[data-cy="availability-confirmed"]').should('be.visible');
      
      // Proceed to booking
      cy.get('[data-cy="book-now-button"]').click();
      
      // Should redirect to booking page
      cy.url().should('include', '/book');
      
      // Verify booking details
      cy.get('[data-cy="booking-item-title"]').should('contain.text', testListing.title);
      cy.get('[data-cy="booking-dates"]').should('be.visible');
      cy.get('[data-cy="booking-total"]').should('be.visible');
      
      // Fill booking form
      cy.get('[data-cy="pickup-method"]').select('pickup');
      cy.get('[data-cy="special-instructions"]').type('Please handle with care');
      
      // Proceed to payment
      cy.get('[data-cy="proceed-to-payment-button"]').click();
      
      // Should redirect to payment page
      cy.url().should('include', '/payment');
    });

    it('should validate rental dates', () => {
      cy.visit(`/listings/${testListing.id}`);
      
      // Test past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      cy.get('[data-cy="start-date-input"]').type(pastDate.toISOString().split('T')[0]);
      cy.get('[data-cy="check-availability-button"]').click();
      
      cy.get('[data-cy="date-error"]').should('contain.text', 'Start date cannot be in the past');
      
      // Test end date before start date
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5);
      
      cy.get('[data-cy="start-date-input"]').clear().type(startDate.toISOString().split('T')[0]);
      cy.get('[data-cy="end-date-input"]').type(endDate.toISOString().split('T')[0]);
      cy.get('[data-cy="check-availability-button"]').click();
      
      cy.get('[data-cy="date-error"]').should('contain.text', 'End date must be after start date');
    });

    it('should calculate rental cost correctly', () => {
      cy.visit(`/listings/${testListing.id}`);
      
      // Select 3-day rental
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);
      
      cy.get('[data-cy="start-date-input"]').type(startDate.toISOString().split('T')[0]);
      cy.get('[data-cy="end-date-input"]').type(endDate.toISOString().split('T')[0]);
      cy.get('[data-cy="check-availability-button"]').click();
      
      // Verify cost calculation (3 days * $85 = $255)
      cy.get('[data-cy="rental-days"]').should('contain.text', '3 days');
      cy.get('[data-cy="daily-rate"]').should('contain.text', '$85');
      cy.get('[data-cy="subtotal"]').should('contain.text', '$255');
      cy.get('[data-cy="service-fee"]').should('be.visible');
      cy.get('[data-cy="total-cost"]').should('be.visible');
    });

    it('should prevent booking own listings', () => {
      // Login as owner
      cy.logout();
      cy.login('owner@example.com', 'password123');
      
      cy.visit(`/listings/${testListing.id}`);
      
      cy.get('[data-cy="book-now-button"]').should('not.exist');
      cy.get('[data-cy="own-listing-message"]').should('contain.text', 'You cannot book your own listing');
    });

    it('should handle conflicting bookings', () => {
      // Create existing booking for the same dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);
      
      // First booking
      cy.visit(`/listings/${testListing.id}`);
      cy.get('[data-cy="start-date-input"]').type(startDate.toISOString().split('T')[0]);
      cy.get('[data-cy="end-date-input"]').type(endDate.toISOString().split('T')[0]);
      cy.get('[data-cy="check-availability-button"]').click();
      
      // Simulate existing booking (would be done through API)
      cy.window().then((win) => {
        // Mock conflicting booking response
        cy.intercept('POST', '/api/bookings/check-availability', {
          statusCode: 409,
          body: { available: false, message: 'Dates not available' }
        });
      });
      
      cy.get('[data-cy="check-availability-button"]').click();
      cy.get('[data-cy="availability-error"]').should('contain.text', 'Dates not available');
      cy.get('[data-cy="book-now-button"]').should('be.disabled');
    });
  });

  describe('Payment Process', () => {
    beforeEach(() => {
      cy.login('renter@example.com', 'password123');
      
      // Navigate to payment page (would normally come from booking flow)
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

    it('should process payment successfully', () => {
      // Fill payment form
      cy.fillPaymentForm({
        number: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.completeStripePayment();
      
      // Should redirect to confirmation page
      cy.url().should('include', '/booking/confirmation');
      cy.get('[data-cy="booking-success-message"]').should('be.visible');
      cy.get('[data-cy="booking-reference"]').should('be.visible');
    });

    it('should handle payment failures', () => {
      // Use declined card
      cy.fillPaymentForm({
        number: '4000000000000002', // Declined card
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="payment-submit-button"]').click();
      
      cy.get('[data-cy="payment-error"]').should('contain.text', 'Your card was declined');
      cy.url().should('include', '/payment'); // Should stay on payment page
    });

    it('should validate payment form', () => {
      // Test empty form
      cy.get('[data-cy="payment-submit-button"]').click();
      
      cy.get('[data-cy="card-error"]').should('contain.text', 'Card number is required');
      
      // Test invalid card number
      cy.fillPaymentForm({
        number: '1234567890123456',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      });
      
      cy.get('[data-cy="payment-submit-button"]').click();
      cy.get('[data-cy="card-error"]').should('contain.text', 'Invalid card number');
    });
  });

  describe('Booking Management', () => {
    let booking: any;

    beforeEach(() => {
      // Create a test booking
      cy.login('renter@example.com', 'password123');
      
      // This would normally be created through the booking flow
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/bookings`,
        body: {
          listingId: testListing.id,
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          totalCost: 255
        },
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
        }
      }).then((response) => {
        booking = response.body;
      });
    });

    it('should display booking in user dashboard', () => {
      cy.visit('/dashboard/bookings');
      
      cy.get('[data-cy="booking-card"]').should('have.length.at.least', 1);
      cy.get('[data-cy="booking-title"]').should('contain.text', testListing.title);
      cy.get('[data-cy="booking-status"]').should('contain.text', 'Confirmed');
      cy.get('[data-cy="booking-dates"]').should('be.visible');
    });

    it('should allow booking cancellation', () => {
      cy.visit(`/dashboard/bookings/${booking.id}`);
      
      cy.get('[data-cy="cancel-booking-button"]').click();
      cy.get('[data-cy="cancel-confirmation-dialog"]').should('be.visible');
      cy.get('[data-cy="confirm-cancel-button"]').click();
      
      cy.shouldShowSuccess('Booking cancelled successfully');
      cy.get('[data-cy="booking-status"]').should('contain.text', 'Cancelled');
    });

    it('should show booking details', () => {
      cy.visit(`/dashboard/bookings/${booking.id}`);
      
      cy.get('[data-cy="booking-details"]').should('be.visible');
      cy.get('[data-cy="listing-info"]').should('be.visible');
      cy.get('[data-cy="rental-dates"]').should('be.visible');
      cy.get('[data-cy="payment-info"]').should('be.visible');
      cy.get('[data-cy="contact-owner-button"]').should('be.visible');
    });
  });

  describe('Owner Booking Management', () => {
    beforeEach(() => {
      cy.login('owner@example.com', 'password123');
    });

    it('should show incoming booking requests', () => {
      cy.visit('/dashboard/bookings/requests');
      
      cy.get('[data-cy="booking-request-card"]').should('be.visible');
      cy.get('[data-cy="accept-booking-button"]').should('be.visible');
      cy.get('[data-cy="decline-booking-button"]').should('be.visible');
    });

    it('should allow accepting booking requests', () => {
      cy.visit('/dashboard/bookings/requests');
      
      cy.get('[data-cy="accept-booking-button"]').first().click();
      cy.shouldShowSuccess('Booking request accepted');
      
      // Should move to confirmed bookings
      cy.visit('/dashboard/bookings');
      cy.get('[data-cy="booking-status"]').should('contain.text', 'Confirmed');
    });

    it('should allow declining booking requests', () => {
      cy.visit('/dashboard/bookings/requests');
      
      cy.get('[data-cy="decline-booking-button"]').first().click();
      cy.get('[data-cy="decline-reason-textarea"]').type('Equipment not available');
      cy.get('[data-cy="confirm-decline-button"]').click();
      
      cy.shouldShowSuccess('Booking request declined');
    });
  });
});

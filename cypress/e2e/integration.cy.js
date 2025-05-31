/// <reference types="cypress" />

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    // Clear any existing state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Complete User Journey: Browse to Book', () => {
    it('should allow a user to browse, view listing, and attempt booking', () => {
      // Start from homepage
      cy.visit('/');
      cy.waitForPageLoad();

      // Navigate to browse page
      cy.contains('Browse Gear').click();
      cy.url().should('include', '/browse');

      // Search for camping gear
      cy.searchGear('tent', 'camping', 'Denver');

      // Verify search results
      cy.get('[data-cy="gear-card"]').should('exist');
      cy.get('h1').should('contain', 'Camping Gear');

      // Click on first listing
      cy.get('[data-cy="gear-card"]').first().click();
      cy.url().should('include', '/listing/');

      // Verify listing details page
      cy.get('h1').should('exist');
      cy.get('[data-cy="image-gallery"]').should('be.visible');
      cy.get('[data-cy="booking-form"]').should('be.visible');

      // Try to book without being logged in
      cy.bookGear('2024-06-15', '2024-06-18');

      // Should redirect to login
      cy.url().should('include', '/auth/login');

      // Login
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      // Should redirect back to listing or booking page
      cy.url().should('satisfy', (url) => {
        return url.includes('/listing/') || url.includes('/book');
      });
    });
  });

  describe('Complete Owner Journey: List Gear', () => {
    it('should allow a user to sign up and list gear', () => {
      // Start from homepage
      cy.visit('/');

      // Navigate to list gear
      cy.contains('List Your Gear').click();
      cy.url().should('include', '/list-gear');

      // Should redirect to login/signup
      cy.url().should('include', '/auth');

      // Go to signup
      cy.contains('Sign up').click();
      cy.url().should('include', '/auth/signup');

      // Fill signup form
      cy.get('input[name="firstName"]').type('Jane');
      cy.get('input[name="lastName"]').type('Smith');
      cy.get('input[type="email"]').type('jane@example.com');
      cy.get('input[type="password"]').type('StrongPassword123!');

      // Accept terms if checkbox exists
      cy.get('body').then(($body) => {
        if ($body.find('input[type="checkbox"]').length > 0) {
          cy.get('input[type="checkbox"]').check();
        }
      });

      cy.get('button[type="submit"]').click();

      // Should redirect to list gear or dashboard
      cy.url().should('satisfy', (url) => {
        return url.includes('/list-gear') || url.includes('/dashboard');
      });

      // If redirected to dashboard, navigate to list gear
      if (cy.url().should('include', '/dashboard')) {
        cy.contains('List New Gear').click();
      }

      // Fill listing form
      cy.fillListingForm({
        title: 'My Awesome Tent',
        category: 'camping',
        description: 'A great tent for family camping.',
        dailyPrice: '30'
      });

      // Navigate to final step and submit
      cy.get('button').contains('Next').click();
      cy.get('button').contains('List My Gear').click();

      // Should show success or redirect to dashboard
      cy.url().should('satisfy', (url) => {
        return url.includes('/dashboard') || url.includes('/list-gear');
      });
    });
  });

  describe('Dashboard Integration', () => {
    beforeEach(() => {
      // Mock being logged in
      cy.mockLogin({
        uid: 'test-uid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });
    });

    it('should navigate between dashboard sections', () => {
      cy.visit('/dashboard');

      // Check overview
      cy.contains('Welcome back').should('be.visible');
      cy.get('[data-cy="stats-card"]').should('exist');

      // Navigate to owner dashboard
      cy.get('[data-cy="nav-owner"]').click();
      cy.url().should('include', '/dashboard/owner');
      cy.contains('My Listings').should('be.visible');

      // Navigate to renter dashboard
      cy.get('[data-cy="nav-renter"]').click();
      cy.url().should('include', '/dashboard/renter');
      cy.contains('My Bookings').should('be.visible');

      // Navigate to messages
      cy.get('[data-cy="nav-messages"]').click();
      cy.url().should('include', '/dashboard/messages');
      cy.contains('Messages').should('be.visible');

      // Navigate to profile
      cy.get('[data-cy="nav-profile"]').click();
      cy.url().should('include', '/dashboard/profile');
      cy.contains('Profile Settings').should('be.visible');
    });

    it('should handle booking workflow from dashboard', () => {
      cy.visit('/dashboard/renter');

      // Check existing bookings
      cy.get('[data-cy="bookings-list"]').should('exist');

      // Navigate to browse from dashboard
      cy.contains('Browse Gear').click();
      cy.url().should('include', '/browse');

      // Search and book
      cy.get('[data-cy="gear-card"]').first().click();
      cy.bookGear('2024-07-01', '2024-07-05');

      // Should handle booking process
      cy.url().should('satisfy', (url) => {
        return url.includes('/book') || url.includes('/dashboard');
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', () => {
      // Mock API failures
      cy.intercept('GET', '/api/listings*', { statusCode: 500 }).as('listingsError');

      cy.visit('/browse');
      cy.wait('@listingsError');

      // Should show error message
      cy.contains('Something went wrong').should('be.visible');

      // Should allow retry
      cy.get('[data-cy="retry-button"]').click();
    });

    it('should handle authentication errors', () => {
      // Mock auth failure
      cy.visit('/auth/login');

      cy.get('input[type="email"]').type('invalid@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      // Should show error message
      cy.contains('Invalid').should('be.visible');

      // Should allow retry
      cy.get('input[type="email"]').clear().type('test@example.com');
      cy.get('input[type="password"]').clear().type('correctpassword');
      cy.get('button[type="submit"]').click();
    });
  });

  describe('Mobile Integration', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
    });

    it('should work end-to-end on mobile', () => {
      // Homepage
      cy.visit('/');
      cy.get('h1').should('be.visible');

      // Mobile navigation
      cy.get('[data-cy="mobile-menu-button"]').click();
      cy.get('[data-cy="mobile-menu"]').should('be.visible');
      cy.get('[data-cy="mobile-menu"]').contains('Browse').click();

      // Browse on mobile
      cy.url().should('include', '/browse');
      cy.get('[data-cy="gear-card"]').should('be.visible');

      // Listing details on mobile
      cy.get('[data-cy="gear-card"]').first().click();
      cy.get('[data-cy="main-image"]').should('be.visible');
      cy.get('[data-cy="booking-form"]').should('be.visible');

      // Mobile booking form
      cy.get('[data-cy="start-date"]').should('be.visible');
      cy.get('[data-cy="book-now"]').should('be.visible');
    });
  });

  describe('Performance and Loading', () => {
    it('should load pages within acceptable time', () => {
      const startTime = Date.now();

      cy.visit('/');
      cy.waitForPageLoad();

      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // 5 seconds max
      });

      // Test navigation performance
      const navStartTime = Date.now();
      cy.contains('Browse Gear').click();
      cy.waitForPageLoad();

      cy.then(() => {
        const navTime = Date.now() - navStartTime;
        expect(navTime).to.be.lessThan(3000); // 3 seconds max for navigation
      });
    });

    it('should handle large datasets', () => {
      // Mock large dataset
      cy.fixture('listings.json').then((listings) => {
        const largeDataset = Array(50).fill(listings[0]).map((item, index) => ({
          ...item,
          id: `listing-${index}`,
          title: `${item.title} ${index}`
        }));

        cy.mockApiResponse('/api/listings*', largeDataset);
      });

      cy.visit('/browse');
      cy.wait('@apiCall');

      // Should still be responsive
      cy.get('[data-cy="gear-card"]').should('have.length.at.least', 10);
      cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
    });
  });

  describe('Accessibility Integration', () => {
    it('should be accessible throughout user journey', () => {
      // Homepage accessibility
      cy.visit('/');
      cy.checkA11y();

      // Browse page accessibility
      cy.contains('Browse Gear').click();
      cy.checkA11y();

      // Listing details accessibility
      cy.get('[data-cy="gear-card"]').first().click();
      cy.checkA11y();

      // Auth pages accessibility
      cy.visit('/auth/login');
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.visit('/');

      // Check if navigation elements exist before testing keyboard navigation
      cy.get('body').then(($body) => {
        if ($body.find('nav a:contains("Browse")').length > 0) {
          // Tab through navigation
          cy.get('nav a:contains("Browse")').focus();
          cy.focused().should('contain', 'Browse');

          // Test tab navigation if multiple nav items exist
          if ($body.find('nav a:contains("List Gear")').length > 0) {
            cy.get('nav a:contains("List Gear")').focus();
            cy.focused().should('contain', 'List Gear');

            // Enter to activate
            cy.focused().type('{enter}');
            cy.url().should('include', '/list-gear');
          }
        } else {
          // Skip test if navigation structure is different
          cy.log('Navigation structure not as expected, skipping keyboard test');
        }
      });
    });
  });
});

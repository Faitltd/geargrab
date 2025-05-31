/// <reference types="cypress" />

describe('Dashboard', () => {
  beforeEach(() => {
    // Mock being logged in
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }));
    });
    
    cy.visit('/dashboard');
  });

  describe('Dashboard Overview', () => {
    it('should display dashboard overview', () => {
      // Check page title
      cy.title().should('include', 'Dashboard');
      
      // Check welcome message
      cy.contains('Welcome back').should('be.visible');
      
      // Check dashboard navigation tabs
      cy.get('[data-cy="dashboard-nav"]').should('exist');
      cy.contains('Overview').should('be.visible');
      cy.contains('My Listings').should('be.visible');
      cy.contains('My Bookings').should('be.visible');
      cy.contains('Messages').should('be.visible');
      cy.contains('Profile').should('be.visible');
    });

    it('should display key metrics', () => {
      // Check stats cards
      cy.get('[data-cy="stats-card"]').should('have.length.at.least', 3);
      
      // Check for earnings, bookings, and listings stats
      cy.contains('Total Earnings').should('be.visible');
      cy.contains('Active Bookings').should('be.visible');
      cy.contains('Listed Items').should('be.visible');
    });

    it('should display recent activity', () => {
      // Check recent activity section
      cy.get('[data-cy="recent-activity"]').should('exist');
      cy.contains('Recent Activity').should('be.visible');
      
      // Check activity items
      cy.get('[data-cy="activity-item"]').should('exist');
    });

    it('should display quick actions', () => {
      // Check quick action buttons
      cy.get('[data-cy="quick-actions"]').should('exist');
      
      // Check list gear button
      cy.contains('List New Gear').should('be.visible').click();
      cy.url().should('include', '/list-gear');
      cy.go('back');
      
      // Check browse gear button
      cy.contains('Browse Gear').should('be.visible').click();
      cy.url().should('include', '/browse');
      cy.go('back');
    });
  });

  describe('My Listings (Owner Dashboard)', () => {
    beforeEach(() => {
      cy.get('[data-cy="nav-owner"]').click();
    });

    it('should display owner listings', () => {
      // Check page heading
      cy.contains('My Listings').should('be.visible');
      
      // Check listings grid
      cy.get('[data-cy="listings-grid"]').should('exist');
      
      // Check listing cards
      cy.get('[data-cy="listing-card"]').should('exist');
    });

    it('should allow editing listings', () => {
      // Click edit button on first listing
      cy.get('[data-cy="edit-listing"]').first().click();
      
      // Should navigate to edit page or show edit modal
      cy.url().should('satisfy', (url) => {
        return url.includes('/edit') || url.includes('/list-gear');
      });
    });

    it('should allow deleting listings', () => {
      // Click delete button
      cy.get('[data-cy="delete-listing"]').first().click();
      
      // Should show confirmation modal
      cy.get('[data-cy="confirm-delete"]').should('be.visible');
      
      // Cancel deletion
      cy.get('[data-cy="cancel-delete"]').click();
      cy.get('[data-cy="confirm-delete"]').should('not.exist');
      
      // Try deletion again and confirm
      cy.get('[data-cy="delete-listing"]').first().click();
      cy.get('[data-cy="confirm-delete-button"]').click();
      
      // Should show success message
      cy.contains('Listing deleted').should('be.visible');
    });

    it('should show listing status', () => {
      // Check status badges
      cy.get('[data-cy="listing-status"]').should('exist');
      
      // Should show different statuses
      cy.get('[data-cy="listing-status"]').should('contain.text', 'Active');
    });

    it('should allow toggling listing availability', () => {
      // Find toggle switch
      cy.get('[data-cy="availability-toggle"]').first().click();
      
      // Should update status
      cy.contains('Listing updated').should('be.visible');
    });

    it('should display booking requests', () => {
      // Check booking requests section
      cy.get('[data-cy="booking-requests"]').should('exist');
      
      // Check individual requests
      cy.get('[data-cy="booking-request"]').should('exist');
      
      // Test accepting a request
      cy.get('[data-cy="accept-booking"]').first().click();
      cy.contains('Booking accepted').should('be.visible');
      
      // Test declining a request
      cy.get('[data-cy="decline-booking"]').first().click();
      cy.contains('Booking declined').should('be.visible');
    });
  });

  describe('My Bookings (Renter Dashboard)', () => {
    beforeEach(() => {
      cy.get('[data-cy="nav-renter"]').click();
    });

    it('should display renter bookings', () => {
      // Check page heading
      cy.contains('My Bookings').should('be.visible');
      
      // Check bookings list
      cy.get('[data-cy="bookings-list"]').should('exist');
      
      // Check booking cards
      cy.get('[data-cy="booking-card"]').should('exist');
    });

    it('should show booking status', () => {
      // Check status badges
      cy.get('[data-cy="booking-status"]').should('exist');
      
      // Should show different statuses
      cy.get('[data-cy="booking-status"]').should('satisfy', ($el) => {
        const text = $el.text();
        return text.includes('Pending') || text.includes('Confirmed') || text.includes('Completed');
      });
    });

    it('should allow canceling bookings', () => {
      // Find cancelable booking
      cy.get('[data-cy="cancel-booking"]').first().click();
      
      // Should show confirmation
      cy.get('[data-cy="confirm-cancel"]').should('be.visible');
      
      // Confirm cancellation
      cy.get('[data-cy="confirm-cancel-button"]').click();
      
      // Should show success message
      cy.contains('Booking cancelled').should('be.visible');
    });

    it('should allow leaving reviews', () => {
      // Find completed booking
      cy.get('[data-cy="leave-review"]').first().click();
      
      // Should show review modal
      cy.get('[data-cy="review-modal"]').should('be.visible');
      
      // Fill review form
      cy.get('[data-cy="rating-stars"]').find('button').eq(4).click(); // 5 stars
      cy.get('[data-cy="review-text"]').type('Great experience! The gear was in excellent condition.');
      
      // Submit review
      cy.get('[data-cy="submit-review"]').click();
      
      // Should show success message
      cy.contains('Review submitted').should('be.visible');
    });

    it('should display booking details', () => {
      // Click on booking card
      cy.get('[data-cy="booking-card"]').first().click();
      
      // Should show booking details
      cy.get('[data-cy="booking-details"]').should('be.visible');
      
      // Check details content
      cy.contains('Booking Details').should('be.visible');
      cy.get('[data-cy="booking-dates"]').should('exist');
      cy.get('[data-cy="booking-total"]').should('exist');
    });
  });

  describe('Messages', () => {
    beforeEach(() => {
      cy.get('[data-cy="nav-messages"]').click();
    });

    it('should display messages interface', () => {
      // Check page heading
      cy.contains('Messages').should('be.visible');
      
      // Check conversations list
      cy.get('[data-cy="conversations-list"]').should('exist');
      
      // Check message area
      cy.get('[data-cy="message-area"]').should('exist');
    });

    it('should allow sending messages', () => {
      // Select a conversation
      cy.get('[data-cy="conversation"]').first().click();
      
      // Type message
      cy.get('[data-cy="message-input"]').type('Hello, I have a question about your gear.');
      
      // Send message
      cy.get('[data-cy="send-message"]').click();
      
      // Should appear in message list
      cy.contains('Hello, I have a question about your gear.').should('be.visible');
    });

    it('should show message timestamps', () => {
      // Check that messages have timestamps
      cy.get('[data-cy="message-timestamp"]').should('exist');
    });
  });

  describe('Profile Settings', () => {
    beforeEach(() => {
      cy.get('[data-cy="nav-profile"]').click();
    });

    it('should display profile form', () => {
      // Check page heading
      cy.contains('Profile Settings').should('be.visible');
      
      // Check form fields
      cy.get('input[name="firstName"]').should('have.value', 'John');
      cy.get('input[name="lastName"]').should('have.value', 'Doe');
      cy.get('input[name="email"]').should('have.value', 'test@example.com');
    });

    it('should allow updating profile', () => {
      // Update profile information
      cy.get('input[name="firstName"]').clear().type('Jane');
      cy.get('input[name="phone"]').type('555-123-4567');
      cy.get('textarea[name="bio"]').type('I love outdoor adventures!');
      
      // Save changes
      cy.get('[data-cy="save-profile"]').click();
      
      // Should show success message
      cy.contains('Profile updated').should('be.visible');
    });

    it('should allow uploading profile picture', () => {
      // Check if file upload exists
      cy.get('body').then(($body) => {
        if ($body.find('input[type="file"]').length > 0) {
          // Mock file upload
          cy.get('input[type="file"]').selectFile('cypress/fixtures/profile-pic.jpg', { force: true });
          
          // Should show preview
          cy.get('[data-cy="profile-preview"]').should('be.visible');
        }
      });
    });

    it('should allow changing password', () => {
      // Navigate to password section
      cy.get('[data-cy="change-password"]').click();
      
      // Fill password form
      cy.get('input[name="currentPassword"]').type('oldpassword');
      cy.get('input[name="newPassword"]').type('newpassword123');
      cy.get('input[name="confirmPassword"]').type('newpassword123');
      
      // Submit
      cy.get('[data-cy="update-password"]').click();
      
      // Should show success message
      cy.contains('Password updated').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      // Test mobile viewport
      cy.viewport(375, 667);
      
      // Check mobile navigation
      cy.get('[data-cy="mobile-dashboard-nav"]').should('be.visible');
      
      // Check that content is accessible
      cy.contains('Welcome back').should('be.visible');
      cy.get('[data-cy="stats-card"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      // Test tablet viewport
      cy.viewport(768, 1024);
      
      // Check that layout adapts
      cy.get('[data-cy="dashboard-nav"]').should('be.visible');
      cy.get('[data-cy="stats-card"]').should('be.visible');
    });
  });
});

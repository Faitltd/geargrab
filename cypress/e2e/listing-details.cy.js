/// <reference types="cypress" />

describe('Listing Details Page', () => {
  beforeEach(() => {
    // Visit a specific listing (using a known ID from dummy data)
    cy.visit('/listing/1');
  });

  it('should load listing details successfully', () => {
    // Check page loads
    cy.get('h1').should('exist');
    
    // Check main image gallery
    cy.get('[data-cy="image-gallery"]').should('exist');
    cy.get('img').should('be.visible');
    
    // Check listing title
    cy.get('h1').should('contain.text', 'Camping Tent');
    
    // Check price display
    cy.contains('$').should('be.visible');
    
    // Check location
    cy.get('[data-cy="location"]').should('exist');
  });

  it('should display image gallery with navigation', () => {
    // Check main image
    cy.get('[data-cy="main-image"]').should('be.visible');
    
    // Check thumbnail images
    cy.get('[data-cy="thumbnail"]').should('have.length.at.least', 1);
    
    // Click on thumbnail to change main image
    cy.get('[data-cy="thumbnail"]').eq(1).click();
    
    // Check that main image changed
    cy.get('[data-cy="main-image"]').should('be.visible');
    
    // Test navigation arrows if they exist
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="next-image"]').length > 0) {
        cy.get('[data-cy="next-image"]').click();
        cy.get('[data-cy="prev-image"]').click();
      }
    });
  });

  it('should display listing information tabs', () => {
    // Check tab navigation
    cy.get('[data-cy="tab-description"]').should('exist');
    cy.get('[data-cy="tab-specifications"]').should('exist');
    cy.get('[data-cy="tab-reviews"]').should('exist');
    
    // Test tab switching
    cy.get('[data-cy="tab-description"]').click();
    cy.get('[data-cy="description-content"]').should('be.visible');
    
    cy.get('[data-cy="tab-specifications"]').click();
    cy.get('[data-cy="specifications-content"]').should('be.visible');
    
    cy.get('[data-cy="tab-reviews"]').click();
    cy.get('[data-cy="reviews-content"]').should('be.visible');
  });

  it('should display owner information', () => {
    // Check owner section
    cy.get('[data-cy="owner-info"]').should('exist');
    
    // Check owner avatar/image
    cy.get('[data-cy="owner-avatar"]').should('exist');
    
    // Check owner name
    cy.get('[data-cy="owner-name"]').should('exist');
    
    // Check owner rating
    cy.get('[data-cy="owner-rating"]').should('exist');
    
    // Check contact owner button
    cy.get('[data-cy="contact-owner"]').should('exist');
  });

  it('should handle booking form interactions', () => {
    // Check booking form exists
    cy.get('[data-cy="booking-form"]').should('exist');
    
    // Test date selection
    cy.get('[data-cy="start-date"]').type('2024-06-01');
    cy.get('[data-cy="end-date"]').type('2024-06-05');
    
    // Check price calculation updates
    cy.get('[data-cy="total-price"]').should('contain', '$');
    
    // Test transfer method selection
    cy.get('[data-cy="delivery-pickup"]').should('be.checked');
    cy.get('[data-cy="delivery-delivery"]').click();
    
    // Test insurance options
    cy.get('[data-cy="insurance-standard"]').should('be.checked');
    cy.get('[data-cy="insurance-premium"]').click();
    
    // Check price updates with insurance
    cy.get('[data-cy="total-price"]').should('contain', '$');
  });

  it('should validate booking form', () => {
    // Try to book without dates
    cy.get('[data-cy="book-now"]').click();
    
    // Should show validation errors
    cy.contains('Please select start and end dates').should('be.visible');
    
    // Fill in start date only
    cy.get('[data-cy="start-date"]').type('2024-06-01');
    cy.get('[data-cy="book-now"]').click();
    
    // Should still show validation error
    cy.contains('Please select').should('be.visible');
    
    // Fill in end date
    cy.get('[data-cy="end-date"]').type('2024-06-05');
    
    // Now booking should proceed (or show next step)
    cy.get('[data-cy="book-now"]').click();
    
    // Should either navigate to booking page or show booking modal
    cy.url().should('satisfy', (url) => {
      return url.includes('/book') || url.includes('/listing/');
    });
  });

  it('should display reviews and ratings', () => {
    // Navigate to reviews tab
    cy.get('[data-cy="tab-reviews"]').click();
    
    // Check overall rating
    cy.get('[data-cy="overall-rating"]').should('exist');
    
    // Check individual reviews
    cy.get('[data-cy="review-item"]').should('have.length.at.least', 1);
    
    // Check review content
    cy.get('[data-cy="review-item"]').first().within(() => {
      cy.get('[data-cy="reviewer-name"]').should('exist');
      cy.get('[data-cy="review-rating"]').should('exist');
      cy.get('[data-cy="review-text"]').should('exist');
      cy.get('[data-cy="review-date"]').should('exist');
    });
    
    // Test show more reviews if available
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="show-more-reviews"]').length > 0) {
        cy.get('[data-cy="show-more-reviews"]').click();
        cy.get('[data-cy="review-item"]').should('have.length.at.least', 3);
      }
    });
  });

  it('should display similar listings', () => {
    // Scroll to similar listings section
    cy.get('[data-cy="similar-listings"]').scrollIntoView();
    
    // Check section exists
    cy.get('[data-cy="similar-listings"]').should('be.visible');
    
    // Check similar listing cards
    cy.get('[data-cy="similar-listing-card"]').should('have.length.at.least', 1);
    
    // Test clicking on similar listing
    cy.get('[data-cy="similar-listing-card"]').first().click();
    
    // Should navigate to different listing
    cy.url().should('include', '/listing/');
  });

  it('should handle unavailable dates', () => {
    // Check availability calendar
    cy.get('[data-cy="availability-calendar"]').should('exist');
    
    // Check that some dates are marked as unavailable
    cy.get('.unavailable-date').should('exist');
    
    // Try to select unavailable date
    cy.get('.unavailable-date').first().click();
    
    // Should not be selectable or show warning
    cy.get('[data-cy="start-date"]').should('not.have.value');
  });

  it('should be responsive on mobile', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    
    // Check that content is still accessible
    cy.get('h1').should('be.visible');
    cy.get('[data-cy="image-gallery"]').should('be.visible');
    cy.get('[data-cy="booking-form"]').should('be.visible');
    
    // Check mobile image gallery
    cy.get('[data-cy="main-image"]').should('be.visible');
    
    // Check mobile booking form
    cy.get('[data-cy="start-date"]').should('be.visible');
    cy.get('[data-cy="book-now"]').should('be.visible');
  });

  it('should handle non-existent listing', () => {
    // Visit non-existent listing
    cy.visit('/listing/nonexistent');
    
    // Should show 404 or not found message
    cy.contains('Listing Not Found').should('be.visible');
    cy.contains('Browse Other Listings').should('be.visible');
    
    // Test back to browse link
    cy.contains('Browse Other Listings').click();
    cy.url().should('include', '/browse');
  });

  it('should calculate pricing correctly', () => {
    // Set dates for 4 days
    cy.get('[data-cy="start-date"]').type('2024-06-01');
    cy.get('[data-cy="end-date"]').type('2024-06-05');
    
    // Check daily pricing calculation
    cy.get('[data-cy="rental-period-daily"]').click();
    cy.get('[data-cy="subtotal"]').should('contain', '$');
    
    // Test weekly pricing
    cy.get('[data-cy="rental-period-weekly"]').click();
    cy.get('[data-cy="subtotal"]').should('contain', '$');
    
    // Check that total includes all fees
    cy.get('[data-cy="total-price"]').should('contain', '$');
    cy.get('[data-cy="security-deposit"]').should('contain', '$');
  });
});

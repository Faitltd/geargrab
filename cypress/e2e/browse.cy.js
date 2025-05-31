/// <reference types="cypress" />

describe('Browse Gear Page', () => {
  beforeEach(() => {
    cy.visit('/browse');
  });

  it('should load the browse page successfully', () => {
    // Check page title
    cy.title().should('include', 'Browse Gear');
    
    // Check main heading
    cy.get('h1').should('contain', 'All Outdoor Gear');
    
    // Check that gear grid exists
    cy.get('[data-cy="gear-grid"]').should('exist');
  });

  it('should display search and filter components', () => {
    // Check hero search component
    cy.get('[data-cy="hero-search"]').should('exist');
    
    // Check search input
    cy.get('input[placeholder*="search"]').should('exist');
    
    // Check location input
    cy.get('input[placeholder*="location"]').should('exist');
    
    // Check category dropdown
    cy.get('select').should('exist');
    
    // Check search button
    cy.get('button').contains('Search').should('exist');
  });

  it('should filter by category', () => {
    // Test category filter
    cy.get('select').select('camping');
    cy.get('button').contains('Search').click();
    
    // Check URL updates
    cy.url().should('include', 'category=camping');
    
    // Check heading updates
    cy.get('h1').should('contain', 'Camping Gear');
    
    // Test another category
    cy.get('select').select('hiking');
    cy.get('button').contains('Search').click();
    
    cy.url().should('include', 'category=hiking');
    cy.get('h1').should('contain', 'Hiking Gear');
  });

  it('should search by location', () => {
    // Enter location
    cy.get('input[placeholder*="location"]').type('Denver');
    cy.get('button').contains('Search').click();
    
    // Check URL updates
    cy.url().should('include', 'location=Denver');
    
    // Check heading updates
    cy.get('h1').should('contain', 'in Denver');
  });

  it('should search by keyword', () => {
    // Enter search term
    cy.get('input[placeholder*="search"]').type('tent');
    cy.get('button').contains('Search').click();
    
    // Check URL updates
    cy.url().should('include', 'query=tent');
    
    // Results should be filtered (assuming there are tent listings)
    cy.get('[data-cy="gear-grid"]').should('exist');
  });

  it('should display gear listings', () => {
    // Check that gear cards exist
    cy.get('[data-cy="gear-card"]').should('exist');
    
    // Check gear card content
    cy.get('[data-cy="gear-card"]').first().within(() => {
      // Should have image
      cy.get('img').should('exist');
      
      // Should have title
      cy.get('h3').should('exist');
      
      // Should have price
      cy.contains('$').should('exist');
      
      // Should have location
      cy.get('[data-cy="location"]').should('exist');
    });
  });

  it('should navigate to listing details', () => {
    // Click on first gear card
    cy.get('[data-cy="gear-card"]').first().click();
    
    // Should navigate to listing details page
    cy.url().should('include', '/listing/');
    
    // Should show listing details
    cy.get('h1').should('exist');
    cy.contains('Book Now').should('exist');
  });

  it('should show filter sidebar', () => {
    // Check if filter button exists
    cy.get('[data-cy="filter-button"]').should('exist');
    
    // Click filter button
    cy.get('[data-cy="filter-button"]').click();
    
    // Check filter sidebar appears
    cy.get('[data-cy="filter-sidebar"]').should('be.visible');
    
    // Check filter options
    cy.get('[data-cy="filter-sidebar"]').within(() => {
      cy.contains('Category').should('exist');
      cy.contains('Price Range').should('exist');
      cy.contains('Availability').should('exist');
    });
  });

  it('should sort listings', () => {
    // Check sort dropdown exists
    cy.get('[data-cy="sort-select"]').should('exist');
    
    // Test different sort options
    cy.get('[data-cy="sort-select"]').select('price-low');
    cy.wait(1000); // Wait for sorting to apply
    
    cy.get('[data-cy="sort-select"]').select('price-high');
    cy.wait(1000);
    
    cy.get('[data-cy="sort-select"]').select('newest');
    cy.wait(1000);
  });

  it('should handle empty search results', () => {
    // Search for something that doesn't exist
    cy.get('input[placeholder*="search"]').type('nonexistentitem12345');
    cy.get('button').contains('Search').click();
    
    // Should show no results message
    cy.contains('No gear found').should('be.visible');
    cy.contains('Try adjusting your search').should('be.visible');
  });

  it('should be responsive on mobile', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    
    // Check that content is still accessible
    cy.get('h1').should('be.visible');
    cy.get('[data-cy="gear-grid"]').should('exist');
    
    // Check mobile search
    cy.get('input[placeholder*="search"]').should('be.visible');
    
    // Check mobile filter button
    cy.get('[data-cy="filter-button"]').should('be.visible');
  });

  it('should handle pagination if implemented', () => {
    // Check if pagination exists
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="pagination"]').length > 0) {
        // Test pagination
        cy.get('[data-cy="pagination"]').should('be.visible');
        
        // Test next page
        cy.get('[data-cy="next-page"]').click();
        cy.url().should('include', 'page=2');
        
        // Test previous page
        cy.get('[data-cy="prev-page"]').click();
        cy.url().should('include', 'page=1');
      }
    });
  });

  it('should show loading states', () => {
    // Intercept API calls to test loading states
    cy.intercept('GET', '/api/listings*', { delay: 2000, fixture: 'listings.json' }).as('getListings');
    
    // Trigger search
    cy.get('button').contains('Search').click();
    
    // Should show loading indicator
    cy.get('[data-cy="loading"]').should('be.visible');
    
    // Wait for API call
    cy.wait('@getListings');
    
    // Loading should disappear
    cy.get('[data-cy="loading"]').should('not.exist');
  });

  it('should handle API errors gracefully', () => {
    // Intercept API calls to simulate error
    cy.intercept('GET', '/api/listings*', { statusCode: 500 }).as('getListingsError');
    
    // Trigger search
    cy.get('button').contains('Search').click();
    
    // Wait for API call
    cy.wait('@getListingsError');
    
    // Should show error message
    cy.contains('Something went wrong').should('be.visible');
  });
});

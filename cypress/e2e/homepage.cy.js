/// <reference types="cypress" />

describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the homepage successfully', () => {
    // Check page title
    cy.title().should('include', 'GearGrab');

    // Check main heading
    cy.get('h1').should('contain', 'Adventure Awaits');

    // Check hero section
    cy.get('.relative.h-full').should('exist');
    cy.contains('Rent outdoor gear from local owners').should('be.visible');
  });

  it('should have working navigation links in header', () => {
    // Check navbar exists
    cy.get('nav').should('exist');

    // Check logo/brand link
    cy.get('nav').contains('GearGrab').should('exist');

    // Check main navigation links
    cy.get('nav').contains('Browse').should('exist');
    cy.get('nav').contains('List Gear').should('exist');
    cy.get('nav').contains('How It Works').should('exist');

    // Test Browse link
    cy.get('nav').contains('Browse').click();
    cy.url().should('include', '/browse');
    cy.go('back');

    // Test List Gear link
    cy.get('nav').contains('List Gear').click();
    cy.url().should('include', '/list-gear');
    cy.go('back');

    // Test How It Works link
    cy.get('nav').contains('How It Works').click();
    cy.url().should('include', '/how-it-works');
    cy.go('back');
  });

  it('should have working CTA buttons in hero section', () => {
    // Check Browse Gear button
    cy.contains('Browse Gear').should('be.visible').click();
    cy.url().should('include', '/browse');
    cy.go('back');

    // Check List Your Gear button
    cy.contains('List Your Gear').should('be.visible').click();
    cy.url().should('include', '/list-gear');
    cy.go('back');
  });

  it('should display gear categories section', () => {
    // Check section heading
    cy.contains('Browse by Category').should('be.visible');

    // Check that category cards exist
    cy.get('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4').should('exist');

    // Check for specific categories
    cy.contains('Camping').should('be.visible');
    cy.contains('Hiking').should('be.visible');
    cy.contains('Skiing').should('be.visible');
    cy.contains('Climbing').should('be.visible');

    // Test clicking on a category
    cy.contains('Camping').click();
    cy.url().should('include', '/browse?category=camping');
    cy.go('back');
  });

  it('should display how it works section', () => {
    // Check section heading
    cy.contains('How It Works').should('be.visible');

    // Check for the three steps
    cy.contains('Browse & Book').should('be.visible');
    cy.contains('Meet & Pickup').should('be.visible');
    cy.contains('Adventure & Return').should('be.visible');
  });

  it('should have working footer links', () => {
    // Scroll to footer
    cy.get('footer').scrollIntoView();

    // Check footer exists
    cy.get('footer').should('be.visible');

    // Check copyright text
    cy.get('footer').contains('GearGrab. All rights reserved').should('be.visible');
  });

  it('should be responsive on mobile', () => {
    // Test mobile viewport
    cy.viewport(375, 667);

    // Check that content is still visible
    cy.get('h1').should('be.visible');
    cy.contains('Adventure Awaits').should('be.visible');

    // Check mobile navigation - handle different possible implementations
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="mobile-menu-button"]').length > 0) {
        // Test data-cy implementation
        cy.get('[data-cy="mobile-menu-button"]').should('be.visible');
        cy.get('[data-cy="mobile-menu-button"]').click();
        cy.get('[data-cy="mobile-menu"]').should('be.visible');
        cy.get('[data-cy="mobile-menu"]').contains('Browse').should('be.visible');
        cy.get('[data-cy="mobile-menu"]').contains('List Gear').should('be.visible');
      } else if ($body.find('button:contains("Menu")').length > 0) {
        // Test generic menu button
        cy.get('button:contains("Menu")').should('be.visible');
        cy.get('button:contains("Menu")').click();
      } else {
        // Check that navigation is still accessible on mobile
        cy.get('nav').should('be.visible');
        cy.log('Mobile menu not found, but navigation is visible');
      }
    });
  });

  it('should have proper SEO meta tags', () => {
    // Check meta description
    cy.get('meta[name="description"]').should('exist');

    // Check that images have alt text
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });

  it('should handle scroll animations', () => {
    // Check that elements animate in on scroll
    cy.get('.animate-fade-in').should('exist');

    // Scroll down and check animations trigger
    cy.scrollTo(0, 500);
    cy.wait(500);

    // Elements should be visible after scroll
    cy.get('.animate-fade-in').should('be.visible');
  });

  it('should load external images properly', () => {
    // Check that category images load
    cy.get('.grid img').should('be.visible');

    // Check that images have proper src attributes
    cy.get('.grid img').each(($img) => {
      cy.wrap($img).should('have.attr', 'src').and('not.be.empty');
    });
  });
});

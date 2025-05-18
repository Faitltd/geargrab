/// <reference types="cypress" />

describe('Listing Creation Form', () => {
  beforeEach(() => {
    // Visit the list-gear page before each test
    cy.visit('/list-gear');
  });

  it('should display the form with the correct initial state', () => {
    // Check page title
    cy.get('h1').should('contain', 'List Your Gear');
    
    // Check progress steps
    cy.get('.w-8.h-8.rounded-full').should('have.length', 5);
    cy.get('.w-8.h-8.rounded-full').first().should('have.class', 'bg-green-500');
    
    // Check form fields
    cy.get('#title').should('exist');
    cy.get('#category').should('exist');
    cy.get('#description').should('exist');
    
    // Check navigation buttons
    cy.get('button').contains('Next').should('exist');
    cy.get('button').contains('Previous').should('not.exist');
  });

  it('should navigate through all steps of the form', () => {
    // Fill out Step 1: Basic Info
    cy.get('#title').type('Test Camping Tent');
    cy.get('#category').select('camping');
    cy.get('#description').type('This is a test description for a camping tent. It includes all the necessary details about the tent.');
    
    // Navigate to Step 2
    cy.get('button').contains('Next').click();
    cy.get('h2').should('contain', 'Gear Details');
    
    // Fill out Step 2: Details
    cy.get('#brand').type('Test Brand');
    cy.get('#model').type('Test Model');
    cy.get('#condition').select('Like New');
    cy.get('#age').type('1');
    
    // Fill out features
    cy.get('#feature-0').type('Waterproof');
    cy.get('button').contains('+ Add Feature').click();
    cy.get('#feature-1').type('Easy setup');
    
    // Fill out specifications
    cy.get('#spec-key-0').type('Weight');
    cy.get('#spec-value-0').type('5 lbs');
    
    // Navigate to Step 3
    cy.get('button').contains('Next').click();
    cy.get('h2').should('contain', 'Images');
    
    // Skip image upload for now (we'll test this separately)
    
    // Navigate to Step 4
    cy.get('button').contains('Next').click();
    cy.get('h2').should('contain', 'Pricing & Location');
    
    // Fill out Step 4: Pricing & Location
    cy.get('#dailyPrice').type('25');
    cy.get('#weeklyPrice').type('150');
    cy.get('#monthlyPrice').type('500');
    cy.get('#securityDeposit').type('100');
    
    cy.get('#city').type('Denver');
    cy.get('#state').type('CO');
    cy.get('#zipCode').type('80202');
    
    // Check pickup option and fill location
    cy.get('#pickup').should('be.checked');
    cy.get('#pickupLocation').type('Downtown Denver');
    
    // Navigate to Step 5
    cy.get('button').contains('Next').click();
    cy.get('h2').should('contain', 'Preview Your Listing');
    
    // Verify preview content
    cy.contains('Test Camping Tent');
    cy.contains('Test Brand');
    cy.contains('Like New');
    cy.contains('Waterproof');
    cy.contains('Easy setup');
    cy.contains('Weight: 5 lbs');
    cy.contains('$25');
    cy.contains('Denver, CO');
    
    // Submit form
    cy.get('button').contains('List My Gear').click();
    
    // Verify form was submitted (we should be back at step 1)
    cy.get('h2').should('contain', 'Basic Information');
    cy.get('#title').should('have.value', '');
  });

  it('should validate required fields', () => {
    // Try to proceed without filling required fields
    cy.get('button').contains('Next').click();
    
    // We should still be on step 1, but with validation errors
    cy.get('h2').should('contain', 'Basic Information');
    
    // Fill only some fields and try again
    cy.get('#title').type('Test Tent');
    cy.get('button').contains('Next').click();
    
    // Fill the remaining required fields
    cy.get('#category').select('camping');
    cy.get('#description').type('This is a test description.');
    
    // Now we should be able to proceed
    cy.get('button').contains('Next').click();
    cy.get('h2').should('contain', 'Gear Details');
  });

  it('should test the availability calendar', () => {
    // Navigate to the pricing & location step
    cy.get('#title').type('Test Tent');
    cy.get('#category').select('camping');
    cy.get('#description').type('This is a test description.');
    cy.get('button').contains('Next').click();
    
    cy.get('#brand').type('Test Brand');
    cy.get('#feature-0').type('Waterproof');
    cy.get('button').contains('Next').click();
    
    cy.get('button').contains('Next').click();
    
    // We should now be on the pricing & location step
    cy.get('h2').should('contain', 'Pricing & Location');
    
    // Fill required fields
    cy.get('#dailyPrice').type('25');
    cy.get('#city').type('Denver');
    cy.get('#state').type('CO');
    cy.get('#zipCode').type('80202');
    
    // Test the calendar
    // Find and click on a calendar day
    cy.get('.calendar-day.current-month').not('.disabled').first().click();
    
    // Verify that the date was selected
    cy.get('.bg-red-100.text-red-800').should('exist');
    
    // Click the same date again to deselect
    cy.get('.calendar-day.selected').click();
    
    // Verify that the date was deselected
    cy.get('.bg-red-100.text-red-800').should('not.exist');
    
    // Select multiple dates
    cy.get('.calendar-day.current-month').not('.disabled').eq(1).click();
    cy.get('.calendar-day.current-month').not('.disabled').eq(5).click();
    
    // Verify that both dates were selected
    cy.get('.bg-red-100.text-red-800').should('have.length', 2);
    
    // Test removing a date using the X button
    cy.get('.bg-red-100.text-red-800').first().find('button').click();
    
    // Verify that one date was removed
    cy.get('.bg-red-100.text-red-800').should('have.length', 1);
  });

  // This test is a placeholder since we can't easily test file uploads in Cypress
  it('should have a working image uploader component', () => {
    // Navigate to the images step
    cy.get('#title').type('Test Tent');
    cy.get('#category').select('camping');
    cy.get('#description').type('This is a test description.');
    cy.get('button').contains('Next').click();
    
    cy.get('#brand').type('Test Brand');
    cy.get('#feature-0').type('Waterproof');
    cy.get('button').contains('Next').click();
    
    // We should now be on the images step
    cy.get('h2').should('contain', 'Images');
    
    // Verify the image uploader exists
    cy.get('.image-uploader').should('exist');
    cy.get('.upload-area').should('exist');
    
    // We can't easily test actual file uploads in Cypress without additional setup
    // But we can verify the component is rendered correctly
    cy.get('.upload-text').should('contain', 'Drag & drop images here');
    cy.get('.upload-hint').should('contain', '0 of 5 images uploaded');
  });
});

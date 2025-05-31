/// <reference types="cypress" />
// ***********************************************
// Custom commands for GearGrab E2E testing
// ***********************************************

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();

  // Wait for redirect
  cy.url().should('not.include', '/auth/login');
});

// Mock login without UI interaction
Cypress.Commands.add('mockLogin', (userData = {}) => {
  const defaultUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    ...userData
  };

  cy.window().then((win) => {
    win.localStorage.setItem('user', JSON.stringify(defaultUser));
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="logout"]').click();
  cy.url().should('satisfy', (url) => {
    return url.includes('/') || url.includes('/auth/login');
  });
});

// Fill listing form command
Cypress.Commands.add('fillListingForm', (listingData = {}) => {
  const defaultData = {
    title: 'Test Camping Tent',
    category: 'camping',
    description: 'This is a test description for a camping tent.',
    brand: 'Test Brand',
    model: 'Test Model',
    condition: 'Like New',
    age: '1',
    features: ['Waterproof', 'Easy setup'],
    dailyPrice: '25',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    ...listingData
  };

  // Step 1: Basic Info
  cy.get('#title').type(defaultData.title);
  cy.get('#category').select(defaultData.category);
  cy.get('#description').type(defaultData.description);
  cy.get('button').contains('Next').click();

  // Step 2: Details
  cy.get('#brand').type(defaultData.brand);
  cy.get('#model').type(defaultData.model);
  cy.get('#condition').select(defaultData.condition);
  cy.get('#age').type(defaultData.age);

  // Add features
  defaultData.features.forEach((feature, index) => {
    if (index > 0) {
      cy.get('button').contains('+ Add Feature').click();
    }
    cy.get(`#feature-${index}`).type(feature);
  });

  cy.get('button').contains('Next').click();

  // Step 3: Images (skip for now)
  cy.get('button').contains('Next').click();

  // Step 4: Pricing & Location
  cy.get('#dailyPrice').type(defaultData.dailyPrice);
  cy.get('#city').type(defaultData.city);
  cy.get('#state').type(defaultData.state);
  cy.get('#zipCode').type(defaultData.zipCode);
});

// Search for gear command
Cypress.Commands.add('searchGear', (query: string, category?: string, location?: string) => {
  cy.visit('/browse');

  if (query) {
    cy.get('input[placeholder*="search"]').type(query);
  }

  if (category) {
    cy.get('select').select(category);
  }

  if (location) {
    cy.get('input[placeholder*="location"]').type(location);
  }

  cy.get('button').contains('Search').click();
});

// Book gear command
Cypress.Commands.add('bookGear', (startDate: string, endDate: string) => {
  cy.get('[data-cy="start-date"]').type(startDate);
  cy.get('[data-cy="end-date"]').type(endDate);
  cy.get('[data-cy="book-now"]').click();
});

// Check responsive design command
Cypress.Commands.add('checkResponsive', (viewports: Array<{width: number, height: number}>) => {
  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);

    // Check basic layout
    cy.get('body').should('be.visible');
    cy.get('nav').should('be.visible');

    // Check no horizontal overflow
    cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
  });
});

// Wait for page load command
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');

  // Wait for loading indicators to disappear (if they exist)
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="loading"]').length > 0) {
      cy.get('[data-cy="loading"]').should('not.exist');
    }
    if ($body.find('.loading').length > 0) {
      cy.get('.loading').should('not.exist');
    }
  });

  // Wait for any pending network requests
  cy.wait(500);
});

// Check accessibility command
Cypress.Commands.add('checkA11y', () => {
  // Check for alt text on images
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });

  // Check for proper heading hierarchy
  cy.get('h1').should('have.length', 1);

  // Check for focus management
  cy.get('button, a, input, select, textarea').each(($el) => {
    cy.wrap($el).should('be.visible');
  });
});

// Mock API responses command
Cypress.Commands.add('mockApiResponse', (endpoint: string, response: any, statusCode = 200) => {
  cy.intercept('GET', endpoint, {
    statusCode,
    body: response
  }).as('apiCall');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      mockLogin(userData?: object): Chainable<void>
      logout(): Chainable<void>
      fillListingForm(listingData?: object): Chainable<void>
      searchGear(query: string, category?: string, location?: string): Chainable<void>
      bookGear(startDate: string, endDate: string): Chainable<void>
      checkResponsive(viewports: Array<{width: number, height: number}>): Chainable<void>
      waitForPageLoad(): Chainable<void>
      checkA11y(): Chainable<void>
      mockApiResponse(endpoint: string, response: any, statusCode?: number): Chainable<void>
    }
  }
}
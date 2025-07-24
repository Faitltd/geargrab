// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login a user
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password') => {
  cy.visit('/');
  
  // Mock authentication for testing
  cy.window().then((win) => {
    win.localStorage.setItem('user', JSON.stringify({
      id: 'test-user-id',
      email: email,
      full_name: 'Test User',
      is_active: true
    }));
  });
  
  cy.reload();
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('user');
  });
  cy.reload();
});

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode: statusCode,
    body: response
  });
});

// Custom command to fill tax information form
Cypress.Commands.add('fillTaxInformation', (taxInfo) => {
  if (taxInfo.entity_type) {
    cy.get('[data-testid="entity-type-select"]').select(taxInfo.entity_type);
  }
  
  if (taxInfo.business_name) {
    cy.get('[data-testid="business-name-input"]').type(taxInfo.business_name);
  }
  
  if (taxInfo.tax_id_type) {
    cy.get('[data-testid="tax-id-type-select"]').select(taxInfo.tax_id_type);
  }
  
  if (taxInfo.tax_id_number) {
    cy.get('[data-testid="tax-id-number-input"]').type(taxInfo.tax_id_number);
  }
  
  if (taxInfo.address) {
    cy.get('[data-testid="street-address-input"]').type(taxInfo.address.street);
    cy.get('[data-testid="city-input"]').type(taxInfo.address.city);
    cy.get('[data-testid="state-input"]').type(taxInfo.address.state);
    cy.get('[data-testid="zip-input"]').type(taxInfo.address.zip);
  }
});

// Custom command to create a test rental
Cypress.Commands.add('createTestRental', (rentalData) => {
  const defaultRental = {
    gear_item_id: 'test-gear-1',
    renter_email: 'renter@example.com',
    owner_email: 'owner@example.com',
    start_date: '2024-01-01',
    end_date: '2024-01-03',
    total_amount: 150,
    status: 'confirmed'
  };
  
  const rental = { ...defaultRental, ...rentalData };
  
  cy.mockApiResponse('POST', '**/api/rentals', { id: 'test-rental-1', ...rental });
  cy.mockApiResponse('GET', '**/api/rentals', [{ id: 'test-rental-1', ...rental }]);
});

// Custom command to wait for page to load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="page-loader"]', { timeout: 10000 }).should('not.exist');
});

// Custom command to check accessibility
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y();
});

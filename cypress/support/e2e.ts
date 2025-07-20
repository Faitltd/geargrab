// Cypress E2E support file
// Import commands, utilities, and setup for end-to-end testing

import './commands';

// Global test configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore certain errors that don't affect functionality
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  if (err.message.includes('Script error')) {
    return false;
  }
  
  // Let other errors fail the test
  return true;
});

// Before each test
beforeEach(() => {
  // Clear local storage and cookies
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set viewport
  cy.viewport(1280, 720);
  
  // Intercept common API calls
  cy.intercept('GET', '/api/health', { statusCode: 200, body: { status: 'healthy' } }).as('healthCheck');
  
  // Mock Firebase Auth if needed
  cy.window().then((win) => {
    // Mock Firebase Auth for testing
    if (win.firebase) {
      // Setup Firebase mocks
    }
  });
});

// After each test
afterEach(() => {
  // Take screenshot on failure
  if (Cypress.currentTest.state === 'failed') {
    cy.screenshot(`failed-${Cypress.currentTest.title}`);
  }
});

// Global commands and utilities
declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      
      // Navigation commands
      visitDashboard(): Chainable<void>;
      visitListings(): Chainable<void>;
      visitProfile(): Chainable<void>;
      visitAdmin(): Chainable<void>;
      
      // Form commands
      fillLoginForm(email: string, password: string): Chainable<void>;
      fillRegistrationForm(userData: any): Chainable<void>;
      fillListingForm(listingData: any): Chainable<void>;
      
      // Wait commands
      waitForPageLoad(): Chainable<void>;
      waitForAuth(): Chainable<void>;
      waitForListings(): Chainable<void>;
      
      // Assertion commands
      shouldBeLoggedIn(): Chainable<void>;
      shouldBeLoggedOut(): Chainable<void>;
      shouldShowError(message?: string): Chainable<void>;
      shouldShowSuccess(message?: string): Chainable<void>;
      
      // Data commands
      seedTestData(): Chainable<void>;
      clearTestData(): Chainable<void>;
      createTestListing(data?: any): Chainable<any>;
      createTestUser(data?: any): Chainable<any>;
      
      // Payment commands
      fillPaymentForm(cardData?: any): Chainable<void>;
      completeStripePayment(): Chainable<void>;
      
      // File upload commands
      uploadFile(fileName: string, selector?: string): Chainable<void>;
      uploadImages(fileNames: string[]): Chainable<void>;
    }
  }
}

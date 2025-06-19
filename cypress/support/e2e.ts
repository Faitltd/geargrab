// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import './fallback-selectors'
import './auth-commands'

// Global test configuration
beforeEach(() => {
  // Set up common interceptors
  cy.intercept('POST', '/api/auth/login').as('loginRequest');
  cy.intercept('POST', '/api/auth/logout').as('logoutRequest');
  cy.intercept('GET', '/api/auth/session').as('sessionRequest');
  cy.intercept('POST', '/api/auth/register').as('registerRequest');
  cy.intercept('POST', '/api/auth/refresh').as('refreshRequest');

  // Set up error handling
  cy.on('uncaught:exception', (err, runnable) => {
    // Ignore certain expected errors during testing
    if (err.message.includes('ResizeObserver loop limit exceeded')) {
      return false;
    }
    if (err.message.includes('Non-Error promise rejection captured')) {
      return false;
    }
    return true;
  });
});

// Global after hook for cleanup
afterEach(() => {
  // Clean up any test data or state if needed
  cy.window().then((win) => {
    // Clear any test flags
    delete win.testMode;
    delete win.authInitialized;
  });
});
// Custom Cypress commands for GearGrab testing

// Authentication Commands
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_USER_EMAIL') || 'test@example.com';
  const testPassword = password || Cypress.env('TEST_USER_PASSWORD') || 'TestPassword123!';

  // Mock login by setting localStorage and visiting a page that shows logged in state
  cy.window().then((win) => {
    win.localStorage.setItem('authToken', 'mock-auth-token');
    win.localStorage.setItem('user', JSON.stringify({
      uid: 'test-user-123',
      email: testEmail,
      name: 'Test User',
      emailVerified: true
    }));
  });

  // Visit home page to trigger auth state update
  cy.visit('/');
  cy.wait(1000); // Give time for auth state to update
});

Cypress.Commands.add('logout', () => {
  // Mock logout by clearing localStorage
  cy.window().then((win) => {
    win.localStorage.removeItem('authToken');
    win.localStorage.removeItem('user');
  });

  // Visit home page to trigger auth state update
  cy.visit('/');
  cy.wait(1000); // Give time for auth state to update
});

Cypress.Commands.add('loginAsAdmin', () => {
  const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || 'admin@example.com';

  // Mock admin login by setting localStorage with admin user
  cy.window().then((win) => {
    win.localStorage.setItem('authToken', 'mock-admin-token');
    win.localStorage.setItem('user', JSON.stringify({
      uid: 'admin-uid-1', // This matches the ADMIN_UIDS in admin.service.ts
      email: adminEmail,
      name: 'Test Admin',
      emailVerified: true,
      role: 'admin'
    }));
  });

  // Visit home page to trigger auth state update
  cy.visit('/');
  cy.wait(1000); // Give time for auth state to update
});

// Navigation Commands
Cypress.Commands.add('visitDashboard', () => {
  cy.visit('/dashboard');
  cy.waitForPageLoad();
});

Cypress.Commands.add('visitListings', () => {
  cy.visit('/listings');
  cy.waitForListings();
});

Cypress.Commands.add('visitProfile', () => {
  cy.visit('/dashboard/profile');
  cy.waitForPageLoad();
});

Cypress.Commands.add('visitAdmin', () => {
  cy.visit('/admin');
  cy.waitForPageLoad();
});

// Form Commands
Cypress.Commands.add('fillLoginForm', (email: string, password: string) => {
  cy.get('[data-cy="email-input"]').clear().type(email);
  cy.get('[data-cy="password-input"]').clear().type(password);
});

Cypress.Commands.add('fillRegistrationForm', (userData) => {
  cy.get('[data-cy="name-input"]').clear().type(userData.name);
  cy.get('[data-cy="email-input"]').clear().type(userData.email);
  cy.get('[data-cy="password-input"]').clear().type(userData.password);
  cy.get('[data-cy="confirm-password-input"]').clear().type(userData.confirmPassword);
  
  if (userData.agreeToTerms) {
    cy.get('[data-cy="terms-checkbox"]').check();
  }
});

Cypress.Commands.add('fillListingForm', (listingData) => {
  cy.get('[data-cy="title-input"]').clear().type(listingData.title);
  cy.get('[data-cy="description-textarea"]').clear().type(listingData.description);
  cy.get('[data-cy="category-select"]').select(listingData.category);
  cy.get('[data-cy="price-input"]').clear().type(listingData.price.toString());
  cy.get('[data-cy="location-input"]').clear().type(listingData.location);
  
  if (listingData.condition) {
    cy.get('[data-cy="condition-select"]').select(listingData.condition);
  }
  
  if (listingData.brand) {
    cy.get('[data-cy="brand-input"]').clear().type(listingData.brand);
  }
});

// Wait Commands
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.get('[data-cy="loading-spinner"]').should('not.exist');
});

Cypress.Commands.add('waitForAuth', () => {
  // Wait for the page to be ready instead of Firebase
  cy.get('body').should('be.visible');
  cy.get('[data-cy="auth-loading"]').should('not.exist');
});

Cypress.Commands.add('waitForListings', () => {
  cy.get('[data-cy="listings-container"]').should('be.visible');
  cy.get('[data-cy="listings-loading"]').should('not.exist');
});

// Assertion Commands
Cypress.Commands.add('shouldBeLoggedIn', () => {
  // Check for any indication of logged in state
  cy.window().then((win) => {
    expect(win.localStorage.getItem('authToken')).to.exist;
    expect(win.localStorage.getItem('user')).to.exist;
  });
});

Cypress.Commands.add('shouldBeLoggedOut', () => {
  // Check for absence of auth tokens
  cy.window().then((win) => {
    expect(win.localStorage.getItem('authToken')).to.be.null;
    expect(win.localStorage.getItem('user')).to.be.null;
  });
});

Cypress.Commands.add('shouldShowError', (message?: string) => {
  cy.get('[data-cy="error-message"]').should('be.visible');
  if (message) {
    cy.get('[data-cy="error-message"]').should('contain.text', message);
  }
});

Cypress.Commands.add('shouldShowSuccess', (message?: string) => {
  cy.get('[data-cy="success-message"]').should('be.visible');
  if (message) {
    cy.get('[data-cy="success-message"]').should('contain.text', message);
  }
});

// Data Commands
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase');
});

Cypress.Commands.add('clearTestData', () => {
  cy.task('clearDatabase');
});

Cypress.Commands.add('createTestListing', (data = {}) => {
  const defaultData = {
    title: 'Test Camping Tent',
    description: 'A great tent for camping adventures',
    category: 'camping',
    price: 50,
    location: 'San Francisco, CA',
    condition: 'excellent',
    brand: 'GearGrab'
  };
  
  const listingData = { ...defaultData, ...data };
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/listings`,
    body: listingData,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201);
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('createTestUser', (data = {}) => {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  };
  
  const userData = { ...defaultData, ...data };
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/auth/register`,
    body: userData
  }).then((response) => {
    expect(response.status).to.eq(201);
    return cy.wrap(response.body);
  });
});

// Payment Commands
Cypress.Commands.add('fillPaymentForm', (cardData = {}) => {
  const defaultCard = {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    name: 'Test User'
  };
  
  const card = { ...defaultCard, ...cardData };
  
  // Wait for Stripe Elements to load
  cy.get('[data-cy="stripe-card-element"]').should('be.visible');
  
  // Fill Stripe Elements (this would need custom implementation)
  cy.window().then((win) => {
    // Mock Stripe payment for testing
    if (win.Stripe) {
      // Implementation would interact with Stripe Elements
    }
  });
});

Cypress.Commands.add('completeStripePayment', () => {
  cy.get('[data-cy="payment-submit-button"]').click();
  cy.get('[data-cy="payment-processing"]').should('be.visible');
  cy.get('[data-cy="payment-success"]').should('be.visible', { timeout: 15000 });
});

// File Upload Commands
Cypress.Commands.add('uploadFile', (fileName: string, selector = '[data-cy="file-input"]') => {
  cy.get(selector).selectFile(`cypress/fixtures/${fileName}`, { force: true });
});

Cypress.Commands.add('uploadImages', (fileNames: string[]) => {
  const files = fileNames.map(name => `cypress/fixtures/${name}`);
  cy.get('[data-cy="image-upload"]').selectFile(files, { force: true });
  
  // Wait for upload to complete
  cy.get('[data-cy="upload-progress"]').should('not.exist');
  cy.get('[data-cy="upload-success"]').should('be.visible');
});

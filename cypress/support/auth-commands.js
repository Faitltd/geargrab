/**
 * Cypress Custom Commands for Authentication Testing (JavaScript Version)
 * 
 * Custom commands to simplify authentication testing workflows
 * including login, logout, session management, and API interactions.
 */

/**
 * Login via UI form
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/auth/login');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  
  // Wait for login to complete
  cy.intercept('POST', '/api/auth/login').as('loginRequest');
  cy.wait('@loginRequest');
  
  // Verify successful login
  cy.url().should('not.include', '/auth/login');
  cy.getCookie('__session').should('exist');
});

/**
 * Login programmatically via API (faster for test setup)
 */
Cypress.Commands.add('loginApi', (email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('success', true);
    expect(response.body).to.have.property('token');
    
    // Store token in localStorage
    const token = response.body.token;
    const user = response.body.user;
    
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', token);
      win.localStorage.setItem('user_data', JSON.stringify(user));
    });
    
    // Set authentication cookies if provided
    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];
      cookies.forEach((cookie) => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        cy.setCookie(name, value);
      });
    }
  });
});

/**
 * Logout user
 */
Cypress.Commands.add('logout', () => {
  cy.intercept('POST', '/api/auth/logout').as('logoutRequest');
  
  // Try UI logout first
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="user-menu"]').length > 0) {
      cy.get('[data-cy="user-menu"]').click();
      cy.get('[data-cy="logout-button"]').click();
      cy.wait('@logoutRequest');
    } else {
      // Fallback to API logout
      cy.request({
        method: 'POST',
        url: '/api/auth/logout',
        failOnStatusCode: false
      });
    }
  });
  
  // Clear client-side auth state
  cy.clearAuth();
});

/**
 * Check if user is authenticated
 */
Cypress.Commands.add('isAuthenticated', () => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('auth_token');
    const hasSessionCookie = document.cookie.includes('__session=');
    return !!(token && hasSessionCookie);
  });
});

/**
 * Get authentication token
 */
Cypress.Commands.add('getAuthToken', () => {
  return cy.window().then((win) => {
    return win.localStorage.getItem('auth_token');
  });
});

/**
 * Set authentication token
 */
Cypress.Commands.add('setAuthToken', (token) => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', token);
  });
});

/**
 * Clear authentication state
 */
Cypress.Commands.add('clearAuth', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearAllSessionStorage();
});

/**
 * Create test user via API
 */
Cypress.Commands.add('createTestUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: userData
  }).then((response) => {
    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('success', true);
    expect(response.body).to.have.property('user');
    return response.body.user;
  });
});

/**
 * Delete test user via API
 */
Cypress.Commands.add('deleteTestUser', (userId) => {
  cy.request({
    method: 'DELETE',
    url: `/api/admin/users/${userId}`,
    failOnStatusCode: false
  });
});

/**
 * Make authenticated API request
 */
Cypress.Commands.add('apiRequest', (options) => {
  return cy.getAuthToken().then((token) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return cy.request({
      method: options.method,
      url: options.url,
      body: options.body,
      headers,
      failOnStatusCode: false
    });
  });
});

/**
 * Wait for authentication state to be ready
 */
Cypress.Commands.add('waitForAuth', () => {
  cy.window().should((win) => {
    // Wait for auth initialization to complete
    expect(win).to.have.property('authInitialized', true);
  });
});

/**
 * Tab to next element (for accessibility testing)
 */
Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { key: 'Tab' });
});

// Additional commands for social login testing
Cypress.Commands.add('loginViaUI', (provider = 'google') => {
  cy.visit('/');
  
  // Find and click a "Rent Now" button to trigger login modal
  cy.get('[data-cy="rent-now-button"]').first().click();
  
  // Wait for login modal to appear
  cy.get('[data-cy="login-modal"]').should('be.visible');
  
  // Click the social login button
  cy.get(`[data-cy="social-login-${provider}"]`).click();
  
  // For testing, we'll mock the social login success
  cy.window().then((win) => {
    // Simulate successful social login
    win.postMessage({
      type: 'SOCIAL_LOGIN_SUCCESS',
      provider,
      user: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      }
    }, '*');
  });
  
  // Verify login success
  cy.get('[data-cy="login-modal"]').should('not.exist');
  cy.get('[data-cy="user-menu"]').should('be.visible');
});

Cypress.Commands.add('checkAuthState', (expectedState) => {
  cy.window().then((win) => {
    if (expectedState === 'authenticated') {
      cy.get('[data-cy="user-menu"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('not.exist');
    } else {
      cy.get('[data-cy="user-menu"]').should('not.exist');
      cy.get('[data-cy="login-button"]').should('be.visible');
    }
  });
});

Cypress.Commands.add('verifyJWTToken', (token) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/verify-token',
    body: { token }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('valid', true);
    expect(response.body).to.have.property('payload');
    expect(response.body.payload).to.have.property('uid');
    expect(response.body.payload).to.have.property('email');
  });
});

Cypress.Commands.add('checkCORSHeaders', (url) => {
  cy.request({
    method: 'OPTIONS',
    url,
    headers: {
      'Origin': 'https://geargrab.co',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  }).then((response) => {
    expect(response.headers).to.have.property('access-control-allow-origin');
    expect(response.headers).to.have.property('access-control-allow-methods');
    expect(response.headers).to.have.property('access-control-allow-headers');
    expect(response.headers).to.have.property('access-control-allow-credentials', 'true');
  });
});

Cypress.Commands.add('verifyCookieFlags', (cookieName, expectedFlags) => {
  cy.getCookie(cookieName).then((cookie) => {
    expect(cookie).to.not.be.null;
    
    if (expectedFlags.includes('httpOnly')) {
      expect(cookie.httpOnly).to.be.true;
    }
    
    if (expectedFlags.includes('secure')) {
      expect(cookie.secure).to.be.true;
    }
    
    if (expectedFlags.includes('sameSite')) {
      expect(cookie.sameSite).to.be.oneOf(['strict', 'lax', 'none']);
    }
  });
});

Cypress.Commands.add('accessProtectedEndpoint', (endpoint) => {
  cy.request({
    method: 'GET',
    url: endpoint,
    failOnStatusCode: false
  }).then((response) => {
    // Should return 401 if not authenticated, 200 if authenticated
    expect(response.status).to.be.oneOf([200, 401]);
    return cy.wrap(response.status);
  });
});

// Authentication test data and utilities
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    username: 'testuser'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'adminpassword123',
    name: 'Admin User',
    username: 'admin'
  },
  inactiveUser: {
    email: 'inactive@example.com',
    password: 'password123',
    name: 'Inactive User',
    username: 'inactive'
  }
};

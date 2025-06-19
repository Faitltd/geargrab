/**
 * Cypress Custom Commands for Authentication Testing
 * 
 * Custom commands to simplify authentication testing workflows
 * including login, logout, session management, and API interactions.
 */

// Extend Cypress namespace with custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with email and password
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Login programmatically via API
       */
      loginApi(email: string, password: string): Chainable<void>;
      
      /**
       * Logout user
       */
      logout(): Chainable<void>;
      
      /**
       * Check if user is authenticated
       */
      isAuthenticated(): Chainable<boolean>;
      
      /**
       * Get authentication token
       */
      getAuthToken(): Chainable<string | null>;
      
      /**
       * Set authentication token
       */
      setAuthToken(token: string): Chainable<void>;
      
      /**
       * Clear authentication state
       */
      clearAuth(): Chainable<void>;
      
      /**
       * Create test user via API
       */
      createTestUser(userData: {
        email: string;
        password: string;
        name: string;
        username?: string;
      }): Chainable<any>;
      
      /**
       * Delete test user via API
       */
      deleteTestUser(userId: string): Chainable<void>;
      
      /**
       * Make authenticated API request
       */
      apiRequest(options: {
        method: string;
        url: string;
        body?: any;
        headers?: Record<string, string>;
      }): Chainable<Cypress.Response<any>>;
      
      /**
       * Wait for authentication state to be ready
       */
      waitForAuth(): Chainable<void>;
      
      /**
       * Tab to next element (for accessibility testing)
       */
      tab(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

/**
 * Login via UI form
 */
Cypress.Commands.add('login', (email: string, password: string) => {
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
Cypress.Commands.add('loginApi', (email: string, password: string) => {
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
      cookies.forEach((cookie: string) => {
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
Cypress.Commands.add('setAuthToken', (token: string) => {
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
Cypress.Commands.add('deleteTestUser', (userId: string) => {
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

export const invalidCredentials = [
  {
    email: 'nonexistent@example.com',
    password: 'wrongpassword',
    expectedError: 'Invalid email or password'
  },
  {
    email: 'test@example.com',
    password: 'wrongpassword',
    expectedError: 'Invalid email or password'
  },
  {
    email: 'invalid-email',
    password: 'password123',
    expectedError: 'Invalid email format'
  },
  {
    email: '',
    password: 'password123',
    expectedError: 'Email is required'
  },
  {
    email: 'test@example.com',
    password: '',
    expectedError: 'Password is required'
  }
];

// Helper functions for test setup
export const authHelpers = {
  /**
   * Setup test environment with clean state
   */
  setupCleanState: () => {
    cy.clearAuth();
    cy.visit('/');
  },

  /**
   * Setup authenticated test environment
   */
  setupAuthenticatedState: (user = testUsers.validUser) => {
    cy.clearAuth();
    cy.loginApi(user.email, user.password);
  },

  /**
   * Verify authentication state
   */
  verifyAuthState: (shouldBeAuthenticated: boolean) => {
    if (shouldBeAuthenticated) {
      cy.getCookie('__session').should('exist');
      cy.getAuthToken().should('exist');
    } else {
      cy.getCookie('__session').should('not.exist');
      cy.getAuthToken().should('not.exist');
    }
  },

  /**
   * Verify API response structure
   */
  verifyApiResponse: (response: Cypress.Response<any>, expectedStatus: number) => {
    expect(response.status).to.equal(expectedStatus);
    expect(response.body).to.have.property('success');
    
    if (expectedStatus >= 200 && expectedStatus < 300) {
      expect(response.body.success).to.be.true;
    } else {
      expect(response.body.success).to.be.false;
      expect(response.body).to.have.property('error');
    }
  },

  /**
   * Wait for network requests to complete
   */
  waitForNetworkIdle: () => {
    cy.intercept('**').as('anyRequest');
    cy.wait(100); // Small delay to catch any pending requests
  }
};

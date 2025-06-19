/**
 * Login Flow End-to-End Tests
 * 
 * Comprehensive Cypress tests for the authentication login flow including:
 * - Valid and invalid credential testing
 * - Redirect behavior verification
 * - Cookie and session management
 * - CORS headers validation
 * - Protected endpoint access verification
 */

describe('Authentication Login Flow', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:5173';
  
  // Test user credentials
  const validUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  const invalidCredentials = [
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

  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
    
    // Set up network interception for API calls
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    cy.intercept('GET', '/api/auth/session').as('sessionRequest');
    cy.intercept('GET', '/api/user/profile').as('profileRequest');
    cy.intercept('POST', '/api/auth/logout').as('logoutRequest');
  });

  describe('Login Page Access', () => {
    it('should load the login page successfully', () => {
      cy.visit('/auth/login');
      
      // Verify page elements
      cy.get('[data-cy="login-form"]').should('be.visible');
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="password-input"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
      cy.get('[data-cy="signup-link"]').should('be.visible');
      
      // Verify page title and meta
      cy.title().should('contain', 'Login');
      cy.get('meta[name="description"]').should('have.attr', 'content');
    });

    it('should have proper CORS headers', () => {
      cy.request({
        method: 'OPTIONS',
        url: '/auth/login',
        headers: {
          'Origin': baseUrl,
          'Access-Control-Request-Method': 'GET'
        }
      }).then((response) => {
        expect(response.headers).to.have.property('access-control-allow-origin');
        expect(response.headers).to.have.property('access-control-allow-methods');
        expect(response.headers).to.have.property('access-control-allow-headers');
      });
    });

    it('should redirect unauthenticated users to login from protected pages', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
      cy.get('[data-cy="redirect-message"]').should('contain', 'Please log in to continue');
    });
  });

  describe('Valid Credentials Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.visit('/auth/login');
      
      // Fill in the login form
      cy.get('[data-cy="email-input"]').type(validUser.email);
      cy.get('[data-cy="password-input"]').type(validUser.password);
      
      // Submit the form
      cy.get('[data-cy="login-button"]').click();
      
      // Wait for login request to complete
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body).to.have.property('success', true);
        expect(interception.response?.body).to.have.property('token');
        expect(interception.response?.body).to.have.property('user');
        
        // Verify user data structure
        const user = interception.response?.body.user;
        expect(user).to.have.property('id');
        expect(user).to.have.property('email', validUser.email);
        expect(user).to.have.property('name');
        expect(user).to.have.property('role');
      });
      
      // Verify redirect to dashboard or intended page
      cy.url().should('not.include', '/auth/login');
      cy.url().should('include', '/dashboard');
      
      // Verify success notification
      cy.get('[data-cy="notification"]').should('contain', 'Login successful');
      cy.get('[data-cy="notification"]').should('have.class', 'success');
    });

    it('should set proper authentication cookies', () => {
      cy.visit('/auth/login');
      
      cy.get('[data-cy="email-input"]').type(validUser.email);
      cy.get('[data-cy="password-input"]').type(validUser.password);
      cy.get('[data-cy="login-button"]').click();
      
      cy.wait('@loginRequest');
      
      // Verify authentication cookies are set
      cy.getCookie('__session').should('exist');
      cy.getCookie('__session_id').should('exist');
      
      // Verify cookie properties
      cy.getCookie('__session').then((cookie) => {
        expect(cookie).to.have.property('httpOnly', true);
        expect(cookie).to.have.property('secure', true);
        expect(cookie).to.have.property('sameSite', 'strict');
        expect(cookie?.expiry).to.be.greaterThan(Date.now());
      });
    });

    it('should maintain session across page refreshes', () => {
      // Login first
      cy.visit('/auth/login');
      cy.get('[data-cy="email-input"]').type(validUser.email);
      cy.get('[data-cy="password-input"]').type(validUser.password);
      cy.get('[data-cy="login-button"]').click();
      cy.wait('@loginRequest');
      
      // Navigate to dashboard
      cy.url().should('include', '/dashboard');
      
      // Refresh the page
      cy.reload();
      
      // Should still be authenticated
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="user-menu"]').should('be.visible');
      cy.get('[data-cy="logout-button"]').should('be.visible');
    });

    it('should redirect to intended page after login', () => {
      // Try to access protected page while unauthenticated
      cy.visit('/gear/list');
      cy.url().should('include', '/auth/login');
      cy.url().should('include', 'redirect=/gear/list');
      
      // Login
      cy.get('[data-cy="email-input"]').type(validUser.email);
      cy.get('[data-cy="password-input"]').type(validUser.password);
      cy.get('[data-cy="login-button"]').click();
      cy.wait('@loginRequest');
      
      // Should redirect to originally intended page
      cy.url().should('include', '/gear/list');
      cy.url().should('not.include', '/auth/login');
    });
  });

  describe('Invalid Credentials Login', () => {
    invalidCredentials.forEach((credentials, index) => {
      it(`should handle invalid credentials case ${index + 1}: ${credentials.expectedError}`, () => {
        cy.visit('/auth/login');
        
        // Fill in invalid credentials
        if (credentials.email) {
          cy.get('[data-cy="email-input"]').type(credentials.email);
        }
        if (credentials.password) {
          cy.get('[data-cy="password-input"]').type(credentials.password);
        }
        
        // Submit the form
        cy.get('[data-cy="login-button"]').click();
        
        // Verify error handling
        if (credentials.email && credentials.password) {
          // Wait for API call for complete credentials
          cy.wait('@loginRequest').then((interception) => {
            expect(interception.response?.statusCode).to.be.oneOf([400, 401]);
            expect(interception.response?.body).to.have.property('success', false);
            expect(interception.response?.body).to.have.property('error');
          });
        }
        
        // Verify error message display
        cy.get('[data-cy="error-message"]').should('be.visible');
        cy.get('[data-cy="error-message"]').should('contain', credentials.expectedError);
        
        // Verify user stays on login page
        cy.url().should('include', '/auth/login');
        
        // Verify no authentication cookies are set
        cy.getCookie('__session').should('not.exist');
        cy.getCookie('__session_id').should('not.exist');
      });
    });

    it('should handle rate limiting for multiple failed attempts', () => {
      cy.visit('/auth/login');
      
      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        cy.get('[data-cy="email-input"]').clear().type(validUser.email);
        cy.get('[data-cy="password-input"]').clear().type('wrongpassword');
        cy.get('[data-cy="login-button"]').click();
        
        if (i < 5) {
          cy.wait('@loginRequest');
          cy.get('[data-cy="error-message"]').should('contain', 'Invalid email or password');
        }
      }
      
      // After 5 failed attempts, should show rate limiting
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(429);
        expect(interception.response?.body).to.have.property('error');
      });
      
      cy.get('[data-cy="error-message"]').should('contain', 'Too many login attempts');
      cy.get('[data-cy="login-button"]').should('be.disabled');
    });

    it('should clear error messages when user starts typing', () => {
      cy.visit('/auth/login');
      
      // Trigger an error
      cy.get('[data-cy="login-button"]').click();
      cy.get('[data-cy="error-message"]').should('be.visible');
      
      // Start typing in email field
      cy.get('[data-cy="email-input"]').type('t');
      cy.get('[data-cy="error-message"]').should('not.exist');
    });
  });

  describe('Protected Endpoint Access', () => {
    beforeEach(() => {
      // Login before each test in this group
      cy.visit('/auth/login');
      cy.get('[data-cy="email-input"]').type(validUser.email);
      cy.get('[data-cy="password-input"]').type(validUser.password);
      cy.get('[data-cy="login-button"]').click();
      cy.wait('@loginRequest');
    });

    it('should successfully access protected endpoints after login', () => {
      // Test accessing user profile endpoint
      cy.request({
        method: 'GET',
        url: '/api/user/profile',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body).to.have.property('user');
        
        // Verify user data
        const user = response.body.user;
        expect(user).to.have.property('id');
        expect(user).to.have.property('email', validUser.email);
        expect(user).to.have.property('role');
      });
      
      // Test accessing protected dashboard data
      cy.request({
        method: 'GET',
        url: '/api/dashboard/stats',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
      });
    });

    it('should include proper authorization headers in requests', () => {
      cy.window().then((win) => {
        // Get the stored token
        const token = win.localStorage.getItem('auth_token');
        expect(token).to.exist;
        
        // Make authenticated request
        cy.request({
          method: 'GET',
          url: '/api/user/profile',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.headers).to.have.property('content-type');
          expect(response.headers['content-type']).to.include('application/json');
        });
      });
    });

    it('should handle token expiration gracefully', () => {
      // Simulate expired token by manipulating localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'expired.jwt.token');
      });
      
      // Try to access protected endpoint
      cy.request({
        method: 'GET',
        url: '/api/user/profile',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(401);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('expired');
      });
      
      // Should redirect to login page
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Login before each test
      cy.visit('/auth/login');
      cy.get('[data-cy="email-input"]').type(validUser.email);
      cy.get('[data-cy="password-input"]').type(validUser.password);
      cy.get('[data-cy="login-button"]').click();
      cy.wait('@loginRequest');
    });

    it('should logout successfully and clear session', () => {
      // Navigate to dashboard
      cy.url().should('include', '/dashboard');
      
      // Click logout button
      cy.get('[data-cy="user-menu"]').click();
      cy.get('[data-cy="logout-button"]').click();
      
      // Wait for logout request
      cy.wait('@logoutRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body).to.have.property('success', true);
      });
      
      // Verify redirect to login page
      cy.url().should('include', '/auth/login');
      
      // Verify cookies are cleared
      cy.getCookie('__session').should('not.exist');
      cy.getCookie('__session_id').should('not.exist');
      
      // Verify localStorage is cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth_token')).to.be.null;
        expect(win.localStorage.getItem('user_data')).to.be.null;
      });
      
      // Verify logout notification
      cy.get('[data-cy="notification"]').should('contain', 'Logged out successfully');
    });

    it('should prevent access to protected pages after logout', () => {
      // Logout
      cy.get('[data-cy="user-menu"]').click();
      cy.get('[data-cy="logout-button"]').click();
      cy.wait('@logoutRequest');
      
      // Try to access protected page
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
      
      // Try to access API endpoint
      cy.request({
        method: 'GET',
        url: '/api/user/profile',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(401);
      });
    });
  });

  describe('Security Headers and CORS', () => {
    it('should have proper security headers on login page', () => {
      cy.request('/auth/login').then((response) => {
        // Verify security headers
        expect(response.headers).to.have.property('x-frame-options');
        expect(response.headers).to.have.property('x-content-type-options');
        expect(response.headers).to.have.property('x-xss-protection');
        expect(response.headers).to.have.property('strict-transport-security');
        expect(response.headers).to.have.property('content-security-policy');
      });
    });

    it('should handle CORS properly for API endpoints', () => {
      const corsHeaders = {
        'Origin': baseUrl,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      };

      cy.request({
        method: 'OPTIONS',
        url: '/api/auth/login',
        headers: corsHeaders
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.headers).to.have.property('access-control-allow-origin');
        expect(response.headers).to.have.property('access-control-allow-methods');
        expect(response.headers).to.have.property('access-control-allow-headers');
        expect(response.headers).to.have.property('access-control-max-age');
      });
    });

    it('should reject requests from unauthorized origins', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Content-Type': 'application/json'
        },
        body: {
          email: validUser.email,
          password: validUser.password
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should either reject the request or not include CORS headers
        if (response.status === 200) {
          expect(response.headers).to.not.have.property('access-control-allow-origin', 'https://malicious-site.com');
        } else {
          expect(response.status).to.be.oneOf([403, 404]);
        }
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.visit('/auth/login');
      
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'email-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'password-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'login-button');
      
      // Submit form with Enter key
      cy.get('[data-cy="email-input"]').type(validUser.email);
      cy.get('[data-cy="password-input"]').type(validUser.password);
      cy.get('[data-cy="password-input"]').type('{enter}');
      
      cy.wait('@loginRequest');
    });

    it('should show loading state during login', () => {
      cy.visit('/auth/login');
      
      cy.get('[data-cy="email-input"]').type(validUser.email);
      cy.get('[data-cy="password-input"]').type(validUser.password);
      cy.get('[data-cy="login-button"]').click();
      
      // Verify loading state
      cy.get('[data-cy="login-button"]').should('be.disabled');
      cy.get('[data-cy="login-button"]').should('contain', 'Signing in...');
      cy.get('[data-cy="loading-spinner"]').should('be.visible');
      
      cy.wait('@loginRequest');
      
      // Loading state should be cleared after response
      cy.get('[data-cy="login-button"]').should('not.be.disabled');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.visit('/auth/login');
      
      // Check form accessibility
      cy.get('[data-cy="login-form"]').should('have.attr', 'role', 'form');
      cy.get('[data-cy="email-input"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="password-input"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="login-button"]').should('have.attr', 'aria-describedby');
      
      // Check error message accessibility
      cy.get('[data-cy="login-button"]').click();
      cy.get('[data-cy="error-message"]').should('have.attr', 'role', 'alert');
      cy.get('[data-cy="error-message"]').should('have.attr', 'aria-live', 'polite');
    });
  });
});

/**
 * Social Login Flow E2E Tests
 * 
 * Comprehensive end-to-end tests for the social authentication system:
 * - Social login button interactions
 * - Authentication state management
 * - Protected endpoint access
 * - Cookie and CORS verification
 * - Error handling scenarios
 */

describe('Social Login Authentication Flow', () => {
  beforeEach(() => {
    // Clear authentication state
    cy.clearAuth();
    
    // Set up API interceptors
    cy.intercept('POST', '/api/auth/social-login', { fixture: 'auth/social-login-success.json' }).as('socialLoginAPI');
    cy.intercept('GET', '/api/auth/me', { fixture: 'auth/user-profile.json' }).as('userProfileAPI');
    cy.intercept('POST', '/api/auth/logout', { statusCode: 200 }).as('logoutAPI');
    
    // Visit homepage
    cy.visit('/');
  });

  describe('Social Login Modal Display', () => {
    it('should show social login modal when accessing protected content', () => {
      // Try to rent an item (requires authentication)
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });

      // Verify login modal appears
      cy.get('[data-cy="login-modal"]').should('be.visible');
      cy.get('[data-cy="modal-title"]').should('contain.text', 'Sign In to Continue');
      
      // Verify social login buttons are present
      cy.get('[data-cy="social-login-google"]').should('be.visible');
      cy.get('[data-cy="social-login-apple"]').should('be.visible');
      cy.get('[data-cy="social-login-facebook"]').should('be.visible');
      cy.get('[data-cy="social-login-github"]').should('be.visible');
      
      // Verify no email/password fields
      cy.get('[data-cy="email-input"]').should('not.exist');
      cy.get('[data-cy="password-input"]').should('not.exist');
    });

    it('should display correct social login button styling', () => {
      // Trigger login modal
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });

      // Check Google button styling
      cy.get('[data-cy="social-login-google"]')
        .should('have.class', 'bg-white')
        .should('contain.text', 'Continue with Google')
        .find('svg')
        .should('be.visible');

      // Check Apple button styling
      cy.get('[data-cy="social-login-apple"]')
        .should('have.class', 'bg-black')
        .should('contain.text', 'Continue with Apple')
        .find('svg')
        .should('be.visible');

      // Check Facebook button styling
      cy.get('[data-cy="social-login-facebook"]')
        .should('have.css', 'background-color', 'rgb(24, 119, 242)')
        .should('contain.text', 'Continue with Facebook');

      // Check GitHub button styling
      cy.get('[data-cy="social-login-github"]')
        .should('have.class', 'bg-gray-800')
        .should('contain.text', 'Continue with GitHub');
    });
  });

  describe('Google Social Login', () => {
    it('should successfully authenticate with Google', () => {
      // Trigger login modal
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });

      // Click Google login
      cy.get('[data-cy="social-login-google"]').click();

      // Wait for authentication
      cy.wait('@socialLoginAPI');

      // Verify modal closes
      cy.get('[data-cy="login-modal"]').should('not.exist');

      // Verify user is authenticated
      cy.get('[data-cy="user-menu"]').should('be.visible');
      cy.get('[data-cy="user-avatar"]').should('be.visible');
    });

    it('should handle Google login popup blocked error', () => {
      // Mock popup blocked error
      cy.window().then((win) => {
        cy.stub(win, 'open').returns(null);
      });

      // Trigger login modal
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });

      // Click Google login
      cy.get('[data-cy="social-login-google"]').click();

      // Verify error message
      cy.get('[data-cy="auth-error"]')
        .should('be.visible')
        .should('contain.text', 'popup');
    });

    it('should handle Google login cancellation', () => {
      // Mock user cancellation
      cy.intercept('POST', '/api/auth/social-login', {
        statusCode: 400,
        body: { success: false, error: 'User cancelled authentication' }
      }).as('cancelledLogin');

      // Trigger login modal
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });

      // Click Google login
      cy.get('[data-cy="social-login-google"]').click();

      // Wait for cancellation response
      cy.wait('@cancelledLogin');

      // Verify error handling
      cy.get('[data-cy="auth-error"]')
        .should('be.visible')
        .should('contain.text', 'cancelled');

      // Verify modal remains open
      cy.get('[data-cy="login-modal"]').should('be.visible');
    });
  });

  describe('Multiple Social Providers', () => {
    const providers = [
      { name: 'google', displayName: 'Google' },
      { name: 'apple', displayName: 'Apple' },
      { name: 'facebook', displayName: 'Facebook' },
      { name: 'github', displayName: 'GitHub' }
    ];

    providers.forEach(provider => {
      it(`should successfully authenticate with ${provider.displayName}`, () => {
        // Mock successful authentication for this provider
        cy.intercept('POST', '/api/auth/social-login', {
          statusCode: 200,
          body: {
            success: true,
            user: {
              uid: `${provider.name}-user-123`,
              email: `test@${provider.name}.com`,
              displayName: `${provider.displayName} User`,
              photoURL: `https://${provider.name}.com/photo.jpg`,
              provider: provider.name
            },
            token: `${provider.name}-jwt-token`
          }
        }).as(`${provider.name}LoginAPI`);

        // Trigger login modal
        cy.get('[data-cy="gear-card"]').first().within(() => {
          cy.get('[data-cy="rent-now-button"]').click();
        });

        // Click provider login button
        cy.get(`[data-cy="social-login-${provider.name}"]`).click();

        // Wait for authentication
        cy.wait(`@${provider.name}LoginAPI`);

        // Verify successful authentication
        cy.get('[data-cy="login-modal"]').should('not.exist');
        cy.get('[data-cy="user-menu"]').should('be.visible');
      });
    });
  });

  describe('Authentication State Management', () => {
    it('should persist authentication across page reloads', () => {
      // Login first
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();
      cy.wait('@socialLoginAPI');

      // Verify authenticated state
      cy.get('[data-cy="user-menu"]').should('be.visible');

      // Reload page
      cy.reload();

      // Verify authentication persists
      cy.get('[data-cy="user-menu"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('not.exist');
    });

    it('should handle authentication token expiration', () => {
      // Login first
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();
      cy.wait('@socialLoginAPI');

      // Mock token expiration
      cy.intercept('GET', '/api/auth/me', {
        statusCode: 401,
        body: { success: false, error: 'Token expired' }
      }).as('expiredTokenAPI');

      // Try to access protected content
      cy.visit('/admin');

      // Should redirect to login
      cy.wait('@expiredTokenAPI');
      cy.get('[data-cy="login-modal"]').should('be.visible');
    });
  });

  describe('Protected Endpoint Access', () => {
    it('should allow access to protected endpoints when authenticated', () => {
      // Login first
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();
      cy.wait('@socialLoginAPI');

      // Access protected endpoint
      cy.accessProtectedEndpoint('/api/user/profile').then((status) => {
        expect(status).to.equal(200);
      });

      // Access admin endpoint (should work if user has admin role)
      cy.accessProtectedEndpoint('/api/admin/users').then((status) => {
        expect(status).to.be.oneOf([200, 403]); // 200 if admin, 403 if not
      });
    });

    it('should deny access to protected endpoints when not authenticated', () => {
      // Try to access protected endpoints without authentication
      cy.accessProtectedEndpoint('/api/user/profile').then((status) => {
        expect(status).to.equal(401);
      });

      cy.accessProtectedEndpoint('/api/admin/users').then((status) => {
        expect(status).to.equal(401);
      });
    });
  });

  describe('Cookie and Security Verification', () => {
    it('should set secure authentication cookies', () => {
      // Login
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();
      cy.wait('@socialLoginAPI');

      // Verify secure cookie flags
      cy.verifyCookieFlags('auth-token', ['httpOnly', 'secure', 'sameSite']);
      cy.verifyCookieFlags('session-id', ['httpOnly', 'secure', 'sameSite']);
    });

    it('should verify CORS headers on authentication endpoints', () => {
      // Check CORS headers for auth endpoints
      cy.checkCORSHeaders('/api/auth/social-login');
      cy.checkCORSHeaders('/api/auth/logout');
      cy.checkCORSHeaders('/api/auth/me');
    });

    it('should validate JWT token structure', () => {
      // Login and get token
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();
      cy.wait('@socialLoginAPI');

      // Get and verify JWT token
      cy.getAuthToken().then((token) => {
        if (token) {
          cy.verifyJWTToken(token);
        }
      });
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout user', () => {
      // Login first
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();
      cy.wait('@socialLoginAPI');

      // Logout
      cy.logout();

      // Verify logout
      cy.wait('@logoutAPI');
      cy.get('[data-cy="user-menu"]').should('not.exist');
      cy.get('[data-cy="login-button"]').should('be.visible');

      // Verify cookies are cleared
      cy.getCookie('auth-token').should('not.exist');
      cy.getCookie('session-id').should('not.exist');
    });

    it('should redirect to login when accessing protected content after logout', () => {
      // Login, then logout
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();
      cy.wait('@socialLoginAPI');
      cy.logout();

      // Try to access protected content
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });

      // Should show login modal again
      cy.get('[data-cy="login-modal"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '/api/auth/social-login', {
        forceNetworkError: true
      }).as('networkError');

      // Trigger login
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();

      // Verify error handling
      cy.get('[data-cy="auth-error"]')
        .should('be.visible')
        .should('contain.text', 'network');
    });

    it('should handle server errors gracefully', () => {
      // Mock server error
      cy.intercept('POST', '/api/auth/social-login', {
        statusCode: 500,
        body: { success: false, error: 'Internal server error' }
      }).as('serverError');

      // Trigger login
      cy.get('[data-cy="gear-card"]').first().within(() => {
        cy.get('[data-cy="rent-now-button"]').click();
      });
      cy.get('[data-cy="social-login-google"]').click();

      // Wait for error response
      cy.wait('@serverError');

      // Verify error handling
      cy.get('[data-cy="auth-error"]')
        .should('be.visible')
        .should('contain.text', 'server error');
    });
  });
});

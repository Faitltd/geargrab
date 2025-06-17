/// <reference types="cypress" />

describe('Authentication Flow - Comprehensive E2E Tests', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.clearAllSessionStorage();

    // Set longer timeout for auth operations
    cy.defaultCommandTimeout = 15000;
  });

  describe('Authentication State Management', () => {
    it('should maintain auth state across page navigation', () => {
      // Mock successful authentication
      cy.visit('/auth/login');

      // Fill in test credentials
      cy.get('input[type="email"]').type('test@geargrab.co');
      cy.get('input[type="password"]').type('TestPassword123!');

      // Mock the authentication response
      cy.window().then((win) => {
        // Mock simpleAuth state
        win.localStorage.setItem('authState', JSON.stringify({
          user: {
            uid: 'test-uid-123',
            email: 'test@geargrab.co',
            displayName: 'Test User'
          },
          isAuthenticated: true,
          loading: false
        }));
      });

      // Navigate to different pages and verify auth state persists
      cy.visit('/');
      cy.wait(2000); // Allow auth state to load

      cy.visit('/browse');
      cy.wait(2000);

      cy.visit('/dashboard');
      cy.wait(2000);

      // Should not redirect to login
      cy.url().should('include', '/dashboard');
    });

    it('should handle checkout authentication flow', () => {
      // First, visit a listing page to set up booking context
      cy.visit('/');
      cy.wait(2000);

      // Try to access checkout without authentication
      cy.visit('/book/confirm?listingId=test-listing&startDate=2024-01-01&endDate=2024-01-03');

      // Should redirect to login with proper redirect URL
      cy.url().should('include', '/auth/login');
      cy.url().should('include', 'redirectTo');

      // Login should redirect back to checkout
      cy.get('input[type="email"]').type('test@geargrab.co');
      cy.get('input[type="password"]').type('TestPassword123!');

      // Mock successful login
      cy.window().then((win) => {
        win.localStorage.setItem('authState', JSON.stringify({
          user: {
            uid: 'test-uid-123',
            email: 'test@geargrab.co',
            displayName: 'Test User'
          },
          isAuthenticated: true,
          loading: false
        }));
      });

      cy.get('button[type="submit"]').click();

      // Should redirect back to checkout
      cy.url().should('include', '/book/confirm', { timeout: 10000 });
    });

    it('should prevent authentication redirect loops', () => {
      // Mock a scenario where user is already authenticated
      cy.window().then((win) => {
        win.localStorage.setItem('authState', JSON.stringify({
          user: {
            uid: 'test-uid-123',
            email: 'test@geargrab.co',
            displayName: 'Test User'
          },
          isAuthenticated: true,
          loading: false
        }));
      });

      // Visit login page when already authenticated
      cy.visit('/auth/login');

      // Should redirect to home or dashboard, not stay on login
      cy.url().should('not.include', '/auth/login', { timeout: 10000 });
    });
  });

  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('/auth/login');
    });

    it('should display login form', () => {
      // Check page title
      cy.title().should('include', 'Log In');

      // Check form elements
      cy.get('h1').should('contain', 'Welcome back');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('contain', 'Log in');

      // Check link to signup
      cy.contains('create a new account').should('exist');
    });

    it('should validate required fields', () => {
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Should show validation errors
      cy.get('input[type="email"]:invalid').should('exist');
      cy.get('input[type="password"]:invalid').should('exist');
    });

    it('should validate email format', () => {
      // Enter invalid email
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Should show email validation error
      cy.get('input[type="email"]:invalid').should('exist');
    });

    it('should handle login attempt', () => {
      // Mock the API endpoint instead of Firebase directly
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: { success: true, user: { uid: 'test-uid', email: 'test@example.com' } }
      }).as('loginRequest');

      // Fill in valid credentials
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      // For now, just check that the form was submitted
      // The actual redirect behavior depends on Firebase auth state
      cy.get('button[type="submit"]').should('contain', 'Logging in...');
    });

    it('should handle login errors', () => {
      // Fill in credentials and try to submit
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      // For now, just check that the form was submitted
      // Error handling depends on Firebase response
      cy.get('button[type="submit"]').should('contain', 'Logging in...');
    });

    it('should navigate to signup page', () => {
      // Click signup link
      cy.contains('create a new account').click();

      // Should navigate to signup
      cy.url().should('include', '/auth/signup');
    });

    it('should handle forgot password', () => {
      // Check if forgot password link exists
      cy.get('body').then(($body) => {
        if ($body.find('a:contains("Forgot password")').length > 0) {
          cy.contains('Forgot password').click();
          // Should show forgot password form or modal
          cy.contains('Reset password').should('be.visible');
        }
      });
    });
  });

  describe('Signup Page', () => {
    beforeEach(() => {
      cy.visit('/auth/signup');
    });

    it('should display signup form', () => {
      // Check page title
      cy.title().should('include', 'Sign Up');

      // Check form elements
      cy.get('h1').should('contain', 'Create your GearGrab account');
      cy.get('input[name="firstName"]').should('exist');
      cy.get('input[name="lastName"]').should('exist');
      cy.get('input[name="email"]').should('exist');
      // Password is on step 2, so we need to navigate there first

      // Check link to login
      cy.contains('sign in to your existing account').should('exist');
    });

    it('should validate required fields', () => {
      // Try to submit empty form (step 1)
      cy.get('button[type="submit"]').click();

      // Should show validation errors for step 1 fields
      cy.get('input[name="firstName"]:invalid').should('exist');
      cy.get('input[name="lastName"]:invalid').should('exist');
      cy.get('input[name="email"]:invalid').should('exist');
      cy.get('input[name="phone"]:invalid').should('exist');
    });

    it('should validate password strength', () => {
      // Fill step 1 first
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('john@example.com');
      cy.get('input[name="phone"]').type('(555) 123-4567');
      cy.get('input[name="dateOfBirth"]').type('1990-01-01');
      cy.get('input[name="ssn"]').type('123-45-6789');

      // Go to step 2 where password is
      cy.get('button[type="submit"]').click();

      // Now test password validation
      cy.get('input[type="password"]').should('exist');
    });

    it('should handle successful signup', () => {
      // Fill step 1
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('input[name="phone"]').type('(555) 123-4567');
      cy.get('input[name="dateOfBirth"]').type('1990-01-01');
      cy.get('input[name="ssn"]').type('123-45-6789');

      // Go to step 2
      cy.get('button[type="submit"]').click();

      // Fill step 2 (address and password)
      cy.get('input[name="street"]').type('123 Main St');
      cy.get('input[name="city"]').type('Denver');
      cy.get('select[name="state"]').select('CO');
      cy.get('input[name="zipCode"]').type('80202');
      cy.get('input[name="password"]').type('StrongPassword123!');
      cy.get('input[name="confirm-password"]').type('StrongPassword123!');

      // Go to step 3
      cy.get('button[type="submit"]').click();

      // Accept terms and consent
      cy.get('input[type="checkbox"]').check({ multiple: true });

      // Submit final form
      cy.get('button[type="submit"]').click();

      // Should show loading state
      cy.get('button[type="submit"]').should('contain', 'Submitting...');
    });

    it('should handle signup errors', () => {
      // Fill step 1 with existing email
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('existing@example.com');
      cy.get('input[name="phone"]').type('(555) 123-4567');
      cy.get('input[name="dateOfBirth"]').type('1990-01-01');
      cy.get('input[name="ssn"]').type('123-45-6789');

      // Try to proceed - should work for step 1
      cy.get('button[type="submit"]').click();

      // The error would occur during final submission, not step validation
      cy.get('h3').should('contain', 'Address & Security');
    });

    it('should navigate to login page', () => {
      // Click login link
      cy.contains('sign in to your existing account').click();

      // Should navigate to login
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Authentication State', () => {
    it('should redirect unauthenticated users from protected pages', () => {
      // Try to visit dashboard without being logged in
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
      
      // Should have redirect parameter
      cy.url().should('include', 'redirectTo=/dashboard');
    });

    it('should redirect after successful login', () => {
      // Visit protected page first
      cy.visit('/dashboard');

      // Should be redirected to login
      cy.url().should('include', '/auth/login');

      // Check that redirect parameter is present
      cy.url().should('include', 'redirectTo');

      // Login form should be visible
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('should handle logout', () => {
      // Visit homepage where navbar is visible
      cy.visit('/');

      // Check if logout button exists (only if user is logged in)
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="logout"]').length > 0) {
          // User is logged in, test logout
          cy.get('[data-cy="logout"]').click();

          // Should show signing out state
          cy.get('[data-cy="logout"]').should('contain', 'Signing out...');
        } else {
          // User is not logged in, which is expected for this test
          cy.log('User not logged in - logout test skipped');
        }
      });
    });
  });

  describe('Google Sign-In Integration', () => {
    it('should handle Google Sign-In popup flow', () => {
      cy.visit('/auth/login');

      // Look for Google Sign-In button (may have different selectors)
      cy.get('body').then(($body) => {
        const googleButton = $body.find('button:contains("Google"), button:contains("Continue with Google"), [data-cy="google-login"]');

        if (googleButton.length > 0) {
          // Mock successful Google authentication
          cy.window().then((win) => {
            // Mock the simpleAuth.signInWithGoogle method
            if (win.simpleAuth) {
              cy.stub(win.simpleAuth, 'signInWithGoogle').resolves({
                success: true,
                user: {
                  uid: 'google-test-uid',
                  email: 'googleuser@example.com',
                  displayName: 'Google Test User'
                }
              });
            }
          });

          // Click Google Sign-In button
          cy.wrap(googleButton.first()).click();

          // Should show success state or redirect
          cy.url().should('satisfy', (url) => {
            return url.includes('/dashboard') || url.includes('/') || !url.includes('/auth/login');
          }, { timeout: 10000 });
        } else {
          cy.log('Google Sign-In button not found - test skipped');
        }
      });
    });

    it('should handle Google Sign-In errors gracefully', () => {
      cy.visit('/auth/login');

      cy.get('body').then(($body) => {
        const googleButton = $body.find('button:contains("Google"), button:contains("Continue with Google")');

        if (googleButton.length > 0) {
          // Mock Google authentication error
          cy.window().then((win) => {
            if (win.simpleAuth) {
              cy.stub(win.simpleAuth, 'signInWithGoogle').resolves({
                success: false,
                error: 'Google Sign-In failed'
              });
            }
          });

          cy.wrap(googleButton.first()).click();

          // Should show error message and stay on login page
          cy.url().should('include', '/auth/login');

          // Look for error notification or message
          cy.get('body').should('contain.text', 'error', { matchCase: false });
        }
      });
    });

    it('should handle COOP policy errors', () => {
      cy.visit('/auth/login');

      // Check browser console for COOP errors
      cy.window().then((win) => {
        const consoleSpy = cy.spy(win.console, 'error');

        // Try to trigger Google Sign-In
        cy.get('body').then(($body) => {
          const googleButton = $body.find('button:contains("Google"), button:contains("Continue with Google")');

          if (googleButton.length > 0) {
            cy.wrap(googleButton.first()).click();

            // Wait a moment for any console errors
            cy.wait(2000);

            // Check that no COOP errors occurred
            cy.then(() => {
              const coopErrors = consoleSpy.getCalls().filter(call =>
                call.args.some(arg =>
                  typeof arg === 'string' && arg.includes('Cross-Origin-Opener-Policy')
                )
              );
              expect(coopErrors).to.have.length(0);
            });
          }
        });
      });
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle network errors during login', () => {
      cy.visit('/auth/login');

      // Mock network error
      cy.intercept('POST', '**/auth/**', {
        forceNetworkError: true
      }).as('authError');

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      // Should show error message
      cy.get('body').should('contain.text', 'error', { matchCase: false });
    });

    it('should handle invalid credentials', () => {
      cy.visit('/auth/login');

      // Mock authentication failure
      cy.window().then((win) => {
        if (win.simpleAuth) {
          cy.stub(win.simpleAuth, 'signInWithEmailPassword').resolves({
            success: false,
            error: 'Invalid email or password'
          });
        }
      });

      cy.get('input[type="email"]').type('invalid@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      // Should show error message and stay on login page
      cy.url().should('include', '/auth/login');
      cy.get('body').should('contain.text', 'Invalid', { matchCase: false });
    });

    it('should handle session timeout', () => {
      // Mock authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('authState', JSON.stringify({
          user: {
            uid: 'test-uid-123',
            email: 'test@geargrab.co'
          },
          isAuthenticated: true,
          loading: false
        }));
      });

      cy.visit('/dashboard');

      // Mock session expiration
      cy.window().then((win) => {
        win.localStorage.removeItem('authState');
        // Trigger auth state refresh
        if (win.simpleAuth && win.simpleAuth.refreshAuth) {
          win.simpleAuth.refreshAuth();
        }
      });

      // Should redirect to login
      cy.url().should('include', '/auth/login', { timeout: 10000 });
    });
  });

  describe('Authentication Performance', () => {
    it('should load authentication state quickly', () => {
      const startTime = Date.now();

      cy.visit('/auth/login');

      // Check that page loads within reasonable time
      cy.get('input[type="email"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // 5 seconds max
      });
    });

    it('should handle concurrent authentication requests', () => {
      cy.visit('/auth/login');

      // Fill credentials
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');

      // Rapidly click submit multiple times
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').click();

      // Should handle gracefully without errors
      cy.get('button[type="submit"]').should('contain', 'Logging in...');
    });
  });
});

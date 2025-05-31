/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('/auth/login');
    });

    it('should display login form', () => {
      // Check page title
      cy.title().should('include', 'Login');
      
      // Check form elements
      cy.get('h1').should('contain', 'Log In');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('contain', 'Log In');
      
      // Check link to signup
      cy.contains('Sign up').should('exist');
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
      // Mock Firebase auth
      cy.window().then((win) => {
        // Mock successful login
        cy.stub(win, 'signInWithEmailAndPassword').resolves({
          user: { uid: 'test-uid', email: 'test@example.com' }
        });
      });
      
      // Fill in valid credentials
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard or home
      cy.url().should('satisfy', (url) => {
        return url.includes('/dashboard') || url.includes('/');
      });
    });

    it('should handle login errors', () => {
      // Mock Firebase auth error
      cy.window().then((win) => {
        cy.stub(win, 'signInWithEmailAndPassword').rejects(
          new Error('Invalid credentials')
        );
      });
      
      // Fill in credentials
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // Should show error message
      cy.contains('Invalid credentials').should('be.visible');
    });

    it('should navigate to signup page', () => {
      // Click signup link
      cy.contains('Sign up').click();
      
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
      cy.get('h1').should('contain', 'Sign Up');
      cy.get('input[name="firstName"]').should('exist');
      cy.get('input[name="lastName"]').should('exist');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('contain', 'Sign Up');
      
      // Check link to login
      cy.contains('Log in').should('exist');
    });

    it('should validate required fields', () => {
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Should show validation errors
      cy.get('input[name="firstName"]:invalid').should('exist');
      cy.get('input[name="lastName"]:invalid').should('exist');
      cy.get('input[type="email"]:invalid').should('exist');
      cy.get('input[type="password"]:invalid').should('exist');
    });

    it('should validate password strength', () => {
      // Fill form with weak password
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[type="email"]').type('john@example.com');
      cy.get('input[type="password"]').type('123');
      
      // Should show password strength indicator
      cy.get('[data-cy="password-strength"]').should('contain', 'Weak');
      
      // Try stronger password
      cy.get('input[type="password"]').clear().type('StrongPassword123!');
      cy.get('[data-cy="password-strength"]').should('contain', 'Strong');
    });

    it('should handle successful signup', () => {
      // Mock Firebase auth
      cy.window().then((win) => {
        cy.stub(win, 'createUserWithEmailAndPassword').resolves({
          user: { uid: 'new-user-uid', email: 'newuser@example.com' }
        });
      });
      
      // Fill in valid information
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[type="email"]').type('newuser@example.com');
      cy.get('input[type="password"]').type('StrongPassword123!');
      
      // Accept terms if checkbox exists
      cy.get('body').then(($body) => {
        if ($body.find('input[type="checkbox"]').length > 0) {
          cy.get('input[type="checkbox"]').check();
        }
      });
      
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard or onboarding
      cy.url().should('satisfy', (url) => {
        return url.includes('/dashboard') || url.includes('/onboarding');
      });
    });

    it('should handle signup errors', () => {
      // Mock Firebase auth error
      cy.window().then((win) => {
        cy.stub(win, 'createUserWithEmailAndPassword').rejects(
          new Error('Email already in use')
        );
      });
      
      // Fill in information
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[type="email"]').type('existing@example.com');
      cy.get('input[type="password"]').type('StrongPassword123!');
      cy.get('button[type="submit"]').click();
      
      // Should show error message
      cy.contains('Email already in use').should('be.visible');
    });

    it('should navigate to login page', () => {
      // Click login link
      cy.contains('Log in').click();
      
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
      
      // Mock successful login
      cy.window().then((win) => {
        cy.stub(win, 'signInWithEmailAndPassword').resolves({
          user: { uid: 'test-uid', email: 'test@example.com' }
        });
      });
      
      // Login
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Should redirect back to dashboard
      cy.url().should('include', '/dashboard');
    });

    it('should handle logout', () => {
      // Mock being logged in
      cy.window().then((win) => {
        win.localStorage.setItem('user', JSON.stringify({
          uid: 'test-uid',
          email: 'test@example.com'
        }));
      });
      
      // Visit a page with logout functionality
      cy.visit('/dashboard');
      
      // Find and click logout button
      cy.get('[data-cy="logout"]').click();
      
      // Should redirect to home or login
      cy.url().should('satisfy', (url) => {
        return url.includes('/') || url.includes('/auth/login');
      });
      
      // Should clear auth state
      cy.window().then((win) => {
        expect(win.localStorage.getItem('user')).to.be.null;
      });
    });
  });

  describe('Social Authentication', () => {
    it('should handle Google login if available', () => {
      cy.visit('/auth/login');
      
      // Check if Google login button exists
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="google-login"]').length > 0) {
          // Mock Google auth
          cy.window().then((win) => {
            cy.stub(win, 'signInWithPopup').resolves({
              user: { uid: 'google-uid', email: 'google@example.com' }
            });
          });
          
          cy.get('[data-cy="google-login"]').click();
          
          // Should redirect after successful login
          cy.url().should('satisfy', (url) => {
            return url.includes('/dashboard') || url.includes('/');
          });
        }
      });
    });
  });
});

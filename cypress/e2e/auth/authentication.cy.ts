// Authentication End-to-End Tests
// Tests user registration, login, logout, and authentication flows

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearTestData();
  });

  describe('User Registration', () => {
    it('should allow new user registration', () => {
      const userData = {
        name: 'John Doe',
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        agreeToTerms: true
      };

      cy.visit('/auth/signup');
      cy.fillRegistrationForm(userData);
      cy.get('[data-cy="signup-button"]').click();

      // Should redirect to email verification
      cy.url().should('include', '/auth/verify-email');
      cy.get('[data-cy="verification-message"]').should('be.visible');
      cy.get('[data-cy="verification-message"]').should('contain.text', userData.email);
    });

    it('should validate registration form fields', () => {
      cy.visit('/auth/signup');

      // Test empty form submission
      cy.get('[data-cy="signup-button"]').click();
      cy.get('[data-cy="name-error"]').should('contain.text', 'Name is required');
      cy.get('[data-cy="email-error"]').should('contain.text', 'Email is required');
      cy.get('[data-cy="password-error"]').should('contain.text', 'Password is required');

      // Test invalid email
      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="signup-button"]').click();
      cy.get('[data-cy="email-error"]').should('contain.text', 'Please enter a valid email');

      // Test weak password
      cy.get('[data-cy="email-input"]').clear().type('test@example.com');
      cy.get('[data-cy="password-input"]').type('weak');
      cy.get('[data-cy="signup-button"]').click();
      cy.get('[data-cy="password-error"]').should('contain.text', 'Password must be at least 8 characters');

      // Test password mismatch
      cy.get('[data-cy="password-input"]').clear().type('StrongPassword123!');
      cy.get('[data-cy="confirm-password-input"]').type('DifferentPassword123!');
      cy.get('[data-cy="signup-button"]').click();
      cy.get('[data-cy="confirm-password-error"]').should('contain.text', 'Passwords do not match');

      // Test terms agreement requirement
      cy.get('[data-cy="confirm-password-input"]').clear().type('StrongPassword123!');
      cy.get('[data-cy="signup-button"]').click();
      cy.get('[data-cy="terms-error"]').should('contain.text', 'You must agree to the terms');
    });

    it('should prevent duplicate email registration', () => {
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        agreeToTerms: true
      };

      // Create user first
      cy.createTestUser(userData);

      // Try to register with same email
      cy.visit('/auth/signup');
      cy.fillRegistrationForm(userData);
      cy.get('[data-cy="signup-button"]').click();

      cy.shouldShowError('Email already in use');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Create a test user for login tests
      cy.createTestUser({
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD'),
        name: 'Test User'
      });
    });

    it('should allow user login with valid credentials', () => {
      cy.visit('/auth/signin');
      cy.fillLoginForm(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
      cy.get('[data-cy="signin-button"]').click();

      cy.waitForAuth();
      cy.shouldBeLoggedIn();
      cy.url().should('include', '/dashboard');
    });

    it('should reject invalid credentials', () => {
      cy.visit('/auth/signin');
      cy.fillLoginForm('invalid@example.com', 'wrongpassword');
      cy.get('[data-cy="signin-button"]').click();

      cy.shouldShowError('Invalid email or password');
      cy.shouldBeLoggedOut();
    });

    it('should validate login form fields', () => {
      cy.visit('/auth/signin');

      // Test empty form submission
      cy.get('[data-cy="signin-button"]').click();
      cy.get('[data-cy="email-error"]').should('contain.text', 'Email is required');
      cy.get('[data-cy="password-error"]').should('contain.text', 'Password is required');

      // Test invalid email format
      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="signin-button"]').click();
      cy.get('[data-cy="email-error"]').should('contain.text', 'Please enter a valid email');
    });

    it('should handle "Remember Me" functionality', () => {
      cy.visit('/auth/signin');
      cy.fillLoginForm(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
      cy.get('[data-cy="remember-me-checkbox"]').check();
      cy.get('[data-cy="signin-button"]').click();

      cy.waitForAuth();
      cy.shouldBeLoggedIn();

      // Check that session persists after page reload
      cy.reload();
      cy.waitForAuth();
      cy.shouldBeLoggedIn();
    });
  });

  describe('Google OAuth Login', () => {
    it('should initiate Google OAuth flow', () => {
      cy.visit('/auth/signin');
      cy.get('[data-cy="google-signin-button"]').click();

      // Should redirect to Google OAuth (we'll mock this in real tests)
      cy.window().then((win) => {
        // Mock Google OAuth response
        expect(win.location.href).to.include('accounts.google.com');
      });
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.createTestUser({
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD')
      });
    });

    it('should send password reset email', () => {
      cy.visit('/auth/signin');
      cy.get('[data-cy="forgot-password-link"]').click();

      cy.url().should('include', '/auth/reset-password');
      cy.get('[data-cy="email-input"]').type(Cypress.env('TEST_USER_EMAIL'));
      cy.get('[data-cy="reset-password-button"]').click();

      cy.shouldShowSuccess('Password reset email sent');
      cy.get('[data-cy="reset-email-message"]').should('contain.text', Cypress.env('TEST_USER_EMAIL'));
    });

    it('should validate email for password reset', () => {
      cy.visit('/auth/reset-password');

      // Test empty email
      cy.get('[data-cy="reset-password-button"]').click();
      cy.get('[data-cy="email-error"]').should('contain.text', 'Email is required');

      // Test invalid email
      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="reset-password-button"]').click();
      cy.get('[data-cy="email-error"]').should('contain.text', 'Please enter a valid email');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should log out user successfully', () => {
      cy.shouldBeLoggedIn();
      cy.logout();
      cy.shouldBeLoggedOut();
      cy.url().should('include', '/');
    });

    it('should clear user session data on logout', () => {
      cy.shouldBeLoggedIn();
      
      // Check that user data exists
      cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
      
      cy.logout();
      
      // Check that user data is cleared
      cy.window().its('localStorage').invoke('getItem', 'authToken').should('not.exist');
    });
  });

  describe('Authentication State Persistence', () => {
    it('should maintain authentication across page reloads', () => {
      cy.login();
      cy.shouldBeLoggedIn();

      cy.reload();
      cy.waitForAuth();
      cy.shouldBeLoggedIn();
    });

    it('should redirect unauthenticated users to login', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/signin');
      cy.get('[data-cy="signin-required-message"]').should('be.visible');
    });

    it('should redirect authenticated users away from auth pages', () => {
      cy.login();
      cy.visit('/auth/signin');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Email Verification', () => {
    it('should show email verification prompt for unverified users', () => {
      // Create unverified user
      cy.createTestUser({
        email: 'unverified@example.com',
        password: 'TestPassword123!',
        emailVerified: false
      });

      cy.login('unverified@example.com', 'TestPassword123!');
      
      cy.get('[data-cy="email-verification-banner"]').should('be.visible');
      cy.get('[data-cy="resend-verification-button"]').should('be.visible');
    });

    it('should allow resending verification email', () => {
      cy.createTestUser({
        email: 'unverified@example.com',
        password: 'TestPassword123!',
        emailVerified: false
      });

      cy.login('unverified@example.com', 'TestPassword123!');
      
      cy.get('[data-cy="resend-verification-button"]').click();
      cy.shouldShowSuccess('Verification email sent');
    });
  });
});

/**
 * Comprehensive End-to-End Social Authentication Testing
 * 
 * This test suite verifies that the authentication system is completely social-only
 * and that no email/password fields are present anywhere in the application.
 */

describe('Comprehensive Social Authentication E2E Tests', () => {
  const baseUrl = 'https://geargrab.co';
  
  beforeEach(() => {
    // Clear all cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Visit the homepage
    cy.visit(baseUrl);
    
    // Wait for page to load
    cy.wait(2000);
  });

  describe('Homepage Authentication Modal', () => {
    it('should show only social login buttons when accessing protected features', () => {
      // Try to access a feature that requires authentication
      cy.get('body').then(($body) => {
        // Look for "Rent Now" buttons or similar
        if ($body.find('[data-cy="rent-now-button"]').length > 0) {
          cy.get('[data-cy="rent-now-button"]').first().click();
        } else if ($body.find('button').filter(':contains("Rent")').length > 0) {
          cy.get('button').filter(':contains("Rent")').first().click();
        } else {
          // Navigate to a protected route
          cy.visit(`${baseUrl}/dashboard`);
        }
      });

      // Wait for modal to appear
      cy.wait(1000);

      // Verify social login modal appears
      cy.get('body').should('contain.text', 'Welcome Back');
      
      // Verify social login buttons are present
      cy.get('button').filter(':contains("Continue with Google")').should('be.visible');
      cy.get('button').filter(':contains("Continue with Apple")').should('be.visible');
      cy.get('button').filter(':contains("Continue with Facebook")').should('be.visible');
      cy.get('button').filter(':contains("Continue with GitHub")').should('be.visible');

      // CRITICAL: Verify NO email/password fields exist
      cy.get('input[type="email"]').should('not.exist');
      cy.get('input[type="password"]').should('not.exist');
      cy.get('input[placeholder*="email" i]').should('not.exist');
      cy.get('input[placeholder*="password" i]').should('not.exist');
      
      // Verify no email/password related text
      cy.get('body').should('not.contain.text', 'Or continue with email');
      cy.get('body').should('not.contain.text', 'Email address');
      cy.get('body').should('not.contain.text', 'Enter your email');
      cy.get('body').should('not.contain.text', 'Enter your password');
      cy.get('body').should('not.contain.text', 'Password');
    });
  });

  describe('Login Page Authentication', () => {
    it('should show only social login options on dedicated login page', () => {
      cy.visit(`${baseUrl}/auth/login`);
      cy.wait(2000);

      // Verify page loads
      cy.get('body').should('contain.text', 'Welcome Back');
      
      // Verify social login buttons
      cy.get('button').filter(':contains("Continue with Google")').should('be.visible');
      cy.get('button').filter(':contains("Continue with Apple")').should('be.visible');
      cy.get('button').filter(':contains("Continue with Facebook")').should('be.visible');
      cy.get('button').filter(':contains("Continue with GitHub")').should('be.visible');

      // CRITICAL: Verify NO email/password fields
      cy.get('input[type="email"]').should('not.exist');
      cy.get('input[type="password"]').should('not.exist');
      cy.get('input[placeholder*="email" i]').should('not.exist');
      cy.get('input[placeholder*="password" i]').should('not.exist');
    });
  });

  describe('Signup Page Authentication', () => {
    it('should show only social signup options on dedicated signup page', () => {
      cy.visit(`${baseUrl}/auth/signup`);
      cy.wait(2000);

      // Verify social signup buttons
      cy.get('button').filter(':contains("Continue with Google")').should('be.visible');
      cy.get('button').filter(':contains("Continue with Apple")').should('be.visible');
      cy.get('button').filter(':contains("Continue with Facebook")').should('be.visible');
      cy.get('button').filter(':contains("Continue with GitHub")').should('be.visible');

      // CRITICAL: Verify NO email/password fields
      cy.get('input[type="email"]').should('not.exist');
      cy.get('input[type="password"]').should('not.exist');
      cy.get('input[placeholder*="email" i]').should('not.exist');
      cy.get('input[placeholder*="password" i]').should('not.exist');
    });
  });

  describe('Protected Routes Authentication', () => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/profile',
      '/dashboard/messages',
      '/list-gear'
    ];

    protectedRoutes.forEach((route) => {
      it(`should show social-only authentication for ${route}`, () => {
        cy.visit(`${baseUrl}${route}`);
        cy.wait(2000);

        // Should either redirect to login or show auth modal
        cy.get('body').then(($body) => {
          if ($body.text().includes('Welcome Back') || $body.text().includes('Sign In')) {
            // Verify social buttons are present
            cy.get('button').filter(':contains("Continue with Google")').should('be.visible');
            
            // CRITICAL: Verify NO email/password fields
            cy.get('input[type="email"]').should('not.exist');
            cy.get('input[type="password"]').should('not.exist');
          }
        });
      });
    });
  });

  describe('Social Login Button Functionality', () => {
    it('should have properly configured social login buttons', () => {
      cy.visit(`${baseUrl}/auth/login`);
      cy.wait(2000);

      // Test Google button
      cy.get('button').filter(':contains("Continue with Google")').should('be.enabled');
      
      // Test Apple button
      cy.get('button').filter(':contains("Continue with Apple")').should('be.enabled');
      
      // Test Facebook button
      cy.get('button').filter(':contains("Continue with Facebook")').should('be.enabled');
      
      // Test GitHub button
      cy.get('button').filter(':contains("Continue with GitHub")').should('be.enabled');
    });
  });

  describe('UI/UX Verification', () => {
    it('should have proper styling and branding', () => {
      cy.visit(`${baseUrl}/auth/login`);
      cy.wait(2000);

      // Verify GearGrab branding
      cy.get('body').should('contain.text', 'GearGrab');
      
      // Verify proper modal styling
      cy.get('body').should('contain.text', 'Welcome Back');
      
      // Verify social buttons have proper styling
      cy.get('button').filter(':contains("Continue with Google")')
        .should('have.css', 'background-color')
        .and('not.be.empty');
    });
  });

  describe('Cache Verification', () => {
    it('should not show any cached email/password forms', () => {
      // Force refresh to ensure no cached content
      cy.reload(true);
      cy.wait(3000);

      // Try multiple ways to trigger authentication
      cy.visit(`${baseUrl}/dashboard`);
      cy.wait(2000);

      // Verify absolutely no email/password elements exist
      cy.get('input[type="email"]').should('not.exist');
      cy.get('input[type="password"]').should('not.exist');
      cy.get('input[name*="email" i]').should('not.exist');
      cy.get('input[name*="password" i]').should('not.exist');
      cy.get('input[id*="email" i]').should('not.exist');
      cy.get('input[id*="password" i]').should('not.exist');
      
      // Check for any hidden forms
      cy.get('form').each(($form) => {
        cy.wrap($form).within(() => {
          cy.get('input[type="email"]').should('not.exist');
          cy.get('input[type="password"]').should('not.exist');
        });
      });
    });
  });
});

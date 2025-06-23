/**
 * Social Authentication Verification Test
 * 
 * This test verifies that the authentication system is completely social-only
 * and that no email/password fields are present anywhere.
 */

describe('Social Authentication Verification', () => {
  const baseUrl = 'https://geargrab.co';
  
  beforeEach(() => {
    // Clear all storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearSessionStorage();
  });

  it('should show only social login buttons on homepage authentication', () => {
    cy.visit(baseUrl);
    cy.wait(3000); // Wait for page to fully load
    
    // Try to trigger authentication modal by visiting a protected route
    cy.visit(`${baseUrl}/dashboard`);
    cy.wait(2000);
    
    // Check for social login buttons
    cy.get('body').should('contain.text', 'Continue with Google');
    cy.get('body').should('contain.text', 'Continue with Apple');
    cy.get('body').should('contain.text', 'Continue with Facebook');
    cy.get('body').should('contain.text', 'Continue with GitHub');
    
    // CRITICAL: Verify NO email/password fields exist
    cy.get('input[type="email"]').should('not.exist');
    cy.get('input[type="password"]').should('not.exist');
    cy.get('input[placeholder*="email" i]').should('not.exist');
    cy.get('input[placeholder*="password" i]').should('not.exist');
    
    // Verify no email/password related text
    cy.get('body').should('not.contain.text', 'Or continue with email');
    cy.get('body').should('not.contain.text', 'Enter your email');
    cy.get('body').should('not.contain.text', 'Enter your password');
  });

  it('should show only social login on dedicated login page', () => {
    cy.visit(`${baseUrl}/auth/login`);
    cy.wait(3000);
    
    // Verify social login buttons are present
    cy.get('body').should('contain.text', 'Continue with Google');
    cy.get('body').should('contain.text', 'Continue with Apple');
    cy.get('body').should('contain.text', 'Continue with Facebook');
    cy.get('body').should('contain.text', 'Continue with GitHub');
    
    // CRITICAL: Verify NO email/password fields
    cy.get('input[type="email"]').should('not.exist');
    cy.get('input[type="password"]').should('not.exist');
    cy.get('input[placeholder*="email" i]').should('not.exist');
    cy.get('input[placeholder*="password" i]').should('not.exist');
  });

  it('should show only social signup on dedicated signup page', () => {
    cy.visit(`${baseUrl}/auth/signup`);
    cy.wait(3000);
    
    // Verify social signup buttons are present
    cy.get('body').should('contain.text', 'Continue with Google');
    cy.get('body').should('contain.text', 'Continue with Apple');
    cy.get('body').should('contain.text', 'Continue with Facebook');
    cy.get('body').should('contain.text', 'Continue with GitHub');
    
    // CRITICAL: Verify NO email/password fields
    cy.get('input[type="email"]').should('not.exist');
    cy.get('input[type="password"]').should('not.exist');
    cy.get('input[placeholder*="email" i]').should('not.exist');
    cy.get('input[placeholder*="password" i]').should('not.exist');
  });

  it('should not have any cached email/password forms anywhere', () => {
    // Force hard refresh to ensure no cached content
    cy.visit(baseUrl, { 
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
        win.localStorage.clear();
      }
    });
    
    // Wait for full page load
    cy.wait(5000);
    
    // Check multiple pages for any email/password fields
    const pagesToCheck = [
      baseUrl,
      `${baseUrl}/auth/login`,
      `${baseUrl}/auth/signup`,
      `${baseUrl}/dashboard`,
      `${baseUrl}/list-gear`
    ];
    
    pagesToCheck.forEach((url) => {
      cy.visit(url);
      cy.wait(2000);
      
      // Verify absolutely no email/password elements exist
      cy.get('input[type="email"]').should('not.exist');
      cy.get('input[type="password"]').should('not.exist');
      cy.get('input[name*="email" i]').should('not.exist');
      cy.get('input[name*="password" i]').should('not.exist');
      cy.get('input[id*="email" i]').should('not.exist');
      cy.get('input[id*="password" i]').should('not.exist');
    });
  });

  it('should have proper GearGrab branding and styling', () => {
    cy.visit(`${baseUrl}/auth/login`);
    cy.wait(3000);
    
    // Verify GearGrab branding
    cy.get('body').should('contain.text', 'GearGrab');
    
    // Verify proper authentication messaging
    cy.get('body').should('contain.text', 'Welcome Back');
    
    // Verify social buttons are properly styled and clickable
    cy.get('button').contains('Continue with Google').should('be.visible').and('be.enabled');
    cy.get('button').contains('Continue with Apple').should('be.visible').and('be.enabled');
    cy.get('button').contains('Continue with Facebook').should('be.visible').and('be.enabled');
    cy.get('button').contains('Continue with GitHub').should('be.visible').and('be.enabled');
  });

  it('should handle protected routes correctly', () => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/profile',
      '/dashboard/messages',
      '/list-gear'
    ];

    protectedRoutes.forEach((route) => {
      cy.visit(`${baseUrl}${route}`);
      cy.wait(3000);

      // Should either redirect to login or show auth modal
      // In either case, should only show social authentication
      cy.get('body').then(($body) => {
        if ($body.text().includes('Continue with Google')) {
          // Verify all social buttons are present
          cy.get('body').should('contain.text', 'Continue with Google');
          cy.get('body').should('contain.text', 'Continue with Apple');
          cy.get('body').should('contain.text', 'Continue with Facebook');
          cy.get('body').should('contain.text', 'Continue with GitHub');
          
          // CRITICAL: Verify NO email/password fields
          cy.get('input[type="email"]').should('not.exist');
          cy.get('input[type="password"]').should('not.exist');
        }
      });
    });
  });
});

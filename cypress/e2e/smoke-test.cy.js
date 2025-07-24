describe('GearGrab Application Smoke Tests', () => {
  beforeEach(() => {
    // Mock basic user data
    cy.mockApiResponse('GET', '**/api/users/me', {
      id: 'user-123',
      email: 'user@example.com',
      full_name: 'Test User',
      is_active: true
    });
  });

  it('should load the homepage', () => {
    cy.visit('/');
    
    // Should show main navigation
    cy.contains('GearGrab').should('be.visible');
    cy.contains('Browse Gear').should('be.visible');
    cy.contains('List Your Gear').should('be.visible');
  });

  it('should navigate to browse page', () => {
    // Mock gear items
    cy.mockApiResponse('GET', '**/api/gear-items', [
      {
        id: 'gear-1',
        name: 'Test Tent',
        daily_rate: 50,
        images: ['tent.jpg'],
        created_by: 'owner@example.com'
      }
    ]);
    
    cy.visit('/');
    cy.contains('Browse Gear').click();
    
    cy.url().should('include', '/browse');
    cy.contains('Available Gear').should('be.visible');
  });

  it('should navigate to profile page when logged in', () => {
    cy.login();
    
    // Mock user profile data
    cy.mockApiResponse('GET', '**/api/users/user-123', {
      id: 'user-123',
      email: 'user@example.com',
      full_name: 'Test User',
      bio: 'Test bio'
    });
    
    cy.mockApiResponse('GET', '**/api/gear-items', []);
    cy.mockApiResponse('GET', '**/api/rentals', []);
    
    cy.visit('/profile');
    
    cy.contains('Test User').should('be.visible');
    cy.contains('Tax Information').should('be.visible');
  });

  it('should show cart functionality', () => {
    cy.login();
    
    // Mock empty cart
    cy.mockApiResponse('GET', '**/api/cart-items', []);
    
    cy.visit('/cart');
    
    cy.contains('Your Cart').should('be.visible');
    cy.contains('Your cart is empty').should('be.visible');
  });

  it('should show my rentals page', () => {
    cy.login();
    
    // Mock rentals
    cy.mockApiResponse('GET', '**/api/rentals', []);
    
    cy.visit('/my-rentals');
    
    cy.contains('My Rentals').should('be.visible');
  });

  it('should handle 404 pages gracefully', () => {
    cy.visit('/non-existent-page', { failOnStatusCode: false });
    
    // Should show some kind of error or redirect
    // This depends on your routing setup
    cy.url().should('not.include', '/non-existent-page');
  });
});

describe('Responsive Design Tests', () => {
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 720, name: 'Desktop' }
  ];

  viewports.forEach(viewport => {
    it(`should display correctly on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height);
      
      cy.visit('/');
      
      // Should show navigation (might be collapsed on mobile)
      cy.contains('GearGrab').should('be.visible');
      
      // Should be responsive
      cy.get('body').should('be.visible');
    });
  });
});

describe('Performance Tests', () => {
  it('should load pages within reasonable time', () => {
    const startTime = Date.now();
    
    cy.visit('/');
    
    cy.get('body').should('be.visible').then(() => {
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(5000); // 5 seconds max
    });
  });

  it('should handle multiple API calls efficiently', () => {
    // Mock multiple API responses
    cy.mockApiResponse('GET', '**/api/gear-items', []);
    cy.mockApiResponse('GET', '**/api/users/me', { id: 'user-123' });
    cy.mockApiResponse('GET', '**/api/cart-items', []);
    
    cy.login();
    
    const startTime = Date.now();
    cy.visit('/browse');
    
    cy.contains('Available Gear').should('be.visible').then(() => {
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(3000); // 3 seconds max for browse page
    });
  });
});

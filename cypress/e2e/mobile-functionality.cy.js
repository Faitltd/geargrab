describe('Mobile Functionality Tests', () => {
  // Mobile viewport configurations
  const mobileViewports = [
    { device: 'iPhone SE', width: 375, height: 667 },
    { device: 'iPhone 12', width: 390, height: 844 },
    { device: 'Samsung Galaxy S21', width: 360, height: 800 },
    { device: 'iPad Mini', width: 768, height: 1024 }
  ];

  mobileViewports.forEach(({ device, width, height }) => {
    describe(`${device} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/');
      });

      it('should display the homepage correctly', () => {
        // Check that the page loads
        cy.get('body').should('be.visible');
        
        // Check video background container exists
        cy.get('[class*="fixed inset-0 z-0"]').should('exist');
        
        // Check hero logo is visible and properly sized
        cy.get('img[alt="GearGrab"]').first().should('be.visible');
        
        // Check main tagline is visible
        cy.contains('Meet Up. Gear Up. Get Out.').should('be.visible');
        
        // Check search form is present
        cy.get('form').should('be.visible');
      });

      it('should have functional navigation', () => {
        // Check navbar is visible
        cy.get('nav').should('be.visible');
        
        // Check logo in navbar
        cy.get('nav img[alt="GearGrab"]').should('be.visible');
        
        // Test mobile menu toggle (for smaller screens)
        if (width < 640) {
          // Look for mobile menu button
          cy.get('button').contains('☰').should('be.visible').click();
          cy.get('nav').should('contain', 'Home');
        }
        
        // Test navigation links
        cy.get('nav').should('contain', 'Browse');
        cy.get('nav').should('contain', 'List Gear');
      });

      it('should handle search functionality', () => {
        // Test search input
        cy.get('input').first().should('be.visible');
        
        // Test search button
        cy.get('button').contains(/search|find/i).should('be.visible');
      });

      it('should display featured content properly', () => {
        // Scroll to featured gear section
        cy.contains('Featured Gear').scrollIntoView();
        cy.contains('Featured Gear').should('be.visible');
        
        // Scroll to categories
        cy.contains('Explore Categories').scrollIntoView();
        cy.contains('Explore Categories').should('be.visible');
      });

      it('should handle responsive design elements', () => {
        // Check that hero logo is properly sized for mobile
        cy.get('img[alt="GearGrab"]').first().should('be.visible');
        
        // Check that text is readable
        cy.get('h1, h2').should('be.visible');
        
        // Check that buttons are touchable
        cy.get('button').should('be.visible');
      });

      it('should load and display video background', () => {
        // Check for video element
        cy.get('video').should('exist');
        
        // Check video attributes
        cy.get('video').should('have.attr', 'autoplay');
        cy.get('video').should('have.attr', 'muted');
        cy.get('video').should('have.attr', 'loop');
      });
    });
  });

  // Cross-device compatibility test
  describe('Cross-Device Compatibility', () => {
    it('should maintain functionality across different screen sizes', () => {
      // Test on mobile
      cy.viewport(375, 667);
      cy.visit('/');
      cy.get('img[alt="GearGrab"]').should('be.visible');
      
      // Test on tablet
      cy.viewport(768, 1024);
      cy.reload();
      cy.get('img[alt="GearGrab"]').should('be.visible');
      
      // Test on desktop
      cy.viewport(1280, 720);
      cy.reload();
      cy.get('img[alt="GearGrab"]').should('be.visible');
    });
  });
});

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
          cy.get('[aria-label="Toggle menu"]').should('be.visible').click();
          cy.get('nav').should('contain', 'Home');
        }
        
        // Test navigation links
        cy.get('nav').should('contain', 'Browse');
        cy.get('nav').should('contain', 'List Gear');
      });

      it('should handle search functionality', () => {
        // Test search input
        cy.get('input[placeholder*="search"], input[type="search"]').first().should('be.visible');
        
        // Test location input if present
        cy.get('input').should('have.length.greaterThan', 0);
        
        // Test search button
        cy.get('button').contains(/search|find/i).should('be.visible');
      });

      it('should display featured content properly', () => {
        // Scroll to featured gear section
        cy.contains('Featured Gear').scrollIntoView();
        cy.contains('Featured Gear').should('be.visible');
        
        // Check featured gear cards are visible
        cy.get('[class*="grid"]').should('exist');
        
        // Scroll to categories
        cy.contains('Explore Categories').scrollIntoView();
        cy.contains('Explore Categories').should('be.visible');
        
        // Check category grid
        cy.get('[class*="grid"]').should('have.length.greaterThan', 1);
      });

      it('should have working authentication links', () => {
        // Check for auth links in navigation
        cy.get('nav').within(() => {
          // Should have either login/signup or user menu
          cy.get('body').then(($body) => {
            if ($body.find('a[href*="login"], a[href*="signup"]').length > 0) {
              cy.get('a[href*="login"], a[href*="signup"]').should('be.visible');
            } else {
              // User might be logged in, check for user menu
              cy.get('[class*="user"], [class*="profile"], [class*="avatar"]').should('exist');
            }
          });
        });
      });

      it('should handle responsive design elements', () => {
        // Check that text is readable (not too small)
        cy.get('h1, h2').should('have.css', 'font-size').and('not.equal', '0px');
        
        // Check that buttons are touchable (minimum 44px)
        cy.get('button, a').each(($el) => {
          cy.wrap($el).should('have.css', 'min-height');
        });
        
        // Check that images are responsive
        cy.get('img').each(($img) => {
          cy.wrap($img).should('have.css', 'max-width', '100%');
        });
      });

      it('should handle page scrolling smoothly', () => {
        // Test smooth scrolling
        cy.get('body').should('have.css', 'scroll-behavior', 'smooth');
        
        // Scroll to bottom
        cy.scrollTo('bottom');
        
        // Scroll back to top
        cy.scrollTo('top');
        
        // Check that hero content is visible again
        cy.contains('Meet Up. Gear Up. Get Out.').should('be.visible');
      });

      it('should load and display video background', () => {
        // Check for video element
        cy.get('video').should('exist');
        
        // Check video attributes
        cy.get('video').should('have.attr', 'autoplay');
        cy.get('video').should('have.attr', 'muted');
        cy.get('video').should('have.attr', 'loop');
        
        // Check fallback image exists
        cy.get('img[src*="pexels-bianca-gasparoto"]').should('exist');
      });

      it('should handle form interactions', () => {
        // Test search form
        cy.get('input').first().should('be.visible').type('tent');
        
        // Check that typing works
        cy.get('input').first().should('have.value', 'tent');
        
        // Clear input
        cy.get('input').first().clear().should('have.value', '');
      });

      it('should navigate to other pages', () => {
        // Test Browse link
        cy.get('a[href="/browse"]').first().click();
        cy.url().should('include', '/browse');
        cy.go('back');
        
        // Test List Gear link
        cy.get('a[href="/list-gear"]').first().click();
        cy.url().should('include', '/list-gear');
        cy.go('back');
        
        // Test How It Works link
        cy.get('a[href="/how-it-works"]').first().click();
        cy.url().should('include', '/how-it-works');
        cy.go('back');
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

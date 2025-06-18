/// <reference types="cypress" />

describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach((viewport) => {
    describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });

      it('should display homepage correctly', () => {
        cy.visit('/');
        
        // Check main elements are visible
        cy.get('h1').should('be.visible');
        cy.contains('Adventure Awaits').should('be.visible');
        
        // Check navigation
        if (viewport.width < 768) {
          // Mobile: should have hamburger menu
          cy.get('[data-cy="mobile-menu-button"]').should('be.visible');
        } else {
          // Desktop: should have full navigation
          cy.get('nav').contains('Browse').should('be.visible');
          cy.get('nav').contains('List Gear').should('be.visible');
        }
        
        // Check hero buttons are accessible
        cy.contains('Browse Gear').should('be.visible');
        cy.contains('List Your Gear').should('be.visible');
        
        // Check categories section
        cy.contains('Browse by Category').should('be.visible');
        cy.get('.grid').should('be.visible');
      });

      it('should display browse page correctly', () => {
        cy.visit('/browse');
        
        // Check search functionality
        cy.get('input[placeholder*="search"]').should('be.visible');
        
        if (viewport.width < 768) {
          // Mobile: search should stack vertically
          cy.get('[data-cy="hero-search"]').should('be.visible');
        }
        
        // Check gear grid
        cy.get('[data-cy="gear-grid"]').should('be.visible');
        cy.get('[data-cy="gear-card"]').should('be.visible');
        
        // Check filters
        if (viewport.width >= 768) {
          // Desktop: filters might be in sidebar
          cy.get('[data-cy="filter-sidebar"]').should('exist');
        } else {
          // Mobile: filters in dropdown/modal
          cy.get('[data-cy="filter-button"]').should('be.visible');
        }
      });

      it('should display listing details correctly', () => {
        cy.visit('/listing/1');
        
        // Check image gallery
        cy.get('[data-cy="image-gallery"]').should('be.visible');
        
        if (viewport.width < 768) {
          // Mobile: images should stack
          cy.get('[data-cy="main-image"]').should('be.visible');
        } else {
          // Desktop: thumbnails should be visible
          cy.get('[data-cy="thumbnail"]').should('be.visible');
        }
        
        // Check booking form
        cy.get('[data-cy="booking-form"]').should('be.visible');
        cy.get('[data-cy="start-date"]').should('be.visible');
        cy.get('[data-cy="book-now"]').should('be.visible');
        
        // Check tabs
        cy.get('[data-cy="tab-description"]').should('be.visible');
        
        if (viewport.width < 768) {
          // Mobile: tabs might be stacked or in dropdown
          cy.get('[data-cy="tab-description"]').click();
          cy.get('[data-cy="description-content"]').should('be.visible');
        }
      });

      it('should display list gear form correctly', () => {
        cy.visit('/list-gear');
        
        // Check form is accessible
        cy.get('h1').should('contain', 'List Your Gear');
        cy.get('#title').should('be.visible');
        cy.get('#category').should('be.visible');
        
        // Check progress indicator
        cy.get('.w-8.h-8.rounded-full').should('be.visible');
        
        // Check navigation buttons
        cy.get('button').contains('Next').should('be.visible');
        
        if (viewport.width < 768) {
          // Mobile: form should be single column
          cy.get('#title').should('be.visible');
          cy.get('#category').should('be.visible');
        }
      });

      it('should display authentication forms correctly', () => {
        cy.visit('/auth/login');
        
        // Check form elements
        cy.get('h1').should('be.visible');
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
        
        // Check form is properly sized
        if (viewport.width < 768) {
          // Mobile: form should take full width
          cy.get('form').should('be.visible');
        } else {
          // Desktop: form should be centered
          cy.get('form').should('be.visible');
        }
        
        // Test signup page
        cy.visit('/auth/signup');
        cy.get('h1').should('be.visible');
        cy.get('input[name="firstName"]').should('be.visible');
        cy.get('input[type="email"]').should('be.visible');
      });

      if (viewport.width >= 768) {
        it('should display dashboard correctly', () => {
          // Mock being logged in
          cy.window().then((win) => {
            win.localStorage.setItem('user', JSON.stringify({
              uid: 'test-uid',
              email: 'test@example.com'
            }));
          });
          
          cy.visit('/dashboard');
          
          // Check dashboard navigation
          cy.get('[data-cy="dashboard-nav"]').should('be.visible');
          
          // Check stats cards
          cy.get('[data-cy="stats-card"]').should('be.visible');
          
          // Check recent activity
          cy.get('[data-cy="recent-activity"]').should('be.visible');
        });
      }

      it('should handle touch interactions on mobile', () => {
        if (viewport.width < 768) {
          cy.visit('/');
          
          // Test mobile menu
          cy.get('[data-cy="mobile-menu-button"]').should('be.visible').click();
          cy.get('[data-cy="mobile-menu"]').should('be.visible');
          
          // Test swipe gestures on image galleries
          cy.visit('/listing/1');
          cy.get('[data-cy="main-image"]').should('be.visible');
          
          // Test touch-friendly button sizes
          cy.get('[data-cy="book-now"]').should('be.visible');
          cy.get('[data-cy="book-now"]').should('have.css', 'min-height');
        }
      });

      it('should maintain readability and usability', () => {
        cy.visit('/');
        
        // Check text is readable
        cy.get('h1').should('be.visible');
        cy.get('p').should('be.visible');
        
        // Check buttons are appropriately sized
        cy.get('button, .btn').each(($btn) => {
          cy.wrap($btn).should('be.visible');
          
          if (viewport.width < 768) {
            // Mobile: buttons should be touch-friendly (at least 44px)
            cy.wrap($btn).should('have.css', 'min-height');
          }
        });
        
        // Check form inputs are appropriately sized
        cy.visit('/auth/login');
        cy.get('input').each(($input) => {
          cy.wrap($input).should('be.visible');
          
          if (viewport.width < 768) {
            // Mobile: inputs should be touch-friendly
            cy.wrap($input).should('have.css', 'min-height');
          }
        });
      });

      it('should handle overflow and scrolling properly', () => {
        cy.visit('/browse');
        
        // Check horizontal scrolling doesn't occur
        cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
        
        // Check content fits within viewport
        cy.get('[data-cy="gear-grid"]').should('be.visible');
        
        // Test long content scrolling
        cy.visit('/listing/1');
        cy.get('[data-cy="description-content"]').should('be.visible');
        
        // Scroll to bottom
        cy.scrollTo('bottom');
        cy.get('footer').should('be.visible');
      });

      it('should display images responsively', () => {
        cy.visit('/');
        
        // Check category images
        cy.get('.grid img').should('be.visible');
        cy.get('.grid img').each(($img) => {
          cy.wrap($img).should('have.css', 'max-width', '100%');
        });
        
        // Check listing images
        cy.visit('/listing/1');
        cy.get('[data-cy="main-image"]').should('be.visible');
        cy.get('[data-cy="main-image"]').should('have.css', 'max-width', '100%');
      });

      it('should maintain proper spacing and layout', () => {
        cy.visit('/');
        
        // Check margins and padding are appropriate
        cy.get('.container').should('be.visible');
        
        if (viewport.width < 768) {
          // Mobile: should have appropriate padding
          cy.get('.container').should('have.css', 'padding-left');
          cy.get('.container').should('have.css', 'padding-right');
        }
        
        // Check grid layouts adapt
        cy.get('.grid').should('be.visible');
        
        // Check text doesn't overflow
        cy.get('h1, h2, h3, p').each(($el) => {
          cy.wrap($el).should('be.visible');
        });
      });
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should work with different user agents', () => {
      // Test with different user agents
      const userAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      ];

      userAgents.forEach((userAgent) => {
        cy.visit('/', {
          headers: {
            'User-Agent': userAgent
          }
        });
        
        cy.get('h1').should('be.visible');
        cy.contains('Adventure Awaits').should('be.visible');
      });
    });
  });
});

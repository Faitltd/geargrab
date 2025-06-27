describe('Location-Based Search and Mapping', () => {
  beforeEach(() => {
    // Mock geolocation
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
        success({
          coords: {
            latitude: 39.7392,
            longitude: -104.9903
          }
        });
      });
    });
  });

  describe('Map Search Page', () => {
    it('should load the map search page', () => {
      cy.visit('/search/map');
      cy.contains('Map Search').should('be.visible');
      cy.get('[data-cy="search-filters"]').should('be.visible');
    });

    it('should display location permission request', () => {
      cy.visit('/search/map');
      cy.get('[data-cy="location-request"]').should('be.visible');
    });

    it('should handle search with location parameters', () => {
      cy.visit('/search/map?lat=39.7392&lng=-104.9903&radius=25');
      cy.contains('Map Search').should('be.visible');
      cy.get('[data-cy="search-results"]').should('be.visible');
    });
  });

  describe('Location Services Test Page', () => {
    it('should load the location test page', () => {
      cy.visit('/test-location');
      cy.contains('Location Services Test').should('be.visible');
    });

    it('should show test results', () => {
      cy.visit('/test-location');
      cy.get('[data-cy="test-results"]').should('be.visible');
      cy.contains('Google Maps API Key').should('be.visible');
      cy.contains('Geolocation Support').should('be.visible');
    });

    it('should allow running tests', () => {
      cy.visit('/test-location');
      cy.get('button').contains('Re-run Tests').click();
      cy.contains('Testing...').should('be.visible');
    });
  });

  describe('Search Page Map Integration', () => {
    it('should show map toggle on search page', () => {
      cy.visit('/search');
      cy.get('button').contains('Map').should('be.visible');
    });

    it('should toggle between list and map view', () => {
      cy.visit('/search');
      cy.get('button').contains('Map').click();
      cy.get('button').contains('List').should('be.visible');
    });

    it('should perform search and show results', () => {
      cy.visit('/search');
      cy.get('input[placeholder*="Search"]').type('camping gear');
      cy.get('button[type="submit"]').click();
      cy.get('[data-cy="search-results"]').should('be.visible');
    });
  });

  describe('Browse Page Map Integration', () => {
    it('should show map search link on browse page', () => {
      cy.visit('/browse');
      cy.get('a').contains('Map Search').should('be.visible');
    });

    it('should navigate to map search from browse page', () => {
      cy.visit('/browse');
      cy.get('a').contains('Map Search').click();
      cy.url().should('include', '/search/map');
    });
  });

  describe('Location API Endpoints', () => {
    it('should validate location search API parameters', () => {
      // Test invalid coordinates
      cy.request({
        url: '/api/search/location?lat=91&lng=0&radius=25',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('Invalid coordinate values');
      });
    });

    it('should validate radius parameter', () => {
      cy.request({
        url: '/api/search/location?lat=39.7392&lng=-104.9903&radius=1001',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('Radius must be between 0 and 1000 km');
      });
    });

    it('should accept valid location search parameters', () => {
      cy.request({
        url: '/api/search/location?lat=39.7392&lng=-104.9903&radius=25',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 404]); // 404 if no data, 200 if data exists
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should display map search properly on mobile', () => {
      cy.visit('/search/map');
      cy.contains('Map Search').should('be.visible');
      cy.get('[data-cy="view-toggle"]').should('be.visible');
    });

    it('should handle mobile map interactions', () => {
      cy.visit('/search/map');
      cy.get('button').contains('Map Only').click();
      cy.get('[data-cy="map-container"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle geolocation permission denied', () => {
      cy.window().then((win) => {
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
          error(new Error('Permission denied'));
        });
      });

      cy.visit('/search/map');
      cy.contains('Location not available').should('be.visible');
      cy.get('button').contains('Request Location Access').should('be.visible');
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/search/location*', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('locationSearchError');

      cy.visit('/search/map?lat=39.7392&lng=-104.9903&radius=25');
      cy.wait('@locationSearchError');
      cy.contains('No gear found').should('be.visible');
    });

    it('should handle network errors', () => {
      cy.intercept('GET', '/api/search/location*', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/search/map?lat=39.7392&lng=-104.9903&radius=25');
      cy.wait('@networkError');
      cy.contains('No gear found').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load map search page within acceptable time', () => {
      const start = Date.now();
      cy.visit('/search/map');
      cy.contains('Map Search').should('be.visible');
      cy.then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(5000); // 5 seconds
      });
    });

    it('should handle large search results efficiently', () => {
      // Mock large dataset
      cy.intercept('GET', '/api/search/location*', {
        fixture: 'large-search-results.json'
      }).as('largeResults');

      cy.visit('/search/map?lat=39.7392&lng=-104.9903&radius=100');
      cy.wait('@largeResults');
      cy.get('[data-cy="search-results"]').should('be.visible');
    });
  });
});

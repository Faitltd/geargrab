import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'ksq7ct',
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:5173',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshotOnRunFailure: true,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      // Test user credentials
      TEST_USER_EMAIL: 'test@geargrab.com',
      TEST_USER_PASSWORD: 'TestPassword123!',
      TEST_ADMIN_EMAIL: 'admin@geargrab.com',
      TEST_ADMIN_PASSWORD: 'AdminPassword123!',
      
      // API endpoints
      API_URL: 'http://localhost:5173/api',
      
      // Firebase config for testing
      FIREBASE_PROJECT_ID: 'geargrab-test',
      
      // Stripe test keys
      STRIPE_PUBLISHABLE_KEY: 'pk_test_...',
      
      // Feature flags
      ENABLE_PAYMENTS: true,
      ENABLE_ADMIN_PANEL: true,
      
      // Coverage
      coverage: false
    },
    
    setupNodeEvents(on, config) {
      // Custom tasks
      on('task', {
        // Log messages from tests
        log(message) {
          console.log(message);
          return null;
        },

        // Clear database for testing
        clearDatabase() {
          // Implementation would clear test database
          console.log('Clearing test database...');
          return null;
        },

        // Seed test data
        seedDatabase() {
          // Implementation would seed test data
          console.log('Seeding test database...');
          return null;
        }
      });

      return config;
    }
  },
  
  component: {
    devServer: {
      framework: 'svelte',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx,svelte}',
    supportFile: 'cypress/support/component.ts'
  },
  
  // Global configuration
  chromeWebSecurity: false,
  experimentalStudio: true,
  experimentalWebKitSupport: true,
  
  // File server options
  fileServerFolder: 'cypress',
  fixturesFolder: 'cypress/fixtures',
  
  // Browser configuration - let Cypress auto-detect browsers
});

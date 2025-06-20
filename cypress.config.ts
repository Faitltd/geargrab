import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    env: {
      // Test environment variables
      TEST_USER_EMAIL: 'test@geargrab.co',
      TEST_USER_PASSWORD: 'TestPassword123!',
      INVALID_EMAIL: 'invalid@example.com',
      INVALID_PASSWORD: 'wrongpassword',
      API_BASE_URL: 'http://localhost:5173/api'
    },

    setupNodeEvents(on, config) {
      // Node event listeners
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Clear test data
        clearTestData() {
          // Implementation would clear test user data
          return null;
        },
        
        // Create test user
        createTestUser(userData) {
          // Implementation would create a test user
          return userData;
        }
      });

      // Code coverage setup (if using @cypress/code-coverage)
      // require('@cypress/code-coverage/task')(on, config);

      return config;
    },
  },

  component: {
    devServer: {
      framework: 'svelte',
      bundler: 'vite',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },

  // TypeScript configuration handled by Cypress defaults
});

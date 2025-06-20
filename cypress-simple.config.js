const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://geargrab.co', // Use production site to avoid dev server issues
    supportFile: false, // Disable support file to avoid TypeScript issues
    specPattern: 'cypress/e2e/auth/**/*.cy.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false, // Disable video to speed up tests
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
      API_BASE_URL: 'https://geargrab.co/api'
    },

    setupNodeEvents(on, config) {
      // Simple node event listeners without TypeScript
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });

      return config;
    },
  }
});

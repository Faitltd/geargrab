import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'https://geargrab.co',
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,ts}',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    // Test isolation
    testIsolation: true,
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    }
  },
  component: {
    devServer: {
      framework: 'svelte',
      bundler: 'vite'
    }
  }
})
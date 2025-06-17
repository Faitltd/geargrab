#!/usr/bin/env node

/**
 * Authentication E2E Test Runner
 * Runs comprehensive authentication tests against the live GearGrab site
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LIVE_URL = 'https://geargrab.co';
const LOCAL_URL = 'http://localhost:5173';
const TEST_TIMEOUT = 60000; // 1 minute per test

// Test environment setup
const setupTestEnvironment = () => {
  console.log('🔧 Setting up authentication test environment...');
  
  // Create temporary Cypress config for live testing
  const liveConfig = {
    e2e: {
      baseUrl: LIVE_URL,
      specPattern: 'cypress/e2e/authentication.cy.js',
      supportFile: 'cypress/support/e2e.ts',
      video: true,
      screenshotOnRunFailure: true,
      viewportWidth: 1280,
      viewportHeight: 720,
      defaultCommandTimeout: 15000,
      requestTimeout: 15000,
      responseTimeout: 15000,
      pageLoadTimeout: 30000,
      testIsolation: true,
      retries: {
        runMode: 1,
        openMode: 0
      },
      env: {
        TESTING_MODE: 'live',
        BASE_URL: LIVE_URL
      }
    }
  };
  
  // Write temporary config
  fs.writeFileSync(
    path.join(process.cwd(), 'cypress.auth-test.config.js'),
    `import { defineConfig } from 'cypress'\n\nexport default defineConfig(${JSON.stringify(liveConfig, null, 2)})`
  );
  
  console.log('✅ Test environment configured for live site testing');
};

// Run authentication tests
const runAuthTests = async () => {
  console.log('🚀 Starting comprehensive authentication tests...');
  console.log(`📍 Testing against: ${LIVE_URL}`);
  
  try {
    // Run the authentication test suite
    const command = `npx cypress run --config-file cypress.auth-test.config.js --spec "cypress/e2e/authentication.cy.js" --reporter json --reporter-options "output=cypress/reports/auth-test-results.json"`;
    
    console.log('🔍 Executing authentication test suite...');
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: TEST_TIMEOUT * 10 // 10 minutes total
    });
    
    console.log('✅ Authentication tests completed successfully!');
    return { success: true, output };
    
  } catch (error) {
    console.error('❌ Authentication tests failed:');
    console.error(error.stdout || error.message);
    return { success: false, error: error.stdout || error.message };
  }
};

// Generate test report
const generateReport = (results) => {
  console.log('📊 Generating authentication test report...');
  
  const reportPath = path.join(process.cwd(), 'cypress/reports/auth-test-summary.md');
  const timestamp = new Date().toISOString();
  
  let report = `# Authentication E2E Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Test Target:** ${LIVE_URL}\n`;
  report += `**Status:** ${results.success ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  
  if (results.success) {
    report += `## ✅ Test Results\n\n`;
    report += `All authentication tests passed successfully!\n\n`;
    report += `### Tests Covered:\n`;
    report += `- ✅ Authentication state management\n`;
    report += `- ✅ Login/logout flow\n`;
    report += `- ✅ Google Sign-In integration\n`;
    report += `- ✅ Checkout authentication flow\n`;
    report += `- ✅ Redirect handling\n`;
    report += `- ✅ Error handling\n`;
    report += `- ✅ COOP policy compliance\n`;
    report += `- ✅ Performance testing\n\n`;
  } else {
    report += `## ❌ Test Failures\n\n`;
    report += `\`\`\`\n${results.error}\n\`\`\`\n\n`;
  }
  
  report += `## 🔧 Test Configuration\n\n`;
  report += `- **Base URL:** ${LIVE_URL}\n`;
  report += `- **Timeout:** ${TEST_TIMEOUT}ms per test\n`;
  report += `- **Retries:** 1 attempt\n`;
  report += `- **Browser:** Electron (headless)\n\n`;
  
  report += `## 📁 Artifacts\n\n`;
  report += `- **Screenshots:** \`cypress/screenshots/\`\n`;
  report += `- **Videos:** \`cypress/videos/\`\n`;
  report += `- **Raw Results:** \`cypress/reports/auth-test-results.json\`\n`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to: ${reportPath}`);
};

// Cleanup temporary files
const cleanup = () => {
  console.log('🧹 Cleaning up temporary files...');
  
  const tempConfig = path.join(process.cwd(), 'cypress.auth-test.config.js');
  if (fs.existsSync(tempConfig)) {
    fs.unlinkSync(tempConfig);
  }
  
  console.log('✅ Cleanup completed');
};

// Main execution
const main = async () => {
  console.log('🔐 GearGrab Authentication E2E Test Suite');
  console.log('==========================================\n');
  
  try {
    // Setup
    setupTestEnvironment();
    
    // Run tests
    const results = await runAuthTests();
    
    // Generate report
    generateReport(results);
    
    // Cleanup
    cleanup();
    
    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Fatal error during test execution:');
    console.error(error);
    
    cleanup();
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted');
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  cleanup();
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runAuthTests, setupTestEnvironment, generateReport };

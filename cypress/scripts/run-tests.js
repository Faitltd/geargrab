#!/usr/bin/env node

/**
 * Test runner script for GearGrab E2E tests
 * Provides different test execution modes and reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
  browser: process.env.CYPRESS_BROWSER || 'chrome',
  headless: process.env.CYPRESS_HEADLESS !== 'false',
  video: process.env.CYPRESS_VIDEO === 'true',
  screenshots: process.env.CYPRESS_SCREENSHOTS !== 'false'
};

// Test suites
const testSuites = {
  smoke: [
    'cypress/e2e/homepage.cy.js',
    'cypress/e2e/browse.cy.js'
  ],
  core: [
    'cypress/e2e/homepage.cy.js',
    'cypress/e2e/browse.cy.js',
    'cypress/e2e/listing-details.cy.js',
    'cypress/e2e/list-gear.cy.js'
  ],
  auth: [
    'cypress/e2e/authentication.cy.js'
  ],
  dashboard: [
    'cypress/e2e/dashboard.cy.js'
  ],
  responsive: [
    'cypress/e2e/responsive.cy.js'
  ],
  integration: [
    'cypress/e2e/integration.cy.js'
  ],
  all: [
    'cypress/e2e/**/*.cy.js'
  ]
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };

  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function createReportsDir() {
  const reportsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  return reportsDir;
}

function buildCypressCommand(suite, options = {}) {
  const cmd = ['npx cypress run'];

  // Base URL
  cmd.push(`--config baseUrl=${config.baseUrl}`);

  // Browser
  if (options.browser || config.browser) {
    cmd.push(`--browser ${options.browser || config.browser}`);
  }

  // Headless mode
  if (options.headed || !config.headless) {
    cmd.push('--headed');
  }

  // Video recording
  if (options.video !== undefined ? options.video : config.video) {
    cmd.push('--config video=true');
  } else {
    cmd.push('--config video=false');
  }

  // Screenshots
  if (options.screenshots !== undefined ? options.screenshots : config.screenshots) {
    cmd.push('--config screenshotOnRunFailure=true');
  }

  // Spec files
  if (suite && testSuites[suite]) {
    if (suite === 'all') {
      cmd.push('--spec "cypress/e2e/**/*.cy.js"');
    } else {
      cmd.push(`--spec "${testSuites[suite].join(',')}"`);
    }
  }

  // Environment variables
  if (options.env) {
    const envVars = Object.entries(options.env)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    cmd.push(`--env ${envVars}`);
  }

  return cmd.join(' ');
}

function runTests(suite, options = {}) {
  log(`Starting ${suite} test suite...`);
  log(`Base URL: ${config.baseUrl}`);
  log(`Browser: ${options.browser || config.browser}`);

  const reportsDir = createReportsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(reportsDir, `${suite}-${timestamp}.json`);

  try {
    const command = buildCypressCommand(suite, {
      ...options,
      env: {
        ...options.env,
        REPORT_FILE: reportFile
      }
    });

    log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });

    log(`✅ ${suite} tests completed successfully!`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${suite} tests failed!`, 'error');
    log(`Error: ${error.message}`, 'error');
    return false;
  }
}

function runParallel(suites, options = {}) {
  log('Running tests in parallel...');

  // Note: True parallel execution would require spawning separate processes
  // For now, we'll run them sequentially but with better error handling
  const results = [];

  for (const suite of suites) {
    try {
      const result = runTests(suite, options);
      results.push({ suite, success: result });
    } catch (error) {
      results.push({ suite, success: false, error: error.message });
    }
  }

  return Promise.resolve(results);
}

function generateReport(results) {
  const reportsDir = createReportsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(reportsDir, `summary-${timestamp}.json`);

  const summary = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results
  };

  fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));

  log('📊 Test Summary:', 'info');
  log(`Total Suites: ${summary.total}`);
  log(`Passed: ${summary.passed}`, summary.passed === summary.total ? 'success' : 'info');
  log(`Failed: ${summary.failed}`, summary.failed > 0 ? 'error' : 'info');
  log(`Report saved to: ${reportFile}`);

  return summary;
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'smoke':
      runTests('smoke');
      break;

    case 'core':
      runTests('core');
      break;

    case 'auth':
      runTests('auth');
      break;

    case 'dashboard':
      runTests('dashboard');
      break;

    case 'responsive':
      runTests('responsive');
      break;

    case 'integration':
      runTests('integration');
      break;

    case 'all':
      runTests('all');
      break;

    case 'parallel':
      const suitesToRun = args.slice(1);
      if (suitesToRun.length === 0) {
        log('Please specify test suites to run in parallel', 'error');
        process.exit(1);
      }

      runParallel(suitesToRun).then(results => {
        generateReport(results);
        const failed = results.filter(r => !r.success).length;
        process.exit(failed > 0 ? 1 : 0);
      });
      break;

    case 'ci':
      // CI mode: run all tests with specific settings
      log('Running in CI mode...', 'info');
      const success = runTests('all', {
        browser: 'chrome',
        headed: false,
        video: true,
        screenshots: true,
        env: {
          CI: 'true'
        }
      });
      process.exit(success ? 0 : 1);
      break;

    case 'help':
    default:
      console.log(`
GearGrab E2E Test Runner

Usage: node run-tests.js <command> [options]

Commands:
  smoke       Run smoke tests (homepage, browse)
  core        Run core functionality tests
  auth        Run authentication tests
  dashboard   Run dashboard tests
  responsive  Run responsive design tests
  integration Run integration tests
  all         Run all tests
  parallel    Run multiple suites in parallel
  ci          Run in CI mode (all tests, headless)
  help        Show this help message

Examples:
  node run-tests.js smoke
  node run-tests.js parallel core auth dashboard
  node run-tests.js ci

Environment Variables:
  CYPRESS_BASE_URL    Base URL for tests (default: http://localhost:5173)
  CYPRESS_BROWSER     Browser to use (default: chrome)
  CYPRESS_HEADLESS    Run in headless mode (default: true)
  CYPRESS_VIDEO       Record videos (default: false)
  CYPRESS_SCREENSHOTS Take screenshots on failure (default: true)
      `);
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  runTests,
  runParallel,
  generateReport,
  testSuites
};

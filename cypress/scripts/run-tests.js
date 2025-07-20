#!/usr/bin/env node

// Comprehensive test runner for GearGrab E2E tests
// Runs tests in different configurations and generates reports

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_CONFIGS = {
  smoke: {
    spec: 'cypress/e2e/auth/authentication.cy.ts',
    description: 'Quick smoke tests for critical functionality'
  },
  auth: {
    spec: 'cypress/e2e/auth/**/*.cy.ts',
    description: 'Authentication and user management tests'
  },
  listings: {
    spec: 'cypress/e2e/listings/**/*.cy.ts',
    description: 'Listing management and CRUD operations'
  },
  rentals: {
    spec: 'cypress/e2e/rentals/**/*.cy.ts',
    description: 'Rental flow and booking process'
  },
  payments: {
    spec: 'cypress/e2e/payments/**/*.cy.ts',
    description: 'Payment processing and Stripe integration'
  },
  admin: {
    spec: 'cypress/e2e/admin/**/*.cy.ts',
    description: 'Admin panel and moderation features'
  },
  full: {
    spec: 'cypress/e2e/**/*.cy.ts',
    description: 'Complete test suite'
  }
};

// Browser configurations
const BROWSERS = ['chrome', 'firefox', 'edge'];

// Environment configurations
const ENVIRONMENTS = {
  local: {
    baseUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:5173/api'
  },
  staging: {
    baseUrl: 'https://staging.geargrab.com',
    apiUrl: 'https://staging.geargrab.com/api'
  },
  production: {
    baseUrl: 'https://geargrab.com',
    apiUrl: 'https://geargrab.com/api'
  }
};

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      failures: []
    };
    this.startTime = Date.now();
  }

  async runTests(config = {}) {
    const {
      suite = 'smoke',
      browser = 'chrome',
      environment = 'local',
      headless = true,
      record = false,
      parallel = false,
      coverage = false
    } = config;

    console.log(`\n🚀 Running ${suite} tests on ${browser} (${environment})`);
    console.log(`📋 ${TEST_CONFIGS[suite].description}\n`);

    const cypressArgs = this.buildCypressArgs({
      suite,
      browser,
      environment,
      headless,
      record,
      parallel,
      coverage
    });

    try {
      await this.executeCypress(cypressArgs);
      console.log('✅ Tests completed successfully');
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
      process.exit(1);
    }
  }

  buildCypressArgs({ suite, browser, environment, headless, record, parallel, coverage }) {
    const args = ['run'];
    
    // Spec pattern
    args.push('--spec', TEST_CONFIGS[suite].spec);
    
    // Browser
    args.push('--browser', browser);
    
    // Headless mode
    if (headless) {
      args.push('--headless');
    }
    
    // Environment configuration
    const env = ENVIRONMENTS[environment];
    args.push('--config', `baseUrl=${env.baseUrl}`);
    args.push('--env', `API_URL=${env.apiUrl}`);
    
    // Coverage
    if (coverage) {
      args.push('--env', 'coverage=true');
    }
    
    // Recording (Cypress Dashboard)
    if (record) {
      args.push('--record');
      if (parallel) {
        args.push('--parallel');
      }
    }
    
    // Output configuration
    args.push('--reporter', 'mochawesome');
    args.push('--reporter-options', 'reportDir=cypress/reports,overwrite=false,html=true,json=true');
    
    return args;
  }

  async executeCypress(args) {
    return new Promise((resolve, reject) => {
      const cypress = spawn('npx', ['cypress', ...args], {
        stdio: 'inherit',
        shell: true
      });

      cypress.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Cypress exited with code ${code}`));
        }
      });

      cypress.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runCrossBrowser(suite = 'smoke') {
    console.log(`\n🌐 Running cross-browser tests for ${suite} suite\n`);
    
    const results = {};
    
    for (const browser of BROWSERS) {
      try {
        console.log(`\n📱 Testing on ${browser}...`);
        await this.runTests({ suite, browser, headless: true });
        results[browser] = 'PASSED';
      } catch (error) {
        results[browser] = 'FAILED';
        console.error(`❌ ${browser} tests failed:`, error.message);
      }
    }
    
    console.log('\n📊 Cross-browser test results:');
    Object.entries(results).forEach(([browser, status]) => {
      const icon = status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${browser}: ${status}`);
    });
    
    return results;
  }

  async runRegression() {
    console.log('\n🔄 Running regression test suite\n');
    
    const suites = ['auth', 'listings', 'rentals', 'payments'];
    const results = {};
    
    for (const suite of suites) {
      try {
        console.log(`\n🧪 Running ${suite} tests...`);
        await this.runTests({ suite, headless: true, coverage: true });
        results[suite] = 'PASSED';
      } catch (error) {
        results[suite] = 'FAILED';
        console.error(`❌ ${suite} tests failed:`, error.message);
      }
    }
    
    console.log('\n📊 Regression test results:');
    Object.entries(results).forEach(([suite, status]) => {
      const icon = status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${suite}: ${status}`);
    });
    
    return results;
  }

  async generateReport() {
    console.log('\n📄 Generating test report...');
    
    const reportDir = path.join(__dirname, '../reports');
    const reportFile = path.join(reportDir, 'test-summary.json');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to ${reportFile}`);
    
    return report;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test artifacts...');
    
    // Clean up screenshots and videos from failed tests
    const screenshotsDir = path.join(__dirname, '../screenshots');
    const videosDir = path.join(__dirname, '../videos');
    
    if (fs.existsSync(screenshotsDir)) {
      fs.rmSync(screenshotsDir, { recursive: true, force: true });
    }
    
    if (fs.existsSync(videosDir)) {
      fs.rmSync(videosDir, { recursive: true, force: true });
    }
    
    console.log('✅ Cleanup completed');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  try {
    if (args.includes('--cross-browser')) {
      const suite = args.find(arg => arg.startsWith('--suite='))?.split('=')[1] || 'smoke';
      await runner.runCrossB rowser(suite);
    } else if (args.includes('--regression')) {
      await runner.runRegression();
    } else {
      const config = {
        suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1] || 'smoke',
        browser: args.find(arg => arg.startsWith('--browser='))?.split('=')[1] || 'chrome',
        environment: args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'local',
        headless: !args.includes('--headed'),
        record: args.includes('--record'),
        parallel: args.includes('--parallel'),
        coverage: args.includes('--coverage')
      };
      
      await runner.runTests(config);
    }
    
    await runner.generateReport();
    
    if (args.includes('--cleanup')) {
      await runner.cleanup();
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Help text
function showHelp() {
  console.log(`
GearGrab E2E Test Runner

Usage:
  node run-tests.js [options]

Options:
  --suite=<name>        Test suite to run (smoke, auth, listings, rentals, payments, admin, full)
  --browser=<name>      Browser to use (chrome, firefox, edge)
  --env=<name>          Environment (local, staging, production)
  --headed              Run in headed mode (default: headless)
  --record              Record tests to Cypress Dashboard
  --parallel            Run tests in parallel (requires --record)
  --coverage            Enable code coverage
  --cross-browser       Run tests across all browsers
  --regression          Run regression test suite
  --cleanup             Clean up test artifacts after run
  --help                Show this help message

Examples:
  node run-tests.js --suite=smoke
  node run-tests.js --suite=auth --browser=firefox --headed
  node run-tests.js --cross-browser --suite=listings
  node run-tests.js --regression --coverage
  `);
}

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;

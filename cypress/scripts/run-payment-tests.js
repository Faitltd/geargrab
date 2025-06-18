#!/usr/bin/env node

/**
 * Comprehensive Payment System E2E Testing Script
 * Tests the production-ready payment system end-to-end
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Test configuration
const config = {
  baseUrl: 'http://localhost:5173',
  testTimeout: 60000,
  retries: 2,
  browser: 'chrome',
  headless: true
};

// Test suites to run
const testSuites = [
  {
    name: 'Payment Flow Tests',
    spec: 'cypress/e2e/payment-flow.cy.js',
    description: 'Tests payment system integration, authentication, and error handling'
  },
  {
    name: 'Authentication Tests',
    spec: 'cypress/e2e/authentication.cy.js',
    description: 'Tests user authentication required for payments'
  },
  {
    name: 'Integration Tests',
    spec: 'cypress/e2e/integration.cy.js',
    description: 'Tests full booking and payment integration'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSection(message) {
  log('\n' + '-'.repeat(40), 'blue');
  log(message, 'yellow');
  log('-'.repeat(40), 'blue');
}

async function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  // Check if development server is running
  try {
    const response = await fetch(config.baseUrl);
    if (response.ok) {
      log('✅ Development server is running', 'green');
    } else {
      throw new Error('Server not responding');
    }
  } catch (error) {
    log('❌ Development server is not running', 'red');
    log('Please start the development server with: npm run dev', 'yellow');
    process.exit(1);
  }
  
  // Check if Cypress is installed
  try {
    await import('cypress');
    log('✅ Cypress is installed', 'green');
  } catch (error) {
    log('❌ Cypress is not installed', 'red');
    log('Please install Cypress with: npm install cypress --save-dev', 'yellow');
    process.exit(1);
  }
  
  // Check test files exist
  for (const suite of testSuites) {
    if (fs.existsSync(suite.spec)) {
      log(`✅ Test file exists: ${suite.spec}`, 'green');
    } else {
      log(`⚠️ Test file missing: ${suite.spec}`, 'yellow');
    }
  }
}

function runCypressTest(spec, suiteName) {
  return new Promise((resolve, reject) => {
    log(`\n🧪 Running: ${suiteName}`, 'cyan');
    log(`📁 Spec: ${spec}`, 'blue');
    
    const cypressArgs = [
      'run',
      '--spec', spec,
      '--browser', config.browser,
      '--config', `baseUrl=${config.baseUrl},defaultCommandTimeout=${config.testTimeout}`,
      '--env', 'retries=' + config.retries
    ];
    
    if (config.headless) {
      cypressArgs.push('--headless');
    }
    
    const cypress = spawn('npx', ['cypress', ...cypressArgs], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    let output = '';
    let errorOutput = '';
    
    cypress.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    cypress.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });
    
    cypress.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${suiteName} - PASSED`, 'green');
        resolve({ success: true, output, suiteName });
      } else {
        log(`❌ ${suiteName} - FAILED (exit code: ${code})`, 'red');
        resolve({ success: false, output, errorOutput, suiteName, exitCode: code });
      }
    });
    
    cypress.on('error', (error) => {
      log(`❌ ${suiteName} - ERROR: ${error.message}`, 'red');
      reject({ success: false, error: error.message, suiteName });
    });
  });
}

async function runAllTests() {
  logHeader('Payment System E2E Testing');
  
  await checkPrerequisites();
  
  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  logSection('Running Test Suites');
  
  for (const suite of testSuites) {
    try {
      const result = await runCypressTest(suite.spec, suite.name);
      results.push(result);
      totalTests++;
      
      if (result.success) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      log(`❌ Failed to run ${suite.name}: ${error.message}`, 'red');
      results.push({ success: false, suiteName: suite.name, error: error.message });
      totalTests++;
      failedTests++;
    }
  }
  
  // Generate summary report
  logHeader('Test Results Summary');
  
  log(`📊 Total Test Suites: ${totalTests}`, 'blue');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, 'red');
  log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'cyan');
  
  logSection('Detailed Results');
  
  results.forEach((result, index) => {
    const suite = testSuites[index];
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    const color = result.success ? 'green' : 'red';
    
    log(`${status} - ${result.suiteName}`, color);
    if (suite) {
      log(`   Description: ${suite.description}`, 'blue');
    }
    if (!result.success && result.exitCode) {
      log(`   Exit Code: ${result.exitCode}`, 'yellow');
    }
  });
  
  // Payment system specific checks
  logSection('Payment System Health Check');
  
  try {
    // Test payment endpoint accessibility
    const response = await fetch(`${config.baseUrl}/api/payments/create-intent`);
    if (response.ok || response.status === 401) {
      log('✅ Payment API endpoint is accessible', 'green');
    } else {
      log(`⚠️ Payment API returned status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log('❌ Payment API endpoint is not accessible', 'red');
  }
  
  // Final recommendations
  logSection('Recommendations');
  
  if (failedTests === 0) {
    log('🎉 All tests passed! Payment system is ready for production.', 'green');
    log('Next steps:', 'cyan');
    log('1. Configure real Stripe API keys', 'blue');
    log('2. Test with Stripe test cards', 'blue');
    log('3. Deploy to staging environment', 'blue');
    log('4. Run tests against staging', 'blue');
    log('5. Deploy to production', 'blue');
  } else {
    log('⚠️ Some tests failed. Please review and fix issues before production deployment.', 'yellow');
    log('Common issues to check:', 'cyan');
    log('1. Stripe API keys configuration', 'blue');
    log('2. Authentication system setup', 'blue');
    log('3. Database connectivity', 'blue');
    log('4. Network connectivity', 'blue');
  }
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('Payment System E2E Testing Script', 'bright');
  log('\nUsage: node run-payment-tests.js [options]', 'cyan');
  log('\nOptions:', 'yellow');
  log('  --help, -h     Show this help message', 'blue');
  log('  --headed       Run tests in headed mode (visible browser)', 'blue');
  log('  --browser      Specify browser (chrome, firefox, edge)', 'blue');
  log('\nExamples:', 'yellow');
  log('  node run-payment-tests.js', 'blue');
  log('  node run-payment-tests.js --headed', 'blue');
  log('  node run-payment-tests.js --browser firefox', 'blue');
  process.exit(0);
}

if (args.includes('--headed')) {
  config.headless = false;
}

const browserIndex = args.indexOf('--browser');
if (browserIndex !== -1 && args[browserIndex + 1]) {
  config.browser = args[browserIndex + 1];
}

// Run the tests
runAllTests().catch((error) => {
  log(`❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});

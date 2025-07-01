#!/usr/bin/env node

/**
 * Comprehensive Test Runner for GearGrab
 * Runs all tests in sequence and generates reports
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'https://geargrab.co',
  timeout: 30000,
  retries: 2,
  parallel: false // Set to true for faster execution
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Core Functionality',
    tests: [
      'cypress/e2e/homepage.cy.js',
      'cypress/e2e/browse.cy.js',
      'cypress/e2e/listing-details.cy.js',
      'cypress/e2e/location-search.cy.ts'
    ],
    critical: true
  },
  {
    name: 'Authentication & User Management',
    tests: [
      'cypress/e2e/authentication.cy.js',
      'cypress/e2e/social-auth-verification.cy.js',
      'cypress/e2e/dashboard.cy.js'
    ],
    critical: true
  },
  {
    name: 'Listing Management',
    tests: [
      'cypress/e2e/list-gear.cy.js'
    ],
    critical: true
  },
  {
    name: 'Payment & Booking',
    tests: [
      'cypress/e2e/payment-flow.cy.js'
    ],
    critical: true
  },
  {
    name: 'Mobile & Responsive',
    tests: [
      'cypress/e2e/mobile-functionality.cy.js',
      'cypress/e2e/responsive.cy.js'
    ],
    critical: false
  },
  {
    name: 'Integration Tests',
    tests: [
      'cypress/e2e/integration.cy.js'
    ],
    critical: false
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSubsection(title) {
  console.log('\n' + '-'.repeat(40));
  log(title, 'yellow');
  console.log('-'.repeat(40));
}

async function runCommand(command, options = {}) {
  try {
    log(`Running: ${command}`, 'blue');
    const result = execSync(command, {
      stdio: 'inherit',
      timeout: TEST_CONFIG.timeout,
      ...options
    });
    return { success: true, result };
  } catch (error) {
    log(`Command failed: ${error.message}`, 'red');
    return { success: false, error };
  }
}

async function runTestSuite(suite) {
  logSubsection(`Running ${suite.name} Tests`);
  
  const results = {
    name: suite.name,
    critical: suite.critical,
    tests: [],
    passed: 0,
    failed: 0,
    duration: 0
  };
  
  const startTime = Date.now();
  
  for (const testFile of suite.tests) {
    log(`\n📝 Running: ${path.basename(testFile)}`, 'bright');
    
    const testStartTime = Date.now();
    const command = `npx cypress run --spec "${testFile}" --config baseUrl=${TEST_CONFIG.baseUrl}`;
    const result = await runCommand(command);
    const testDuration = Date.now() - testStartTime;
    
    const testResult = {
      file: testFile,
      name: path.basename(testFile),
      success: result.success,
      duration: testDuration
    };
    
    results.tests.push(testResult);
    
    if (result.success) {
      results.passed++;
      log(`✅ PASSED: ${testResult.name} (${testDuration}ms)`, 'green');
    } else {
      results.failed++;
      log(`❌ FAILED: ${testResult.name} (${testDuration}ms)`, 'red');
      
      // If this is a critical test and it failed, we might want to stop
      if (suite.critical && process.env.STOP_ON_CRITICAL_FAILURE === 'true') {
        log('Critical test failed. Stopping execution.', 'red');
        break;
      }
    }
  }
  
  results.duration = Date.now() - startTime;
  
  // Suite summary
  const passRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  log(`\n📊 Suite Summary: ${results.passed}/${results.tests.length} passed (${passRate}%)`, 
      results.failed === 0 ? 'green' : 'yellow');
  
  return results;
}

async function runUnitTests() {
  logSubsection('Running Unit Tests');
  
  // Check if Jest is configured
  if (fs.existsSync('jest.config.js') || fs.existsSync('package.json')) {
    const result = await runCommand('npm test -- --passWithNoTests');
    return result.success;
  } else {
    log('No unit tests configured', 'yellow');
    return true;
  }
}

async function runLinting() {
  logSubsection('Running Code Quality Checks');
  
  const results = [];
  
  // ESLint
  if (fs.existsSync('.eslintrc.js') || fs.existsSync('.eslintrc.json')) {
    log('Running ESLint...', 'blue');
    const result = await runCommand('npx eslint src --ext .js,.ts,.svelte --max-warnings 0');
    results.push({ name: 'ESLint', success: result.success });
  }
  
  // Prettier
  if (fs.existsSync('.prettierrc')) {
    log('Checking code formatting...', 'blue');
    const result = await runCommand('npx prettier --check src');
    results.push({ name: 'Prettier', success: result.success });
  }
  
  // TypeScript check
  if (fs.existsSync('tsconfig.json')) {
    log('Running TypeScript check...', 'blue');
    const result = await runCommand('npx tsc --noEmit');
    results.push({ name: 'TypeScript', success: result.success });
  }
  
  return results;
}

function generateReport(testResults, unitTestResult, lintingResults) {
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: TEST_CONFIG.baseUrl,
    summary: {
      totalSuites: testResults.length,
      totalTests: testResults.reduce((sum, suite) => sum + suite.tests.length, 0),
      totalPassed: testResults.reduce((sum, suite) => sum + suite.passed, 0),
      totalFailed: testResults.reduce((sum, suite) => sum + suite.failed, 0),
      totalDuration: testResults.reduce((sum, suite) => sum + suite.duration, 0),
      unitTestsPassed: unitTestResult,
      lintingResults
    },
    suites: testResults
  };
  
  // Calculate overall pass rate
  const passRate = ((report.summary.totalPassed / report.summary.totalTests) * 100).toFixed(1);
  report.summary.passRate = passRate;
  
  // Save detailed report
  const reportPath = 'cypress/reports/comprehensive-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown summary
  const markdownReport = generateMarkdownReport(report);
  fs.writeFileSync('cypress/reports/test-summary.md', markdownReport);
  
  return report;
}

function generateMarkdownReport(report) {
  const { summary, suites } = report;
  
  return `# GearGrab Test Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Base URL:** ${report.baseUrl}  
**Overall Pass Rate:** ${summary.passRate}%

## Summary

- **Total Test Suites:** ${summary.totalSuites}
- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.totalPassed} ✅
- **Failed:** ${summary.totalFailed} ❌
- **Duration:** ${(summary.totalDuration / 1000).toFixed(1)}s
- **Unit Tests:** ${summary.unitTestsPassed ? 'PASSED ✅' : 'FAILED ❌'}

## Code Quality

${summary.lintingResults.map(result => 
  `- **${result.name}:** ${result.success ? 'PASSED ✅' : 'FAILED ❌'}`
).join('\n')}

## Test Suites

${suites.map(suite => `
### ${suite.name} ${suite.critical ? '(Critical)' : ''}

- **Pass Rate:** ${((suite.passed / suite.tests.length) * 100).toFixed(1)}%
- **Duration:** ${(suite.duration / 1000).toFixed(1)}s

${suite.tests.map(test => 
  `- ${test.success ? '✅' : '❌'} ${test.name} (${test.duration}ms)`
).join('\n')}
`).join('\n')}

## Recommendations

${summary.totalFailed > 0 ? `
⚠️ **${summary.totalFailed} tests failed.** Please review and fix failing tests before deployment.
` : ''}

${summary.passRate < 95 ? `
⚠️ **Pass rate is below 95%.** Consider improving test coverage and reliability.
` : ''}

${summary.lintingResults.some(r => !r.success) ? `
⚠️ **Code quality issues detected.** Please fix linting errors before deployment.
` : ''}

${summary.passRate >= 95 && summary.totalFailed === 0 && summary.lintingResults.every(r => r.success) ? `
🎉 **All tests passed!** The application is ready for deployment.
` : ''}
`;
}

async function main() {
  logSection('🧪 GearGrab Comprehensive Test Suite');
  
  log(`Base URL: ${TEST_CONFIG.baseUrl}`, 'blue');
  log(`Timeout: ${TEST_CONFIG.timeout}ms`, 'blue');
  log(`Retries: ${TEST_CONFIG.retries}`, 'blue');
  
  const startTime = Date.now();
  const testResults = [];
  
  // Run test suites
  for (const suite of TEST_SUITES) {
    const result = await runTestSuite(suite);
    testResults.push(result);
    
    // Stop if critical tests failed and configured to do so
    if (suite.critical && result.failed > 0 && process.env.STOP_ON_CRITICAL_FAILURE === 'true') {
      log('\n🛑 Critical tests failed. Stopping execution.', 'red');
      break;
    }
  }
  
  // Run unit tests
  const unitTestResult = await runUnitTests();
  
  // Run linting
  const lintingResults = await runLinting();
  
  // Generate report
  const report = generateReport(testResults, unitTestResult, lintingResults);
  
  // Final summary
  logSection('📊 Final Test Results');
  
  const totalDuration = Date.now() - startTime;
  log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`, 'blue');
  log(`Overall Pass Rate: ${report.summary.passRate}%`, 
      report.summary.passRate >= 95 ? 'green' : 'yellow');
  
  if (report.summary.totalFailed === 0 && unitTestResult && lintingResults.every(r => r.success)) {
    log('\n🎉 ALL TESTS PASSED! Ready for deployment.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Please review the report.', 'red');
    log(`Report saved to: cypress/reports/test-summary.md`, 'blue');
    process.exit(1);
  }
}

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

export { runTestSuite, generateReport };

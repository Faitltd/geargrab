#!/usr/bin/env node

/**
 * Alternating Test Runner for GearGrab
 * 
 * This script alternates between Cypress E2E tests and Jest unit tests,
 * automatically correcting issues found between test runs.
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration
const config = {
  maxCycles: 5,
  baseUrl: 'https://geargrab.co',
  retryAttempts: 2,
  delayBetweenTests: 2000, // 2 seconds
  autoFix: true,
  generateReport: true
};

// Test suites configuration
const testSuites = {
  jest: {
    unit: ['tests/unit/**/*.test.ts'],
    integration: ['tests/integration/**/*.test.ts'],
    auth: ['tests/auth/**/*.test.ts']
  },
  cypress: {
    core: [
      'cypress/e2e/homepage.cy.js',
      'cypress/e2e/browse.cy.js',
      'cypress/e2e/listing-details.cy.js',
      'cypress/e2e/list-gear.cy.js'
    ],
    auth: [
      'cypress/e2e/authentication.cy.js',
      'cypress/e2e/auth/**/*.cy.{js,ts}'
    ],
    dashboard: ['cypress/e2e/dashboard.cy.js'],
    payment: ['cypress/e2e/payment-flow.cy.js'],
    mobile: ['cypress/e2e/mobile-functionality.cy.{js,ts}'],
    integration: ['cypress/e2e/integration.cy.js']
  }
};

// Test execution order
const testSequence = [
  { type: 'jest', suite: 'unit', name: 'Unit Tests' },
  { type: 'cypress', suite: 'core', name: 'Core E2E Tests' },
  { type: 'jest', suite: 'integration', name: 'Integration Tests' },
  { type: 'cypress', suite: 'auth', name: 'Authentication E2E Tests' },
  { type: 'jest', suite: 'auth', name: 'Auth Unit Tests' },
  { type: 'cypress', suite: 'dashboard', name: 'Dashboard E2E Tests' },
  { type: 'cypress', suite: 'payment', name: 'Payment E2E Tests' },
  { type: 'cypress', suite: 'mobile', name: 'Mobile E2E Tests' },
  { type: 'cypress', suite: 'integration', name: 'Integration E2E Tests' }
];

// Logging utilities
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
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

// Test execution functions
async function runJestTests(suite) {
  return new Promise((resolve) => {
    log(`🧪 Running Jest ${suite} tests...`, 'blue');
    
    const testPattern = testSuites.jest[suite].join('|');
    const jestArgs = [
      '--testPathPatterns', `(${testPattern})`,
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    ];

    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'pipe',
      cwd: rootDir
    });

    let output = '';
    let errorOutput = '';

    jest.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    jest.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    jest.on('close', (code) => {
      const success = code === 0;
      log(`Jest ${suite} tests ${success ? 'PASSED' : 'FAILED'}`, success ? 'green' : 'red');
      
      resolve({
        success,
        output,
        errorOutput,
        type: 'jest',
        suite,
        exitCode: code
      });
    });
  });
}

async function runCypressTests(suite) {
  return new Promise((resolve) => {
    log(`🌲 Running Cypress ${suite} tests...`, 'cyan');
    
    const specs = testSuites.cypress[suite];
    const cypressArgs = [
      'run',
      '--spec', specs.join(','),
      '--browser', 'chrome',
      '--config', `baseUrl=${config.baseUrl}`,
      '--reporter', 'spec'
    ];

    const cypress = spawn('npx', ['cypress', ...cypressArgs], {
      stdio: 'pipe',
      cwd: rootDir
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
      const success = code === 0;
      log(`Cypress ${suite} tests ${success ? 'PASSED' : 'FAILED'}`, success ? 'green' : 'red');
      
      resolve({
        success,
        output,
        errorOutput,
        type: 'cypress',
        suite,
        exitCode: code
      });
    });
  });
}

// Auto-fix functionality
async function attemptAutoFix(testResult) {
  if (!config.autoFix || testResult.success) {
    return false;
  }

  log(`🔧 Attempting auto-fix for ${testResult.type} ${testResult.suite} failures...`, 'yellow');
  
  // Common fixes based on error patterns
  const errorPatterns = [
    {
      pattern: /ECONNREFUSED.*localhost/,
      fix: 'Server connection issue - checking if server is running',
      action: async () => {
        log('Checking server status...', 'yellow');
        // Could add server health check here
        return false;
      }
    },
    {
      pattern: /Timed out waiting for/,
      fix: 'Timeout issue - increasing wait times',
      action: async () => {
        log('Timeout detected - this may require manual intervention', 'yellow');
        return false;
      }
    },
    {
      pattern: /Element not found/,
      fix: 'Element selector issue - may need selector updates',
      action: async () => {
        log('Element selector issue detected', 'yellow');
        return false;
      }
    }
  ];

  for (const pattern of errorPatterns) {
    if (pattern.pattern.test(testResult.errorOutput)) {
      log(`Identified issue: ${pattern.fix}`, 'yellow');
      const fixed = await pattern.action();
      if (fixed) {
        log('Auto-fix applied successfully', 'green');
        return true;
      }
    }
  }

  return false;
}

// Main test runner
async function runAlternatingTests() {
  logSection('🚀 Starting Alternating Test Suite');
  log(`Configuration: ${config.maxCycles} cycles, Base URL: ${config.baseUrl}`, 'blue');
  
  const results = [];
  let cycle = 1;
  
  while (cycle <= config.maxCycles) {
    logSection(`📋 Test Cycle ${cycle}/${config.maxCycles}`);
    
    let cycleResults = [];
    let allTestsPassed = true;
    
    for (const test of testSequence) {
      log(`\n▶️  Executing: ${test.name}`, 'magenta');
      
      let testResult;
      if (test.type === 'jest') {
        testResult = await runJestTests(test.suite);
      } else {
        testResult = await runCypressTests(test.suite);
      }
      
      cycleResults.push(testResult);
      
      if (!testResult.success) {
        allTestsPassed = false;
        
        // Attempt auto-fix
        const fixed = await attemptAutoFix(testResult);
        if (fixed) {
          log('Retrying after auto-fix...', 'yellow');
          // Retry the test
          if (test.type === 'jest') {
            testResult = await runJestTests(test.suite);
          } else {
            testResult = await runCypressTests(test.suite);
          }
          cycleResults[cycleResults.length - 1] = testResult;
          allTestsPassed = testResult.success;
        }
      }
      
      // Delay between tests
      if (config.delayBetweenTests > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenTests));
      }
    }
    
    results.push({
      cycle,
      results: cycleResults,
      allPassed: allTestsPassed
    });
    
    // Summary for this cycle
    const passed = cycleResults.filter(r => r.success).length;
    const total = cycleResults.length;
    log(`\n📊 Cycle ${cycle} Summary: ${passed}/${total} test suites passed`, 
        allTestsPassed ? 'green' : 'red');
    
    if (allTestsPassed) {
      log('🎉 All tests passed! Stopping early.', 'green');
      break;
    }
    
    cycle++;
  }
  
  // Generate final report
  generateFinalReport(results);
}

function generateFinalReport(results) {
  logSection('📈 Final Test Report');
  
  const totalCycles = results.length;
  const successfulCycles = results.filter(r => r.allPassed).length;
  
  log(`Total Cycles Run: ${totalCycles}`, 'blue');
  log(`Successful Cycles: ${successfulCycles}`, successfulCycles > 0 ? 'green' : 'red');
  log(`Success Rate: ${((successfulCycles / totalCycles) * 100).toFixed(1)}%`, 'blue');
  
  // Detailed breakdown
  console.log('\n📋 Detailed Results:');
  results.forEach((cycleResult, index) => {
    console.log(`\nCycle ${index + 1}:`);
    cycleResult.results.forEach(test => {
      const status = test.success ? '✅' : '❌';
      console.log(`  ${status} ${test.type.toUpperCase()} ${test.suite}: ${test.success ? 'PASSED' : 'FAILED'}`);
    });
  });
  
  // Save report to file if configured
  if (config.generateReport) {
    const reportPath = path.join(rootDir, 'test-reports', `alternating-test-report-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    log(`📄 Report saved to: ${reportPath}`, 'blue');
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runAlternatingTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

export { runAlternatingTests, config, testSuites };

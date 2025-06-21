#!/usr/bin/env node

/**
 * Authentication Test Runner Script
 * 
 * This script provides different modes for running both Jest unit tests
 * and Cypress e2e tests for the authentication module with proper setup
 * and reporting.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes for console output
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
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Check if required dependencies are installed
 */
function checkDependencies() {
  const requiredDeps = {
    jest: 'Jest testing framework',
    cypress: 'Cypress e2e testing framework',
    bcrypt: 'Password hashing library',
    jsonwebtoken: 'JWT token library'
  };

  let allInstalled = true;

  for (const [dep, description] of Object.entries(requiredDeps)) {
    try {
      require.resolve(dep);
      logSuccess(`${description} is installed`);
    } catch (error) {
      logError(`${description} is missing`);
      allInstalled = false;
    }
  }

  return allInstalled;
}

/**
 * Run Jest unit tests for AuthService
 */
function runJestTests(options = {}) {
  const {
    coverage = false,
    watch = false,
    verbose = true,
    testPattern = 'AuthService'
  } = options;

  let command = 'npx jest';
  
  if (testPattern) {
    command += ` --testPathPattern="${testPattern}"`;
  }
  
  if (coverage) {
    command += ' --coverage';
  }
  
  if (watch) {
    command += ' --watch';
  }
  
  if (verbose) {
    command += ' --verbose';
  }

  logInfo(`Running Jest tests: ${command}`);
  
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: projectRoot
    });
    logSuccess('Jest tests completed successfully');
    return true;
  } catch (error) {
    logError('Jest tests failed');
    return false;
  }
}

/**
 * Run Cypress e2e tests
 */
function runCypressTests(options = {}) {
  const {
    headless = true,
    browser = 'chrome',
    spec = 'cypress/e2e/auth/**/*.cy.ts'
  } = options;

  let command = headless ? 'npx cypress run' : 'npx cypress open';
  
  if (headless) {
    command += ` --browser ${browser}`;
    command += ` --spec "${spec}"`;
  }

  logInfo(`Running Cypress tests: ${command}`);
  
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: projectRoot
    });
    logSuccess('Cypress tests completed successfully');
    return true;
  } catch (error) {
    logError('Cypress tests failed');
    return false;
  }
}

/**
 * Start development server for e2e tests
 */
function startDevServer() {
  logInfo('Starting development server for e2e tests...');
  
  try {
    // Start server in background
    const serverProcess = execSync('npm run dev &', {
      stdio: 'pipe',
      cwd: projectRoot
    });
    
    // Wait for server to be ready
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        execSync('curl -f http://localhost:5173 > /dev/null 2>&1');
        logSuccess('Development server is ready');
        return true;
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          process.stdout.write('.');
          execSync('sleep 1');
        }
      }
    }
    
    logError('Development server failed to start');
    return false;
  } catch (error) {
    logError(`Failed to start development server: ${error.message}`);
    return false;
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  logHeader('Generating Comprehensive Test Report');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    jest: {
      coverage: null,
      results: null
    },
    cypress: {
      results: null,
      videos: [],
      screenshots: []
    }
  };

  // Run Jest with coverage
  logInfo('Running Jest tests with coverage...');
  const jestSuccess = runJestTests({ coverage: true, verbose: false });
  
  if (jestSuccess) {
    // Read Jest coverage report
    const coveragePath = path.join(projectRoot, 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      reportData.jest.coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    }
  }

  // Start dev server for Cypress tests
  if (startDevServer()) {
    // Run Cypress tests
    logInfo('Running Cypress e2e tests...');
    const cypressSuccess = runCypressTests({ headless: true });
    
    if (cypressSuccess) {
      // Collect Cypress artifacts
      const cypressResultsPath = path.join(projectRoot, 'cypress', 'results');
      if (fs.existsSync(cypressResultsPath)) {
        const files = fs.readdirSync(cypressResultsPath);
        reportData.cypress.results = files.filter(f => f.endsWith('.json'));
      }
      
      const videosPath = path.join(projectRoot, 'cypress', 'videos');
      if (fs.existsSync(videosPath)) {
        reportData.cypress.videos = fs.readdirSync(videosPath);
      }
    }
    
    // Stop dev server
    try {
      execSync('pkill -f "npm run dev"');
    } catch (error) {
      // Ignore errors when stopping server
    }
  }

  // Generate HTML report
  const reportHtml = generateHtmlReport(reportData);
  const reportPath = path.join(projectRoot, 'test-reports', 'auth-test-report.html');
  
  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, reportHtml);
  logSuccess(`Test report generated: ${reportPath}`);
  
  return reportPath;
}

/**
 * Generate HTML test report
 */
function generateHtmlReport(data) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .coverage-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; }
        .coverage-fill { height: 100%; background: #28a745; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Authentication Test Report</h1>
        <p>Generated: ${data.timestamp}</p>
    </div>
    
    <div class="section">
        <h2>📊 Jest Unit Tests</h2>
        ${data.jest.coverage ? `
            <h3>Coverage Summary</h3>
            <table>
                <tr><th>Metric</th><th>Percentage</th><th>Covered/Total</th></tr>
                <tr>
                    <td>Statements</td>
                    <td>${data.jest.coverage.total.statements.pct}%</td>
                    <td>${data.jest.coverage.total.statements.covered}/${data.jest.coverage.total.statements.total}</td>
                </tr>
                <tr>
                    <td>Branches</td>
                    <td>${data.jest.coverage.total.branches.pct}%</td>
                    <td>${data.jest.coverage.total.branches.covered}/${data.jest.coverage.total.branches.total}</td>
                </tr>
                <tr>
                    <td>Functions</td>
                    <td>${data.jest.coverage.total.functions.pct}%</td>
                    <td>${data.jest.coverage.total.functions.covered}/${data.jest.coverage.total.functions.total}</td>
                </tr>
                <tr>
                    <td>Lines</td>
                    <td>${data.jest.coverage.total.lines.pct}%</td>
                    <td>${data.jest.coverage.total.lines.covered}/${data.jest.coverage.total.lines.total}</td>
                </tr>
            </table>
        ` : '<p class="warning">No coverage data available</p>'}
    </div>
    
    <div class="section">
        <h2>🌐 Cypress E2E Tests</h2>
        ${data.cypress.results ? `
            <p class="success">✅ E2E tests completed</p>
            <p>Videos: ${data.cypress.videos.length}</p>
        ` : '<p class="error">❌ E2E tests failed or not run</p>'}
    </div>
    
    <div class="section">
        <h2>📋 Test Summary</h2>
        <ul>
            <li><strong>Jest Unit Tests:</strong> ${data.jest.coverage ? '✅ Passed' : '❌ Failed'}</li>
            <li><strong>Cypress E2E Tests:</strong> ${data.cypress.results ? '✅ Passed' : '❌ Failed'}</li>
            <li><strong>Overall Status:</strong> ${data.jest.coverage && data.cypress.results ? '✅ All tests passed' : '❌ Some tests failed'}</li>
        </ul>
    </div>
</body>
</html>`;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  logHeader('Authentication Test Runner');
  
  try {
    switch (command) {
      case 'check':
        logHeader('Checking Dependencies');
        const depsOk = checkDependencies();
        if (!depsOk) {
          logError('Some dependencies are missing. Run: npm install');
          process.exit(1);
        }
        logSuccess('All dependencies are installed');
        break;
        
      case 'jest':
        logHeader('Running Jest Unit Tests');
        const jestOptions = {
          coverage: args.includes('--coverage'),
          watch: args.includes('--watch'),
          verbose: !args.includes('--quiet')
        };
        runJestTests(jestOptions);
        break;
        
      case 'cypress':
        logHeader('Running Cypress E2E Tests');
        const cypressOptions = {
          headless: !args.includes('--headed'),
          browser: args.find(arg => arg.startsWith('--browser='))?.split('=')[1] || 'chrome'
        };
        
        if (startDevServer()) {
          runCypressTests(cypressOptions);
        }
        break;
        
      case 'all':
        logHeader('Running All Authentication Tests');
        const jestSuccess = runJestTests({ coverage: true });
        let cypressSuccess = false;
        
        if (startDevServer()) {
          cypressSuccess = runCypressTests({ headless: true });
        }
        
        if (jestSuccess && cypressSuccess) {
          logSuccess('All tests passed!');
        } else {
          logError('Some tests failed');
          process.exit(1);
        }
        break;
        
      case 'report':
        generateTestReport();
        break;
        
      case 'help':
      default:
        logHeader('Available Commands');
        log('  check       - Check if all dependencies are installed', 'cyan');
        log('  jest        - Run Jest unit tests only', 'cyan');
        log('    --coverage  - Include coverage report', 'magenta');
        log('    --watch     - Run in watch mode', 'magenta');
        log('    --quiet     - Reduce output verbosity', 'magenta');
        log('  cypress     - Run Cypress e2e tests only', 'cyan');
        log('    --headed    - Run with browser UI', 'magenta');
        log('    --browser=X - Specify browser (chrome, firefox, edge)', 'magenta');
        log('  all         - Run both Jest and Cypress tests', 'cyan');
        log('  report      - Generate comprehensive test report', 'cyan');
        log('  help        - Show this help message', 'cyan');
        log('\nExamples:', 'yellow');
        log('  node scripts/run-auth-tests.js jest --coverage', 'magenta');
        log('  node scripts/run-auth-tests.js cypress --headed', 'magenta');
        log('  node scripts/run-auth-tests.js all', 'magenta');
        break;
    }
  } catch (error) {
    logError(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();

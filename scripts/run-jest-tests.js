#!/usr/bin/env node

/**
 * Jest Test Runner Script
 * 
 * This script provides different modes for running Jest tests
 * with proper setup and reporting for the UserService test suite.
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
 * Check if Jest is installed
 */
function checkJestInstallation() {
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Install Jest dependencies if not present
 */
function installJestDependencies() {
  logInfo('Installing Jest dependencies...');
  
  const dependencies = [
    'jest@^29.7.0',
    '@types/jest@^29.5.8',
    'ts-jest@^29.1.1',
    'jest-environment-node@^29.7.0',
    '@types/node@^20.10.0',
    '@types/bcrypt@^5.0.2',
    'ts-node@^10.9.1'
  ];

  try {
    execSync(`npm install --save-dev ${dependencies.join(' ')}`, {
      stdio: 'inherit',
      cwd: projectRoot
    });
    logSuccess('Jest dependencies installed successfully');
  } catch (error) {
    logError('Failed to install Jest dependencies');
    throw error;
  }
}

/**
 * Run Jest tests with specified options
 */
function runJestTests(options = {}) {
  const {
    testPattern = '',
    coverage = false,
    watch = false,
    verbose = true,
    ci = false,
    updateSnapshots = false
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
  
  if (ci) {
    command += ' --ci --watchAll=false';
  }
  
  if (updateSnapshots) {
    command += ' --updateSnapshot';
  }

  logInfo(`Running: ${command}`);
  
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: projectRoot
    });
    logSuccess('Tests completed successfully');
  } catch (error) {
    logError('Tests failed');
    throw error;
  }
}

/**
 * Generate test coverage report
 */
function generateCoverageReport() {
  logHeader('Generating Coverage Report');
  
  runJestTests({ coverage: true, ci: true });
  
  const coverageDir = path.join(projectRoot, 'coverage');
  const htmlReport = path.join(coverageDir, 'lcov-report', 'index.html');
  
  if (fs.existsSync(htmlReport)) {
    logSuccess(`Coverage report generated: ${htmlReport}`);
    logInfo('Open the HTML file in your browser to view detailed coverage');
  } else {
    logWarning('Coverage report not found');
  }
}

/**
 * Run specific test suites
 */
function runTestSuite(suiteName) {
  logHeader(`Running ${suiteName} Test Suite`);
  
  const testPatterns = {
    unit: 'UserService\\.test\\.ts',
    integration: 'UserService\\.integration\\.test\\.ts',
    all: 'UserService.*\\.test\\.ts',
    services: 'services/.*\\.test\\.ts'
  };
  
  const pattern = testPatterns[suiteName];
  if (!pattern) {
    logError(`Unknown test suite: ${suiteName}`);
    logInfo('Available suites: unit, integration, all, services');
    return;
  }
  
  runJestTests({ testPattern: pattern, verbose: true });
}

/**
 * Run tests in watch mode for development
 */
function runWatchMode() {
  logHeader('Running Tests in Watch Mode');
  logInfo('Tests will re-run automatically when files change');
  logInfo('Press "q" to quit, "a" to run all tests');
  
  runJestTests({ watch: true });
}

/**
 * Validate test environment
 */
function validateTestEnvironment() {
  logHeader('Validating Test Environment');
  
  // Check if required files exist
  const requiredFiles = [
    'jest.config.js',
    'tests/setup.ts',
    'src/lib/services/UserService.ts',
    'src/lib/services/__tests__/UserService.test.ts'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    logError('Some required files are missing');
    return false;
  }
  
  // Check Jest installation
  if (!checkJestInstallation()) {
    logWarning('Jest is not installed');
    return false;
  }
  
  logSuccess('Test environment is valid');
  return true;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  logHeader('Jest Test Runner for UserService');
  
  try {
    switch (command) {
      case 'install':
        installJestDependencies();
        break;
        
      case 'validate':
        validateTestEnvironment();
        break;
        
      case 'unit':
        runTestSuite('unit');
        break;
        
      case 'integration':
        runTestSuite('integration');
        break;
        
      case 'all':
        runTestSuite('all');
        break;
        
      case 'services':
        runTestSuite('services');
        break;
        
      case 'coverage':
        generateCoverageReport();
        break;
        
      case 'watch':
        runWatchMode();
        break;
        
      case 'ci':
        logHeader('Running Tests in CI Mode');
        runJestTests({ coverage: true, ci: true });
        break;
        
      case 'help':
      default:
        logHeader('Available Commands');
        log('  install     - Install Jest dependencies', 'cyan');
        log('  validate    - Validate test environment', 'cyan');
        log('  unit        - Run unit tests only', 'cyan');
        log('  integration - Run integration tests only', 'cyan');
        log('  all         - Run all UserService tests', 'cyan');
        log('  services    - Run all service tests', 'cyan');
        log('  coverage    - Generate coverage report', 'cyan');
        log('  watch       - Run tests in watch mode', 'cyan');
        log('  ci          - Run tests in CI mode', 'cyan');
        log('  help        - Show this help message', 'cyan');
        log('\nExamples:', 'yellow');
        log('  node scripts/run-jest-tests.js unit', 'magenta');
        log('  node scripts/run-jest-tests.js coverage', 'magenta');
        log('  node scripts/run-jest-tests.js watch', 'magenta');
        break;
    }
  } catch (error) {
    logError(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();

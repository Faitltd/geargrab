#!/usr/bin/env node

/**
 * Setup script for GearGrab E2E tests
 * Validates environment and prepares for testing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
  timeout: 30000 // 30 seconds timeout for server check
};

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

function checkServerRunning(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function waitForServer(url, maxAttempts = 6) {
  log(`Checking if server is running at ${url}...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isRunning = await checkServerRunning(url);

    if (isRunning) {
      log(`✅ Server is running at ${url}`, 'success');
      return true;
    }

    if (attempt < maxAttempts) {
      log(`Attempt ${attempt}/${maxAttempts} failed. Retrying in 5 seconds...`, 'warning');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  return false;
}

function checkDependencies() {
  log('Checking dependencies...');

  try {
    // Check if Cypress is installed
    execSync('npx cypress version', { stdio: 'pipe' });
    log('✅ Cypress is installed', 'success');
  } catch (error) {
    log('❌ Cypress is not installed. Run: npm install cypress --save-dev', 'error');
    return false;
  }

  // Check if node_modules exists
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    log('❌ node_modules not found. Run: npm install', 'error');
    return false;
  }

  log('✅ Dependencies are installed', 'success');
  return true;
}

function checkTestFiles() {
  log('Checking test files...');

  const testDir = path.join(__dirname, '../e2e');
  if (!fs.existsSync(testDir)) {
    log('❌ Test directory not found', 'error');
    return false;
  }

  const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.cy.js'));
  if (testFiles.length === 0) {
    log('❌ No test files found', 'error');
    return false;
  }

  log(`✅ Found ${testFiles.length} test files`, 'success');
  return true;
}

function createDirectories() {
  log('Creating necessary directories...');

  const dirs = [
    path.join(__dirname, '../reports'),
    path.join(__dirname, '../screenshots'),
    path.join(__dirname, '../videos'),
    path.join(__dirname, '../downloads')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`);
    }
  });

  log('✅ Directories ready', 'success');
}

function validateCypressConfig() {
  log('Validating Cypress configuration...');

  const configPath = path.join(process.cwd(), 'cypress.config.js');
  if (!fs.existsSync(configPath)) {
    log('❌ cypress.config.js not found', 'error');
    return false;
  }

  try {
    // For ES modules, we'll just check if the file exists and has basic structure
    const configContent = fs.readFileSync(configPath, 'utf8');
    if (!configContent.includes('e2e')) {
      log('❌ e2e configuration not found in cypress.config.js', 'error');
      return false;
    }

    log('✅ Cypress configuration is valid', 'success');
    return true;
  } catch (error) {
    log(`❌ Error reading cypress.config.js: ${error.message}`, 'error');
    return false;
  }
}

function showEnvironmentInfo() {
  log('Environment Information:', 'info');
  log(`Node.js version: ${process.version}`);
  log(`Platform: ${process.platform}`);
  log(`Base URL: ${config.baseUrl}`);
  log(`Working directory: ${process.cwd()}`);

  try {
    const cypressVersion = execSync('npx cypress version --component package', { encoding: 'utf8' }).trim();
    log(`Cypress version: ${cypressVersion}`);
  } catch (error) {
    log('Could not determine Cypress version');
  }
}

async function main() {
  log('🚀 Setting up GearGrab E2E tests...', 'info');

  showEnvironmentInfo();

  // Check dependencies
  if (!checkDependencies()) {
    process.exit(1);
  }

  // Validate Cypress config
  if (!validateCypressConfig()) {
    process.exit(1);
  }

  // Check test files
  if (!checkTestFiles()) {
    process.exit(1);
  }

  // Create directories
  createDirectories();

  // Check if server is running
  const serverRunning = await waitForServer(config.baseUrl);
  if (!serverRunning) {
    log('❌ Server is not running. Please start the application with: npm run dev', 'error');
    log('The application should be accessible at: ' + config.baseUrl, 'info');
    process.exit(1);
  }

  log('🎉 Setup complete! Ready to run tests.', 'success');
  log('');
  log('Available commands:', 'info');
  log('  npm run test:smoke      - Quick smoke tests');
  log('  npm run test:core       - Core functionality tests');
  log('  npm run test:all        - All tests');
  log('  npm run cypress:open    - Interactive test runner');
  log('');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

export {
  checkServerRunning,
  waitForServer,
  checkDependencies,
  validateCypressConfig
};

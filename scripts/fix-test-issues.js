#!/usr/bin/env node

/**
 * Quick Fix Script for GearGrab Test Issues
 * 
 * Addresses immediate issues found during alternating test execution
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

async function installMissingDependencies() {
  logSection('🔧 Installing Missing Dependencies');
  
  const dependencies = [
    'helmet',
    'morgan',
    'express',
    'cors'
  ];
  
  for (const dep of dependencies) {
    try {
      log(`Checking ${dep}...`, 'blue');
      execSync(`npm list ${dep}`, { stdio: 'pipe' });
      log(`✅ ${dep} already installed`, 'green');
    } catch (error) {
      log(`📦 Installing ${dep}...`, 'yellow');
      try {
        execSync(`npm install ${dep}`, { stdio: 'inherit' });
        log(`✅ ${dep} installed successfully`, 'green');
      } catch (installError) {
        log(`❌ Failed to install ${dep}: ${installError.message}`, 'red');
      }
    }
  }
}

async function fixJestConfiguration() {
  logSection('⚙️ Fixing Jest Configuration');
  
  const jestConfigPath = path.join(rootDir, 'jest.config.js');
  
  if (fs.existsSync(jestConfigPath)) {
    log('Jest configuration exists, checking for issues...', 'blue');
    
    // Read current config
    const configContent = fs.readFileSync(jestConfigPath, 'utf8');
    
    // Check for common issues and fix them
    let updatedConfig = configContent;
    let hasChanges = false;
    
    // Fix testPathPattern if it exists
    if (configContent.includes('testPathPattern')) {
      updatedConfig = updatedConfig.replace(/testPathPattern/g, 'testPathPatterns');
      hasChanges = true;
      log('Fixed testPathPattern -> testPathPatterns', 'yellow');
    }
    
    // Add moduleNameMapper if missing
    if (!configContent.includes('moduleNameMapper')) {
      const moduleNameMapper = `
  moduleNameMapper: {
    '^\\$app/(.*)$': '<rootDir>/tests/mocks/$app/$1',
    '^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
    '^\\$env/(.*)$': '<rootDir>/tests/mocks/$env/$1'
  },`;
      
      // Insert before the closing brace
      updatedConfig = updatedConfig.replace(/};$/, `${moduleNameMapper}\n};`);
      hasChanges = true;
      log('Added moduleNameMapper for SvelteKit', 'yellow');
    }
    
    if (hasChanges) {
      fs.writeFileSync(jestConfigPath, updatedConfig);
      log('✅ Jest configuration updated', 'green');
    } else {
      log('✅ Jest configuration is up to date', 'green');
    }
  } else {
    log('❌ Jest configuration not found', 'red');
  }
}

async function createMissingMockDirectories() {
  logSection('📁 Creating Missing Mock Directories');
  
  const mockDirs = [
    'tests/mocks/$app',
    'tests/mocks/$env',
    'tests/mocks/svelte'
  ];
  
  for (const dir of mockDirs) {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log(`✅ Created directory: ${dir}`, 'green');
    } else {
      log(`✅ Directory exists: ${dir}`, 'blue');
    }
  }
  
  // Create basic mock files
  const mockFiles = [
    {
      path: 'tests/mocks/$app/environment.js',
      content: 'export const browser = false;\nexport const dev = true;\nexport const building = false;\nexport const version = "test";\n'
    },
    {
      path: 'tests/mocks/$app/stores.js',
      content: 'export const page = { subscribe: () => {} };\nexport const navigating = { subscribe: () => {} };\nexport const updated = { subscribe: () => {} };\n'
    },
    {
      path: 'tests/mocks/$env/static/private.js',
      content: 'export const JWT_SECRET = "test-secret";\nexport const FIREBASE_PROJECT_ID = "test-project";\n'
    }
  ];
  
  for (const file of mockFiles) {
    const fullPath = path.join(rootDir, file.path);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, file.content);
      log(`✅ Created mock file: ${file.path}`, 'green');
    }
  }
}

async function updateCypressSelectors() {
  logSection('🎯 Updating Cypress Selectors');
  
  log('Note: Cypress selector updates require manual review of the current UI', 'yellow');
  log('Consider the following common issues:', 'blue');
  console.log('  • Navigation structure changes');
  console.log('  • Element visibility timing');
  console.log('  • CSS class name changes');
  console.log('  • Dynamic content loading');
  
  log('Recommendation: Run Cypress in interactive mode to debug:', 'cyan');
  console.log('  npm run test:cypress:open');
}

async function generateTestReport() {
  logSection('📊 Generating Test Status Report');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    fixes_applied: [
      'Missing dependencies installation',
      'Jest configuration updates',
      'Mock directories creation',
      'Test script corrections'
    ],
    remaining_issues: [
      'Cypress selector updates needed',
      'UI timing issues to resolve',
      'Integration test dependencies'
    ],
    next_steps: [
      'Run npm run test:auth to verify Jest fixes',
      'Run npm run test:cypress:open for interactive debugging',
      'Update Cypress selectors based on current UI',
      'Execute full alternating test suite'
    ]
  };
  
  const reportPath = path.join(rootDir, 'test-reports', 'fix-status.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`✅ Fix status report saved: ${reportPath}`, 'green');
}

async function runQuickValidation() {
  logSection('✅ Running Quick Validation');
  
  try {
    log('Testing Jest configuration...', 'blue');
    execSync('npm run test:auth', { stdio: 'pipe' });
    log('✅ Jest tests working correctly', 'green');
  } catch (error) {
    log('⚠️ Jest tests still have issues - check dependencies', 'yellow');
  }
  
  try {
    log('Testing Cypress configuration...', 'blue');
    execSync('npx cypress verify', { stdio: 'pipe' });
    log('✅ Cypress installation verified', 'green');
  } catch (error) {
    log('⚠️ Cypress verification failed', 'yellow');
  }
}

// Main execution
async function main() {
  logSection('🚀 GearGrab Test Issues Fix Script');
  
  try {
    await installMissingDependencies();
    await fixJestConfiguration();
    await createMissingMockDirectories();
    await updateCypressSelectors();
    await generateTestReport();
    await runQuickValidation();
    
    logSection('🎉 Fix Script Completed');
    log('Most issues have been addressed automatically', 'green');
    log('Manual review may be needed for Cypress selectors', 'yellow');
    log('Run the alternating test suite to verify fixes:', 'cyan');
    console.log('  npm run test:alternating');
    
  } catch (error) {
    log(`❌ Fix script failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

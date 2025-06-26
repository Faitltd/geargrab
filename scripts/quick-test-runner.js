#!/usr/bin/env node

/**
 * Quick Test Runner for GearGrab
 * 
 * A simplified version that runs essential tests quickly
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Quick test configuration
const quickTests = [
  {
    name: 'Unit Tests (Auth)',
    type: 'jest',
    command: ['npx', 'jest', '--testPathPatterns', 'tests/auth', '--verbose']
  },
  {
    name: 'E2E Tests (Core)',
    type: 'cypress',
    command: ['npx', 'cypress', 'run', '--spec', 'cypress/e2e/homepage.cy.js,cypress/e2e/browse.cy.js', '--browser', 'chrome']
  },
  {
    name: 'Unit Tests (Integration)',
    type: 'jest',
    command: ['npx', 'jest', '--testPathPatterns', 'tests/integration', '--verbose']
  },
  {
    name: 'E2E Tests (Auth)',
    type: 'cypress',
    command: ['npx', 'cypress', 'run', '--spec', 'cypress/e2e/authentication.cy.js', '--browser', 'chrome']
  }
];

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

async function runTest(test) {
  return new Promise((resolve) => {
    log(`🧪 Running: ${test.name}`, test.type === 'jest' ? 'blue' : 'cyan');
    
    const process = spawn(test.command[0], test.command.slice(1), {
      stdio: 'pipe',
      cwd: rootDir
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text.trim());
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(text.trim());
    });

    process.on('close', (code) => {
      const success = code === 0;
      log(`${test.name} ${success ? 'PASSED' : 'FAILED'}`, success ? 'green' : 'red');
      
      resolve({
        name: test.name,
        type: test.type,
        success,
        output,
        errorOutput,
        exitCode: code
      });
    });
  });
}

async function runQuickTests() {
  console.log('\n' + '='.repeat(50));
  log('🚀 Starting Quick Test Suite', 'bright');
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const test of quickTests) {
    const result = await runTest(test);
    results.push(result);
    
    // Short delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  log('📊 Quick Test Summary', 'bright');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  log(`Tests Passed: ${passed}/${total}`, passed === total ? 'green' : 'red');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  if (passed === total) {
    log('🎉 All quick tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Run full test suite for details.', 'yellow');
  }
  
  return results;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuickTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

export { runQuickTests };

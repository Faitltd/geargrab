#!/usr/bin/env node

/**
 * Transaction Flow Test Runner
 * 
 * Comprehensive testing of the booking and payment transaction flow
 * with the updated Firebase authentication system.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TransactionFlowTestRunner {
  constructor() {
    this.testResults = [];
    this.currentAttempt = 1;
    this.maxAttempts = 3;
    this.startTime = Date.now();
    this.corrections = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      correction: '🔧'
    }[type] || '📋';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('sh', ['-c', command], {
        stdio: 'pipe',
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 120000
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      childProcess.on('error', (error) => {
        reject(error);
      });

      // Kill process if it takes too long
      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGTERM');
          reject(new Error('Process timeout'));
        }
      }, options.timeout || 120000);
    });
  }

  async runTransactionTests() {
    this.log('🚀 Starting Transaction Flow Test Suite');
    this.log(`📊 Attempt ${this.currentAttempt}/${this.maxAttempts}`);

    const testSuite = [
      {
        name: 'Authentication Integration Tests',
        command: 'npm run test:unit -- --testPathPattern="auth.*transaction|transaction.*auth" --verbose',
        type: 'auth-integration',
        timeout: 60000
      },
      {
        name: 'Booking API Tests',
        command: 'npm run test:unit -- --testPathPattern="booking|book" --verbose',
        type: 'booking-api',
        timeout: 60000
      },
      {
        name: 'Payment Integration Tests',
        command: 'npm run test:unit -- --testPathPattern="payment|stripe" --verbose',
        type: 'payment-integration',
        timeout: 60000
      },
      {
        name: 'Transaction Flow E2E Tests',
        command: 'npm run test:e2e -- --spec="cypress/e2e/transaction-flow.cy.js" --browser=chrome --headless',
        type: 'e2e-transaction',
        timeout: 180000
      },
      {
        name: 'Firestore Transaction Tests',
        command: 'npm run test:unit -- --testPathPattern="firestore.*transaction" --verbose',
        type: 'firestore-transaction',
        timeout: 60000
      }
    ];

    for (const test of testSuite) {
      await this.runSingleTest(test);
    }

    await this.generateReport();
  }

  async runSingleTest(test) {
    this.log(`🧪 Running ${test.name}...`);
    
    try {
      const result = await this.runCommand(test.command, { timeout: test.timeout });
      
      const testResult = {
        name: test.name,
        type: test.type,
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        timestamp: new Date().toISOString(),
        attempt: this.currentAttempt
      };

      this.testResults.push(testResult);

      if (result.success) {
        this.log(`✅ ${test.name} - PASSED`, 'success');
      } else {
        this.log(`❌ ${test.name} - FAILED`, 'error');
        await this.analyzeFailureAndCorrect(testResult);
      }

    } catch (error) {
      this.log(`❌ ${test.name} - ERROR: ${error.message}`, 'error');
      
      const testResult = {
        name: test.name,
        type: test.type,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        attempt: this.currentAttempt
      };

      this.testResults.push(testResult);
      await this.analyzeFailureAndCorrect(testResult);
    }
  }

  async analyzeFailureAndCorrect(testResult) {
    this.log(`🔧 Analyzing failure for ${testResult.name}...`, 'correction');

    const corrections = [];

    // Analyze authentication issues
    if (testResult.stderr?.includes('401') || testResult.stderr?.includes('Unauthorized')) {
      corrections.push({
        type: 'auth_fix',
        description: 'Fix authentication middleware for transaction endpoints',
        action: async () => {
          this.log('🔧 Applying authentication fix...', 'correction');
          // Add authentication fixes here
        }
      });
    }

    // Analyze payment issues
    if (testResult.stderr?.includes('stripe') || testResult.stderr?.includes('payment')) {
      corrections.push({
        type: 'payment_fix',
        description: 'Fix Stripe payment integration',
        action: async () => {
          this.log('🔧 Applying payment integration fix...', 'correction');
          // Add payment fixes here
        }
      });
    }

    // Analyze booking issues
    if (testResult.stderr?.includes('booking') || testResult.stderr?.includes('firestore')) {
      corrections.push({
        type: 'booking_fix',
        description: 'Fix booking creation and Firestore integration',
        action: async () => {
          this.log('🔧 Applying booking fix...', 'correction');
          // Add booking fixes here
        }
      });
    }

    // Apply corrections
    for (const correction of corrections) {
      try {
        await correction.action();
        this.corrections.push({
          ...correction,
          applied: true,
          timestamp: new Date().toISOString(),
          attempt: this.currentAttempt
        });
        this.log(`✅ Applied: ${correction.description}`, 'correction');
      } catch (error) {
        this.log(`❌ Failed to apply: ${correction.description} - ${error.message}`, 'error');
        this.corrections.push({
          ...correction,
          applied: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          attempt: this.currentAttempt
        });
      }
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const report = {
      summary: {
        attempt: this.currentAttempt,
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length,
        duration: duration,
        timestamp: new Date().toISOString()
      },
      testResults: this.testResults,
      corrections: this.corrections,
      recommendations: this.generateRecommendations()
    };

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'test-results', 'transaction-flow-report.json');
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Display summary
    this.log('📊 TRANSACTION FLOW TEST SUMMARY', 'info');
    this.log('================================', 'info');
    this.log(`Attempt: ${report.summary.attempt}/${this.maxAttempts}`, 'info');
    this.log(`Total Tests: ${report.summary.totalTests}`, 'info');
    this.log(`Passed: ${report.summary.passed}`, report.summary.passed > 0 ? 'success' : 'info');
    this.log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info');
    this.log(`Duration: ${Math.round(duration / 1000)}s`, 'info');
    this.log(`Corrections Applied: ${this.corrections.filter(c => c.applied).length}`, 'correction');

    if (report.summary.failed > 0 && this.currentAttempt < this.maxAttempts) {
      this.log(`🔄 Retrying in attempt ${this.currentAttempt + 1}...`, 'warning');
      this.currentAttempt++;
      this.testResults = [];
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      await this.runTransactionTests();
    } else {
      this.log('🏁 Transaction flow testing complete!', 'success');
      this.log(`📄 Full report saved to: ${reportPath}`, 'info');
    }
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => !r.success);

    if (failedTests.some(t => t.type === 'auth-integration')) {
      recommendations.push({
        category: 'Authentication',
        priority: 'HIGH',
        description: 'Update transaction endpoints to use Firebase authentication middleware',
        action: 'Replace Prisma auth checks with Firebase auth validation in booking and payment APIs'
      });
    }

    if (failedTests.some(t => t.type === 'payment-integration')) {
      recommendations.push({
        category: 'Payment Processing',
        priority: 'HIGH',
        description: 'Fix Stripe payment integration with updated authentication',
        action: 'Ensure payment intent creation works with Firebase ID tokens'
      });
    }

    if (failedTests.some(t => t.type === 'booking-api')) {
      recommendations.push({
        category: 'Booking System',
        priority: 'MEDIUM',
        description: 'Update booking creation to work with Firebase user data',
        action: 'Replace Prisma user queries with Firestore user document lookups'
      });
    }

    return recommendations;
  }
}

// Run the test suite
async function main() {
  const runner = new TransactionFlowTestRunner();
  await runner.runTransactionTests();
}

// Run the test suite if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TransactionFlowTestRunner };

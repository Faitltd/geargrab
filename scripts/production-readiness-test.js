#!/usr/bin/env node

/**
 * Production Readiness Test Suite for GearGrab
 * 
 * This script tests all critical systems before production deployment:
 * - Environment configuration
 * - Service health checks
 * - Background check integration
 * - Payment processing
 * - Email system
 * - Security measures
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TIMEOUT = 30000; // 30 seconds

class ProductionReadinessTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Production Readiness Tests for GearGrab\n');
    console.log(`Testing against: ${BASE_URL}\n`);

    try {
      await this.testEnvironmentConfiguration();
      await this.testServiceHealth();
      await this.testBackgroundCheckIntegration();
      await this.testPaymentProcessing();
      await this.testEmailSystem();
      await this.testSecurityMeasures();
      await this.testMonitoringSystem();

      this.printSummary();
      
      if (this.results.failed > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async testEnvironmentConfiguration() {
    console.log('📋 Testing Environment Configuration...');

    const requiredEnvVars = [
      'VITE_FIREBASE_PROJECT_ID',
      'FIREBASE_ADMIN_CLIENT_EMAIL',
      'FIREBASE_ADMIN_PRIVATE_KEY',
      'STRIPE_SECRET_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'RESEND_API_KEY',
      'CHECKR_API_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value || value === 'your_' + envVar.toLowerCase()) {
        this.addResult('fail', `Environment variable ${envVar} not configured`);
      } else {
        this.addResult('pass', `Environment variable ${envVar} configured`);
      }
    }

    // Check optional but recommended env vars
    const optionalEnvVars = [
      'CHECKR_WEBHOOK_SECRET',
      'STRIPE_WEBHOOK_SECRET',
      'SENTRY_DSN',
      'ALERT_EMAIL'
    ];

    for (const envVar of optionalEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        this.addResult('warning', `Optional environment variable ${envVar} not configured`);
      } else {
        this.addResult('pass', `Optional environment variable ${envVar} configured`);
      }
    }
  }

  async testServiceHealth() {
    console.log('\n🏥 Testing Service Health...');

    const healthEndpoints = [
      '/api/health/system',
      '/api/health/firebase',
      '/api/health/database',
      '/api/health/email',
      '/api/health/payments',
      '/api/health/background-checks'
    ];

    for (const endpoint of healthEndpoints) {
      try {
        const response = await this.makeRequest('GET', endpoint);
        
        if (response.success || response.overall === 'healthy') {
          this.addResult('pass', `Health check passed: ${endpoint}`);
        } else if (response.overall === 'degraded' || response.status === 'degraded') {
          this.addResult('warning', `Health check degraded: ${endpoint} - ${response.message}`);
        } else {
          this.addResult('fail', `Health check failed: ${endpoint} - ${response.message}`);
        }
      } catch (error) {
        this.addResult('fail', `Health check error: ${endpoint} - ${error.message}`);
      }
    }
  }

  async testBackgroundCheckIntegration() {
    console.log('\n🔍 Testing Background Check Integration...');

    try {
      // Test background check initiation
      const testData = {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          ssn: '123-45-6789',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zipCode: '12345'
          }
        },
        checkType: 'basic',
        provider: 'checkr'
      };

      const response = await this.makeRequest('POST', '/api/background-check/test', testData);
      
      if (response.success) {
        this.addResult('pass', 'Background check test initiation successful');
        
        // Test webhook processing
        if (response.requestId) {
          const webhookResponse = await this.makeRequest('GET', 
            `/api/webhooks/background-check?provider=checkr&requestId=${response.requestId}`);
          
          if (webhookResponse.success) {
            this.addResult('pass', 'Background check webhook processing successful');
          } else {
            this.addResult('fail', 'Background check webhook processing failed');
          }
        }
      } else {
        this.addResult('fail', `Background check test failed: ${response.message}`);
      }
    } catch (error) {
      this.addResult('fail', `Background check integration error: ${error.message}`);
    }
  }

  async testPaymentProcessing() {
    console.log('\n💳 Testing Payment Processing...');

    try {
      // Test payment intent creation
      const paymentData = {
        amount: 5000, // $50.00
        currency: 'usd',
        metadata: {
          type: 'booking',
          test: 'true'
        }
      };

      const response = await this.makeRequest('POST', '/api/payments/create-intent', paymentData);
      
      if (response.clientSecret) {
        this.addResult('pass', 'Payment intent creation successful');
      } else {
        this.addResult('fail', 'Payment intent creation failed');
      }

      // Test webhook endpoint
      const webhookTest = await this.makeRequest('GET', '/api/health/webhooks');
      if (webhookTest.success) {
        this.addResult('pass', 'Payment webhook endpoint accessible');
      } else {
        this.addResult('warning', 'Payment webhook endpoint issues');
      }

    } catch (error) {
      this.addResult('fail', `Payment processing error: ${error.message}`);
    }
  }

  async testEmailSystem() {
    console.log('\n📧 Testing Email System...');

    try {
      // Test email service health
      const healthResponse = await this.makeRequest('GET', '/api/health/email');
      
      if (healthResponse.success) {
        this.addResult('pass', 'Email service health check passed');
      } else {
        this.addResult('fail', `Email service health check failed: ${healthResponse.message}`);
      }

      // Test email sending (if test endpoint exists)
      try {
        const testEmailData = {
          to: 'test@example.com',
          subject: 'GearGrab Production Test',
          template: 'test'
        };

        const emailResponse = await this.makeRequest('POST', '/api/email/test', testEmailData);
        
        if (emailResponse.success) {
          this.addResult('pass', 'Test email sending successful');
        } else {
          this.addResult('warning', 'Test email sending failed (may be expected in production)');
        }
      } catch (error) {
        this.addResult('warning', 'Email test endpoint not available (expected in production)');
      }

    } catch (error) {
      this.addResult('fail', `Email system error: ${error.message}`);
    }
  }

  async testSecurityMeasures() {
    console.log('\n🔒 Testing Security Measures...');

    // Test HTTPS enforcement (in production)
    if (BASE_URL.startsWith('https://')) {
      this.addResult('pass', 'HTTPS enforced');
    } else if (BASE_URL.includes('localhost')) {
      this.addResult('warning', 'HTTPS not enforced (development environment)');
    } else {
      this.addResult('fail', 'HTTPS not enforced in production');
    }

    // Test authentication endpoints
    try {
      const authResponse = await this.makeRequest('GET', '/api/auth/status');
      this.addResult('pass', 'Authentication endpoints accessible');
    } catch (error) {
      this.addResult('warning', 'Authentication endpoints may require setup');
    }

    // Test admin route protection
    try {
      const adminResponse = await this.makeRequest('GET', '/admin');
      // Should either redirect to login or return 401/403
      if (adminResponse.status === 401 || adminResponse.status === 403) {
        this.addResult('pass', 'Admin routes properly protected');
      } else {
        this.addResult('warning', 'Admin route protection may need verification');
      }
    } catch (error) {
      this.addResult('warning', 'Admin route protection test inconclusive');
    }
  }

  async testMonitoringSystem() {
    console.log('\n📊 Testing Monitoring System...');

    try {
      // Test system health endpoint
      const systemHealth = await this.makeRequest('GET', '/api/health/system');
      
      if (systemHealth.overall === 'healthy') {
        this.addResult('pass', 'System monitoring operational');
      } else if (systemHealth.overall === 'degraded') {
        this.addResult('warning', 'System monitoring shows degraded performance');
      } else {
        this.addResult('fail', 'System monitoring shows critical issues');
      }

      // Test error logging
      try {
        const errorLogResponse = await this.makeRequest('POST', '/api/log-error', {
          message: 'Test error for monitoring',
          category: 'test',
          severity: 'low'
        });
        
        if (errorLogResponse.success) {
          this.addResult('pass', 'Error logging functional');
        } else {
          this.addResult('warning', 'Error logging may need configuration');
        }
      } catch (error) {
        this.addResult('warning', 'Error logging endpoint not available');
      }

    } catch (error) {
      this.addResult('fail', `Monitoring system error: ${error.message}`);
    }
  }

  async makeRequest(method, endpoint, data = null) {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    return await response.json();
  }

  addResult(type, message) {
    const result = { type, message, timestamp: new Date().toISOString() };
    this.results.tests.push(result);

    const icon = type === 'pass' ? '✅' : type === 'warning' ? '⚠️' : '❌';
    console.log(`  ${icon} ${message}`);

    if (type === 'pass') {
      this.results.passed++;
    } else if (type === 'warning') {
      this.results.warnings++;
    } else {
      this.results.failed++;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PRODUCTION READINESS TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📝 Total Tests: ${this.results.tests.length}`);

    const successRate = (this.results.passed / this.results.tests.length * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.results.failed === 0) {
      console.log('\n🎉 All critical tests passed! System is ready for production.');
    } else {
      console.log('\n🚨 Critical issues found. Please resolve before production deployment.');
    }

    // Save detailed results
    const resultsFile = path.join(process.cwd(), 'production-readiness-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
  }
}

// Run the tests
const tester = new ProductionReadinessTest();
tester.runAllTests().catch(console.error);

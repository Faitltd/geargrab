#!/usr/bin/env node

/**
 * Stripe Failure Scenarios Test Script
 * Tests error handling for various Stripe failure paths
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import { URL } from 'url';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const API_BASE = `${BASE_URL}/api`;

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[type];
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName}: PASSED ${details}`, 'success');
  } else {
    testResults.failed++;
    log(`${testName}: FAILED ${details}`, 'error');
  }
  testResults.details.push({ testName, passed, details, timestamp: new Date().toISOString() });
}

function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        ok: false,
        status: 0,
        statusText: error.message,
        data: {},
        headers: {}
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ok: false,
        status: 0,
        statusText: 'Request timeout',
        data: {},
        headers: {}
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test 1: Unauthenticated payment intent creation
async function testUnauthenticatedPayment() {
  log('Testing unauthenticated payment intent creation...');
  
  const response = await makeRequest(`${API_BASE}/payments/create-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 100,
      currency: 'usd',
      metadata: { test: 'unauthenticated' }
    })
  });
  
  const isSecure = response.status === 401;
  const hasUserFriendlyMessage = response.data?.error && 
    !response.data.error.includes('stripe') && 
    !response.data.error.includes('secret') &&
    !response.data.error.includes('key');
  
  addTestResult(
    'Unauthenticated Payment Security',
    isSecure && hasUserFriendlyMessage,
    `Status: ${response.status}, Message: "${response.data?.error || 'none'}"`
  );
  
  return { isSecure, hasUserFriendlyMessage, response };
}

// Test 2: Invalid payment amount
async function testInvalidPaymentAmount() {
  log('Testing invalid payment amount handling...');
  
  const testCases = [
    { amount: -100, description: 'negative amount' },
    { amount: 0, description: 'zero amount' },
    { amount: 'invalid', description: 'non-numeric amount' },
    { amount: 99999999, description: 'extremely large amount' }
  ];
  
  let allSecure = true;
  let allUserFriendly = true;
  
  for (const testCase of testCases) {
    const response = await makeRequest(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      },
      body: JSON.stringify({
        amount: testCase.amount,
        currency: 'usd',
        metadata: { test: testCase.description }
      })
    });
    
    const isErrorHandled = !response.ok;
    const hasUserFriendlyMessage = response.data?.error && 
      !response.data.error.includes('stripe') &&
      !response.data.error.includes('internal') &&
      response.data.error.length > 0;
    
    if (!isErrorHandled) allSecure = false;
    if (!hasUserFriendlyMessage) allUserFriendly = false;
    
    log(`${testCase.description}: ${response.status} - "${response.data?.error || 'none'}"`, 'debug');
  }
  
  addTestResult(
    'Invalid Payment Amount Handling',
    allSecure && allUserFriendly,
    `All invalid amounts properly rejected with user-friendly messages`
  );
  
  return { allSecure, allUserFriendly };
}

// Test 3: Malformed request data
async function testMalformedRequestData() {
  log('Testing malformed request data handling...');
  
  const testCases = [
    { body: 'invalid-json', description: 'invalid JSON' },
    { body: '{}', description: 'empty object' },
    { body: JSON.stringify({ invalid: 'data' }), description: 'missing required fields' },
    { body: JSON.stringify({ amount: 100 }), description: 'missing currency' }
  ];
  
  let allSecure = true;
  let allUserFriendly = true;
  
  for (const testCase of testCases) {
    const response = await makeRequest(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      },
      body: testCase.body
    });
    
    const isErrorHandled = !response.ok;
    const hasUserFriendlyMessage = response.data?.error && 
      !response.data.error.includes('stripe') &&
      !response.data.error.includes('internal') &&
      !response.data.error.includes('undefined');
    
    if (!isErrorHandled) allSecure = false;
    if (!hasUserFriendlyMessage) allUserFriendly = false;
    
    log(`${testCase.description}: ${response.status} - "${response.data?.error || 'none'}"`, 'debug');
  }
  
  addTestResult(
    'Malformed Request Data Handling',
    allSecure && allUserFriendly,
    `All malformed requests properly rejected with user-friendly messages`
  );
  
  return { allSecure, allUserFriendly };
}

// Test 4: Webhook signature validation
async function testWebhookSecurity() {
  log('Testing Stripe webhook security...');
  
  const testCases = [
    { signature: null, description: 'missing signature' },
    { signature: 'invalid-signature', description: 'invalid signature' },
    { signature: 't=123,v1=invalid', description: 'malformed signature' }
  ];
  
  let allSecure = true;
  let allUserFriendly = true;
  
  for (const testCase of testCases) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (testCase.signature) {
      headers['stripe-signature'] = testCase.signature;
    }
    
    const response = await makeRequest(`${API_BASE}/webhooks/stripe`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } }
      })
    });
    
    const isSecure = !response.ok && (response.status === 400 || response.status === 401);
    const hasUserFriendlyMessage = response.data?.error && 
      !response.data.error.includes('stripe') &&
      !response.data.error.includes('secret');
    
    if (!isSecure) allSecure = false;
    if (!hasUserFriendlyMessage) allUserFriendly = false;
    
    log(`${testCase.description}: ${response.status} - "${response.data?.error || 'none'}"`, 'debug');
  }
  
  addTestResult(
    'Webhook Security Validation',
    allSecure && allUserFriendly,
    `All invalid webhook requests properly rejected`
  );
  
  return { allSecure, allUserFriendly };
}

// Test 5: Error message sanitization
async function testErrorMessageSanitization() {
  log('Testing error message sanitization...');
  
  // Test various endpoints for sensitive information leakage
  const endpoints = [
    '/api/payments/create-intent',
    '/api/background-check/payment-intent',
    '/api/webhooks/stripe'
  ];
  
  let allSanitized = true;
  const sensitiveTerms = [
    'stripe_secret',
    'sk_test_',
    'sk_live_',
    'webhook_secret',
    'internal error',
    'stack trace',
    'file path',
    'database',
    'sql'
  ];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invalid: 'data' })
    });
    
    const errorMessage = response.data?.error || '';
    const hasSensitiveInfo = sensitiveTerms.some(term => 
      errorMessage.toLowerCase().includes(term.toLowerCase())
    );
    
    if (hasSensitiveInfo) {
      allSanitized = false;
      log(`Sensitive information found in ${endpoint}: "${errorMessage}"`, 'warning');
    }
  }
  
  addTestResult(
    'Error Message Sanitization',
    allSanitized,
    allSanitized ? 
      'No sensitive information leaked in error messages' : 
      'Some error messages contain sensitive information'
  );
  
  return { allSanitized };
}

// Test 6: Rate limiting on payment endpoints
async function testPaymentRateLimiting() {
  log('Testing rate limiting on payment endpoints...');
  
  const endpoint = `${API_BASE}/payments/create-intent`;
  const requests = [];
  
  // Make multiple rapid requests
  for (let i = 0; i < 25; i++) {
    requests.push(makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'usd'
      })
    }));
  }
  
  const responses = await Promise.all(requests);
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  const hasRateLimiting = rateLimitedCount > 0;
  
  addTestResult(
    'Payment Endpoint Rate Limiting',
    hasRateLimiting,
    hasRateLimiting ? 
      `${rateLimitedCount} requests rate limited` : 
      'No rate limiting detected'
  );
  
  return { hasRateLimiting, rateLimitedCount };
}

// Main test runner
async function runStripeFailureTests() {
  log('💳 Starting Stripe Failure Scenarios Testing');
  log(`Testing against: ${BASE_URL}`);
  
  const startTime = Date.now();
  
  try {
    // Check if server is running
    const serverCheck = await makeRequest(BASE_URL);
    if (!serverCheck.ok) {
      log('Server is not running. Please start the development server first.', 'error');
      return;
    }
    
    log('Server is running, starting Stripe failure tests...', 'success');
    
    // Run all tests
    const unauthTest = await testUnauthenticatedPayment();
    const invalidAmountTest = await testInvalidPaymentAmount();
    const malformedDataTest = await testMalformedRequestData();
    const webhookSecurityTest = await testWebhookSecurity();
    const sanitizationTest = await testErrorMessageSanitization();
    const rateLimitTest = await testPaymentRateLimiting();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(70));
    log('💳 STRIPE FAILURE SCENARIOS TEST SUMMARY');
    console.log('='.repeat(70));
    log(`Total Tests: ${testResults.total}`);
    log(`Passed: ${testResults.passed}`, 'success');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
    log(`Duration: ${duration}s`);
    log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    // Show detailed results
    console.log('\n📋 DETAILED RESULTS:');
    testResults.details.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testName}: ${result.details}`);
    });
    
    // Security analysis
    console.log('\n🔒 SECURITY ANALYSIS:');
    console.log(`Authentication Protection: ${unauthTest.isSecure ? '✅' : '❌'}`);
    console.log(`Input Validation: ${invalidAmountTest.allSecure ? '✅' : '❌'}`);
    console.log(`Error Sanitization: ${sanitizationTest.allSanitized ? '✅' : '❌'}`);
    console.log(`Webhook Security: ${webhookSecurityTest.allSecure ? '✅' : '❌'}`);
    console.log(`Rate Limiting: ${rateLimitTest.hasRateLimiting ? '✅' : '❌'}`);
    
    // User experience analysis
    console.log('\n👤 USER EXPERIENCE ANALYSIS:');
    console.log(`User-Friendly Error Messages: ${unauthTest.hasUserFriendlyMessage ? '✅' : '❌'}`);
    console.log(`Clear Validation Messages: ${invalidAmountTest.allUserFriendly ? '✅' : '❌'}`);
    console.log(`Helpful Error Guidance: ${malformedDataTest.allUserFriendly ? '✅' : '❌'}`);
    
    // Save detailed results
    const reportPath = 'stripe-failure-test-results.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        duration: duration,
        successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
      },
      security: {
        authentication: unauthTest.isSecure,
        inputValidation: invalidAmountTest.allSecure,
        errorSanitization: sanitizationTest.allSanitized,
        webhookSecurity: webhookSecurityTest.allSecure,
        rateLimiting: rateLimitTest.hasRateLimiting
      },
      userExperience: {
        friendlyMessages: unauthTest.hasUserFriendlyMessage,
        clearValidation: invalidAmountTest.allUserFriendly,
        helpfulGuidance: malformedDataTest.allUserFriendly
      },
      details: testResults.details,
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL
    }, null, 2));
    
    log(`📄 Detailed results saved to: ${reportPath}`);
    
    return testResults.failed === 0;
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStripeFailureTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { runStripeFailureTests, testResults };

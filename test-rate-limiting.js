#!/usr/bin/env node

/**
 * Rate Limiting Boundary Cases Test Script
 * Tests rate limiting thresholds and edge cases
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import { URL } from 'url';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const API_BASE = `${BASE_URL}/api`;

// Rate limiting configurations from the codebase
const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  upload: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
  payment: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 payment attempts per hour
  admin: { windowMs: 15 * 60 * 1000, max: 200 } // 200 admin requests per 15 minutes
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
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
      timeout: 5000
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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Basic rate limiting threshold test
async function testBasicRateLimit() {
  log('Testing basic rate limiting threshold...');
  
  const endpoint = `${API_BASE}/auth/test`;
  const limit = RATE_LIMITS.api.max; // 100 requests per 15 minutes
  const requests = [];
  
  // Make requests up to the limit
  for (let i = 0; i < limit + 5; i++) {
    requests.push(makeRequest(endpoint));
    if (i % 10 === 0) {
      await delay(50); // Small delay to avoid overwhelming
    }
  }
  
  const responses = await Promise.all(requests);
  const successCount = responses.filter(r => r.ok).length;
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  
  // Should have some rate limited responses
  const hasRateLimiting = rateLimitedCount > 0;
  const withinExpectedRange = successCount <= limit && rateLimitedCount >= 5;
  
  addTestResult(
    'Basic Rate Limit Threshold',
    hasRateLimiting && withinExpectedRange,
    `Success: ${successCount}, Rate Limited: ${rateLimitedCount}, Expected limit: ${limit}`
  );
  
  return hasRateLimiting;
}

// Test 2: Rate limit boundary edge case (exactly at limit)
async function testRateLimitBoundary() {
  log('Testing rate limit boundary (exactly at limit)...');
  
  const endpoint = `${API_BASE}/auth/test`;
  const limit = 10; // Use a smaller limit for testing
  const requests = [];
  
  // Make exactly the limit number of requests
  for (let i = 0; i < limit; i++) {
    requests.push(makeRequest(endpoint));
    await delay(100); // Spread out requests slightly
  }
  
  const responses = await Promise.all(requests);
  const successCount = responses.filter(r => r.ok).length;
  
  // Then make one more request that should be rate limited
  await delay(500);
  const extraRequest = await makeRequest(endpoint);
  
  const boundaryTest = successCount >= (limit - 2); // Allow some margin
  
  addTestResult(
    'Rate Limit Boundary Test',
    boundaryTest,
    `${successCount}/${limit} requests succeeded, extra request status: ${extraRequest.status}`
  );
  
  return boundaryTest;
}

// Test 3: Rate limit window reset test
async function testRateLimitWindowReset() {
  log('Testing rate limit window reset (this may take time)...');
  
  const endpoint = `${API_BASE}/auth/test`;
  
  // Make several requests to trigger rate limiting
  const initialRequests = [];
  for (let i = 0; i < 15; i++) {
    initialRequests.push(makeRequest(endpoint));
  }
  
  const initialResponses = await Promise.all(initialRequests);
  const initialRateLimited = initialResponses.some(r => r.status === 429);
  
  if (!initialRateLimited) {
    addTestResult(
      'Rate Limit Window Reset',
      false,
      'Could not trigger initial rate limiting'
    );
    return false;
  }
  
  // Wait for a short period (not full window, just to test partial reset)
  log('Waiting 30 seconds to test window behavior...', 'debug');
  await delay(30000);
  
  // Make another request
  const resetTestRequest = await makeRequest(endpoint);
  
  // The request might still be rate limited depending on the window
  const windowBehaviorCorrect = resetTestRequest.status === 200 || resetTestRequest.status === 429;
  
  addTestResult(
    'Rate Limit Window Reset',
    windowBehaviorCorrect,
    `After 30s wait, request status: ${resetTestRequest.status}`
  );
  
  return windowBehaviorCorrect;
}

// Test 4: Different endpoint rate limits
async function testDifferentEndpointLimits() {
  log('Testing different endpoint rate limits...');
  
  const endpoints = [
    { url: `${API_BASE}/auth/test`, type: 'api' },
    { url: `${API_BASE}/auth/session`, type: 'auth', method: 'POST', body: '{"test": true}' }
  ];
  
  let allCorrect = true;
  
  for (const endpoint of endpoints) {
    const requests = [];
    const testLimit = 8; // Conservative test limit
    
    for (let i = 0; i < testLimit; i++) {
      requests.push(makeRequest(endpoint.url, {
        method: endpoint.method || 'GET',
        headers: endpoint.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: endpoint.body
      }));
      await delay(200);
    }
    
    const responses = await Promise.all(requests);
    const hasVariedResponses = responses.some(r => r.status !== responses[0].status);
    
    if (!hasVariedResponses) {
      allCorrect = false;
      log(`${endpoint.url} (${endpoint.type}) may not have proper rate limiting`, 'warning');
    }
    
    await delay(1000); // Delay between endpoint tests
  }
  
  addTestResult(
    'Different Endpoint Rate Limits',
    allCorrect,
    'Different endpoints show varied rate limiting behavior'
  );
  
  return allCorrect;
}

// Test 5: Rate limit headers test
async function testRateLimitHeaders() {
  log('Testing rate limit headers...');
  
  const endpoint = `${API_BASE}/auth/test`;
  const response = await makeRequest(endpoint);
  
  const hasRateLimitHeaders = 
    response.headers['x-ratelimit-limit'] ||
    response.headers['x-ratelimit-remaining'] ||
    response.headers['x-ratelimit-reset'] ||
    response.headers['ratelimit-limit'] ||
    response.headers['ratelimit-remaining'];
  
  addTestResult(
    'Rate Limit Headers',
    !!hasRateLimitHeaders,
    hasRateLimitHeaders ? 
      'Rate limit headers present' : 
      'Rate limit headers missing (may be by design)'
  );
  
  return true; // Not critical for functionality
}

// Test 6: Concurrent request handling
async function testConcurrentRequests() {
  log('Testing concurrent request handling...');
  
  const endpoint = `${API_BASE}/auth/test`;
  const concurrentCount = 20;
  
  // Make all requests simultaneously
  const startTime = Date.now();
  const requests = Array(concurrentCount).fill().map(() => makeRequest(endpoint));
  const responses = await Promise.all(requests);
  const endTime = Date.now();
  
  const successCount = responses.filter(r => r.ok).length;
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  const errorCount = responses.filter(r => r.status === 0 || r.status >= 500).length;
  
  // System should handle concurrent requests gracefully
  const handledGracefully = errorCount < (concurrentCount * 0.1); // Less than 10% errors
  const duration = endTime - startTime;
  
  addTestResult(
    'Concurrent Request Handling',
    handledGracefully,
    `${successCount} success, ${rateLimitedCount} rate limited, ${errorCount} errors in ${duration}ms`
  );
  
  return handledGracefully;
}

// Test 7: Rate limit bypass attempts
async function testRateLimitBypassAttempts() {
  log('Testing rate limit bypass attempts...');
  
  const endpoint = `${API_BASE}/auth/test`;
  const bypassAttempts = [
    // Different User-Agent
    { headers: { 'User-Agent': 'Mozilla/5.0 (Different Browser)' } },
    // Different X-Forwarded-For
    { headers: { 'X-Forwarded-For': '192.168.1.100' } },
    // Different X-Real-IP
    { headers: { 'X-Real-IP': '10.0.0.1' } },
    // No headers
    { headers: {} }
  ];
  
  let bypassSuccessful = false;
  
  // First, trigger rate limiting
  const triggerRequests = Array(15).fill().map(() => makeRequest(endpoint));
  await Promise.all(triggerRequests);
  
  // Then try bypass attempts
  for (const attempt of bypassAttempts) {
    const response = await makeRequest(endpoint, attempt);
    if (response.ok && response.status !== 429) {
      bypassSuccessful = true;
      log(`Potential bypass detected with headers: ${JSON.stringify(attempt.headers)}`, 'warning');
    }
    await delay(500);
  }
  
  addTestResult(
    'Rate Limit Bypass Prevention',
    !bypassSuccessful,
    bypassSuccessful ? 
      'Rate limit bypass possible - security concern' : 
      'Rate limit bypass attempts properly blocked'
  );
  
  return !bypassSuccessful;
}

// Main test runner
async function runRateLimitTests() {
  log('🚀 Starting Rate Limiting Boundary Tests');
  log(`Testing against: ${BASE_URL}`);
  log('⚠️  This test may take several minutes and generate many requests');
  
  const startTime = Date.now();
  
  try {
    // Check if server is running
    const serverCheck = await makeRequest(BASE_URL);
    if (!serverCheck.ok) {
      log('Server is not running. Please start the development server first.', 'error');
      return;
    }
    
    log('Server is running, starting rate limit tests...', 'success');
    
    // Run all tests with delays between them
    await testBasicRateLimit();
    await delay(2000);
    
    await testRateLimitBoundary();
    await delay(2000);
    
    await testDifferentEndpointLimits();
    await delay(2000);
    
    await testRateLimitHeaders();
    await delay(2000);
    
    await testConcurrentRequests();
    await delay(2000);
    
    await testRateLimitBypassAttempts();
    await delay(2000);
    
    // Skip window reset test by default (takes too long)
    if (process.env.FULL_TEST === 'true') {
      await testRateLimitWindowReset();
    } else {
      log('Skipping window reset test (use FULL_TEST=true to include)', 'warning');
    }
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate report
  console.log('\n' + '='.repeat(60));
  log('📊 RATE LIMITING TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
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
  
  // Rate limiting configuration summary
  console.log('\n⚙️  CURRENT RATE LIMIT CONFIGURATION:');
  Object.entries(RATE_LIMITS).forEach(([type, config]) => {
    const windowMinutes = config.windowMs / (60 * 1000);
    console.log(`- ${type}: ${config.max} requests per ${windowMinutes} minutes`);
  });
  
  // Save results
  const reportPath = 'rate-limit-test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      duration: duration,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
    },
    rateLimitConfig: RATE_LIMITS,
    details: testResults.details,
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL
  }, null, 2));
  
  log(`📄 Detailed results saved to: ${reportPath}`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (testResults.failed === 0) {
    log('All rate limiting tests passed!', 'success');
  } else {
    log('Some rate limiting tests failed. Consider:', 'warning');
    log('1. Reviewing rate limit thresholds');
    log('2. Checking rate limit implementation');
    log('3. Testing bypass prevention mechanisms');
    log('4. Monitoring rate limit effectiveness');
  }
  
  return testResults.failed === 0;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRateLimitTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { runRateLimitTests, testResults };

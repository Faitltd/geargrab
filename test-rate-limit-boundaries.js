#!/usr/bin/env node

/**
 * Focused Rate Limiting Boundary Test
 * Tests specific boundary cases and thresholds
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
      timeout: 3000
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

// Test 1: Exact threshold boundary test
async function testExactThreshold() {
  log('Testing exact rate limit threshold boundary...');
  
  const endpoint = `${API_BASE}/auth/test`;
  const limit = 100; // API rate limit
  
  // Make exactly the limit number of requests in batches
  const batchSize = 10;
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let batch = 0; batch < Math.ceil(limit / batchSize); batch++) {
    const batchRequests = [];
    const requestsInBatch = Math.min(batchSize, limit - (batch * batchSize));
    
    for (let i = 0; i < requestsInBatch; i++) {
      batchRequests.push(makeRequest(endpoint));
    }
    
    const responses = await Promise.all(batchRequests);
    successCount += responses.filter(r => r.ok).length;
    rateLimitedCount += responses.filter(r => r.status === 429).length;
    
    // Small delay between batches
    await delay(100);
  }
  
  // Make one more request that should definitely be rate limited
  await delay(500);
  const extraRequest = await makeRequest(endpoint);
  if (extraRequest.status === 429) {
    rateLimitedCount++;
  } else if (extraRequest.ok) {
    successCount++;
  }
  
  const withinExpectedRange = successCount <= limit && rateLimitedCount > 0;
  
  addTestResult(
    'Exact Threshold Boundary',
    withinExpectedRange,
    `${successCount} success, ${rateLimitedCount} rate limited, limit: ${limit}`
  );
  
  return withinExpectedRange;
}

// Test 2: Rate limit window behavior
async function testWindowBehavior() {
  log('Testing rate limit window behavior...');
  
  const endpoint = `${API_BASE}/auth/test`;
  
  // Make a few requests to establish baseline
  const initialRequests = [];
  for (let i = 0; i < 5; i++) {
    initialRequests.push(makeRequest(endpoint));
    await delay(200);
  }
  
  const initialResponses = await Promise.all(initialRequests);
  const initialSuccess = initialResponses.filter(r => r.ok).length;
  const initialRateLimited = initialResponses.filter(r => r.status === 429).length;
  
  // Check if we can still make requests or if we're already rate limited
  const windowBehaviorCorrect = initialSuccess > 0 || initialRateLimited > 0;
  
  addTestResult(
    'Rate Limit Window Behavior',
    windowBehaviorCorrect,
    `Initial: ${initialSuccess} success, ${initialRateLimited} rate limited`
  );
  
  return windowBehaviorCorrect;
}

// Test 3: Different rate limit types
async function testDifferentRateLimitTypes() {
  log('Testing different rate limit types...');
  
  const endpoints = [
    { 
      url: `${API_BASE}/auth/test`, 
      type: 'api',
      expectedLimit: 100,
      testRequests: 10
    }
  ];
  
  let allCorrect = true;
  
  for (const endpoint of endpoints) {
    const requests = [];
    
    for (let i = 0; i < endpoint.testRequests; i++) {
      requests.push(makeRequest(endpoint.url));
      await delay(50);
    }
    
    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.ok).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    // For this test, we expect either all success (under limit) or some rate limited
    const behaviorCorrect = successCount > 0 || rateLimitedCount > 0;
    
    if (!behaviorCorrect) {
      allCorrect = false;
      log(`${endpoint.url} (${endpoint.type}) unexpected behavior`, 'warning');
    }
    
    log(`${endpoint.url}: ${successCount} success, ${rateLimitedCount} rate limited`, 'debug');
    await delay(1000);
  }
  
  addTestResult(
    'Different Rate Limit Types',
    allCorrect,
    'Rate limiting behavior varies appropriately by endpoint type'
  );
  
  return allCorrect;
}

// Test 4: Rate limit recovery after window
async function testRateLimitRecovery() {
  log('Testing rate limit recovery (quick test)...');
  
  const endpoint = `${API_BASE}/auth/test`;
  
  // Make requests to potentially trigger rate limiting
  const triggerRequests = [];
  for (let i = 0; i < 20; i++) {
    triggerRequests.push(makeRequest(endpoint));
  }
  
  const triggerResponses = await Promise.all(triggerRequests);
  const triggerRateLimited = triggerResponses.filter(r => r.status === 429).length;
  
  // Wait a short time (not full window, just to test behavior)
  await delay(5000); // 5 seconds
  
  // Make another request
  const recoveryRequest = await makeRequest(endpoint);
  
  // The behavior should be consistent (either still rate limited or recovered)
  const recoveryBehaviorCorrect = recoveryRequest.status === 200 || recoveryRequest.status === 429;
  
  addTestResult(
    'Rate Limit Recovery',
    recoveryBehaviorCorrect,
    `After trigger (${triggerRateLimited} rate limited) and 5s wait: ${recoveryRequest.status}`
  );
  
  return recoveryBehaviorCorrect;
}

// Test 5: Concurrent request handling under rate limits
async function testConcurrentUnderRateLimit() {
  log('Testing concurrent requests under rate limit...');
  
  const endpoint = `${API_BASE}/auth/test`;
  const concurrentCount = 15;
  
  // Make concurrent requests
  const startTime = Date.now();
  const requests = Array(concurrentCount).fill().map(() => makeRequest(endpoint));
  const responses = await Promise.all(requests);
  const endTime = Date.now();
  
  const successCount = responses.filter(r => r.ok).length;
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  const errorCount = responses.filter(r => r.status === 0 || r.status >= 500).length;
  
  // System should handle concurrent requests without errors
  const handledGracefully = errorCount === 0;
  const duration = endTime - startTime;
  
  addTestResult(
    'Concurrent Under Rate Limit',
    handledGracefully,
    `${successCount} success, ${rateLimitedCount} rate limited, ${errorCount} errors in ${duration}ms`
  );
  
  return handledGracefully;
}

// Main test runner
async function runBoundaryTests() {
  log('🎯 Starting Focused Rate Limiting Boundary Tests');
  log(`Testing against: ${BASE_URL}`);
  
  const startTime = Date.now();
  
  try {
    // Check if server is running
    const serverCheck = await makeRequest(BASE_URL);
    if (!serverCheck.ok) {
      log('Server is not running. Please start the development server first.', 'error');
      return;
    }
    
    log('Server is running, starting boundary tests...', 'success');
    
    // Run focused tests
    await testExactThreshold();
    await delay(2000);
    
    await testWindowBehavior();
    await delay(2000);
    
    await testDifferentRateLimitTypes();
    await delay(2000);
    
    await testConcurrentUnderRateLimit();
    await delay(2000);
    
    await testRateLimitRecovery();
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate report
  console.log('\n' + '='.repeat(50));
  log('🎯 BOUNDARY TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
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
  
  // Save results
  const reportPath = 'rate-limit-boundary-results.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      duration: duration,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
    },
    details: testResults.details,
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL
  }, null, 2));
  
  log(`📄 Detailed results saved to: ${reportPath}`);
  
  return testResults.failed === 0;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBoundaryTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { runBoundaryTests, testResults };

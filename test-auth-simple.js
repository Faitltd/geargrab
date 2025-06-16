#!/usr/bin/env node

/**
 * Simple Authentication Test Script
 * Tests protected routes and authentication implementation
 */

import { execSync } from 'child_process';
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

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Check if development server is running
async function testServerRunning() {
  log('Testing if development server is running...');
  
  const response = await makeRequest(BASE_URL);
  addTestResult(
    'Server Running',
    response.ok,
    response.ok ? `Server responding on ${BASE_URL}` : `Server not responding: ${response.statusText}`
  );
  
  return response.ok;
}

// Test 2: Test authentication test endpoint
async function testAuthTestEndpoint() {
  log('Testing authentication test endpoint...');
  
  const response = await makeRequest(`${API_BASE}/auth/test`);
  const isWorking = response.ok && response.data && response.data.success;
  
  addTestResult(
    'Auth Test Endpoint',
    isWorking,
    isWorking ? 
      `Auth endpoint working. Environment: ${response.data.data?.environment?.NODE_ENV}` :
      `Auth endpoint failed: ${response.statusText}`
  );
  
  return isWorking;
}

// Test 3: Test protected API endpoints without authentication
async function testProtectedEndpointsUnauthenticated() {
  log('Testing protected endpoints without authentication...');
  
  const protectedEndpoints = [
    '/api/bookings',
    '/api/conversations'
  ];
  
  let allCorrectlyProtected = true;
  
  for (const endpoint of protectedEndpoints) {
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    const isCorrectlyProtected = response.status === 401 || response.status === 403;
    
    if (!isCorrectlyProtected) {
      allCorrectlyProtected = false;
      log(`${endpoint} returned status ${response.status} instead of 401/403`, 'warning');
    }
    
    await delay(500);
  }
  
  addTestResult(
    'Protected API Endpoints',
    allCorrectlyProtected,
    allCorrectlyProtected ? 
      'All protected endpoints correctly return 401/403' : 
      'Some endpoints may not be properly protected'
  );
  
  return allCorrectlyProtected;
}

// Test 4: Test JWT token validation with invalid token
async function testInvalidJWTHandling() {
  log('Testing invalid JWT token handling...');
  
  const response = await makeRequest(`${API_BASE}/auth/test`, {
    headers: {
      'Authorization': 'Bearer invalid-token-12345'
    }
  });
  
  const handlesInvalidToken = response.ok && response.data && !response.data.data?.isAuthenticated;
  
  addTestResult(
    'Invalid JWT Handling',
    handlesInvalidToken,
    handlesInvalidToken ? 
      'Invalid tokens are properly rejected' : 
      'Invalid token handling may need review'
  );
  
  return handlesInvalidToken;
}

// Test 5: Test session endpoint CSRF protection
async function testSessionEndpointProtection() {
  log('Testing session endpoint protection...');
  
  const response = await makeRequest(`${API_BASE}/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      idToken: 'test-token'
    })
  });
  
  // Should fail due to missing CSRF token or invalid request
  const isProtected = !response.ok && (response.status === 403 || response.status === 400 || response.status === 401);
  
  addTestResult(
    'Session Endpoint Protection',
    isProtected,
    isProtected ? 
      `Session endpoint properly protected (status: ${response.status})` : 
      `Session endpoint may not be properly protected (status: ${response.status})`
  );
  
  return isProtected;
}

// Test 6: Test hooks.server.ts authentication middleware
async function testServerHooksAuth() {
  log('Testing server hooks authentication...');
  
  // Test an endpoint that should use the hooks.server.ts middleware
  const response = await makeRequest(`${API_BASE}/auth/test`);
  
  const hasAuthMiddleware = response.ok && response.data && 
    typeof response.data.data?.isAuthenticated === 'boolean';
  
  addTestResult(
    'Server Hooks Authentication',
    hasAuthMiddleware,
    hasAuthMiddleware ? 
      'Server hooks authentication middleware is working' : 
      'Server hooks authentication may not be working properly'
  );
  
  return hasAuthMiddleware;
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Authentication Implementation Tests');
  log(`Testing against: ${BASE_URL}`);
  
  const startTime = Date.now();
  
  try {
    // Check if server is running first
    const serverRunning = await testServerRunning();
    if (!serverRunning) {
      log('Server is not running. Please start the development server first.', 'error');
      return;
    }
    
    await delay(1000);
    await testAuthTestEndpoint();
    
    await delay(1000);
    await testProtectedEndpointsUnauthenticated();
    
    await delay(1000);
    await testInvalidJWTHandling();
    
    await delay(1000);
    await testSessionEndpointProtection();
    
    await delay(1000);
    await testServerHooksAuth();
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate report
  console.log('\n' + '='.repeat(50));
  log('📊 TEST RESULTS SUMMARY');
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
  
  // Save results to file
  const reportPath = 'auth-test-results.json';
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
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (testResults.failed === 0) {
    log('All tests passed! Your authentication implementation looks good.', 'success');
  } else {
    log('Some tests failed. Review the failed tests above and check:', 'warning');
    log('1. Protected routes are properly configured');
    log('2. JWT token validation is working');
    log('3. Security middleware is applied correctly');
    log('4. CSRF protection is enabled where needed');
  }
  
  return testResults.failed === 0;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { runAllTests, testResults };

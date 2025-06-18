#!/usr/bin/env node

/**
 * Comprehensive Authentication and JWT Implementation Test
 * Tests protected routes, JWT validation, and authentication flows
 */

import { execSync } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 3,
  delay: 1000
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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      timeout: TEST_CONFIG.timeout,
      ...options
    });
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: await response.json().catch(() => ({})),
      headers: response.headers
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message,
      data: {},
      headers: new Map()
    };
  }
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
  addTestResult(
    'Auth Test Endpoint',
    response.ok && response.data.success,
    response.ok ? 
      `Environment: ${response.data.data?.environment?.NODE_ENV}, Firebase Admin: ${response.data.data?.environment?.hasFirebaseAdmin}` :
      `Failed to reach auth test endpoint: ${response.statusText}`
  );
  
  return response.ok;
}

// Test 3: Test protected API endpoints without authentication
async function testProtectedEndpointsUnauthenticated() {
  log('Testing protected endpoints without authentication...');
  
  const protectedEndpoints = [
    '/api/bookings',
    '/api/conversations',
    '/api/admin/security/dashboard'
  ];
  
  let allCorrectlyProtected = true;
  
  for (const endpoint of protectedEndpoints) {
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    const isCorrectlyProtected = response.status === 401 || response.status === 403;
    
    if (!isCorrectlyProtected) {
      allCorrectlyProtected = false;
      log(`${endpoint} is not properly protected (status: ${response.status})`, 'warning');
    }
    
    await delay(500); // Rate limiting consideration
  }
  
  addTestResult(
    'Protected Endpoints (Unauthenticated)',
    allCorrectlyProtected,
    allCorrectlyProtected ? 
      'All protected endpoints correctly return 401/403' : 
      'Some endpoints are not properly protected'
  );
  
  return allCorrectlyProtected;
}

// Test 4: Test client-side route protection
async function testClientSideRouteProtection() {
  log('Testing client-side route protection...');
  
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/profile',
    '/admin',
    '/dashboard/verification'
  ];
  
  let allCorrectlyProtected = true;
  
  for (const route of protectedRoutes) {
    const response = await makeRequest(`${BASE_URL}${route}`);
    
    // Check if route redirects to login or shows auth guard
    const isProtected = response.status === 302 || 
                       (response.ok && response.data && 
                        (response.data.includes('login') || response.data.includes('auth')));
    
    if (!isProtected && response.ok) {
      // Additional check: if page loads, it should have auth guard logic
      allCorrectlyProtected = false;
      log(`${route} may not be properly protected`, 'warning');
    }
    
    await delay(500);
  }
  
  addTestResult(
    'Client-Side Route Protection',
    allCorrectlyProtected,
    'Protected routes implement proper authentication guards'
  );
  
  return allCorrectlyProtected;
}

// Test 5: Test JWT token validation (if we can get a test token)
async function testJWTValidation() {
  log('Testing JWT token validation...');
  
  // Test with invalid token
  const invalidTokenResponse = await makeRequest(`${API_BASE}/auth/test`, {
    headers: {
      'Authorization': 'Bearer invalid-token-12345'
    }
  });
  
  const handlesInvalidToken = !invalidTokenResponse.data?.data?.isAuthenticated;
  
  addTestResult(
    'JWT Invalid Token Handling',
    handlesInvalidToken,
    handlesInvalidToken ? 
      'Invalid tokens are properly rejected' : 
      'Invalid tokens may be accepted'
  );
  
  return handlesInvalidToken;
}

// Test 6: Test CSRF protection
async function testCSRFProtection() {
  log('Testing CSRF protection...');
  
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
  const hasCSRFProtection = !response.ok && (response.status === 403 || response.status === 400);
  
  addTestResult(
    'CSRF Protection',
    hasCSRFProtection,
    hasCSRFProtection ? 
      'CSRF protection is active' : 
      'CSRF protection may not be working'
  );
  
  return hasCSRFProtection;
}

// Test 7: Test rate limiting
async function testRateLimiting() {
  log('Testing rate limiting...');
  
  const requests = [];
  const endpoint = `${API_BASE}/auth/test`;
  
  // Make multiple rapid requests
  for (let i = 0; i < 10; i++) {
    requests.push(makeRequest(endpoint));
  }
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.some(r => r.status === 429);
  
  addTestResult(
    'Rate Limiting',
    rateLimited,
    rateLimited ? 
      'Rate limiting is active' : 
      'Rate limiting may not be configured (or limit is high)'
  );
  
  return true; // Not critical for basic auth functionality
}

// Test 8: Test security headers
async function testSecurityHeaders() {
  log('Testing security headers...');
  
  const response = await makeRequest(BASE_URL);
  const headers = response.headers;
  
  const securityHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection'
  ];
  
  const hasSecurityHeaders = securityHeaders.some(header => 
    headers.get(header) || headers.get(header.toUpperCase())
  );
  
  addTestResult(
    'Security Headers',
    hasSecurityHeaders,
    hasSecurityHeaders ? 
      'Some security headers are present' : 
      'Security headers may be missing'
  );
  
  return true; // Not critical for basic auth functionality
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Authentication and JWT Implementation Tests');
  log(`Testing against: ${BASE_URL}`);
  
  const startTime = Date.now();
  
  try {
    // Run all tests
    await testServerRunning();
    await delay(TEST_CONFIG.delay);
    
    await testAuthTestEndpoint();
    await delay(TEST_CONFIG.delay);
    
    await testProtectedEndpointsUnauthenticated();
    await delay(TEST_CONFIG.delay);
    
    await testClientSideRouteProtection();
    await delay(TEST_CONFIG.delay);
    
    await testJWTValidation();
    await delay(TEST_CONFIG.delay);
    
    await testCSRFProtection();
    await delay(TEST_CONFIG.delay);
    
    await testRateLimiting();
    await delay(TEST_CONFIG.delay);
    
    await testSecurityHeaders();
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate report
  log('\n📊 TEST RESULTS SUMMARY');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Duration: ${duration}s`);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  // Save detailed results
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
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { runAllTests, testResults };

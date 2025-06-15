#!/usr/bin/env node

/**
 * Security Testing Script for GearGrab
 * 
 * This script performs basic security tests on the application
 * Run with: node scripts/security-test.js
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: process.env.TEST_URL || 'http://localhost:5173',
  timeout: 5000
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Make HTTP request
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test helper
 */
function test(name, testFn) {
  return testFn()
    .then(() => {
      results.passed++;
      results.tests.push({ name, status: 'PASS' });
      console.log(`✅ ${name}`);
    })
    .catch((error) => {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    });
}

/**
 * Security Headers Tests
 */
async function testSecurityHeaders() {
  const url = new URL(config.baseUrl);
  const response = await makeRequest({
    hostname: url.hostname,
    port: url.port,
    path: '/',
    method: 'GET',
    protocol: url.protocol
  });
  
  const requiredHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'x-xss-protection'
  ];
  
  for (const header of requiredHeaders) {
    if (!response.headers[header]) {
      throw new Error(`Missing security header: ${header}`);
    }
  }
  
  // Check CSP header in production-like environment
  if (config.baseUrl.includes('https')) {
    if (!response.headers['content-security-policy']) {
      throw new Error('Missing Content-Security-Policy header');
    }
  }
}

/**
 * API Authentication Tests
 */
async function testAPIAuthentication() {
  const url = new URL('/api/bookings', config.baseUrl);
  
  const response = await makeRequest({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    protocol: url.protocol
  });
  
  if (response.statusCode !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${response.statusCode}`);
  }
  
  const body = JSON.parse(response.body);
  if (!body.error) {
    throw new Error('Expected error message in response');
  }
}

/**
 * Input Validation Tests
 */
async function testInputValidation() {
  const url = new URL('/api/bookings', config.baseUrl);
  
  // Test with malicious payload
  const maliciousPayload = {
    listingId: '<script>alert("xss")</script>',
    amount: -1000,
    startDate: 'invalid-date',
    endDate: null
  };
  
  const response = await makeRequest({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    protocol: url.protocol,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(maliciousPayload)
  });
  
  // Should return 401 (unauthorized) or 400 (validation error)
  if (response.statusCode !== 401 && response.statusCode !== 400) {
    throw new Error(`Expected 401 or 400, got ${response.statusCode}`);
  }
}

/**
 * Rate Limiting Tests
 */
async function testRateLimiting() {
  const url = new URL('/api/health', config.baseUrl);
  
  // Make multiple rapid requests
  const requests = [];
  for (let i = 0; i < 10; i++) {
    requests.push(makeRequest({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      protocol: url.protocol
    }));
  }
  
  const responses = await Promise.all(requests);
  
  // In production, some requests should be rate limited
  if (config.baseUrl.includes('https')) {
    const rateLimited = responses.some(r => r.statusCode === 429);
    if (!rateLimited) {
      console.warn('⚠️  Rate limiting may not be active');
    }
  }
}

/**
 * Health Check Tests
 */
async function testHealthCheck() {
  const url = new URL('/api/health', config.baseUrl);
  
  const response = await makeRequest({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    protocol: url.protocol
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Health check failed with status ${response.statusCode}`);
  }
  
  const body = JSON.parse(response.body);
  if (!body.status || !body.timestamp) {
    throw new Error('Invalid health check response format');
  }
}

/**
 * CORS Tests
 */
async function testCORS() {
  const url = new URL('/api/health', config.baseUrl);
  
  const response = await makeRequest({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'OPTIONS',
    protocol: url.protocol,
    headers: {
      'Origin': 'https://malicious-site.com',
      'Access-Control-Request-Method': 'POST'
    }
  });
  
  // Should not allow arbitrary origins
  const allowOrigin = response.headers['access-control-allow-origin'];
  if (allowOrigin === '*' || allowOrigin === 'https://malicious-site.com') {
    throw new Error('CORS policy too permissive');
  }
}

/**
 * Run all security tests
 */
async function runSecurityTests() {
  console.log('🔒 Running Security Tests for GearGrab\n');
  console.log(`Testing: ${config.baseUrl}\n`);
  
  await test('Security Headers', testSecurityHeaders);
  await test('API Authentication', testAPIAuthentication);
  await test('Input Validation', testInputValidation);
  await test('Rate Limiting', testRateLimiting);
  await test('Health Check', testHealthCheck);
  await test('CORS Policy', testCORS);
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n🚨 Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
    
    process.exit(1);
  } else {
    console.log('\n🎉 All security tests passed!');
  }
}

// Run tests if called directly
if (require.main === module) {
  runSecurityTests().catch(error => {
    console.error('❌ Security test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runSecurityTests };

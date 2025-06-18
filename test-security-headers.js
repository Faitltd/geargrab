#!/usr/bin/env node

/**
 * Security Headers Validation Script
 * Tests CSP and other security headers in real HTTP responses
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import { URL } from 'url';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

// Security headers to check
const SECURITY_HEADERS = {
  'content-security-policy': {
    name: 'Content Security Policy (CSP)',
    required: true,
    description: 'Prevents XSS and other injection attacks'
  },
  'x-frame-options': {
    name: 'X-Frame-Options',
    required: true,
    description: 'Prevents clickjacking attacks'
  },
  'x-content-type-options': {
    name: 'X-Content-Type-Options',
    required: true,
    description: 'Prevents MIME type sniffing'
  },
  'x-xss-protection': {
    name: 'X-XSS-Protection',
    required: true,
    description: 'Enables XSS filtering in browsers'
  },
  'referrer-policy': {
    name: 'Referrer Policy',
    required: true,
    description: 'Controls referrer information sent with requests'
  },
  'permissions-policy': {
    name: 'Permissions Policy',
    required: false,
    description: 'Controls browser feature permissions'
  },
  'strict-transport-security': {
    name: 'HTTP Strict Transport Security (HSTS)',
    required: false, // Only for HTTPS
    description: 'Enforces HTTPS connections'
  },
  'expect-ct': {
    name: 'Expect-CT',
    required: false,
    description: 'Certificate Transparency monitoring'
  }
};

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
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        ok: false,
        status: 0,
        statusText: error.message,
        headers: {},
        data: ''
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ok: false,
        status: 0,
        statusText: 'Request timeout',
        headers: {},
        data: ''
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test 1: Check security headers on main page
async function testMainPageHeaders() {
  log('Testing security headers on main page...');
  
  const response = await makeRequest(BASE_URL);
  const headers = response.headers;
  
  let headerCount = 0;
  let missingHeaders = [];
  
  for (const [headerName, headerInfo] of Object.entries(SECURITY_HEADERS)) {
    if (headers[headerName]) {
      headerCount++;
      log(`${headerInfo.name}: ${headers[headerName]}`, 'debug');
    } else if (headerInfo.required) {
      missingHeaders.push(headerInfo.name);
    }
  }
  
  const hasBasicSecurity = headerCount >= 3; // At least 3 security headers
  
  addTestResult(
    'Main Page Security Headers',
    hasBasicSecurity,
    hasBasicSecurity ? 
      `${headerCount} security headers present` : 
      `Missing headers: ${missingHeaders.join(', ')}`
  );
  
  return { headers, headerCount, missingHeaders };
}

// Test 2: Check security headers on API endpoints
async function testAPIEndpointHeaders() {
  log('Testing security headers on API endpoints...');
  
  const apiEndpoints = [
    '/api/auth/test',
    '/api/auth/session'
  ];
  
  let allEndpointsSecure = true;
  const endpointResults = [];
  
  for (const endpoint of apiEndpoints) {
    const response = await makeRequest(`${BASE_URL}${endpoint}`, {
      method: 'GET'
    });
    
    const headers = response.headers;
    let headerCount = 0;
    let missingHeaders = [];
    
    for (const [headerName, headerInfo] of Object.entries(SECURITY_HEADERS)) {
      if (headers[headerName]) {
        headerCount++;
      } else if (headerInfo.required) {
        missingHeaders.push(headerInfo.name);
      }
    }
    
    const isSecure = headerCount >= 4; // API endpoints should have more headers
    if (!isSecure) {
      allEndpointsSecure = false;
    }
    
    endpointResults.push({
      endpoint,
      headerCount,
      missingHeaders,
      isSecure,
      status: response.status
    });
    
    log(`${endpoint}: ${headerCount} headers, status: ${response.status}`, 'debug');
  }
  
  addTestResult(
    'API Endpoint Security Headers',
    allEndpointsSecure,
    allEndpointsSecure ? 
      'All API endpoints have proper security headers' : 
      'Some API endpoints missing security headers'
  );
  
  return endpointResults;
}

// Test 3: Validate CSP directive syntax
async function testCSPSyntax() {
  log('Testing CSP directive syntax...');
  
  const response = await makeRequest(`${BASE_URL}/api/auth/test`);
  const csp = response.headers['content-security-policy'];
  
  if (!csp) {
    addTestResult('CSP Syntax Validation', false, 'CSP header not found');
    return false;
  }
  
  // Parse CSP directives
  const directives = csp.split(';').map(d => d.trim()).filter(d => d);
  const parsedDirectives = {};
  
  for (const directive of directives) {
    const [name, ...values] = directive.split(/\s+/);
    parsedDirectives[name] = values;
  }
  
  // Check for common CSP directives
  const requiredDirectives = ['default-src', 'script-src', 'style-src'];
  const missingDirectives = requiredDirectives.filter(d => !parsedDirectives[d]);
  
  const hasValidSyntax = missingDirectives.length === 0;
  
  addTestResult(
    'CSP Syntax Validation',
    hasValidSyntax,
    hasValidSyntax ? 
      `CSP has ${Object.keys(parsedDirectives).length} directives` : 
      `Missing directives: ${missingDirectives.join(', ')}`
  );
  
  return { csp, parsedDirectives, missingDirectives };
}

// Test 4: Check for insecure CSP values
async function testCSPSecurity() {
  log('Testing CSP security configuration...');
  
  const response = await makeRequest(`${BASE_URL}/api/auth/test`);
  const csp = response.headers['content-security-policy'];
  
  if (!csp) {
    addTestResult('CSP Security Check', false, 'CSP header not found');
    return false;
  }
  
  // Check for insecure values
  const insecurePatterns = [
    { pattern: /unsafe-eval/, severity: 'high', description: 'unsafe-eval allows dangerous code execution' },
    { pattern: /\*/, severity: 'medium', description: 'Wildcard (*) allows any source' },
    { pattern: /data:/, severity: 'low', description: 'data: URIs can be used for XSS' },
    { pattern: /unsafe-inline/, severity: 'medium', description: 'unsafe-inline allows inline scripts/styles' }
  ];
  
  const securityIssues = [];
  for (const { pattern, severity, description } of insecurePatterns) {
    if (pattern.test(csp)) {
      securityIssues.push({ severity, description });
    }
  }
  
  const isSecure = securityIssues.filter(i => i.severity === 'high').length === 0;
  
  addTestResult(
    'CSP Security Check',
    isSecure,
    isSecure ? 
      `CSP is secure (${securityIssues.length} minor issues)` : 
      `CSP has security issues: ${securityIssues.map(i => i.description).join(', ')}`
  );
  
  return { securityIssues, isSecure };
}

// Test 5: Validate other security headers
async function testOtherSecurityHeaders() {
  log('Testing other security headers configuration...');
  
  const response = await makeRequest(`${BASE_URL}/api/auth/test`);
  const headers = response.headers;
  
  const headerTests = [
    {
      name: 'X-Frame-Options',
      header: 'x-frame-options',
      validValues: ['DENY', 'SAMEORIGIN'],
      test: (value) => ['DENY', 'SAMEORIGIN'].includes(value.toUpperCase())
    },
    {
      name: 'X-Content-Type-Options',
      header: 'x-content-type-options',
      validValues: ['nosniff'],
      test: (value) => value.toLowerCase() === 'nosniff'
    },
    {
      name: 'X-XSS-Protection',
      header: 'x-xss-protection',
      validValues: ['1; mode=block', '0'],
      test: (value) => ['1; mode=block', '0'].includes(value.toLowerCase())
    },
    {
      name: 'Referrer-Policy',
      header: 'referrer-policy',
      validValues: ['strict-origin-when-cross-origin', 'strict-origin', 'no-referrer'],
      test: (value) => ['strict-origin-when-cross-origin', 'strict-origin', 'no-referrer'].includes(value.toLowerCase())
    }
  ];
  
  let validHeaders = 0;
  const headerResults = [];
  
  for (const headerTest of headerTests) {
    const value = headers[headerTest.header];
    const isValid = value && headerTest.test(value);
    
    if (isValid) {
      validHeaders++;
    }
    
    headerResults.push({
      name: headerTest.name,
      value: value || 'missing',
      isValid,
      validValues: headerTest.validValues
    });
    
    log(`${headerTest.name}: ${value || 'missing'} ${isValid ? '✅' : '❌'}`, 'debug');
  }
  
  const allValid = validHeaders === headerTests.length;
  
  addTestResult(
    'Security Headers Configuration',
    allValid,
    `${validHeaders}/${headerTests.length} headers properly configured`
  );
  
  return headerResults;
}

// Test 6: Check CORS configuration
async function testCORSConfiguration() {
  log('Testing CORS configuration...');
  
  const response = await makeRequest(`${BASE_URL}/api/auth/test`);
  const corsHeader = response.headers['access-control-allow-origin'];
  
  // Check if CORS is too permissive
  const isTooPermissive = corsHeader === '*';
  const isSecure = !isTooPermissive || process.env.NODE_ENV === 'development';
  
  addTestResult(
    'CORS Configuration',
    isSecure,
    isTooPermissive ? 
      'CORS allows all origins (*) - acceptable for development' : 
      `CORS origin: ${corsHeader || 'not set'}`
  );
  
  return { corsHeader, isTooPermissive };
}

// Main test runner
async function runSecurityHeaderTests() {
  log('🔒 Starting Security Headers Validation');
  log(`Testing against: ${BASE_URL}`);
  
  const startTime = Date.now();
  
  try {
    // Check if server is running
    const serverCheck = await makeRequest(BASE_URL);
    if (!serverCheck.ok) {
      log('Server is not running. Please start the development server first.', 'error');
      return;
    }
    
    log('Server is running, starting security header tests...', 'success');
    
    // Run all tests
    const mainPageResults = await testMainPageHeaders();
    const apiEndpointResults = await testAPIEndpointHeaders();
    const cspSyntaxResults = await testCSPSyntax();
    const cspSecurityResults = await testCSPSecurity();
    const otherHeaderResults = await testOtherSecurityHeaders();
    const corsResults = await testCORSConfiguration();
    
    // Generate comprehensive report
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    log('🔒 SECURITY HEADERS VALIDATION SUMMARY');
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
    
    // Save comprehensive results
    const reportPath = 'security-headers-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        duration: duration,
        successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
      },
      results: {
        mainPage: mainPageResults,
        apiEndpoints: apiEndpointResults,
        cspSyntax: cspSyntaxResults,
        cspSecurity: cspSecurityResults,
        otherHeaders: otherHeaderResults,
        cors: corsResults
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
  runSecurityHeaderTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { runSecurityHeaderTests, testResults };

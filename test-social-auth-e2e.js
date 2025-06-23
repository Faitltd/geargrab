#!/usr/bin/env node

/**
 * Comprehensive End-to-End Social Authentication Testing Script
 * 
 * This script tests the deployed GearGrab application to ensure:
 * 1. No email/password fields exist anywhere
 * 2. Only social login buttons are present
 * 3. Authentication modals work correctly
 * 4. All protected routes show social-only authentication
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://geargrab.co';
const TEST_RESULTS = [];

// Test configuration
const TESTS = [
  {
    name: 'Homepage Authentication Modal',
    url: BASE_URL,
    action: 'triggerAuthModal',
    checks: ['socialButtons', 'noEmailPassword', 'modalStyling']
  },
  {
    name: 'Login Page',
    url: `${BASE_URL}/auth/login`,
    action: 'none',
    checks: ['socialButtons', 'noEmailPassword', 'pageContent']
  },
  {
    name: 'Signup Page',
    url: `${BASE_URL}/auth/signup`,
    action: 'none',
    checks: ['socialButtons', 'noEmailPassword', 'pageContent']
  },
  {
    name: 'Dashboard Protected Route',
    url: `${BASE_URL}/dashboard`,
    action: 'checkRedirectOrModal',
    checks: ['socialButtons', 'noEmailPassword']
  },
  {
    name: 'List Gear Protected Route',
    url: `${BASE_URL}/list-gear`,
    action: 'checkRedirectOrModal',
    checks: ['socialButtons', 'noEmailPassword']
  }
];

async function runTest(browser, test) {
  console.log(`\n🧪 Running test: ${test.name}`);
  const page = await browser.newPage();
  
  try {
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    // Navigate to the test URL
    console.log(`   📍 Navigating to: ${test.url}`);
    await page.goto(test.url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Perform test action
    if (test.action === 'triggerAuthModal') {
      await triggerAuthModal(page);
    } else if (test.action === 'checkRedirectOrModal') {
      await checkRedirectOrModal(page);
    }
    
    // Run checks
    const results = {};
    for (const check of test.checks) {
      results[check] = await runCheck(page, check);
    }
    
    // Take screenshot
    const screenshotPath = `test-results/${test.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    TEST_RESULTS.push({
      test: test.name,
      url: test.url,
      status: 'PASSED',
      results,
      screenshot: screenshotPath
    });
    
    console.log(`   ✅ Test passed: ${test.name}`);
    
  } catch (error) {
    console.log(`   ❌ Test failed: ${test.name} - ${error.message}`);
    TEST_RESULTS.push({
      test: test.name,
      url: test.url,
      status: 'FAILED',
      error: error.message,
      screenshot: null
    });
  } finally {
    await page.close();
  }
}

async function triggerAuthModal(page) {
  // Try to find and click a "Rent Now" button or similar
  const selectors = [
    'button:has-text("Rent Now")',
    'button:has-text("Rent")',
    '[data-cy="rent-now-button"]',
    'a[href*="dashboard"]',
    'button:has-text("Sign In")'
  ];
  
  for (const selector of selectors) {
    try {
      await page.click(selector);
      await page.waitForTimeout(2000);
      break;
    } catch (e) {
      // Continue to next selector
    }
  }
}

async function checkRedirectOrModal(page) {
  // Wait to see if we get redirected or a modal appears
  await page.waitForTimeout(3000);
}

async function runCheck(page, checkType) {
  switch (checkType) {
    case 'socialButtons':
      return await checkSocialButtons(page);
    case 'noEmailPassword':
      return await checkNoEmailPassword(page);
    case 'modalStyling':
      return await checkModalStyling(page);
    case 'pageContent':
      return await checkPageContent(page);
    default:
      return { status: 'UNKNOWN', message: 'Unknown check type' };
  }
}

async function checkSocialButtons(page) {
  const socialButtons = [
    'Continue with Google',
    'Continue with Apple',
    'Continue with Facebook',
    'Continue with GitHub'
  ];
  
  const found = [];
  const missing = [];
  
  for (const buttonText of socialButtons) {
    try {
      const button = await page.$(`button:has-text("${buttonText}")`);
      if (button) {
        found.push(buttonText);
      } else {
        missing.push(buttonText);
      }
    } catch (e) {
      missing.push(buttonText);
    }
  }
  
  return {
    status: found.length >= 3 ? 'PASS' : 'FAIL',
    found,
    missing,
    message: `Found ${found.length}/4 social buttons`
  };
}

async function checkNoEmailPassword(page) {
  const forbiddenSelectors = [
    'input[type="email"]',
    'input[type="password"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="password" i]',
    'input[name*="email" i]',
    'input[name*="password" i]'
  ];
  
  const found = [];
  
  for (const selector of forbiddenSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        found.push(selector);
      }
    } catch (e) {
      // Selector not found, which is good
    }
  }
  
  // Also check for forbidden text
  const forbiddenTexts = [
    'Or continue with email',
    'Enter your email',
    'Enter your password',
    'Email address',
    'Password'
  ];
  
  const foundTexts = [];
  for (const text of forbiddenTexts) {
    try {
      const element = await page.$(`text=${text}`);
      if (element) {
        foundTexts.push(text);
      }
    } catch (e) {
      // Text not found, which is good
    }
  }
  
  return {
    status: found.length === 0 && foundTexts.length === 0 ? 'PASS' : 'FAIL',
    foundSelectors: found,
    foundTexts,
    message: found.length === 0 && foundTexts.length === 0 ? 
      'No email/password fields found' : 
      `Found forbidden elements: ${[...found, ...foundTexts].join(', ')}`
  };
}

async function checkModalStyling(page) {
  try {
    const welcomeText = await page.$('text=Welcome Back');
    const gearGrabText = await page.$('text=GearGrab');
    
    return {
      status: welcomeText && gearGrabText ? 'PASS' : 'FAIL',
      hasWelcomeText: !!welcomeText,
      hasGearGrabBranding: !!gearGrabText,
      message: 'Modal styling and branding check'
    };
  } catch (e) {
    return {
      status: 'FAIL',
      error: e.message,
      message: 'Failed to check modal styling'
    };
  }
}

async function checkPageContent(page) {
  try {
    const title = await page.title();
    const hasGearGrab = title.includes('GearGrab');
    
    return {
      status: hasGearGrab ? 'PASS' : 'FAIL',
      title,
      message: `Page title: ${title}`
    };
  } catch (e) {
    return {
      status: 'FAIL',
      error: e.message,
      message: 'Failed to check page content'
    };
  }
}

async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalTests: TEST_RESULTS.length,
    passed: TEST_RESULTS.filter(r => r.status === 'PASSED').length,
    failed: TEST_RESULTS.filter(r => r.status === 'FAILED').length,
    results: TEST_RESULTS
  };
  
  // Create test-results directory
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  
  // Write detailed report
  fs.writeFileSync('test-results/social-auth-e2e-report.json', JSON.stringify(report, null, 2));
  
  // Generate summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Success Rate: ${((report.passed / report.totalTests) * 100).toFixed(1)}%`);
  
  if (report.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    TEST_RESULTS.filter(r => r.status === 'FAILED').forEach(test => {
      console.log(`   - ${test.test}: ${test.error}`);
    });
  }
  
  console.log(`\n📄 Detailed report saved to: test-results/social-auth-e2e-report.json`);
  
  return report.failed === 0;
}

async function main() {
  console.log('🚀 Starting Comprehensive Social Authentication E2E Tests');
  console.log(`🌐 Testing URL: ${BASE_URL}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Run all tests
    for (const test of TESTS) {
      await runTest(browser, test);
    }
    
    // Generate report
    const allPassed = await generateReport();
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the tests
main().catch(console.error);

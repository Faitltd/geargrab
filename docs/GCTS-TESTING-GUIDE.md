# GearGrab Comprehensive Test Suite (GCTS) - Testing Guide

## 🎯 Overview

The **GearGrab Comprehensive Test Suite (GCTS)** is a dual-phase testing system that validates both authentication and transaction flows with automatic error correction and comprehensive reporting.

### What It Tests

**Phase 1: Authentication System** 🔐
- Firebase authentication integration
- Social login providers (Google, Apple, Facebook, GitHub)
- JWT token management and validation
- User session management

**Phase 2: Transaction Flow** 💳
- Payment intent creation and processing
- Booking system with authentication
- Stripe integration validation
- End-to-end transaction security

### Key Features

✅ **Sequential test execution** with automatic corrections  
✅ **Comprehensive error analysis** and reporting  
✅ **Production-ready validation**  
✅ **Real-time progress monitoring**  
✅ **Detailed failure diagnostics**  
✅ **Automatic retry mechanism** (up to 3 attempts)  
✅ **Phase-by-phase results** tracking  

## 🚀 How to Run the Tests

### Quick Start Commands

```bash
# Run the comprehensive test suite (recommended)
npm run test:comprehensive

# Alternative command (same functionality)
npm run test:gcts

# Run with verbose output
npm run test:comprehensive 2>&1 | tee test-output.log
```

### Manual Execution

```bash
# Direct execution
node scripts/geargrab-comprehensive-test-suite.js

# With permissions
chmod +x scripts/geargrab-comprehensive-test-suite.js
./scripts/geargrab-comprehensive-test-suite.js
```

## 📊 Understanding the Output

### Real-Time Progress

The test suite provides real-time feedback with color-coded messages:

```
[12:34:56] 🚀 Starting GearGrab Comprehensive Test Suite (GCTS)
[12:34:56] 🎯 Dual-Phase Testing: Authentication + Transaction Flow
[12:34:56] 📊 Attempt 1/3

[12:34:57] 🔐 PHASE 1: Authentication System Testing
[12:34:57] 🧪 Running Firebase Authentication Integration...
[12:34:58] ✅ Firebase Authentication Integration - PASSED
[12:34:58] 🧪 Running Social Login Providers...
[12:34:59] ✅ Social Login Providers - PASSED

[12:35:00] 💳 PHASE 2: Transaction Flow Testing
[12:35:00] 🧪 Running Payment Intent API Security...
[12:35:01] ✅ Payment Intent API Security - PASSED
[12:35:01] 🧪 Running Booking API Authentication...
[12:35:02] ✅ Booking API Authentication - PASSED
```

### Final Results Summary

```
🎯 GEARGRAB COMPREHENSIVE TEST SUITE - FINAL RESULTS
=========================================================
📊 Overall Status: PRODUCTION_READY
🔄 Attempt: 1/3
⏱️  Duration: 45s

🔐 AUTHENTICATION PHASE:
   ✅ Passed: 3/3
   ❌ Failed: 0/3

💳 TRANSACTION PHASE:
   ✅ Passed: 3/3
   ❌ Failed: 0/3

🔧 Corrections Applied: 0
📄 Full report: /path/to/test-results/gcts-comprehensive-report.json
🚀 SYSTEM READY FOR PRODUCTION!
```

## 📋 Test Status Meanings

### Overall Status Indicators

| Status | Meaning | Action Required |
|--------|---------|----------------|
| `PRODUCTION_READY` | ✅ All critical tests pass (≥80% success rate) | None - deploy with confidence |
| `PARTIAL_SUCCESS` | ⚠️ Some tests pass, others need attention | Review failed tests before deployment |
| `NEEDS_ATTENTION` | ❌ Multiple critical failures | Fix issues before deployment |

### Individual Test Results

| Symbol | Meaning |
|--------|---------|
| ✅ | Test passed successfully |
| ❌ | Test failed |
| 🔧 | Automatic correction applied |
| ⚠️ | Warning or non-critical issue |

## 📁 Generated Reports

### Report Location
```
test-results/gcts-comprehensive-report.json
```

### Report Contents
- **Summary**: Overall test statistics and status
- **Phase Results**: Detailed breakdown by authentication and transaction phases
- **Test Results**: Individual test outcomes with timestamps
- **Corrections**: Automatic fixes applied during testing
- **Recommendations**: Suggested actions for failed tests

### Sample Report Structure
```json
{
  "testSuite": "GearGrab Comprehensive Test Suite (GCTS)",
  "version": "1.0.0",
  "summary": {
    "attempt": 1,
    "totalTests": 6,
    "passed": 6,
    "failed": 0,
    "duration": 45000,
    "status": "PRODUCTION_READY"
  },
  "phaseResults": {
    "authentication": { "passed": 3, "failed": 0, "total": 3 },
    "transaction": { "passed": 3, "failed": 0, "total": 3 }
  }
}
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Tests Failing
```bash
# Check Firebase configuration
npm run setup:firebase

# Verify environment variables
echo $VITE_FIREBASE_API_KEY
echo $VITE_FIREBASE_PROJECT_ID
```

#### 2. Transaction Tests Failing
```bash
# Test API endpoints manually
curl https://geargrab.co/api/payments/create-intent
curl https://geargrab.co/api/book
```

#### 3. Network/Timeout Issues
```bash
# Run with increased timeout
GCTS_TIMEOUT=180000 npm run test:comprehensive
```

#### 4. Permission Issues
```bash
# Fix script permissions
chmod +x scripts/geargrab-comprehensive-test-suite.js
```

## 🎯 When to Run These Tests

### Before Deployment
- **Always run** before pushing to production
- **Required** for release validation
- **Recommended** after major authentication changes

### During Development
- After modifying authentication system
- After updating payment processing
- After changing API endpoints
- Before creating pull requests

### Continuous Integration
```yaml
# Example GitHub Actions workflow
- name: Run Comprehensive Tests
  run: npm run test:comprehensive
```

## 📝 Notes and Best Practices

### Test Environment Requirements
- **Node.js** 18+ required
- **Internet connection** for API testing
- **Firebase project** properly configured
- **Stripe keys** available in environment

### Performance Considerations
- Tests run sequentially for accuracy
- Average execution time: 30-60 seconds
- Automatic retry on failures (up to 3 attempts)
- Timeout protection prevents hanging

### Security Notes
- Tests use production API endpoints
- No sensitive data is logged
- Authentication tokens are mocked in unit tests
- Real API calls are read-only where possible

## 🚀 Advanced Usage

### Custom Configuration
```bash
# Set custom timeout (in milliseconds)
GCTS_TIMEOUT=120000 npm run test:comprehensive

# Set custom retry attempts
GCTS_MAX_ATTEMPTS=5 npm run test:comprehensive

# Enable debug mode
DEBUG=true npm run test:comprehensive
```

### Integration with CI/CD
```bash
# Exit with error code on failure
npm run test:comprehensive || exit 1

# Generate JUnit XML report
npm run test:comprehensive --reporter=junit
```

## 📞 Support

If you encounter issues with the test suite:

1. **Check the generated report** in `test-results/gcts-comprehensive-report.json`
2. **Review the console output** for specific error messages
3. **Verify environment configuration** (Firebase, Stripe, etc.)
4. **Run individual test phases** to isolate issues

The GCTS is designed to be self-diagnosing and will provide specific recommendations for any failures encountered.

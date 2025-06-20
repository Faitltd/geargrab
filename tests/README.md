# Authentication Test Suite

Comprehensive testing framework for the GearGrab authentication system, including unit tests, integration tests, and end-to-end tests.

## 🧪 Test Structure

```
tests/
├── auth/
│   ├── simple-auth.test.ts          # Core authentication logic tests
│   ├── auth-database.test.ts        # Database operations tests
│   └── auth-security.test.ts        # Security and validation tests
├── setup.ts                         # Jest test configuration
└── README.md                        # This file

cypress/
├── e2e/auth/
│   ├── social-login-flow.cy.ts      # Social login E2E tests
│   ├── auth-security.cy.ts          # Security validation tests
│   └── auth-performance.cy.ts       # Performance tests
├── fixtures/auth/                   # Test data fixtures
├── support/
│   ├── auth-commands.ts             # Custom authentication commands
│   └── e2e.ts                       # Global E2E configuration
└── cypress.config.ts                # Cypress configuration
```

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:auth:all
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test:auth:unit

# E2E tests only  
npm run test:auth:e2e

# Coverage report
npm run test:unit:coverage

# Watch mode for development
npm run test:unit:watch
```

## 🧪 Unit Tests (Jest)

### Coverage Requirements
- **Authentication Module**: 90% coverage (statements, branches, functions, lines)
- **Global Minimum**: 80% coverage
- **Database Operations**: 85% coverage

### Test Categories

#### 1. Password Security Tests
```typescript
describe('Password Hashing with bcrypt', () => {
  it('should hash passwords securely');
  it('should verify passwords correctly');
  it('should reject invalid passwords');
});
```

#### 2. JWT Token Tests
```typescript
describe('JWT Token Management', () => {
  it('should create JWT tokens correctly');
  it('should validate JWT tokens correctly');
  it('should reject invalid JWT tokens');
  it('should reject expired JWT tokens');
});
```

#### 3. Social Authentication Tests
```typescript
describe('Social Authentication', () => {
  it('should handle Google sign-in successfully');
  it('should handle Apple sign-in successfully');
  it('should handle Facebook sign-in successfully');
  it('should handle GitHub sign-in successfully');
});
```

#### 4. Database Operations Tests
```typescript
describe('Authentication Database Operations', () => {
  it('should create user profile in database');
  it('should retrieve user profile from database');
  it('should handle non-existent user profile');
  it('should update user profile');
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run authentication tests only
npm run test:auth:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode for development
npm run test:unit:watch

# CI mode (no watch, with coverage)
npm run test:unit:ci
```

## 🌐 E2E Tests (Cypress)

### Test Scenarios

#### 1. Social Login Flow
- ✅ Modal display and styling
- ✅ Google, Apple, Facebook, GitHub authentication
- ✅ Error handling (popup blocked, network errors)
- ✅ Authentication state persistence
- ✅ Token expiration handling

#### 2. Security Validation
- ✅ CORS headers verification
- ✅ Cookie security flags (httpOnly, secure, sameSite)
- ✅ JWT token structure validation
- ✅ Protected endpoint access control

#### 3. User Experience
- ✅ Login modal interactions
- ✅ Logout flow
- ✅ Redirect after authentication
- ✅ Error message display

### Running E2E Tests

```bash
# Run E2E tests headlessly
npm run test:auth:e2e

# Open Cypress Test Runner
npm run cypress:open

# Run all Cypress tests
npm run cypress:run

# Run specific test file
npx cypress run --spec "cypress/e2e/auth/social-login-flow.cy.ts"
```

### Custom Cypress Commands

```typescript
// Login via social provider
cy.loginViaUI('google');

// Check authentication state
cy.checkAuthState('authenticated');

// Verify JWT token
cy.verifyJWTToken(token);

// Check CORS headers
cy.checkCORSHeaders('/api/auth/login');

// Verify cookie security
cy.verifyCookieFlags('auth-token', ['httpOnly', 'secure']);

// Access protected endpoint
cy.accessProtectedEndpoint('/api/user/profile');
```

## 🔒 Security Testing

### Security Test Coverage
- ✅ Password hashing with bcrypt (salt rounds: 12)
- ✅ JWT token validation and expiration
- ✅ CORS configuration
- ✅ Cookie security flags
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection

### Security Commands
```bash
# Run security audit
npm run security:audit

# Run security tests
npm run security:test

# Check for vulnerabilities
npm audit --audit-level moderate
```

## 📊 Coverage Reports

### Viewing Coverage
```bash
# Generate coverage report
npm run test:unit:coverage

# Open coverage report in browser
open coverage/lcov-report/index.html
```

### Coverage Thresholds
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  'src/lib/auth/simple-auth.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

## 🛠️ Test Configuration

### Jest Configuration
- **Environment**: Node.js
- **TypeScript**: ts-jest preset
- **Mocking**: Firebase, bcrypt, JWT
- **Coverage**: LCOV and HTML reports
- **Timeout**: 10 seconds

### Cypress Configuration
- **Base URL**: http://localhost:5173
- **Viewport**: 1280x720
- **Video**: Enabled
- **Screenshots**: On failure
- **Timeout**: 10 seconds

## 🔧 Development Workflow

### Adding New Tests

1. **Unit Tests**: Add to `tests/auth/`
2. **E2E Tests**: Add to `cypress/e2e/auth/`
3. **Fixtures**: Add test data to `cypress/fixtures/auth/`
4. **Commands**: Add custom commands to `cypress/support/auth-commands.ts`

### Test Data Management
- Use fixtures for consistent test data
- Mock external services (Firebase, social providers)
- Clean up test data after each test

### Debugging Tests

```bash
# Debug Jest tests
npm run test:unit:watch

# Debug Cypress tests
npm run cypress:open

# View test logs
tail -f cypress/logs/test.log
```

## 📈 Performance Testing

### Metrics Tracked
- Authentication response time
- Token validation speed
- Database query performance
- Social login popup time

### Performance Commands
```bash
# Run performance tests
npm run test:performance

# Generate performance report
npm run test:performance:report
```

## 🚨 Troubleshooting

### Common Issues

1. **Tests failing locally**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Cypress tests timing out**
   ```bash
   # Increase timeout in cypress.config.ts
   defaultCommandTimeout: 15000
   ```

3. **Coverage below threshold**
   ```bash
   # Check uncovered lines
   npm run test:unit:coverage
   open coverage/lcov-report/index.html
   ```

### Getting Help
- Check test logs in `cypress/logs/`
- Review coverage reports in `coverage/`
- Run tests in debug mode with `--verbose`

## 📝 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **Mock External Services**: Don't rely on external APIs
4. **Clean Up**: Always clean up test data
5. **Fast Tests**: Keep unit tests under 100ms
6. **Realistic E2E**: Test real user workflows
7. **Security First**: Always test security scenarios

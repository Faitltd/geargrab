# 🔐 Authentication Testing Guide

This comprehensive guide covers the complete authentication testing setup including Jest unit tests for the AuthService and Cypress end-to-end tests for the login flow.

## 🏗️ Testing Architecture

### **Jest Unit Tests**
- **AuthService testing** with database mocking
- **bcrypt password hashing** verification
- **JWT creation and validation** testing
- **Invalid credentials error paths** coverage
- **TypeScript support** with proper type checking
- **Coverage thresholds** enforcement

### **Cypress E2E Tests**
- **Complete login flow** testing
- **Valid and invalid credentials** scenarios
- **Redirect behavior** verification
- **Cookie and session management** testing
- **CORS headers** validation
- **Protected endpoint access** verification

## 🚀 Quick Start

### Installation

```bash
# Install all dependencies
npm install

# Install additional testing dependencies
npm install --save-dev jest @types/jest ts-jest jest-environment-node
npm install --save-dev cypress @types/cypress

# Install authentication dependencies
npm install bcrypt jsonwebtoken
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

### Running Tests

```bash
# Check dependencies
node scripts/run-auth-tests.js check

# Run Jest unit tests only
node scripts/run-auth-tests.js jest --coverage

# Run Cypress e2e tests only
node scripts/run-auth-tests.js cypress

# Run all tests
node scripts/run-auth-tests.js all

# Generate comprehensive report
node scripts/run-auth-tests.js report
```

## 📋 Jest Unit Tests

### **AuthService.test.ts - Core Features**

#### 1. **Login Flow Testing**

```typescript
describe('login', () => {
  it('should login successfully with valid credentials', async () => {
    // Arrange - Mock database and bcrypt
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue('mock_jwt_token');

    // Act - Call login service
    const result = await AuthService.login(validCredentials);

    // Assert - Verify success and token generation
    expect(result.success).toBe(true);
    expect(result.token).toBe('mock_jwt_token');
    expect(result.user.email).toBe('test@example.com');
  });
});
```

#### 2. **Password Hashing with bcrypt**

```typescript
describe('hashPassword', () => {
  it('should hash password with correct rounds', async () => {
    mockBcrypt.hash.mockResolvedValue('hashed_password');

    const result = await AuthService.hashPassword('password123');

    expect(result).toBe('hashed_password');
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
  });
});
```

#### 3. **JWT Token Validation**

```typescript
describe('validateToken', () => {
  it('should validate valid token', () => {
    const mockPayload = {
      userId: 'user_123',
      email: 'test@example.com',
      role: 'USER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    mockJwt.verify.mockReturnValue(mockPayload);

    const result = AuthService.validateToken('valid_token');

    expect(result.valid).toBe(true);
    expect(result.payload).toEqual(mockPayload);
  });
});
```

#### 4. **Invalid Credentials Error Handling**

```typescript
describe('Invalid Credentials', () => {
  it('should throw InvalidCredentialsError for wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(false);

    const result = await AuthService.login(validCredentials);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });
});
```

### **Database Mocking Patterns**

```typescript
// Mock Prisma client
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  loginAttempt: {
    create: jest.fn(),
    deleteMany: jest.fn()
  }
};

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock JWT
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;
```

### **Coverage Thresholds**

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  },
  'src/lib/services/AuthService.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

## 🌐 Cypress E2E Tests

### **login-flow.cy.ts - Core Features**

#### 1. **Valid Credentials Login**

```typescript
it('should login successfully with valid credentials', () => {
  cy.visit('/auth/login');
  
  cy.get('[data-cy="email-input"]').type('test@example.com');
  cy.get('[data-cy="password-input"]').type('password123');
  cy.get('[data-cy="login-button"]').click();
  
  cy.wait('@loginRequest').then((interception) => {
    expect(interception.response?.statusCode).to.equal(200);
    expect(interception.response?.body).to.have.property('success', true);
    expect(interception.response?.body).to.have.property('token');
  });
  
  cy.url().should('include', '/dashboard');
});
```

#### 2. **Invalid Credentials Testing**

```typescript
invalidCredentials.forEach((credentials, index) => {
  it(`should handle invalid credentials case ${index + 1}`, () => {
    cy.visit('/auth/login');
    
    if (credentials.email) {
      cy.get('[data-cy="email-input"]').type(credentials.email);
    }
    if (credentials.password) {
      cy.get('[data-cy="password-input"]').type(credentials.password);
    }
    
    cy.get('[data-cy="login-button"]').click();
    
    cy.get('[data-cy="error-message"]').should('contain', credentials.expectedError);
    cy.url().should('include', '/auth/login');
  });
});
```

#### 3. **Cookie and Session Management**

```typescript
it('should set proper authentication cookies', () => {
  cy.visit('/auth/login');
  cy.get('[data-cy="email-input"]').type('test@example.com');
  cy.get('[data-cy="password-input"]').type('password123');
  cy.get('[data-cy="login-button"]').click();
  
  cy.wait('@loginRequest');
  
  cy.getCookie('__session').should('exist');
  cy.getCookie('__session').then((cookie) => {
    expect(cookie).to.have.property('httpOnly', true);
    expect(cookie).to.have.property('secure', true);
    expect(cookie).to.have.property('sameSite', 'strict');
  });
});
```

#### 4. **Protected Endpoint Access**

```typescript
it('should successfully access protected endpoints after login', () => {
  // Login first
  cy.login('test@example.com', 'password123');
  
  // Test protected endpoint
  cy.request({
    method: 'GET',
    url: '/api/user/profile'
  }).then((response) => {
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('success', true);
    expect(response.body).to.have.property('user');
  });
});
```

#### 5. **CORS Headers Validation**

```typescript
it('should have proper CORS headers', () => {
  cy.request({
    method: 'OPTIONS',
    url: '/api/auth/login',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST'
    }
  }).then((response) => {
    expect(response.headers).to.have.property('access-control-allow-origin');
    expect(response.headers).to.have.property('access-control-allow-methods');
    expect(response.headers).to.have.property('access-control-allow-headers');
  });
});
```

### **Custom Cypress Commands**

```typescript
// cypress/support/auth-commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  cy.wait('@loginRequest');
});

Cypress.Commands.add('loginApi', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  }).then((response) => {
    const token = response.body.token;
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', token);
    });
  });
});
```

## 🔧 Configuration Files

### **Jest Configuration** (`jest.config.js`)

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^\\$lib/(.*)$': '<rootDir>/src/lib/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
};
```

### **Cypress Configuration** (`cypress.config.ts`)

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true
  }
});
```

## 📊 Test Coverage and Reporting

### **Coverage Reports**

```bash
# Generate Jest coverage
npm run test:unit:coverage

# View HTML coverage report
open coverage/lcov-report/index.html

# Generate comprehensive test report
node scripts/run-auth-tests.js report
```

### **Test Metrics**

- **Unit Test Coverage:** 90%+ for AuthService
- **E2E Test Coverage:** Complete login flow scenarios
- **Error Path Coverage:** All invalid credential scenarios
- **Security Testing:** CORS, cookies, session management

## 🛡️ Security Testing Features

### **Authentication Security**
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT token validation and expiration
- ✅ Rate limiting for failed login attempts
- ✅ Account lockout mechanisms
- ✅ Secure cookie configuration

### **CORS and Headers**
- ✅ Proper CORS headers validation
- ✅ Security headers verification
- ✅ Origin validation testing
- ✅ Request/response header validation

### **Session Management**
- ✅ Cookie security flags (httpOnly, secure, sameSite)
- ✅ Session persistence across page refreshes
- ✅ Proper session cleanup on logout
- ✅ Token expiration handling

## 🚨 Error Scenarios Tested

### **Jest Unit Tests**
- Invalid email format
- Missing required fields
- Wrong password
- Non-existent user
- Account locked/inactive
- Database connection errors
- bcrypt hashing errors
- JWT signing/validation errors

### **Cypress E2E Tests**
- Invalid credentials (5 scenarios)
- Rate limiting after multiple failures
- Network request failures
- CORS violations
- Unauthorized endpoint access
- Session expiration
- Redirect behavior

## 📈 Best Practices

1. **Mock External Dependencies** - Database, bcrypt, JWT
2. **Test Error Paths** - Invalid inputs, network failures
3. **Verify Security** - Cookies, headers, CORS
4. **Use Custom Commands** - Reusable Cypress commands
5. **Comprehensive Coverage** - Unit + integration + e2e
6. **Automated Reporting** - Coverage and test reports
7. **CI/CD Integration** - Automated test execution

This testing setup provides comprehensive coverage of the authentication module with both unit and end-to-end testing, ensuring robust security and functionality validation.

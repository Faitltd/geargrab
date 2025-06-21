# GearGrab E2E Testing Suite

This directory contains comprehensive end-to-end tests for the GearGrab application using Cypress.

## 🧪 Test Coverage

Our E2E test suite covers all major user journeys and features:

### Core Functionality Tests
- **Homepage** (`homepage.cy.js`) - Landing page, navigation, hero sections, categories
- **Browse & Search** (`browse.cy.js`) - Gear browsing, filtering, search functionality, pagination
- **Listing Details** (`listing-details.cy.js`) - Product pages, booking forms, image galleries, reviews
- **List Gear Form** (`list-gear.cy.js`) - Multi-step listing creation process, validation, calendar

### User Authentication
- **Authentication Flow** (`authentication.cy.js`) - Login, signup, password reset, social auth, redirects

### Dashboard Features
- **Dashboard** (`dashboard.cy.js`) - Owner/renter dashboards, profile management, messaging, bookings

### Cross-cutting Concerns
- **Responsive Design** (`responsive.cy.js`) - Mobile, tablet, desktop layouts across all pages
- **Integration Tests** (`integration.cy.js`) - Complete end-to-end user journeys and workflows

## 🚀 Quick Start

### Prerequisites

1. **Application Running**: Make sure the GearGrab application is running locally:
   ```bash
   npm run dev
   ```
   The app should be accessible at `http://localhost:5173`

2. **Dependencies**: Ensure all dependencies are installed:
   ```bash
   npm install
   ```

### Running Tests

#### Interactive Mode (Recommended for Development)
```bash
npm run cypress:open
```
This opens the Cypress Test Runner UI where you can:
- Select individual test files to run
- Watch tests run in real-time
- Debug failing tests
- See detailed error messages and screenshots

#### Headless Mode (CI/Production)
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:smoke      # Quick smoke tests
npm run test:core       # Core functionality
npm run test:auth       # Authentication flows
npm run test:dashboard  # Dashboard features
npm run test:responsive # Responsive design
npm run test:integration # Integration tests

# Run tests in parallel
npm run test:parallel

# CI mode (optimized for continuous integration)
npm run test:ci
```

## 📁 Test Structure

```
cypress/
├── e2e/                    # Test files
│   ├── homepage.cy.js      # Homepage tests
│   ├── browse.cy.js        # Browse/search tests
│   ├── listing-details.cy.js # Listing page tests
│   ├── list-gear.cy.js     # List gear form tests
│   ├── authentication.cy.js # Auth flow tests
│   ├── dashboard.cy.js     # Dashboard tests
│   ├── responsive.cy.js    # Responsive design tests
│   └── integration.cy.js   # End-to-end integration tests
├── fixtures/               # Test data
│   ├── listings.json       # Sample listing data
│   ├── users.json          # Sample user data
│   └── bookings.json       # Sample booking data
├── support/                # Support files
│   ├── commands.ts         # Custom Cypress commands
│   └── e2e.ts             # Global configuration
├── scripts/                # Test runner scripts
│   └── run-tests.js        # Advanced test runner
└── cypress.config.js       # Cypress configuration
```

## 🛠️ Custom Commands

We've created custom Cypress commands to make testing more efficient:

```javascript
// Authentication
cy.login('email@example.com', 'password')
cy.mockLogin({ uid: 'test-uid', email: 'test@example.com' })
cy.logout()

// Form interactions
cy.fillListingForm({ title: 'My Tent', category: 'camping' })
cy.searchGear('tent', 'camping', 'Denver')
cy.bookGear('2024-06-15', '2024-06-18')

// Responsive testing
cy.checkResponsive([
  { width: 375, height: 667 },   // Mobile
  { width: 1280, height: 720 }   // Desktop
])

// Accessibility
cy.checkA11y()

// API mocking
cy.mockApiResponse('/api/listings', mockData)
```

## 🎯 Test Categories

### Smoke Tests (`test:smoke`)
Quick tests that verify basic functionality:
- Homepage loads correctly
- Navigation works
- Browse page displays listings
- Critical user flows are functional

### Core Tests (`test:core`)
Comprehensive tests for main features:
- Complete listing creation flow
- Booking process
- Search and filtering
- User interactions

### Authentication Tests (`test:auth`)
User authentication and authorization:
- Login/logout flows
- Registration process
- Password reset
- Protected route access
- Session management

### Dashboard Tests (`test:dashboard`)
User dashboard functionality:
- Owner dashboard (listings, bookings, earnings)
- Renter dashboard (bookings, reviews)
- Profile management
- Messaging system

### Responsive Tests (`test:responsive`)
Cross-device compatibility:
- Mobile layouts (375px, 414px)
- Tablet layouts (768px)
- Desktop layouts (1280px, 1920px)
- Touch interactions
- Mobile navigation

### Integration Tests (`test:integration`)
End-to-end user journeys:
- Complete booking workflow
- Listing creation to booking
- User registration to first booking
- Error handling scenarios

## 🔧 Configuration

### Environment Variables

```bash
# Base URL for testing
CYPRESS_BASE_URL=http://localhost:5173

# Browser selection
CYPRESS_BROWSER=chrome

# Headless mode
CYPRESS_HEADLESS=true

# Video recording
CYPRESS_VIDEO=false

# Screenshots on failure
CYPRESS_SCREENSHOTS=true
```

### Test Data

Test data is stored in `cypress/fixtures/` and includes:
- **listings.json**: Sample gear listings with complete data
- **users.json**: Test user profiles and preferences
- **bookings.json**: Sample booking data with different statuses

## 🚨 Troubleshooting

### Common Issues

1. **Application Not Running**
   ```bash
   Error: connect ECONNREFUSED 127.0.0.1:5173
   ```
   **Solution**: Make sure the app is running with `npm run dev`

2. **TypeScript Errors**
   ```bash
   Cannot find module '@types/cypress'
   ```
   **Solution**: Ensure TypeScript types are installed:
   ```bash
   npm install --save-dev @types/cypress
   ```

3. **Test Timeouts**
   ```bash
   Timed out retrying after 4000ms
   ```
   **Solution**: Increase timeout in `cypress.config.js` or use `cy.wait()`

4. **Element Not Found**
   ```bash
   Element not found: [data-cy="element"]
   ```
   **Solution**: Ensure data-cy attributes are added to components

### Debugging Tips

1. **Use Cypress Debug Mode**
   ```bash
   npm run cypress:open
   ```
   Then click on individual tests to see them run step-by-step

2. **Add Debug Points**
   ```javascript
   cy.debug()  // Pauses test execution
   cy.pause()  // Pauses and opens DevTools
   ```

3. **Screenshot on Failure**
   Screenshots are automatically taken on test failures and saved to `cypress/screenshots/`

4. **Video Recording**
   Enable video recording in `cypress.config.js` for full test runs

## 📊 Reporting

Test results and reports are saved to `cypress/reports/`:
- JSON reports with detailed test results
- Screenshots of failed tests
- Video recordings (if enabled)
- Performance metrics

## 🔄 CI/CD Integration

For continuous integration, use:

```bash
npm run test:ci
```

This runs all tests in headless mode with:
- Chrome browser
- Video recording enabled
- Screenshots on failure
- Optimized for CI environments

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run dev &
      - run: npm run test:ci
```

## 🎯 Best Practices

1. **Use data-cy attributes** for reliable element selection
2. **Keep tests independent** - each test should be able to run in isolation
3. **Use custom commands** for repeated actions
4. **Mock external APIs** to ensure consistent test results
5. **Test user journeys** rather than individual components
6. **Use descriptive test names** that explain what is being tested
7. **Clean up test data** after each test run
8. **Test error scenarios** as well as happy paths

## 🚀 Future Enhancements

- [ ] Visual regression testing with Percy or Applitools
- [ ] Performance testing with Lighthouse CI
- [ ] Cross-browser testing (Firefox, Safari, Edge)
- [ ] Mobile device testing with real devices
- [ ] API testing integration
- [ ] Database seeding for consistent test data
- [ ] Parallel test execution optimization
- [ ] Test result analytics and trends

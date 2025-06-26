/**
 * Test Configuration for GearGrab
 * 
 * Centralized configuration for all testing scenarios
 */

export const testConfig = {
  // Global settings
  global: {
    maxRetries: 2,
    timeout: 30000,
    baseUrl: 'https://geargrab.co',
    localUrl: 'http://localhost:5173',
    delayBetweenTests: 2000,
    generateReports: true,
    autoFix: true
  },

  // Jest configuration
  jest: {
    testTimeout: 10000,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testEnvironment: 'node',
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/server.ts',
      '!src/app.html'
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    }
  },

  // Cypress configuration
  cypress: {
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0
    }
  },

  // Test suites definition
  suites: {
    // Critical path tests (must pass)
    critical: {
      jest: [
        'tests/auth/basic-auth.test.ts',
        'tests/integration/ProductController.test.ts'
      ],
      cypress: [
        'cypress/e2e/homepage.cy.js',
        'cypress/e2e/authentication.cy.js'
      ]
    },

    // Core functionality tests
    core: {
      jest: [
        'tests/unit/**/*.test.ts',
        'tests/integration/**/*.test.ts'
      ],
      cypress: [
        'cypress/e2e/homepage.cy.js',
        'cypress/e2e/browse.cy.js',
        'cypress/e2e/listing-details.cy.js',
        'cypress/e2e/list-gear.cy.js'
      ]
    },

    // Authentication tests
    auth: {
      jest: [
        'tests/auth/**/*.test.ts'
      ],
      cypress: [
        'cypress/e2e/authentication.cy.js',
        'cypress/e2e/auth/**/*.cy.{js,ts}'
      ]
    },

    // Dashboard and user management
    dashboard: {
      jest: [
        'tests/integration/**/*.test.ts'
      ],
      cypress: [
        'cypress/e2e/dashboard.cy.js'
      ]
    },

    // Payment and booking flow
    payment: {
      jest: [
        'tests/integration/**/*.test.ts'
      ],
      cypress: [
        'cypress/e2e/payment-flow.cy.js'
      ]
    },

    // Mobile and responsive tests
    mobile: {
      jest: [],
      cypress: [
        'cypress/e2e/mobile-functionality.cy.{js,ts}',
        'cypress/e2e/responsive.cy.js'
      ]
    },

    // Integration and end-to-end scenarios
    integration: {
      jest: [
        'tests/integration/**/*.test.ts'
      ],
      cypress: [
        'cypress/e2e/integration.cy.js'
      ]
    }
  },

  // Test execution sequences
  sequences: {
    // Quick smoke test
    smoke: [
      { type: 'jest', suite: 'critical', name: 'Critical Unit Tests' },
      { type: 'cypress', suite: 'critical', name: 'Critical E2E Tests' }
    ],

    // Full alternating sequence
    full: [
      { type: 'jest', suite: 'auth', name: 'Authentication Unit Tests' },
      { type: 'cypress', suite: 'core', name: 'Core E2E Tests' },
      { type: 'jest', suite: 'core', name: 'Core Unit Tests' },
      { type: 'cypress', suite: 'auth', name: 'Authentication E2E Tests' },
      { type: 'jest', suite: 'integration', name: 'Integration Tests' },
      { type: 'cypress', suite: 'dashboard', name: 'Dashboard E2E Tests' },
      { type: 'cypress', suite: 'payment', name: 'Payment E2E Tests' },
      { type: 'cypress', suite: 'mobile', name: 'Mobile E2E Tests' },
      { type: 'cypress', suite: 'integration', name: 'Integration E2E Tests' }
    ],

    // Feature-focused sequences
    authFlow: [
      { type: 'jest', suite: 'auth', name: 'Auth Unit Tests' },
      { type: 'cypress', suite: 'auth', name: 'Auth E2E Tests' }
    ],

    coreFlow: [
      { type: 'jest', suite: 'core', name: 'Core Unit Tests' },
      { type: 'cypress', suite: 'core', name: 'Core E2E Tests' }
    ],

    paymentFlow: [
      { type: 'jest', suite: 'integration', name: 'Payment Integration Tests' },
      { type: 'cypress', suite: 'payment', name: 'Payment E2E Tests' }
    ]
  },

  // Auto-fix patterns
  autoFixPatterns: [
    {
      pattern: /ECONNREFUSED.*localhost/,
      description: 'Server connection refused',
      severity: 'high',
      autoFixable: false,
      suggestion: 'Check if the development server is running'
    },
    {
      pattern: /Timed out waiting for element/,
      description: 'Element timeout',
      severity: 'medium',
      autoFixable: false,
      suggestion: 'Check element selectors and page load times'
    },
    {
      pattern: /Authentication failed/,
      description: 'Authentication error',
      severity: 'high',
      autoFixable: false,
      suggestion: 'Check authentication configuration and credentials'
    },
    {
      pattern: /Network request failed/,
      description: 'Network connectivity issue',
      severity: 'medium',
      autoFixable: false,
      suggestion: 'Check network connectivity and API endpoints'
    },
    {
      pattern: /Module not found/,
      description: 'Missing dependency',
      severity: 'high',
      autoFixable: true,
      suggestion: 'Run npm install to install missing dependencies'
    }
  ],

  // Reporting configuration
  reporting: {
    outputDir: 'test-reports',
    formats: ['json', 'html'],
    includeScreenshots: true,
    includeVideos: false,
    includeCoverage: true
  },

  // Environment-specific settings
  environments: {
    development: {
      baseUrl: 'http://localhost:5173',
      timeout: 15000,
      retries: 1
    },
    staging: {
      baseUrl: 'https://staging.geargrab.co',
      timeout: 20000,
      retries: 2
    },
    production: {
      baseUrl: 'https://geargrab.co',
      timeout: 30000,
      retries: 3
    }
  }
};

// Helper functions
export function getTestSuite(type, suiteName) {
  return testConfig.suites[suiteName]?.[type] || [];
}

export function getTestSequence(sequenceName) {
  return testConfig.sequences[sequenceName] || [];
}

export function getEnvironmentConfig(env = 'production') {
  return {
    ...testConfig.global,
    ...testConfig.environments[env]
  };
}

export function getAutoFixPattern(errorText) {
  return testConfig.autoFixPatterns.find(pattern => 
    pattern.pattern.test(errorText)
  );
}

export default testConfig;

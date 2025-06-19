/**
 * Jest Configuration for GearGrab
 * 
 * This configuration sets up Jest for testing with TypeScript,
 * SvelteKit path aliases, and proper mocking capabilities.
 */

export default {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|js)',
    '<rootDir>/tests/**/*.(test|spec).(ts|js)'
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/.svelte-kit/',
    '<rootDir>/cypress/'
  ],
  
  // Module name mapping for SvelteKit aliases
  moduleNameMapping: {
    '^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
    '^\\$lib$': '<rootDir>/src/lib',
    '^\\$components/(.*)$': '<rootDir>/src/lib/components/$1',
    '^\\$components$': '<rootDir>/src/lib/components',
    '^\\$stores/(.*)$': '<rootDir>/src/lib/stores/$1',
    '^\\$stores$': '<rootDir>/src/lib/stores',
    '^\\$utils/(.*)$': '<rootDir>/src/lib/utils/$1',
    '^\\$utils$': '<rootDir>/src/lib/utils',
    '^\\$firebase/(.*)$': '<rootDir>/src/lib/firebase/$1',
    '^\\$firebase$': '<rootDir>/src/lib/firebase',
    '^\\$types/(.*)$': '<rootDir>/src/lib/types/$1',
    '^\\$types$': '<rootDir>/src/lib/types',
    '^\\$services/(.*)$': '<rootDir>/src/lib/services/$1',
    '^\\$services$': '<rootDir>/src/lib/services',
    '^\\$constants/(.*)$': '<rootDir>/src/lib/constants/$1',
    '^\\$constants$': '<rootDir>/src/lib/constants'
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/lib/services/**/*.{ts,js}',
    'src/lib/auth/**/*.{ts,js}',
    'src/lib/database/**/*.{ts,js}',
    'src/lib/domain/**/*.{ts,js}',
    'src/lib/infrastructure/**/*.{ts,js}',
    'src/lib/security/**/*.{ts,js}',
    '!src/lib/**/*.d.ts',
    '!src/lib/**/*.test.{ts,js}',
    '!src/lib/**/*.spec.{ts,js}',
    '!src/lib/**/__tests__/**',
    '!src/lib/**/index.{ts,js}',
    '!src/lib/**/types.{ts,js}',
    '!src/lib/**/constants.{ts,js}'
  ],

  // Coverage thresholds for authentication module
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
    },
    'src/lib/auth/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es2020',
        module: 'esnext',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true
      }
    }
  },
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src'
  ],
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Timeout for tests
  testTimeout: 10000
};

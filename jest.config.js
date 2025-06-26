/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json'
    }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^helmet$': '<rootDir>/tests/mocks/helmet.js',
    '^morgan$': '<rootDir>/tests/mocks/morgan.js',
    '^\\$app/(.*)$': '<rootDir>/tests/mocks/$app/$1',
    '^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
    '^\\$env/(.*)$': '<rootDir>/tests/mocks/$env/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/app.html'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 10000,
  verbose: true,
  moduleNameMapper: {
    '^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
    '^\\$app/(.*)$': '<rootDir>/tests/mocks/$app/$1',
    '^\\$env/(.*)$': '<rootDir>/tests/mocks/$env/$1'
  }
};

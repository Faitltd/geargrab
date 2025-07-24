export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-svelte)/)',
  ],
  transform: {
    '^.+\\.(js)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ]
    }],
    '^.+\\.svelte$': ['svelte-jester', { preprocess: true }]
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,svelte}',
    '<rootDir>/src/**/*.{test,spec}.{js,svelte}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,svelte}',
    '!src/main.js',
    '!src/**/*.d.ts',
    '!src/setupTests.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['js', 'svelte', 'json'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/'
  ]
};

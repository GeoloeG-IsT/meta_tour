// Jest configuration for SoulTrip testing
module.exports = {
  // Test environment setup
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts}',
    '<rootDir>/src/**/__tests__/**/*.{js,ts}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts}'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.config.{js,ts}',
    '!src/**/*.stories.{js,ts}',
    '!src/test-utils/**',
    '!src/types/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Critical paths require higher coverage
    './src/services/payment/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/services/booking/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@config/(.*)$': '<rootDir>/config/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ]
    }]
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Parallel execution
  maxWorkers: '50%',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/global-setup.js',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.js',
  
  // Test suites configuration
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/coverage/'
      ]
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.setup.js'],
      testTimeout: 60000
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/tests/security/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/security.setup.js'],
      testTimeout: 90000
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/performance.setup.js'],
      testTimeout: 300000, // 5 minutes for performance tests
      maxWorkers: 1 // Run performance tests sequentially
    }
  ],
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'test-report.html',
      expand: true
    }],
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml'
    }],
    ['jest-sonar', {
      outputDirectory: './coverage',
      outputName: 'sonar-report.xml'
    }]
  ],
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for CI
  verbose: process.env.CI === 'true',
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/.next/'
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ]
};
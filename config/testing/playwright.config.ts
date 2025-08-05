import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for SoulTrip E2E testing
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/setup/global-setup-e2e.ts'),
  globalTeardown: require.resolve('./tests/setup/global-teardown-e2e.ts'),
  
  // Test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(process.env.CI ? [['github']] : [['list']])
  ],
  
  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Tracing configuration
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Network configuration
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Authentication state
    storageState: 'tests/auth/user.json'
  },
  
  // Test output directories
  outputDir: 'test-results',
  
  // Expect configuration
  expect: {
    timeout: 10000,
    toHaveScreenshot: { 
      mode: 'only-on-failure',
      animations: 'disabled' 
    }
  },
  
  // Project configuration for different browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.spec\.ts/
    },
    
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*mobile.*\.spec\.ts/
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /.*mobile.*\.spec\.ts/
    },
    
    // Tablet devices
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
      testMatch: /.*tablet.*\.spec\.ts/
    },
    
    // Accessibility testing
    {
      name: 'Accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          reducedMotion: 'reduce'
        }
      },
      testMatch: /.*a11y.*\.spec\.ts/
    },
    
    // Performance testing
    {
      name: 'Performance',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      testMatch: /.*performance.*\.spec\.ts/,
      timeout: 120000
    },
    
    // Authentication setup
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup'
    },
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.ts/
    },
    
    // User journey tests
    {
      name: 'Critical User Journeys',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*journey.*\.spec\.ts/,
      dependencies: ['setup'],
      timeout: 60000
    },
    
    // API testing
    {
      name: 'API Tests',
      use: { 
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api'
      },
      testMatch: /.*api.*\.spec\.ts/
    }
  ],
  
  // Web server configuration for local development
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});

// Configuration for different environments
export const environments = {
  development: {
    baseURL: 'http://localhost:3000',
    timeout: 30000,
    retries: 0
  },
  staging: {
    baseURL: 'https://staging.soultrip.com',
    timeout: 45000,
    retries: 1
  },
  production: {
    baseURL: 'https://soultrip.com',
    timeout: 60000,
    retries: 2,
    workers: 1 // Limit concurrent tests on production
  }
};

// Test data configuration
export const testData = {
  users: {
    participant: {
      email: 'test.participant@example.com',
      password: 'TestPassword123!',
      name: 'Test Participant'
    },
    organizer: {
      email: 'test.organizer@example.com',
      password: 'OrganizerPassword123!',
      name: 'Test Organizer'
    },
    admin: {
      email: 'test.admin@example.com',
      password: 'AdminPassword123!',
      name: 'Test Admin'
    }
  },
  tours: {
    sample: {
      title: 'Test Meditation Retreat',
      location: 'Bali, Indonesia',
      price: 1500,
      duration: 7,
      max_participants: 20
    }
  },
  payments: {
    testCard: {
      number: '4242424242424242',
      expiry: '12/25',
      cvc: '123',
      zip: '12345'
    }
  }
};

// Visual regression testing configuration
export const visualConfig = {
  threshold: 0.1,
  animations: 'disabled',
  mask: [
    // Mask dynamic content
    '.timestamp',
    '.user-avatar',
    '.live-counter'
  ],
  clip: {
    x: 0,
    y: 0,
    width: 1280,
    height: 720
  }
};
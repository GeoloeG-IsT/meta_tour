// Jest global setup for SoulTrip testing
import 'jest-extended';
import { TextEncoder, TextDecoder } from 'util';

// Global polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  // Suppress known React warnings in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: An invalid form control'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  // Suppress known warnings
  if (
    typeof args[0] === 'string' &&
    args[0].includes('componentWillReceiveProps has been renamed')
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Custom matchers for SoulTrip-specific testing
expect.extend({
  toBeValidTour(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.title === 'string' &&
      typeof received.organizer_id === 'string' &&
      typeof received.price === 'number' &&
      received.price > 0 &&
      received.status in ['draft', 'published', 'cancelled'];
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid tour`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid tour with required fields`,
        pass: false,
      };
    }
  },

  toBeValidBooking(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.tour_id === 'string' &&
      typeof received.user_id === 'string' &&
      typeof received.amount === 'number' &&
      received.amount > 0 &&
      received.status in ['pending', 'confirmed', 'cancelled', 'completed'];
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid booking`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid booking with required fields`,
        pass: false,
      };
    }
  },

  toBeValidUser(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.email === 'string' &&
      received.email.includes('@') &&
      typeof received.role === 'string' &&
      received.role in ['participant', 'organizer', 'admin'];
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid user`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid user with required fields`,
        pass: false,
      };
    }
  },

  toHaveValidPaymentStructure(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.amount === 'number' &&
      typeof received.currency === 'string' &&
      received.currency.length === 3 &&
      typeof received.status === 'string' &&
      received.status in ['pending', 'processing', 'succeeded', 'failed', 'cancelled'];
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid payment structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid payment structure`,
        pass: false,
      };
    }
  },

  toBeWithinTimeRange(received, expected, toleranceMs = 1000) {
    const receivedTime = new Date(received).getTime();
    const expectedTime = new Date(expected).getTime();
    const diff = Math.abs(receivedTime - expectedTime);
    const pass = diff <= toleranceMs;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within ${toleranceMs}ms of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within ${toleranceMs}ms of ${expected}, but was ${diff}ms away`,
        pass: false,
      };
    }
  },

  toHaveValidGDPRStructure(received) {
    const pass = received &&
      typeof received.user_id === 'string' &&
      Array.isArray(received.consent_records) &&
      typeof received.data_processing_purposes === 'object' &&
      typeof received.retention_policy === 'object';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid GDPR structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid GDPR structure with consent records and data processing purposes`,
        pass: false,
      };
    }
  }
});

// Global test utilities
global.testUtils = {
  // Generate test data
  generateTestEmail: () => `test.${Date.now()}@example.com`,
  generateTestUser: (role = 'participant') => ({
    email: global.testUtils.generateTestEmail(),
    name: `Test ${role}`,
    role,
    password: 'TestPassword123!'
  }),
  generateTestTour: (organizerId) => ({
    title: `Test Tour ${Date.now()}`,
    description: 'A test tour for automated testing',
    organizer_id: organizerId,
    location: 'Test Location',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    price: 1000,
    max_participants: 20,
    status: 'published'
  }),
  
  // Wait utilities
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  waitFor: async (condition, timeout = 5000, interval = 100) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await global.testUtils.sleep(interval);
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Database utilities
  clearDatabase: async () => {
    // Implementation depends on database setup
    console.log('Clearing test database...');
  },
  
  seedDatabase: async (data) => {
    // Implementation depends on database setup
    console.log('Seeding test database...', data);
  }
};

// Mock external services by default
jest.mock('stripe', () => ({
  Stripe: jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_payment_method',
        client_secret: 'pi_test_123_secret'
      }),
      confirm: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded'
      })
    },
    paymentMethods: {
      create: jest.fn().mockResolvedValue({
        id: 'pm_test_123',
        type: 'card'
      })
    }
  }))
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 Message queued'
    })
  }))
}));

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Clean up after each test
afterEach(async () => {
  // Clear any test data
  jest.clearAllMocks();
  
  // Reset any global state
  if (global.testCleanup) {
    await global.testCleanup();
  }
});

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/soultrip_test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

console.log('Jest setup completed for SoulTrip testing');
/* global jest */
// Import Jest DOM extensions
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock the window.matchMedia method (used by some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock console.error and console.warn to fail tests 
// when they are called, except for specific use cases
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = function (message) {
  // Skip React 18 useId console error in test environment
  if (
    typeof message === 'string' &&
    (message.includes('Warning:') ||
      message.includes('useId'))
  ) {
    return;
  }
  originalConsoleError.apply(console, arguments);
  throw new Error('Console error was called during testing. See above for details.');
};

console.warn = function (message) {
  // Allow specific React warning messages
  if (
    typeof message === 'string' &&
    (message.includes('Warning:') || message.includes('React'))
  ) {
    return originalConsoleWarn.apply(console, arguments);
  }
  originalConsoleWarn.apply(console, arguments);
  throw new Error('Console warning was called during testing. See above for details.');
};

// Mocking fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
); 
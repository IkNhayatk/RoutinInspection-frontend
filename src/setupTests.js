// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// React 19 testing environment patches
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => {
    const result = {
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
    
    // Ensure matches property is always available
    Object.defineProperty(result, 'matches', {
      value: false,
      writable: true,
      enumerable: true,
      configurable: true
    });
    
    return result;
  }),
});

// Mock URL methods for file download testing
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock File and FileList for file upload testing
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
    this.type = properties?.type || '';
    this.lastModified = properties?.lastModified || Date.now();
  }
};

// Mock FileReader
global.FileReader = class MockFileReader {
  constructor() {
    this.readAsText = jest.fn();
    this.readAsDataURL = jest.fn();
  }
};

// Add React Testing Library auto-cleanup
import { cleanup } from '@testing-library/react';

// Enhanced DOM setup for React 19 compatibility
// Note: JSDOM is already set up by jest-environment-jsdom, we just need to ensure proper state

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  if (global.localStorage && global.localStorage.getItem && typeof global.localStorage.getItem.mockReturnValue === 'function') {
    global.localStorage.getItem.mockReturnValue(null);
  }
  
  // Reset URL mocks
  global.URL.createObjectURL.mockReturnValue('mock-url');
  global.URL.revokeObjectURL.mockClear();
});

afterEach(() => {
  // Clean up React Testing Library
  cleanup();
});

// Suppress console errors for tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Target container is not a DOM element') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('act(...)') ||
       args[0].includes('When testing, code that causes React state updates should be wrapped into act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
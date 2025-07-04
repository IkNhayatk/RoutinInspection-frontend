import React from 'react';
import { createRoot } from 'react-dom/client';
import '@testing-library/jest-dom';

// Mock the App component
jest.mock('../App', () => {
  return function MockApp() {
    return <div data-testid="mock-app">Mock App Component</div>;
  };
});

// Mock reportWebVitals
jest.mock('../reportWebVitals', () => jest.fn());

// Mock createRoot
const mockRender = jest.fn();
const mockRoot = {
  render: mockRender,
  unmount: jest.fn(),
};

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => mockRoot),
}));

describe('index.js', () => {
  let container;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('renders App component in root element', async () => {
    // Mock getElementById to return our container
    document.getElementById = jest.fn(() => container);

    // Import index.js to trigger the rendering
    await import('../index.js');

    // Verify createRoot was called with the root element
    expect(createRoot).toHaveBeenCalledWith(container);

    // Verify render was called
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Verify the rendered component structure
    const renderCall = mockRender.mock.calls[0][0];
    expect(renderCall.type).toBe(React.StrictMode);
  });

  test('calls reportWebVitals', async () => {
    const reportWebVitals = require('../reportWebVitals');
    document.getElementById = jest.fn(() => container);

    // Import index.js
    await import('../index.js');

    // reportWebVitals should be called
    expect(reportWebVitals).toHaveBeenCalledTimes(1);
  });

  test('handles missing root element gracefully', async () => {
    // Mock getElementById to return null
    document.getElementById = jest.fn(() => null);

    // This should not throw an error, but createRoot won't be called
    await expect(async () => {
      await import('../index.js');
    }).not.toThrow();
  });

  test('StrictMode wraps App component', async () => {
    document.getElementById = jest.fn(() => container);

    // Import index.js
    await import('../index.js');

    // Get the rendered element
    const renderCall = mockRender.mock.calls[0][0];
    
    // Should be wrapped in StrictMode
    expect(renderCall.type).toBe(React.StrictMode);
    
    // The child should be the App component
    expect(renderCall.props.children.type.name).toBe('MockApp');
  });

  test('root element is correctly identified', async () => {
    const getElementByIdSpy = jest.spyOn(document, 'getElementById');
    getElementByIdSpy.mockReturnValue(container);

    // Import index.js
    await import('../index.js');

    // Verify getElementById was called with 'root'
    expect(getElementByIdSpy).toHaveBeenCalledWith('root');

    getElementByIdSpy.mockRestore();
  });

  test('React 18 createRoot API is used', async () => {
    document.getElementById = jest.fn(() => container);

    // Import index.js
    await import('../index.js');

    // Verify we're using React 18's createRoot API
    expect(createRoot).toHaveBeenCalledTimes(1);
    expect(mockRender).toHaveBeenCalledTimes(1);
  });

  test('renders without errors in development mode', async () => {
    // Set development mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    document.getElementById = jest.fn(() => container);

    // Should not throw any errors
    await expect(async () => {
      await import('../index.js');
    }).not.toThrow();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  test('renders without errors in production mode', async () => {
    // Set production mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    document.getElementById = jest.fn(() => container);

    // Should not throw any errors
    await expect(async () => {
      await import('../index.js');
    }).not.toThrow();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
});
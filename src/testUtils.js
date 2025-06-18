import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Mock implementation for React 19 compatibility
const originalCreateRoot = global.document.createElement;

beforeAll(() => {
  // Ensure document.createElement works properly for tests
  global.document.createElement = function(tagName) {
    const element = originalCreateRoot.call(this, tagName);
    // Add missing methods if needed
    if (!element.createRoot && tagName === 'div') {
      element.createRoot = jest.fn();
    }
    return element;
  };
});

afterAll(() => {
  global.document.createElement = originalCreateRoot;
});

export const renderWithRouter = (component, authValue = {
  isAdmin: true,
  isLoggedIn: true,
  user: { id: 1, userName: 'Test User' }
}) => {
  // Create a safe container for rendering
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  const result = render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>,
    { container }
  );

  // Cleanup function
  const originalUnmount = result.unmount;
  result.unmount = () => {
    originalUnmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  return result;
};

export * from '@testing-library/react';
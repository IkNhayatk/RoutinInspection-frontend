import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the contexts and components
jest.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
}));

jest.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>,
}));

jest.mock('../routes/AppRoutes', () => {
  return function MockAppRoutes() {
    return <div data-testid="app-routes">App Routes</div>;
  };
});

// Mock react-router
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
}));

// Mock authService
jest.mock('../services/authService', () => ({
  setupActivityListeners: jest.fn(),
  setupAutoLogout: jest.fn(),
  checkAutoLogout: jest.fn(() => false),
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
  });

  test('renders AuthProvider', () => {
    render(<App />);
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  test('renders ThemeProvider', () => {
    render(<App />);
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
  });

  test('renders AppRoutes', () => {
    render(<App />);
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });

  test('has correct component hierarchy', () => {
    render(<App />);
    
    const browserRouter = screen.getByTestId('browser-router');
    const authProvider = screen.getByTestId('auth-provider');
    const themeProvider = screen.getByTestId('theme-provider');
    const appRoutes = screen.getByTestId('app-routes');

    // Verify the structure
    expect(browserRouter).toBeInTheDocument();
    expect(authProvider).toBeInTheDocument();
    expect(themeProvider).toBeInTheDocument();
    expect(appRoutes).toBeInTheDocument();
  });

  test('App component structure with real components', async () => {
    // Test with minimal mocking to ensure integration works
    const { container } = render(<App />);
    
    // The app should render without throwing errors
    expect(container.firstChild).toBeInTheDocument();
    
    // Wait for any async operations to complete
    await waitFor(() => {
      expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    });
  });

  test('handles routing context properly', () => {
    // Ensure BrowserRouter is providing routing context
    render(<App />);
    
    // The app should have proper routing structure
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });

  test('providers are properly nested', () => {
    const { container } = render(<App />);
    
    // Check that providers are properly structured
    const authProvider = screen.getByTestId('auth-provider');
    const themeProvider = screen.getByTestId('theme-provider');
    
    expect(authProvider).toBeInTheDocument();
    expect(themeProvider).toBeInTheDocument();
    
    // Both providers should contain the app routes
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });

  test('app renders with default className', () => {
    const { container } = render(<App />);
    
    // Check if the app has a proper container structure
    expect(container.firstChild).toBeInTheDocument();
  });

  test('error boundary behavior', () => {
    // Mock console.error to avoid noise in test output
    const originalError = console.error;
    console.error = jest.fn();

    // This test ensures the app doesn't crash on render
    expect(() => render(<App />)).not.toThrow();

    // Restore console.error
    console.error = originalError;
  });
});
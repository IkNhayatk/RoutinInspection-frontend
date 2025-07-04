import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth, AuthContext } from '../AuthContext';

// Mock the authService
jest.mock('../../services/authService', () => ({
  checkUserAuthStatus: jest.fn(),
  updateLastActivity: jest.fn(),
}));

// Create a test component that uses the auth context
const TestComponent = () => {
  const { isLoggedIn, isAdmin, user, token, loading, refreshAuth } = useAuth();
  
  return (
    <div>
      <div data-testid="is-logged-in">{isLoggedIn.toString()}</div>
      <div data-testid="is-admin">{isAdmin.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <button data-testid="refresh-button" onClick={refreshAuth}>
        Refresh Auth
      </button>
    </div>
  );
};

// Test component for error handling
const ErrorTestComponent = () => {
  try {
    useAuth();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{error.message}</div>;
  }
};

describe('AuthContext', () => {
  let mockCheckUserAuthStatus;
  let mockUpdateLastActivity;

  beforeEach(() => {
    mockCheckUserAuthStatus = require('../../services/authService').checkUserAuthStatus;
    mockUpdateLastActivity = require('../../services/authService').updateLastActivity;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementation
    mockCheckUserAuthStatus.mockReturnValue({
      isLoggedIn: false,
      isAdmin: false,
      user: null,
      token: null,
    });
  });

  afterEach(() => {
    // Clean up any event listeners
    window.removeEventListener('auth-logout', () => {});
  });

  describe('AuthProvider', () => {
    test('renders children correctly', async () => {
      render(
        <AuthProvider>
          <div data-testid="child">Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    test('initializes with default values', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('is-logged-in')).toHaveTextContent('false');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });

    test('initializes with logged in user', async () => {
      const mockUser = { id: 1, name: 'Test User', priorityLevel: 3 };
      const mockToken = 'mock-jwt-token';

      mockCheckUserAuthStatus.mockReturnValue({
        isLoggedIn: true,
        isAdmin: true,
        user: mockUser,
        token: mockToken,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    });

    test('handles auth check error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCheckUserAuthStatus.mockImplementation(() => {
        throw new Error('Auth service error');
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Should maintain default values when error occurs
      expect(screen.getByTestId('is-logged-in')).toHaveTextContent('false');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(consoleSpy).toHaveBeenCalledWith('初始化認證狀態失敗:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    test('responds to auth-logout event', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      mockCheckUserAuthStatus.mockReturnValue({
        isLoggedIn: true,
        isAdmin: true,
        user: mockUser,
        token: 'mock-token',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
      });

      // Trigger logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth-logout'));
      });

      // Should reset to logged out state
      expect(screen.getByTestId('is-logged-in')).toHaveTextContent('false');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });

    test('refreshAuth function works correctly', async () => {
      const initialUser = { id: 1, name: 'Initial User' };
      const updatedUser = { id: 1, name: 'Updated User' };

      // Initial state
      mockCheckUserAuthStatus.mockReturnValueOnce({
        isLoggedIn: true,
        isAdmin: false,
        user: initialUser,
        token: 'initial-token',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(initialUser));
      });

      // Setup for refresh
      mockCheckUserAuthStatus.mockReturnValueOnce({
        isLoggedIn: true,
        isAdmin: true,
        user: updatedUser,
        token: 'updated-token',
      });

      // Trigger refresh
      act(() => {
        screen.getByTestId('refresh-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(updatedUser));
        expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
        expect(screen.getByTestId('token')).toHaveTextContent('updated-token');
      });

      expect(mockUpdateLastActivity).toHaveBeenCalled();
    });

    test('refreshAuth handles errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Setup error for refresh
      mockCheckUserAuthStatus.mockImplementation(() => {
        throw new Error('Refresh error');
      });

      // Trigger refresh
      act(() => {
        screen.getByTestId('refresh-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(consoleSpy).toHaveBeenCalledWith('重新驗證失敗:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('loading state changes correctly during refresh', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Trigger refresh
      act(() => {
        screen.getByTestId('refresh-button').click();
      });

      // Loading should be true during refresh, then false after
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    test('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('auth-logout', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('useAuth hook', () => {
    test('returns context value when used within AuthProvider', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      mockCheckUserAuthStatus.mockReturnValue({
        isLoggedIn: true,
        isAdmin: false,
        user: mockUser,
        token: 'test-token',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
        expect(screen.getByTestId('token')).toHaveTextContent('test-token');
      });
    });

    test('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ErrorTestComponent />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useAuth 必須在 AuthProvider 內使用'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Context value completeness', () => {
    test('provides all expected context values', async () => {
      const mockUser = { id: 1, name: 'Test User', priorityLevel: 2 };
      mockCheckUserAuthStatus.mockReturnValue({
        isLoggedIn: true,
        isAdmin: false,
        user: mockUser,
        token: 'complete-token',
      });

      const ContextConsumer = () => {
        const context = React.useContext(AuthContext);
        
        return (
          <div>
            <div data-testid="context-keys">
              {Object.keys(context).join(',')}
            </div>
            <div data-testid="has-refresh-auth">
              {typeof context.refreshAuth === 'function' ? 'true' : 'false'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <ContextConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        const contextKeys = screen.getByTestId('context-keys').textContent;
        expect(contextKeys).toContain('isLoggedIn');
        expect(contextKeys).toContain('isAdmin');
        expect(contextKeys).toContain('user');
        expect(contextKeys).toContain('token');
        expect(contextKeys).toContain('loading');
        expect(contextKeys).toContain('refreshAuth');
      });

      expect(screen.getByTestId('has-refresh-auth')).toHaveTextContent('true');
    });
  });

  describe('Edge cases', () => {
    test('handles multiple rapid refresh calls', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Trigger multiple rapid refreshes
      act(() => {
        screen.getByTestId('refresh-button').click();
        screen.getByTestId('refresh-button').click();
        screen.getByTestId('refresh-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Should handle gracefully without errors
      expect(mockCheckUserAuthStatus).toHaveBeenCalled();
    });

    test('handles multiple auth-logout events', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      mockCheckUserAuthStatus.mockReturnValue({
        isLoggedIn: true,
        isAdmin: true,
        user: mockUser,
        token: 'test-token',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
      });

      // Trigger multiple logout events
      act(() => {
        window.dispatchEvent(new CustomEvent('auth-logout'));
        window.dispatchEvent(new CustomEvent('auth-logout'));
        window.dispatchEvent(new CustomEvent('auth-logout'));
      });

      // Should handle gracefully and remain logged out
      expect(screen.getByTestId('is-logged-in')).toHaveTextContent('false');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
  });
});
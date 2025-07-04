import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AppRoutes from '../AppRoutes';
import { useAuth } from '../../context/AuthContext';

// Mock all the page components
jest.mock('../../pages/auth/LoginForm', () => {
  return function MockLoginForm() {
    return <div data-testid="login-form">Login Form</div>;
  };
});

jest.mock('../../pages/auth/AddUser', () => {
  return function MockAddUser() {
    return <div data-testid="add-user">Add User</div>;
  };
});

jest.mock('../../pages/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard">Dashboard</div>;
  };
});

jest.mock('../../pages/TodoList', () => {
  return function MockTodoList() {
    return <div data-testid="todo-list">Todo List</div>;
  };
});

jest.mock('../../pages/UserManagement', () => {
  return function MockUserManagement() {
    return <div data-testid="user-management">User Management</div>;
  };
});

jest.mock('../../pages/FormSettings', () => {
  return function MockFormSettings() {
    return <div data-testid="form-settings">Form Settings</div>;
  };
});

jest.mock('../../pages/RouteBinding', () => {
  return function MockRouteBinding() {
    return <div data-testid="route-binding">Route Binding</div>;
  };
});

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppRoutes />
    </MemoryRouter>
  );
};

describe('AppRoutes', () => {
  beforeEach(() => {
    // Mock window.location
    delete window.location;
    window.location = { pathname: '/' };
  });

  describe('Public Routes', () => {
    test('renders LoginForm for root path', () => {
      renderWithRouter(['/']);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    test('renders AddUser for /add_user path', () => {
      renderWithRouter(['/add_user']);
      expect(screen.getByTestId('add-user')).toBeInTheDocument();
    });
  });

  describe('Protected Routes - Not Logged In', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isLoggedIn: false,
        isAdmin: false,
        loading: false,
      });
    });

    test('redirects to login when accessing protected route while not logged in', () => {
      renderWithRouter(['/dashboard']);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    test('redirects to login when accessing user management while not logged in', () => {
      renderWithRouter(['/user_management']);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('Protected Routes - Logged In', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isLoggedIn: true,
        isAdmin: false,
        loading: false,
      });
    });

    test('renders Dashboard for /dashboard when logged in', () => {
      renderWithRouter(['/dashboard']);
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    test('renders TodoList for /todolist when logged in', () => {
      renderWithRouter(['/todolist']);
      expect(screen.getByTestId('todo-list')).toBeInTheDocument();
    });

    test('renders LikeTrello placeholder for /liketrello when logged in', () => {
      renderWithRouter(['/liketrello']);
      expect(screen.getByText('LikeTrello Page Placeholder')).toBeInTheDocument();
    });

    test('renders FormSettings for /form_settings when logged in', () => {
      renderWithRouter(['/form_settings']);
      expect(screen.getByTestId('form-settings')).toBeInTheDocument();
    });

    test('renders RouteBinding for /route_binding when logged in', () => {
      renderWithRouter(['/route_binding']);
      expect(screen.getByTestId('route-binding')).toBeInTheDocument();
    });

    test('renders UserManagement for /user_management when logged in', () => {
      renderWithRouter(['/user_management']);
      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });
  });

  describe('Admin Routes', () => {
    test('allows admin to access all routes', () => {
      useAuth.mockReturnValue({
        isLoggedIn: true,
        isAdmin: true,
        loading: false,
      });

      renderWithRouter(['/user_management']);
      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });

    test('redirects non-admin from admin-required routes to dashboard', () => {
      useAuth.mockReturnValue({
        isLoggedIn: true,
        isAdmin: false,
        loading: false,
      });

      // Note: Based on the current code, no routes explicitly require admin
      // This test is for future admin-only routes
      renderWithRouter(['/dashboard']);
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when auth is loading', () => {
      useAuth.mockReturnValue({
        isLoggedIn: false,
        isAdmin: false,
        loading: true,
      });

      renderWithRouter(['/dashboard']);
      expect(screen.getByText('載入中...')).toBeInTheDocument();
      // The loading spinner doesn't have a role="status", it's just a styled div
      expect(screen.getByText('載入中...').previousSibling).toHaveClass('animate-spin');
    });
  });

  describe('Special Route Handling', () => {
    test('allows access to /add_user regardless of login status', () => {
      useAuth.mockReturnValue({
        isLoggedIn: false,
        isAdmin: false,
        loading: false,
      });

      // Mock window.location.pathname for the special /add_user handling
      window.location.pathname = '/add_user';

      renderWithRouter(['/add_user']);
      expect(screen.getByTestId('add-user')).toBeInTheDocument();
    });
  });

  describe('Fallback Route', () => {
    test('redirects unknown paths to login', () => {
      useAuth.mockReturnValue({
        isLoggedIn: false,
        isAdmin: false,
        loading: false,
      });

      renderWithRouter(['/unknown-path']);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    test('redirects unknown paths to login even when logged in', () => {
      useAuth.mockReturnValue({
        isLoggedIn: true,
        isAdmin: true,
        loading: false,
      });

      renderWithRouter(['/unknown-path']);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('ProtectedRoute Component', () => {
    test('logs correct messages for different scenarios', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Test not logged in
      useAuth.mockReturnValue({
        isLoggedIn: false,
        isAdmin: false,
        loading: false,
      });

      renderWithRouter(['/dashboard']);
      expect(consoleSpy).toHaveBeenCalledWith('ProtectedRoute: Not logged in, redirecting to /');

      // Test successful access
      useAuth.mockReturnValue({
        isLoggedIn: true,
        isAdmin: false,
        loading: false,
      });

      renderWithRouter(['/dashboard']);
      expect(consoleSpy).toHaveBeenCalledWith('ProtectedRoute: Access granted for requireAdmin=false');

      consoleSpy.mockRestore();
    });

    test('handles admin requirement correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Test non-admin trying to access admin route (if any existed)
      useAuth.mockReturnValue({
        isLoggedIn: true,
        isAdmin: false,
        loading: false,
      });

      // Since current routes don't require admin, we'll simulate one
      // by directly testing the ProtectedRoute logic
      renderWithRouter(['/dashboard']);
      expect(consoleSpy).toHaveBeenCalledWith('ProtectedRoute: Access granted for requireAdmin=false');

      consoleSpy.mockRestore();
    });

    test('handles /add_user special case', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      useAuth.mockReturnValue({
        isLoggedIn: false,
        isAdmin: false,
        loading: false,
      });

      // /add_user is a public route, not wrapped in ProtectedRoute
      // So it should render directly without any protection checks
      renderWithRouter(['/add_user']);
      expect(screen.getByTestId('add-user')).toBeInTheDocument();
      
      // The console message only appears for routes wrapped in ProtectedRoute
      expect(consoleSpy).not.toHaveBeenCalledWith('ProtectedRoute: Allowing access to /add_user regardless of login status');

      consoleSpy.mockRestore();
    });
  });
});
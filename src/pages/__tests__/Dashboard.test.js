import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
import { useAuth } from '../../context/AuthContext';

// Mock dependencies
jest.mock('../../context/AuthContext');
jest.mock('../../context/ThemeContext', () => require('../../__mocks__/ThemeContext'));
jest.mock('../../components/Layout/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});
jest.mock('../../components/LogoutButton', () => {
  return function MockLogoutButton() {
    return <button data-testid="logout-button">登出</button>;
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard Component Access Control', () => {
  const mockUseAuth = useAuth;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirects priority level 1 users to user management', async () => {
    const priorityLevel1User = {
      isLoggedIn: true,
      user: { id: 1, userName: 'Level 1 User', priorityLevel: 1 }
    };
    
    mockUseAuth.mockReturnValue(priorityLevel1User);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/user_management');
    });
  });

  test('allows priority level 2 users to access dashboard', async () => {
    const priorityLevel2User = {
      isLoggedIn: true,
      user: { id: 2, userName: 'Level 2 User', priorityLevel: 2 }
    };
    
    mockUseAuth.mockReturnValue(priorityLevel2User);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('歡迎回來')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalledWith('/user_management');
    });
  });

  test('allows priority level 3 users to access dashboard', async () => {
    const priorityLevel3User = {
      isLoggedIn: true,
      user: { id: 3, userName: 'Level 3 User', priorityLevel: 3 }
    };
    
    mockUseAuth.mockReturnValue(priorityLevel3User);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('歡迎回來')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalledWith('/user_management');
    });
  });

  test('redirects non-logged-in users to login page', async () => {
    const nonLoggedInUser = {
      isLoggedIn: false,
      user: null
    };
    
    mockUseAuth.mockReturnValue(nonLoggedInUser);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
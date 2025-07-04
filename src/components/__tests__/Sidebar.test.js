import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '@testing-library/jest-dom';
import Sidebar from '../Layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../__mocks__/ThemeContext';

// Mock dependencies
jest.mock('../../context/AuthContext');
jest.mock('../../context/ThemeContext', () => require('../../__mocks__/ThemeContext'));

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/user_management' }),
}));

describe('Sidebar Component Access Control', () => {
  const mockUseAuth = useAuth;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('hides form approval button for priority level 1 users', () => {
    const priorityLevel1User = {
      user: { id: 1, userName: 'Level 1 User', priorityLevel: 1 }
    };
    
    mockUseAuth.mockReturnValue(priorityLevel1User);

    render(
      <MemoryRouter>
        <ThemeProvider>
          <Sidebar />
        </ThemeProvider>
      </MemoryRouter>
    );

    // 表單核簽按鈕不应该显示
    expect(screen.queryByText('表單核簽')).not.toBeInTheDocument();
    
    // 其他功能应该显示
    expect(screen.getByText('表單設定')).toBeInTheDocument();
    expect(screen.getByText('路線綁定')).toBeInTheDocument();
    expect(screen.getByText('使用者管理')).toBeInTheDocument();
  });

  test('shows form approval button for priority level 2 users', () => {
    const priorityLevel2User = {
      user: { id: 2, userName: 'Level 2 User', priorityLevel: 2 }
    };
    
    mockUseAuth.mockReturnValue(priorityLevel2User);

    render(
      <MemoryRouter>
        <ThemeProvider>
          <Sidebar />
        </ThemeProvider>
      </MemoryRouter>
    );

    // 表單核簽按鈕应该显示
    expect(screen.getByText('表單核簽')).toBeInTheDocument();
    
    // 其他功能也应该显示
    expect(screen.getByText('表單設定')).toBeInTheDocument();
    expect(screen.getByText('路線綁定')).toBeInTheDocument();
    expect(screen.getByText('使用者管理')).toBeInTheDocument();
  });

  test('shows form approval button for priority level 3 users', () => {
    const priorityLevel3User = {
      user: { id: 3, userName: 'Level 3 User', priorityLevel: 3 }
    };
    
    mockUseAuth.mockReturnValue(priorityLevel3User);

    render(
      <MemoryRouter>
        <ThemeProvider>
          <Sidebar />
        </ThemeProvider>
      </MemoryRouter>
    );

    // 表單核簽按鈕应该显示
    expect(screen.getByText('表單核簽')).toBeInTheDocument();
    
    // 其他功能也应该显示
    expect(screen.getByText('表單設定')).toBeInTheDocument();
    expect(screen.getByText('路線綁定')).toBeInTheDocument();
    expect(screen.getByText('使用者管理')).toBeInTheDocument();
  });

  test('handles missing user data gracefully', () => {
    const noUser = {
      user: null
    };
    
    mockUseAuth.mockReturnValue(noUser);

    render(
      <MemoryRouter>
        <ThemeProvider>
          <Sidebar />
        </ThemeProvider>
      </MemoryRouter>
    );

    // 当没有用户数据时，表單核簽按鈕不应该显示
    expect(screen.queryByText('表單核簽')).not.toBeInTheDocument();
    
    // 其他功能应该正常显示
    expect(screen.getByText('表單設定')).toBeInTheDocument();
    expect(screen.getByText('路線綁定')).toBeInTheDocument();
    expect(screen.getByText('使用者管理')).toBeInTheDocument();
  });
});
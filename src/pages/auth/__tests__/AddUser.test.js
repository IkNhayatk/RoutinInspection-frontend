import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router';
import AddUser from '../AddUser';
import { register } from '../../../services/authService';

// Mock dependencies
jest.mock('react-router', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../../services/authService', () => ({
  register: jest.fn(),
}));

const mockNavigate = jest.fn();

beforeEach(() => {
  useNavigate.mockReturnValue(mockNavigate);
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('AddUser', () => {
  test('renders registration form correctly', () => {
    render(<AddUser />);
    
    expect(screen.getByRole('heading', { name: '註冊新帳號' })).toBeInTheDocument();
    expect(screen.getByLabelText('用戶名稱')).toBeInTheDocument();
    expect(screen.getByLabelText('用戶ID')).toBeInTheDocument();
    expect(screen.getByLabelText('英文名稱')).toBeInTheDocument();
    expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
    expect(screen.getByLabelText('職位')).toBeInTheDocument();
    expect(screen.getByLabelText('部門')).toBeInTheDocument();
    expect(screen.getByLabelText('密碼')).toBeInTheDocument();
    expect(screen.getByLabelText('確認密碼')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '註冊' })).toBeInTheDocument();
    expect(screen.getByText('返回登入')).toBeInTheDocument();
  });

  test('updates input values when user types', () => {
    render(<AddUser />);
    
    const userNameInput = screen.getByLabelText('用戶名稱');
    const userIdInput = screen.getByLabelText('用戶ID');
    const engNameInput = screen.getByLabelText('英文名稱');
    const emailInput = screen.getByLabelText('電子郵件');
    const positionInput = screen.getByLabelText('職位');
    const departmentInput = screen.getByLabelText('部門');
    const passwordInput = screen.getByLabelText('密碼');
    const confirmPasswordInput = screen.getByLabelText('確認密碼');
    
    fireEvent.change(userNameInput, { target: { value: '測試用戶' } });
    fireEvent.change(userIdInput, { target: { value: 'testuser001' } });
    fireEvent.change(engNameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(positionInput, { target: { value: '工程師' } });
    fireEvent.change(departmentInput, { target: { value: '測試部門' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    expect(userNameInput.value).toBe('測試用戶');
    expect(userIdInput.value).toBe('testuser001');
    expect(engNameInput.value).toBe('Test User');
    expect(emailInput.value).toBe('test@example.com');
    expect(positionInput.value).toBe('工程師');
    expect(departmentInput.value).toBe('測試部門');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  test('submits form with correct data on successful registration', async () => {
    register.mockResolvedValue({
      success: true,
    });

    render(<AddUser />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        UserName: '測試用戶',
        UserID: 'testuser001',
        EngName: '',
        Email: '',
        Password: 'password123',
        PriorityLevel: 1,
        Position: '',
        Department: '',
      });
    });
    
    // Check success message - needs to wait for state update
    await waitFor(() => {
      expect(screen.getByText('註冊成功！即將跳轉至登入頁面...')).toBeInTheDocument();
    });
  });

  test('shows error when passwords do not match', async () => {
    render(<AddUser />);
    
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'differentpass' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('密碼與確認密碼不相符')).toBeInTheDocument();
    });
    
    expect(register).not.toHaveBeenCalled();
  });

  test('displays error message on registration failure', async () => {
    register.mockResolvedValue({
      success: false,
      message: 'User already exists',
    });

    render(<AddUser />);
    
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });
  });

  test('displays error message when registration throws exception', async () => {
    const errorResponse = {
      response: {
        data: {
          message: 'Network error'
        }
      }
    };
    register.mockRejectedValue(errorResponse);

    render(<AddUser />);
    
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('shows loading state during registration', async () => {
    let resolveRegister;
    const registerPromise = new Promise(resolve => {
      resolveRegister = resolve;
    });
    register.mockReturnValue(registerPromise);

    render(<AddUser />);
    
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('註冊中...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise
    resolveRegister({ success: true });
    
    await waitFor(() => {
      expect(screen.getByText('註冊')).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('navigates to home page when back button is clicked', () => {
    render(<AddUser />);
    
    const backButton = screen.getByText('返回登入');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigates to home page after successful registration', async () => {
    register.mockResolvedValue({
      success: true,
    });

    render(<AddUser />);
    
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('註冊成功！即將跳轉至登入頁面...')).toBeInTheDocument();
    });
    
    // Fast-forward 2 seconds
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles navigation error gracefully', async () => {
    register.mockResolvedValue({
      success: true,
    });
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockNavigate.mockImplementation(() => {
      throw new Error('Navigation error');
    });

    render(<AddUser />);
    
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('註冊成功！即將跳轉至登入頁面...')).toBeInTheDocument();
    });
    
    // Fast-forward 2 seconds
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('導航到登入頁面時發生錯誤:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  test('displays default error message when registration fails without message', async () => {
    register.mockResolvedValue({
      success: false,
    });

    render(<AddUser />);
    
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('註冊失敗')).toBeInTheDocument();
    });
  });

  test('includes optional fields in registration data', async () => {
    register.mockResolvedValue({
      success: true,
    });

    render(<AddUser />);
    
    // Fill in all fields including optional ones
    fireEvent.change(screen.getByLabelText('用戶名稱'), { target: { value: '測試用戶' } });
    fireEvent.change(screen.getByLabelText('用戶ID'), { target: { value: 'testuser001' } });
    fireEvent.change(screen.getByLabelText('英文名稱'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('職位'), { target: { value: '工程師' } });
    fireEvent.change(screen.getByLabelText('部門'), { target: { value: '測試部門' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: '註冊' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        UserName: '測試用戶',
        UserID: 'testuser001',
        EngName: 'Test User',
        Email: 'test@example.com',
        Password: 'password123',
        PriorityLevel: 1,
        Position: '工程師',
        Department: '測試部門',
      });
    });
  });
});
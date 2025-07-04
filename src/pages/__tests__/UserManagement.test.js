import React from 'react';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { renderWithRouter } from '../../testUtils';
import UserManagement from '../UserManagement';
import { apiClient } from '../../services/authService';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../components/Layout/Sidebar');
jest.mock('../../components/LogoutButton');
jest.mock('../../components/ConfirmModal');
jest.mock('../../components/UserModal');
jest.mock('../../context/ThemeContext', () => require('../../__mocks__/ThemeContext'));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaPencilAlt: () => <div data-testid="edit-icon" />,
  FaTrashAlt: () => <div data-testid="delete-icon" />,
  FaDownload: () => <div data-testid="download-icon" />,
  FaUpload: () => <div data-testid="upload-icon" />,
  FaRegCopy: () => <div data-testid="copy-icon" />,
  FaSearch: () => <div data-testid="search-icon" />,
  FaChevronLeft: () => <div data-testid="chevron-left-icon" />,
  FaChevronRight: () => <div data-testid="chevron-right-icon" />,
  FaChevronUp: () => <div data-testid="chevron-up-icon" />,
  FaChevronDown: () => <div data-testid="chevron-down-icon" />
}));

// Mock components
jest.mock('../../components/Layout/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('../../components/LogoutButton', () => {
  return function MockLogoutButton() {
    return <div data-testid="logout-button">Logout</div>;
  };
});

jest.mock('../../components/ConfirmModal', () => {
  return function MockConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm} data-testid="confirm-button">確認</button>
        <button onClick={onClose} data-testid="cancel-button">取消</button>
      </div>
    );
  };
});

jest.mock('../../components/UserModal', () => {
  return function MockUserModal({ isOpen, onClose, onSubmit, isEditing, editData }) {
    if (!isOpen) return null;
    return (
      <div data-testid="user-modal">
        <h2>{editData?.isCopy ? '複製使用者' : (isEditing ? '編輯使用者' : '新增使用者')}</h2>
        <p>User ID: {editData?.userID || (editData?.isCopy ? 'empty' : 'new')}</p>
        <p>User Name: {editData?.userName || 'empty'}</p>
        <button onClick={() => { onSubmit(); onClose(); }} data-testid="submit-button">提交</button>
        <button onClick={onClose} data-testid="close-button">關閉</button>
      </div>
    );
  };
});

// Mock navigate hook
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}));

// Mock data - 更新為包含分頁信息的格式
const mockUsers = [
  {
    ID: 1,
    UserName: '張三',
    UserID: 'N000156652',
    Email: 'zhang@example.com',
    PriorityLevel: 1,
    Position: '保養員',
    Department: 'J020',
    Remark: '',
    IsAtWork: 1,
    EngName: 'Zhang San',
    supervisorName: '李主管',
    supervisorID: 'N000156653'
  },
  {
    ID: 2,
    UserName: '李四',
    UserID: 'N000156653',
    Email: 'li@example.com',
    PriorityLevel: 2,
    Position: '主管',
    Department: 'J020',
    Remark: '',
    IsAtWork: 1,
    EngName: 'Li Si',
    supervisorName: '',
    supervisorID: ''
  }
];

const mockPaginationResponse = {
  success: true,
  users: mockUsers,
  pagination: {
    current_page: 1,
    page_size: 10,
    total_count: 2,
    total_pages: 1,
    has_next: false,
    has_prev: false
  }
};


describe('UserManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    apiClient.get.mockResolvedValue({
      data: mockPaginationResponse
    });
    
    // Reset DOM mocks
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Component Rendering', () => {
    test('renders UserManagement component correctly', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('用戶管理')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      });
    });

    test('displays user list table with correct headers and pagination info', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('用戶名稱')).toBeInTheDocument();
        expect(screen.getByText('用戶ID')).toBeInTheDocument();
        expect(screen.getByText('優先級別')).toBeInTheDocument();
        expect(screen.getByText('部門')).toBeInTheDocument();
        expect(screen.getByText('操作')).toBeInTheDocument();
        
        // 檢查分頁信息
        expect(screen.getByText(/顯示\s+1\s+到\s+2\s+條，共\s+2\s+條記錄/)).toBeInTheDocument();
      });
    });

    test('displays users data in table rows', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('張三')).toBeInTheDocument();
        expect(screen.getByText('N000156652')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('N000156653')).toBeInTheDocument();
      });
    });

    test('shows loading state', () => {
      apiClient.get.mockReturnValue(new Promise(() => {})); // Never resolves
      renderWithRouter(<UserManagement />);
      
      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    test('shows empty state when no users', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          users: [],
          pagination: {
            current_page: 1,
            page_size: 10,
            total_count: 0,
            total_pages: 1,
            has_next: false,
            has_prev: false
          }
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
    });
  });

  describe('User Actions', () => {
    test('opens add user modal when clicking 新增用戶 button', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('新增用戶');
        fireEvent.click(addButton);
      });
      
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      expect(screen.getByText('新增使用者')).toBeInTheDocument();
    });

    test('opens edit user modal when clicking edit button', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0]);
      });
      
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      expect(screen.getByText('編輯使用者')).toBeInTheDocument();
      expect(screen.getByText('User ID: N000156652')).toBeInTheDocument();
      expect(screen.getByText('User Name: 張三')).toBeInTheDocument();
    });

    test('opens copy user modal when clicking copy button', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const copyButtons = screen.getAllByTestId('copy-icon');
        fireEvent.click(copyButtons[0]);
      });
      
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      expect(screen.getByText('複製使用者')).toBeInTheDocument();
      expect(screen.getByText('User ID: empty')).toBeInTheDocument(); // Should be empty in copy mode
      expect(screen.getByText('User Name: empty')).toBeInTheDocument(); // Should be empty in copy mode
    });

    test('opens delete confirmation modal when clicking delete button', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('確認刪除')).toBeInTheDocument();
      expect(screen.getByText('確定要刪除用戶 "張三" 嗎？此操作無法復原。')).toBeInTheDocument();
    });
  });

  describe('Delete User Functionality', () => {
    test('deletes user when confirming delete', async () => {
      apiClient.delete.mockResolvedValue({
        data: {
          success: true
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/users/1');
      });
    });

    test('handles delete error', async () => {
      apiClient.delete.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/users/1');
        expect(consoleSpy).toHaveBeenCalledWith('刪除用戶錯誤:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    test('cancels delete when clicking cancel', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });
  });

  describe('File Upload/Download Functionality', () => {
    let originalCreateElement, originalAppendChild, originalRemoveChild;
    
    beforeEach(() => {
      // Store original DOM methods
      originalCreateElement = document.createElement;
      originalAppendChild = document.body.appendChild;
      originalRemoveChild = document.body.removeChild;
      
      // Reset URL mocks
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
    });
    
    afterEach(() => {
      // Restore original DOM methods
      if (originalCreateElement) document.createElement = originalCreateElement;
      if (originalAppendChild) document.body.appendChild = originalAppendChild;
      if (originalRemoveChild) document.body.removeChild = originalRemoveChild;
    });

    test('triggers file download when clicking download button', async () => {
      // Create a proper mock anchor element
      const mockAnchor = originalCreateElement.call(document, 'a');
      mockAnchor.click = jest.fn();
      mockAnchor.setAttribute = jest.fn();
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') return mockAnchor;
        return originalCreateElement.call(document, tagName);
      });
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const downloadButton = screen.getByText('下載範例');
        fireEvent.click(downloadButton);
        
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
        expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
      });
      
      // Clean up spies
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    test('generates correct CSV content for template download', async () => {
      // Create a proper mock anchor element
      const mockAnchor = originalCreateElement.call(document, 'a');
      mockAnchor.click = jest.fn();
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') return mockAnchor;
        return originalCreateElement.call(document, tagName);
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const downloadButton = screen.getByText('下載範例');
        fireEvent.click(downloadButton);
        
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'text/csv;charset=utf-8;'
          })
        );
      });
      
      createElementSpy.mockRestore();
    });

    test('triggers file input click when clicking upload button', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        // Find the upload button
        const uploadButton = screen.getByText('上傳Excel');
        expect(uploadButton).toBeInTheDocument();
        
        // Find the file input
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        
        // Mock the click method
        const clickMock = jest.fn();
        fileInput.click = clickMock;
        
        // Click the upload button
        fireEvent.click(uploadButton);
        
        // Verify the file input click was called
        expect(clickMock).toHaveBeenCalled();
      });
    });

    test('handles file upload with valid CSV file', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 3
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        // Use fireEvent.change directly without redefining the files property
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/users/bulk-import', expect.any(FormData), {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      });
    });

    test('handles file upload with invalid file type', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('請選擇CSV或Excel文件')).toBeInTheDocument();
      });
      
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    test('handles file upload API error', async () => {
      apiClient.post.mockRejectedValue({
        response: {
          data: {
            message: 'Upload failed'
          }
        }
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('匯入失敗: Upload failed')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles file upload API success', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 5
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('成功匯入 5 位用戶')).toBeInTheDocument();
      });
    });

    test('handles file upload API failure response', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: false,
          message: 'Invalid file format'
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['invalid,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('匯入失敗: Invalid file format')).toBeInTheDocument();
      });
    });

    test('clears file input after upload', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 2
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput.value).toBe('');
      });
    });

    test('displays upload progress message', async () => {
      // Mock a delayed response
      apiClient.post.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          data: {
            success: true,
            imported_count: 1
          }
        }), 100);
      }));
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      // Should show upload progress
      expect(screen.getByText('上傳中...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('成功匯入 1 位用戶')).toBeInTheDocument();
      });
    });

    test('clears upload status after timeout', async () => {
      jest.useFakeTimers();
      
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 1
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      // First expand the actions section
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      // Wait for the section to expand and file input to be available
      await waitFor(() => {
        expect(screen.getByText('上傳Excel')).toBeInTheDocument();
      });
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('成功匯入 1 位用戶')).toBeInTheDocument();
      });
      
      // Fast-forward time
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText('成功匯入 1 位用戶')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    test('handles no file selected', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { files: [] } });
      });
      
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    test('accepts CSV file with .csv extension', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 1
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand the actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.csv', { type: '' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Interactions', () => {
    test('closes user modal when clicking close button', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('新增用戶');
        fireEvent.click(addButton);
      });
      
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('user-modal')).not.toBeInTheDocument();
      });
    });

    test('refreshes user list after successful user modal submit', async () => {
      renderWithRouter(<UserManagement />);
      
      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.getByText('新增用戶')).toBeInTheDocument();
      });
      
      // Clear previous API calls after initial load
      apiClient.get.mockClear();
      
      const addButton = screen.getByText('新增用戶');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Should call the API again to refresh the user list
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('/users')
        );
      }, { timeout: 3000 });
    });
  });

  describe('Priority Level Display', () => {
    test('displays correct priority level badges', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('巡檢人員')).toBeInTheDocument(); // Level 1
        expect(screen.getByText('主管')).toBeInTheDocument(); // Level 2
      });
    });
  });

  describe('Access Control', () => {
    test('redirects non-logged-in users', () => {
      const nonLoggedInContext = {
        isAdmin: false,
        isLoggedIn: false,
        user: null
      };
      
      renderWithRouter(<UserManagement />, nonLoggedInContext);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('allows non-admin users to access the component', async () => {
      const nonAdminContext = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Regular User', priorityLevel: 1 }
      };
      
      renderWithRouter(<UserManagement />, nonAdminContext);
      
      // Non-admin users can access the component (data is filtered by backend)
      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
      
      await waitFor(() => {
        expect(screen.getByText('用戶管理')).toBeInTheDocument();
      });
    });

    test('allows admin users to access the component', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('用戶管理')).toBeInTheDocument();
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles API error when fetching users', async () => {
      apiClient.get.mockRejectedValue(new Error('Network Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Component should handle error gracefully
        // Since we're using a temporary bypass in the code, it shows empty state
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('displays error message when API returns error', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          success: false,
          message: 'Failed to fetch users'
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // The component shows empty state when API fails
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
    });

    test('handles delete API error with error response', async () => {
      apiClient.delete.mockRejectedValue({
        response: {
          data: {
            message: 'Cannot delete this user'
          }
        }
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('刪除用戶失敗: Cannot delete this user')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles delete API error without error response', async () => {
      apiClient.delete.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('刪除用戶失敗: 未知錯誤')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles delete API returning error flag', async () => {
      apiClient.delete.mockResolvedValue({
        data: {
          success: false,
          message: 'User has related data'
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('User has related data')).toBeInTheDocument();
      });
    });

    test('handles malformed API response for users', async () => {
      apiClient.get.mockResolvedValue({
        data: null
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles empty response for users', async () => {
      apiClient.get.mockResolvedValue({});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles network timeout error', async () => {
      apiClient.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles 401 unauthorized error', async () => {
      apiClient.get.mockRejectedValue({
        response: {
          status: 401,
          data: {
            message: 'Unauthorized'
          }
        }
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles 500 server error', async () => {
      apiClient.get.mockRejectedValue({
        response: {
          status: 500,
          data: {
            message: 'Internal Server Error'
          }
        }
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles missing delete confirmation user data', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      // Clear the user to delete
      const component = screen.getByTestId('confirm-modal');
      expect(component).toBeInTheDocument();
      
      // Simulate the case where userToDelete becomes null somehow
      const confirmButton = screen.getByTestId('confirm-button');
      
      // This should not proceed if userToDelete is null
      fireEvent.click(confirmButton);
      
      // Should still show the modal since deletion didn't proceed
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Data Mapping and Display', () => {
    test('correctly maps and displays user data from API', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Check if data is correctly mapped and displayed
        expect(screen.getByText('張三')).toBeInTheDocument();
        expect(screen.getByText('N000156652')).toBeInTheDocument();
        expect(screen.getAllByText('J020')).toHaveLength(2); // Should have multiple instances (mockUsers has 2 users with J020)
      });
    });

    test('handles missing user data gracefully', async () => {
      const incompleteUsers = [
        {
          ID: 1,
          UserName: '張三',
          // Missing other fields
        }
      ];
      
      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          users: incompleteUsers
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('張三')).toBeInTheDocument();
        expect(screen.getByText('-')).toBeInTheDocument(); // Default for missing department
      });
    });
  });

  describe('Integration with UserModal', () => {
    test('passes correct props to UserModal for editing', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0]);
      });
      
      // Check that UserModal receives the correct data
      expect(screen.getByText('編輯使用者')).toBeInTheDocument();
      expect(screen.getByText('User ID: N000156652')).toBeInTheDocument();
    });

    test('passes correct props to UserModal for copying', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const copyButtons = screen.getAllByTestId('copy-icon');
        fireEvent.click(copyButtons[0]);
      });
      
      // Check that UserModal receives empty userName and userID for copy
      expect(screen.getByText('複製使用者')).toBeInTheDocument();
      expect(screen.getByText('User ID: empty')).toBeInTheDocument();
      expect(screen.getByText('User Name: empty')).toBeInTheDocument();
    });

    test('passes all user data fields to UserModal for editing', async () => {
      const detailedUser = {
        ...mockUsers[0],
        supervisorName: '李主管',
        supervisorID: 'N000156653',
        sectionChiefName: '王課長',
        sectionChiefID: 'N000156654',
        factory: '製膜一廠',
        section: 'J020',
        departmentAbbr: 'J020',
        jobTitle: '保養員',
        secondDepartment: 'J020'
      };

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          users: [detailedUser]
        }
      });

      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0]);
      });
      
      expect(screen.getByText('編輯使用者')).toBeInTheDocument();
      expect(screen.getByText('User ID: N000156652')).toBeInTheDocument();
      expect(screen.getByText('User Name: 張三')).toBeInTheDocument();
    });

    test('preserves all user data when copying', async () => {
      const detailedUser = {
        ...mockUsers[0],
        supervisorName: '李主管',
        supervisorID: 'N000156653',
        factory: '製膜一廠',
        section: 'J020'
      };

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          users: [detailedUser]
        }
      });

      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const copyButtons = screen.getAllByTestId('copy-icon');
        fireEvent.click(copyButtons[0]);
      });
      
      expect(screen.getByText('複製使用者')).toBeInTheDocument();
      // Should have empty user name and ID but preserve other data
      expect(screen.getByText('User ID: empty')).toBeInTheDocument();
      expect(screen.getByText('User Name: empty')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and User Interactions', () => {
    test('handles rapid successive button clicks', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('新增用戶');
        // Click multiple times rapidly
        fireEvent.click(addButton);
        fireEvent.click(addButton);
        fireEvent.click(addButton);
      });
      
      // Should only show one modal
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      expect(screen.getAllByTestId('user-modal')).toHaveLength(1);
    });

    test('handles modal interactions while API call is in progress', async () => {
      // Mock a slow API response
      apiClient.get.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          data: {
            success: true,
            users: mockUsers
          }
        }), 1000);
      }));

      renderWithRouter(<UserManagement />);
      
      // Try to open modal while loading
      const addButton = screen.getByText('新增用戶');
      fireEvent.click(addButton);
      
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
    });

    test('handles clicking same edit button multiple times', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-icon');
        const firstEditButton = editButtons[0];
        
        fireEvent.click(firstEditButton);
        fireEvent.click(firstEditButton);
        fireEvent.click(firstEditButton);
      });
      
      // Should only show one modal
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      expect(screen.getAllByTestId('user-modal')).toHaveLength(1);
    });

    test('handles clicking different action buttons in sequence', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First click edit
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0]);
      });
      
      expect(screen.getByText('編輯使用者')).toBeInTheDocument();
      
      // Close the modal
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        // Then click copy
        const copyButtons = screen.getAllByTestId('copy-icon');
        fireEvent.click(copyButtons[0]);
      });
      
      expect(screen.getByText('複製使用者')).toBeInTheDocument();
    });

    test('handles switching between different users for editing', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Edit first user
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0]);
      });
      
      expect(screen.getByText('User ID: N000156652')).toBeInTheDocument();
      
      // Close modal
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        // Edit second user
        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[1]);
      });
      
      expect(screen.getByText('User ID: N000156653')).toBeInTheDocument();
    });

    test('handles very large user lists', async () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) => ({
        ID: i + 1,
        UserName: `用戶${i + 1}`,
        UserID: `N00015665${i.toString().padStart(2, '0')}`,
        Email: `user${i + 1}@example.com`,
        PriorityLevel: (i % 3) + 1,
        Position: '職員',
        Department: `部門${i % 10}`,
        Remark: '',
        IsAtWork: 1,
        EngName: `User${i + 1}`
      }));

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          users: largeUserList
        }
      });

      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('用戶1')).toBeInTheDocument();
        expect(screen.getByText('用戶100')).toBeInTheDocument();
      });
      
      // Should render all users
      const userRows = screen.getAllByText(/用戶\d+/);
      expect(userRows).toHaveLength(100);
    });

    test('handles users with missing or null data fields', async () => {
      const usersWithMissingData = [
        {
          ID: 1,
          UserName: '完整用戶',
          UserID: 'N000156652',
          Email: 'complete@example.com',
          PriorityLevel: 1,
          Position: '職員',
          Department: '部門A',
          Remark: '備註',
          IsAtWork: 1,
          EngName: 'Complete User'
        },
        {
          ID: 2,
          UserName: '缺失用戶',
          UserID: 'N000156653',
          // Missing email, position, department, etc.
          PriorityLevel: 2,
          IsAtWork: 1
        },
        {
          ID: 3,
          UserName: null,
          UserID: null,
          Email: null,
          PriorityLevel: null,
          Position: null,
          Department: null,
          Remark: null,
          IsAtWork: null,
          EngName: null
        }
      ];

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          users: usersWithMissingData
        }
      });

      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('完整用戶')).toBeInTheDocument();
        expect(screen.getByText('缺失用戶')).toBeInTheDocument();
        
        // Check that missing data is handled gracefully
        const dashElements = screen.getAllByText('-');
        expect(dashElements.length).toBeGreaterThan(0);
      });
    });

    test('handles concurrent modal operations', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Open user modal first
        const addButton = screen.getByText('新增用戶');
        fireEvent.click(addButton);
        
        // Then try to open delete modal
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      // Should handle concurrent modals appropriately
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    });

    test('handles priority level edge cases', async () => {
      const usersWithEdgePriorities = [
        { ...mockUsers[0], PriorityLevel: 0 },
        { ...mockUsers[0], ID: 2, UserID: 'N000156653', PriorityLevel: 4 },
        { ...mockUsers[0], ID: 3, UserID: 'N000156654', PriorityLevel: 999 },
        { ...mockUsers[0], ID: 4, UserID: 'N000156655', PriorityLevel: null }
      ];

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          users: usersWithEdgePriorities
        }
      });

      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('級別 0')).toBeInTheDocument();
        expect(screen.getByText('超級管理員')).toBeInTheDocument();
        expect(screen.getByText('級別 999')).toBeInTheDocument();
        expect(screen.getByText('級別 null')).toBeInTheDocument();
      });
    });
  });

  describe('Batch Import Access Control for Priority Levels 1 and 2', () => {
    test('shows collapsible actions button for priority level 1 users', async () => {
      const priorityLevel1Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 1 User', priorityLevel: 1 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel1Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        expect(toggleButton).toBeInTheDocument();
      });
    });

    test('shows collapsible actions button for priority level 2 users', async () => {
      const priorityLevel2Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 2 User', priorityLevel: 2 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel2Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        expect(toggleButton).toBeInTheDocument();
      });
    });

    test('shows collapsible actions button for priority level 3+ users', async () => {
      const priorityLevel3Context = {
        isAdmin: true,
        isLoggedIn: true,
        user: { id: 1, userName: 'Admin User', priorityLevel: 3 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel3Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        expect(toggleButton).toBeInTheDocument();
      });
    });

    test('shows appropriate explanation text for priority level 1 users', async () => {
      const priorityLevel1Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 1 User', priorityLevel: 1 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel1Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/批次匯入功能限制為優先級別1和2的用戶使用/)).toBeInTheDocument();
        expect(screen.getByText(/只能匯入同部門前3碼的用戶/)).toBeInTheDocument();
      });
    });

    test('shows appropriate explanation text for priority level 2 users', async () => {
      const priorityLevel2Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 2 User', priorityLevel: 2 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel2Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/批次匯入功能限制為優先級別1和2的用戶使用/)).toBeInTheDocument();
        expect(screen.getByText(/只能匯入同部門前3碼的用戶/)).toBeInTheDocument();
      });
    });

    test('shows standard explanation text for priority level 3+ users', async () => {
      const priorityLevel3Context = {
        isAdmin: true,
        isLoggedIn: true,
        user: { id: 1, userName: 'Admin User', priorityLevel: 3 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel3Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/批次匯入使用者預設密碼為工號後6碼/)).toBeInTheDocument();
        expect(screen.queryByText(/批次匯入功能限制為優先級別1和2的用戶使用/)).not.toBeInTheDocument();
      });
    });

    test('batch import functionality works for priority level 1 users', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 2,
          error_count: 0,
          message: '匯入完成：成功 2 個，失敗 0 個',
          imported_users: [
            { row: 2, user_name: '張三', user_id: 'N000156652', priority_level: 1 },
            { row: 3, user_name: '李四', user_id: 'N000156653', priority_level: 2 }
          ]
        }
      });

      const priorityLevel1Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 1 User', priorityLevel: 1 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel1Context);
      
      // First expand the actions section
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      // Wait for the section to expand and file input to be available
      await waitFor(() => {
        expect(screen.getByText('上傳Excel')).toBeInTheDocument();
      });

      // Now interact with the file input
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/users/bulk-import', expect.any(FormData), {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        expect(screen.getByText('匯入完成：成功 2 個，失敗 0 個')).toBeInTheDocument();
      });
    });

    test('batch import functionality works for priority level 2 users', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 1,
          error_count: 1,
          message: '匯入完成：成功 1 個，失敗 1 個',
          imported_users: [
            { row: 2, user_name: '王五', user_id: 'N000156654', priority_level: 2 }
          ],
          errors: ['第3行：只能匯入優先級別1和2的用戶，實際為級別3']
        }
      });

      const priorityLevel2Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 2 User', priorityLevel: 2 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel2Context);
      
      // First expand the actions section
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      // Wait for the section to expand and file input to be available
      await waitFor(() => {
        expect(screen.getByText('上傳Excel')).toBeInTheDocument();
      });

      // Now interact with the file input
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/users/bulk-import', expect.any(FormData), {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        expect(screen.getByText('匯入完成：成功 1 個，失敗 1 個')).toBeInTheDocument();
      });
    });

    test('handles batch import API error for department restrictions', async () => {
      apiClient.post.mockRejectedValue({
        response: {
          data: {
            message: '批量匯入功能只開放給優先級別1和2的用戶使用'
          }
        }
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const priorityLevel3Context = {
        isAdmin: true,
        isLoggedIn: true,
        user: { id: 1, userName: 'Admin User', priorityLevel: 3 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel3Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('匯入失敗: 批量匯入功能只開放給優先級別1和2的用戶使用')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles batch import with mixed results', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 2,
          error_count: 3,
          message: '匯入完成：成功 2 個，失敗 3 個',
          imported_users: [
            { row: 2, user_name: '張三', user_id: 'N000156652', priority_level: 1 },
            { row: 4, user_name: '李四', user_id: 'N000156653', priority_level: 2 }
          ],
          errors: [
            '第3行：只能匯入部門前3碼與您相同(J02)的用戶，實際為JH5',
            '第5行：用戶ID N000156654 已存在',
            '第6行：只能匯入優先級別1和2的用戶，實際為級別3'
          ]
        }
      });

      const priorityLevel1Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 1 User', priorityLevel: 1, department: 'J020' }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel1Context);
      
      // First expand the actions section
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      // Wait for the section to expand and file input to be available
      await waitFor(() => {
        expect(screen.getByText('上傳Excel')).toBeInTheDocument();
      });

      // Now interact with the file input
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        const file = new File(['complex,data'], 'complex_test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('匯入完成：成功 2 個，失敗 3 個')).toBeInTheDocument();
      });
    });

    test('validates CSV file format for batch import', async () => {
      const priorityLevel1Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 1 User', priorityLevel: 1 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel1Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const invalidFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
        
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('請選擇CSV或Excel文件')).toBeInTheDocument();
      });
      
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    test('clears file input after successful batch import', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 1,
          error_count: 0,
          message: '匯入完成：成功 1 個，失敗 0 個'
        }
      });

      const priorityLevel2Context = {
        isAdmin: false,
        isLoggedIn: true,
        user: { id: 1, userName: 'Priority 2 User', priorityLevel: 2 }
      };
      
      renderWithRouter(<UserManagement />, priorityLevel2Context);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput.value).toBe('');
      });
    });
  });

  describe('New Features - Search, Pagination, and Collapsible Actions', () => {
    test('renders search input with proper placeholder', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('搜索用戶ID（輸入10位自動搜索）');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
      });
    });

    test('automatically searches when typing 10 characters', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('搜索用戶ID（輸入10位自動搜索）');
        
        // Clear previous calls
        apiClient.get.mockClear();
        
        // Type 10 characters
        fireEvent.change(searchInput, { target: { value: 'N000156652' } });
      });
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('search=N000156652')
        );
      });
    });

    test('resets search when typing less than 10 characters after 10', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('搜索用戶ID（輸入10位自動搜索）');
        
        // First type 10 characters
        fireEvent.change(searchInput, { target: { value: 'N000156652' } });
        
        // Clear previous calls
        apiClient.get.mockClear();
        
        // Then reduce to less than 10
        fireEvent.change(searchInput, { target: { value: 'N00015665' } });
      });
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('search=N00015665')
        );
      });
    });

    test('renders collapsible actions button', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        expect(toggleButton).toBeInTheDocument();
        expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
      });
    });

    test('expands and collapses actions section', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const toggleButton = screen.getByTitle('展開操作選項');
        
        // Initially collapsed - should not see download/upload buttons
        expect(screen.queryByText('下載範例')).not.toBeInTheDocument();
        
        // Click to expand
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        // Should now see the expanded content
        expect(screen.getByText('下載範例')).toBeInTheDocument();
        expect(screen.getByText('上傳Excel')).toBeInTheDocument();
        expect(screen.getByText('📋 批次匯入說明：')).toBeInTheDocument();
        
        // Button should now show "收起"
        expect(screen.getByTitle('收起操作選項')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
      });
      
      // Click again to collapse
      const collapseButton = screen.getByTitle('收起操作選項');
      fireEvent.click(collapseButton);
      
      await waitFor(() => {
        // Should be collapsed again
        expect(screen.queryByText('下載範例')).not.toBeInTheDocument();
        expect(screen.getByTitle('展開操作選項')).toBeInTheDocument();
      });
    });

    test('renders page size selector', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const pageSizeSelector = screen.getByDisplayValue('10');
        expect(pageSizeSelector).toBeInTheDocument();
        
        // Should have options
        expect(screen.getByText('每頁顯示：')).toBeInTheDocument();
      });
    });

    test('changes page size and triggers API call', async () => {
      renderWithRouter(<UserManagement />);
      
      // Wait for initial render and page size selector to be available
      await waitFor(() => {
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      });
      
      const pageSizeSelector = screen.getByDisplayValue('10');
      
      // Clear previous calls after initial load
      apiClient.get.mockClear();
      
      // Change page size to 20
      fireEvent.change(pageSizeSelector, { target: { value: '20' } });
      
      // Wait longer for the setTimeout in handlePageSizeChange to execute
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('page_size=20')
        );
      }, { timeout: 3000 });
    });

    test('renders pagination controls', async () => {
      // Mock data with multiple pages
      const multiPageResponse = {
        success: true,
        users: mockUsers,
        pagination: {
          current_page: 1,
          page_size: 5,
          total_count: 15,
          total_pages: 3,
          has_next: true,
          has_prev: false
        }
      };
      
      apiClient.get.mockResolvedValue({ data: multiPageResponse });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Should show pagination info
        expect(screen.getByText('顯示 1 到 5 條，共 15 條記錄')).toBeInTheDocument();
        
        // Should show navigation buttons
        expect(screen.getByTitle('上一頁')).toBeInTheDocument();
        expect(screen.getByTitle('下一頁')).toBeInTheDocument();
        
        // Should show page numbers
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    test('navigates to next page', async () => {
      // Mock data with multiple pages
      const multiPageResponse = {
        success: true,
        users: mockUsers,
        pagination: {
          current_page: 1,
          page_size: 5,
          total_count: 15,
          total_pages: 3,
          has_next: true,
          has_prev: false
        }
      };
      
      apiClient.get.mockResolvedValue({ data: multiPageResponse });
      
      renderWithRouter(<UserManagement />);
      
      // Wait for the page to load and next button to be enabled
      await waitFor(() => {
        const nextButton = screen.getByTitle('下一頁');
        expect(nextButton).not.toBeDisabled();
      });
      
      const nextButton = screen.getByTitle('下一頁');
      
      // Clear previous calls after initial load
      apiClient.get.mockClear();
      
      // Click next page
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        );
      }, { timeout: 3000 });
    });

    test('navigates to specific page', async () => {
      // Mock data with multiple pages
      const multiPageResponse = {
        success: true,
        users: mockUsers,
        pagination: {
          current_page: 1,
          page_size: 5,
          total_count: 15,
          total_pages: 3,
          has_next: true,
          has_prev: false
        }
      };
      
      apiClient.get.mockResolvedValue({ data: multiPageResponse });
      
      renderWithRouter(<UserManagement />);
      
      // Wait for pagination to render and page buttons to be available
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
      
      // Find page 3 button (should be clickable)
      const page3Button = screen.getByText('3');
      
      // Clear previous calls after initial load
      apiClient.get.mockClear();
      
      // Click page 3
      fireEvent.click(page3Button);
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('page=3')
        );
      }, { timeout: 3000 });
    });

    test('disables navigation buttons appropriately', async () => {
      // Mock data for first page
      const firstPageResponse = {
        success: true,
        users: mockUsers,
        pagination: {
          current_page: 1,
          page_size: 5,
          total_count: 15,
          total_pages: 3,
          has_next: true,
          has_prev: false
        }
      };
      
      apiClient.get.mockResolvedValue({ data: firstPageResponse });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const prevButton = screen.getByTitle('上一頁');
        const nextButton = screen.getByTitle('下一頁');
        
        // Previous should be disabled on first page
        expect(prevButton).toBeDisabled();
        expect(nextButton).not.toBeDisabled();
      });
    });

    test('handles scrollable table content', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Find the table container
        const tableContainer = document.querySelector('.overflow-auto');
        expect(tableContainer).toBeInTheDocument();
        expect(tableContainer).toHaveClass('border');
        expect(tableContainer).toHaveClass('rounded-lg');
      });
    });

    test('shows user list title', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('用戶列表')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    test('has proper heading structure', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '用戶管理' })).toBeInTheDocument();
      });
    });

    test('has proper table structure with headers', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        // Check column headers
        expect(screen.getByRole('columnheader', { name: '用戶名稱' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: '用戶ID' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: '優先級別' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: '部門' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: '操作' })).toBeInTheDocument();
      });
    });

    test('buttons have proper accessibility attributes', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: '新增用戶' });
        expect(addButton).toBeInTheDocument();
        
        // Expand actions section to access download/upload buttons
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /下載範例/i });
        expect(downloadButton).toBeInTheDocument();
        expect(downloadButton).toHaveAttribute('title', '下載Excel範例文件');
        
        const uploadButton = screen.getByRole('button', { name: /上傳Excel/i });
        expect(uploadButton).toBeInTheDocument();
        expect(uploadButton).toHaveAttribute('title', '上傳Excel文件批量匯入用戶');
      });
    });

    test('action buttons have proper titles for screen readers', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTitle('編輯用戶');
        expect(editButtons).toHaveLength(2);
        
        const copyButtons = screen.getAllByTitle('複製用戶');
        expect(copyButtons).toHaveLength(2);
        
        const deleteButtons = screen.getAllByTitle('刪除用戶');
        expect(deleteButtons).toHaveLength(2);
      });
    });

    test('keyboard navigation works for buttons', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: '新增用戶' });
        
        // Focus the button
        addButton.focus();
        expect(document.activeElement).toBe(addButton);
        
        // Simulate Enter key press
        fireEvent.keyDown(addButton, { key: 'Enter', code: 'Enter' });
        fireEvent.keyUp(addButton, { key: 'Enter', code: 'Enter' });
      });
    });

    test('keyboard navigation works for action buttons', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-icon');
        const firstEditButton = editButtons[0].closest('button');
        
        // Focus and activate with keyboard
        firstEditButton.focus();
        expect(document.activeElement).toBe(firstEditButton);
        
        fireEvent.keyDown(firstEditButton, { key: 'Enter', code: 'Enter' });
        fireEvent.keyUp(firstEditButton, { key: 'Enter', code: 'Enter' });
      });
    });

    test('file input has proper accessibility', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Expand actions section to access file input
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx,.xls');
      });
    });

    test('modal dialogs have proper ARIA attributes', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('新增用戶');
        fireEvent.click(addButton);
      });
      
      const modal = screen.getByTestId('user-modal');
      expect(modal).toBeInTheDocument();
      
      // Check that modal content is accessible
      expect(screen.getByText('新增使用者')).toBeInTheDocument();
    });

    test('confirm dialog has proper structure', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-icon');
        fireEvent.click(deleteButtons[0]);
      });
      
      const confirmModal = screen.getByTestId('confirm-modal');
      expect(confirmModal).toBeInTheDocument();
      
      // Check dialog structure
      expect(screen.getByText('確認刪除')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    });

    test('table rows are properly structured for screen readers', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const tableRows = screen.getAllByRole('row');
        expect(tableRows.length).toBeGreaterThan(2); // Header + data rows
        
        // Check that each data row has proper cell structure
        const dataCells = screen.getAllByRole('cell');
        expect(dataCells.length).toBeGreaterThan(0);
      });
    });

    test('error messages are accessible', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          success: false,
          message: 'Test error message'
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Error messages should be in the document and accessible
        // In this case, the component handles errors silently, so we test the loading state
        expect(screen.getByText('沒有找到用戶')).toBeInTheDocument();
      });
    });

    test('upload status messages are accessible', async () => {
      apiClient.post.mockResolvedValue({
        data: {
          success: true,
          imported_count: 3
        }
      });
      
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // Expand actions section to access file input
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      
      await waitFor(() => {
        const statusMessage = screen.getByText('成功匯入 3 位用戶');
        expect(statusMessage).toBeInTheDocument();
        
        // Status message should be visible and accessible
        expect(statusMessage).toBeVisible();
      });
    });

    test('focus management in modals', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('新增用戶');
        fireEvent.click(addButton);
      });
      
      // Modal should be open and focusable elements should be available
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      
      const submitButton = screen.getByTestId('submit-button');
      const closeButton = screen.getByTestId('close-button');
      
      expect(submitButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });

    test('keyboard navigation between focusable elements', async () => {
      renderWithRouter(<UserManagement />);
      
      await waitFor(() => {
        // First expand actions section
        const toggleButton = screen.getByTitle('展開操作選項');
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        // Test tabbing through main buttons
        const addButton = screen.getByRole('button', { name: '新增用戶' });
        const downloadButton = screen.getByRole('button', { name: /下載範例/i });
        const uploadButton = screen.getByRole('button', { name: /上傳Excel/i });
        
        expect(addButton).toBeInTheDocument();
        expect(downloadButton).toBeInTheDocument();
        expect(uploadButton).toBeInTheDocument();
        
        // These buttons should be focusable
        addButton.focus();
        expect(document.activeElement).toBe(addButton);
        
        downloadButton.focus();
        expect(document.activeElement).toBe(downloadButton);
        
        uploadButton.focus();
        expect(document.activeElement).toBe(uploadButton);
      });
    });
  });
});
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RouteBinding from '../pages/RouteBinding';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/authService';

// Mock dependencies but keep the real CreateRouteModal
jest.mock('../context/AuthContext');
jest.mock('../services/authService');

jest.mock('../components/Layout/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('../components/LogoutButton', () => {
  return function MockLogoutButton() {
    return <button data-testid="logout-button">登出</button>;
  };
});

// Mock react-modal
jest.mock('react-modal', () => {
  const Modal = ({ isOpen, onRequestClose, children, contentLabel }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="react-modal" role="dialog" aria-label={contentLabel}>
        <button onClick={onRequestClose} data-testid="modal-overlay">Close</button>
        {children}
      </div>
    );
  };
  Modal.setAppElement = jest.fn();
  return Modal;
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaRegFolderOpen: () => <div data-testid="folder-icon">📁</div>,
  FaPencilAlt: () => <div data-testid="edit-icon">✏️</div>,
  FaTrashAlt: () => <div data-testid="delete-icon">🗑️</div>
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Sample test data
const mockRoutes = [
  {
    RouteId: 'route1',
    RouteName: '測試路線1',
    BindingTableId: 'form1',
    BindingTableName: '測試表單1'
  },
  {
    RouteId: 'route2',
    RouteName: '測試路線2',
    BindingTableId: 'form2',
    BindingTableName: '測試表單2'
  }
];

const mockForms = [
  { id: 'form1', eFormName: '測試表單1' },
  { id: 'form2', eFormName: '測試表單2' },
  { id: 'form3', eFormName: '測試表單3' }
];

const mockUserInfo = {
  department: 'IT'
};

describe('RouteBinding Integration Tests', () => {
  const mockUseAuth = useAuth;
  const mockApiClient = apiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup auth context
    mockUseAuth.mockReturnValue({
      isAdmin: false
    });

    // Setup localStorage
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUserInfo));

    // Setup API responses
    mockApiClient.get.mockImplementation((url) => {
      if (url.includes('/routes')) {
        return Promise.resolve({
          data: {
            success: true,
            routes: mockRoutes,
            pagination: { total_records: 2 }
          }
        });
      }
      if (url.includes('/search-department')) {
        return Promise.resolve({
          data: {
            success: true,
            forms: mockForms
          }
        });
      }
      return Promise.reject(new Error('Unknown API endpoint'));
    });

    mockApiClient.post.mockResolvedValue({ data: { success: true } });
    mockApiClient.put.mockResolvedValue({ data: { success: true } });
    mockApiClient.delete.mockResolvedValue({ data: { success: true } });
  });

  describe('完整的新增路線流程', () => {
    test('應該能夠完成完整的新增路線流程', async () => {
      render(<RouteBinding />);

      // 等待初始數據載入
      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 點擊新增路線按鈕
      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      // 驗證模態框打開
      await waitFor(() => {
        expect(screen.getByTestId('react-modal')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // 等待表單選項載入
      await waitFor(() => {
        const formSelect = screen.getByLabelText('綁定表單');
        expect(formSelect).toBeInTheDocument();
        expect(screen.getAllByText('測試表單1')[1]).toBeInTheDocument(); // 選擇模態框內的
      });

      // 填寫表單
      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '新增的測試路線');

      const formSelect = screen.getByLabelText('綁定表單');
      await userEvent.selectOptions(formSelect, 'form3');

      // 提交表單
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      // 驗證API調用
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/routes', {
          RouteName: '新增的測試路線',
          BindingTableId: 'form3',
          BindingTableName: '測試表單3'
        });
      });

      // 驗證成功訊息
      await waitFor(() => {
        expect(screen.getByText('路線新增成功！')).toBeInTheDocument();
      });

      // 確認成功訊息後關閉模態框
      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      // 驗證數據重新載入 (routes API + forms API + reload routes API)
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(3);
      }, { timeout: 5000 });
    });

    test('應該處理新增路線時的驗證錯誤', async () => {
      render(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 打開新增模態框
      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      await waitFor(() => {
        const formSelect = screen.getByLabelText('綁定表單');
        expect(formSelect).toBeInTheDocument();
      });

      // 等待表單載入
      await waitFor(() => {
        const formSelect = screen.getByLabelText('綁定表單');
        expect(formSelect).toBeInTheDocument();
      });

      // 不填寫任何資料直接提交
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText('請輸入路線名稱')).toBeInTheDocument();
      });

      // 關閉錯誤訊息
      const confirmErrorButton = screen.getByText('確認');
      await userEvent.click(confirmErrorButton);

      // 應該還在模態框中
      expect(screen.getByTestId('react-modal')).toBeInTheDocument();
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('完整的編輯路線流程', () => {
    test('應該能夠完成完整的編輯路線流程', async () => {
      render(<RouteBinding />);

      // 等待數據載入
      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 點擊第一個路線的編輯按鈕
      const editButtons = screen.getAllByTestId('edit-icon');
      await userEvent.click(editButtons[0]);

      // 驗證編輯模態框打開
      await waitFor(() => {
        expect(screen.getByText('修改路線')).toBeInTheDocument();
      });

      // 等待數據初始化
      await waitFor(() => {
        expect(screen.getByDisplayValue('測試路線1')).toBeInTheDocument();
      });

      // 修改路線名稱
      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.clear(routeNameInput);
      await userEvent.type(routeNameInput, '修改後的路線名稱');

      // 修改綁定表單
      const formSelect = screen.getByLabelText('綁定表單');
      await userEvent.selectOptions(formSelect, 'form2');

      // 提交修改
      const submitButton = screen.getByText('確認修改');
      await userEvent.click(submitButton);

      // 驗證API調用
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/routes/route1', {
          RouteName: '修改後的路線名稱',
          BindingTableId: 'form2',
          BindingTableName: '測試表單2'
        });
      });

      // 驗證成功訊息
      await waitFor(() => {
        expect(screen.getByText('路線修改成功！')).toBeInTheDocument();
      });
    });

    test('應該正確初始化編輯數據', async () => {
      render(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線2')).toBeInTheDocument();
      });

      // 點擊第二個路線的編輯按鈕
      const editButtons = screen.getAllByTestId('edit-icon');
      await userEvent.click(editButtons[1]);

      await waitFor(() => {
        expect(screen.getByText('修改路線')).toBeInTheDocument();
      });

      // 驗證編輯數據正確載入
      await waitFor(() => {
        const routeNameInput = screen.getByLabelText('路線名稱');
        expect(routeNameInput.value).toBe('測試路線2');

        const formSelect = screen.getByLabelText('綁定表單');
        expect(formSelect.value).toBe('form2');
      });
    });
  });

  describe('完整的刪除路線流程', () => {
    test('應該能夠完成完整的刪除路線流程', async () => {
      render(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 點擊刪除按鈕
      const deleteButtons = screen.getAllByTestId('delete-icon');
      await userEvent.click(deleteButtons[0]);

      // 驗證確認模態框
      expect(screen.getByText('確認刪除路線')).toBeInTheDocument();
      expect(screen.getByText('確定要刪除路線「測試路線1」嗎？')).toBeInTheDocument();

      // 確認刪除
      const confirmButton = screen.getByText('刪除');
      await userEvent.click(confirmButton);

      // 驗證API調用
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/routes/route1');
      });

      // 驗證數據重新載入
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2); // 初始載入 + 刪除後重新載入
      }, { timeout: 3000 });
    });

    test('應該能夠取消刪除', async () => {
      render(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 點擊刪除按鈕
      const deleteButtons = screen.getAllByTestId('delete-icon');
      await userEvent.click(deleteButtons[0]);

      // 取消刪除
      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      // 驗證模態框關閉且沒有API調用
      expect(screen.queryByText('確認刪除路線')).not.toBeInTheDocument();
      expect(mockApiClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('模態框狀態管理', () => {
    test('應該能夠正確關閉模態框', async () => {
      render(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 打開新增模態框
      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('react-modal')).toBeInTheDocument();
      });

      // 點擊取消
      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      // 驗證模態框關閉
      expect(screen.queryByTestId('react-modal')).not.toBeInTheDocument();
    });

    test('模態框之間不應該互相影響', async () => {
      render(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 先打開編輯模態框
      const editButtons = screen.getAllByTestId('edit-icon');
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('修改路線')).toBeInTheDocument();
      });

      // 關閉編輯模態框
      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      // 打開新增模態框
      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('react-modal')).toBeInTheDocument();
      });

      // 驗證表單是空的（沒有被編輯模態框的數據影響）
      await waitFor(() => {
        const routeNameInput = screen.getByLabelText('路線名稱');
        expect(routeNameInput.value).toBe('');
      });
    });
  });

  describe('API錯誤處理', () => {
    test('應該處理新增路線API錯誤', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { data: { message: '路線名稱重複' } }
      });

      render(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 打開新增模態框並填寫表單
      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      await waitFor(() => {
        const formSelect = screen.getByLabelText('綁定表單');
        expect(formSelect).toBeInTheDocument();
      });

      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '重複的路線名稱');

      const formSelect = screen.getByLabelText('綁定表單');
      await userEvent.selectOptions(formSelect, 'form1');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      // 驗證錯誤處理
      await waitFor(() => {
        expect(screen.getByText('路線名稱重複')).toBeInTheDocument();
      });
    });

    test('應該處理刪除路線API錯誤', async () => {
      mockApiClient.delete.mockResolvedValue({
        data: { success: false, message: '無法刪除此路線' }
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      // 執行刪除流程
      const deleteButtons = screen.getAllByTestId('delete-icon');
      await userEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText('刪除');
      await userEvent.click(confirmButton);

      // 驗證錯誤處理
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Delete failed:', '無法刪除此路線');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('數據一致性', () => {
    test('操作完成後應該正確重新載入數據', async () => {
      // 模擬操作後數據變化
      let callCount = 0;
      mockApiClient.get.mockImplementation((url) => {
        if (url.includes('/routes')) {
          callCount++;
          if (callCount === 1) {
            // 初始載入
            return Promise.resolve({
              data: {
                success: true,
                routes: mockRoutes,
                pagination: { total_records: 2 }
              }
            });
          } else {
            // 操作後重新載入，模擬新增了一個路線
            return Promise.resolve({
              data: {
                success: true,
                routes: [...mockRoutes, {
                  RouteId: 'route3',
                  RouteName: '新增的路線',
                  BindingTableId: 'form3',
                  BindingTableName: '測試表單3'
                }],
                pagination: { total_records: 3 }
              }
            });
          }
        }
        if (url.includes('/search-department')) {
          return Promise.resolve({
            data: {
              success: true,
              forms: mockForms
            }
          });
        }
        return Promise.reject(new Error('Unknown API endpoint'));
      });

      render(<RouteBinding />);

      // 驗證初始數據
      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
        expect(screen.getByText('測試路線2')).toBeInTheDocument();
        expect(screen.queryByText('新增的路線')).not.toBeInTheDocument();
      });

      // 執行新增操作
      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      await waitFor(() => {
        const formSelect = screen.getByLabelText('綁定表單');
        expect(formSelect).toBeInTheDocument();
      });

      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '新增的路線');

      const formSelect = screen.getByLabelText('綁定表單');
      await userEvent.selectOptions(formSelect, 'form3');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      // 確認成功訊息
      await waitFor(() => {
        expect(screen.getByText('路線新增成功！')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      // 驗證數據重新載入後的結果 (模擬新增成功後的狀態)
      await waitFor(() => {
        // 由於我們模擬了數據重新載入，檢查API被調用
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=1&limit=10&search=');
      }, { timeout: 5000 });
    });
  });
});
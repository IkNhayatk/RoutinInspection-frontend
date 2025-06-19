import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RouteBinding from '../RouteBinding';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/authService';
import { renderWithRouter } from '../../testUtils';

// Mock dependencies
jest.mock('../../context/AuthContext');
jest.mock('../../services/authService');
jest.mock('../../context/ThemeContext', () => require('../../__mocks__/ThemeContext'));
jest.mock('../../components/Layout/Sidebar', () => {
  return function MockSidebar({ isAdmin }) {
    return <div data-testid="sidebar">Sidebar - Admin: {isAdmin.toString()}</div>;
  };
});
jest.mock('../../components/LogoutButton', () => {
  return function MockLogoutButton() {
    return <button data-testid="logout-button">登出</button>;
  };
});
jest.mock('../../components/CreateRouteModal', () => {
  return function MockCreateRouteModal({ isOpen, onClose, onSubmit, isEditing, editData }) {
    if (!isOpen) return null;
    return (
      <div data-testid="create-route-modal">
        <h3>{isEditing ? '編輯路線' : '新增路線'}</h3>
        {editData && <div data-testid="edit-data">{JSON.stringify(editData)}</div>}
        <button onClick={onClose}>關閉</button>
        <button
          onClick={() => onSubmit({
            RouteName: 'Test Route',
            BindingTableId: 'form123',
            BindingTableName: 'Test Form'
          })}
        >
          提交
        </button>
      </div>
    );
  };
});
jest.mock('../../components/ConfirmModal', () => {
  return function MockConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onClose}>取消</button>
        <button onClick={onConfirm}>確認</button>
      </div>
    );
  };
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaRegFolderOpen: () => <div data-testid="folder-icon">📁</div>,
  FaPencilAlt: () => <div data-testid="edit-icon">✏️</div>,
  FaTrashAlt: () => <div data-testid="delete-icon">🗑️</div>
}));

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
  },
  {
    RouteId: 'route3',
    RouteName: '未綁定路線',
    BindingTableId: null,
    BindingTableName: null
  }
];

const mockApiResponse = {
  data: {
    success: true,
    routes: mockRoutes,
    pagination: {
      total_records: 3
    }
  }
};

describe('RouteBinding Component', () => {
  const mockUseAuth = useAuth;
  const mockApiClient = apiClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default auth context
    mockUseAuth.mockReturnValue({
      isAdmin: false
    });

    // Setup default API responses
    mockApiClient.get.mockResolvedValue(mockApiResponse);
    mockApiClient.post.mockResolvedValue({ data: { success: true } });
    mockApiClient.put.mockResolvedValue({ data: { success: true } });
    mockApiClient.delete.mockResolvedValue({ data: { success: true } });
  });

  describe('初始渲染', () => {
    test('應該正確渲染主要組件', async () => {
      renderWithRouter(<RouteBinding />);

      // 檢查標題
      expect(screen.getByText('路線綁定')).toBeInTheDocument();
      
      // 檢查側邊欄和登出按鈕
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      
      // 檢查搜尋框
      expect(screen.getByPlaceholderText('搜尋路線...')).toBeInTheDocument();
      
      // 檢查新增按鈕
      expect(screen.getByText('新增路線')).toBeInTheDocument();

      // 等待API調用完成
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=1&limit=10&search=');
      });
    });

    test('應該正確顯示表格標題', () => {
      renderWithRouter(<RouteBinding />);

      expect(screen.getByText('路線名稱')).toBeInTheDocument();
      expect(screen.getByText('綁定表單')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
    });

    test('應該將isAdmin狀態傳遞給Sidebar', () => {
      mockUseAuth.mockReturnValue({ isAdmin: true });
      renderWithRouter(<RouteBinding />);

      expect(screen.getByText('Sidebar - Admin: true')).toBeInTheDocument();
    });
  });

  describe('數據載入', () => {
    test('應該在載入時顯示載入指示器', async () => {
      // 延遲API響應以測試載入狀態
      let resolvePromise;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(delayedPromise);

      renderWithRouter(<RouteBinding />);

      // 檢查載入狀態
      expect(screen.getByText('載入中...')).toBeInTheDocument();

      // 完成載入
      resolvePromise(mockApiResponse);
      
      await waitFor(() => {
        expect(screen.queryByText('載入中...')).not.toBeInTheDocument();
      });
    });

    test('應該正確顯示路線數據', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
        expect(screen.getByText('測試路線2')).toBeInTheDocument();
        expect(screen.getByText('測試表單2')).toBeInTheDocument();
        expect(screen.getByText('未綁定路線')).toBeInTheDocument();
        expect(screen.getByText('未綁定表單')).toBeInTheDocument();
      });
    });

    test('應該處理空數據狀態', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          routes: [],
          pagination: { total_records: 0 }
        }
      });

      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
        expect(screen.getByText('無資料...')).toBeInTheDocument();
      });
    });

    test('應該處理API錯誤', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching routes:', expect.any(Error));
        expect(screen.getByText('無資料...')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('搜尋功能', () => {
    test('應該根據路線名稱過濾數據', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜尋路線...');
      await userEvent.type(searchInput, '測試路線1');

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=1&limit=10&search=測試路線1');
      });
    });

    test('應該根據表單名稱過濾數據', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜尋路線...');
      await userEvent.type(searchInput, '測試表單2');

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=1&limit=10&search=測試表單2');
      });
    });

    test('搜尋時應該重置到第一頁', async () => {
      // 模擬有多頁數據
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          routes: mockRoutes,
          pagination: { total_records: 25 }
        }
      });

      renderWithRouter(<RouteBinding />);

      // 等待初始載入完成
      await waitFor(() => {
        expect(screen.getByText('頁面 1 / 3')).toBeInTheDocument();
      });

      // 先到第2頁
      const nextButton = screen.getByText('下一頁');
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=2&limit=10&search=');
      });

      // 進行搜尋
      const searchInput = screen.getByPlaceholderText('搜尋路線...');
      await userEvent.type(searchInput, '測試');

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=1&limit=10&search=測試');
      });
    });
  });

  describe('分頁功能', () => {
    test('應該正確顯示分頁信息', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('頁面 1 / 1')).toBeInTheDocument();
      });
    });

    test('應該能夠更改每頁顯示數量', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('10');
      await userEvent.selectOptions(select, '20');

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=1&limit=20&search=');
      });
    });

    test('應該能夠導航到下一頁', async () => {
      // 模擬有多頁數據
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          routes: mockRoutes,
          pagination: { total_records: 25 }
        }
      });

      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('頁面 1 / 3')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('下一頁');
      expect(nextButton).not.toBeDisabled();
      
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=2&limit=10&search=');
      });
    });

    test('應該能夠導航到上一頁', async () => {
      // 每次API調用返回不同的數據以模擬分頁
      mockApiClient.get.mockImplementation(() => {
        return Promise.resolve({
          data: {
            success: true,
            routes: mockRoutes,
            pagination: { total_records: 25 }
          }
        });
      });

      renderWithRouter(<RouteBinding />);

      // 等待初始載入
      await waitFor(() => {
        expect(screen.getByText('頁面 1 / 3')).toBeInTheDocument();
      });

      // 先到第2頁
      const nextButton = screen.getByText('下一頁');
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=2&limit=10&search=');
      });

      // 回到上一頁
      const prevButton = screen.getByText('上一頁');
      expect(prevButton).not.toBeDisabled();
      
      await userEvent.click(prevButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/routes?page=1&limit=10&search=');
      });
    });

    test('第一頁時上一頁按鈕應該被禁用', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        const prevButton = screen.getByText('上一頁');
        expect(prevButton).toBeDisabled();
      });
    });

    test('最後一頁時下一頁按鈕應該被禁用', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          routes: mockRoutes,
          pagination: { total_records: 5 }
        }
      });

      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        const nextButton = screen.getByText('下一頁');
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('新增路線功能', () => {
    test('應該能夠打開新增路線模態框', async () => {
      renderWithRouter(<RouteBinding />);

      // 等待初始載入完成
      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      expect(screen.getByTestId('create-route-modal')).toBeInTheDocument();
      expect(screen.getAllByText('新增路線')[1]).toBeInTheDocument(); // 第二個是模態框內的標題
    });

    test('應該能夠關閉模態框', async () => {
      renderWithRouter(<RouteBinding />);

      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      const closeButton = screen.getByText('關閉');
      await userEvent.click(closeButton);

      expect(screen.queryByTestId('create-route-modal')).not.toBeInTheDocument();
    });

    test('應該能夠提交新路線', async () => {
      renderWithRouter(<RouteBinding />);

      const addButton = screen.getByText('新增路線');
      await userEvent.click(addButton);

      const submitButton = screen.getByText('提交');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/routes', {
          RouteName: 'Test Route',
          BindingTableId: 'form123',
          BindingTableName: 'Test Form'
        });
      });

      // 應該重新載入數據
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2); // 初始載入 + 提交後重新載入
      });
    });
  });

  describe('編輯路線功能', () => {
    test('應該能夠打開編輯路線模態框', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-icon');
      await userEvent.click(editButtons[0]);

      expect(screen.getByTestId('create-route-modal')).toBeInTheDocument();
      expect(screen.getByText('編輯路線')).toBeInTheDocument();
      
      // 檢查編輯數據是否正確傳遞
      const editData = screen.getByTestId('edit-data');
      expect(editData).toHaveTextContent(JSON.stringify(mockRoutes[0]));
    });

    test('應該能夠提交編輯的路線', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-icon');
      await userEvent.click(editButtons[0]);

      const submitButton = screen.getByText('提交');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/routes/route1', {
          RouteName: 'Test Route',
          BindingTableId: 'form123',
          BindingTableName: 'Test Form'
        });
      });
    });
  });

  describe('刪除路線功能', () => {
    test('應該能夠打開刪除確認模態框', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('delete-icon');
      await userEvent.click(deleteButtons[0]);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('確認刪除路線')).toBeInTheDocument();
      expect(screen.getByText('確定要刪除路線「測試路線1」嗎？')).toBeInTheDocument();
    });

    test('應該能夠取消刪除', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('delete-icon');
      await userEvent.click(deleteButtons[0]);

      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
      expect(mockApiClient.delete).not.toHaveBeenCalled();
    });

    test('應該能夠確認刪除路線', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('delete-icon');
      await userEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/routes/route1');
      });

      // 應該重新載入數據
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2); // 初始載入 + 刪除後重新載入
      });

      // 模態框應該關閉
      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });

    test('應該處理刪除失敗', async () => {
      mockApiClient.delete.mockResolvedValue({
        data: { success: false, message: '刪除失敗' }
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('delete-icon');
      await userEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Delete failed:', '刪除失敗');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('錯誤處理', () => {
    test('應該處理API失敗響應', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: false,
          message: 'Server error'
        }
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch routes:', 'Server error');
        expect(screen.getByText('無資料...')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('應該處理網絡錯誤', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching routes:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('響應式設計', () => {
    test('應該正確應用dark mode類名', () => {
      renderWithRouter(<RouteBinding />);

      // 查找具有dark mode類名的根容器
      const containers = document.querySelectorAll('.bg-gray-100.dark\\:bg-gray-900');
      expect(containers.length).toBeGreaterThan(0);
    });

    test('表格應該具有響應式樣式', () => {
      renderWithRouter(<RouteBinding />);

      const tableContainer = screen.getByRole('table').parentElement;
      expect(tableContainer).toHaveClass('overflow-x-auto');
    });
  });

  describe('輔助功能測試', () => {
    test('按鈕應該有適當的title屬性', async () => {
      renderWithRouter(<RouteBinding />);

      await waitFor(() => {
        expect(screen.getByText('測試路線1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('編輯');
      const deleteButtons = screen.getAllByTitle('刪除');

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });

    test('表格應該有適當的語義結構', () => {
      renderWithRouter(<RouteBinding />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(3);
      expect(columnHeaders[0]).toHaveTextContent('路線名稱');
      expect(columnHeaders[1]).toHaveTextContent('綁定表單');
      expect(columnHeaders[2]).toHaveTextContent('操作');
    });
  });
});
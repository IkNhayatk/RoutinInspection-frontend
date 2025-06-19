import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateRouteModal from '../CreateRouteModal';
import { apiClient } from '../../services/authService';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('react-modal', () => {
  const MockModal = function({ isOpen, onRequestClose, children, contentLabel }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" aria-label={contentLabel}>
        <button onClick={onRequestClose} data-testid="modal-close">X</button>
        {children}
      </div>
    );
  };
  MockModal.setAppElement = jest.fn();
  return MockModal;
});

jest.mock('../ConfirmModal', () => {
  return function MockConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, showCancelButton = true }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        {showCancelButton && <button onClick={onClose} data-testid="cancel-button">取消</button>}
        <button onClick={onConfirm} data-testid="confirm-button">{confirmText}</button>
      </div>
    );
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const mockForms = [
  { id: 'form1', eFormName: '測試表單1' },
  { id: 'form2', eFormName: '測試表單2' },
  { id: 'form3', eFormName: '測試表單3' }
];

const mockFormsResponse = {
  data: {
    success: true,
    forms: mockForms
  }
};

const mockUserInfo = {
  department: 'IT'
};

describe('CreateRouteModal Component', () => {
  const mockApiClient = apiClient;
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    isEditing: false,
    editData: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup localStorage mock
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUserInfo));
    
    // Setup API mocks
    mockApiClient.get.mockResolvedValue(mockFormsResponse);
    mockApiClient.post.mockResolvedValue({ data: { success: true } });
    mockApiClient.put.mockResolvedValue({ data: { success: true } });
  });

  describe('初始渲染', () => {
    test('模態框關閉時不應該渲染', () => {
      render(<CreateRouteModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('模態框打開時應該渲染基本元素', async () => {
      render(<CreateRouteModal {...defaultProps} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('新增路線')).toBeInTheDocument();
      expect(screen.getByLabelText('路線名稱')).toBeInTheDocument();
      expect(screen.getByLabelText('綁定表單')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('確認新增')).toBeInTheDocument();

      // 等待表單載入
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/search-department', {
          params: { code: 'IT' }
        });
      });
    });

    test('編輯模式時應該顯示正確的標題和按鈕', () => {
      const editData = {
        RouteId: 'route1',
        RouteName: '測試路線',
        BindingTableId: 'form1'
      };

      render(<CreateRouteModal {...defaultProps} isEditing={true} editData={editData} />);

      expect(screen.getByText('修改路線')).toBeInTheDocument();
      expect(screen.getByText('確認修改')).toBeInTheDocument();
    });
  });

  describe('表單載入', () => {
    test('應該從localStorage獲取使用者部門資訊', async () => {
      render(<CreateRouteModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('userInfo');
        expect(mockApiClient.get).toHaveBeenCalledWith('/search-department', {
          params: { code: 'IT' }
        });
      });
    });

    test('應該正確載入並顯示表單選項', async () => {
      render(<CreateRouteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
        expect(screen.getByText('測試表單2')).toBeInTheDocument();
        expect(screen.getByText('測試表單3')).toBeInTheDocument();
      });
    });

    test('載入表單時應該顯示載入狀態', async () => {
      let resolvePromise;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(delayedPromise);

      render(<CreateRouteModal {...defaultProps} />);

      expect(screen.getByText('載入表單中...')).toBeInTheDocument();
      expect(screen.getByText('正在從伺服器獲取表單列表...')).toBeInTheDocument();

      resolvePromise(mockFormsResponse);
      
      await waitFor(() => {
        expect(screen.queryByText('載入表單中...')).not.toBeInTheDocument();
      });
    });

    test('應該處理無部門資訊的情況', async () => {
      // 檢查當沒有使用者資訊時是否顯示無可用表單狀態
      mockLocalStorage.getItem.mockReturnValue(null);

      render(<CreateRouteModal {...defaultProps} />);

      // 等待表單載入完成，應該會顯示 "無可用表單" 狀態
      await waitFor(() => {
        const selectElement = screen.getByLabelText('綁定表單');
        expect(selectElement).toBeDisabled();
        expect(screen.getByText('無可用表單')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 提交按鈕應該被禁用
      const submitButton = screen.getByText('確認新增');
      expect(submitButton).toBeDisabled();
    });

    test('應該處理表單載入失敗', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      render(<CreateRouteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('應該處理無可用表單的情況', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          forms: []
        }
      });

      render(<CreateRouteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('無可用表單')).toBeInTheDocument();
        expect(screen.getByText('部門 IT 未找到可綁定的表單。')).toBeInTheDocument();
      });
    });
  });

  describe('編輯模式數據初始化', () => {
    test('應該正確初始化編輯數據', async () => {
      const editData = {
        RouteId: 'route1',
        RouteName: '測試路線',
        BindingTableId: 'form1'
      };

      render(<CreateRouteModal {...defaultProps} isEditing={true} editData={editData} />);

      // 等待表單載入完成
      await waitFor(() => {
        expect(screen.getByDisplayValue('測試路線')).toBeInTheDocument();
      });

      // 等待表單選項載入完成
      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      // 檢查選中的表單
      const formSelect = screen.getByLabelText('綁定表單');
      expect(formSelect.value).toBe('form1');
    });

    test('應該處理缺少編輯數據的情況', () => {
      render(<CreateRouteModal {...defaultProps} isEditing={true} editData={null} />);

      const routeNameInput = screen.getByLabelText('路線名稱');
      expect(routeNameInput.value).toBe('');
    });
  });

  describe('表單驗證', () => {
    test('應該驗證路線名稱不能為空', async () => {
      render(<CreateRouteModal {...defaultProps} />);

      // 等待表單載入
      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('請輸入路線名稱')).toBeInTheDocument();
    });

    test('應該驗證必須選擇表單', async () => {
      render(<CreateRouteModal {...defaultProps} />);

      // 等待表單載入
      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      // 輸入路線名稱但不選擇表單
      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '測試路線');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('請選擇要綁定的表單')).toBeInTheDocument();
    });

    test('應該處理只有空格的路線名稱', async () => {
      render(<CreateRouteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '   ');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      expect(screen.getByText('請輸入路線名稱')).toBeInTheDocument();
    });
  });

  describe('新增路線功能', () => {
    test('應該能夠成功新增路線', async () => {
      render(<CreateRouteModal {...defaultProps} />);

      // 等待表單載入
      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      // 填寫表單
      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '新測試路線');

      const formSelect = screen.getByLabelText('綁定表單');
      await userEvent.selectOptions(formSelect, 'form1');

      // 提交表單
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/routes', {
          RouteName: '新測試路線',
          BindingTableId: 'form1',
          BindingTableName: '測試表單1'
        });
      });

      // 檢查成功訊息
      expect(screen.getByText('成功')).toBeInTheDocument();
      expect(screen.getByText('路線新增成功！')).toBeInTheDocument();
    });

    test('應該處理新增失敗', async () => {
      mockApiClient.post.mockRejectedValue({
        response: {
          data: { message: '路線名稱已存在' }
        }
      });

      render(<CreateRouteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      // 填寫並提交表單
      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '重複路線名稱');

      const formSelect = screen.getByLabelText('綁定表單');
      await userEvent.selectOptions(formSelect, 'form1');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('路線名稱已存在')).toBeInTheDocument();
      });
    });
  });

  describe('編輯路線功能', () => {
    test('應該能夠成功編輯路線', async () => {
      const editData = {
        RouteId: 'route1',
        RouteName: '原始路線名稱',
        BindingTableId: 'form1'
      };

      render(<CreateRouteModal {...defaultProps} isEditing={true} editData={editData} />);

      // 等待表單載入並初始化
      await waitFor(() => {
        expect(screen.getByDisplayValue('原始路線名稱')).toBeInTheDocument();
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

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/routes/route1', {
          RouteName: '修改後的路線名稱',
          BindingTableId: 'form2',
          BindingTableName: '測試表單2'
        });
      });

      // 檢查成功訊息
      expect(screen.getByText('路線修改成功！')).toBeInTheDocument();
    });

    test('應該處理編輯失敗', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Server error'));

      const editData = {
        RouteId: 'route1',
        RouteName: '測試路線',
        BindingTableId: 'form1'
      };

      render(<CreateRouteModal {...defaultProps} isEditing={true} editData={editData} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('測試路線')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('確認修改');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('模態框交互', () => {
    test('應該能夠關閉模態框', async () => {
      const onClose = jest.fn();
      render(<CreateRouteModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    test('成功提交後應該關閉模態框並調用onSubmit', async () => {
      const onClose = jest.fn();
      const onSubmit = jest.fn();
      
      render(<CreateRouteModal {...defaultProps} onClose={onClose} onSubmit={onSubmit} />);

      // 等待表單載入
      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      // 填寫並提交表單
      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '測試路線');

      const formSelect = screen.getByLabelText('綁定表單');
      await userEvent.selectOptions(formSelect, 'form1');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      // 等待API調用完成
      await waitFor(() => {
        expect(screen.getByText('路線新增成功！')).toBeInTheDocument();
      });

      // 確認成功訊息
      const confirmButton = screen.getByTestId('confirm-button');
      await userEvent.click(confirmButton);

      expect(onClose).toHaveBeenCalled();
      expect(onSubmit).toHaveBeenCalled();
    });

    test('應該能夠關閉錯誤訊息模態框', async () => {
      render(<CreateRouteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      // 觸發驗證錯誤
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      expect(screen.getByText('請輸入路線名稱')).toBeInTheDocument();

      // 關閉錯誤訊息
      const confirmButton = screen.getByTestId('confirm-button');
      await userEvent.click(confirmButton);

      expect(screen.queryByText('請輸入路線名稱')).not.toBeInTheDocument();
    });
  });

  describe('表單重置', () => {
    test('模態框重新打開時應該重置表單', async () => {
      const { rerender } = render(<CreateRouteModal {...defaultProps} />);

      // 等待表單載入
      await waitFor(() => {
        expect(screen.getByText('測試表單1')).toBeInTheDocument();
      });

      // 填寫表單
      const routeNameInput = screen.getByLabelText('路線名稱');
      await userEvent.type(routeNameInput, '測試內容');

      // 關閉模態框
      rerender(<CreateRouteModal {...defaultProps} isOpen={false} />);

      // 重新打開模態框
      rerender(<CreateRouteModal {...defaultProps} isOpen={true} />);

      // 檢查表單是否重置
      await waitFor(() => {
        const newRouteNameInput = screen.getByLabelText('路線名稱');
        expect(newRouteNameInput.value).toBe('');
      });
    });
  });

  describe('禁用狀態', () => {
    test('載入表單時應該禁用提交按鈕', async () => {
      let resolvePromise;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(delayedPromise);

      render(<CreateRouteModal {...defaultProps} />);

      const submitButton = screen.getByText('確認新增');
      expect(submitButton).toBeDisabled();

      resolvePromise(mockFormsResponse);
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('無可用表單時應該禁用提交按鈕和表單選擇', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          forms: []
        }
      });

      render(<CreateRouteModal {...defaultProps} />);

      await waitFor(() => {
        const submitButton = screen.getByText('確認新增');
        const formSelect = screen.getByLabelText('綁定表單');
        
        expect(submitButton).toBeDisabled();
        expect(formSelect).toBeDisabled();
      });
    });
  });
});
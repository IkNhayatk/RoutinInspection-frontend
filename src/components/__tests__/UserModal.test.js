import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UserModal from '../UserModal';
import { apiClient } from '../../services/authService';

// Mock react-modal
jest.mock('react-modal', () => {
  const MockModal = function({ isOpen, children, contentLabel }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" aria-label={contentLabel}>
        {children}
      </div>
    );
  };
  MockModal.setAppElement = jest.fn();
  return MockModal;
});

// Mock ConfirmModal
jest.mock('../ConfirmModal.js', () => {
  return function MockConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, theme, showCancelButton = true }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onConfirm}>{confirmText || '確認'}</button>
        {showCancelButton && <button onClick={onClose}>取消</button>}
        <div data-testid="modal-theme">{theme}</div>
      </div>
    );
  };
});

// Mock authService
jest.mock('../../services/authService', () => ({
  apiClient: {
    post: jest.fn(),
    put: jest.fn(),
  }
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaEye: () => <div data-testid="eye-icon">👁️</div>,
  FaEyeSlash: () => <div data-testid="eye-slash-icon">🙈</div>
}));

// Sample test data
const mockUserData = {
  id: 123, // Auto-generated ID from SQL Server IDENTITY(1,1)
  userName: '測試使用者',
  userID: 'testuser',
  engName: 'Test User',
  email: 'test@example.com',
  priorityLevel: 1,
  position: '測試職位',
  remark: '測試備註',
  department: '測試部門',
  isAtWork: true,
  // Signing data
  supervisorName: '主管姓名',
  supervisorID: 'supervisor01',
  sectionChiefName: '課長姓名',
  sectionChiefID: 'chief01',
  safetyOfficer1: '工安人員',
  safetyOfficer1ID: 'safety01',
  psmSpecialistName: 'PSM專人',
  psmSpecialistID: 'psm01',
  factoryManagerName: '廠長',
  factoryManagerID: 'manager01',
  safetySupervisorName: '工安主管',
  safetySupervisorID: 'safety_sup01',
  safetySpecialistName: '工安高專',
  safetySpecialistID: 'safety_spec01',
  factory: '測試廠',
  section: '測試課',
  departmentAbbr: 'TEST',
  jobTitle: '測試職稱',
  secondDepartment: '第二部門'
};

const mockCopyUserData = {
  ...mockUserData,
  isCopy: true
};

describe('UserModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('初始渲染', () => {
    test('應該正確渲染新增使用者模態框', () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('新增使用者')).toBeInTheDocument();
      expect(screen.getByLabelText(/使用者姓名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/使用者ID/)).toBeInTheDocument();
      expect(screen.getByLabelText(/電子郵件/)).toBeInTheDocument();
    });

    test('模態框關閉時不應該渲染', () => {
      render(<UserModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('應該顯示基本資料和核簽資料頁籤', () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('基本資料')).toBeInTheDocument();
      expect(screen.getByText('核簽資料')).toBeInTheDocument();
    });

    test('應該預設顯示基本資料頁籤', () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const basicTab = screen.getByText('基本資料');
      expect(basicTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });
  });

  describe('編輯模式', () => {
    test('應該正確渲染編輯使用者模態框', () => {
      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          isEditing={true}
          editData={mockUserData}
        />
      );

      expect(screen.getByText('編輯使用者')).toBeInTheDocument();
      expect(screen.getByDisplayValue('測試使用者')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('確認修改')).toBeInTheDocument();
    });

    test('應該正確顯示編輯資料', () => {
      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          isEditing={true}
          editData={mockUserData}
        />
      );

      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('測試職位')).toBeInTheDocument();
      expect(screen.getByDisplayValue('測試部門')).toBeInTheDocument();
      expect(screen.getByDisplayValue('測試備註')).toBeInTheDocument();
    });

    test('複製模式應該清空使用者姓名和ID', () => {
      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editData={mockCopyUserData}
        />
      );

      expect(screen.getByText('複製使用者')).toBeInTheDocument();
      expect(screen.getByLabelText(/使用者姓名/)).toHaveValue('');
      expect(screen.getByLabelText(/使用者ID/)).toHaveValue('');
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument(); // 其他欄位保留
      expect(screen.getByText('確認複製')).toBeInTheDocument();
    });

    test('編輯模式下密碼欄位應該顯示提示文字', () => {
      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          isEditing={true}
          editData={mockUserData}
        />
      );

      expect(screen.getByText('(留空表示不修改)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('輸入新密碼以修改')).toBeInTheDocument();
    });
  });

  describe('表單驗證', () => {
    test('未填寫使用者姓名時應該顯示錯誤', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        expect(screen.getByText('請輸入使用者姓名')).toBeInTheDocument();
      });
    });

    test('未填寫使用者ID時應該顯示錯誤', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入使用者ID')).toBeInTheDocument();
      });
    });

    test('無效的電子郵件格式應該顯示錯誤', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'invalid-email');
      
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入有效的電子郵件格式')).toBeInTheDocument();
      });
    });

    test('新增模式未填寫密碼時應該顯示錯誤', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'test@example.com');
      
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入密碼')).toBeInTheDocument();
      });
    });

    test('未選擇權限級別時應該顯示錯誤', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/密碼/), 'password123');
      
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('請選擇權限級別')).toBeInTheDocument();
      });
    });

    test('未填寫部門時應該顯示錯誤', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/密碼/), 'password123');
      await userEvent.selectOptions(screen.getByLabelText(/權限級別/), '1');
      
      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入部門')).toBeInTheDocument();
      });
    });
  });

  describe('表單操作', () => {
    test('應該能夠輸入基本資料', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const userNameInput = screen.getByLabelText(/使用者姓名/);
      const userIDInput = screen.getByLabelText(/使用者ID/);
      const emailInput = screen.getByLabelText(/電子郵件/);

      await userEvent.type(userNameInput, '測試使用者');
      await userEvent.type(userIDInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');

      expect(userNameInput).toHaveValue('測試使用者');
      expect(userIDInput).toHaveValue('testuser');
      expect(emailInput).toHaveValue('test@example.com');
    });

    test('應該能夠選擇權限級別', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const prioritySelect = screen.getByLabelText(/權限級別/);
      await userEvent.selectOptions(prioritySelect, '2');

      expect(prioritySelect).toHaveValue('2');
    });

    test('應該能夠切換密碼顯示狀態', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/密碼/);
      const toggleButton = screen.getByTestId('eye-icon').parentElement;

      expect(passwordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('eye-slash-icon')).toBeInTheDocument();
    });

    test('應該能夠切換在職狀態', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const isAtWorkCheckbox = screen.getByLabelText(/在職中/);
      
      expect(isAtWorkCheckbox).toBeChecked();

      await userEvent.click(isAtWorkCheckbox);

      expect(isAtWorkCheckbox).not.toBeChecked();
    });
  });

  describe('頁籤切換', () => {
    test('應該能夠切換到核簽資料頁籤', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const signingTab = screen.getByText('核簽資料');
      await userEvent.click(signingTab);

      expect(signingTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(screen.getByLabelText('主管姓名')).toBeInTheDocument();
      expect(screen.getByLabelText(/課長姓名/)).toBeInTheDocument();
    });

    test('應該能夠在核簽資料頁籤輸入資料', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const signingTab = screen.getByText('核簽資料');
      await userEvent.click(signingTab);

      const supervisorNameInput = screen.getByLabelText('主管姓名');
      const supervisorIDInput = screen.getByLabelText('主管ID');

      await userEvent.type(supervisorNameInput, '主管姓名');
      await userEvent.type(supervisorIDInput, 'supervisor01');

      expect(supervisorNameInput).toHaveValue('主管姓名');
      expect(supervisorIDInput).toHaveValue('supervisor01');
    });

    test('切換頁籤後應該能夠切換回基本資料', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 切換到核簽資料
      const signingTab = screen.getByText('核簽資料');
      await userEvent.click(signingTab);

      // 切換回基本資料
      const basicTab = screen.getByText('基本資料');
      await userEvent.click(basicTab);

      expect(basicTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(screen.getByLabelText(/使用者姓名/)).toBeInTheDocument();
    });
  });

  describe('表單提交', () => {
    test('成功提交新增使用者', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });

      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫必填欄位
      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/密碼/), 'password123');
      await userEvent.selectOptions(screen.getByLabelText(/權限級別/), '1');
      await userEvent.type(screen.getByLabelText(/部門/), '測試部門');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/users', expect.objectContaining({
          userName: '測試使用者',
          userID: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          priorityLevel: 1,
          department: '測試部門',
          isAtWork: true
        }));
      });
    });

    test('成功提交編輯使用者', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });

      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          isEditing={true}
          editData={mockUserData}
        />
      );

      const submitButton = screen.getByText('確認修改');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(`/users/${mockUserData.id}`, expect.objectContaining({
          userName: '測試使用者',
          userID: 'testuser',
          email: 'test@example.com',
          priorityLevel: 1,
          department: '測試部門'
        }));
      });
    });

    test('複製模式應該使用POST請求', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });

      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editData={mockCopyUserData}
        />
      );

      // 填寫必填欄位（複製模式下被清空）
      const userNameInput = screen.getByLabelText(/使用者姓名/);
      const userIDInput = screen.getByLabelText(/使用者ID/);
      const emailInput = screen.getByLabelText(/電子郵件/);
      const passwordInput = screen.getByLabelText(/密碼/);
      const departmentInput = screen.getByLabelText(/部門/);
      
      await userEvent.clear(userNameInput);
      await userEvent.type(userNameInput, '複製使用者');
      await userEvent.clear(userIDInput);
      await userEvent.type(userIDInput, 'copyuser');
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'copy@example.com');
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'password123');
      await userEvent.selectOptions(screen.getByLabelText(/權限級別/), '1');
      await userEvent.clear(departmentInput);
      await userEvent.type(departmentInput, '複製部門');

      const submitButton = screen.getByText('確認複製');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/users', expect.objectContaining({
          userName: '複製使用者',
          userID: 'copyuser'
        }));
      });
    });

    test('提交成功後應該顯示成功訊息', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });

      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫必填欄位
      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/密碼/), 'password123');
      await userEvent.selectOptions(screen.getByLabelText(/權限級別/), '1');
      await userEvent.type(screen.getByLabelText(/部門/), '測試部門');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        expect(screen.getByText('成功')).toBeInTheDocument();
        expect(screen.getByText('使用者新增成功！')).toBeInTheDocument();
        expect(screen.getByTestId('modal-theme')).toHaveTextContent('success');
      });
    });

    test('提交失敗時應該顯示錯誤訊息', async () => {
      apiClient.post.mockRejectedValue(new Error('提交失敗'));

      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫必填欄位
      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/密碼/), 'password123');
      await userEvent.selectOptions(screen.getByLabelText(/權限級別/), '1');
      await userEvent.type(screen.getByLabelText(/部門/), '測試部門');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        expect(screen.getByText('提示')).toBeInTheDocument();
        expect(screen.getByText('提交失敗')).toBeInTheDocument();
        expect(screen.getByTestId('modal-theme')).toHaveTextContent('warning');
      });
    });

    test('編輯模式下不輸入密碼應該不傳送密碼欄位', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });

      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          isEditing={true}
          editData={mockUserData}
        />
      );

      const submitButton = screen.getByText('確認修改');
      await userEvent.click(submitButton);

      await waitFor(() => {
        const callArgs = apiClient.put.mock.calls[0][1];
        expect(callArgs).not.toHaveProperty('password');
      });
    });

    test('編輯模式下輸入密碼應該傳送密碼欄位', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });

      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          isEditing={true}
          editData={mockUserData}
        />
      );

      await userEvent.type(screen.getByLabelText(/密碼/), 'newpassword123');

      const submitButton = screen.getByText('確認修改');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(`/users/${mockUserData.id}`, expect.objectContaining({
          password: 'newpassword123'
        }));
      });
    });
  });

  describe('核簽資料功能', () => {
    test('應該能夠顯示所有核簽資料欄位', async () => {
      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          isEditing={true}
          editData={mockUserData}
        />
      );

      const signingTab = screen.getByText('核簽資料');
      await userEvent.click(signingTab);

      expect(screen.getByDisplayValue('主管姓名')).toBeInTheDocument();
      expect(screen.getByDisplayValue('supervisor01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('課長姓名')).toBeInTheDocument();
      expect(screen.getByDisplayValue('chief01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('工安人員')).toBeInTheDocument();
      expect(screen.getByDisplayValue('safety01')).toBeInTheDocument();
    });

    test('提交時應該包含核簽資料', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });

      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫基本資料
      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/密碼/), 'password123');
      await userEvent.selectOptions(screen.getByLabelText(/權限級別/), '1');
      await userEvent.type(screen.getByLabelText(/部門/), '測試部門');

      // 切換到核簽資料頁籤並填寫
      const signingTab = screen.getByText('核簽資料');
      await userEvent.click(signingTab);

      await userEvent.type(screen.getByLabelText('主管姓名'), '測試主管');
      await userEvent.type(screen.getByLabelText('主管ID'), 'supervisor01');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/users', expect.objectContaining({
          signingData: expect.objectContaining({
            supervisorName: '測試主管',
            supervisorID: 'supervisor01'
          })
        }));
      });
    });
  });

  describe('模態框關閉', () => {
    test('點擊取消按鈕應該關閉模態框', async () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('成功提交後關閉成功模態框應該關閉主模態框', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });

      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫必填欄位並提交
      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');
      await userEvent.type(screen.getByLabelText(/使用者ID/), 'testuser');
      await userEvent.type(screen.getByLabelText(/電子郵件/), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/密碼/), 'password123');
      await userEvent.selectOptions(screen.getByLabelText(/權限級別/), '1');
      await userEvent.type(screen.getByLabelText(/部門/), '測試部門');

      const submitButton = screen.getByText('確認新增');
      await userEvent.click(submitButton);

      // 等待成功模態框出現
      await waitFor(() => {
        expect(screen.getByText('使用者新增成功！')).toBeInTheDocument();
      });

      // 點擊成功模態框的確認按鈕
      const successConfirmButton = screen.getByRole('button', { name: '確認' });
      await userEvent.click(successConfirmButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('輔助功能', () => {
    test('模態框應該有適當的aria-label', () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('新增使用者')).toBeInTheDocument();
    });

    test('編輯模式下模態框應該有適當的aria-label', () => {
      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          isEditing={true}
          editData={mockUserData}
        />
      );

      expect(screen.getByLabelText('編輯使用者')).toBeInTheDocument();
    });

    test('複製模式下模態框應該有適當的aria-label', () => {
      render(
        <UserModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editData={mockCopyUserData}
        />
      );

      expect(screen.getByLabelText('複製使用者')).toBeInTheDocument();
    });

    test('必填欄位應該有星號標示', () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('使用者姓名')).toBeInTheDocument();
      expect(screen.getByText('使用者ID')).toBeInTheDocument();
      expect(screen.getByText('電子郵件')).toBeInTheDocument();
      expect(screen.getByText('權限級別')).toBeInTheDocument();
      expect(screen.getByText('部門')).toBeInTheDocument();

      // 檢查星號
      const requiredMarkers = screen.getAllByText('*');
      expect(requiredMarkers.length).toBeGreaterThan(0);
    });

    test('所有表單欄位應該有適當的標籤', () => {
      render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/使用者姓名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/使用者ID/)).toBeInTheDocument();
      expect(screen.getByLabelText(/英文名稱/)).toBeInTheDocument();
      expect(screen.getByLabelText(/電子郵件/)).toBeInTheDocument();
      expect(screen.getByLabelText(/密碼/)).toBeInTheDocument();
      expect(screen.getByLabelText(/權限級別/)).toBeInTheDocument();
      expect(screen.getByLabelText(/職位/)).toBeInTheDocument();
      expect(screen.getByLabelText(/部門/)).toBeInTheDocument();
      expect(screen.getByLabelText(/備註/)).toBeInTheDocument();
      expect(screen.getByLabelText(/在職中/)).toBeInTheDocument();
    });
  });

  describe('表單重設', () => {
    test('重新開啟模態框時應該重設表單', async () => {
      const { rerender } = render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫一些資料
      await userEvent.type(screen.getByLabelText(/使用者姓名/), '測試使用者');

      // 關閉模態框
      rerender(<UserModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 重新開啟模態框
      rerender(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 表單應該被重設
      expect(screen.getByLabelText(/使用者姓名/)).toHaveValue('');
    });

    test('應該重設到基本資料頁籤', async () => {
      const { rerender } = render(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 切換到核簽資料頁籤
      const signingTab = screen.getByText('核簽資料');
      await userEvent.click(signingTab);

      // 關閉並重新開啟模態框
      rerender(<UserModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
      rerender(<UserModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 應該回到基本資料頁籤
      const basicTab = screen.getByText('基本資料');
      expect(basicTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });
  });
});
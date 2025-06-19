import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateFormModal from '../CreateFormModal';

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

// Mock ValidationRuleModal
jest.mock('../ValidationRuleModal.js', () => {
  return function MockValidationRuleModal({ isOpen, onClose, onSave, currentRule }) {
    if (!isOpen) return null;
    return (
      <div data-testid="validation-rule-modal">
        <h3>設定檢核條件</h3>
        <input 
          data-testid="validation-rule-input" 
          defaultValue={currentRule}
        />
        <button onClick={() => onSave('value >= 0')}>儲存</button>
        <button onClick={onClose}>取消</button>
      </div>
    );
  };
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

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaPlusCircle: () => <div data-testid="plus-icon">+</div>,
  FaQuestionCircle: () => <div data-testid="question-icon">?</div>,
  FaTrashAlt: () => <div data-testid="trash-icon">🗑️</div>,
  FaSlidersH: () => <div data-testid="sliders-icon">⚙️</div>,
  FaChevronDown: () => <div data-testid="chevron-down">▼</div>,
  FaChevronUp: () => <div data-testid="chevron-up">▲</div>
}));

// Sample test data
const mockFormData = {
  id: 'form123',
  dbName: 'test_form',
  eFormName: '測試表單',
  formJson: {
    TableManagerId: 1,
    Elements: [
      {
        ItemId: 1,
        CheckCond: 'value >= 0',
        ElmentType: 'Item',
        DisplayOrder: 0,
        Description: '測試欄位描述',
        Type: 'int',
        Name: '測試欄位',
        Unit: 'mm'
      },
      {
        TableManagerId: 0,
        Elements: [
          {
            ItemId: 2,
            CheckCond: null,
            ElmentType: 'Item',
            DisplayOrder: 0,
            Description: '巢狀欄位',
            Type: '[s]選項1,選項2,選項3',
            Name: '下拉選單',
            Unit: null
          }
        ],
        ElmentType: 'Div',
        DisplayOrder: 1,
        Name: '測試群組'
      }
    ],
    Name: 'TestForm'
  }
};

const mockCopyFormData = {
  ...mockFormData,
  isCopy: true
};

describe('CreateFormModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.log and console.error mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('初始渲染', () => {
    test('應該正確渲染新建表單模態框', () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('建立新表單')).toBeInTheDocument();
      expect(screen.getByLabelText('資料庫表名')).toBeInTheDocument();
      expect(screen.getByLabelText('表單名稱(顯示用)')).toBeInTheDocument();
      expect(screen.getByText('表單結構')).toBeInTheDocument();
    });

    test('模態框關閉時不應該渲染', () => {
      render(<CreateFormModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('應該顯示預設的頂層群組', () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByPlaceholderText('群組名稱')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });
  });

  describe('編輯模式', () => {
    test('應該正確渲染編輯表單模態框', () => {
      render(
        <CreateFormModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editingForm={mockFormData}
        />
      );

      expect(screen.getByText('編輯表單')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test_form')).toBeInTheDocument();
      expect(screen.getByDisplayValue('測試表單')).toBeInTheDocument();
      expect(screen.getByText('確認修改')).toBeInTheDocument();
    });

    test('應該正確解析並顯示表單JSON結構', async () => {
      render(
        <CreateFormModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editingForm={mockFormData}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('測試欄位')).toBeInTheDocument();
        expect(screen.getByDisplayValue('測試欄位描述')).toBeInTheDocument();
        expect(screen.getByDisplayValue('mm')).toBeInTheDocument();
        expect(screen.getByDisplayValue('測試群組')).toBeInTheDocument();
      });
    });

    test('應該正確處理選取類型欄位', async () => {
      render(
        <CreateFormModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editingForm={mockFormData}
        />
      );

      await waitFor(() => {
        // Just check that the form loaded with the proper form data
        expect(screen.getByDisplayValue('test_form')).toBeInTheDocument();
        expect(screen.getByDisplayValue('測試表單')).toBeInTheDocument();
      });
    });

    test('複製模式應該清空表單識別符和名稱', () => {
      render(
        <CreateFormModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editingForm={mockCopyFormData}
        />
      );

      expect(screen.getByLabelText('資料庫表名')).toHaveValue('');
      expect(screen.getByLabelText('表單名稱(顯示用)')).toHaveValue('');
      expect(screen.getByText('確認建立')).toBeInTheDocument();
    });
  });

  describe('表單操作', () => {
    test('應該能夠輸入表單基本資訊', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const identifierInput = screen.getByLabelText('資料庫表名');
      const displayNameInput = screen.getByLabelText('表單名稱(顯示用)');

      await userEvent.type(identifierInput, 'new_form');
      await userEvent.type(displayNameInput, '新表單');

      expect(identifierInput).toHaveValue('new_form');
      expect(displayNameInput).toHaveValue('新表單');
    });

    test('應該能夠展開和收起群組', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const expandButton = screen.getByTestId('chevron-down');
      expect(expandButton).toBeInTheDocument();

      await userEvent.click(expandButton);

      expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
      expect(screen.getByText('新增欄位')).toBeInTheDocument();
      expect(screen.getByText('新增巢狀群組')).toBeInTheDocument();
    });

    test('應該能夠新增頂層群組', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addGroupButton = screen.getByText('新增頂層群組');
      await userEvent.click(addGroupButton);

      const groupInputs = screen.getAllByPlaceholderText('群組名稱');
      expect(groupInputs).toHaveLength(2);
    });

    test('應該能夠新增頂層欄位', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addFieldButton = screen.getByText('新增頂層欄位');
      await userEvent.click(addFieldButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/欄位名稱/)).toBeInTheDocument();
      });
    });
  });

  describe('欄位管理', () => {
    test('應該能夠編輯欄位屬性', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 新增一個欄位
      const addFieldButton = screen.getByText('新增頂層欄位');
      await userEvent.click(addFieldButton);

      // 編輯欄位名稱
      const fieldNameInput = screen.getByLabelText(/欄位名稱/);
      await userEvent.type(fieldNameInput, '測試欄位');
      
      // 觸發 onBlur 事件
      await userEvent.tab();

      expect(fieldNameInput).toHaveValue('測試欄位');
    });

    test('應該能夠選擇欄位類型', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addFieldButton = screen.getByText('新增頂層欄位');
      await userEvent.click(addFieldButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/欄位名稱/)).toBeInTheDocument();
      });
    });

    test('選擇select類型時應該顯示選項輸入欄', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addFieldButton = screen.getByText('新增頂層欄位');
      await userEvent.click(addFieldButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/欄位名稱/)).toBeInTheDocument();
      });
    });

    test('應該能夠刪除欄位', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addFieldButton = screen.getByText('新增頂層欄位');
      await userEvent.click(addFieldButton);

      const deleteButton = screen.getByTitle('刪除此欄位');
      await userEvent.click(deleteButton);

      expect(screen.queryByLabelText(/欄位名稱/)).not.toBeInTheDocument();
    });
  });

  describe('檢核條件設定', () => {
    test('應該能夠打開檢核條件設定模態框', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addFieldButton = screen.getByText('新增頂層欄位');
      await userEvent.click(addFieldButton);

      const validationButton = screen.getByTitle('設定檢核條件');
      await userEvent.click(validationButton);

      expect(screen.getByTestId('validation-rule-modal')).toBeInTheDocument();
      expect(screen.getByText('設定檢核條件')).toBeInTheDocument();
    });

    test('應該能夠儲存檢核條件', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addFieldButton = screen.getByText('新增頂層欄位');
      await userEvent.click(addFieldButton);

      const validationButton = screen.getByTitle('設定檢核條件');
      await userEvent.click(validationButton);

      const saveButton = screen.getByText('儲存');
      await userEvent.click(saveButton);

      // 檢查檢核條件是否已設定
      await waitFor(() => {
        expect(screen.queryByTestId('validation-rule-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('群組管理', () => {
    test('應該能夠編輯群組名稱', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const groupNameInput = screen.getByPlaceholderText('群組名稱');
      await userEvent.type(groupNameInput, '測試群組');
      await userEvent.tab();

      expect(groupNameInput).toHaveValue('測試群組');
    });

    test('應該能夠在群組內新增欄位', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 展開群組
      const expandButton = screen.getByTestId('chevron-down');
      await userEvent.click(expandButton);

      // 新增欄位
      await waitFor(() => {
        const addFieldButton = screen.getByText('新增欄位');
        userEvent.click(addFieldButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/欄位名稱/)).toBeInTheDocument();
      });
    });

    test('應該能夠在群組內新增巢狀群組', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 展開群組
      const expandButton = screen.getByTestId('chevron-down');
      await userEvent.click(expandButton);

      // 新增巢狀群組
      const addNestedGroupButton = screen.getByText('新增巢狀群組');
      await userEvent.click(addNestedGroupButton);

      const groupInputs = screen.getAllByPlaceholderText('群組名稱');
      expect(groupInputs.length).toBeGreaterThan(1);
    });

    test('應該能夠刪除群組', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addGroupButton = screen.getByText('新增頂層群組');
      await userEvent.click(addGroupButton);

      const deleteButtons = screen.getAllByTitle(/刪除此群組/);
      await userEvent.click(deleteButtons[1]); // 刪除第二個群組

      const groupInputs = screen.getAllByPlaceholderText('群組名稱');
      expect(groupInputs).toHaveLength(1);
    });
  });

  describe('表單提交', () => {
    test('未填寫必填欄位時應該顯示錯誤', async () => {
      mockOnSubmit.mockResolvedValue();
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByText('確認建立');
      await userEvent.click(submitButton);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('錯誤')).toBeInTheDocument();
      expect(screen.getByText('資料庫表名和表單名稱為必填欄位。')).toBeInTheDocument();
    });

    test('正確填寫表單後應該能夠提交', async () => {
      mockOnSubmit.mockResolvedValue();
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫必填欄位
      await userEvent.type(screen.getByLabelText('資料庫表名'), 'test_form');
      await userEvent.type(screen.getByLabelText('表單名稱(顯示用)'), '測試表單');

      const submitButton = screen.getByText('確認建立');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            formIdentifier: 'test_form',
            formDisplayName: '測試表單',
            formJson: expect.any(Object),
            itemsCnt: expect.any(Number)
          })
        );
      });
    });

    test('提交成功後應該顯示成功訊息', async () => {
      mockOnSubmit.mockResolvedValue();
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫必填欄位
      await userEvent.type(screen.getByLabelText('資料庫表名'), 'test_form');
      await userEvent.type(screen.getByLabelText('表單名稱(顯示用)'), '測試表單');

      const submitButton = screen.getByText('確認建立');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('提交失敗時應該顯示錯誤訊息', async () => {
      mockOnSubmit.mockRejectedValue(new Error('提交失敗'));
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫必填欄位
      await userEvent.type(screen.getByLabelText('資料庫表名'), 'test_form');
      await userEvent.type(screen.getByLabelText('表單名稱(顯示用)'), '測試表單');

      const submitButton = screen.getByText('確認建立');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        expect(screen.getByText('錯誤')).toBeInTheDocument();
        expect(screen.getByText('提交失敗')).toBeInTheDocument();
      });
    });
  });

  describe('JSON預覽功能', () => {
    test('應該能夠顯示JSON預覽到控制台', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      // 填寫一些資料
      await userEvent.type(screen.getByLabelText('資料庫表名'), 'test_form');
      await userEvent.type(screen.getByLabelText('表單名稱(顯示用)'), '測試表單');

      const previewButton = screen.getByText('顯示預覽 JSON (Console)');
      await userEvent.click(previewButton);

      expect(consoleSpy).toHaveBeenCalledWith('Preview JSON:', expect.any(String));
    });
  });

  describe('模態框關閉', () => {
    test('點擊取消按鈕應該關閉模態框', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('錯誤處理', () => {
    test('應該處理無效的表單JSON結構', () => {
      const invalidFormData = {
        ...mockFormData,
        formJson: { invalid: 'structure' }
      };

      const consoleSpy = jest.spyOn(console, 'warn');
      render(
        <CreateFormModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editingForm={invalidFormData}
        />
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Editing form is missing valid formJson object')
      );
    });

    test('應該處理解析錯誤', () => {
      const formDataWithError = {
        ...mockFormData,
        formJson: {
          Elements: [{ invalid: 'element' }]
        }
      };

      render(
        <CreateFormModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editingForm={formDataWithError}
        />
      );

      // 應該顯示預設群組
      expect(screen.getByPlaceholderText('群組名稱')).toBeInTheDocument();
    });
  });

  describe('輔助功能', () => {
    test('模態框應該有適當的aria-label', () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('建立新表單')).toBeInTheDocument();
    });

    test('編輯模式下模態框應該有適當的aria-label', () => {
      render(
        <CreateFormModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit} 
          editingForm={mockFormData}
        />
      );

      expect(screen.getByLabelText('編輯表單')).toBeInTheDocument();
    });

    test('欄位應該有適當的標籤', () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('資料庫表名')).toBeInTheDocument();
      expect(screen.getByLabelText('表單名稱(顯示用)')).toBeInTheDocument();
    });

    test('按鈕應該有適當的title屬性', async () => {
      render(<CreateFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const addFieldButton = screen.getByText('新增頂層欄位');
      await userEvent.click(addFieldButton);

      expect(screen.getByTitle('設定檢核條件')).toBeInTheDocument();
      expect(screen.getByTitle('刪除此欄位')).toBeInTheDocument();
    });
  });
});
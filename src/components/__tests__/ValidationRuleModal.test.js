import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ValidationRuleModal from '../ValidationRuleModal';

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

describe('ValidationRuleModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('初始渲染', () => {
    test('應該正確渲染檢核條件設定模態框', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('設定檢核條件')).toBeInTheDocument();
      expect(screen.getByLabelText('無判斷條件')).toBeInTheDocument();
      expect(screen.getByLabelText('數值範圍比較')).toBeInTheDocument();
      expect(screen.getByLabelText('數值等於')).toBeInTheDocument();
    });

    test('模態框關閉時不應該渲染', () => {
      render(
        <ValidationRuleModal 
          isOpen={false} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('預設應該選擇無判斷條件', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      expect(screen.getByRole('radio', { name: '無判斷條件' })).toBeChecked();
      expect(screen.getByRole('radio', { name: '數值範圍比較' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: '數值等於' })).not.toBeChecked();
    });
  });

  describe('選項切換', () => {
    test('選擇數值範圍比較時應該顯示範圍輸入欄', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);

      expect(rangeRadio).toBeChecked();
      expect(screen.getAllByRole('spinbutton')).toHaveLength(2); // Min and Max inputs
      expect(screen.getByText('<= value <=')).toBeInTheDocument(); // Range display
    });

    test('選擇數值等於時應該顯示等值輸入欄', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const equalsRadio = screen.getByRole('radio', { name: '數值等於' });
      await userEvent.click(equalsRadio);

      expect(equalsRadio).toBeChecked();
      expect(screen.getByPlaceholderText('輸入數值 (用 , 分隔)')).toBeInTheDocument();
      expect(screen.getByText('若需多個條件請用 , 分隔 (例如: 1, 2)')).toBeInTheDocument();
    });

    test('選擇無判斷條件時不應該顯示額外輸入欄', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      // 先選擇範圍，再選擇無條件
      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);
      
      const noConditionRadio = screen.getByRole('radio', { name: '無判斷條件' });
      await userEvent.click(noConditionRadio);

      expect(noConditionRadio).toBeChecked();
      expect(screen.queryByText('<= value <=')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('輸入數值 (用 , 分隔)')).not.toBeInTheDocument();
    });
  });

  describe('初始規則解析', () => {
    test('應該正確解析範圍條件規則', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value >= 10 && value <= 50" 
        />
      );

      expect(screen.getByRole('radio', { name: '數值範圍比較' })).toBeChecked();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });

    test('應該正確解析最小值條件規則', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value >= 5" 
        />
      );

      expect(screen.getByRole('radio', { name: '數值範圍比較' })).toBeChecked();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    test('應該正確解析最大值條件規則', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value <= 100" 
        />
      );

      expect(screen.getByRole('radio', { name: '數值範圍比較' })).toBeChecked();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });

    test('應該正確解析單一等值條件規則', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value == 42" 
        />
      );

      expect(screen.getByRole('radio', { name: '數值等於' })).toBeChecked();
      expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    });

    test('應該正確解析多個等值條件規則', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value == 1 || value == 2 || value == 3" 
        />
      );

      expect(screen.getByRole('radio', { name: '數值等於' })).toBeChecked();
      expect(screen.getByDisplayValue('1, 2, 3')).toBeInTheDocument();
    });

    test('應該處理空規則', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      expect(screen.getByRole('radio', { name: '無判斷條件' })).toBeChecked();
    });

    test('應該處理null規則', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule={null} 
        />
      );

      expect(screen.getByRole('radio', { name: '無判斷條件' })).toBeChecked();
    });
  });

  describe('用戶輸入', () => {
    test('應該能夠輸入範圍最小值', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);

      const minInput = screen.getAllByRole('spinbutton')[0];
      await userEvent.type(minInput, '5');

      expect(minInput).toHaveValue(5);
    });

    test('應該能夠輸入範圍最大值', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);

      const maxInput = screen.getAllByRole('spinbutton')[1];
      await userEvent.type(maxInput, '15');

      expect(maxInput).toHaveValue(15);
    });

    test('應該能夠輸入等值條件', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const equalsRadio = screen.getByRole('radio', { name: '數值等於' });
      await userEvent.click(equalsRadio);

      const equalsInput = screen.getByPlaceholderText('輸入數值 (用 , 分隔)');
      await userEvent.type(equalsInput, '1, 2, 3');

      expect(equalsInput).toHaveValue('1, 2, 3');
    });
  });

  describe('規則生成與儲存', () => {
    test('無判斷條件應該生成空規則', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalledWith('');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('應該正確生成完整範圍規則', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);

      const minInput = screen.getAllByRole('spinbutton')[0];
      const maxInput = screen.getAllByRole('spinbutton')[1];
      
      await userEvent.type(minInput, '10');
      await userEvent.type(maxInput, '50');

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalledWith('value >= 10 && value <= 50');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('應該正確生成最小值規則', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);

      const minInput = screen.getAllByRole('spinbutton')[0];
      await userEvent.type(minInput, '5');

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalledWith('value >= 5');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('應該正確生成最大值規則', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);

      const maxInput = screen.getAllByRole('spinbutton')[1];
      await userEvent.type(maxInput, '100');

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalledWith('value <= 100');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('應該正確生成單一等值規則', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const equalsRadio = screen.getByRole('radio', { name: '數值等於' });
      await userEvent.click(equalsRadio);

      const equalsInput = screen.getByPlaceholderText('輸入數值 (用 , 分隔)');
      await userEvent.type(equalsInput, '42');

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalledWith('value == 42');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('應該正確生成多個等值規則', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const equalsRadio = screen.getByRole('radio', { name: '數值等於' });
      await userEvent.click(equalsRadio);

      const equalsInput = screen.getByPlaceholderText('輸入數值 (用 , 分隔)');
      await userEvent.type(equalsInput, '1, 2, 3');

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalledWith('value == 1 || value == 2 || value == 3');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('驗證與錯誤處理', () => {
    test('最小值大於最大值時應該顯示錯誤', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);

      const minInput = screen.getAllByRole('spinbutton')[0];
      const maxInput = screen.getAllByRole('spinbutton')[1];
      
      await userEvent.type(minInput, '100');
      await userEvent.type(maxInput, '50');

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(window.alert).toHaveBeenCalledWith('最小值不能大於最大值');
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('空白等值輸入應該生成空規則', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const equalsRadio = screen.getByRole('radio', { name: '數值等於' });
      await userEvent.click(equalsRadio);

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalledWith('');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('空白範圍輸入應該生成空規則', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const rangeRadio = screen.getByRole('radio', { name: '數值範圍比較' });
      await userEvent.click(rangeRadio);

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalledWith('');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('模態框操作', () => {
    test('點擊取消按鈕應該關閉模態框', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('模態框應該有正確的contentLabel', () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      expect(screen.getByLabelText('設定檢核條件 Modal')).toBeInTheDocument();
    });

    test('點擊確認按鈕應該調用onSave並關閉模態框', async () => {
      render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      const confirmButton = screen.getByText('確認');
      await userEvent.click(confirmButton);

      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('狀態重置', () => {
    test('模態框重新打開時應該重置狀態', () => {
      const { rerender } = render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value >= 10 && value <= 50" 
        />
      );

      expect(screen.getByRole('radio', { name: '數值範圍比較' })).toBeChecked();

      // 關閉並重新打開模態框，使用不同規則
      rerender(
        <ValidationRuleModal 
          isOpen={false} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value == 42" 
        />
      );

      rerender(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value == 42" 
        />
      );

      expect(screen.getByRole('radio', { name: '數值等於' })).toBeChecked();
      expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    });

    test('規則變更時應該更新狀態', () => {
      const { rerender } = render(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="" 
        />
      );

      expect(screen.getByRole('radio', { name: '無判斷條件' })).toBeChecked();

      // 更新規則
      rerender(
        <ValidationRuleModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          currentRule="value >= 5" 
        />
      );

      expect(screen.getByRole('radio', { name: '數值範圍比較' })).toBeChecked();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });
});
import React from 'react';
import Modal from 'react-modal';

// 確保 Modal 設置正確的 appElement，避免可訪問性警告
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  const appElement = document.getElementById('root') || document.body;
  Modal.setAppElement(appElement);
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '確認操作',
  message = '您確定要執行此操作嗎？',
  confirmText = '確認',
  cancelText = '取消',
  theme = 'default',
  showCancelButton = true // <-- Add showCancelButton prop, default to true
}) => {
  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    content: {
      position: 'relative',
      top: 'auto',
      left: 'auto',
      right: 'auto',
      bottom: 'auto',
      margin: '0 auto',
      padding: '0',
      border: 'none',
      background: 'transparent',
      overflow: 'visible',
      WebkitOverflowScrolling: 'touch',
      outline: 'none',
      borderRadius: '0',
      boxShadow: 'none',
      width: 'auto',
    }
  };

  const getHeaderClasses = () => {
    switch (theme) {
      case 'delete':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'add':
        return 'bg-green-500 text-white';
      case 'success': // <-- Add success theme
        return 'bg-blue-600 text-white'; // <-- Blue header for success
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getConfirmButtonClasses = () => {
    switch (theme) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'add':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'success': // <-- Add success theme styling if needed (optional, default blue is fine)
      default:
        return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white';
    }
  }

  // Determine if the cancel button should actually be shown
  const shouldShowCancel = theme !== 'success' && showCancelButton;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel={title}
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      ariaHideApp={process.env.NODE_ENV !== 'test'}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className={`px-4 py-3 text-left ${getHeaderClasses()}`}>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {/* Message Body */}
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 text-left">{message}</p>
        </div>
        {/* Footer / Buttons */}
        <div className="px-4 py-3 flex justify-end items-center space-x-2 border-t border-gray-200 dark:border-gray-700">
          {shouldShowCancel && ( // <-- Use the derived value here
            <button
              className="px-4 py-1.5 bg-transparent text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`px-4 py-1.5 rounded transition-colors text-sm font-medium ${getConfirmButtonClasses()}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ConfirmModal from './ConfirmModal.js';

// --- 樣式 ---
const customStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    width: '85%', maxWidth: '500px',
    maxHeight: '85vh',
    overflowY: 'auto', border: '1px solid #ccc',
    borderRadius: '8px', padding: '20px', backgroundColor: '#fff',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000 },
};

// 設置 App Element
if (typeof window !== 'undefined') {
    Modal.setAppElement(document.getElementById('root') || document.body);
}

function CreateRouteModal({ isOpen, onClose, onSubmit, availableForms = [], isEditing = false, editData = null }) {
    // --- 狀態 ---
    const [routeName, setRouteName] = useState('');
    const [selectedFormId, setSelectedFormId] = useState('');
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    
    // --- 初始化編輯資料 ---
    useEffect(() => {
        if (isOpen) {
            if (isEditing && editData) {
                setRouteName(editData.routeName || '');
                setSelectedFormId(editData.formId || '');
            } else {
                // 清除表單
                setRouteName('');
                setSelectedFormId('');
            }
            // 重設模態框狀態
            setIsErrorModalOpen(false);
            setErrorMessage('');
            setIsSuccessModalOpen(false);
            setSuccessMessage('');
        }
    }, [isOpen, isEditing, editData]);
    
    // --- 處理提交 ---
    const handleSubmit = async () => {
        // 基本驗證
        if (!routeName.trim()) {
            setErrorMessage('請輸入路線名稱');
            setIsErrorModalOpen(true);
            return;
        }
        
        if (!selectedFormId) {
            setErrorMessage('請選擇要綁定的表單');
            setIsErrorModalOpen(true);
            return;
        }
        
        try {
            // 準備資料
            const routeData = {
                routeName: routeName.trim(),
                formId: selectedFormId,
                ...(isEditing && editData ? { id: editData.id } : {})
            };
            
            // 提交資料
            await onSubmit(routeData);
            
            // 顯示成功訊息
            setSuccessMessage(isEditing ? '路線修改成功！' : '路線新增成功！');
            setIsSuccessModalOpen(true);
            
            // 關閉模態框
            onClose();
        } catch (error) {
            console.error('Error submitting route:', error);
            setErrorMessage(error.message || '操作失敗，請稍後再試');
            setIsErrorModalOpen(true);
        }
    };
    
    // --- 錯誤模態框處理 ---
    const handleErrorModalClose = () => {
        setIsErrorModalOpen(false);
        setErrorMessage('');
    };
    
    // --- 成功模態框處理 ---
    const handleSuccessModalClose = () => {
        setIsSuccessModalOpen(false);
        setSuccessMessage('');
    };
    
    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onClose} 
            style={customStyles} 
            contentLabel={isEditing ? "修改路線" : "新增路線"}
        >
            {/* 標題 */}
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-300">
                <h2 className="text-xl font-semibold text-gray-800">{isEditing ? "修改路線" : "新增路線"}</h2>
            </div>
            
            {/* 表單內容 */}
            <div className="space-y-6 mb-6">
                {/* 路線名稱 */}
                <div>
                    <label htmlFor="routeName" className="block text-sm font-medium text-gray-700 mb-1">路線名稱</label>
                    <input 
                        type="text" 
                        id="routeName" 
                        placeholder="請輸入路線名稱" 
                        value={routeName} 
                        onChange={(e) => setRouteName(e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                {/* 綁定表單選擇 */}
                <div>
                    <label htmlFor="formSelection" className="block text-sm font-medium text-gray-700 mb-1">綁定表單</label>
                    <select 
                        id="formSelection" 
                        value={selectedFormId} 
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="" disabled>-- 請選擇表單 --</option>
                        {availableForms.map(form => (
                            <option key={form.id} value={form.id}>
                                {form.displayName || form.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            {/* 按鈕區域 */}
            <div className="flex justify-end items-center pt-4 border-t border-gray-300">
                <div className="flex space-x-3">
                    <button 
                        onClick={onClose} 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors duration-150"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150"
                    >
                        {isEditing ? "確認修改" : "確認新增"}
                    </button>
                </div>
            </div>
            
            {/* 錯誤模態框 */}
            <ConfirmModal
                isOpen={isErrorModalOpen}
                onClose={handleErrorModalClose}
                onConfirm={handleErrorModalClose}
                title="錯誤"
                message={errorMessage}
                confirmText="確認"
                theme="warning"
                showCancelButton={false}
            />
            
            {/* 成功模態框 */}
            <ConfirmModal
                isOpen={isSuccessModalOpen}
                onClose={handleSuccessModalClose}
                onConfirm={handleSuccessModalClose}
                title="成功"
                message={successMessage}
                confirmText="確認"
                theme="success"
                showCancelButton={false}
            />
        </Modal>
    );
}

export default CreateRouteModal;

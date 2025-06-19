import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ConfirmModal from './ConfirmModal.js';
import { apiClient } from '../services/authService.js'; // Assuming this path is correct

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

function CreateRouteModal({ isOpen, onClose, onSubmit, isEditing = false, editData = null }) {
    // --- 狀態 ---
    const [routeName, setRouteName] = useState('');
    const [selectedFormId, setSelectedFormId] = useState('');
    const [fetchedForms, setFetchedForms] = useState([]); // State for forms fetched from API
    const [isLoadingForms, setIsLoadingForms] = useState(false); // Loading state for forms

    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // --- Fetch available forms when modal opens ---
    useEffect(() => {
        if (isOpen) {
            const fetchFormsForSelection = async () => {
                setIsLoadingForms(true);
                setFetchedForms([]); // Clear previous forms
                let departmentCode = null;

                try {
                    const userInfoString = localStorage.getItem('userInfo');
                    if (userInfoString) {
                        const userInfo = JSON.parse(userInfoString);
                        if (userInfo && userInfo.department) {
                            departmentCode = userInfo.department;
                        } else {
                            throw new Error('使用者資訊中未找到部門代號。');
                        }
                    } else {
                        throw new Error('無法從 localStorage 獲取使用者資訊。');
                    }

                    if (!departmentCode) {
                         throw new Error('部門代號為空，無法查詢表單。');
                    }

                    // Call /search-department with the department code
                    const response = await apiClient.get('/search-department', {
                        params: { code: departmentCode }
                    });

                    if (response.data && response.data.success && Array.isArray(response.data.forms)) {
                        setFetchedForms(response.data.forms);
                        if (response.data.forms.length === 0) {
                            setErrorMessage(`部門 ${departmentCode} 未找到可綁定的表單。`);
                            setIsErrorModalOpen(true); // Optionally show this as a non-blocking info
                        }
                    } else {
                        console.error('Failed to fetch forms or unexpected format:', response.data);
                        throw new Error(response.data?.message || '無法載入表單列表或回傳格式錯誤。');
                    }
                } catch (error) {
                    console.error('Error fetching forms for selection:', error);
                    setFetchedForms([]);
                    setErrorMessage(error.message || '載入表單列表失敗，請檢查網絡或聯繫管理員');
                    setIsErrorModalOpen(true);
                } finally {
                    setIsLoadingForms(false);
                }
            };

            fetchFormsForSelection();
        }
    }, [isOpen]); // Re-fetch if isOpen changes

    // --- 初始化編輯資料 & 重設模態框狀態 ---
    // --- 初始化編輯資料 & 重設模態框狀態 ---
    useEffect(() => {
        if (isOpen) {
            if (isEditing && editData) {
                
                // --- 更正開始 ---
                // 原本是 editData.routeName，假設您的 route 物件中的屬性名稱為 RouteName (大寫 N)
                setRouteName(editData.RouteName || ''); 
                // --- 更正結束 ---
                
                // 確保 selectedFormId 在表單列表載入後是有效的，
                // 特別是如果 editData.formId 可能不在新的列表中。
                // 如果同一部門的表單列表會動態變化，這裡可能需要進一步的邏輯。
                setSelectedFormId(editData.BindingTableId || ''); 
            } else {
                // 清除表單
                setRouteName('');
                setSelectedFormId('');
            }
            // 重設訊息模態框狀態
            setIsErrorModalOpen(false);
            setErrorMessage('');
            setIsSuccessModalOpen(false);
            setSuccessMessage('');
        } else {
            // 當模態框關閉時重置已獲取的表單，以確保下次打開時是最新數據
            // 這部分邏輯已由 fetchFormsForSelection 在 isOpen 為 true 時處理
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
            const selectedForm = fetchedForms.find(form => form.id === selectedFormId);
            const routeData = {
                RouteName: routeName.trim(),
                BindingTableId: selectedFormId,
                BindingTableName: selectedForm?.eFormName || selectedForm?.name || `表單ID: ${selectedFormId}`
            };
            
            //console.log('Selected Form:', selectedForm);
            //console.log('Route Data:', routeData);
            
            let response;
            
            
            if (isEditing && editData && editData.RouteId) {
                response = await apiClient.put(`/routes/${editData.RouteId}`, routeData);
            } else {
                response = await apiClient.post('/routes', routeData);
            }
            
            if (response.data && response.data.success) {
                // 顯示成功訊息
                setSuccessMessage(isEditing ? '路線修改成功！' : '路線新增成功！');
                setIsSuccessModalOpen(true);
            } else {
                throw new Error(response.data?.message || '操作失敗');
            }
            
        } catch (error) {
            console.error('Error submitting route:', error);
            const errorMsg = error.response?.data?.message || error.message || '操作失敗，請稍後再試';
            setErrorMessage(errorMsg);
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
        onClose(); // Close the main modal after success confirmation
        
        // 呼叫父組件的 onSubmit 來重新整理路線列表
        if (onSubmit) {
            onSubmit();
        }
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
                        disabled={isLoadingForms || fetchedForms.length === 0}
                    >
                        <option value="" disabled>
                            {isLoadingForms ? "載入表單中..." : (fetchedForms.length === 0 ? "無可用表單" : "-- 請選擇表單 --")}
                        </option>
                        {fetchedForms.map(form => (
                            <option key={form.id} value={form.id}>
                                {form.eFormName ? form.eFormName.trim() : `ID: ${form.id} (名稱未提供)`}
                            </option>
                        ))}
                    </select>
                    {isLoadingForms && <p className="text-xs text-gray-500 mt-1">正在從伺服器獲取表單列表...</p>}
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
                        disabled={isLoadingForms || fetchedForms.length === 0}
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
                title="提示" // Changed from "錯誤" to "提示" as some messages are informational
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
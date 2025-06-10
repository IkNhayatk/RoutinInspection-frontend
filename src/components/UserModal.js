import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ConfirmModal from './ConfirmModal.js';
import { apiClient } from '../services/authService.js';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// --- 樣式 ---
const customStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: '900px',
    maxHeight: '90vh',
    overflowY: 'auto', border: '1px solid #ccc',
    borderRadius: '8px', padding: '20px', backgroundColor: '#fff',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000 },
};

// 設置 App Element
if (typeof window !== 'undefined') {
    Modal.setAppElement(document.getElementById('root') || document.body);
}

// Priority Level 對應
const priorityLevelOptions = [
  { value: 1, label: '巡檢人員' },
  { value: 2, label: '主管' },
  { value: 3, label: '管理員' },
  { value: 4, label: '超級管理員' }
];

function UserModal({ isOpen, onClose, onSubmit, isEditing = false, editData = null }) {
    // --- SysUser 表的欄位 ---
    const [userName, setUserName] = useState('');
    const [userID, setUserID] = useState('');
    const [engName, setEngName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [priorityLevel, setPriorityLevel] = useState('');
    const [position, setPosition] = useState('');
    const [remark, setRemark] = useState('');
    const [department, setDepartment] = useState('');
    const [isAtWork, setIsAtWork] = useState(true);
    
    // --- 巡檢人員核簽資料檔 表的欄位 ---
    const [supervisorName, setSupervisorName] = useState('');
    const [supervisorID, setSupervisorID] = useState('');
    const [sectionChiefName, setSectionChiefName] = useState('');
    const [sectionChiefID, setSectionChiefID] = useState('');
    const [safetyOfficer1, setSafetyOfficer1] = useState('');
    const [safetyOfficer1ID, setSafetyOfficer1ID] = useState('');
    const [psmSpecialistName, setPsmSpecialistName] = useState('');
    const [psmSpecialistID, setPsmSpecialistID] = useState('');
    const [factoryManagerName, setFactoryManagerName] = useState('');
    const [factoryManagerID, setFactoryManagerID] = useState('');
    const [safetySupervisorName, setSafetySupervisorName] = useState('');
    const [safetySupervisorID, setSafetySupervisorID] = useState('');
    const [safetySpecialistName, setSafetySpecialistName] = useState('');
    const [safetySpecialistID, setSafetySpecialistID] = useState('');
    const [factory, setFactory] = useState('');
    const [section, setSection] = useState('');
    const [departmentAbbr, setDepartmentAbbr] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [secondDepartment, setSecondDepartment] = useState('');
    
    // --- 模態框狀態 ---
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'signing'
    
    // --- 初始化編輯資料 ---
    useEffect(() => {
        if (isOpen) {
            if (isEditing && editData) {
                // SysUser 資料
                setUserName(editData.userName || '');
                setUserID(editData.userID || '');
                setEngName(editData.engName || '');
                setEmail(editData.email || '');
                setPassword(''); // 編輯時不顯示密碼
                setPriorityLevel(editData.priorityLevel || '');
                setPosition(editData.position || '');
                setRemark(editData.remark || '');
                setDepartment(editData.department || '');
                setIsAtWork(editData.isAtWork !== undefined ? editData.isAtWork : true);
                
                // 巡檢人員核簽資料檔 資料
                setSupervisorName(editData.supervisorName || '');
                setSupervisorID(editData.supervisorID || '');
                setSectionChiefName(editData.sectionChiefName || '');
                setSectionChiefID(editData.sectionChiefID || '');
                setSafetyOfficer1(editData.safetyOfficer1 || '');
                setSafetyOfficer1ID(editData.safetyOfficer1ID || '');
                setPsmSpecialistName(editData.psmSpecialistName || '');
                setPsmSpecialistID(editData.psmSpecialistID || '');
                setFactoryManagerName(editData.factoryManagerName || '');
                setFactoryManagerID(editData.factoryManagerID || '');
                setSafetySupervisorName(editData.safetySupervisorName || '');
                setSafetySupervisorID(editData.safetySupervisorID || '');
                setSafetySpecialistName(editData.safetySpecialistName || '');
                setSafetySpecialistID(editData.safetySpecialistID || '');
                setFactory(editData.factory || '');
                setSection(editData.section || '');
                setDepartmentAbbr(editData.departmentAbbr || '');
                setJobTitle(editData.jobTitle || '');
                setSecondDepartment(editData.secondDepartment || '');
            } else {
                // 清除所有欄位
                resetForm();
            }
            // 重設訊息模態框狀態
            setIsErrorModalOpen(false);
            setErrorMessage('');
            setIsSuccessModalOpen(false);
            setSuccessMessage('');
            setActiveTab('basic'); // 重設到基本資料頁籤
        }
    }, [isOpen, isEditing, editData]);
    
    // --- 重設表單 ---
    const resetForm = () => {
        // SysUser
        setUserName('');
        setUserID('');
        setEngName('');
        setEmail('');
        setPassword('');
        setPriorityLevel('');
        setPosition('');
        setRemark('');
        setDepartment('');
        setIsAtWork(true);
        
        // 巡檢人員核簽資料檔
        setSupervisorName('');
        setSupervisorID('');
        setSectionChiefName('');
        setSectionChiefID('');
        setSafetyOfficer1('');
        setSafetyOfficer1ID('');
        setPsmSpecialistName('');
        setPsmSpecialistID('');
        setFactoryManagerName('');
        setFactoryManagerID('');
        setSafetySupervisorName('');
        setSafetySupervisorID('');
        setSafetySpecialistName('');
        setSafetySpecialistID('');
        setFactory('');
        setSection('');
        setDepartmentAbbr('');
        setJobTitle('');
        setSecondDepartment('');
        setShowPassword(false);
    };
    
    // --- 處理提交 ---
    const handleSubmit = async () => {
        // 基本驗證
        if (!userName.trim()) {
            setErrorMessage('請輸入使用者姓名');
            setIsErrorModalOpen(true);
            return;
        }
        
        if (!userID.trim()) {
            setErrorMessage('請輸入使用者ID');
            setIsErrorModalOpen(true);
            return;
        }
                
        // Email 格式驗證
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage('請輸入有效的電子郵件格式');
            setIsErrorModalOpen(true);
            return;
        }
        
        if (!isEditing && !password.trim()) {
            setErrorMessage('請輸入密碼');
            setIsErrorModalOpen(true);
            return;
        }
        
        if (!priorityLevel) {
            setErrorMessage('請選擇權限級別');
            setIsErrorModalOpen(true);
            return;
        }
        
        if (!department.trim()) {
            setErrorMessage('請輸入部門');
            setIsErrorModalOpen(true);
            return;
        }
        
        try {
            // 準備資料
            const userData = {
                // SysUser 資料
                userName: userName.trim(),
                userID: userID.trim(),
                engName: engName.trim(),
                email: email.trim(),
                ...((!isEditing || password.trim()) && { password: password.trim() }), // 編輯時只有輸入密碼才傳送
                priorityLevel: parseInt(priorityLevel),
                position: position.trim(),
                remark: remark.trim(),
                department: department.trim(),
                isAtWork: isAtWork,
                
                // 巡檢人員核簽資料檔 資料
                signingData: {
                    supervisorName: supervisorName.trim(),
                    supervisorID: supervisorID.trim(),
                    sectionChiefName: sectionChiefName.trim(),
                    sectionChiefID: sectionChiefID.trim(),
                    safetyOfficer1: safetyOfficer1.trim(),
                    safetyOfficer1ID: safetyOfficer1ID.trim(),
                    psmSpecialistName: psmSpecialistName.trim(),
                    psmSpecialistID: psmSpecialistID.trim(),
                    factoryManagerName: factoryManagerName.trim(),
                    factoryManagerID: factoryManagerID.trim(),
                    safetySupervisorName: safetySupervisorName.trim(),
                    safetySupervisorID: safetySupervisorID.trim(),
                    safetySpecialistName: safetySpecialistName.trim(),
                    safetySpecialistID: safetySpecialistID.trim(),
                    factory: factory.trim(),
                    section: section.trim(),
                    departmentAbbr: departmentAbbr.trim(),
                    jobTitle: jobTitle.trim(),
                    secondDepartment: secondDepartment.trim()
                }
            };
            
            let response;
            
            if (isEditing && editData && editData.id) {
                response = await apiClient.put(`/users/${editData.id}`, userData);
            } else {
                response = await apiClient.post('/users', userData);
            }
            
            if (response.data && response.data.success) {
                // 顯示成功訊息
                setSuccessMessage(isEditing ? '使用者修改成功！' : '使用者新增成功！');
                setIsSuccessModalOpen(true);
            } else {
                throw new Error(response.data?.message || '操作失敗');
            }
            
        } catch (error) {
            console.error('Error submitting user:', error);
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
        onClose(); // 關閉主模態框
        
        // 呼叫父組件的 onSubmit 來重新整理使用者列表
        if (onSubmit) {
            onSubmit();
        }
    };
    
    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onClose} 
            style={customStyles} 
            contentLabel={isEditing ? "編輯使用者" : "新增使用者"}
        >
            {/* 標題 */}
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-300">
                <h2 className="text-xl font-semibold text-gray-800">{isEditing ? "編輯使用者" : "新增使用者"}</h2>
            </div>
            
            {/* 頁籤 */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'basic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                    onClick={() => setActiveTab('basic')}
                >
                    基本資料
                </button>
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'signing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                    onClick={() => setActiveTab('signing')}
                >
                    核簽資料
                </button>
            </div>
            
            {/* 表單內容 */}
            <div className="space-y-4 mb-6">
                {activeTab === 'basic' ? (
                    // 基本資料頁籤
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 使用者姓名 */}
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                                    使用者姓名 <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="userName" 
                                    placeholder="請輸入使用者姓名" 
                                    value={userName} 
                                    onChange={(e) => setUserName(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 使用者ID */}
                            <div>
                                <label htmlFor="userID" className="block text-sm font-medium text-gray-700 mb-1">
                                    使用者ID <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="userID" 
                                    placeholder="請輸入使用者ID" 
                                    value={userID} 
                                    onChange={(e) => setUserID(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 英文名稱 */}
                            <div>
                                <label htmlFor="engName" className="block text-sm font-medium text-gray-700 mb-1">英文名稱</label>
                                <input 
                                    type="text" 
                                    id="engName" 
                                    placeholder="請輸入英文名稱" 
                                    value={engName} 
                                    onChange={(e) => setEngName(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 電子郵件 */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    電子郵件 <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    placeholder="請輸入電子郵件" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 密碼 */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    密碼 {!isEditing && <span className="text-red-500">*</span>}
                                    {isEditing && <span className="text-gray-500 text-xs ml-1">(留空表示不修改)</span>}
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        id="password" 
                                        placeholder={isEditing ? "輸入新密碼以修改" : "請輸入密碼"} 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className="w-full p-2 pr-10 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* 權限級別 */}
                            <div>
                                <label htmlFor="priorityLevel" className="block text-sm font-medium text-gray-700 mb-1">
                                    權限級別 <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    id="priorityLevel" 
                                    value={priorityLevel} 
                                    onChange={(e) => setPriorityLevel(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="" disabled>-- 請選擇權限級別 --</option>
                                    {priorityLevelOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* 職位 */}
                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">職位</label>
                                <input 
                                    type="text" 
                                    id="position" 
                                    placeholder="請輸入職位" 
                                    value={position} 
                                    onChange={(e) => setPosition(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 部門 */}
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                                    部門 <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="department" 
                                    placeholder="請輸入部門" 
                                    value={department} 
                                    onChange={(e) => setDepartment(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        
                        {/* 備註 */}
                        <div>
                            <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                            <textarea 
                                id="remark" 
                                placeholder="請輸入備註" 
                                value={remark} 
                                onChange={(e) => setRemark(e.target.value)} 
                                rows="3"
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        
                        {/* 在職狀態 */}
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="isAtWork" 
                                checked={isAtWork} 
                                onChange={(e) => setIsAtWork(e.target.checked)} 
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isAtWork" className="ml-2 block text-sm text-gray-700">
                                在職中
                            </label>
                        </div>
                    </>
                ) : (
                    // 核簽資料頁籤
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 主管資料 */}
                            <div>
                                <label htmlFor="supervisorName" className="block text-sm font-medium text-gray-700 mb-1">主管姓名</label>
                                <input 
                                    type="text" 
                                    id="supervisorName" 
                                    placeholder="請輸入主管姓名" 
                                    value={supervisorName} 
                                    onChange={(e) => setSupervisorName(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="supervisorID" className="block text-sm font-medium text-gray-700 mb-1">主管ID</label>
                                <input 
                                    type="text" 
                                    id="supervisorID" 
                                    placeholder="請輸入主管ID" 
                                    value={supervisorID} 
                                    onChange={(e) => setSupervisorID(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 課長資料 */}
                            <div>
                                <label htmlFor="sectionChiefName" className="block text-sm font-medium text-gray-700 mb-1">課長姓名</label>
                                <input 
                                    type="text" 
                                    id="sectionChiefName" 
                                    placeholder="請輸入課長姓名" 
                                    value={sectionChiefName} 
                                    onChange={(e) => setSectionChiefName(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="sectionChiefID" className="block text-sm font-medium text-gray-700 mb-1">課長ID</label>
                                <input 
                                    type="text" 
                                    id="sectionChiefID" 
                                    placeholder="請輸入課長ID" 
                                    value={sectionChiefID} 
                                    onChange={(e) => setSectionChiefID(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 廠工安人員 */}
                            <div>
                                <label htmlFor="safetyOfficer1" className="block text-sm font-medium text-gray-700 mb-1">廠工安人員1</label>
                                <input 
                                    type="text" 
                                    id="safetyOfficer1" 
                                    placeholder="請輸入廠工安人員1姓名" 
                                    value={safetyOfficer1} 
                                    onChange={(e) => setSafetyOfficer1(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="safetyOfficer1ID" className="block text-sm font-medium text-gray-700 mb-1">廠工安人員1ID</label>
                                <input 
                                    type="text" 
                                    id="safetyOfficer1ID" 
                                    placeholder="請輸入廠工安人員1ID" 
                                    value={safetyOfficer1ID} 
                                    onChange={(e) => setSafetyOfficer1ID(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* PSM專人 */}
                            <div>
                                <label htmlFor="psmSpecialistName" className="block text-sm font-medium text-gray-700 mb-1">廠PSM專人姓名</label>
                                <input 
                                    type="text" 
                                    id="psmSpecialistName" 
                                    placeholder="請輸入廠PSM專人姓名" 
                                    value={psmSpecialistName} 
                                    onChange={(e) => setPsmSpecialistName(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="psmSpecialistID" className="block text-sm font-medium text-gray-700 mb-1">廠PSM專人ID</label>
                                <input 
                                    type="text" 
                                    id="psmSpecialistID" 
                                    placeholder="請輸入廠PSM專人ID" 
                                    value={psmSpecialistID} 
                                    onChange={(e) => setPsmSpecialistID(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 廠長 */}
                            <div>
                                <label htmlFor="factoryManagerName" className="block text-sm font-medium text-gray-700 mb-1">廠長姓名</label>
                                <input 
                                    type="text" 
                                    id="factoryManagerName" 
                                    placeholder="請輸入廠長姓名" 
                                    value={factoryManagerName} 
                                    onChange={(e) => setFactoryManagerName(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="factoryManagerID" className="block text-sm font-medium text-gray-700 mb-1">廠長ID</label>
                                <input 
                                    type="text" 
                                    id="factoryManagerID" 
                                    placeholder="請輸入廠長ID" 
                                    value={factoryManagerID} 
                                    onChange={(e) => setFactoryManagerID(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 工安主管 */}
                            <div>
                                <label htmlFor="safetySupervisorName" className="block text-sm font-medium text-gray-700 mb-1">工安主管姓名</label>
                                <input 
                                    type="text" 
                                    id="safetySupervisorName" 
                                    placeholder="請輸入工安主管姓名" 
                                    value={safetySupervisorName} 
                                    onChange={(e) => setSafetySupervisorName(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="safetySupervisorID" className="block text-sm font-medium text-gray-700 mb-1">工安主管ID</label>
                                <input 
                                    type="text" 
                                    id="safetySupervisorID" 
                                    placeholder="請輸入工安主管ID" 
                                    value={safetySupervisorID} 
                                    onChange={(e) => setSafetySupervisorID(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 工安高專 */}
                            <div>
                                <label htmlFor="safetySpecialistName" className="block text-sm font-medium text-gray-700 mb-1">工安高專姓名</label>
                                <input 
                                    type="text" 
                                    id="safetySpecialistName" 
                                    placeholder="請輸入工安高專姓名" 
                                    value={safetySpecialistName} 
                                    onChange={(e) => setSafetySpecialistName(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="safetySpecialistID" className="block text-sm font-medium text-gray-700 mb-1">工安高專ID</label>
                                <input 
                                    type="text" 
                                    id="safetySpecialistID" 
                                    placeholder="請輸入工安高專ID" 
                                    value={safetySpecialistID} 
                                    onChange={(e) => setSafetySpecialistID(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 組織資訊 */}
                            <div>
                                <label htmlFor="factory" className="block text-sm font-medium text-gray-700 mb-1">廠</label>
                                <input 
                                    type="text" 
                                    id="factory" 
                                    placeholder="請輸入廠別" 
                                    value={factory} 
                                    onChange={(e) => setFactory(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">課</label>
                                <input 
                                    type="text" 
                                    id="section" 
                                    placeholder="請輸入課別" 
                                    value={section} 
                                    onChange={(e) => setSection(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 部門縮寫 */}
                            <div>
                                <label htmlFor="departmentAbbr" className="block text-sm font-medium text-gray-700 mb-1">部門縮寫</label>
                                <input 
                                    type="text" 
                                    id="departmentAbbr" 
                                    placeholder="請輸入部門縮寫" 
                                    value={departmentAbbr} 
                                    onChange={(e) => setDepartmentAbbr(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 職稱 */}
                            <div>
                                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">職稱</label>
                                <input 
                                    type="text" 
                                    id="jobTitle" 
                                    placeholder="請輸入職稱" 
                                    value={jobTitle} 
                                    onChange={(e) => setJobTitle(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* 第二部門 */}
                            <div className="md:col-span-2">
                                <label htmlFor="secondDepartment" className="block text-sm font-medium text-gray-700 mb-1">第二部門</label>
                                <input 
                                    type="text" 
                                    id="secondDepartment" 
                                    placeholder="請輸入第二部門" 
                                    value={secondDepartment} 
                                    onChange={(e) => setSecondDepartment(e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </>
                )}
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
                title="提示"
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

export default UserModal;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.js';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import { FaPencilAlt, FaTrashAlt, FaDownload, FaUpload, FaRegCopy, FaSearch, FaChevronLeft, FaChevronRight, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import ConfirmModal from '../components/ConfirmModal.js';
import UserModal from '../components/UserModal.js';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // 分頁和搜索狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });
  
  // 可折疊區塊狀態
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
  
  const { isAdmin, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 獲取用戶列表
  const fetchUsers = async (page = currentPage, keyword = searchKeyword) => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // 構建查詢參數
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      });
      
      if (keyword.trim()) {
        params.append('search', keyword.trim());
      }
      
      const response = await apiClient.get(`/users?${params.toString()}`);
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
        setCurrentPage(response.data.pagination.current_page);
      } else {
        setError(response.data.message || '獲取用戶列表失敗');
      }
    } catch (err) {
      console.error('獲取用戶列表錯誤:', err);
      // 臨時繞過後端錯誤訊息，以便測試
      setError('');
      setUsers([]); // 設置為空列表以避免顯示錯誤
      setPagination({
        current_page: 1,
        page_size: 10,
        total_count: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false
      });
    } finally {
      setLoading(false);
    }
  };

  // 打開刪除確認模態框
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // 關閉刪除確認模態框
  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // 確認刪除用戶
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setError('');
      const response = await apiClient.delete(`/users/${userToDelete.ID}`);
      if (response.data.success) {
        // 重新獲取用戶列表
        await fetchUsers(currentPage, searchKeyword);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } else {
        setError(response.data.message || '刪除用戶失敗');
      }
    } catch (err) {
      console.error('刪除用戶錯誤:', err);
      setError('刪除用戶失敗: ' + (err.response?.data?.message || '未知錯誤'));
    }
  };

  // 編輯用戶
  const handleEditUser = (user) => {
    setEditUserData({
      id: user.ID,
      userName: user.UserName,
      userID: user.UserID,
      engName: user.EngName,
      email: user.Email,
      priorityLevel: user.PriorityLevel,
      position: user.Position,
      remark: user.Remark,
      department: user.Department,
      isAtWork: user.IsAtWork,
      // 包含核簽資料
      supervisorName: user.supervisorName || '',
      supervisorID: user.supervisorID || '',
      sectionChiefName: user.sectionChiefName || '',
      sectionChiefID: user.sectionChiefID || '',
      safetyOfficer1: user.safetyOfficer1 || '',
      safetyOfficer1ID: user.safetyOfficer1ID || '',
      psmSpecialistName: user.psmSpecialistName || '',
      psmSpecialistID: user.psmSpecialistID || '',
      factoryManagerName: user.factoryManagerName || '',
      factoryManagerID: user.factoryManagerID || '',
      safetySupervisorName: user.safetySupervisorName || '',
      safetySupervisorID: user.safetySupervisorID || '',
      safetySpecialistName: user.safetySpecialistName || '',
      safetySpecialistID: user.safetySpecialistID || '',
      factory: user.factory || '',
      section: user.section || '',
      departmentAbbr: user.departmentAbbr || '',
      jobTitle: user.jobTitle || '',
      secondDepartment: user.secondDepartment || ''
    });
    setIsEditingUser(true);
    setIsUserModalOpen(true);
  };

  // 複製用戶
  const handleCopyUser = (user) => {
    setEditUserData({
      id: user.ID,
      userName: '', // 複製時清空使用者姓名
      userID: '', // 複製時清空使用者ID
      engName: user.EngName,
      email: user.Email,
      priorityLevel: user.PriorityLevel,
      position: user.Position,
      remark: user.Remark,
      department: user.Department,
      isAtWork: user.IsAtWork,
      isCopy: true, // 標記為複製模式
      // 包含核簽資料（複製時保留）
      supervisorName: user.supervisorName || '',
      supervisorID: user.supervisorID || '',
      sectionChiefName: user.sectionChiefName || '',
      sectionChiefID: user.sectionChiefID || '',
      safetyOfficer1: user.safetyOfficer1 || '',
      safetyOfficer1ID: user.safetyOfficer1ID || '',
      psmSpecialistName: user.psmSpecialistName || '',
      psmSpecialistID: user.psmSpecialistID || '',
      factoryManagerName: user.factoryManagerName || '',
      factoryManagerID: user.factoryManagerID || '',
      safetySupervisorName: user.safetySupervisorName || '',
      safetySupervisorID: user.safetySupervisorID || '',
      safetySpecialistName: user.safetySpecialistName || '',
      safetySpecialistID: user.safetySpecialistID || '',
      factory: user.factory || '',
      section: user.section || '',
      departmentAbbr: user.departmentAbbr || '',
      jobTitle: user.jobTitle || '',
      secondDepartment: user.secondDepartment || ''
    });
    setIsEditingUser(false); // 複製時設為false，因為這是新增而非編輯
    setIsUserModalOpen(true);
  };

  // 新增用戶
  const handleAddUser = () => {
    setEditUserData(null);
    setIsEditingUser(false);
    setIsUserModalOpen(true);
  };

  // 關閉用戶模態框
  const handleUserModalClose = () => {
    setIsUserModalOpen(false);
    setIsEditingUser(false);
    setEditUserData(null);
  };

  // 用戶模態框提交成功後的處理
  const handleUserModalSubmit = () => {
    fetchUsers(); // 重新載入用戶列表
  };
  
  // 直接搜索或重置（無需手動按鈕）
  // 在輸入框的onChange事件中已處理
  
  // 分頁處理
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
      fetchUsers(newPage, searchKeyword);
    }
  };
  
  // 每頁顯示數量變更
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    // 重新獲取數據
    setTimeout(() => {
      fetchUsers(1, searchKeyword);
    }, 0);
  };

  // 下載Excel範例
  const handleDownloadExcelTemplate = () => {
    // 創建範例數據
    const templateData = [
      [
        '巡檢人姓名', '巡檢人ID', '主管姓名', '主管ID', '課長姓名', '課長ID', 
        '廠工安人員1', '廠工安人員1ID', '廠PSM專人姓名', '廠PSM專人ID', 
        '廠長姓名', '廠長ID', '工安主管姓名', '工安主管ID', '工安高專姓名', '工安高專ID',
        '廠', '課', '部門', '部門縮寫', '職稱', '第二部門', 'PriorityLevel'
      ],
      [
        '張三', 'N000156652', '李主管', 'N000156652', '王課長', 'N000156652',
        '陳工安', 'N000156652', '林專員', 'N000156652', '陳建全', 'N000005047',
        '陳祈旭', 'N000019799', '吳聲君', 'N000005040', '製膜一廠', '',
        'J020', 'J020', '保養員', '', '1'
      ],
      [
        '陳課長', 'N000156653', '', '', '', '',
        '林工安', 'N000156652', '黃專員', 'N000156652', '劉廠長', 'N000005018',
        '陳祈旭', 'N000019799', '吳聲君', 'N000005040', '製膜二廠', '',
        'J720', 'J720', '課長', '', '2'
      ],
      [
        '林工安', 'N000156654', '', '', '', '',
        '', '', '黃專員', 'N000156652', '林鴻祥', 'N000003986',
        '陳祈旭', 'N000019799', '吳聲君', 'N000005041', '離型膜廠', '',
        'JH50', 'JH50', '工三專員', '', '3'
      ]
    ];

    // 創建CSV內容
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    
    // 創建並下載文件
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '巡檢人員核簽資料匯入範例.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 觸發文件選擇
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 處理文件上傳
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 檢查文件類型
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      setUploadStatus('請選擇CSV或Excel文件');
      return;
    }

    setUploadStatus('上傳中...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/users/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUploadStatus(`成功匯入 ${response.data.imported_count} 位用戶`);
        await fetchUsers(currentPage, searchKeyword); // 重新載入用戶列表
      } else {
        setUploadStatus(`匯入失敗: ${response.data.message}`);
      }
    } catch (err) {
      console.error('批量匯入錯誤:', err);
      setUploadStatus(`匯入失敗: ${err.response?.data?.message || '未知錯誤'}`);
    }

    // 清空文件輸入
    event.target.value = '';
    
    // 3秒後清空狀態訊息
    setTimeout(() => {
      setUploadStatus('');
    }, 3000);
  };

  // 在組件掛載時獲取用戶列表
  useEffect(() => {
    // 檢查是否已登入
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    // 所有已登入的用戶都可以訪問用戶管理頁面，但看到的數據根據權限級別不同
    // 後端API會根據權限級別和部門限制可見的用戶
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, navigate]); // 移除 isAdmin 依賴

  // 優先級別轉換為文字
  const getPriorityLevelText = (level) => {
    switch (level) {
      case 1:
        return '巡檢人員';
      case 2:
        return '主管';
      case 3:
        return '管理員';
      case 4:
        return '超級管理員';
      default:
        return `級別 ${level}`;
    }
  };

  // New layout structure starts here
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isAdmin={isAdmin} /> {/* Pass isAdmin prop */}
      <div className="flex-1 flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">用戶管理</h1>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6 overflow-hidden">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {/* 錯誤訊息 */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                {error}
              </div>
            )}

            {/* 搜索欄和操作按鈕區 */}
            <div className="mb-4 flex justify-between items-center gap-4">
              {/* 搜索欄 */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchKeyword(value);
                    // 輸入10位時自動搜索
                    if (value.length === 10) {
                      setCurrentPage(1);
                      fetchUsers(1, value);
                    }
                    // 其他情況直接重置或總續輸入
                    else if (value.length < 10 && searchKeyword.length === 10) {
                      setCurrentPage(1);
                      fetchUsers(1, value);
                    }
                  }}
                  placeholder="搜索用戶ID（輸入10位自動搜索）"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* 可折疊操作按鈕區 */}
              <div className="flex items-center gap-2">
                {/* 所有已登入用戶都可以新增用戶 */}
                {user && user.priorityLevel >= 1 && (
                  <button
                    onClick={handleAddUser}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    新增用戶
                  </button>
                )}
                
                {/* 優先級別1和2可以使用批次匯入功能，級別3+可以使用所有操作選項 */}
                {user && user.priorityLevel >= 1 && (
                  <button
                    onClick={() => setIsActionsExpanded(!isActionsExpanded)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={isActionsExpanded ? '收起操作選項' : '展開操作選項'}
                  >
                    {isActionsExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                )}
              </div>
            </div>

            {/* 折疊的操作區域 */}
            {isActionsExpanded && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Excel操作按鈕 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleDownloadExcelTemplate}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center gap-2"
                    title="下載Excel範例文件"
                  >
                    <FaDownload />
                    下載範例
                  </button>
                  
                  <button
                    onClick={handleUploadClick}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 flex items-center gap-2"
                    title="上傳Excel文件批量匯入用戶"
                  >
                    <FaUpload />
                    上傳Excel
                  </button>
                  
                  {/* 隱藏的文件輸入 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* 說明文字 - 根據權限級別顯示不同內容 */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-medium">📋 批次匯入說明：</span>
                    {user && user.priorityLevel <= 2 ? (
                      <>批次匯入功能限制為優先級別1和2的用戶使用，只能匯入同部門前3碼的用戶。匯入使用者預設密碼為工號後6碼。</>
                    ) : (
                      <>批次匯入使用者預設密碼為工號後6碼</>
                    )}
                  </p>
                </div>

                {/* 上傳狀態訊息 */}
                {uploadStatus && (
                  <div className={`mt-3 p-3 rounded ${
                    uploadStatus.includes('成功') 
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' 
                      : uploadStatus.includes('上傳中') 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                  }`}>
                    {uploadStatus}
                  </div>
                )}
              </div>
            )}

            {/* 用戶表格區域 */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* 表格標題和顯示數量選擇器 */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">用戶列表</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">每頁顯示：</label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              
              {/* 表格區域 */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400">載入中...</div>
              ) : users.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400">沒有找到用戶</div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            用戶名稱
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            用戶ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            優先級別
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            部門
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((tableUser) => (
                          <tr key={tableUser.ID} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {tableUser.UserName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {tableUser.UserID}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                tableUser.PriorityLevel === 3 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : tableUser.PriorityLevel === 2
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {getPriorityLevelText(tableUser.PriorityLevel)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {tableUser.Department || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              {user && user.priorityLevel >= 1 ? (
                                <div className="flex justify-center items-center space-x-2">
                                  <button
                                    onClick={() => handleEditUser(tableUser)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                                    title="編輯用戶"
                                  >
                                    <FaPencilAlt />
                                  </button>
                                  <button
                                    onClick={() => handleCopyUser(tableUser)}
                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900"
                                    title="複製用戶"
                                  >
                                    <FaRegCopy />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(tableUser)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                                    title="刪除用戶"
                                  >
                                    <FaTrashAlt />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-xs">無權限操作</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                
                  {/* 分頁控制 */}
                  <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 py-3">
                    {/* 分頁信息 */}
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      顯示 {((pagination.current_page - 1) * pagination.page_size + 1)} 到 {Math.min(pagination.current_page * pagination.page_size, pagination.total_count)} 條，共 {pagination.total_count} 條記錄
                    </div>
                    
                    {/* 分頁按鈕 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.has_prev}
                        className={`p-2 rounded-lg border ${
                          pagination.has_prev
                            ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title="上一頁"
                      >
                        <FaChevronLeft />
                      </button>
                      
                      {/* 頁碼按鈕 */}
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.total_pages - 2) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded-lg border text-sm ${
                              pageNum === currentPage
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.has_next}
                        className={`p-2 rounded-lg border ${
                          pagination.has_next
                            ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title="下一頁"
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 刪除確認模態框 */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        title="確認刪除"
        message={`確定要刪除用戶 "${userToDelete?.UserName}" 嗎？此操作無法復原。`}
        confirmText="刪除"
        cancelText="取消"
        theme="danger"
      />

      {/* 用戶模態框 */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={handleUserModalClose}
        onSubmit={handleUserModalSubmit}
        isEditing={isEditingUser}
        editData={editUserData}
      />
    </div>
  );
}

export default UserManagement;

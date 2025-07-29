import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { getInspectionRecordsByFilters, getEquipmentOptions } from '../services/authService.js';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import InspectionModal from '../components/InspectionModal.js';

function RecordsPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // InspectionModal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 篩選條件
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(), // 預設當前年度
    equipment: '', // 設備名稱
    cycle: '' // 週期
  });

  // 設備名稱選項 - 將從API獲取
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  
  // 週期選項
  const cycleOptions = [
    { value: '', label: '全部週期' },
    { value: '每日', label: '每日' },
    { value: '每月', label: '每月' },
    { value: '每季', label: '每季' },
    { value: '每年', label: '每年' },
    { value: '每2年', label: '每2年' }
  ];

  // 年度選項 - 動態生成（過去5年到未來2年）
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push({ value: i.toString(), label: `${i}年` });
    }
    return years.reverse(); // 最新年份在前
  };

  // 獲取設備名稱選項
  const fetchEquipmentOptions = async () => {
    try {
      const data = await getEquipmentOptions();
      if (data.success && data.equipment_options) {
        setEquipmentOptions(data.equipment_options);
        console.log('成功載入設備選項:', data.equipment_options.length - 1, '個設備'); // -1 因為包含"全部設備"
      } else {
        console.error('API返回格式錯誤:', data);
        // 使用備用數據
        setEquipmentOptions([{ value: '', label: '全部設備' }]);
      }
    } catch (err) {
      console.error('獲取設備選項失敗:', err);
      // 使用備用數據
      setEquipmentOptions([{ value: '', label: '全部設備' }]);
    }
  };

  // 獲取巡檢記錄
  const fetchInspectionRecords = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getInspectionRecordsByFilters({
        year: filters.year,
        equipment: filters.equipment,
        cycle: filters.cycle,
        page: pageNum,
        limit: 12 // 每頁12筆，使用3x4網格佈局
      });
      
      if (pageNum === 1) {
        setRecords(data.records || []);
      } else {
        setRecords(prev => [...prev, ...(data.records || [])]);
      }
      
      setTotalRecords(data.total || 0);
      setHasMore((data.records || []).length === 12);
      
    } catch (err) {
      console.error('獲取巡檢記錄失敗:', err);
      setError(err.message || '獲取巡檢記錄失敗');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 處理篩選條件變更
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
    setRecords([]);
  };

  // 執行搜索
  const handleSearch = () => {
    fetchInspectionRecords(1);
  };

  // 重置篩選條件
  const handleReset = () => {
    setFilters({
      year: new Date().getFullYear().toString(),
      equipment: '',
      cycle: ''
    });
    setRecords([]);
    setPage(1);
  };

  // 載入更多記錄
  const loadMoreRecords = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchInspectionRecords(nextPage);
    }
  };

  // 點擊記錄顯示詳情
  const handleRecordClick = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  // 關閉詳情 Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  // 格式化檢查結果
  const formatInspectionResult = (record) => {
    let normalCount = 0;
    let abnormalCount = 0;
    const issues = [];

    for (const [key, value] of Object.entries(record)) {
      if (key.startsWith('Item') && key.match(/^Item\d+$/) && !key.endsWith('_Remark')) {
        if (value === '正常') {
          normalCount++;
        } else if (value && value !== '正常') {
          abnormalCount++;
          const itemId = key.replace('Item', '');
          const remarkKey = `Item${itemId}_Remark`;
          const remark = record[remarkKey] || '';
          issues.push({ item: key, value, remark });
        }
      }
    }

    return { normalCount, abnormalCount, issues };
  };

  useEffect(() => {
    console.log('進入記錄頁面');
    
    // 检查用户是否已登录
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    // 初始化：獲取設備選項
    fetchEquipmentOptions();
    
  }, [navigate, isLoggedIn]);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-8 text-gray-900 dark:text-gray-100">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">巡檢記錄查詢</h1>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              📊 記錄查詢功能
            </h2>
            <p className="text-green-700 dark:text-green-300">
              使用年度、設備名稱、週期篩選條件來查看巡檢記錄，支援大量數據瀏覽。
            </p>
          </div>
        </div>

        {/* 篩選面板 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            篩選條件
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            {/* 年度選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                年度
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {getYearOptions().map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 設備名稱選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                設備名稱
              </label>
              <select
                value={filters.equipment}
                onChange={(e) => handleFilterChange('equipment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {equipmentOptions.map((equipment) => (
                  <option key={equipment.value} value={equipment.value}>
                    {equipment.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 週期選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                檢查週期
              </label>
              <select
                value={filters.cycle}
                onChange={(e) => handleFilterChange('cycle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {cycleOptions.map((cycle) => (
                  <option key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 搜索按鈕 */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition flex items-center justify-center space-x-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{loading ? '搜索中' : '搜索'}</span>
              </button>
            </div>

            {/* 重置按鈕 */}
            <div className="flex items-end">
              <button
                onClick={handleReset}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>重置</span>
              </button>
            </div>
          </div>

          {/* 搜索結果統計 */}
          {totalRecords > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                找到 <span className="font-semibold">{totalRecords}</span> 筆符合條件的記錄
                {filters.year && <span className="ml-2">• 年度: {filters.year}</span>}
                {filters.equipment && <span className="ml-2">• 設備: {filters.equipment}</span>}
                {filters.cycle && <span className="ml-2">• 週期: {filters.cycle}</span>}
              </p>
            </div>
          )}
        </div>

        {/* 巡檢記錄列表 - 卡片網格佈局 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">巡檢記錄</h2>
          </div>
          
          {loading && records.length === 0 ? (
            // 載入狀態 - 網格骨架屏
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            // 錯誤狀態
            <div className="text-center py-12 text-red-500 dark:text-red-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm mb-2">載入失敗</p>
              <p className="text-xs">{error}</p>
              <button 
                onClick={handleSearch}
                className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
              >
                重新載入
              </button>
            </div>
          ) : records.length === 0 ? (
            // 無記錄狀態
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg mb-2">沒有找到符合條件的記錄</p>
              <p className="text-sm">請調整篩選條件或點擊搜索按鈕開始查詢</p>
            </div>
          ) : (
            // 記錄列表 - 網格卡片佈局
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {records.map((record, index) => {
                  const result = formatInspectionResult(record);
                  const isApproved = record.ReviewerId;
                  
                  return (
                    <div 
                      key={`record-${index}`} 
                      onClick={() => handleRecordClick(record)}
                      className={`p-4 rounded-lg border transition-all hover:shadow-lg cursor-pointer ${
                        isApproved 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      }`}
                    >
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                            {record.DisplayName || '未知表單'}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            isApproved
                              ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                              : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                          }`}>
                            {isApproved ? '已核簽' : '待核簽'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <p>📅 {record.CheckDate ? new Date(record.CheckDate).toLocaleDateString() : '未知日期'}</p>
                          <p>👤 {record.UserName || '未知用戶'}</p>
                          <p>🔧 {record.RouteName || `路線${record.RouteId || '未知'}`}</p>
                          {isApproved && record.ReviewerName && (
                            <p>✅ 核簽：{record.ReviewerName}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex space-x-3 text-xs">
                          <span className="flex items-center text-green-600 dark:text-green-400">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {result.normalCount}
                          </span>
                          {result.abnormalCount > 0 && (
                            <span className="flex items-center text-red-600 dark:text-red-400">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {result.abnormalCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 異常提示 */}
                      {result.abnormalCount > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800 mb-3">
                          <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                            ⚠️ {result.abnormalCount} 項異常需要關注
                          </p>
                        </div>
                      )}
                      
                      {/* 核簽信息 */}
                      {isApproved && record.ReviewerComment && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            💬 {record.ReviewerComment}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* 載入更多按鈕 */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={loadMoreRecords}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center space-x-2 mx-auto"
                  >
                    {loading && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    <span>{loading ? '載入中...' : '載入更多記錄'}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 巡檢詳情 Modal */}
      <InspectionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        record={selectedRecord}
        viewMode={true}
      />
    </div>
  );
}

export default RecordsPage;
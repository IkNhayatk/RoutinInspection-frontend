import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { getInspectionRecordsByFilters, getEquipmentOptions, getMonthlyInspectionDetails } from '../services/authService.js';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import InspectionModal from '../components/InspectionModal.js';

function RecordsPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  // const [hasMore, setHasMore] = useState(false);

  // InspectionModal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [displayFormat, setDisplayFormat] = useState('normal');

  // 篩選條件
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(), // 預設當前年度
    month: '', // 月份
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

  // 月份選項
  const monthOptions = [
    { value: '', label: '全部月份' },
    { value: '1', label: '1月' },
    { value: '2', label: '2月' },
    { value: '3', label: '3月' },
    { value: '4', label: '4月' },
    { value: '5', label: '5月' },
    { value: '6', label: '6月' },
    { value: '7', label: '7月' },
    { value: '8', label: '8月' },
    { value: '9', label: '9月' },
    { value: '10', label: '10月' },
    { value: '11', label: '11月' },
    { value: '12', label: '12月' }
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
      
      // 除錯資訊：顯示篩選參數
      const filterParams = {
        year: filters.year,
        month: filters.month,
        equipment: filters.equipment,
        cycle: filters.cycle,
        page: pageNum,
        limit: 5 // 每頁5筆
      };
      console.log('發送篩選參數:', filterParams);
      
      const data = await getInspectionRecordsByFilters(filterParams);
      
      setRecords(data.records || []);
      setTotalRecords(data.total || 0);
      // setHasMore((data.records || []).length === 5 && (pageNum * 5) < (data.total || 0));
      setPage(pageNum);
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
      month: '',
      equipment: '',
      cycle: ''
    });
    setRecords([]);
    setPage(1);
    fetchInspectionRecords(1);
  };

  // 分頁控制
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    if (newPage > Math.ceil(totalRecords / 5)) return;
    fetchInspectionRecords(newPage);
  };

  // 點擊記錄顯示詳情
  const handleRecordClick = async (record) => {
    console.log('點擊記錄:', record);
    setSelectedRecord(record);
    
    // 檢測是否為每日作業前格式 - 更嚴格的檢測條件
    const isDailyInspection = record.DisplayName && (
      record.DisplayName.includes('每日作業前') || 
      record.DisplayName.includes('每日') ||
      (record.DisplayName.includes('日') && !record.DisplayName.includes('月')) // 排除月檢
    );
    
    console.log('是否為每日作業前格式:', isDailyInspection, record.DisplayName);
    
    if (isDailyInspection) {
      try {
        // 設置載入狀態
        setLoading(true);
        
        // 從表單名稱中提取表單ID (如: user_B20D561013 -> B20D561013)
        const formId = record.TableName ? record.TableName.replace('user_', '') : '';
        const checkDate = new Date(record.CheckDate);
        const year = checkDate.getFullYear();
        const month = checkDate.getMonth() + 1;
        
        console.log('正在呼叫 API:', {
          formId,
          year,
          month,
          apiUrl: `/api/monthly-inspection-details/${formId}/${year}/${month}`
        });
        
        // 呼叫 API 獲取月度巡檢詳情
        const monthlyDetails = await getMonthlyInspectionDetails(formId, year, month);
        
        console.log('API 回傳資料:', monthlyDetails);
        
        if (monthlyDetails && monthlyDetails.success) {
          setMonthlyData(monthlyDetails);
          setDisplayFormat('daily');
          console.log('成功載入每日作業前格式資料');
        } else {
          console.warn('API 回傳失敗，使用一般格式');
          setDisplayFormat('normal');
          setMonthlyData(null);
        }
      } catch (error) {
        console.error('載入月度巡檢詳情失敗:', error);
        alert('載入每日作業前格式失敗，將使用一般格式顯示');
        setDisplayFormat('normal');
        setMonthlyData(null);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('使用一般格式顯示');
      setDisplayFormat('normal');
      setMonthlyData(null);
    }
    
    setIsModalOpen(true);
  };

  // 關閉詳情 Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setMonthlyData(null);
    setDisplayFormat('normal');
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
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

            {/* 月份選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                月份
              </label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
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
                {filters.month && <span className="ml-2">• 月份: {filters.month}月</span>}
                {filters.equipment && <span className="ml-2">• 設備: {filters.equipment}</span>}
                {filters.cycle && <span className="ml-2">• 週期: {filters.cycle}</span>}
              </p>
            </div>
          )}
        </div>

        {/* 巡檢記錄列表 - 列表模式 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">巡檢記錄</h2>
          </div>
          
          {loading && records.length === 0 ? (
            // 載入狀態 - 表格骨架屏
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2">日期</th>
                    <th className="px-4 py-2">表單名稱</th>
                    <th className="px-4 py-2">巡檢人員</th>
                    <th className="px-4 py-2">路線</th>
                    <th className="px-4 py-2">核簽狀態</th>
                    <th className="px-4 py-2">核簽主管</th>
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div></td>
                      <td className="px-4 py-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div></td>
                      <td className="px-4 py-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                      <td className="px-4 py-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div></td>
                      <td className="px-4 py-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div></td>
                      <td className="px-4 py-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            // 記錄列表 - 表格模式
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">日期</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">表單名稱</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">巡檢人員</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">路線</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">核簽狀態</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">核簽主管</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => {
                      const result = formatInspectionResult(record);
                      const isApproved = record.ReviewerId;
                      return (
                        <tr 
                          key={`record-${index}`}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition"
                          onClick={() => handleRecordClick(record)}
                        >
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {record.CheckDate ? new Date(record.CheckDate).toLocaleDateString() : '未知日期'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {record.DisplayName || '未知表單'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {record.UserName || '未知用戶'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {record.RouteName || `路線${record.RouteId || '未知'}`}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isApproved
                                ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                            }`}>
                              {isApproved ? '已核簽' : '待核簽'}
                            </span>
                            {isApproved && record.ReviewerComment && (
                              <div className="text-xs text-blue-500 dark:text-blue-400 mt-1 truncate max-w-xs">
                                💬 {record.ReviewerComment}
                              </div>
                            )}
                            {result.abnormalCount > 0 && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                ⚠️ {result.abnormalCount} 項異常
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {isApproved && record.ReviewerName ? (
                              <span className="text-sm text-blue-700 dark:text-blue-300">
                                {record.ReviewerName}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* 分頁控制 */}
              <div className="flex justify-center items-center gap-4 pt-6">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  上一頁
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  第 {page} / {Math.max(1, Math.ceil(totalRecords / 5))} 頁
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(totalRecords / 5) || loading}
                  className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  下一頁
                </button>
              </div>
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
        monthlyData={monthlyData}
        displayFormat={displayFormat}
      />
    </div>
  );
}

export default RecordsPage;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { getAutoDispatchData, getAutoDispatchStats } from '../services/authService.js';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import DailyInspectionModal from '../components/DailyInspectionModal.js';

function InspectionWork() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  // 狀態管理
  const [autoDispatchData, setAutoDispatchData] = useState([]);
  const [inspectionCount, setInspectionCount] = useState(0);  
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);

  useEffect(() => {
    console.log('進入巡檢作業頁面');
    
    // 检查用户是否已登录
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    // 獲取自動派工資料
    const fetchAutoDispatchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 從 localStorage 獲取用戶資料
        const userInfoString = localStorage.getItem('userInfo');
        if (!userInfoString) {
          throw new Error('無法獲取用戶資料');
        }
        
        const userInfo = JSON.parse(userInfoString);
        const department = userInfo.department;
        
        if (!department) {
          throw new Error('用戶部門資料不完整');
        }

        console.log('呼叫自動派工API，部門代號：', department);
        
        // 並行呼叫兩個 API：原本的派工資料和新的統計資料
        const [dispatchResponse, statsResponse] = await Promise.all([
          getAutoDispatchData(department),
          getAutoDispatchStats(department)
        ]);
        
        if (dispatchResponse.success) {
          setAutoDispatchData(dispatchResponse.data);
          setInspectionCount(dispatchResponse.count);
          console.log('自動派工資料載入成功:', dispatchResponse);
        } else {
          throw new Error(dispatchResponse.message || '獲取自動派工資料失敗');
        }
        
        if (statsResponse.success) {
          setStatsData(statsResponse.data);
          console.log('統計資料載入成功:', statsResponse);
        } else {
          console.warn('統計資料載入失敗:', statsResponse.message);
        }
      } catch (err) {
        console.error('獲取自動派工資料錯誤:', err);
        setError(err.message || '載入巡檢資料時發生錯誤');
        setInspectionCount(0);
        setAutoDispatchData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAutoDispatchData();
  }, [navigate, user, isLoggedIn]);

  // 處理日檢 Modal
  const handleDailyInspectionSuccess = (result) => {
    console.log('日檢處理成功:', result);
    
    // 顯示成功消息
    if (result.success_count > 0) {
      alert(`成功處理 ${result.success_count} 個日檢項目`);
      
      // 重新載入派工資料以更新統計
      const fetchAutoDispatchData = async () => {
        try {
          const userInfoString = localStorage.getItem('userInfo');
          if (!userInfoString) return;
          
          const userInfo = JSON.parse(userInfoString);
          const department = userInfo.department;
          
          if (!department) return;
          
          const [dispatchResponse, statsResponse] = await Promise.all([
            getAutoDispatchData(department),
            getAutoDispatchStats(department)
          ]);
          
          if (dispatchResponse.success) {
            setAutoDispatchData(dispatchResponse.data);
            setInspectionCount(dispatchResponse.count);
          }
          
          if (statsResponse.success) {
            setStatsData(statsResponse.data);
          }
        } catch (err) {
          console.error('重新載入資料錯誤:', err);
        }
      };
      
      fetchAutoDispatchData();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-8 text-gray-900 dark:text-gray-100">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">巡檢作業</h1>
          
          <div className="space-y-6">
            {/* 錯誤訊息顯示 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 dark:text-red-200">{error}</span>
                </div>
              </div>
            )}
            
            {/* 統計資訊區域 - 待處理統計 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                📊 待處理統計
              </h2>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="text-center animate-pulse">
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : statsData && statsData.summary && statsData.summary.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* 定義5個分類的顏色和圖標 */}
                  {['日', '月', '季', '年', '2年'].map((category, index) => {
                    const colors = [
                      'text-red-600 dark:text-red-400',
                      'text-orange-600 dark:text-orange-400', 
                      'text-yellow-600 dark:text-yellow-400',
                      'text-blue-600 dark:text-blue-400',
                      'text-purple-600 dark:text-purple-400'
                    ];
                    
                    const bgColors = [
                      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                      'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
                      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                      'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                    ];
                    
                    const categoryData = statsData.summary.find(item => item.category === category);
                    const count = categoryData ? categoryData.count : 0;
                    const percentage = categoryData ? categoryData.percentage : 0;
                    
                    return (
                      <div 
                        key={category} 
                        className={`${bgColors[index]} border rounded-lg p-4 text-center transition-all hover:shadow-md ${category === '日' ? 'cursor-pointer hover:shadow-lg' : ''}`}
                        onClick={category === '日' ? () => setIsDailyModalOpen(true) : undefined}
                      >
                        <div className={`text-2xl font-bold ${colors[index]} mb-1`}>
                          {count}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{category}檢</div>
                        {statsData.total_count > 0 && (
                          <div className={`text-xs ${colors[index]} font-medium`}>
                            {percentage}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    📝 暫無待處理的巡檢項目
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    所有巡檢任務都已完成或尚未分派
                  </div>
                </div>
              )}
              
              {/* 總計顯示 */}
              {statsData && statsData.total_count > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">總計待處理：</span>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-200 ml-2">
                      {statsData.total_count} 項
                    </span>
                  </div>
                </div>
              )}
              
            
              
            </div>

            {/* 開始巡檢區域 - 放在中間 */}
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/inspection-tablet', { state: { inspectionData: autoDispatchData } })}
                disabled={loading || inspectionCount === 0}
                className="bg-green-50 dark:bg-green-900/20 p-8 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow cursor-pointer max-w-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center space-y-4">
                  <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">開始巡檢</h3>
                  <p className="text-green-700 dark:text-green-300 text-center">
                    {loading ? '載入巡檢資料中...' : 
                     inspectionCount === 0 ? '無可用巡檢項目' :
                     '開始新的巡檢作業流程'}
                  </p>
                </div>
              </button>
            </div>


            {/* 功能介紹區域 - 移至最下方 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📋 巡檢作業功能
              </h2>
              <p className="text-blue-700 dark:text-blue-300">
                在此頁面您可以進行日常巡檢作業，包括巡檢項目執行、數據記錄、異常情況處理等功能。
                {!loading && (
                  <span className="block mt-2 text-sm">
                    已載入 {inspectionCount} 個巡檢目標，準備開始作業。
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 日檢 Modal */}
      <DailyInspectionModal
        isOpen={isDailyModalOpen}
        onClose={() => setIsDailyModalOpen(false)}
        onSuccess={handleDailyInspectionSuccess}
      />
    </div>
  );
}

export default InspectionWork;
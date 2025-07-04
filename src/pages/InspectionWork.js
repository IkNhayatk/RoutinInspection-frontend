import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.js';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';

function InspectionWork() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    console.log('進入巡檢作業頁面');
    
    // 检查用户是否已登录
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
  }, [navigate, user, isLoggedIn]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-8 text-gray-900 dark:text-gray-100">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">巡檢作業</h1>
          
          <div className="space-y-6">
            {/* 功能介紹區域 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📋 巡檢作業功能
              </h2>
              <p className="text-blue-700 dark:text-blue-300">
                在此頁面您可以進行日常巡檢作業，包括巡檢項目執行、數據記錄、異常情況處理等功能。
              </p>
            </div>

            {/* 快速操作區域 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 開始巡檢 */}
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">開始巡檢</h3>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  開始新的巡檢作業流程
                </p>
              </div>

              {/* 巡檢記錄 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">巡檢記錄</h3>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  查看歷史巡檢記錄
                </p>
              </div>

              {/* 異常處理 */}
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">異常處理</h3>
                </div>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  處理巡檢中發現的異常情況
                </p>
              </div>
            </div>

            {/* 統計資訊區域 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                📊 巡檢統計
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">今日巡檢</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">完成項目</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">待處理</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">異常項目</div>
                </div>
              </div>
            </div>

            {/* 待實現提示 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border-l-4 border-indigo-500">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                💡 此頁面功能正在開發中，後續將會加入完整的巡檢作業流程。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InspectionWork;
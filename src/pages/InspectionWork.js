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
            {/* 統計資訊區域 - 移至最上方 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                📊 巡檢統計
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>

            {/* 開始巡檢區域 - 放在中間 */}
            <div className="flex justify-center">
              <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow cursor-pointer max-w-md w-full">
                <div className="flex flex-col items-center space-y-4">
                  <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">開始巡檢</h3>
                  <p className="text-green-700 dark:text-green-300 text-center">
                    開始新的巡檢作業流程
                  </p>
                </div>
              </div>
            </div>

            {/* 功能介紹區域 - 移至最下方 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📋 巡檢作業功能
              </h2>
              <p className="text-blue-700 dark:text-blue-300">
                在此頁面您可以進行日常巡檢作業，包括巡檢項目執行、數據記錄、異常情況處理等功能。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InspectionWork;
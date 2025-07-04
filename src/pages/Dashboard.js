import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.js';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';

function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    console.log('進入dashboard頁面');
    
    // 检查用户是否已登录
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    
    // 检查用户权限：只有优先级别2的用户才能访问dashboard
    if (user && user.priorityLevel !== 2) {
      // 非优先级别2的用户重定向到用户管理页面
      navigate('/user_management');
      return;
    }
  }, [navigate, user, isLoggedIn]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900" onLoad={() => console.log('進入dashboard頁面')}>
      <Sidebar />

      <div className="flex-1 p-8 text-gray-900 dark:text-gray-100">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">巡檢作業核簽與紀錄</h1>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📋 核簽與紀錄功能
            </h2>
            <p className="text-blue-700 dark:text-blue-300">
              在此頁面您可以進行巡檢結果的核簽作業以及查看相關紀錄。左側為待核簽的紀錄列表，右側為已完成的巡檢結果查看。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：待核簽紀錄 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">待核簽紀錄</h2>
            </div>
            
            <div className="space-y-4">
              {/* 待核簽項目範例 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">聚酯膜生產線A - 日常巡檢</h3>
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">待核簽</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">巡檢時間：2024-01-15 08:30</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">巡檢人員：張三</p>
                <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
                  查看詳情
                </button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">聚酯膜生產線B - 設備檢查</h3>
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">待核簽</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">巡檢時間：2024-01-15 10:15</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">巡檢人員：李四</p>
                <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
                  查看詳情
                </button>
              </div>

              {/* 空狀態 */}
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">沒有更多待核簽紀錄</p>
              </div>
            </div>
          </div>

          {/* 右側：巡檢結果 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">巡檢結果</h2>
            </div>
            
            <div className="space-y-4">
              {/* 已完成巡檢結果範例 */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">聚酯膜生產線A - 週檢</h3>
                  <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">已完成</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">完成時間：2024-01-14 16:45</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">核簽人員：王五</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">結果：正常</p>
                <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
                  查看報告
                </button>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">聚酯膜生產線C - 安全檢查</h3>
                  <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">已完成</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">完成時間：2024-01-14 14:20</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">核簽人員：趙六</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">結果：正常</p>
                <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
                  查看報告
                </button>
              </div>

              {/* 查看更多按鈕 */}
              <div className="text-center">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  查看更多結果 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

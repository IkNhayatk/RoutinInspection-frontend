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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">歡迎回來</h1>
          <p className="text-gray-600 dark:text-gray-300">請從側邊欄選擇功能</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

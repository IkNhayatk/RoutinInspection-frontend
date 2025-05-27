import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import { useAuth } from '../context/AuthContext.js';

function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  useEffect(() => {
    console.log('進入dashboard頁面');
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900" onLoad={() => console.log('進入dashboard頁面')}>
      <Sidebar isAdmin={isAdmin} />

      <div className="flex-1 p-8 text-gray-900 dark:text-gray-100">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">歡迎回來</h1>
          <p className="text-gray-600 dark:text-gray-300">請從側邊欄選擇功能</p>
          {isAdmin && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded">
              <p className="text-yellow-800 dark:text-yellow-200">您具有管理員權限！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

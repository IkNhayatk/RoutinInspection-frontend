import React from 'react';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import { useAuth } from '../context/AuthContext.js'; // Import useAuth

function RouteBinding() {
  const { isAdmin } = useAuth(); // Get isAdmin status

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isAdmin={isAdmin} /> {/* Pass isAdmin prop */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">路線綁定</h1>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            {/* 路線綁定內容將在此處添加 */}
            <p className="text-gray-700 dark:text-gray-300">這是路線綁定的空白頁面。</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default RouteBinding;

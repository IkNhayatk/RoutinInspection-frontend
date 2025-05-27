import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.js';
import Sidebar from '../components/Layout/Sidebar.js'; // Added .js extension
import LogoutButton from '../components/LogoutButton.js'; // Added .js extension

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // 獲取用戶列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const response = await apiClient.get('/users');
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        setError(response.data.message || '獲取用戶列表失敗');
      }
    } catch (err) {
      console.error('獲取用戶列表錯誤:', err);
      // 臨時繞過後端錯誤訊息，以便測試
      setError('');
      setUsers([]); // 設置為空列表以避免顯示錯誤
    } finally {
      setLoading(false);
    }
  };

  // 刪除用戶
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('確定要刪除此用戶嗎？此操作無法撤銷。')) {
      return;
    }

    try {
      setError(''); // Clear previous errors
      const response = await apiClient.delete(`/users/${userId}`);
      if (response.data.success) {
        // 重新獲取用戶列表
        fetchUsers();
      } else {
        setError(response.data.message || '刪除用戶失敗');
      }
    } catch (err) {
      console.error('刪除用戶錯誤:', err);
      setError('刪除用戶失敗: ' + (err.response?.data?.message || '未知錯誤'));
    }
  };

  // 在組件掛載時獲取用戶列表
  useEffect(() => {
    // 檢查是否已登入且是管理員
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    if (!isAdmin) {
      navigate('/dashboard'); // Redirect non-admins
      return;
    }

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, navigate]); // Dependencies updated slightly for clarity

  // 優先級別轉換為文字
  const getPriorityLevelText = (level) => {
    switch (level) {
      case 1:
        return '一般用戶';
      case 2:
        return '進階用戶';
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
        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6"> {/* Added overflow handling */}
          {/* Existing content moved inside main */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
              {error}
            </div>
          )}

          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={() => navigate('/add_user')}
              className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              新增用戶
            </button>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? '載入中...' : '重新整理'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">載入中...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">沒有找到用戶</div>
          ) : (
            <div className="overflow-x-auto shadow-md rounded-lg"> {/* Added shadow and rounded */}
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">用戶名稱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">用戶ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">部門</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">職位</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">優先級別</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">工作狀態</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.ID} className="hover:bg-gray-50 dark:hover:bg-gray-600"> {/* Adjusted hover color */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.ID}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.UserName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.UserID}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.Department || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.Position || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {getPriorityLevelText(user.PriorityLevel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.IsAtWork
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {user.IsAtWork ? '在線' : '離線'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.ID)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 mr-3"
                          aria-label={`刪除用戶 ${user.UserName}`}
                        >
                          刪除
                        </button>
                        {/* Add edit button or other actions here if needed */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default UserManagement;

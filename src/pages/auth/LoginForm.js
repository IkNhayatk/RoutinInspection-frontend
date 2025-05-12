import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { login } from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.js';

function LoginForm() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNavigating) {
      console.log('正在導航到其他頁面，阻止登入動作');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      // 使用 authService 的 login 函數
      const result = await login(userId, password);
      
      if (result.success) {
        // 更新認證狀態
        await refreshAuth();
        // 導航到 dashboard
        navigate('/dashboard');
      } else {
        setError(result.message || '登入失敗');
      }
    } catch (err) {
      console.error('登入出錯:', err);
      setError('無法連接到伺服器');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Add dark mode background
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Add dark mode background and text color */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-gray-900 dark:text-gray-100">
        {/* Add dark mode text color */}
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">登入系統</h1>
        {/* Adjust error text color for dark mode if needed */}
        {error && <div className="mb-4 text-red-500 dark:text-red-400 text-center">{error}</div>}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            {/* Add dark mode text color for label */}
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              用戶ID
            </label>
            {/* Add dark mode styles for input */}
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入您的用戶ID"
              required
            />
          </div>
          <div>
            {/* Add dark mode text color for label */}
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              密碼
            </label>
            {/* Add dark mode styles for input */}
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入您的密碼"
              required
            />
          </div>
          <div>
            {/* Add dark mode styles for submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 dark:disabled:opacity-60"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </div>
          <div className="mt-4 text-center">
            {/* Add dark mode styles for register button */}
            <button
              onClick={() => {
                console.log('按下註冊新帳號按鈕，跳轉到add_user頁面');
                setIsNavigating(true);
                // 在同一窗口中導航到 add_user 頁面
                navigate('/add_user', { replace: true });
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              註冊新帳號
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;

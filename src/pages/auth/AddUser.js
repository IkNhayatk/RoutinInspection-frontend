import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { register } from '../../services/authService.js';

function AddUser() {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [engName, setEngName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('跳轉到add_user頁面');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('密碼與確認密碼不相符');
      setLoading(false);
      return;
    }

    try {
      // 由於這是一個管理員功能，普通用戶無法訪問此頁面
      // 這裡我們假設只有管理員可以創建新用戶，並設置優先級別為1（普通用戶）
      const userData = {
        UserName: userName,
        UserID: userId,
        EngName: engName,
        Email: email,
        Password: password,
        PriorityLevel: 1, // 普通用戶
        Position: position,
        Department: department
      };

      const result = await register(userData);
      
      if (result.success) {
        console.log('註冊成功，2秒後導航到登入頁面');
        setSuccess(true);
        setTimeout(() => {
          console.log('執行導航到登入頁面');
          try {
            navigate('/');
          } catch (err) {
            console.error('導航到登入頁面時發生錯誤:', err);
          }
        }, 2000);
      } else {
        console.log('註冊失敗:', result.message || '未知錯誤');
        setError(result.message || '註冊失敗');
      }
    } catch (err) {
      setError(err.response?.data?.message || '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Add dark mode background
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4" onLoad={() => console.log('跳轉到add_user頁面')}>
      {/* Add dark mode background and text color */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-gray-900 dark:text-gray-100">
        {/* Add dark mode text color */}
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">註冊新帳號</h1>
        {/* Adjust error/success text colors for dark mode */}
        {error && <div className="mb-4 text-red-500 dark:text-red-400 text-center">{error}</div>}
        {success && (
          <div className="mb-4 text-green-500 dark:text-green-400 text-center">
            註冊成功！即將跳轉至登入頁面...
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              用戶名稱
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入用戶名稱"
              required
            />
          </div>
          
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              用戶ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入用戶ID"
              required
            />
          </div>
          
          <div>
            <label htmlFor="engName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              英文名稱
            </label>
            <input
              type="text"
              id="engName"
              value={engName}
              onChange={(e) => setEngName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入英文名稱"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              電子郵件
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入電子郵件"
            />
          </div>
          
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              職位
            </label>
            <input
              type="text"
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入職位"
            />
          </div>
          
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              部門
            </label>
            <input
              type="text"
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入部門"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              密碼
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請輸入密碼"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              確認密碼
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              placeholder="請再次輸入密碼"
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
              {loading ? '註冊中...' : '註冊'}
            </button>
          </div>
          <div className="text-center">
            {/* Add dark mode styles for back button */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              返回登入
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUser;

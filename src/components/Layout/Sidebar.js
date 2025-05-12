import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router'; // Import useLocation
import { useTheme } from '../../context/ThemeContext.js';

function Sidebar({ isAdmin }) {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const { theme, toggleTheme } = useTheme();
  // 新增收合狀態
  const [collapsed, setCollapsed] = useState(false);
  
  // 儲存收合狀態到 localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // 處理收合切換
  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
  };

  return (
    <>
      {/* 側邊欄主體 */}
      <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 shadow-md h-full flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          {/* 只在展開狀態顯示 LOGO 文字 */}
          {!collapsed && <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">LOGO</div>}
          
          {/* 只在展開狀態顯示收合按鈕 */}
          {!collapsed && (
            <button 
              onClick={toggleCollapse}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              aria-label="收合側邊欄"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          
          {/* 收合狀態下顯示圖標而非文字 */}
          {/* 收合狀態下顯示圖標且可點擊展開 */}
          {collapsed && (
            <button
              onClick={toggleCollapse}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              aria-label="展開側邊欄"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
        
        <nav className="p-4 flex-grow">
          <ul className="space-y-2">
            {/* 新增：表單核簽按鈕 */}
            <li>
              <button
                onClick={() => navigate('/dashboard')} // 連結到 dashboard
                className={`w-full text-left ${collapsed ? 'px-2 justify-center' : 'px-4'} py-2 rounded-md transition flex items-center ${
                  location.pathname === '/dashboard'
                    ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 font-semibold' // Active style
                    : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400' // Default style
                }`}
              >
                {/* 表單核簽圖示 (打勾) */}
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {!collapsed && <span className="ml-2">表單核簽</span>}
              </button>
            </li>
            {/* 表單設定按鈕 */}
            <li>
              <button
                onClick={() => navigate('/form_settings')} // 假設路由為 /form_settings
                className={`w-full text-left ${collapsed ? 'px-2 justify-center' : 'px-4'} py-2 rounded-md transition flex items-center ${
                  location.pathname === '/form_settings'
                    ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 font-semibold' // Active style
                    : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400' // Default style
                }`}
              >
                {/* 表單設定圖示 (齒輪) */}
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!collapsed && <span className="ml-2">表單設定</span>}
              </button>
            </li>
            {/* 新增：路線綁定按鈕 */}
            <li>
              <button
                onClick={() => navigate('/route_binding')} // 假設路由為 /route_binding
                className={`w-full text-left ${collapsed ? 'px-2 justify-center' : 'px-4'} py-2 rounded-md transition flex items-center ${
                  location.pathname === '/route_binding'
                    ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 font-semibold' // Active style
                    : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400' // Default style
                }`}
              >
                {/* 路線綁定圖示 (地圖) */}
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!collapsed && <span className="ml-2">路線綁定</span>}
              </button>
            </li>
            {/* 使用者管理按鈕 (移至第三位) */}
            {isAdmin && (
              <li>
                <button
                  onClick={() => navigate('/user_management')}
                  className={`w-full text-left ${collapsed ? 'px-2 justify-center' : 'px-4'} py-2 rounded-md transition flex items-center ${
                    location.pathname === '/user_management'
                      ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 font-semibold' // Active style
                      : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400' // Default style
                  }`}
                >
                  {/* 使用者管理圖示 */}
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {!collapsed && <span className="ml-2">使用者管理</span>}
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* 主題切換按鈕 */}
        <div className={`p-4 border-t border-gray-200 dark:border-gray-700 flex ${collapsed ? 'justify-center' : 'justify-center'}`}>
          {collapsed ? (
            // 收合狀態下的主題切換按鈕
            <button 
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-800 hover:bg-gray-700'} transition`}
              aria-label={theme === 'light' ? "切換至深色模式" : "切換至淺色模式"}
            >
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="5" stroke="black" strokeWidth="2"/>
                  <path d="M12 4V2" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 22V20" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 12L22 12" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M2 12L4 12" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ) : (
            // 展開狀態下的主題切換按鈕
            theme === 'light' ? (
              // 日間模式按鈕
              <button 
                onClick={toggleTheme}
                className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition flex items-center space-x-2"
                aria-label="切換至深色模式"
              >
                <span className="text-sm font-medium text-gray-800">日間</span>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="5" stroke="black" strokeWidth="2"/>
                    <path d="M12 4V2" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 22V20" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M20 12L22 12" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M2 12L4 12" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17.6569 6.34315L19.0711 4.92893" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M4.92896 19.0711L6.34317 17.6569" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17.6569 17.6569L19.0711 19.0711" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M4.92896 4.92893L6.34317 6.34315" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </button>
            ) : (
              // 夜間模式按鈕
              <button 
                onClick={toggleTheme}
                className="px-4 py-1 bg-gray-800 hover:bg-gray-700 rounded-full transition flex items-center space-x-2"
                aria-label="切換至淺色模式"
              >
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 6L17.5 7.5L16 9L14.5 7.5L16 6Z" stroke="white" strokeWidth="1.5" fill="none"/>
                    <path d="M19 7L20 8L19 9L18 8L19 7Z" stroke="white" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-white">夜間</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 完全收合時不再顯示額外的展開按鈕 */}
    </>
  );
}

export default Sidebar;

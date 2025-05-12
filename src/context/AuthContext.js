import React, { createContext, useState, useEffect, useContext } from 'react';
import { checkUserAuthStatus, updateLastActivity } from '../services/authService.js';

// 創建認證上下文
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始檢查
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authStatus = checkUserAuthStatus();
        setIsLoggedIn(authStatus.isLoggedIn);
        setIsAdmin(authStatus.isAdmin);
        setUser(authStatus.user);
        setToken(authStatus.token);
      } catch (error) {
        console.error('初始化認證狀態失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 監聽登出事件（例如 token 過期）
    const handleLogout = () => {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-logout', handleLogout);

    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  const refreshAuth = () => {
    setLoading(true);
    try {
      const authStatus = checkUserAuthStatus();
      setIsLoggedIn(authStatus.isLoggedIn);
      setIsAdmin(authStatus.isAdmin);
      setUser(authStatus.user);
      setToken(authStatus.token);
      updateLastActivity();
    } catch (error) {
      console.error('重新驗證失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isLoggedIn,
    isAdmin,
    user,
    token,
    loading,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  return context;
}

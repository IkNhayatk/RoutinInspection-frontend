import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext.js';
import LoginForm from '../pages/auth/LoginForm.js';
import AddUser from '../pages/auth/AddUser.js';
import Dashboard from '../pages/Dashboard.js';
import TodoList from '../pages/TodoList.js';
import UserManagement from '../pages/UserManagement.js';
import FormSettings from '../pages/FormSettings.js';
import RouteBinding from '../pages/RouteBinding.js';

// 這些頁面尚未實現，所以使用佔位符
const LikeTrello = () => <div>LikeTrello Page Placeholder</div>; // Added Placeholder text for clarity

// 受保護路由組件
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  // 如果正在加載，顯示載入中
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">載入中...</p>
        </div>
      </div>
    );
  }

  // 如果未登入，重定向到登入頁，但允許訪問 add_user 頁面
  if (!isLoggedIn) {
    console.log('ProtectedRoute: Not logged in, redirecting to /');
    return <Navigate to="/" replace />;
  }
  // 如果當前路徑是 /add_user，允許訪問，無論是否已登入，並且不進行任何其他檢查
  if (window.location.pathname === '/add_user') {
    console.log('ProtectedRoute: Allowing access to /add_user regardless of login status');
    return children;
  }

  // 如果需要管理員權限但用戶不是管理員，重定向到 Dashboard
  if (requireAdmin && !isAdmin) {
    console.log('ProtectedRoute: Admin required but user is not admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // 通過所有檢查，渲染子組件
  console.log(`ProtectedRoute: Access granted for requireAdmin=${requireAdmin}`);
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LoginForm />} />
      {/* Note: AddUser might need protection depending on requirements */}
      <Route path="/add_user" element={<AddUser />} />

      {/* Protected Routes (require login) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/todolist"
        element={
          <ProtectedRoute>
            <TodoList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/liketrello"
        element={
          <ProtectedRoute>
            <LikeTrello />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form_settings"
        element={
          <ProtectedRoute> {/* No admin required */}
            <FormSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/route_binding"
        element={
          <ProtectedRoute> {/* No admin required */}
            <RouteBinding />
          </ProtectedRoute>
        }
      />

      {/* Protected Route (require login AND admin) */}
      <Route
        path="/user_management"
        element={
          <ProtectedRoute requireAdmin={true}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* Fallback for unknown paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;

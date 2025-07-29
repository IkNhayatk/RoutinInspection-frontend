import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import LoginForm from '../pages/auth/LoginForm.js';
import AddUser from '../pages/auth/AddUser.js';
import ApprovalPage from '../pages/ApprovalPage.js';
import RecordsPage from '../pages/RecordsPage.js';
import InspectionWork from '../pages/InspectionWork.js';
import InspectionTablet from '../pages/InspectionTablet.js';
import UserManagement from '../pages/UserManagement.js';
import FormSettings from '../pages/FormSettings.js';
import RouteBinding from '../pages/RouteBinding.js';

// 這些頁面尚未實現，所以使用佔位符
const LikeTrello = () => <div>LikeTrello Page Placeholder</div>; // Added Placeholder text for clarity

// 獲取預設首頁根據用戶優先級
function getDefaultHomePage(user) {
  if (!user || !user.priorityLevel) {
    return '/inspection_work'; // 預設路由
  }
  
  switch (user.priorityLevel) {
    case 1:
      return '/inspection_work';
    case 2:
      return '/approval';
    case 3:
    case 4:
      return '/records';
    default:
      return '/inspection_work';
  }
}

// 受保護路由組件
function ProtectedRoute({ children, requireAdmin = false, requireMinPriority = 1 }) {
  const { isLoggedIn, isAdmin, user, loading } = useAuth();

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

  // 檢查優先級權限
  if (user && user.priorityLevel < requireMinPriority) {
    const defaultPage = getDefaultHomePage(user);
    console.log(`ProtectedRoute: Insufficient priority level (${user.priorityLevel} < ${requireMinPriority}), redirecting to ${defaultPage}`);
    return <Navigate to={defaultPage} replace />;
  }

  // 如果需要管理員權限但用戶不是管理員，重定向到預設首頁
  if (requireAdmin && !isAdmin) {
    const defaultPage = getDefaultHomePage(user);
    console.log(`ProtectedRoute: Admin required but user is not admin, redirecting to ${defaultPage}`);
    return <Navigate to={defaultPage} replace />;
  }

  // 通過所有檢查，渲染子組件
  console.log(`ProtectedRoute: Access granted for requireAdmin=${requireAdmin}, requireMinPriority=${requireMinPriority}`);
  return children;
}

// 首頁重定向組件
function HomeRedirect() {
  const { user } = useAuth();
  const defaultPage = getDefaultHomePage(user);
  return <Navigate to={defaultPage} replace />;
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/add_user" element={<AddUser />} />
      
      {/* Home route - redirect to login if not logged in, otherwise to priority-based default page */}
      <Route path="/" element={isLoggedIn ? <HomeRedirect /> : <LoginForm />} />

      {/* Protected Routes (require login) */}
      <Route
        path="/inspection_work"
        element={
          <ProtectedRoute>
            <InspectionWork />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspection-tablet"
        element={
          <ProtectedRoute>
            <InspectionTablet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approval"
        element={
          <ProtectedRoute requireMinPriority={2}>
            <ApprovalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/records"
        element={
          <ProtectedRoute>
            <RecordsPage />
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
      
      {/* Management Pages (accessible to all logged-in users) */}
      <Route
        path="/user_management"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form_settings"
        element={
          <ProtectedRoute>
            <FormSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/route_binding"
        element={
          <ProtectedRoute>
            <RouteBinding />
          </ProtectedRoute>
        }
      />

      {/* Fallback for unknown paths - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;

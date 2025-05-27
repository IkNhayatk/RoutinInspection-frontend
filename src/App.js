import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router';
import AppRoutes from './routes/AppRoutes.js';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { setupActivityListeners, setupAutoLogout, checkAutoLogout } from './services/authService.js';

function App() {
  useEffect(() => {
    // 設置活動監聽器 - 頁面加載時一次性設置
    setupActivityListeners();
    
    // 檢查是否已超時，如果沒有則設置新的自動登出計時器
    if (!checkAutoLogout()) {
      setupAutoLogout();
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
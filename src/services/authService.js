import axios from 'axios';

const API_URL = 'http://127.0.0.1:3001/api'; // 確保後端 API URL 正確

// 創建一個 axios 實例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加請求攔截器，自動附加 JWT 令牌
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加響應攔截器，處理 401 未授權錯誤（例如，令牌過期）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 令牌無效或過期，執行登出
      console.warn('Token invalid or expired, logging out.');
      logout(); // 觸發登出流程
      // 可以選擇性地重定向到登入頁面或顯示訊息
      // window.location.href = '/';
    }
    return Promise.reject(error);
  }
);


export const login = async (user_id, password) => {
  try {
    // 使用 apiClient 實例發送請求
    const response = await apiClient.post('/login', { user_id, password });
    const data = response.data; // axios 會自動處理 JSON 解析

    if (data.success) {
      // 存儲令牌
      localStorage.setItem('token', data.token);

      // 存儲用戶信息（可以從令牌解碼或直接使用後端回傳的）
      const userInfo = {
        id: data.user.id,
        userName: data.user.userName,
        userID: data.user.userID,
        priorityLevel: data.user.priorityLevel,
        position: data.user.position,
        department: data.user.department,
      };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      // 設置自動登出計時器（基於閒置時間）
      setupAutoLogout();
    }

    return data;
  } catch (error) {
    console.error('登入失敗:', error.response ? error.response.data : error.message);
    // 回傳後端提供的錯誤訊息，如果有的話
    return error.response ? error.response.data : { success: false, message: '登入請求失敗' };
  }
};

// 登出函數
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('lastActivity');

  // 清除所有可能設置的計時器
  if (window.autoLogoutTimer) {
    clearTimeout(window.autoLogoutTimer);
    window.autoLogoutTimer = null; // 清除引用
  }

  // 確保在 React 環境下使用 navigate 或其他路由方式，而不是直接操作 window.location
  // 這裡暫時保留，但建議在 Context 或 Component 中處理導航
  // window.location.href = '/';
  // 觸發一個自定義事件，讓 AuthContext 可以監聽到登出
  window.dispatchEvent(new CustomEvent('auth-logout'));
};


// 檢查用戶登入狀態和權限（從 localStorage 讀取）
// 這個函數現在主要用於初始化 AuthContext，實際權限由後端驗證
export const checkUserAuthStatus = () => {
  const token = localStorage.getItem('token');
  const userInfoString = localStorage.getItem('userInfo');

  if (token && userInfoString) {
    try {
      const userInfo = JSON.parse(userInfoString);
      // 可以選擇性地在這裡解碼 token 來檢查是否過期，但後端攔截器會處理
      return {
        isLoggedIn: true,
        isAdmin: userInfo.priorityLevel >= 1, // 優先級別 1 或以上視為管理員 (根據用戶要求)
        user: userInfo,
        token: token,
      };
    } catch (e) {
      console.error("解析用戶信息失敗:", e);
      // 如果解析失敗，清除損壞的數據並視為未登入
      logout();
      return { isLoggedIn: false, isAdmin: false, user: null, token: null };
    }
  }

  return { isLoggedIn: false, isAdmin: false, user: null, token: null };
};

// 獲取用戶個人資料（需要驗證）
export const getProfile = async () => {
  try {
    const response = await apiClient.get('/profile');
    return response.data;
  } catch (error) {
    console.error('獲取個人資料失敗:', error.response ? error.response.data : error.message);
    // 錯誤已由攔截器處理（如 401），這裡可以選擇性地再次拋出或回傳錯誤訊息
    throw error;
  }
};


export const register = async (userData) => {
  try {
    // 使用 apiClient 實例，但使用公開的註冊路由
    console.log('發送註冊請求:', userData);
    const response = await apiClient.post('/register', userData);
    console.log('收到註冊響應:', response.data);
    return response.data;
  } catch (error) {
    console.error('註冊失敗:', error.response ? error.response.data : error.message);
    // 拋出錯誤，讓調用者處理 UI 反饋
    throw error.response ? error.response.data : new Error('註冊請求失敗');
  }
};



// --- 閒置自動登出邏輯 (保持不變) ---
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 分鐘

export const updateLastActivity = () => {
  localStorage.setItem('lastActivity', Date.now().toString());
};

// 檢查是否應該自動登出
export const checkAutoLogout = () => {
  const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
  const currentTime = Date.now();

  // 如果超過閒置時間，則登出
  if (currentTime - lastActivity > IDLE_TIMEOUT) {
    console.log('User idle, logging out.');
    logout(); // 觸發登出
    return true;
  }

  return false;
};

// 設置自動登出計時器
export const setupAutoLogout = () => {
  updateLastActivity(); // 初始化活動時間

  if (window.autoLogoutTimer) {
    clearTimeout(window.autoLogoutTimer);
  }

  // 每分鐘檢查一次
  window.autoLogoutTimer = setInterval(() => {
    checkAutoLogout();
  }, 60 * 1000);
};

// 設置活動監聽器
export const setupActivityListeners = () => {
  const events = [
    'mousedown', 'mousemove', 'keypress',
    'scroll', 'touchstart', 'click'
  ];

  const listener = () => {
    updateLastActivity();
  };

  events.forEach(event => {
    document.removeEventListener(event, listener); // 先移除舊的監聽器
    document.addEventListener(event, listener, { passive: true });
  });

  // 初始設置活動時間
  updateLastActivity();
};

// 導出 apiClient 供其他 service 使用
export { apiClient };

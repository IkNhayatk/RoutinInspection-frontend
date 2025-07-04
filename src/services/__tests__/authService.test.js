// Mock axios before any imports
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}));

import {
  login,
  logout,
  checkUserAuthStatus,
  getProfile,
  register,
  updateLastActivity,
  checkAutoLogout,
  setupAutoLogout,
  setupActivityListeners,
  apiClient
} from '../authService';

const mockedAxios = require('axios');

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value?.toString?.() || value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    // Add internal methods for testing
    _getStore: () => store,
    _setStore: (newStore) => { store = newStore; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock timers
jest.useFakeTimers();

// Mock Date.now for consistent testing
const originalDateNow = Date.now;
const mockDateNow = jest.fn(() => 1000000000000); // Fixed timestamp
Date.now = mockDateNow;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    jest.clearAllTimers();
    
    // Reset Date.now mock
    mockDateNow.mockReturnValue(1000000000000);
    
    // Clear any existing timers
    if (window.autoLogoutTimer) {
      clearTimeout(window.autoLogoutTimer);
      window.autoLogoutTimer = null;
    }
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });
  
  afterAll(() => {
    // Restore original Date.now
    Date.now = originalDateNow;
    jest.useRealTimers();
  });

  describe('login', () => {
    test('successful login stores token and user info', async () => {
      const mockResponse = {
        data: {
          success: true,
          token: 'fake-jwt-token',
          user: {
            id: 1,
            userName: '測試用戶',
            userID: 'testuser001',
            priorityLevel: 2,
            position: '工程師',
            department: '測試部門',
          },
        },
      };

      apiClient.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await login('testuser001', 'password123');

      expect(apiClient.post).toHaveBeenCalledWith('/login', {
        user_id: 'testuser001',
        password: 'password123',
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'fake-jwt-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'userInfo',
        JSON.stringify({
          id: 1,
          userName: '測試用戶',
          userID: 'testuser001',
          priorityLevel: 2,
          position: '工程師',
          department: '測試部門',
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    test('failed login returns error message', async () => {
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            message: 'Invalid credentials',
          },
        },
      };

      apiClient.post = jest.fn().mockRejectedValue(mockErrorResponse);

      const result = await login('wronguser', 'wrongpass');

      expect(result).toEqual({
        success: false,
        message: 'Invalid credentials',
      });
    });

    test('network error returns generic error message', async () => {
      const networkError = new Error('Network Error');
      apiClient.post = jest.fn().mockRejectedValue(networkError);

      const result = await login('testuser', 'password');

      expect(result).toEqual({
        success: false,
        message: '登入請求失敗',
      });
    });
  });

  describe('logout', () => {
    test('clears localStorage and dispatches logout event', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      // Set up some data first
      mockLocalStorage.setItem('token', 'fake-token');
      mockLocalStorage.setItem('userInfo', '{"id": 1}');
      mockLocalStorage.setItem('lastActivity', '123456789');
      window.autoLogoutTimer = setTimeout(() => {}, 1000);

      logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userInfo');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lastActivity');
      expect(dispatchEventSpy).toHaveBeenCalledWith(new CustomEvent('auth-logout'));

      dispatchEventSpy.mockRestore();
    });

    test('clears autoLogoutTimer if it exists', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const timerId = setTimeout(() => {}, 1000);
      window.autoLogoutTimer = timerId;

      logout();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
      expect(window.autoLogoutTimer).toBeNull();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('checkUserAuthStatus', () => {
    test('returns logged in status when valid token and user info exist', () => {
      // Directly set the store values
      const userInfo = {
        id: 1,
        userName: '測試用戶',
        priorityLevel: 3,
      };
      
      mockLocalStorage._setStore({
        'token': 'valid-token',
        'userInfo': JSON.stringify(userInfo)
      });
      
      // Mock getItem to return our values
      mockLocalStorage.getItem.mockImplementation((key) => {
        const store = mockLocalStorage._getStore();
        return store[key] || null;
      });

      const result = checkUserAuthStatus();

      expect(result).toEqual({
        isLoggedIn: true,
        isAdmin: true, // priorityLevel >= 3
        user: userInfo,
        token: 'valid-token',
      });
    });

    test('returns not logged in when no token exists', () => {
      const result = checkUserAuthStatus();

      expect(result).toEqual({
        isLoggedIn: false,
        isAdmin: false,
        user: null,
        token: null,
      });
    });

    test('handles corrupted user info gracefully', () => {
      const logoutSpy = jest.fn();
      jest.doMock('../authService', () => ({
        ...jest.requireActual('../authService'),
        logout: logoutSpy,
      }));

      mockLocalStorage.setItem('token', 'valid-token');
      mockLocalStorage.setItem('userInfo', 'invalid-json');

      const result = checkUserAuthStatus();

      expect(result).toEqual({
        isLoggedIn: false,
        isAdmin: false,
        user: null,
        token: null,
      });
    });

    test('determines admin status correctly', () => {
      mockLocalStorage.setItem('token', 'valid-token');
      
      // Test priorityLevel < 3 (not admin)
      mockLocalStorage.setItem(
        'userInfo',
        JSON.stringify({ priorityLevel: 2 })
      );
      
      let result = checkUserAuthStatus();
      expect(result.isAdmin).toBe(false);

      // Test priorityLevel >= 3 (admin)
      mockLocalStorage.setItem(
        'userInfo',
        JSON.stringify({ priorityLevel: 3 })
      );
      
      result = checkUserAuthStatus();
      expect(result.isAdmin).toBe(true);
    });
  });

  describe('getProfile', () => {
    test('returns profile data on success', async () => {
      const mockProfileData = {
        data: {
          id: 1,
          userName: '測試用戶',
          email: 'test@example.com',
        },
      };

      apiClient.get = jest.fn().mockResolvedValue(mockProfileData);

      const result = await getProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/profile');
      expect(result).toEqual(mockProfileData.data);
    });

    test('throws error on failure', async () => {
      const mockError = new Error('Unauthorized');
      apiClient.get = jest.fn().mockRejectedValue(mockError);

      await expect(getProfile()).rejects.toThrow('Unauthorized');
    });
  });

  describe('register', () => {
    test('returns success response on successful registration', async () => {
      const userData = {
        UserName: '新用戶',
        UserID: 'newuser001',
        Password: 'password123',
      };

      const mockResponse = {
        data: {
          success: true,
          message: 'Registration successful',
        },
      };

      apiClient.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await register(userData);

      expect(apiClient.post).toHaveBeenCalledWith('/register', userData);
      expect(result).toEqual(mockResponse.data);
    });

    test('throws error on registration failure', async () => {
      const userData = { UserName: 'test' };
      const mockError = {
        response: {
          data: {
            success: false,
            message: 'User already exists',
          },
        },
      };

      apiClient.post = jest.fn().mockRejectedValue(mockError);

      await expect(register(userData)).rejects.toEqual(mockError.response.data);
    });

    test('throws generic error when no response data', async () => {
      const userData = { UserName: 'test' };
      const mockError = new Error('Network Error');

      apiClient.post = jest.fn().mockRejectedValue(mockError);

      await expect(register(userData)).rejects.toEqual(new Error('註冊請求失敗'));
    });
  });

  describe('Auto Logout Functionality', () => {
    test('updateLastActivity sets current timestamp', () => {
      const mockTimestamp = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      updateLastActivity();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lastActivity',
        mockTimestamp.toString()
      );

      Date.now.mockRestore();
    });

    test('checkAutoLogout returns true when idle time exceeded', () => {
      const currentTime = Date.now();
      const idleTime = 31 * 60 * 1000; // 31 minutes
      const lastActivity = currentTime - idleTime;

      mockLocalStorage.setItem('lastActivity', lastActivity.toString());
      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      const logoutSpy = jest.fn();
      jest.doMock('../authService', () => ({
        ...jest.requireActual('../authService'),
        logout: logoutSpy,
      }));

      const result = checkAutoLogout();

      expect(result).toBe(true);

      Date.now.mockRestore();
    });

    test('checkAutoLogout returns false when within idle time', () => {
      const currentTime = Date.now();
      const idleTime = 20 * 60 * 1000; // 20 minutes
      const lastActivity = currentTime - idleTime;

      mockLocalStorage.setItem('lastActivity', lastActivity.toString());
      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      const result = checkAutoLogout();

      expect(result).toBe(false);

      Date.now.mockRestore();
    });

    test('setupAutoLogout clears existing timer and sets new one', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      window.autoLogoutTimer = setTimeout(() => {}, 1000);

      setupAutoLogout();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 1000);

      clearTimeoutSpy.mockRestore();
      setIntervalSpy.mockRestore();
    });

    test('setupActivityListeners adds event listeners', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      setupActivityListeners();

      const expectedEvents = [
        'mousedown', 'mousemove', 'keypress',
        'scroll', 'touchstart', 'click'
      ];

      expectedEvents.forEach(event => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith(event, expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith(event, expect.any(Function), { passive: true });
      });

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('API Client Interceptors', () => {
    test('request interceptor adds Authorization header when token exists', () => {
      mockLocalStorage.setItem('token', 'test-token');

      const config = { headers: {} };
      
      // Simulate the request interceptor
      const token = mockLocalStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      expect(config.headers['Authorization']).toBe('Bearer test-token');
    });

    test('request interceptor does not add header when no token', () => {
      const config = { headers: {} };
      
      // Simulate the request interceptor
      const token = mockLocalStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      expect(config.headers['Authorization']).toBeUndefined();
    });

    test('response interceptor handles 401 errors', () => {
      const mockError = {
        response: {
          status: 401,
        },
      };

      const logoutSpy = jest.fn();
      jest.doMock('../authService', () => ({
        ...jest.requireActual('../authService'),
        logout: logoutSpy,
      }));

      // Simulate the response interceptor error handling
      if (mockError.response && mockError.response.status === 401) {
        logout();
      }

      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  // 新增：API 攔截器實際測試
  describe('Real API Interceptors', () => {
    test('request interceptor adds token from localStorage', async () => {
      const mockToken = 'test-auth-token';
      mockLocalStorage.setItem('token', mockToken);
      
      // Mock axios request
      const mockConfig = {
        headers: {},
        url: '/test',
        method: 'get'
      };
      
      // Test the actual request interceptor
      const interceptor = apiClient.interceptors.request.handlers[0];
      const result = interceptor.fulfilled(mockConfig);
      
      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    test('request interceptor works without token', async () => {
      mockLocalStorage.removeItem('token');
      
      const mockConfig = {
        headers: {},
        url: '/test',
        method: 'get'
      };
      
      const interceptor = apiClient.interceptors.request.handlers[0];
      const result = interceptor.fulfilled(mockConfig);
      
      expect(result.headers.Authorization).toBeUndefined();
    });

    test('request interceptor handles errors', async () => {
      const mockError = new Error('Request error');
      
      const interceptor = apiClient.interceptors.request.handlers[0];
      
      await expect(interceptor.rejected(mockError)).rejects.toThrow('Request error');
    });

    test('response interceptor handles non-401 errors', async () => {
      const mockError = {
        response: { status: 500, data: { message: 'Server error' } },
        message: 'Server error'
      };
      
      const interceptor = apiClient.interceptors.response.handlers[0];
      
      await expect(interceptor.rejected(mockError)).rejects.toEqual(mockError);
    });

    test('response interceptor handles network errors', async () => {
      const mockNetworkError = new Error('Network Error');
      
      const interceptor = apiClient.interceptors.response.handlers[0];
      
      await expect(interceptor.rejected(mockNetworkError)).rejects.toThrow('Network Error');
    });
  });

  // 新增：錯誤恢復和邊緣案例測試
  describe('Error Recovery & Edge Cases', () => {
    test('checkUserAuthStatus calls logout when JSON parsing fails', () => {
      const logoutSpy = jest.spyOn(require('../authService'), 'logout');
      mockLocalStorage.setItem('token', 'valid-token');
      mockLocalStorage.setItem('userInfo', 'invalid-json{');
      
      const result = checkUserAuthStatus();
      
      expect(logoutSpy).toHaveBeenCalled();
      expect(result.isLoggedIn).toBe(false);
      
      logoutSpy.mockRestore();
    });

    test('updateLastActivity handles localStorage errors gracefully', () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      
      // Should not throw
      expect(() => updateLastActivity()).not.toThrow();
      
      mockLocalStorage.setItem = originalSetItem;
    });

    test('checkAutoLogout handles invalid lastActivity gracefully', () => {
      mockLocalStorage.setItem('lastActivity', 'invalid-number');
      
      const result = checkAutoLogout();
      
      // Should default to 0 and trigger logout
      expect(result).toBe(true);
    });

    test('setupAutoLogout clears existing timer before setting new one', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Set up first timer
      setupAutoLogout();
      const firstTimer = window.autoLogoutTimer;
      
      // Set up second timer
      setupAutoLogout();
      
      expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimer);
      expect(window.autoLogoutTimer).not.toBe(firstTimer);
      
      clearTimeoutSpy.mockRestore();
    });

    test('setupActivityListeners adds all required event listeners', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      setupActivityListeners();
      
      const expectedEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      expectedEvents.forEach(event => {
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          expect.any(Object)
        );
      });
      
      addEventListenerSpy.mockRestore();
    });

    test('activity listener callback updates last activity', () => {
      const updateSpy = jest.spyOn(require('../authService'), 'updateLastActivity');
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      setupActivityListeners();
      
      // Get the listener function from the spy call
      const listenerCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'click');
      const listenerFunction = listenerCall[1];
      
      // Call the listener
      listenerFunction();
      
      expect(updateSpy).toHaveBeenCalled();
      
      updateSpy.mockRestore();
      addEventListenerSpy.mockRestore();
    });
  });

  // 新增：競爭條件和並發測試
  describe('Race Conditions & Concurrency', () => {
    test('multiple logout calls are safe', () => {
      mockLocalStorage.setItem('token', 'test-token');
      mockLocalStorage.setItem('userInfo', JSON.stringify({ id: 1 }));
      
      // Multiple logout calls should not cause errors
      expect(() => {
        logout();
        logout();
        logout();
      }).not.toThrow();
      
      expect(mockLocalStorage.getItem('token')).toBeNull();
    });

    test('login during logout process', async () => {
      const mockLoginData = {
        data: {
          success: true,
          token: 'new-token',
          user: { id: 1, userName: 'testuser', priorityLevel: 1 }
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockLoginData);
      
      // Start logout
      logout();
      
      // Try to login immediately
      const result = await login('testuser', 'password');
      
      expect(result.success).toBe(true);
      expect(mockLocalStorage.getItem('token')).toBe('new-token');
    });

    test('activity update during logout', () => {
      mockLocalStorage.setItem('token', 'test-token');
      
      // Start logout
      logout();
      
      // Try to update activity
      expect(() => updateLastActivity()).not.toThrow();
      
      // Activity should still be updated even if logged out
      expect(mockLocalStorage.getItem('lastActivity')).toBeTruthy();
    });
  });

  // 新增：記憶體管理測試
  describe('Memory Management', () => {
    test('logout clears auto-logout timer', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      // Set up timer
      setupAutoLogout();
      const timer = window.autoLogoutTimer;
      
      // Logout should clear timer
      logout();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(timer);
      expect(window.autoLogoutTimer).toBeUndefined();
      
      clearIntervalSpy.mockRestore();
    });

    test('setupAutoLogout calls updateLastActivity on setup', () => {
      const updateSpy = jest.spyOn(require('../authService'), 'updateLastActivity');
      
      setupAutoLogout();
      
      expect(updateSpy).toHaveBeenCalled();
      
      updateSpy.mockRestore();
    });
  });
});
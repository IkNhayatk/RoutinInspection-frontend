# RoutinInspection Frontend

![React](https://img.shields.io/badge/React-19.0-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4.svg)
![TypeScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

RoutinInspection-Frontend 是一個現代化的企業級例行巡檢管理系統前端應用程式，採用 React 19 和 Tailwind CSS 開發。提供直觀的使用者介面、完整的巡檢流程管理，以及強大的角色權限控制功能。

## 📋 專案概述

### 🎯 核心價值
- **🚀 效率提升**: 簡化巡檢流程，提高工作效率
- **📊 數據驅動**: 即時數據監控和分析報告
- **👥 協作管理**: 多使用者協作和權限管理
- **📱 響應式設計**: 支援桌面和行動裝置

### 🏗️ 架構特色
- **組件化架構**: 可重用的 UI 組件和業務邏輯分離
- **狀態管理**: React Context API 全域狀態管理
- **路由保護**: 基於角色的路由權限控制
- **主題系統**: 支援深色/淺色模式切換
- **API 整合**: Axios 攔截器統一處理 API 請求

## ✨ 核心功能

### 🔐 身份驗證系統
- **安全登入**: JWT Token 認證機制
- **自動登出**: 30 分鐘閒置自動登出，支援活動監控
- **密碼管理**: 安全密碼變更功能
- **記住登入**: 本地儲存登入狀態
- **Token 刷新**: 自動 Token 驗證與刷新機制

### 👥 使用者管理
- **角色權限**: 三級權限控制 (基本/主管/管理員)
- **部門權限**: 基於部門前3碼的權限控制系統
- **使用者 CRUD**: 完整的使用者增刪改查功能
- **狀態管理**: 工作狀態和線上狀態追蹤
- **批次操作**: 支援批次使用者管理和匯入功能
- **分頁查詢**: 支援分頁、搜尋和篩選功能

### 📊 儀表板與統計
- **數據視覺化**: 巡檢統計和趨勢圖表
- **即時監控**: 系統狀態即時更新
- **快速操作**: 常用功能快速入口
- **個人化面板**: 可自訂的儀表板佈局
- **統計分析**: 按頻率分類的待處理統計（日/月/季/年/2年）
- **部門統計**: 基於部門代號的專屬統計資料
- **視覺化卡片**: 彩色編碼的統計卡片，含百分比顯示

### ✅ 巡檢任務管理
- **動態表單**: JSON Schema 驅動的表單系統
- **任務排程**: 巡檢任務分配和時程管理
- **結果記錄**: 巡檢結果和異常狀況記錄
- **歷史追蹤**: 完整的巡檢歷史記錄
- **巡檢平板**: 專用的平板模式巡檢界面，支援階層式表單顯示
- **表單驗證**: 全面的表單驗證機制，確保資料完整性
- **自動移除**: 成功提交後自動移除已完成的巡檢項目
- **📅 日檢管理**: 每日作業前巡檢路線管理、跳過操作介面
- **✅ 後續追蹤**: 待核簽記錄管理、批量核簽操作界面

### 📝 表單設定
- **表單建構器**: 視覺化表單設計工具
- **欄位類型**: 豐富的表單欄位類型支援
- **驗證規則**: 客戶端和伺服器端驗證
- **範本管理**: 表單範本儲存和重用

### 🔄 路由綁定
- **路線管理**: 巡檢路線和表單關聯
- **動態綁定**: 靈活的路線表單配置
- **批次操作**: 批次路線設定和管理

### 🎨 使用者體驗
- **主題切換**: 深色/淺色主題無縫切換
- **響應式設計**: 適配各種螢幕尺寸
- **載入狀態**: 優雅的載入和錯誤處理
- **無障礙設計**: 符合 WCAG 無障礙標準
- **自適應側邊欄**: 側邊欄高度自適應頁面內容，優化空間使用
- **收合側邊欄**: 支援側邊欄收合/展開，提供更大的工作空間
- **黏性定位**: 側邊欄固定定位，主內容區域獨立滾動

## 🛠 技術架構

### 核心技術棧

| 技術 | 版本 | 用途 | 說明 |
|------|------|------|------|
| React | 19.0.0 | UI 框架 | 最新的 React 版本，支援並發特性 |
| React Router | 7.4.1 | 路由管理 | 客戶端路由和保護路由 |
| Tailwind CSS | 3.x | CSS 框架 | 實用優先的 CSS 框架 |
| Axios | 1.8.4 | HTTP 客戶端 | API 請求和回應攔截 |
| React Icons | 5.5.0 | 圖示庫 | 豐富的圖示組件 |
| React Modal | 3.16.3 | Modal 組件 | 可存取的 Modal 對話框 |
| Immer | 10.1.1 | 不可變狀態 | 簡化狀態更新邏輯 |

### 開發工具

- **建置工具**: Create React App 5.0.1
- **打包工具**: Webpack (透過 react-app-rewired 自訂)
- **測試框架**: Jest + React Testing Library + Playwright
- **E2E 測試**: Playwright 端對端測試框架
- **程式碼品質**: ESLint
- **版本控制**: Git
- **套件管理**: npm
- **瀏覽器兼容**: 支援 crypto 和 Node.js API 的 polyfills

## 🚀 快速開始

### 📋 系統需求

- **Node.js**: 16.0.0+ (推薦 18.x LTS)
- **npm**: 8.0.0+ 或 yarn 1.22.0+
- **瀏覽器**: Chrome 90+, Firefox 88+, Safari 14+
- **記憶體**: 至少 4GB RAM (開發環境)

### ⚙️ 安裝步驟

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd RoutinInspection-frontend
   ```

2. **安裝依賴套件**
   ```bash
   # 使用 npm
   npm install
   
   # 或使用 yarn
   yarn install
   ```

3. **環境變數設定** (可選)
   ```bash
   # 複製環境變數範例檔案
   cp .env.example .env.local
   
   # 編輯環境變數
   nano .env.local
   ```

4. **啟動開發伺服器**
   ```bash
   npm start
   ```

5. **開啟瀏覽器訪問**
   
   應用程式將在 `http://localhost:3000` 自動開啟

6. **後端服務連接**
   
   確保後端 API 服務在 `http://localhost:3001` 運行
   (透過 package.json 中的 proxy 設定自動代理)

### 🔧 環境變數設定

建立 `.env.local` 檔案並設定以下變數：

```env
# 🔧 應用程式配置
REACT_APP_TITLE=例行巡檢系統
REACT_APP_VERSION=1.0.0

# 🐛 開發模式設定
REACT_APP_DEBUG=true
GENERATE_SOURCEMAP=true

# 🎨 主題設定
REACT_APP_DEFAULT_THEME=light

# 📊 分析工具 (可選)
REACT_APP_ANALYTICS_ID=your-analytics-id
```

### 🐳 Docker 開發環境 (可選)

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製原始碼
COPY . .

# 暴露端口
EXPOSE 3000

# 啟動開發伺服器
CMD ["npm", "start"]
```

```bash
# 建置並執行開發容器
docker build -f Dockerfile.dev -t routin-inspection-frontend:dev .
docker run -p 3000:3000 -v $(pwd):/app routin-inspection-frontend:dev
```

## 📁 專案架構

```
RoutinInspection-frontend/
├── public/                     # 🌐 靜態資源
│   ├── index.html             # HTML 入口模板
│   ├── favicon.ico            # 網站圖示
│   ├── logo192.png            # PWA 應用程式圖示
│   ├── logo512.png            # PWA 應用程式圖示
│   ├── manifest.json          # PWA 設定檔
│   └── robots.txt             # 搜尋引擎爬蟲設定
├── src/
│   ├── components/            # 🧩 可重用 UI 元件
│   │   ├── Layout/           # 版面配置元件
│   │   │   └── Sidebar.js    # 側邊欄導航
│   │   ├── ConfirmModal.js   # 確認對話框
│   │   ├── CreateFormModal.js # 表單建立 Modal
│   │   ├── CreateRouteModal.js # 路由建立 Modal
│   │   ├── DailyInspectionModal.js # 日檢管理 Modal
│   │   ├── FollowupManagement.js # 後續追蹤管理元件
│   │   ├── InspectionModal.js # 巡檢記錄 Modal
│   │   ├── LogoutButton.js   # 登出按鈕 (支援活動監控)
│   │   ├── TodoForm.js       # 待辦事項表單
│   │   ├── TodoItem.js       # 待辦事項項目
│   │   ├── UserModal.js      # 使用者 Modal
│   │   ├── ValidationRuleModal.js # 驗證規則 Modal
│   │   └── __tests__/        # 元件測試檔案
│   ├── context/              # 🌍 React Context 全域狀態
│   │   ├── AuthContext.js    # 身份驗證狀態管理
│   │   └── ThemeContext.js   # 主題狀態管理
│   ├── pages/                # 📱 頁面元件
│   │   ├── auth/            # 認證相關頁面
│   │   │   ├── AddUser.js   # 新增使用者頁面
│   │   │   └── LoginForm.js # 登入表單頁面 (改進錯誤處理)
│   │   ├── ApprovalPage.js  # 待核簽記錄頁面
│   │   ├── Dashboard.js     # 儀表板主頁
│   │   ├── FormSettings.js  # 表單設定頁面
│   │   ├── InspectionTablet.js # 巡檢平板界面 (階層式表單顯示)
│   │   ├── InspectionWork.js   # 巡檢作業頁面 (含統計分析、日檢管理)
│   │   ├── LikeTrello.js    # 類 Trello 看板頁面
│   │   ├── RecordsPage.js   # 巡檢記錄查詢頁面
│   │   ├── RouteBinding.js  # 路由綁定頁面
│   │   ├── TodoList.js      # 待辦事項列表
│   │   ├── UserManagement.js # 使用者管理頁面 (支援分頁和權限控制)
│   │   └── __tests__/       # 頁面測試檔案
│   ├── routes/              # 🛣️ 路由配置
│   │   └── AppRoutes.js     # 主要路由設定
│   ├── services/            # 🔌 API 服務層
│   │   ├── authService.js   # 身份驗證 API 服務 (改進 token 處理、巡檢API、統計API)
│   │   ├── dailyInspectionService.js # 日檢管理 API 服務
│   │   ├── followupService.js # 後續追蹤 API 服務
│   │   └── todoService.js   # 待辦事項 API 服務
│   ├── __tests__/           # 🧪 整合測試
│   │   └── RouteBinding.integration.test.js
│   ├── App.js               # 🚀 根元件
│   ├── App.css              # 應用程式樣式
│   ├── index.js             # 應用程式入口點
│   ├── index.css            # 全域樣式 (Tailwind CSS)
│   ├── setupTests.js        # 測試環境設定
│   ├── testUtils.js         # 測試工具函式
│   ├── reportWebVitals.js   # Web Vitals 效能監測
│   └── logo.svg             # React Logo
├── e2e/                      # 🎭 端對端測試
│   ├── auth.spec.js         # 身份驗證 E2E 測試
│   ├── user-management.spec.js # 使用者管理 E2E 測試
│   ├── form-management.spec.js # 表單管理 E2E 測試
│   ├── fixtures/            # 測試資料固定裝置
│   ├── utils/               # E2E 測試工具
│   └── README.md            # E2E 測試說明
├── config-overrides.js       # 📋 Webpack 自訂配置 (修復中間件)
├── playwright.config.js      # 🎭 Playwright 配置
├── postcss.config.js         # 🎨 PostCSS 配置
├── tailwind.config.js        # 🎨 Tailwind CSS 配置
├── package.json              # 📦 專案配置與依賴
├── package-lock.json         # 📦 鎖定的依賴版本
└── README.md                 # 📖 專案說明文件
```

### 🏗️ 架構設計原則

#### 📁 資料夾組織
- **components/**: 可重用的 UI 元件，按功能分類
- **pages/**: 頁面級元件，對應路由
- **context/**: 全域狀態管理
- **services/**: API 呼叫和業務邏輯
- **__tests__/**: 測試檔案與對應元件同目錄

#### 🔄 資料流架構
```
User Interaction → Component → Context/State → Service → API
                ↑                                            ↓
             UI Update ← Context Update ← Response Processing
```

#### 🎯 元件設計模式
- **容器元件**: 處理資料邏輯和狀態管理
- **展示元件**: 純 UI 渲染，接收 props
- **自訂 Hooks**: 封裝可重用的業務邏輯
- **Context Providers**: 全域狀態和跨元件通訊

## 🔧 開發指南

### 📋 可用指令

```bash
# 🚀 開發模式啟動
npm start

# 🧪 執行單元測試
npm test

# 🧪 執行測試 (監視模式)
npm test -- --watchAll

# 🧪 執行測試並產生覆蓋率報告
npm test -- --coverage --watchAll=false

# 🎭 執行 Playwright E2E 測試
npx playwright test

# 🎭 執行 E2E 測試並開啟報告
npx playwright test --ui

# 🎭 Playwright 測試除錯模式
npx playwright test --debug

# 📦 建置生產版本
npm run build

# 🔍 分析打包大小
npm run build && npx serve -s build

# 📊 Bundle 分析 (需要額外安裝 webpack-bundle-analyzer)
npm install --save-dev webpack-bundle-analyzer
npm run build && npx webpack-bundle-analyzer build/static/js/*.js
```

### 📝 程式碼規範

#### 命名慣例
- **元件名稱**: PascalCase (`UserProfile.js`, `CreateFormModal.js`)
- **檔案名稱**: camelCase (`authService.js`, `userManagement.js`)
- **常數**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRY_COUNT`)
- **變數和函式**: camelCase (`getUserData`, `isAuthenticated`)
- **CSS 類別**: kebab-case 或 Tailwind utilities

#### 元件結構
```javascript
// 標準元件結構
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2, children }) => {
  // 1. Hooks
  const [state, setState] = useState(null);
  
  // 2. Effects
  useEffect(() => {
    // 副作用邏輯
  }, []);
  
  // 3. 事件處理函式
  const handleClick = () => {
    // 處理邏輯
  };
  
  // 4. 渲染邏輯
  return (
    <div className="container">
      {children}
    </div>
  );
};

// PropTypes 定義
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  children: PropTypes.node,
};

// 預設值
ComponentName.defaultProps = {
  prop2: 0,
};

export default ComponentName;
```

#### Git 提交規範
遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**提交類型:**
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 程式碼重構
- `test`: 測試相關
- `chore`: 建置過程或輔助工具變動
- `perf`: 效能優化

**範例:**
```bash
feat(auth): implement JWT token refresh mechanism
fix(dashboard): resolve chart rendering issue on mobile devices
docs(readme): update installation instructions
style(components): apply consistent code formatting
refactor(api): extract common axios configuration
test(auth): add unit tests for login validation
chore(deps): update React to version 19.0.0
perf(list): implement virtual scrolling for large datasets
```

### 🗂️ 狀態管理策略

#### Context API 架構
```javascript
// AuthContext.js - 認證狀態管理
import React, { createContext, useContext, useReducer } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
  });

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### 本地狀態管理
- 使用 `useState` 處理簡單的元件狀態
- 使用 `useReducer` 處理複雜的狀態邏輯
- 使用 `useCallback` 和 `useMemo` 優化效能
- 自訂 Hooks 封裝可重用的狀態邏輯

### 🔌 API 整合架構

#### 服務層設計
```javascript
// authService.js - 認證服務
import axios from 'axios';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 回應攔截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// API 服務函式
export const authService = {
  login: (credentials) => apiClient.post('/login', credentials),
  logout: () => apiClient.post('/logout'),
  register: (userData) => apiClient.post('/register', userData),
  getProfile: () => apiClient.get('/profile'),
  changePassword: (passwordData) => apiClient.post('/change_password', passwordData),
};
```

#### 錯誤處理策略
```javascript
// 統一錯誤處理 Hook
import { useState } from 'react';

export const useApiError = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleApiCall = async (apiCall) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || '發生未知錯誤');
      setLoading(false);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return { error, loading, handleApiCall, clearError };
};
```

## 🧪 測試策略

### 測試環境設定
```bash
# 安裝測試依賴 (已包含在 devDependencies 中)
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event @playwright/test

# 安裝 Playwright 瀏覽器
npx playwright install
```

### 測試指令
```bash
# 執行所有單元測試
npm test

# 執行測試並產生覆蓋率報告
npm test -- --coverage --watchAll=false

# 執行特定測試檔案
npm test UserModal.test.js

# 除錯模式執行測試
npm test -- --no-cache --verbose

# 執行 E2E 測試
npx playwright test

# 執行特定 E2E 測試
npx playwright test auth.spec.js

# E2E 測試除錯模式
npx playwright test --debug

# 查看 E2E 測試報告
npx playwright show-report
```

### 測試類型與範例

#### 🔬 單元測試
```javascript
// UserModal.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import UserModal from '../UserModal';

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('UserModal', () => {
  test('renders user modal with correct title', () => {
    renderWithProviders(
      <UserModal isOpen={true} onClose={() => {}} mode="create" />
    );
    
    expect(screen.getByText('新增使用者')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    const mockOnSave = jest.fn();
    
    renderWithProviders(
      <UserModal isOpen={true} onClose={() => {}} onSave={mockOnSave} mode="create" />
    );
    
    fireEvent.click(screen.getByText('確定'));
    
    await waitFor(() => {
      expect(screen.getByText('使用者名稱為必填')).toBeInTheDocument();
    });
  });
});
```

#### 🔗 整合測試
```javascript
// RouteBinding.integration.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RouteBinding from '../../pages/RouteBinding';
import { AuthProvider } from '../../context/AuthContext';

jest.mock('../../services/authService');

describe('RouteBinding Integration', () => {
  test('complete route binding workflow', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RouteBinding />
        </AuthProvider>
      </BrowserRouter>
    );

    // 測試完整的路由綁定流程
    // 1. 載入路由列表
    // 2. 選擇路由
    // 3. 綁定表單
    // 4. 儲存設定
  });
});
```

#### 🎭 端對端測試
```javascript
// auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="user-id-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=歡迎')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="user-id-input"]', 'invalid');
    await page.fill('[data-testid="password-input"]', 'invalid');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('text=登入失敗')).toBeVisible();
  });
});
```

### 測試覆蓋率目標
- **語句覆蓋率**: > 80%
- **分支覆蓋率**: > 75%
- **函式覆蓋率**: > 85%
- **行覆蓋率**: > 80%
- **E2E 測試覆蓋**: 核心用戶流程 100%

## 🚀 生產部署

### 建置最佳化
```bash
# 建置生產版本
npm run build

# 檢查建置結果
ls -la build/

# 本地測試生產版本
npx serve -s build -l 3000
```

### 部署平台選擇

#### 🌐 Netlify 部署
```bash
# 安裝 Netlify CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod --dir=build
```

#### ⚡ Vercel 部署
```bash
# 安裝 Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

#### 🐳 Docker 生產部署
```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --silent

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # 處理 React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 快取靜態資源
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 環境變數生產設定
```env
# .env.production
REACT_APP_TITLE=例行巡檢系統
REACT_APP_VERSION=1.0.0
REACT_APP_DEBUG=false
GENERATE_SOURCEMAP=false
```

## 🔒 安全考量

### 前端安全最佳實踐
- **XSS 防護**: 使用 React 的內建 XSS 保護
- **CSRF 防護**: 實作 CSRF token 驗證
- **內容安全政策**: 設定適當的 CSP headers
- **敏感資料**: 不在前端儲存敏感資訊
- **Token 安全**: JWT token 適當的儲存和管理

### 權限控制
```javascript
// ProtectedRoute.js - 路由權限控制
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredLevel = 1 }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.PriorityLevel < requiredLevel) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

## 🤝 參與貢獻

### 貢獻流程
1. **Fork 專案** 到您的 GitHub 帳戶
2. **建立功能分支**
   ```bash
   git checkout -b feature/user-profile-enhancement
   ```
3. **開發並測試**
   ```bash
   npm test
   npm run build
   ```
4. **提交變更**
   ```bash
   git add .
   git commit -m "feat(profile): add user avatar upload functionality"
   ```
5. **推送分支**
   ```bash
   git push origin feature/user-profile-enhancement
   ```
6. **建立 Pull Request**

### 程式碼審查標準
- 所有測試必須通過
- 程式碼覆蓋率不得降低
- 遵循專案的程式碼風格
- 提供適當的文件和註解
- 無 console.log 或除錯程式碼

### 問題回報
使用 GitHub Issues 回報問題，請包含：
- 問題描述和重現步驟
- 預期行為和實際行為
- 環境資訊 (瀏覽器版本、作業系統等)
- 相關的錯誤訊息或截圖

## 📚 參考資源

### 官方文件
- [React 19 官方文件](https://react.dev/)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
- [React Router 文件](https://reactrouter.com/)
- [Axios 文件](https://axios-http.com/docs/intro)

### 相關工具
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 📄 授權條款

此專案採用 [MIT License](LICENSE) 授權條款。

---

## 📊 專案統計

| 項目 | 數量 | 說明 |
|------|------|------|
| 元件 | 18+ | 可重用 UI 元件 |
| 頁面 | 10+ | 應用程式頁面 |
| 測試 | 25+ | 單元測試和整合測試 |
| 依賴套件 | 16 | 核心依賴套件 |
| 開發依賴 | 4 | 開發和測試工具 |
| API 服務 | 4 | 模組化 API 服務層 |


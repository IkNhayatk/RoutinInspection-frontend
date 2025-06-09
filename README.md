# 例行巡檢系統 - 前端專案

![React](https://img.shields.io/badge/React-18.x-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 📋 專案概述

RoutinInspection-Frontend 是一個現代化的例行巡檢管理系統前端介面，專為企業和組織提供高效的巡檢任務管理解決方案。本系統採用 React 技術棧開發，提供直觀的使用者介面和完整的巡檢流程管理功能。

### 🎯 專案目標

- 提供便捷的巡檢任務建立和管理功能
- 實現巡檢結果的即時追蹤和報告生成
- 支援多使用者角色和權限管理
- 提供響應式設計，支援多種裝置使用

## ✨ 核心功能

### 🔐 身份驗證系統
- 使用者註冊、登入、登出
- JWT Token 驗證機制
- 密碼安全性驗證
- 記住登入狀態

### 👥 使用者管理
- 使用者資料維護
- 角色權限分配
- 使用者狀態管理
- 批次使用者操作

### 📊 儀表板
- 巡檢統計資料視覺化
- 即時系統狀態監控
- 關鍵指標展示
- 快速操作入口

### ✅ 巡檢任務管理
- 建立自訂巡檢項目
- 任務分配和排程
- 巡檢結果記錄
- 異常狀況追蹤

### 📝 表單設定
- 動態表單建構器
- 欄位類型自訂
- 驗證規則設定
- 表單範本管理

### 🎨 使用者體驗
- 淺色/深色主題切換
- 響應式設計適配
- 國際化多語言支援
- 無障礙設計考量

## 🛠 技術架構

### 前端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 18.x | 使用者介面框架 |
| React Router | 6.x | 前端路由管理 |
| Tailwind CSS | 3.x | CSS 框架和樣式系統 |
| Axios | 1.x | HTTP 請求處理 |
| Context API | - | 全域狀態管理 |

### 開發工具

- **建置工具**: Create React App
- **程式碼品質**: ESLint, Prettier
- **版本控制**: Git
- **套件管理**: npm

## 🚀 快速開始

### 系統需求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### 安裝步驟

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd RoutinInspection-frontend
   ```

2. **安裝依賴套件**
   ```bash
   npm install
   ```

3. **環境變數設定**
   ```bash
   # 複製環境變數範例檔案
   cp .env.example .env
   
   # 編輯 .env 檔案，設定必要的環境變數
   nano .env
   ```

4. **啟動開發伺服器**
   ```bash
   npm start
   ```

5. **開啟瀏覽器訪問**
   ```
   http://localhost:3000
   ```

### 環境變數設定

建立 `.env` 檔案並設定以下變數：

```env
# API 後端服務地址
REACT_APP_API_URL=http://localhost:8080/api

# 應用程式標題
REACT_APP_TITLE=例行巡檢系統

# 開發模式設定
REACT_APP_DEBUG=true

# 其他設定
REACT_APP_VERSION=1.0.0
```

## 📁 專案架構

```
RoutinInspection-Frontend/
├── public/                 # 靜態資源
│   ├── index.html         # HTML 模板
│   ├── favicon.ico        # 網站圖示
│   └── manifest.json      # PWA 設定
├── src/
│   ├── assets/            # 靜態資源
│   │   ├── images/        # 圖片資源
│   │   ├── icons/         # 圖示資源
│   │   └── fonts/         # 字型檔案
│   ├── components/        # 可重用元件
│   │   ├── common/        # 通用元件
│   │   ├── forms/         # 表單元件
│   │   └── ui/            # UI 基礎元件
│   ├── contexts/          # React Context
│   │   ├── AuthContext.js # 身份驗證狀態
│   │   └── ThemeContext.js# 主題狀態
│   ├── hooks/             # 自訂 Hooks
│   │   ├── useAuth.js     # 身份驗證 Hook
│   │   └── useApi.js      # API 請求 Hook
│   ├── layouts/           # 頁面佈局
│   │   ├── MainLayout.js  # 主要佈局
│   │   └── AuthLayout.js  # 驗證頁面佈局
│   ├── pages/             # 頁面元件
│   │   ├── Dashboard/     # 儀表板
│   │   ├── Auth/          # 身份驗證
│   │   ├── Users/         # 使用者管理
│   │   ├── Inspections/   # 巡檢管理
│   │   └── Settings/      # 系統設定
│   ├── routes/            # 路由設定
│   │   ├── AppRoutes.js   # 路由配置
│   │   └── ProtectedRoute.js # 受保護路由
│   ├── services/          # API 服務
│   │   ├── authService.js # 身份驗證服務
│   │   ├── userService.js # 使用者服務
│   │   └── apiClient.js   # API 客戶端
│   ├── styles/            # 樣式檔案
│   │   ├── globals.css    # 全域樣式
│   │   └── components.css # 元件樣式
│   ├── utils/             # 工具函式
│   │   ├── constants.js   # 常數定義
│   │   ├── helpers.js     # 輔助函式
│   │   └── validators.js  # 驗證函式
│   ├── App.js             # 根元件
│   ├── index.js           # 應用程式入口
│   └── reportWebVitals.js # 效能監測
├── .env.example           # 環境變數範例
├── .gitignore             # Git 忽略檔案
├── package.json           # 專案設定
├── tailwind.config.js     # Tailwind 設定
└── README.md              # 專案說明
```

## 🔧 開發指南

### 可用指令

```bash
# 開發模式啟動
npm start

# 執行測試
npm test

# 建置生產版本
npm run build

# 程式碼品質檢查
npm run lint

# 程式碼格式化
npm run format

# 分析打包大小
npm run analyze
```

### 程式碼規範

#### 命名慣例
- **元件名稱**: PascalCase (例: `UserProfile.js`)
- **檔案名稱**: camelCase (例: `userService.js`)
- **常數**: UPPER_SNAKE_CASE (例: `API_BASE_URL`)
- **變數和函式**: camelCase (例: `getUserData`)

#### 檔案結構
- 每個元件放在獨立資料夾中
- 包含 `index.js` 作為入口檔案
- 相關樣式和測試檔案放在同一資料夾

#### Git 提交規範
使用 Conventional Commits 格式：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**類型 (type):**
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 程式碼重構
- `test`: 測試相關
- `chore`: 建置過程或輔助工具變動

**範例:**
```
feat(auth): add password reset functionality
fix(dashboard): resolve chart rendering issue
docs: update installation guide
```

### 狀態管理策略

#### Context API 使用
- **AuthContext**: 管理使用者身份驗證狀態
- **ThemeContext**: 管理應用程式主題設定
- **AppContext**: 管理全域應用程式狀態

#### Local State 管理
- 使用 `useState` 處理元件內部狀態
- 使用 `useReducer` 處理複雜的狀態邏輯
- 自訂 Hooks 封裝可重用的狀態邏輯

### API 整合指南

#### 服務層架構
```javascript
// apiClient.js - API 客戶端設定
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 處理未授權狀況
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 錯誤處理
- 統一的錯誤處理機制
- 使用者友善的錯誤訊息
- 錯誤日誌記錄

## 🧪 測試策略

### 測試類型
- **單元測試**: 使用 Jest 和 React Testing Library
- **整合測試**: 測試元件間的互動
- **端對端測試**: 使用 Cypress 測試完整流程

### 測試指令
```bash
# 執行所有測試
npm test

# 執行測試並產生覆蓋率報告
npm run test:coverage

# 執行 E2E 測試
npm run test:e2e
```

## 🚀 部署指南

### 建置生產版本
```bash
npm run build
```

### 部署平台
推薦的部署平台：
- **Netlify**: 簡單的靜態網站部署
- **Vercel**: 現代 Web 應用程式平台
- **AWS S3 + CloudFront**: 企業級部署方案
- **Firebase Hosting**: Google 雲端平台

### Docker 部署
```dockerfile
# Dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 參與貢獻

我們歡迎社群的貢獻！請遵循以下步驟：

### 貢獻流程
1. **Fork 專案** 到您的 GitHub 帳戶
2. **建立功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **提交變更**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **推送分支**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **建立 Pull Request**

### 開發環境設定
1. 確保通過所有測試
2. 遵循程式碼規範
3. 更新相關文件
4. 添加適當的測試案例

### 報告問題
使用 GitHub Issues 回報：
- Bug 報告
- 功能請求
- 文件改進建議

## 📚 相關資源

### 官方文件
- [React 官方文件](https://reactjs.org/docs/)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
- [React Router 文件](https://reactrouter.com/)


本專案採用 [MIT License](LICENSE) 授權條款。


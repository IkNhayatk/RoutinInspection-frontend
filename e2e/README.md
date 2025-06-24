# E2E Testing with Playwright

本專案使用 Playwright 進行端到端測試，涵蓋使用者認證、表單管理和使用者管理等核心功能。

## 快速開始

### 安裝依賴
```bash
cd RoutinInspection-frontend
npm install
```

### 安裝 Playwright 瀏覽器
```bash
npx playwright install
# 或只安裝 Chromium
npx playwright install chromium
```

### 執行測試

```bash
# 執行所有 E2E 測試
npm run test:e2e

# 以有界面模式執行測試
npm run test:e2e:headed

# 使用 Playwright UI 模式
npm run test:e2e:ui

# 除錯模式
npm run test:e2e:debug

# 查看測試報告
npm run test:e2e:report

# 錄製新測試
npm run test:e2e:codegen
```

## 測試結構

```
e2e/
├── fixtures/           # 測試數據和固定裝置
│   └── test-users.js   # 測試用戶數據
├── utils/              # 測試工具函數
│   └── auth-helpers.js # 認證相關輔助函數
├── auth.spec.js        # 認證流程測試
├── user-management.spec.js  # 使用者管理測試
├── form-management.spec.js  # 表單管理測試
└── README.md          # 此文檔
```

## 測試用例

### 認證測試 (auth.spec.js)
- ✅ 顯示登入表單
- ✅ 有效憑證登入
- ✅ 無效憑證錯誤處理
- ✅ 登出功能
- ✅ 受保護路由重導向
- ✅ 會話持久性
- ✅ 會話過期處理

### 使用者管理測試 (user-management.spec.js)
- ✅ 顯示使用者管理頁面
- ✅ 新增使用者模態框
- ✅ 創建新使用者
- ✅ 編輯現有使用者
- ✅ 刪除使用者
- ✅ 部門篩選
- ✅ 使用者名稱搜尋

### 表單管理測試 (form-management.spec.js)
- ✅ 顯示表單設定頁面
- ✅ 開啟創建表單模態框
- ✅ 創建新表單
- ✅ 表單欄位驗證
- ✅ 編輯現有表單
- ✅ 刪除表單
- ✅ 新增驗證規則

## 配置說明

### playwright.config.js 主要配置
- **基礎 URL**: `http://localhost:3000`
- **測試目錄**: `./e2e`
- **瀏覽器支援**: Chromium, Firefox, WebKit, Mobile
- **自動啟動**: Frontend (port 3000) 和 Backend (port 3001)
- **報告格式**: HTML, JSON, JUnit

### 測試數據
測試使用預定義的使用者數據，位於 `fixtures/test-users.js`:
- **admin**: 管理員權限 (Priority Level 3)
- **supervisor**: 監督員權限 (Priority Level 2)  
- **user**: 一般使用者權限 (Priority Level 1)

## 最佳實踐

### 1. 使用 data-testid 屬性
```html
<button data-testid="login-button">登入</button>
```

### 2. 使用輔助函數
```javascript
import { login, logout } from './utils/auth-helpers.js';
await login(page, testUsers.admin);
```

### 3. 等待元素載入
```javascript
await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
```

### 4. 處理異步操作
```javascript
await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
```

## CI/CD 整合

專案包含 GitHub Actions 工作流程：
- `.github/workflows/playwright.yml`: 完整的端到端測試流程
- `.github/workflows/e2e-tests.yml`: 簡化的前端測試流程

測試會在以下情況下自動執行：
- Push 到 main 或 develop 分支
- 針對 main 或 develop 分支的 Pull Request
- 前端或後端代碼變更

## 故障排除

### 常見問題

1. **瀏覽器未安裝**
   ```bash
   npx playwright install
   ```

2. **後端服務未啟動**
   確保 Backend 在 port 3001 上運行
   ```bash
   cd RoutinInspection-backend
   python app.py
   ```

3. **前端服務未啟動**
   確保 Frontend 在 port 3000 上運行
   ```bash
   cd RoutinInspection-frontend
   npm start
   ```

4. **測試超時**
   增加 timeout 設定或檢查網路連線

5. **元素未找到**
   確保 DOM 元素有正確的 `data-testid` 屬性

### Debug 模式
使用 debug 模式逐步執行測試：
```bash
npm run test:e2e:debug
```

### 查看測試報告
執行測試後查看詳細報告：
```bash
npm run test:e2e:report
```

## 擴展測試

### 新增測試文件
1. 在 `e2e/` 目錄下創建 `.spec.js` 文件
2. 使用現有的 fixtures 和 utils
3. 遵循現有的測試模式

### 新增測試輔助函數
在 `utils/` 目錄下新增輔助函數，方便在多個測試中重複使用。

### 新增測試數據
在 `fixtures/` 目錄下新增測試數據，保持測試的一致性和可維護性。
# RoutinInspection-Frontend

## 專案簡介

RoutinInspection-Frontend 是「例行巡檢」應用程式的前端介面。此專案使用 React 建置，並整合了使用者身份驗證、使用者管理、儀表板、待辦事項列表、表單設定以及路由綁定等功能。前端透過 API 與後端服務進行通訊，以實現完整的應用程式流程。

## 主要功能

* **使用者身份驗證：** 包含使用者登入、註冊 及登出功能。
* **儀表板：** 提供系統概覽或核心資訊的展示頁面。
* **使用者管理：** 允許管理員進行使用者相關操作。
* **待辦事項管理 (Todo List)：** 提供新增、檢視、編輯和刪除待辦事項的功能。
* **表單設定：** 允許動態設定或管理表單結構。
* **路由綁定：** 管理應用程式內的路由配置。
* **主題切換：** 支援淺色與深色主題模式切換。

## 技術棧

* **React：** 用於建構使用者介面的 JavaScript 函式庫。
* **Tailwind CSS：** 一個實用優先的 CSS 框架，用於快速設計使用者介面。
* **React Router：** 用於處理前端路由。
* **Axios：** 用於發送 HTTP 請求與後端 API 互動 (透過 `src/services/authService.js` 中的 `apiClient` 實作)。
* **Context API：** 用於全域狀態管理 (例如：身份驗證狀態、主題狀態)。

## 開始使用

### 前置準備

* 確認已安裝 Node.js (建議使用 LTS 版本)
* 確認已安裝 npm (通常隨 Node.js 一併安裝) 或 yarn

### 安裝依賴

在專案根目錄下執行：
```bash
npm install
# 或
# yarn install
```

### 啟動開發伺服器

```bash
npm start
# 或
# yarn start
```
這會在開發模式下執行應用程式。
開啟 [http://localhost:3000](http://localhost:3000) 在瀏覽器中檢視。

頁面會在您進行編輯時自動重新載入。
您也會在主控台中看到任何 lint 錯誤。

## 專案結構

```
RoutinInspection-Frontend/
├── public/             # 靜態資源，如 index.html, favicon.ico
├── src/
│   ├── assets/         # 圖片、字型等資源
│   ├── components/     # 可重用的 UI 元件
│   ├── contexts/       # React Context API 相關檔案 (例如：AuthContext, ThemeContext)
│   ├── hooks/          # 自訂 React Hooks
│   ├── layouts/        # 頁面佈局元件
│   ├── pages/          # 頁面級元件
│   ├── routes/         # 路由設定相關檔案
│   ├── services/       # API 請求及其他服務 (例如：authService.js)
│   ├── styles/         # 全域樣式或樣式相關工具
│   ├── utils/          # 工具函式
│   ├── App.js          # 應用程式根元件
│   ├── index.js        # 應用程式進入點
│   └── reportWebVitals.js # 效能監測
├── .env.example        # 環境變數範例檔案
├── .gitignore          # Git 忽略檔案設定
├── package.json        # 專案依賴及腳本設定
├── tailwind.config.js  # Tailwind CSS 設定檔
└── README.md           # 專案說明文件
```

## 可用腳本

在專案目錄中，您可以執行：

*   `npm start` 或 `yarn start`：在開發模式下執行應用程式。
*   `npm test` 或 `yarn test`：啟動測試執行器。
*   `npm run build` 或 `yarn build`：將應用程式建置到 `build` 資料夾以進行生產部署。
*   `npm run eject` 或 `yarn eject`：如果您對建置工具和設定選擇不滿意，可以隨時 `eject`。此命令將從您的專案中移除單一建置依賴。

## 環境變數

專案可能需要設定環境變數以進行本地開發或部署。您可以複製 `.env.example` 檔案並將其重新命名為 `.env` (或 `.env.local`, `.env.development`, `.env.production`)，然後在其中設定必要的變數。

例如：
```
REACT_APP_API_URL=http://localhost:8080/api
```
`REACT_APP_API_URL`：後端 API 的基礎 URL。

**重要：** `.env` 檔案不應提交到版本控制系統中，以保護敏感資訊。`.gitignore` 檔案已預設包含 `.env`。

## API 整合

專案使用 `axios` 來處理 HTTP 請求。在 `src/services/` 目錄下，您會找到與後端 API 互動的服務檔案。例如，`src/services/authService.js` 中的 `apiClient` 是一個預先設定好的 `axios` 實例，可能包含了基礎 URL、標頭設定 (如 `Authorization` token) 以及錯誤處理邏輯。

## 狀態管理

本專案主要使用 React Context API 進行全域狀態管理。相關的 Context 檔案位於 `src/contexts/` 目錄下。
*   **AuthContext：** 管理使用者身份驗證狀態，例如使用者資訊、登入/登出狀態。
*   **ThemeContext：** 管理應用程式的主題狀態 (淺色/深色模式)。

對於元件級別的狀態，則使用 React 內建的 `useState` 和 `useReducer` Hooks。

## 樣式

專案採用 **Tailwind CSS** 作為主要的 CSS 框架。Tailwind CSS 是一個實用優先的框架，允許您直接在 HTML (JSX) 中快速建構自訂設計，而無需離開您的 HTML。
設定檔 `tailwind.config.js` 位於專案根目錄，您可以在此處自訂主題、擴充功能等。
全域樣式或基礎樣式可以放在 `src/styles/` 目錄下。

## 部署

要部署此應用程式，首先需要執行 `npm run build` (或 `yarn build`) 命令。此命令會在專案根目錄下建立一個 `build` 資料夾，其中包含所有靜態資源。

您可以將 `build` 資料夾的內容部署到任何支援靜態網站託管的平台，例如：
*   Netlify
*   Vercel
*   GitHub Pages
*   AWS S3
*   Firebase Hosting

確保您的託管服務已正確設定以處理單頁應用程式 (SPA) 的路由。通常這意味著將所有路由請求都導向到 `index.html`。

## 貢獻

歡迎對此專案做出貢獻！如果您想參與，請遵循以下步驟：
1.  Fork 此儲存庫。
2.  建立您的功能分支 (`git checkout -b feature/AmazingFeature`)。
3.  提交您的變更 (`git commit -m 'Add some AmazingFeature'`)。
4.  將您的分支推送到遠端 (`git push origin feature/AmazingFeature`)。
5.  開啟一個 Pull Request。

請確保您的程式碼遵循專案的編碼風格和標準。

## 授權條款

此專案採用 [MIT](LICENSE) 授權條款。
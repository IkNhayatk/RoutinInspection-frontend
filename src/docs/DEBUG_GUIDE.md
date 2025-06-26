# React 19 captureOwnerStack 調試指南

## 🎯 概述

本專案已整合 React 19 的 `captureOwnerStack` 功能，為開發和測試環境提供增強的調試能力。這個功能可以捕獲 React 組件的「擁有者堆疊」，幫助開發者更好地理解組件層次結構和錯誤源頭。

## 🔧 已實現的功能

### 1. 增強的測試工具 (`testUtils.js`)

- **TestErrorBoundary**: 自動捕獲渲染錯誤並記錄 Owner Stack
- **renderWithRouter**: 支援錯誤邊界和調試選項
- **renderWithDebug**: 專為調試設計的渲染函數
- **debugOwnerStack**: 手動捕獲和顯示 Owner Stack 的工具函數
- **captureTestError**: 增強的錯誤捕獲函數

### 2. 全域錯誤報告系統 (`errorReporting.js`)

- **setupEnhancedErrorReporting**: 全域 console.error 攔截器
- **EnhancedErrorBoundary**: 生產級錯誤邊界組件
- **useOwnerStackDebug**: React Hook 用於組件調試

## 📋 使用範例

### 在測試中使用

```javascript
import { renderWithRouter, debugOwnerStack, captureTestError } from '../testUtils';

test('demonstrates owner stack debugging', async () => {
  const TestComponent = () => {
    React.useEffect(() => {
      // ✅ 在 React 控制的函數中可用
      debugOwnerStack('TestComponent useEffect');
    }, []);
    
    const handleClick = () => {
      // ✅ 在 React 事件處理器中也可用
      debugOwnerStack('Button click handler');
    };
    
    return <button onClick={handleClick}>Test</button>;
  };

  // 使用增強的渲染器
  renderWithRouter(<TestComponent />, undefined, {
    enableErrorBoundary: true,
    testName: 'Debug Test'
  });

  await waitFor(() => {
    // ❌ 在測試的 waitFor 中不可用（非 React 渲染週期）
    debugOwnerStack('Outside React cycle - no stack');
  });
});
```

### 在組件中使用

```javascript
import { useOwnerStackDebug } from '../utils/errorReporting';

function MyComponent() {
  // 自動在組件渲染時記錄 Owner Stack
  useOwnerStackDebug('MyComponent');
  
  React.useEffect(() => {
    try {
      // 一些可能出錯的操作
      riskyOperation();
    } catch (error) {
      captureTestError(error, 'MyComponent');
    }
  }, []);
  
  return <div>My Component</div>;
}
```

### 設置全域錯誤報告

```javascript
// 在 App.js 或 index.js 中
import { setupEnhancedErrorReporting } from './utils/errorReporting';

if (process.env.NODE_ENV !== 'production') {
  setupEnhancedErrorReporting();
}
```

## ⚡ 測試結果展示

從我們的測試中可以看到：

```
🔍 SimpleComponent useEffect - Owner Stack: 
    at SimpleComponent (<anonymous>)

🔍 After render in test (no stack expected) - No Owner Stack available (outside React render cycle)

🔍 Before throwing test error - Owner Stack: 
    at ErrorComponent (<anonymous>)

Test Error in ErrorComponent: {
  error: 'Intentional test error for demonstration',
  ownerStack: '\n    at ErrorComponent (<anonymous>)',
  timestamp: '2025-06-26T07:48:12.796Z'
}

🔍 During TestComponent useEffect - Owner Stack: 
    at TestComponent (<anonymous>)

🔍 Inside click handler - Owner Stack: 
    at button (<anonymous>)
    at TestComponent (/path/to/TestComponent.js:112:9)
```

## 📍 可用時機

### ✅ Owner Stack 可用的場景
- 組件渲染期間
- `useEffect`、`useLayoutEffect` 等 Effects
- React 事件處理器 (`onClick`、`onChange` 等)
- React 錯誤處理器 (Error Boundaries)

### ❌ Owner Stack 不可用的場景
- `setTimeout`、`setInterval` 回調
- Promise 的 `.then()`、`.catch()` 回調
- 自定義 DOM 事件處理器
- 測試框架的 `waitFor`、`act` 等函數內部

## 🛠️ 最佳實踐

1. **條件性使用**: 始終檢查開發環境
   ```javascript
   if (process.env.NODE_ENV !== 'production') {
     const ownerStack = React.captureOwnerStack?.();
   }
   ```

2. **命名空間導入**: 避免在生產代碼中直接導入
   ```javascript
   import * as React from 'react';
   // 而不是 import { captureOwnerStack } from 'react';
   ```

3. **錯誤報告整合**: 將 Owner Stack 發送到錯誤報告服務
   ```javascript
   Sentry.captureException(error, {
     extra: { ownerStack }
   });
   ```

4. **測試中的應用**: 用於調試複雜的組件層次結構
   ```javascript
   renderWithRouter(<ComplexComponent />, undefined, {
     enableErrorBoundary: true,
     testName: 'Complex Component Debug'
   });
   ```

## 🔄 與現有系統整合

- **測試框架**: 已整合到 `testUtils.js`，所有測試都可以使用
- **錯誤邊界**: 自動在錯誤發生時捕獲 Owner Stack
- **開發工具**: 可以與 React DevTools 配合使用
- **錯誤服務**: 準備好與 Sentry、LogRocket 等服務整合

## 📊 效益

1. **更好的錯誤診斷**: 快速定位錯誤發生的組件層次
2. **測試調試**: 幫助理解測試失敗時的組件狀態
3. **開發體驗**: 提供更豐富的調試信息
4. **生產錯誤追蹤**: 為生產環境錯誤提供更多上下文

## 🚨 注意事項

- 僅在開發環境中可用
- 不會影響生產性能
- 需要 React 19+
- 必須在 React 渲染週期內調用

---

這個增強的調試系統為 RoutinInspection 專案提供了強大的錯誤診斷和開發調試能力，特別是在複雜的組件層次結構中非常有用。
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';

function InspectionModal({ isOpen, onClose, record, onApprove, viewMode = false }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !record) return null;

  const handleApprove = async () => {
    if (!user || !user.id) {
      alert('無法獲取用戶信息，請重新登入');
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove(record, comment, user.id);
      setComment('');
      onClose();
    } catch (error) {
      console.error('核簽失敗:', error);
      alert('核簽失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };

  // 解析表單結構，建立分組的檢查項目結構
  const buildGroupedItemsFromSchema = (elements) => {
    const groupedItems = [];
    
    if (!Array.isArray(elements)) {
      return groupedItems;
    }
    
    const processElement = (element, mainCategoryIndex, mainCategoryName, parentName = null) => {
      if (element.ElmentType === "Item" && element.ItemId) {
        return {
          itemId: element.ItemId,
          name: parentName || element.Name || `檢查項目 ${element.ItemId}`,
          description: element.Description || ''
        };
      } else if (element.ElmentType === "Div" && element.Elements) {
        // 如果是包含單個Item的Div，返回該Item的信息
        if (element.Elements.length === 1 && element.Elements[0].ElmentType === "Item") {
          return processElement(element.Elements[0], mainCategoryIndex, mainCategoryName, element.Name);
        } else {
          // 遞歸處理子元素，返回所有子項目
          return element.Elements
            .map(child => processElement(child, mainCategoryIndex, mainCategoryName, parentName))
            .filter(Boolean)
            .flat();
        }
      }
      return null;
    };
    
    // 第一層元素作為主分類
    elements.forEach((element, index) => {
      const mainCategoryIndex = index + 1;
      const mainCategoryName = element.Name;
      
      if (element.ElmentType === "Div" && element.Elements) {
        const categoryItems = element.Elements
          .map(child => processElement(child, mainCategoryIndex, mainCategoryName))
          .filter(Boolean)
          .flat();
        
        groupedItems.push({
          categoryIndex: mainCategoryIndex,
          categoryName: mainCategoryName,
          items: categoryItems
        });
      }
    });
    
    return groupedItems;
  };

  // 判斷是否為每日巡檢表
  const isDailyInspection = () => {
    const displayName = record.DisplayName || '';
    return displayName.includes('每日') || displayName.includes('日');
  };

  const isDaily = isDailyInspection();

  // 獲取分組的檢查項目
  const getGroupedInspectionItems = () => {
    let groupedItems = [];
    
    // 嘗試從 record.FormJson 中解析分組結構
    const formJson = record.FormJson;
    if (formJson && formJson.Elements) {
      groupedItems = buildGroupedItemsFromSchema(formJson.Elements);
    }
    
    // 為每個項目添加實際的檢查結果
    groupedItems.forEach(category => {
      category.items.forEach(item => {
        const itemKey = `Item${item.itemId}`;
        const remarkKey = `Item${item.itemId}_Remark`;
        
        item.value = record[itemKey] || '未填寫';
        // 處理 Remark，確保只有非空值才保留
        const remarkValue = record[remarkKey];
        item.remark = (remarkValue && remarkValue.trim() !== '') ? remarkValue.trim() : '';
        item.isNormal = item.value === '正常';
        
        // 為非每日表單的異常項目添加改善措施相關字段
        if (!isDaily && !item.isNormal) {
          const improvementKey = `Item${item.itemId}_Improvement`;
          const plannedDateKey = `Item${item.itemId}_PlannedDate`;
          const actualDateKey = `Item${item.itemId}_ActualDate`;
          
          item.improvementAction = record[improvementKey] || '';
          item.plannedDate = record[plannedDateKey] || '';
          item.actualDate = record[actualDateKey] || '';
        }
      });
    });
    
    return groupedItems;
  };

  const groupedInspectionItems = getGroupedInspectionItems();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-blue-600 dark:bg-blue-700 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {viewMode ? '巡檢記錄詳情' : '巡檢內容詳情'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* 基本信息 */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">基本信息</h3>
            
            {/* 表單名稱 - 獨立一行 */}
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-blue-500">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">表單名稱：</span>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100 ml-2">
                {record.DisplayName || record.TableName || '未知表單'}
              </span>
            </div>
            
            {/* 其他信息 - 網格佈局 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">路線名稱：</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {record.RouteName || `路線${record.RouteId || '未知'}`}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">巡檢人員：</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {record.UserName || '未知'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">巡檢時間：</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {record.CheckDate ? new Date(record.CheckDate).toLocaleString() : '未知'}
                </span>
              </div>
              {record.ReviewerName && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">核簽主管：</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {record.ReviewerName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 檢查項目 - 分組顯示 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">檢查項目</h3>
            <div className="space-y-6">
              {groupedInspectionItems.map((category) => (
                <div key={category.categoryIndex} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                  {/* 主分類標題 */}
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold mr-3">
                      {category.categoryIndex}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {category.categoryName}
                    </h4>
                    <div className="ml-auto">
                      <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {category.items.length} 項目
                      </span>
                    </div>
                  </div>
                  
                  {/* 檢查項目列表 */}
                  <div className="grid gap-3">
                    {category.items.map((item) => (
                      <div
                        key={item.itemId}
                        className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                          item.isNormal
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 mr-3">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {item.name}
                            </span>
                            {item.description && (
                              <div className="text-l text-gray-500 dark:text-gray-400 mt-1">
                                檢查方法：{item.description}
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${
                              item.isNormal
                                ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {item.value}
                          </span>
                        </div>
                        {item.remark && item.remark.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-blue-300 dark:border-blue-600">
                            <span className="font-medium">備註：</span>
                            {item.remark}
                          </div>
                        )}
                        
                        {/* 非每日表單的異常項目顯示改善措施輸入框 */}
                        {!isDaily && !item.isNormal && (
                          <div className="mt-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <h5 className="text-l font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              改善措施
                            </h5>
                            <div className="space-y-3">
                              {/* 改善措施內容 */}
                              <div>
                                <label className="block text-l font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  依檢查結果應採取改善措施內容
                                </label>
                                {viewMode ? (
                                  <div className="text-l text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded border">
                                    {item.improvementAction || '未填寫'}
                                  </div>
                                ) : (
                                  <textarea
                                    rows={2}
                                    className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="請描述具體的改善措施..."
                                    value={item.improvementAction || ''}
                                    readOnly={viewMode}
                                  />
                                )}
                              </div>
                              
                              {/* 預定完成日期和實際完成日期 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-l font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    預定完成日期
                                  </label>
                                  {viewMode ? (
                                    <div className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded border">
                                      {item.plannedDate || '未設定'}
                                    </div>
                                  ) : (
                                    <input
                                      type="date"
                                      className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                                      value={item.plannedDate || ''}
                                      readOnly={viewMode}
                                    />
                                  )}
                                </div>
                                
                                <div>
                                  <label className="block text-l font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    實際完成日期
                                  </label>
                                  {viewMode ? (
                                    <div className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded border">
                                      {item.actualDate || '未完成'}
                                    </div>
                                  ) : (
                                    <input
                                      type="date"
                                      className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                                      value={item.actualDate || ''}
                                      readOnly={viewMode}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 核簽意見 - 僅在非查看模式下顯示 */}
          {!viewMode && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                核簽意見
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="請輸入核簽意見（選填）"
              />
            </div>
          )}

          {/* 顯示已有的核簽意見 - 僅在查看模式且有核簽意見時顯示 */}
          {viewMode && record?.ReviewerComment && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">核簽意見</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {record.ReviewerComment}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            關閉
          </button>
          {!viewMode && (
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <span>{isSubmitting ? '核簽中...' : '核簽'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InspectionModal;
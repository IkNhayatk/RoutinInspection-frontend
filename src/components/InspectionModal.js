import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import DailyInspectionTable from './DailyInspectionTable.js';
import { updateImprovementData as apiUpdateImprovementData } from '../services/authService.js';

function InspectionModal({ isOpen, onClose, record, onApprove, viewMode = false, monthlyData = null, displayFormat = 'normal' }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [improvementData, setImprovementData] = useState({});

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
    setImprovementData({});
    onClose();
  };

  // 更新改善措施資料
  const updateImprovementData = (itemId, field, value) => {
    setImprovementData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  // 保存改善措施資料
  const saveImprovementData = async () => {
    if (!record || Object.keys(improvementData).length === 0) {
      alert('沒有改善措施資料需要保存');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updateData = {
        table_name: record.TableName,
        record_id: getRecordId(record),
        improvement_data: improvementData
      };

      await apiUpdateImprovementData(updateData);
      alert('改善措施保存成功！');
      setImprovementData({});
    } catch (error) {
      console.error('保存改善措施失敗:', error);
      alert('保存改善措施失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 獲取記錄ID的輔助函數
  const getRecordId = (record) => {
    const availableFields = Object.keys(record);
    const tableName = record.TableName.trim();
    
    let recordId = null;
    
    // 先嘗試查找正確的欄位名稱格式
    const expectedIdField = `${tableName}Id`;
    const actualIdField = `user_${tableName}Id`;
    
    // 按優先順序查找 ID 欄位
    const possibleIdFields = [
      expectedIdField,
      actualIdField,
      `user_${expectedIdField}`
    ];
    
    for (const fieldName of possibleIdFields) {
      if (record[fieldName] !== undefined && record[fieldName] !== null) {
        recordId = record[fieldName];
        break;
      }
    }
    
    // 如果還是找不到，使用通用查找
    if (recordId === null) {
      for (const fieldName of availableFields) {
        const fieldNameLower = fieldName.toLowerCase().replace(/\s+/g, '');
        const tableNameLower = tableName.toLowerCase().replace(/\s+/g, '');
        
        if (fieldNameLower.includes(tableNameLower) && fieldNameLower.includes('id')) {
          recordId = record[fieldName];
          break;
        }
      }
    }
    
    return recordId;
  };

  // 備用方法：從 record 的 Item 字段中推導檢查項目
  const buildGroupedItemsFromItemFields = (record) => {
    const groupedItems = [];
    const items = [];
    
    // 查找所有的 Item 字段
    const itemFields = Object.keys(record).filter(key => 
      key.startsWith('Item') && 
      key.match(/^Item\d+$/) && 
      !key.endsWith('_Remark')
    );
    
    // 為每個 Item 字段創建檢查項目
    itemFields.forEach(itemKey => {
      const itemId = itemKey.replace('Item', '');
      const itemName = `檢查項目 ${itemId}`;
      
      items.push({
        itemId: parseInt(itemId),
        name: itemName,
        description: '' // 沒有描述信息可用
      });
    });
    
    // 如果有項目，將它們放入一個默認分組
    if (items.length > 0) {
      groupedItems.push({
        categoryIndex: 1,
        categoryName: '檢查項目',
        items: items.sort((a, b) => a.itemId - b.itemId) // 按ID排序
      });
    }
    
    return groupedItems;
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
        // 如果是包含單個Item的Div，使用Div的Name作為項目名稱，Item的Description作為描述
        if (element.Elements.length === 1 && element.Elements[0].ElmentType === "Item") {
          const item = element.Elements[0];
          return {
            itemId: item.ItemId,
            name: element.Name || `檢查項目 ${item.ItemId}`, // 使用Div的名稱，不是Item的名稱
            description: item.Description || ''
          };
        } else {
          // 遞歸處理子元素，返回所有子項目
          return element.Elements
            .map(child => processElement(child, mainCategoryIndex, mainCategoryName, element.Name))
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
    } else {
      // 備用方法：從 record 的 Item 字段中推導檢查項目
      groupedItems = buildGroupedItemsFromItemFields(record);
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
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-h-[95vh] overflow-hidden ${
        displayFormat === 'daily' ? 'max-w-[98vw]' : 'max-w-4xl'
      }`}>
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
        <div className={`${displayFormat === 'daily' ? 'p-2 overflow-x-auto' : 'p-6 overflow-y-auto max-h-[60vh]'}`}>
          {displayFormat === 'daily' && monthlyData ? (
            /* 每日作業前格式 */
            <div className="min-w-max">
              <DailyInspectionTable 
                formData={monthlyData.form_data}
                monthlyData={monthlyData}
                schema={record.FormJson || (monthlyData.schema_content ? JSON.parse(monthlyData.schema_content) : null)}
                record={record}
              />
            </div>
          ) : displayFormat === 'daily' && !monthlyData ? (
            /* 載入每日作業前格式中 */
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">正在載入每日作業前格式資料...</p>
            </div>
          ) : (
            /* 一般格式 */
            <>
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
                                    value={improvementData[item.itemId]?.improvementAction || item.improvementAction || ''}
                                    onChange={(e) => updateImprovementData(item.itemId, 'improvementAction', e.target.value)}
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
                                      value={improvementData[item.itemId]?.plannedDate || item.plannedDate || ''}
                                      onChange={(e) => updateImprovementData(item.itemId, 'plannedDate', e.target.value)}
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
                                      value={improvementData[item.itemId]?.actualDate || item.actualDate || ''}
                                      onChange={(e) => updateImprovementData(item.itemId, 'actualDate', e.target.value)}
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
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between items-center">
          {/* 保存改善措施按鈕 - 僅在非查看模式且有改善措施資料時顯示 */}
          {!viewMode && Object.keys(improvementData).length > 0 && (
            <button
              onClick={saveImprovementData}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>保存改善措施</span>
            </button>
          )}
          
          <div className="flex space-x-3">
          {/* 列印按鈕 - 只在每日作業前格式時顯示 */}
          {displayFormat === 'daily' && (
            <button
              // 替換原本的列印按鈕 onClick 事件處理程序
              onClick={async () => {
                const printContent = document.querySelector('.forprint');
                if (printContent) {
                  // 獲取當前日期作為浮水印日期
                  const checkDate = new Date().toISOString().split('T')[0];
                  
                  let watermarkImageUrl = '';
                  try {
                    // 調用後端API生成浮水印
                    const response = await fetch('http://localhost:3001/api/watermark/generate', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ checkDate })
                    });
                    
                    if (response.ok) {
                      const blob = await response.blob();
                      watermarkImageUrl = URL.createObjectURL(blob);
                    }
                  } catch (error) {
                    console.error('生成浮水印失敗:', error);
                  }
                  
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>巡檢記錄列印</title>
                      <style>
                        /* 頁面設定 - A4 橫向 */
                        @page {
                          size: A4 landscape;
                          margin: 10mm 5mm 10mm 5mm;
                        }
                        
                        @media print {
                          body {
                            margin: 0;
                            padding: 0;
                          }
                        }
                        
                        * {
                          box-sizing: border-box;
                          margin: 0;
                          padding: 0;
                        }
                        
                        body {
                          font-family: '微軟正黑體', 'Microsoft JhengHei', 'Arial', sans-serif;
                          background: white;
                          margin: 0;
                          padding: 0;
                        }
                        
                        /* 主容器 - 不使用縮放 */
                        .print-wrapper {
                          width: 100%;
                          padding: 5px;
                        }
                        
                        /* 標題樣式 */
                        .title {
                          text-align: center;
                          font-size: 14pt;
                          font-weight: bold;
                          color: #7c3aed;
                          margin-bottom: 25px;
                        }
                        
                        /* 標題區域 - 確保足夠間距 */
                        .forprint .mb-8 {
                          margin-bottom: 25px !important;
                        }
                        
                        /* 表頭信息 */
                        .header-info {
                          color: #7c3aed;
                          margin-bottom: 20px;
                          font-size: 10pt;
                        }
                        
                        .header-row {
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          margin-bottom: 12px;
                        }
                        
                        /* 表頭信息區域間距 */
                        .forprint .mb-6 {
                          margin-bottom: 20px !important;
                        }
                        
                        .forprint .mb-6 > .mb-6 {
                          margin-bottom: 15px !important;
                        }
                        
                        .header-row .black-text {
                          color: black;
                          font-weight: normal;
                        }
                        
                        /* 表格樣式 - 調整為適合 A4 橫向的大小 */
                        table {
                          width: 100%;
                          border-collapse: collapse;
                          border: 2px solid #3b82f6;
                          font-size: 8pt;
                          margin-top: 15px;
                          margin-bottom: 15px;
                        }
                        
                        th, td {
                          border: 1px solid #3b82f6;
                          padding: 2px;
                          text-align: center;
                          vertical-align: middle;
                        }
                        
                        /* 項次欄 */
                        .item-number {
                          width: 25px;
                          font-weight: bold;
                        }
                        
                        /* 檢查項目欄 */
                        .category-header {
                          width: 40px;
                          font-weight: bold;
                          writing-mode: vertical-rl;
                          text-orientation: mixed;
                          background-color: #eff6ff;
                          padding: 4px 2px;
                        }
                        
                        /* 檢查項目子項 */
                        .item-cell {
                          text-align: left;
                          padding-left: 5px;
                          min-width: 150px;
                          font-size: 7.5pt;
                        }
                        
                        /* 檢查基準欄 */
                        .standard-cell {
                          text-align: left;
                          padding: 2px 4px;
                          min-width: 100px;
                          font-size: 7.5pt;
                        }
                        
                        /* 檢查方法欄 */
                        .method-cell {
                          width: 35px;
                          writing-mode: vertical-rl;
                          text-orientation: mixed;
                          font-size: 7.5pt;
                          padding: 4px 2px;
                        }
                        
                        /* 日期標題列 */
                        .date-header {
                          background-color: #eff6ff;
                          font-weight: bold;
                          font-size: 8pt;
                          padding: 3px 1px;
                        }
                        
                        /* 日期欄位 */
                        .date-cell {
                          width: 20px;
                          min-width: 20px;
                          max-width: 20px;
                          font-size: 7pt;
                          padding: 1px;
                          background-color: #fffef0;
                        }
                        
                        /* 檢查結果格 - V 或 X */
                        .result-cell {
                          font-size: 8pt;
                          font-weight: bold;
                          color: green;
                          padding: 1px;
                        }
                        
                        .result-cell.error {
                          color: red;
                        }
                        
                        /* 本日未巡檢 - 垂直文字 */
                        .not-inspected {
                          writing-mode: vertical-rl;
                          text-orientation: mixed;
                          color: #999;
                          font-size: 6pt;
                          letter-spacing: -1px;
                          line-height: 1;
                        }
                        
                        /* 檢查員列 */
                        .inspector-row td {
                          height: 35px;
                          vertical-align: middle;
                        }
                        
                        .inspector-cell {
                          writing-mode: vertical-rl;
                          text-orientation: mixed;
                          font-size: 9pt;
                          font-weight: bold;
                        }
                        
                        /* 異常說明列 */
                        .note-row td {
                          background-color: #fef3c7;
                          text-align: left;
                          padding: 4px 6px;
                          font-size: 8pt;
                          min-height: 25px;
                        }
                        
                        .note-label {
                          font-weight: bold;
                          color: #92400e;
                        }
                        
                        /* 備註區域 */
                        .remarks-section {
                          margin-top: 8px;
                          padding: 5px;
                          background-color: #f9fafb;
                          border: 1px solid #d1d5db;
                          border-radius: 4px;
                        }
                        
                        .remarks-title {
                          font-weight: bold;
                          font-size: 9pt;
                          margin-bottom: 4px;
                        }
                        
                        .remarks-content {
                          font-size: 8pt;
                          line-height: 1.4;
                          color: #4b5563;
                        }
                        
                        /* 主管簽核 */
                        .supervisor-section {
                          margin-top: 10px;
                          text-align: center;
                          font-size: 10pt;
                          font-weight: bold;
                          padding-right: 15%;
                        }
                        
                        /* 控制螢幕顯示和列印顯示 */
                        .screen-only {
                          display: block;
                        }
                        
                        .print-only {
                          display: none !important;
                        }
                        
                        @media print {
                          .screen-only {
                            display: none !important;
                          }
                          
                          .print-only {
                            display: flex !important;
                            margin-top: 15px !important;
                          }
                        }
                        
                        /* 浮水印樣式 */
                        .watermark {
                          position: fixed;
                          bottom: 20px;
                          right: 20px;
                          width: 150px;
                          height: auto;
                          opacity: 0.8;
                          z-index: 1000;
                          pointer-events: none;
                        }
                        
                        /* 防止分頁 */
                        .no-page-break {
                          page-break-inside: avoid;
                        }
                        
                        /* 隱藏原始的 transform 樣式 */
                        .forprint > * {
                          transform: none !important;
                          width: 100% !important;
                          height: auto !important;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="print-wrapper no-page-break">
                        ${printContent.innerHTML}
                        ${watermarkImageUrl ? `<img src="${watermarkImageUrl}" class="watermark" alt="浮水印" />` : ''}
                      </div>
                      <script>
                        // 移除原始的內聯樣式，避免衝突
                        window.onload = function() {
                          // 清理所有元素的 transform 樣式
                          const allElements = document.querySelectorAll('*');
                          allElements.forEach(el => {
                            if (el.style.transform) {
                              el.style.transform = 'none';
                            }
                            if (el.style.width && el.style.width.includes('%') && parseFloat(el.style.width) > 100) {
                              el.style.width = '100%';
                            }
                          });
                          
                          // 調整表格以適應頁面
                          const tables = document.querySelectorAll('table');
                          tables.forEach(table => {
                            table.style.width = '100%';
                            table.style.fontSize = '8pt';
                          });
                          
                          // 確保日期欄位寬度一致
                          const dateCells = document.querySelectorAll('.date-cell');
                          dateCells.forEach(cell => {
                            cell.style.width = '20px';
                            cell.style.maxWidth = '20px';
                            cell.style.minWidth = '20px';
                          });
                          
                          // 延遲列印，確保樣式套用完成
                          setTimeout(() => {
                            window.print();
                            window.addEventListener('afterprint', function() {
                              setTimeout(() => {
                                window.close();
                                // 清理浮水印URL
                                if (watermarkImageUrl) {
                                  URL.revokeObjectURL(watermarkImageUrl);
                                }
                              }, 100);
                            });
                          }, 500);
                        };
                      </script>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                  
                  // 在主窗口也清理URL（以防萬一）
                  if (watermarkImageUrl) {
                    setTimeout(() => {
                      URL.revokeObjectURL(watermarkImageUrl);
                    }, 2000);
                  }
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>列印</span>
            </button>
          )}
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
    </div>
  );
}

export default InspectionModal;
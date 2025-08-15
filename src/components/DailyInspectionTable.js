import React from 'react';

function DailyInspectionTable({ formData, monthlyData, schema, record }) {
  if (!formData || !monthlyData) {
    return (
      <div className="text-center py-8 text-gray-500">
        載入中...
      </div>
    );
  }

  // 解析 schema 建立檢查項目結構
  const buildInspectionStructure = (elements) => {
    const structure = [];
    
    if (!Array.isArray(elements)) {
      return structure;
    }
    
    const processElement = (element, mainCategoryIndex) => {
      if (element.ElmentType === "Div" && element.Elements) {
        const category = {
          categoryIndex: mainCategoryIndex,
          categoryName: element.Name,
          subItems: []
        };
        
        element.Elements.forEach((subElement, subIndex) => {
          if (subElement.ElmentType === "Div" && subElement.Elements) {
            // 子分類包含檢查項目
            subElement.Elements.forEach((itemElement) => {
              if (itemElement.ElmentType === "Item" && itemElement.ItemId) {
                category.subItems.push({
                  itemId: itemElement.ItemId,
                  name: subElement.Name,
                  description: itemElement.Description || '',
                  method: itemElement.Description || '檢視'
                });
              }
            });
          } else if (subElement.ElmentType === "Item" && subElement.ItemId) {
            // 直接的檢查項目
            category.subItems.push({
              itemId: subElement.ItemId,
              name: subElement.Name || `檢查項目 ${subElement.ItemId}`,
              description: subElement.Description || '',
              method: subElement.Description || '檢視'
            });
          }
        });
        
        structure.push(category);
      }
    };
    
    elements.forEach((element, index) => {
      processElement(element, index + 1);
    });
    
    return structure;
  };

  const inspectionStructure = buildInspectionStructure(schema?.Elements || []);

  // 獲取指定日期的檢查結果
  const getResultForDate = (itemId, day) => {
    // 根據狀態返回檢查結果
    const dayStatus = monthlyData.daily_data?.daily_status?.[day];
    
    if (dayStatus === '本日已巡檢') {
      // 對於已巡檢的日期，返回 'V' 表示正常
      // TODO: 實際應該從每日記錄中獲取具體的檢查結果
      return 'V';
    } else if (dayStatus === '今日未使用') {
      return ''; // 空白表示未使用
    } else {
      return ''; // 空白表示未巡檢
    }
  };

  // 獲取指定日期的檢查人員
  const getInspectorForDate = (day) => {
    if (monthlyData.daily_data?.daily_inspector?.[day]) {
      const inspector = monthlyData.daily_data.daily_inspector[day];
      // 將檢查人員名字豎直排列
      return inspector.split('').join('\n');
    }
    return '';
  };

  // 生成日期列標題
  const generateDateHeaders = () => {
    const daysInMonth = monthlyData.daily_data?.days_in_month || 31;
    const headers = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      headers.push(
        <th key={day} style={{backgroundColor: 'lightyellow'}} className="border border-blue-500 px-1 py-2 text-center text-sm date-header">
          {day}
        </th>
      );
    }
    
    return headers;
  };

  // 生成檢查結果列（支持縱向合併）
  const generateResultCells = (itemId, isFirstRow) => {
    const daysInMonth = monthlyData.daily_data?.days_in_month || 31;
    const cells = [];
    const mergeInfo = calculateStatusMerging();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const result = getResultForDate(itemId, day);
      const dayMergeInfo = mergeInfo[day];
      
      if (dayMergeInfo.showInFirstRow && isFirstRow) {
        // 在第一行顯示狀態並設置 rowSpan
        cells.push(
          <td 
            key={day} 
            rowSpan={dayMergeInfo.rowSpan}
            className="border border-blue-500 px-1 py-2 text-center text-sm"
            style={{backgroundColor: '#fef2f2'}}
          >
            <div className="flex flex-col items-center">
              <div>{result}</div>
              <div className="text-xs text-red-600 font-medium mt-1" style={{fontSize: '10px', whiteSpace: 'pre-line'}}>
                {dayMergeInfo.status.split('').join('\n')}
              </div>
            </div>
          </td>
        );
      } else if (dayMergeInfo.showInFirstRow && !isFirstRow) {
        // 其他行不顯示此欄位（已被合併）
        continue;
      } else {
        // 正常顯示
        cells.push(
          <td key={day} className="border border-blue-500 px-1 py-2 text-center text-sm">
            {result}
          </td>
        );
      }
    }
    
    return cells;
  };

  // 計算每一日期欄位的狀態合併資訊
  const calculateStatusMerging = () => {
    const daysInMonth = monthlyData.daily_data?.days_in_month || 31;
    const dailyStatus = monthlyData.daily_data?.daily_status || [];
    const totalRows = inspectionStructure.reduce((sum, category) => sum + category.subItems.length, 0);
    
    const mergeInfo = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStatus = dailyStatus[day] || '';
      const shouldShowStatus = dayStatus === '本日未巡檢' || dayStatus === '今日未使用';
      
      if (shouldShowStatus) {
        // 如果需要顯示狀態，則在第一行顯示並合併所有行
        mergeInfo[day] = {
          status: dayStatus,
          rowSpan: totalRows,
          showInFirstRow: true
        };
      } else {
        mergeInfo[day] = {
          status: '',
          rowSpan: 1,
          showInFirstRow: false
        };
      }
    }
    
    return mergeInfo;
  };

  // 生成檢查人員行
  const generateInspectorRow = () => {
    const daysInMonth = monthlyData.daily_data?.days_in_month || 31;
    const cells = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const inspector = getInspectorForDate(day);
      cells.push(
        <td key={day} className="border border-blue-500 px-1 py-2 text-center text-xs" style={{height: '60px', whiteSpace: 'pre-line'}}>
          {inspector}
        </td>
      );
    }
    
    return cells;
  };

  // 獲取去重的主管名單
  const getUniqueReviewers = () => {
    if (!monthlyData.daily_data?.daily_reviewer) {
      return '';
    }
    
    const allReviewers = [];
    const daysInMonth = monthlyData.daily_data?.days_in_month || 31;
    
    // 收集所有主管名稱
    for (let day = 1; day <= daysInMonth; day++) {
      const reviewer = monthlyData.daily_data.daily_reviewer[day];
      if (reviewer && reviewer.trim()) {
        // 分割可能包含多個名字的字符串（用空格或其他分隔符）
        const names = reviewer.split(/\s+/).filter(name => name.trim());
        allReviewers.push(...names);
      }
    }
    
    // 去重並排序
    const uniqueReviewers = [...new Set(allReviewers)];
    return uniqueReviewers.join('、');
  };


  return (
    <>
      
      <div className="overflow-auto w-full" style={{maxHeight: '80vh'}}>
        <div className="forprint p-4 bg-white min-w-max">
        {/* 標題 */}
        <div className="text-center text-2xl font-bold text-purple-700 mb-4">
          {/* 從 DisplayName 中提取前半部分作為標題 */}
          {(() => {
            const displayName = record?.DisplayName || formData.form_title || '';
            
            // 如果包含"—"，取前半部分
            if (displayName.includes('—')) {
              const parts = displayName.split('—');
              return parts[0].trim();
            }
            
            // 如果包含"每日作業前"，移除後面的部分
            if (displayName.includes('每日作業前')) {
              return displayName.replace(/每日作業前.*$/, '').trim();
            }
            
            // 移除末尾的數字
            return displayName.replace(/\d+$/, '').trim();
          })()}—每日作業前
        </div>
        
        {/* 表頭信息 */}
        <div className="text-purple-700 mb-4">
          <div className="mb-2">
            檢查表代號(表單編號)：<span className="text-black">{formData.form_code}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="inline-block">
              廠別：<span className="text-black">{formData.factory}</span>
            </div>
            <div className="inline-block text-center">
              設備編號：<span className="text-black">{record?.RouteName || `路線${record?.RouteId || '未知'}`}</span>
            </div>
            <div className="inline-block">
              <span className="text-black">{formData.year_month_display}</span>
            </div>
          </div>
        </div>

        {/* 檢查表格 */}
        <table className="w-full border-2 border-blue-500 daily-table" style={{borderCollapse: 'collapse', minWidth: '1200px'}}>
          <tbody>
            {/* 表頭 */}
            <tr>
              <th rowSpan="2" className="border border-blue-500 px-2 py-2 text-center font-bold">項<br/>次</th>
              <th rowSpan="2" className="border border-blue-500 px-2 py-2 text-center font-bold">檢查項目</th>
              <th rowSpan="2" className="border border-blue-500 px-2 py-2 text-center font-bold" style={{width: '200px'}}>檢查基準</th>
              <th rowSpan="2" className="border border-blue-500 px-2 py-2 text-center font-bold">檢查<br/>方法</th>
              <th colSpan={monthlyData.daily_data?.days_in_month || 31} className="border border-blue-500 px-2 py-2 text-center font-bold">
                檢查日期及檢查結果
              </th>
            </tr>
            <tr>
              {generateDateHeaders()}
            </tr>

            {/* 檢查項目行 */}
            {(() => {
              let globalRowIndex = 0;
              return inspectionStructure.map((category) => 
                category.subItems.map((item, itemIndex) => {
                  const isFirstRow = globalRowIndex === 0;
                  globalRowIndex++;
                  
                  return (
                    <tr key={`${category.categoryIndex}-${itemIndex}`}>
                      {itemIndex === 0 && (
                        <td 
                          rowSpan={category.subItems.length} 
                          className="border border-blue-500 px-2 py-4 text-center font-bold align-middle"
                        >
                          {category.categoryIndex}
                        </td>
                      )}
                      {itemIndex === 0 && (
                        <td 
                          rowSpan={category.subItems.length} 
                          className="border border-blue-500 px-2 py-4 text-center font-bold align-middle"
                        >
                          {category.categoryName}
                        </td>
                      )}
                      <td className="border border-blue-500 px-2 py-2 text-left text-sm">
                        {item.name}
                      </td>
                      <td className="border border-blue-500 px-2 py-2 text-center text-sm">
                        {item.method}
                      </td>
                      {generateResultCells(item.itemId, isFirstRow)}
                    </tr>
                  );
                })
              );
            })()}

            {/* 檢查人員行 */}
            <tr>
              <td colSpan="4" className="border border-blue-500 px-2 py-2 text-center font-bold">
                檢查人員
              </td>
              {generateInspectorRow()}
            </tr>

            {/* 異常事項說明行 */}
            <tr>
              <td colSpan="2" className="border border-blue-500 px-2 py-2 text-center font-bold">
                異常事項說明
              </td>
              <td 
                colSpan={3 + (monthlyData.daily_data?.days_in_month || 31)} 
                className="border border-blue-500 px-2 py-4 text-left bg-green-100"
                style={{minHeight: '60px'}}
              >
                {monthlyData.abnormal_items?.map(item => 
                  item.replace(/\(\(/g, '(').replace(/\)\)/g, ')')
                ).join('；') || ''}
              </td>
            </tr>

            {/* 異常改善措施行 */}
            <tr>
              <td colSpan="2" className="border border-blue-500 px-2 py-2 text-center font-bold">
                異常改善措施
              </td>
              <td 
                colSpan={3 + (monthlyData.daily_data?.days_in_month || 31)} 
                className="border border-blue-500 px-2 py-4 text-left bg-green-100"
                style={{minHeight: '60px'}}
              >
                {monthlyData.improvement_measures?.map(item => 
                  item.replace(/\(\(/g, '(').replace(/\)\)/g, ')')
                ).join('；') || ''}
              </td>
            </tr>

            {/* 備註行 */}
            <tr>
              <td colSpan="2" className="border border-blue-500 px-2 py-2 text-center font-bold">
                備註
              </td>
              <td colSpan={3 + (monthlyData.daily_data?.days_in_month || 31)} className="border border-blue-500 px-2 py-2 text-left text-sm">
                1.檢查結果應詳實記錄：正常(V)、異常(X)，並於「異常結果說明」欄記錄原因及「異常改善措施」欄記錄改善措施。<br/>
                2.本記錄表應保存三年。
              </td>
            </tr>
          </tbody>
        </table>

        {/* 主管簽核區域 */}
        <div className="mt-4" style={{
          display: 'grid', 
          gridTemplate: 'auto auto auto 1fr / 0.5fr 20% 20% 20% 20% 0.5fr', 
          textAlign: 'center'
        }}>
          <div style={{gridRow: '1/2', gridColumn: '3/4'}} className="text-center font-medium">
            主管：{getUniqueReviewers()}
          </div>
        </div>

        </div>
      </div>
    </>
  );
}

export default DailyInspectionTable;